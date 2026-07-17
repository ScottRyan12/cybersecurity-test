import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;
    let query = 'SELECT t.*, u.username as created_by_name FROM targets t LEFT JOIN users u ON t.created_by = u.id WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (t.name LIKE ? OR t.address LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    const countQuery = query.replace('SELECT t.*, u.username as created_by_name', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const targets = db.prepare(query).all(...params);
    res.json({ targets, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch targets.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const target = db.prepare(
      'SELECT t.*, u.username as created_by_name FROM targets t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = ?'
    ).get(req.params.id);
    if (!target) return res.status(404).json({ error: 'Target not found.' });

    const engagements = db.prepare(
      'SELECT * FROM engagements WHERE target_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    const vulnerabilities = db.prepare(
      'SELECT v.*, u.username as found_by_name FROM vulnerabilities v LEFT JOIN users u ON v.found_by = u.id WHERE v.target_id = ? ORDER BY CASE v.severity WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 WHEN \'low\' THEN 4 ELSE 5 END'
    ).all(req.params.id);

    res.json({ target, engagements, vulnerabilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch target.' });
  }
});

router.post('/', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const { name, type, address, port_range, os_info, description, tags } = req.body;
    if (!name || !type || !address) {
      return res.status(400).json({ error: 'Name, type, and address are required.' });
    }

    const result = db.prepare(
      'INSERT INTO targets (name, type, address, port_range, os_info, description, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, type, address, port_range || '', os_info || '', description || '', JSON.stringify(tags || []), req.user.id);

    const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(result.lastInsertRowid);
    logActivity(req.user.id, 'create', 'target', target.id, `Created target: ${name}`);
    res.status(201).json({ target });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create target.' });
  }
});

router.put('/:id', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM targets WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Target not found.' });

    const { name, type, address, port_range, os_info, description, tags } = req.body;
    db.prepare(
      `UPDATE targets SET name = COALESCE(?, name), type = COALESCE(?, type), address = COALESCE(?, address), port_range = COALESCE(?, port_range), os_info = COALESCE(?, os_info), description = COALESCE(?, description), tags = COALESCE(?, tags), updated_at = datetime('now') WHERE id = ?`
    ).run(name || null, type || null, address || null, port_range ?? null, os_info ?? null, description ?? null, tags ? JSON.stringify(tags) : null, req.params.id);

    const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(req.params.id);
    logActivity(req.user.id, 'update', 'target', target.id, `Updated target: ${target.name}`);
    res.json({ target });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update target.' });
  }
});

router.delete('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'Target not found.' });

    const hasEngagements = db.prepare('SELECT COUNT(*) as count FROM engagements WHERE target_id = ?').get(req.params.id);
    if (hasEngagements.count > 0) {
      return res.status(400).json({ error: 'Cannot delete target with existing engagements.' });
    }

    db.prepare('DELETE FROM targets WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'delete', 'target', req.params.id, `Deleted target: ${target.name}`);
    res.json({ message: 'Target deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete target.' });
  }
});

export default router;
