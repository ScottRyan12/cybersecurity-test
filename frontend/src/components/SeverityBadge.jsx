export default function SeverityBadge({ severity }) {
  return <span className={`severity-badge ${severity}`}>{severity}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status.replace('_', ' ')}</span>;
}

export function RoleBadge({ role }) {
  return <span className={`role-badge ${role}`}>{role}</span>;
}

export function TypeBadge({ type }) {
  const colors = { ip: '#10b981', domain: '#3b82f6', url: '#8b5cf6', cidr: '#f59e0b' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: `${colors[type] || '#6b7280'}20`,
      color: colors[type] || '#6b7280',
      textTransform: 'uppercase',
    }}>
      {type}
    </span>
  );
}
