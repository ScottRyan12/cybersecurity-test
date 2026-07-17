import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import SeverityBadge, { StatusBadge } from '../../components/SeverityBadge';

export default function EngagementDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('vulns');
  const [showVulnModal, setShowVulnModal] = useState(false);
  const [vulnForm, setVulnForm] = useState({ title: '', severity: 'medium', cvss_score: '', cwe_id: '', owasp_category: '', description: '', impact: '', remediation: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const canEdit = ['admin', 'manager', 'tester'].includes(user?.role);

  const fetchData = () => api.get(`/engagements/${id}`).then(setData).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, [id]);

  const updateStatus = async (status) => {
    try {
      await api.put(`/engagements/${id}`, { status });
      addToast(`Engagement marked as ${status}`, 'success');
      fetchData();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const handleAddVuln = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vulnerabilities', { ...vulnForm, engagement_id: Number(id), target_id: data.engagement.target_id, cvss_score: vulnForm.cvss_score ? parseFloat(vulnForm.cvss_score) : 0 });
      addToast('Vulnerability added', 'success');
      setShowVulnModal(false);
      setVulnForm({ title: '', severity: 'medium', cvss_score: '', cwe_id: '', owasp_category: '', description: '', impact: '', remediation: '' });
      fetchData();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/engagements/${id}/notes`, noteForm);
      addToast('Note added', 'success');
      setShowNoteForm(false);
      setNoteForm({ title: '', content: '' });
      fetchData();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const handleGenerateReport = async () => {
    try {
      await api.post('/reports', { engagement_id: Number(id), title: `${data.engagement.name} - Report` });
      addToast('Report generated', 'success');
    } catch (err) { addToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Engagement not found</h3></div>;

  const { engagement } = data;
  const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  engagement.vulnerabilities?.forEach(v => vulnCounts[v.severity]++);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1>{engagement.name}</h1>
            <StatusBadge status={engagement.status} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{engagement.target_name} &middot; {engagement.test_type.replace('_', ' ')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && engagement.status === 'planned' && <button className="btn btn-success btn-sm" onClick={() => updateStatus('active')}>Start Engagement</button>}
          {canEdit && engagement.status === 'active' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus('completed')}>Complete</button>}
          <button className="btn btn-secondary btn-sm" onClick={handleGenerateReport}>Generate Report</button>
          <Link to="/engagements" className="btn btn-ghost btn-sm">← Back</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Details</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target</span><div><Link to={`/targets/${engagement.target_id}`}>{engagement.target_name}</Link></div></div>
            <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type</span><div style={{ textTransform: 'capitalize' }}>{engagement.test_type.replace('_', ' ')}</div></div>
            <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Date</span><div>{engagement.start_date || 'Not set'}</div></div>
            <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End Date</span><div>{engagement.end_date || 'Not set'}</div></div>
          </div>
          {engagement.scope && <div style={{ marginTop: '1rem' }}><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scope</span><p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{engagement.scope}</p></div>}
          {engagement.objectives && <div style={{ marginTop: '0.75rem' }}><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Objectives</span><p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{engagement.objectives}</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><h3>Vulnerabilities</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {Object.entries(vulnCounts).map(([sev, count]) => (
              <div key={sev} style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: count > 0 ? `var(--severity-${sev})` : 'var(--text-muted)' }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{sev}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'vulns' ? 'active' : ''}`} onClick={() => setTab('vulns')}>Vulnerabilities ({engagement.vulnerabilities?.length || 0})</button>
        <button className={`tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>Notes ({engagement.notes?.length || 0})</button>
        <button className={`tab ${tab === 'team' ? 'active' : ''}`} onClick={() => setTab('team')}>Team ({engagement.testers?.length || 0})</button>
      </div>

      {tab === 'vulns' && (
        <div className="card">
          {canEdit && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowVulnModal(true)}>+ Add Vulnerability</button></div>}
          {!engagement.vulnerabilities?.length ? (
            <div className="empty-state"><div className="icon">🔓</div><h3>No vulnerabilities found</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Severity</th><th>Title</th><th>Status</th><th>CVSS</th><th>CWE</th><th>Found By</th></tr></thead>
                <tbody>
                  {engagement.vulnerabilities.map(v => (
                    <tr key={v.id}>
                      <td><SeverityBadge severity={v.severity} /></td>
                      <td><Link to={`/vulnerabilities/${v.id}`}>{v.title}</Link></td>
                      <td><StatusBadge status={v.status} /></td>
                      <td style={{ fontFamily: 'monospace' }}>{v.cvss_score > 0 ? v.cvss_score.toFixed(1) : '-'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.cwe_id || '-'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{v.found_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card">
          {canEdit && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowNoteForm(true)}>+ Add Note</button></div>}
          {!engagement.notes?.length ? (
            <div className="empty-state"><div className="icon">📝</div><h3>No notes yet</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {engagement.notes.map(n => (
                <div key={n.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderLeft: n.is_private ? '3px solid var(--accent-yellow)' : 'none' }}>
                  {n.title && <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{n.title} {n.is_private && <span style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)' }}>Private</span>}</div>}
                  <pre style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{n.content}</pre>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>By {n.username} &middot; {new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {engagement.testers?.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{(t.full_name || t.username).charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 500 }}>{t.full_name || t.username}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.role}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showVulnModal && (
        <div className="modal-overlay" onClick={() => setShowVulnModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Vulnerability</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowVulnModal(false)}>×</button></div>
            <form onSubmit={handleAddVuln}>
              <div className="modal-body">
                <div className="form-group"><label>Title *</label><input className="form-control" value={vulnForm.title} onChange={e => setVulnForm(p => ({...p, title: e.target.value}))} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group"><label>Severity *</label><select className="form-control" value={vulnForm.severity} onChange={e => setVulnForm(p => ({...p, severity: e.target.value}))}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option></select></div>
                  <div className="form-group"><label>CVSS Score</label><input type="number" step="0.1" min="0" max="10" className="form-control" value={vulnForm.cvss_score} onChange={e => setVulnForm(p => ({...p, cvss_score: e.target.value}))} /></div>
                  <div className="form-group"><label>CWE ID</label><input className="form-control" value={vulnForm.cwe_id} onChange={e => setVulnForm(p => ({...p, cwe_id: e.target.value}))} placeholder="CWE-79" /></div>
                </div>
                <div className="form-group"><label>Description *</label><textarea className="form-control" value={vulnForm.description} onChange={e => setVulnForm(p => ({...p, description: e.target.value}))} rows={3} required /></div>
                <div className="form-group"><label>Impact</label><textarea className="form-control" value={vulnForm.impact} onChange={e => setVulnForm(p => ({...p, impact: e.target.value}))} rows={2} /></div>
                <div className="form-group"><label>Remediation</label><textarea className="form-control" value={vulnForm.remediation} onChange={e => setVulnForm(p => ({...p, remediation: e.target.value}))} rows={2} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowVulnModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Vulnerability</button></div>
            </form>
          </div>
        </div>
      )}

      {showNoteForm && (
        <div className="modal-overlay" onClick={() => setShowNoteForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Note</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowNoteForm(false)}>×</button></div>
            <form onSubmit={handleAddNote}>
              <div className="modal-body">
                <div className="form-group"><label>Title</label><input className="form-control" value={noteForm.title} onChange={e => setNoteForm(p => ({...p, title: e.target.value}))} /></div>
                <div className="form-group"><label>Content *</label><textarea className="form-control" value={noteForm.content} onChange={e => setNoteForm(p => ({...p, content: e.target.value}))} rows={5} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowNoteForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Note</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
