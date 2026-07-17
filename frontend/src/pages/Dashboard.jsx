import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading dashboard...</span></div>;
  if (!data) return <div className="empty-state"><h3>Failed to load dashboard</h3></div>;

  const { stats, severity_breakdown, status_breakdown, recent_vulnerabilities, recent_activity, top_targets } = data;

  const totalSev = severity_breakdown.reduce((a, b) => a + b.count, 0) || 1;
  const sevColors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', info: '#6b7280' };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)' }}>🎯</div>
          <div className="stat-info"><h4>{stats.total_targets}</h4><p>Total Targets</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}>📋</div>
          <div className="stat-info"><h4>{stats.active_engagements}</h4><p>Active Engagements</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>📊</div>
          <div className="stat-info"><h4>{stats.total_vulnerabilities}</h4><p>Total Vulnerabilities</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>🔓</div>
          <div className="stat-info"><h4>{stats.open_vulnerabilities}</h4><p>Open Vulnerabilities</p></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Severity Breakdown</h3></div>
          <div className="severity-bar" style={{ height: '12px', marginBottom: '1rem' }}>
            {severity_breakdown.map(s => (
              <div key={s.severity} className="segment" style={{ width: `${(s.count / totalSev) * 100}%`, background: sevColors[s.severity] }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {severity_breakdown.map(s => (
              <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sevColors[s.severity] }} />
                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{s.severity}</span>
                <span style={{ fontWeight: 600 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Top Targets</h3></div>
          {top_targets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No targets with vulnerabilities yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {top_targets.map(t => (
                <Link key={t.id} to={`/targets/${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-primary)', textDecoration: 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.address}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {t.critical_count > 0 && <span className="severity-badge critical">{t.critical_count}C</span>}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.vuln_count} vulns</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Recent Vulnerabilities</h3></div>
          {recent_vulnerabilities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No vulnerabilities reported yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {recent_vulnerabilities.map(v => (
                <Link key={v.id} to={`/vulnerabilities/${v.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-primary)', textDecoration: 'none' }}>
                  <span className={`severity-badge ${v.severity}`}>{v.severity}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.target_name} &middot; {v.found_by_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Activity</h3></div>
          {recent_activity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '300px', overflowY: 'auto' }}>
              {recent_activity.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border-primary)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.username || 'System'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{a.action} {a.entity_type}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
