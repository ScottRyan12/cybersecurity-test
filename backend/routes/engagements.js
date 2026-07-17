import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const { status, target_id, page = 1, limit = 20 } = req.query;
    let query = `SELECT e.*, t.name as target_name, t.address as target_address, u.username as created_by_name,
      (SELECT COUNT(*) FROM vulnerabilities WHERE engagement_id = e.id) as vuln_count,
      (SELECT COUNT(*) FROM vulnerabilities WHERE engagement_id = e.id AND severity = 'critical') as critical_count,
      (SELECT COUNT(*) FROM vulnerabilities WHERE engagement_id = e.id AND severity = 'high') as high_count
      FROM engagements e
      LEFT JOIN targets t ON e.target_id = t.id
      LEFT JOIN users u ON e.created_by = u.id WHERE 1=1`;
    const params = [];

    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (target_id) { query += ' AND e.target_id = ?'; params.push(target_id); }

    if (req.user.role === 'tester') {
      query += ' AND (e.created_by = ? OR e.id IN (SELECT engagement_id FROM engagement_testers WHERE user_id = ?))';
      params.push(req.user.id, req.user.id);
    }

    const countQuery = query.replace(/SELECT e\.\*.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const engagements = db.prepare(query).all(...params);

    for (const eng of engagements) {
      eng.testers = db.prepare(
        'SELECT u.id, u.username, u.full_name FROM engagement_testers et JOIN users u ON et.user_id = u.id WHERE et.engagement_id = ?'
      ).all(eng.id);
    }

    res.json({ engagements, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch engagements.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const engagement = db.prepare(
      `SELECT e.*, t.name as target_name, t.address as target_address, t.type as target_type,
       u.username as created_by_name FROM engagements e
       LEFT JOIN targets t ON e.target_id = t.id LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?`
    ).get(req.params.id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found.' });

    engagement.testers = db.prepare(
      'SELECT u.id, u.username, u.full_name, u.role FROM engagement_testers et JOIN users u ON et.user_id = u.id WHERE et.engagement_id = ?'
    ).all(engagement.id);

    engagement.vulnerabilities = db.prepare(
      `SELECT v.*, u.username as found_by_name FROM vulnerabilities v
       LEFT JOIN users u ON v.found_by = u.id WHERE v.engagement_id = ?
       ORDER BY CASE v.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`
    ).all(engagement.id);

    engagement.notes = db.prepare(
      `SELECT n.*, u.username FROM notes n LEFT JOIN users u ON n.user_id = u.id
       WHERE n.engagement_id = ? AND (n.is_private = 0 OR n.user_id = ?) ORDER BY n.created_at DESC`
    ).all(engagement.id, req.user.id);

    res.json({ engagement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch engagement.' });
  }
});

router.post('/', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const { name, target_id, test_type, scope, rules_of_engagement, objectives, start_date, end_date, tester_ids } = req.body;
    if (!name || !target_id) {
      return res.status(400).json({ error: 'Name and target are required.' });
    }

    const target = db.prepare('SELECT id FROM targets WHERE id = ?').get(target_id);
    if (!target) return res.status(404).json({ error: 'Target not found.' });

    const result = db.prepare(
      'INSERT INTO engagements (name, target_id, test_type, scope, rules_of_engagement, objectives, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, target_id, test_type || 'black_box', scope || '', rules_of_engagement || '', objectives || '', start_date || null, end_date || null, req.user.id);

    const engagementId = result.lastInsertRowid;

    db.prepare('INSERT INTO engagement_testers (engagement_id, user_id) VALUES (?, ?)').run(engagementId, req.user.id);

    if (tester_ids && Array.isArray(tester_ids)) {
      const insertTester = db.prepare('INSERT OR IGNORE INTO engagement_testers (engagement_id, user_id) VALUES (?, ?)');
      for (const tid of tester_ids) {
        if (tid !== req.user.id) insertTester.run(engagementId, tid);
      }
    }

    const engagement = db.prepare('SELECT * FROM engagements WHERE id = ?').get(engagementId);
    logActivity(req.user.id, 'create', 'engagement', engagementId, `Created engagement: ${name}`);
    res.status(201).json({ engagement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create engagement.' });
  }
});

router.put('/:id', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Engagement not found.' });

    const { name, status, test_type, scope, rules_of_engagement, objectives, start_date, end_date, tester_ids } = req.body;

    db.prepare(
      `UPDATE engagements SET name = COALESCE(?, name), status = COALESCE(?, status), test_type = COALESCE(?, test_type),
       scope = COALESCE(?, scope), rules_of_engagement = COALESCE(?, rules_of_engagement), objectives = COALESCE(?, objectives),
       start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), updated_at = datetime('now') WHERE id = ?`
    ).run(name || null, status || null, test_type || null, scope ?? null, rules_of_engagement ?? null, objectives ?? null, start_date || null, end_date || null, req.params.id);

    if (tester_ids && Array.isArray(tester_ids)) {
      db.prepare('DELETE FROM engagement_testers WHERE engagement_id = ?').run(req.params.id);
      const insertTester = db.prepare('INSERT INTO engagement_testers (engagement_id, user_id) VALUES (?, ?)');
      for (const tid of tester_ids) {
        insertTester.run(req.params.id, tid);
      }
    }

    if (status === 'completed' && existing.status !== 'completed') {
      db.prepare(`UPDATE engagements SET end_date = date('now') WHERE id = ? AND end_date IS NULL`).run(req.params.id);
    }

    const engagement = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.id);
    logActivity(req.user.id, 'update', 'engagement', engagement.id, `Updated engagement: ${engagement.name}`);
    res.json({ engagement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update engagement.' });
  }
});

router.delete('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const engagement = db.prepare('SELECT * FROM engagements WHERE id = ?').get(req.params.id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found.' });

    db.prepare('DELETE FROM engagement_testers WHERE engagement_id = ?').run(req.params.id);
    db.prepare('DELETE FROM notes WHERE engagement_id = ?').run(req.params.id);
    db.prepare('DELETE FROM vulnerabilities WHERE engagement_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reports WHERE engagement_id = ?').run(req.params.id);
    db.prepare('DELETE FROM engagements WHERE id = ?').run(req.params.id);

    logActivity(req.user.id, 'delete', 'engagement', req.params.id, `Deleted engagement: ${engagement.name}`);
    res.json({ message: 'Engagement deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete engagement.' });
  }
});

router.post('/:id/notes', (req, res) => {
  try {
    const engagement = db.prepare('SELECT id FROM engagements WHERE id = ?').get(req.params.id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found.' });

    const { title, content, is_private } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required.' });

    const result = db.prepare(
      'INSERT INTO notes (engagement_id, user_id, title, content, is_private) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, req.user.id, title || '', content, is_private ? 1 : 0);

    const note = db.prepare('SELECT n.*, u.username FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = ?').get(result.lastInsertRowid);
    res.status(201).json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

export default router;
