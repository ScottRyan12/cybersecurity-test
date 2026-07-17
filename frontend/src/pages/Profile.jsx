import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { RoleBadge } from '../components/SeverityBadge';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotifications();
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(form);
      addToast('Profile updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Profile</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '800px' }}>
        <div className="card">
          <div className="card-header"><h3>Account Info</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '2rem' }}>
              {(user?.full_name || user?.username || '').charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{user?.username}</div>
              <div style={{ marginTop: '0.5rem' }}><RoleBadge role={user?.role} /></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Edit Profile</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
