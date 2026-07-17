import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.full_name);
      addToast('Registration successful', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const style = {
    wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' },
    card: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' },
    header: { textAlign: 'center', marginBottom: '2rem' },
    logo: { fontSize: '2.5rem', marginBottom: '0.5rem' },
    title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' },
    subtitle: { fontSize: '0.875rem', color: 'var(--text-muted)' },
    error: { padding: '0.6rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' },
    submit: { width: '100%', marginTop: '0.5rem' },
    footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
  };

  return (
    <div style={style.wrapper}>
      <div style={style.card}>
        <div style={style.header}>
          <div style={style.logo}>🛡️</div>
          <h1 style={style.title}>Create Account</h1>
          <p style={style.subtitle}>Join the Ongwaeh Platform</p>
        </div>

        {error && <div style={style.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={form.full_name} onChange={update('full_name')} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Username *</label>
            <input type="text" className="form-control" value={form.username} onChange={update('username')} placeholder="johndoe" required autoFocus />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" className="form-control" value={form.email} onChange={update('email')} placeholder="john@example.com" required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" className="form-control" value={form.password} onChange={update('password')} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={style.submit} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={style.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
