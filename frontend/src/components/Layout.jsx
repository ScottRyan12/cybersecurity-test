import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './Toast';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '1.5rem 2rem', minWidth: 0 }}>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
