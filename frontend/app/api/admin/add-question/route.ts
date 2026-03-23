import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  let body: { text?: string; options?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, options } = body;

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }

  const validOptions = (options ?? []).map(o => o.trim()).filter(Boolean);
  if (validOptions.length < 2) {
    return NextResponse.json({ error: 'At least 2 non-empty options are required' }, { status: 400 });
  }

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert({ text: text.trim(), is_active: false })
    .select()
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: qErr?.message || 'Failed to create question' }, { status: 500 });
  }

  const optionRows = validOptions.map(optText => ({
    question_id: question.id,
    text: optText,
    vote_count: 0,
  }));

  const { data: insertedOptions, error: oErr } = await supabase
    .from('options')
    .insert(optionRows)
    .select();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  return NextResponse.json({ success: true, question, options: insertedOptions });
}
