import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  // Find the active question
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  if (!question) {
    return NextResponse.json({ question: null, options: [] });
  }

  // Get options with vote_count
  const { data: options, error: oErr } = await supabase
    .from('options')
    .select('*')
    .eq('question_id', question.id)
    .order('vote_count', { ascending: false });

  if (oErr) {
    return NextResponse.json({ error: oErr.message }, { status: 500 });
  }

  return NextResponse.json({ question, options: options || [] });
}
