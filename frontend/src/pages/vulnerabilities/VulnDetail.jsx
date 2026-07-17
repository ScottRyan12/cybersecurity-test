import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import SeverityBadge, { StatusBadge } from '../../components/SeverityBadge';

export default function VulnDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const canEdit = ['admin', 'manager', 'tester'].includes(user?.role);

  const fetchData = () => api.get(`/vulnerabilities/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, [id]);

  const handleUpdate = async () => {
    try {
      await api.put(`/vulnerabilities/${id}`, form);
      addToast('Vulnerability updated', 'success');
      setEditing(false);
      fetchData();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/vulnerabilities/${id}`, { status });
      addToast(`Status changed to ${status.replace('_', ' ')}`, 'success');
      fetchData();
    } catch (err) { addToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Vulnerability not found</h3></div>;

  const { vulnerability: v } = data;

  const details = [
    { label: 'CVSS Score', value: v.cvss_score > 0 ? v.cvss_score.toFixed(1) : 'N/A' },
    { label: 'CWE ID', value: v.cwe_id || 'N/A' },
    { label: 'OWASP', value: v.owasp_category || 'N/A' },
    { label: 'Found By', value: v.found_by_name },
    { label: 'Found Date', value: new Date(v.found_at).toLocaleString() },
    { label: 'Last Updated', value: new Date(v.updated_at).toLocaleString() },
  ];

  if (v.resolved_at) details.push({ label: 'Resolved', value: new Date(v.resolved_at).toLocaleString() });

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.25rem' }}>{v.title}</h1>
            <SeverityBadge severity={v.severity} />
            <StatusBadge status={v.status} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Link to={`/engagements/${v.engagement_id}`}>{v.engagement_name}</Link> &middot; <Link to={`/targets/${v.target_id}`}>{v.target_name}</Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && v.status !== 'resolved' && <button className="btn btn-success btn-sm" onClick={() => updateStatus('resolved')}>Mark Resolved</button>}
          {canEdit && v.status === 'open' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus('confirmed')}>Confirm</button>}
          {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(!editing); setForm({ title: v.title, severity: v.severity, cvss_score: v.cvss_score, cwe_id: v.cwe_id, description: v.description, impact: v.impact, remediation: v.remediation }); }}>{editing ? 'Cancel Edit' : 'Edit'}</button>}
          <Link to={-1} className="btn btn-ghost btn-sm">← Back</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          {editing ? (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header"><h3>Edit Vulnerability</h3></div>
              <div className="form-group"><label>Title</label><input className="form-control" value={form.title || ''} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Severity</label><select className="form-control" value={form.severity || ''} onChange={e => setForm(p => ({...p, severity: e.target.value}))}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option></select></div>
                <div className="form-group"><label>CVSS</label><input type="number" step="0.1" min="0" max="10" className="form-control" value={form.cvss_score || ''} onChange={e => setForm(p => ({...p, cvss_score: parseFloat(e.target.value) || 0}))} /></div>
                <div className="form-group"><label>CWE</label><input className="form-control" value={form.cwe_id || ''} onChange={e => setForm(p => ({...p, cwe_id: e.target.value}))} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description || ''} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={4} /></div>
              <div className="form-group"><label>Impact</label><textarea className="form-control" value={form.impact || ''} onChange={e => setForm(p => ({...p, impact: e.target.value}))} rows={3} /></div>
              <div className="form-group"><label>Remediation</label><textarea className="form-control" value={form.remediation || ''} onChange={e => setForm(p => ({...p, remediation: e.target.value}))} rows={3} /></div>
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header"><h3>Description</h3></div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{v.description || 'No description provided.'}</p>
              </div>
              {v.impact && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header"><h3>Impact</h3></div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{v.impact}</p>
                </div>
              )}
              {v.remediation && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header"><h3>Remediation</h3></div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{v.remediation}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><h3>Details</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {details.map(d => (
                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {v.evidence?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3>Evidence ({v.evidence.length})</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {v.evidence.map(ev => (
                  <div key={ev.id} style={{ padding: '0.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 500 }}>{ev.original_name}</div>
                    {ev.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
