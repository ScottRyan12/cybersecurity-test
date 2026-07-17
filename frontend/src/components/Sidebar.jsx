import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/targets', label: 'Targets', icon: '🎯' },
  { to: '/engagements', label: 'Engagements', icon: '📋' },
  { to: '/vulnerabilities', label: 'Vulnerabilities', icon: '🔓' },
  { to: '/reports', label: 'Reports', icon: '📄' },
];

const adminLinks = [
  { to: '/admin/users', label: 'Users', icon: '👥', roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const style = {
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    },
    logo: {
      padding: '1.25rem 1.5rem',
      borderBottom: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    logoIcon: {
      fontSize: '1.5rem',
    },
    logoText: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: 'var(--text-primary)',
    },
    logoSub: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    nav: {
      flex: 1,
      padding: '0.75rem 0',
      overflowY: 'auto',
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.6rem 1.5rem',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'all 0.15s',
      borderLeft: '3px solid transparent',
    },
    linkActive: {
      color: 'var(--accent-primary)',
      background: 'rgba(59,130,246,0.08)',
      borderLeftColor: 'var(--accent-primary)',
    },
    divider: {
      height: '1px',
      background: 'var(--border-primary)',
      margin: '0.5rem 1.5rem',
    },
    sectionLabel: {
      padding: '0.5rem 1.5rem 0.25rem',
      fontSize: '0.7rem',
      fontWeight: '600',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    user: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'var(--accent-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.85rem',
      fontWeight: '700',
      color: 'white',
      flexShrink: 0,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontSize: '0.85rem',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    userRole: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      textTransform: 'capitalize',
    },
    logoutBtn: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: '1rem',
      padding: '0.25rem',
    },
  };

  return (
    <aside style={style.sidebar}>
      <div style={style.logo}>
        <span style={style.logoIcon}>🛡️</span>
        <div>
          <div style={style.logoText}>Ongwaeh</div>
          <div style={style.logoSub}>Penetration Testing</div>
        </div>
      </div>

      <nav style={style.nav}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            style={({ isActive }) => ({
              ...style.link,
              ...(isActive ? style.linkActive : {}),
            })}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div style={style.sectionLabel}>Administration</div>
            <div style={style.divider} />
            {adminLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  ...style.link,
                  ...(isActive ? style.linkActive : {}),
                })}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div style={style.user}>
        <div style={style.avatar}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div style={style.userInfo}>
          <div style={style.userName}>{user?.full_name || user?.username}</div>
          <div style={style.userRole}>{user?.role}</div>
        </div>
        <button onClick={handleLogout} style={style.logoutBtn} title="Logout">🚪</button>
      </div>
    </aside>
  );
}
