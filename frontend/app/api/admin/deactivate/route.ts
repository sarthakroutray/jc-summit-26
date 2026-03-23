import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  // Deactivate all questions to clear the active session
  const { error } = await supabase
    .from('questions')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
