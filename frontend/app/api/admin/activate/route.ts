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
    if (actErr.code === '23505') {
      return NextResponse.json({ error: 'Another question is already active' }, { status: 409 });
    }
    console.error('activate_question rpc failed', actErr);
    return NextResponse.json({ error: 'Failed to activate question' }, { status: 500 });
  }

  const question = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ success: true, question: question ?? null });
}
