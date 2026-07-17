import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const { severity, status, engagement_id, target_id, page = 1, limit = 20 } = req.query;
    let query = `SELECT v.*, u.username as found_by_name, t.name as target_name, e.name as engagement_name
      FROM vulnerabilities v LEFT JOIN users u ON v.found_by = u.id
      LEFT JOIN targets t ON v.target_id = t.id LEFT JOIN engagements e ON v.engagement_id = e.id WHERE 1=1`;
    const params = [];

    if (severity) { query += ' AND v.severity = ?'; params.push(severity); }
    if (status) { query += ' AND v.status = ?'; params.push(status); }
    if (engagement_id) { query += ' AND v.engagement_id = ?'; params.push(engagement_id); }
    if (target_id) { query += ' AND v.target_id = ?'; params.push(target_id); }

    const countQuery = query.replace(/SELECT v\..*?FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    query += ` ORDER BY CASE v.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END, v.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const vulnerabilities = db.prepare(query).all(...params);
    res.json({ vulnerabilities, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vulnerabilities.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const vuln = db.prepare(
      `SELECT v.*, u.username as found_by_name, t.name as target_name, t.address as target_address,
       e.name as engagement_name FROM vulnerabilities v LEFT JOIN users u ON v.found_by = u.id
       LEFT JOIN targets t ON v.target_id = t.id LEFT JOIN engagements e ON v.engagement_id = e.id WHERE v.id = ?`
    ).get(req.params.id);
    if (!vuln) return res.status(404).json({ error: 'Vulnerability not found.' });

    vuln.evidence = db.prepare(
      'SELECT e.*, u.username as uploaded_by_name FROM evidence e LEFT JOIN users u ON e.uploaded_by = u.id WHERE e.vulnerability_id = ?'
    ).all(req.params.id);

    res.json({ vulnerability: vuln });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vulnerability.' });
  }
});

router.post('/', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const { engagement_id, target_id, title, severity, cvss_score, cwe_id, owasp_category, description, impact, remediation } = req.body;
    if (!engagement_id || !target_id || !title || !severity) {
      return res.status(400).json({ error: 'Engagement, target, title, and severity are required.' });
    }

    const engagement = db.prepare('SELECT id FROM engagements WHERE id = ?').get(engagement_id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found.' });

    const result = db.prepare(
      `INSERT INTO vulnerabilities (engagement_id, target_id, title, severity, cvss_score, cwe_id, owasp_category, description, impact, remediation, found_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(engagement_id, target_id, title, severity, cvss_score || 0, cwe_id || '', owasp_category || '', description || '', impact || '', remediation || '', req.user.id);

    const vuln = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(result.lastInsertRowid);

    const managers = db.prepare('SELECT user_id FROM engagement_testers WHERE engagement_id = ? AND user_id != ?').all(engagement_id, req.user.id);
    const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
    for (const m of managers) {
      insertNotif.run(m.user_id, 'New Vulnerability Found', `${title} (${severity}) reported in engagement`, 'warning', `/vulnerabilities/${vuln.id}`);
    }

    logActivity(req.user.id, 'create', 'vulnerability', vuln.id, `Reported vulnerability: ${title} (${severity})`);
    res.status(201).json({ vulnerability: vuln });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vulnerability.' });
  }
});

router.put('/:id', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vulnerability not found.' });

    const { title, severity, cvss_score, cwe_id, owasp_category, description, impact, remediation, status } = req.body;

    let resolved_at = null;
    if (status === 'resolved' && existing.status !== 'resolved') {
      resolved_at = new Date().toISOString();
    }

    db.prepare(
      `UPDATE vulnerabilities SET title = COALESCE(?, title), severity = COALESCE(?, severity), cvss_score = COALESCE(?, cvss_score),
       cwe_id = COALESCE(?, cwe_id), owasp_category = COALESCE(?, owasp_category), description = COALESCE(?, description),
       impact = COALESCE(?, impact), remediation = COALESCE(?, remediation), status = COALESCE(?, status),
       resolved_at = COALESCE(?, resolved_at), updated_at = datetime('now') WHERE id = ?`
    ).run(title || null, severity || null, cvss_score ?? null, cwe_id ?? null, owasp_category ?? null, description ?? null, impact ?? null, remediation ?? null, status || null, resolved_at, req.params.id);

    const vuln = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(req.params.id);
    logActivity(req.user.id, 'update', 'vulnerability', vuln.id, `Updated vulnerability: ${vuln.title}`);
    res.json({ vulnerability: vuln });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vulnerability.' });
  }
});

router.delete('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const vuln = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(req.params.id);
    if (!vuln) return res.status(404).json({ error: 'Vulnerability not found.' });

    db.prepare('DELETE FROM evidence WHERE vulnerability_id = ?').run(req.params.id);
    db.prepare('DELETE FROM vulnerabilities WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'delete', 'vulnerability', req.params.id, `Deleted vulnerability: ${vuln.title}`);
    res.json({ message: 'Vulnerability deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vulnerability.' });
  }
});

export default router;
