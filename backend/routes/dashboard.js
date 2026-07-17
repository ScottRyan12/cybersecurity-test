import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const totalTargets = db.prepare('SELECT COUNT(*) as count FROM targets').get().count;
    const totalEngagements = db.prepare('SELECT COUNT(*) as count FROM engagements').get().count;
    const activeEngagements = db.prepare("SELECT COUNT(*) as count FROM engagements WHERE status = 'active'").get().count;
    const totalVulns = db.prepare('SELECT COUNT(*) as count FROM vulnerabilities').get().count;
    const openVulns = db.prepare("SELECT COUNT(*) as count FROM vulnerabilities WHERE status NOT IN ('resolved','false_positive')").get().count;

    const severityBreakdown = db.prepare(
      `SELECT severity, COUNT(*) as count FROM vulnerabilities
       WHERE status NOT IN ('resolved','false_positive')
       GROUP BY severity ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`
    ).all();

    const statusBreakdown = db.prepare(
      "SELECT status, COUNT(*) as count FROM vulnerabilities GROUP BY status"
    ).all();

    const recentVulns = db.prepare(
      `SELECT v.id, v.title, v.severity, v.status, v.found_at, t.name as target_name, u.username as found_by_name
       FROM vulnerabilities v LEFT JOIN targets t ON v.target_id = t.id LEFT JOIN users u ON v.found_by = u.id
       ORDER BY v.created_at DESC LIMIT 10`
    ).all();

    const recentActivity = db.prepare(
      `SELECT al.*, u.username FROM activity_log al LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 15`
    ).all();

    const engagementStats = db.prepare(
      `SELECT status, COUNT(*) as count FROM engagements GROUP BY status`
    ).all();

    const topTargets = db.prepare(
      `SELECT t.id, t.name, t.address, COUNT(v.id) as vuln_count,
       SUM(CASE WHEN v.severity = 'critical' THEN 1 ELSE 0 END) as critical_count
       FROM targets t LEFT JOIN vulnerabilities v ON t.id = v.target_id
       GROUP BY t.id ORDER BY vuln_count DESC LIMIT 5`
    ).all();

    res.json({
      stats: {
        total_targets: totalTargets,
        total_engagements: totalEngagements,
        active_engagements: activeEngagements,
        total_vulnerabilities: totalVulns,
        open_vulnerabilities: openVulns
      },
      severity_breakdown: severityBreakdown,
      status_breakdown: statusBreakdown,
      engagement_stats: engagementStats,
      recent_vulnerabilities: recentVulns,
      recent_activity: recentActivity,
      top_targets: topTargets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

export default router;
