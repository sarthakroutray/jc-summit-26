import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyAdmin } from '../../../../lib/adminAuth';

async function ensurePollingRow() {
  const { data: existing, error } = await supabase
    .from('polling_config')
    .select('id, enabled, updated_at')
    .eq('id', 1)
    .maybeSingle();

  if (!error && existing) return existing;

  const { data: inserted, error: insertErr } = await supabase
    .from('polling_config')
    .upsert({ id: 1, enabled: true }, { onConflict: 'id' })
    .select('id, enabled, updated_at')
    .single();

  if (insertErr || !inserted) {
    throw new Error(insertErr?.message || 'Failed to initialize polling_config');
  }

  return inserted;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const row = await ensurePollingRow();
    return NextResponse.json({ enabled: !!row.enabled, updated_at: row.updated_at });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch polling status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdmin(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  let body: { enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('polling_config')
    .upsert({ id: 1, enabled: body.enabled }, { onConflict: 'id' })
    .select('enabled, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to update polling status' }, { status: 500 });
  }

  return NextResponse.json({ success: true, enabled: !!data.enabled, updated_at: data.updated_at });
}
