import Router from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();
const SALT_ROUNDS = 12; // how strong the password hash is

// -------------------------------------------------------
// GET /api/users — get all users (never return passwords)
// -------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_name, user_email, created_at, updated_at FROM users'
    );
    res.json(rows);
  } catch (err) {
    console.error("Users API Error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// -------------------------------------------------------
// GET /api/users/:id — get one user by id
// -------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, user_name, user_email, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Users API Error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// -------------------------------------------------------
// POST /api/users — create a new user
// -------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  const { user_name, user_email, password } = req.body;

  if (!user_name || !user_email || !password) {
    res.status(400).json({ error: 'User name, email and password are required' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result]: any = await pool.query(
      'INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)',
      [user_name, user_email, hashedPassword]
    );

    res.status(201).json({
      id: result.insertId,
      user_name,
      user_email,
    });
  } catch (err: any) {
    // MySQL error 1062 = duplicate entry (email already exists)
    if (err.errno === 1062) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    res.status(500).json({ error: String(err) });
  }
});

// -------------------------------------------------------
// PUT /api/users/:id — update a user
// -------------------------------------------------------
router.put('/:id', async (req: Request, res: Response) => {
  const { user_name, user_email, password } = req.body;

  if (!user_name && !user_email && !password) {
    res.status(400).json({ error: 'Provide at least one field to update' });
    return;
  }

  try {
    // Build query dynamically based on what fields were sent
    const fields: string[] = [];
    const values: any[] = [];

    if (user_name) { fields.push('user_name = ?'); values.push(user_name); }
    if (user_email) { fields.push('user_email = ?'); values.push(user_email); }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push('user_password = ?');
      values.push(hashedPassword);
    }

    values.push(req.params.id); // for the WHERE clause

    const [result]: any = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    if (err.errno === 1062) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    res.status(500).json({ error: String(err) });
  }
});

// -------------------------------------------------------
// DELETE /api/users/:id — delete a user
// -------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error("Users API Error:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;