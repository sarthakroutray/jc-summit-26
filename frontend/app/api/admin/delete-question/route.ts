import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

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
  if (!question_id) return NextResponse.json({ error: 'question_id is required' }, { status: 400 });

  // The database migration includes ON DELETE CASCADE, so this also deletes options and votes safely
  const { error } = await supabase.from('questions').delete().eq('id', question_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
