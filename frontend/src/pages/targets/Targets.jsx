import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { TypeBadge } from '../../components/SeverityBadge';

export default function Targets() {
  const [targets, setTargets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ip', address: '', port_range: '', os_info: '', description: '' });
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const canEdit = ['admin', 'manager', 'tester'].includes(user?.role);

  const fetchTargets = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    api.get(`/targets?${params}`).then(data => { setTargets(data.targets); setTotal(data.total); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTargets(); }, [search, typeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets', form);
      addToast('Target created', 'success');
      setShowModal(false);
      setForm({ name: '', type: 'ip', address: '', port_range: '', os_info: '', description: '' });
      fetchTargets();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const update = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h1>Targets ({total})</h1>
        {canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Target</button>}
      </div>

      <div className="filter-bar">
        <input type="search" className="form-control" placeholder="Search targets..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="ip">IP</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="cidr">CIDR</option>
        </select>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : targets.length === 0 ? (
        <div className="empty-state"><div className="icon">🎯</div><h3>No targets found</h3><p>Add your first target to get started</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Address</th><th>OS</th><th>Created By</th><th>Created</th></tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.id}>
                  <td><Link to={`/targets/${t.id}`} style={{ fontWeight: 500 }}>{t.name}</Link></td>
                  <td><TypeBadge type={t.type} /></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.address}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.os_info || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.created_by_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Target</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.name} onChange={update('name')} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Type *</label><select className="form-control" value={form.type} onChange={update('type')}><option value="ip">IP Address</option><option value="domain">Domain</option><option value="url">URL</option><option value="cidr">CIDR Range</option></select></div>
                  <div className="form-group"><label>Address *</label><input className="form-control" value={form.address} onChange={update('address')} placeholder="e.g. 192.168.1.1" required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Port Range</label><input className="form-control" value={form.port_range} onChange={update('port_range')} placeholder="e.g. 80,443" /></div>
                  <div className="form-group"><label>OS Info</label><input className="form-control" value={form.os_info} onChange={update('os_info')} placeholder="e.g. Ubuntu 22.04" /></div>
                </div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={update('description')} rows={3} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Target</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
