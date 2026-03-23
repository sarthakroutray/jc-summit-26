import { Router } from 'express';
import { supabase } from '../db/supabase';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// GET /api/questions?session_id=UUID
router.get('/', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', session_id)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/questions/:id  (soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase
    .from('questions')
    .update({ is_deleted: true })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
