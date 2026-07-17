import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { JWT_SECRET, JWT_EXPIRES, authenticate, logActivity } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)'
    ).run(username, email, password_hash, full_name || '');

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const user = db.prepare('SELECT id, username, email, full_name, role FROM users WHERE id = ?').get(result.lastInsertRowid);

    logActivity(result.lastInsertRowid, 'register', 'user', result.lastInsertRowid, `User ${username} registered`);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    logActivity(user.id, 'login', 'user', user.id, 'User logged in');

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.put('/me', authenticate, (req, res) => {
  try {
    const { full_name, email } = req.body;
    db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?')
      .run(full_name || null, email || null, req.user.id);
    const user = db.prepare('SELECT id, username, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed.' });
  }
});

export default router;
