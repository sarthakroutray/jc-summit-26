import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

export async function GET(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const questionIds = (questions ?? []).map((q: any) => q.id);
  let allOptions: Record<string, any[]> = {};

  if (questionIds.length > 0) {
    const { data: options, error: oErr } = await supabase
      .from('options')
      .select('*')
      .in('question_id', questionIds)
      .order('text', { ascending: true });

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

    for (const opt of options ?? []) {
      if (!allOptions[opt.question_id]) allOptions[opt.question_id] = [];
      allOptions[opt.question_id].push(opt);
    }
  }

  const result = (questions ?? []).map((q: any) => ({
    ...q,
    options: allOptions[q.id] ?? [],
  }));

  return NextResponse.json(result);
}
