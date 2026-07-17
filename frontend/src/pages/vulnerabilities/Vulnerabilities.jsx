import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import SeverityBadge, { StatusBadge } from '../../components/SeverityBadge';

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (status) params.set('status', status);
    api.get(`/vulnerabilities?${params}`).then(data => { setVulns(data.vulnerabilities); setTotal(data.total); }).catch(() => {}).finally(() => setLoading(false));
  }, [severity, status]);

  return (
    <div>
      <div className="page-header">
        <h1>Vulnerabilities ({total})</h1>
      </div>

      <div className="filter-bar">
        <input type="search" className="form-control" placeholder="Search vulnerabilities..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: '250px' }} />
        <select className="form-control" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
        <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False Positive</option>
        </select>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : vulns.length === 0 ? (
        <div className="empty-state"><div className="icon">🔓</div><h3>No vulnerabilities found</h3></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Severity</th><th>Title</th><th>Status</th><th>CVSS</th><th>CWE</th><th>Target</th><th>Engagement</th><th>Found By</th><th>Date</th></tr>
            </thead>
            <tbody>
              {vulns.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase())).map(v => (
                <tr key={v.id}>
                  <td><SeverityBadge severity={v.severity} /></td>
                  <td><Link to={`/vulnerabilities/${v.id}`} style={{ fontWeight: 500 }}>{v.title}</Link></td>
                  <td><StatusBadge status={v.status} /></td>
                  <td style={{ fontFamily: 'monospace' }}>{v.cvss_score > 0 ? v.cvss_score.toFixed(1) : '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.cwe_id || '-'}</td>
                  <td><Link to={`/targets/${v.target_id}`} style={{ fontSize: '0.85rem' }}>{v.target_name}</Link></td>
                  <td><Link to={`/engagements/${v.engagement_id}`} style={{ fontSize: '0.85rem' }}>{v.engagement_name}</Link></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.found_by_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(v.found_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
