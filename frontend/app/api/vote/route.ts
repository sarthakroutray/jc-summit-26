import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let body: { question_id?: string; option_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question_id, option_id } = body;

  if (!question_id || !option_id) {
    return NextResponse.json({ error: 'question_id and option_id are required' }, { status: 400 });
  }

  if (!UUID_RE.test(question_id) || !UUID_RE.test(option_id)) {
    return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
  }

  // Verify the JWT to get the user UUID
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const user_id = user.id; // Anonymous Supabase UUID

  // Single atomic DB operation: validates active question + option ownership,
  // inserts vote, and increments vote_count in one transaction scope.
  const { error: voteErr } = await supabase.rpc('cast_vote', {
    p_question_id: question_id,
    p_option_id: option_id,
    p_user_id: user_id,
  });

  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json({ error: 'You have already voted' }, { status: 409 });
    }

    if (voteErr.message === 'QUESTION_NOT_ACTIVE') {
      return NextResponse.json({ error: 'Question is not active' }, { status: 400 });
    }

    if (voteErr.message === 'INVALID_OPTION') {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    console.error('cast_vote rpc failed', voteErr);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
