import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { RoleBadge } from '../../components/SeverityBadge';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'tester' });
  const [editUser, setEditUser] = useState(null);
  const { addToast } = useNotifications();

  const fetchUsers = () => api.get('/users').then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      addToast('User created', 'success');
      setShowModal(false);
      setForm({ username: '', email: '', password: '', full_name: '', role: 'tester' });
      fetchUsers();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/users/${editUser.id}`, editUser);
      addToast('User updated', 'success');
      setEditUser(null);
      fetchUsers();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      addToast('User deleted', 'success');
      fetchUsers();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: user.is_active ? 0 : 1 });
      addToast(`User ${user.is_active ? 'deactivated' : 'activated'}`, 'success');
      fetchUsers();
    } catch (err) { addToast(err.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Management ({users.length})</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New User</button>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>{(u.full_name || u.username).charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.full_name || u.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><span className={`status-badge ${u.is_active ? 'active' : 'archived'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditUser({ ...u })}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New User</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Username *</label><input className="form-control" value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required /></div>
                <div className="form-group"><label>Full Name</label><input className="form-control" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} /></div>
                <div className="form-group"><label>Email *</label><input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required /></div>
                <div className="form-group"><label>Password *</label><input type="password" className="form-control" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} /></div>
                <div className="form-group"><label>Role</label><select className="form-control" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}><option value="tester">Tester</option><option value="manager">Manager</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create User</button></div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Edit User</h2><button className="btn btn-ghost btn-sm" onClick={() => setEditUser(null)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Full Name</label><input className="form-control" value={editUser.full_name || ''} onChange={e => setEditUser(p => ({...p, full_name: e.target.value}))} /></div>
              <div className="form-group"><label>Email</label><input type="email" className="form-control" value={editUser.email || ''} onChange={e => setEditUser(p => ({...p, email: e.target.value}))} /></div>
              <div className="form-group"><label>Role</label><select className="form-control" value={editUser.role || ''} onChange={e => setEditUser(p => ({...p, role: e.target.value}))}><option value="admin">Admin</option><option value="manager">Manager</option><option value="tester">Tester</option><option value="viewer">Viewer</option></select></div>
              <div className="form-group"><label>New Password (leave blank to keep)</label><input type="password" className="form-control" value={editUser._password || ''} onChange={e => setEditUser(p => ({...p, _password: e.target.value}))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                const payload = { full_name: editUser.full_name, email: editUser.email, role: editUser.role };
                if (editUser._password) payload.password = editUser._password;
                api.put(`/users/${editUser.id}`, payload).then(() => { addToast('User updated', 'success'); setEditUser(null); fetchUsers(); }).catch(err => addToast(err.message, 'error'));
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
