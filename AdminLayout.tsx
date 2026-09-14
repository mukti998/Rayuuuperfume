import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_PATH } from '../admin/ProtectedRoute';

export function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav-brand">Reis · Control</div>
        <nav>
          <NavLink to={`${ADMIN_PATH}`} end>Dashboard</NavLink>
          <NavLink to={`${ADMIN_PATH}/products`}>Products</NavLink>
          <NavLink to={`${ADMIN_PATH}/contact-methods`}>Contact Methods</NavLink>
          <NavLink to={`${ADMIN_PATH}/inquiries`}>Inquiries</NavLink>
          <NavLink to={`${ADMIN_PATH}/workflows`}>Workflows</NavLink>
          <NavLink to={`${ADMIN_PATH}/audit-logs`}>Activity Log</NavLink>
        </nav>
        <div className="admin-nav-footer">
          <span>{profile?.full_name || 'Admin'}</span>
          <button onClick={signOut}>Log out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
