-- ============================================================
-- JC Summit — Polling-Based Voting System
-- Complete Database Migration
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ── 1. Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── 2. Clean up (safe to re-run) ────────────────────────────
DROP TABLE IF EXISTS votes   CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS polling_config CASCADE;


-- ── 3. Admin Users Table ─────────────────────────────────────
-- Links a Supabase Auth user (auth.users) to the admin role.
-- After creating your Supabase Auth user via the dashboard,
-- insert their UUID here to grant admin access.
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE admin_users IS
  'Supabase Auth users who are allowed to manage questions.';


-- ── 3b. Polling Config Table ───────────────────────────────
-- Single-row table controlling whether clients should use
-- high-frequency polling or bandwidth-saving idle polling.
CREATE TABLE polling_config (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  enabled    BOOLEAN     NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO polling_config (id, enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;


-- ── 4. Questions Table ───────────────────────────────────────
CREATE TABLE questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  is_active  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN questions.is_active IS
  'Only one question should be active at a time. Enforced at the API layer.';


-- ── 5. Options Table ─────────────────────────────────────────
CREATE TABLE options (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT    NOT NULL CHECK (char_length(text) BETWEEN 1 AND 200),
  vote_count  INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0)
);


-- ── 6. Votes Table ───────────────────────────────────────────
CREATE TABLE votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id   UUID        NOT NULL REFERENCES options(id)   ON DELETE CASCADE,
  user_id     TEXT        NOT NULL CHECK (char_length(user_id) > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One vote per user per question
  CONSTRAINT votes_user_question_unique UNIQUE (user_id, question_id)
);

COMMENT ON COLUMN votes.user_id IS
  'Client-generated UUID stored in localStorage. Not a Supabase auth user.';


-- ── 7. Indexes ───────────────────────────────────────────────
-- Fast look-up of active question
CREATE INDEX idx_questions_is_active   ON questions(is_active) WHERE is_active = true;

-- Hard guarantee: only one active question at a time
CREATE UNIQUE INDEX one_active_question
  ON questions ((is_active))
  WHERE is_active = true;

-- Fast vote and option lookups per question
CREATE INDEX idx_votes_question_id     ON votes(question_id);
CREATE INDEX idx_options_question_id   ON options(question_id);

-- Fast per-option and per-user lookups
CREATE INDEX idx_votes_option_id       ON votes(option_id);
CREATE INDEX idx_votes_user_question   ON votes(user_id, question_id);


-- ── 8. Helper Function: increment_vote_count ─────────────────
-- Used by the /api/vote route to atomically increment vote_count.
-- This avoids read-modify-write races.
CREATE OR REPLACE FUNCTION increment_vote_count(opt_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE options
  SET    vote_count = vote_count + 1
  WHERE  id = opt_id;
$$;

COMMENT ON FUNCTION increment_vote_count IS
  'Atomically increments vote_count for a given option id.';


-- ── 8b. Atomic RPCs used by API routes ─────────────────────
CREATE OR REPLACE FUNCTION cast_vote(
  p_question_id UUID,
  p_option_id UUID,
  p_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM questions
    WHERE id = p_question_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'QUESTION_NOT_ACTIVE' USING errcode = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM options
    WHERE id = p_option_id
      AND question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'INVALID_OPTION' USING errcode = 'P0001';
  END IF;

  INSERT INTO votes (question_id, option_id, user_id)
  VALUES (p_question_id, p_option_id, p_user_id);

  UPDATE options
  SET vote_count = vote_count + 1
  WHERE id = p_option_id;
END;
$$;

COMMENT ON FUNCTION cast_vote IS
  'Atomically validate question/option, insert vote, and increment vote_count.';

CREATE OR REPLACE FUNCTION activate_question(p_question_id UUID)
RETURNS TABLE (
  id UUID,
  text TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM questions WHERE questions.id = p_question_id) THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND' USING errcode = 'P0001';
  END IF;

  UPDATE questions SET is_active = false WHERE is_active = true;
  UPDATE questions SET is_active = true WHERE questions.id = p_question_id;

  RETURN QUERY
  SELECT q.id, q.text, q.is_active, q.created_at
  FROM questions q
  WHERE q.id = p_question_id;
END;
$$;

COMMENT ON FUNCTION activate_question IS
  'Atomically deactivate all questions and activate one target question.';

CREATE OR REPLACE FUNCTION reset_votes_for_question(p_question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM questions WHERE questions.id = p_question_id) THEN
    RAISE EXCEPTION 'QUESTION_NOT_FOUND' USING errcode = 'P0001';
  END IF;

  DELETE FROM votes WHERE question_id = p_question_id;
  UPDATE options SET vote_count = 0 WHERE question_id = p_question_id;
END;
$$;

COMMENT ON FUNCTION reset_votes_for_question IS
  'Atomically delete votes and zero vote_count for one question.';


-- ── 9. Row-Level Security ────────────────────────────────────

ALTER TABLE questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_config ENABLE ROW LEVEL SECURITY;

-- ── Questions policies ───────────────────────────────────────
-- Anyone can read questions (public voting page uses the API)
CREATE POLICY "questions: public read"
  ON questions FOR SELECT
  USING (true);

-- Only admin users (authenticated, in admin_users table) can write
CREATE POLICY "questions: admin insert"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "questions: admin update"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "questions: admin delete"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ── Options policies ─────────────────────────────────────────
CREATE POLICY "options: public read"
  ON options FOR SELECT
  USING (true);

CREATE POLICY "options: admin insert"
  ON options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "options: admin update"
  ON options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "options: admin delete"
  ON options FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Allow the increment_vote_count function (service role) to update vote_count
-- The function runs as SECURITY DEFINER with service-role key, so it bypasses RLS.

-- ── Votes policies ───────────────────────────────────────────
-- Anyone can insert a vote (anonymous users via the voting page)
CREATE POLICY "votes: public insert"
  ON votes FOR INSERT
  WITH CHECK (true);

-- No-one can read individual votes (privacy)
-- vote_count on options is the source of truth for counts
CREATE POLICY "votes: no public read"
  ON votes FOR SELECT
  USING (false);

-- Admin can delete votes (for reset)
CREATE POLICY "votes: admin delete"
  ON votes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ── Admin users policies ─────────────────────────────────────
-- Only admins can see their own row in the admin_users table
CREATE POLICY "admin_users: self read"
  ON admin_users FOR SELECT
  TO authenticated
  USING ( id = auth.uid() );

-- ── Polling config policies ─────────────────────────────────
-- Public can read whether polling is enabled.
CREATE POLICY "polling_config: public read"
  ON polling_config FOR SELECT
  USING (true);

-- Only admins can update polling mode.
CREATE POLICY "polling_config: admin update"
  ON polling_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );


-- ── 10. Grant service-role bypass (used by API routes) ───────
-- Our Next.js API routes use SUPABASE_SERVICE_ROLE_KEY which
-- bypasses RLS entirely — the policies above only apply when
-- using the anon key or a JWT token from the browser.


-- ── 11. Seed: Grant your admin user ─────────────────────────
-- Replace '<YOUR_AUTH_USER_UUID>' with the UUID of the Supabase
-- Auth user you create for the admin (visible in Auth dashboard).
--
-- INSERT INTO admin_users (id) VALUES ('<YOUR_AUTH_USER_UUID>');


-- ── Done ─────────────────────────────────────────────────────
-- Tables: questions, options, votes, admin_users
-- Function: increment_vote_count(opt_id)
-- Indexes: 6 covering active question, votes, options
-- RLS: enabled on all tables with appropriate policies
