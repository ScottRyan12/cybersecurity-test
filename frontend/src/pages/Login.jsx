import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authLogin(login, password);
      addToast('Login successful', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const style = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    },
    card: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '2.5rem',
      width: '100%',
      maxWidth: '400px',
      boxShadow: 'var(--shadow-lg)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    logo: {
      fontSize: '2.5rem',
      marginBottom: '0.5rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.25rem',
    },
    subtitle: {
      fontSize: '0.875rem',
      color: 'var(--text-muted)',
    },
    error: {
      padding: '0.6rem 1rem',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--accent-red)',
      fontSize: '0.85rem',
      marginBottom: '1rem',
    },
    submit: {
      width: '100%',
      marginTop: '0.5rem',
    },
    footer: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.85rem',
      color: 'var(--text-muted)',
    },
  };

  return (
    <div style={style.wrapper}>
      <div style={style.card}>
        <div style={style.header}>
          <div style={style.logo}>🛡️</div>
          <h1 style={style.title}>Ongwaeh Platform</h1>
          <p style={style.subtitle}>Sign in to your account</p>
        </div>

        {error && <div style={style.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              className="form-control"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Enter username or email"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={style.submit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={style.footer}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
