import { Router } from 'express';
import db from '../database.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const { engagement_id } = req.query;
    let query = `SELECT r.*, u.username as generated_by_name, e.name as engagement_name
      FROM reports r LEFT JOIN users u ON r.generated_by = u.id LEFT JOIN engagements e ON r.engagement_id = e.id WHERE 1=1`;
    const params = [];
    if (engagement_id) { query += ' AND r.engagement_id = ?'; params.push(engagement_id); }
    query += ' ORDER BY r.generated_at DESC';
    const reports = db.prepare(query).all(...params);
    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const report = db.prepare(
      `SELECT r.*, u.username as generated_by_name, e.name as engagement_name
       FROM reports r LEFT JOIN users u ON r.generated_by = u.id LEFT JOIN engagements e ON r.engagement_id = e.id WHERE r.id = ?`
    ).get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

router.post('/', authorize('admin', 'manager', 'tester'), (req, res) => {
  try {
    const { engagement_id, title, report_type } = req.body;
    if (!engagement_id || !title) {
      return res.status(400).json({ error: 'Engagement ID and title are required.' });
    }

    const engagement = db.prepare(
      `SELECT e.*, t.name as target_name, t.address as target_address FROM engagements e
       LEFT JOIN targets t ON e.target_id = t.id WHERE e.id = ?`
    ).get(engagement_id);
    if (!engagement) return res.status(404).json({ error: 'Engagement not found.' });

    const vulns = db.prepare(
      `SELECT v.*, u.username as found_by_name FROM vulnerabilities v
       LEFT JOIN users u ON v.found_by = u.id WHERE v.engagement_id = ?`
    ).all(engagement_id);

    const testers = db.prepare(
      `SELECT u.username, u.full_name FROM engagement_testers et
       JOIN users u ON et.user_id = u.id WHERE et.engagement_id = ?`
    ).all(engagement_id);

    const notes = db.prepare(
      `SELECT n.*, u.username FROM notes n LEFT JOIN users u ON n.user_id = u.id
       WHERE n.engagement_id = ? AND n.is_private = 0`
    ).all(engagement_id);

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    vulns.forEach(v => severityCounts[v.severity]++);

    const content = JSON.stringify({
      engagement: {
        name: engagement.name,
        target: engagement.target_name,
        address: engagement.target_address,
        type: engagement.test_type,
        scope: engagement.scope,
        objectives: engagement.objectives,
        start_date: engagement.start_date,
        end_date: engagement.end_date,
        status: engagement.status
      },
      testers,
      summary: {
        total_vulnerabilities: vulns.length,
        severity_breakdown: severityCounts,
        critical_findings: vulns.filter(v => v.severity === 'critical')
      },
      vulnerabilities: vulns,
      notes,
      generated_at: new Date().toISOString()
    });

    const result = db.prepare(
      'INSERT INTO reports (engagement_id, title, report_type, content, generated_by) VALUES (?, ?, ?, ?, ?)'
    ).run(engagement_id, title, report_type || 'full', content, req.user.id);

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    logActivity(req.user.id, 'create', 'report', report.id, `Generated report: ${title}`);
    res.status(201).json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

router.delete('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'delete', 'report', req.params.id, `Deleted report: ${report.title}`);
    res.json({ message: 'Report deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

export default router;
