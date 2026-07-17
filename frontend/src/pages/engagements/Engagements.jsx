import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/SeverityBadge';

export default function Engagements() {
  const [engagements, setEngagements] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();
  const canCreate = ['admin', 'manager', 'tester'].includes(user?.role);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/engagements?${params}`).then(data => { setEngagements(data.engagements); setTotal(data.total); }).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <h1>Engagements ({total})</h1>
        {canCreate && <Link to="/engagements/new" className="btn btn-primary">+ New Engagement</Link>}
      </div>

      <div className="filter-bar">
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : engagements.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No engagements found</h3><p>Create your first engagement to begin testing</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {engagements.map(e => (
            <Link key={e.id} to={`/engagements/${e.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {e.target_name} ({e.target_address}) &middot; {e.test_type.replace('_', ' ')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {e.start_date && <span>Start: {e.start_date}</span>}
                      {e.end_date && <span>End: {e.end_date}</span>}
                      <span>By: {e.created_by_name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {e.critical_count > 0 && <span className="severity-badge critical">{e.critical_count} Critical</span>}
                    {e.high_count > 0 && <span className="severity-badge high">{e.high_count} High</span>}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{e.vuln_count} vulns</span>
                  </div>
                </div>
                {e.testers && e.testers.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Testers:</span>
                    {e.testers.map(t => (
                      <span key={t.id} className="tag">{t.full_name || t.username}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
