import Router from 'express';
import pool from '../db.js';

const router = Router();

// Example route that queries the database
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;