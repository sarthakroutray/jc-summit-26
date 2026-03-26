import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  let body: { question_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question_id } = body;
  if (!question_id) {
    return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
  }

  if (!UUID_RE.test(question_id)) {
    return NextResponse.json({ error: 'Invalid question_id format' }, { status: 400 });
  }

  const { data, error: actErr } = await supabase.rpc('activate_question', {
    p_question_id: question_id,
  });

  if (actErr) {
    if (actErr.message === 'QUESTION_NOT_FOUND') {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isMissingRpc =
      actErr.code === '42883' ||
      /function\s+activate_question/i.test(actErr.message || '') ||
      /Could not find the function/i.test(actErr.message || '');

    if (!isMissingRpc) {
      console.error('activate_question rpc failed', actErr);
      return NextResponse.json({ error: 'Failed to activate question' }, { status: 500 });
    }

    // Fallback path when the RPC has not been applied in the DB yet.
    const { data: target, error: targetErr } = await supabase
      .from('questions')
      .select('id, text, is_active, created_at')
      .eq('id', question_id)
      .maybeSingle();

    if (targetErr) {
      console.error('activate fallback lookup failed', targetErr);
      return NextResponse.json({ error: 'Failed to activate question' }, { status: 500 });
    }

    if (!target) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const { error: clearErr } = await supabase
      .from('questions')
      .update({ is_active: false })
      .eq('is_active', true);

    if (clearErr) {
      console.error('activate fallback clear failed', clearErr);
      return NextResponse.json({ error: 'Failed to activate question' }, { status: 500 });
    }

    const { data: updatedQuestion, error: setErr } = await supabase
      .from('questions')
      .update({ is_active: true })
      .eq('id', question_id)
      .select('id, text, is_active, created_at')
      .single();

    if (setErr) {
      if (setErr.code === '23505') {
        return NextResponse.json({ error: 'Another question is already active' }, { status: 409 });
      }
      console.error('activate fallback set failed', setErr);
      return NextResponse.json({ error: 'Failed to activate question' }, { status: 500 });
    }

    return NextResponse.json({ success: true, question: updatedQuestion });
  }

  const question = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ success: true, question: question ?? null });
}
