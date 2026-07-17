import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    ).all();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/', (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) return res.status(409).json({ error: 'Username or email already exists.' });

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
    ).run(username, email, password_hash, full_name || '', role || 'tester');

    const user = db.prepare('SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?').get(result.lastInsertRowid);
    logActivity(req.user.id, 'create', 'user', user.id, `Created user: ${username}`);
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    const { full_name, email, role, is_active, password } = req.body;

    if (password) {
      const password_hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, req.params.id);
    }

    db.prepare(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?'
    ).run(full_name || null, email || null, role || null, is_active ?? null, req.params.id);

    const user = db.prepare('SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?').get(req.params.id);
    logActivity(req.user.id, 'update', 'user', user.id, `Updated user: ${user.username}`);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' });

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'delete', 'user', req.params.id, `Deleted user: ${user.username}`);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
