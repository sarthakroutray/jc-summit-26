import { Router } from 'express';
import { supabase } from '../db/supabase';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// GET /api/sessions
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions
router.post('/', adminAuth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  // Deactivate all other sessions
  await supabase.from('sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('sessions')
    .insert({ title, is_active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
