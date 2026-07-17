import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import SeverityBadge, { StatusBadge, TypeBadge } from '../../components/SeverityBadge';

export default function TargetDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/targets/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Target not found</h3></div>;

  const { target, engagements, vulnerabilities } = data;
  let tags = [];
  try { tags = JSON.parse(target.tags); } catch {}

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  vulnerabilities.forEach(v => severityCounts[v.severity]++);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1>{target.name}</h1>
            <TypeBadge type={target.type} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.875rem' }}>{target.address}</p>
        </div>
        <Link to="/targets" className="btn btn-secondary">← Back to Targets</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Details</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type</span><TypeBadge type={target.type} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Address</span><span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{target.address}</span></div>
            {target.port_range && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ports</span><span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{target.port_range}</span></div>}
            {target.os_info && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>OS</span><span style={{ fontSize: '0.85rem' }}>{target.os_info}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Created By</span><span style={{ fontSize: '0.85rem' }}>{target.created_by_name}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Created</span><span style={{ fontSize: '0.85rem' }}>{new Date(target.created_at).toLocaleDateString()}</span></div>
          </div>
          {target.description && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{target.description}</p>}
          {tags.length > 0 && <div style={{ marginTop: '0.75rem' }}>{tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
        </div>

        <div className="card">
          <div className="card-header"><h3>Vulnerability Summary</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {Object.entries(severityCounts).map(([sev, count]) => (
              <div key={sev} style={{ textAlign: 'center', padding: '0.75rem 0.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: count > 0 ? `var(--severity-${sev})` : 'var(--text-muted)' }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{sev}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{vulnerabilities.length} total vulnerabilities</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3>Vulnerabilities ({vulnerabilities.length})</h3></div>
        {vulnerabilities.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No vulnerabilities found for this target.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Severity</th><th>Title</th><th>Status</th><th>CVSS</th><th>Found By</th></tr></thead>
              <tbody>
                {vulnerabilities.map(v => (
                  <tr key={v.id}>
                    <td><SeverityBadge severity={v.severity} /></td>
                    <td><Link to={`/vulnerabilities/${v.id}`}>{v.title}</Link></td>
                    <td><StatusBadge status={v.status} /></td>
                    <td style={{ fontFamily: 'monospace' }}>{v.cvss_score > 0 ? v.cvss_score.toFixed(1) : '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.found_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h3>Engagements ({engagements.length})</h3></div>
        {engagements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No engagements for this target.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {engagements.map(e => (
              <Link key={e.id} to={`/engagements/${e.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.test_type.replace('_', ' ')} &middot; {e.start_date || 'No start date'}</div>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
