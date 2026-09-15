import { useState, type FormEvent } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ADMIN_PATH } from '../admin/ProtectedRoute';

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (pw.length < 6) return setPwErr('Password must be at least 6 characters.');
    if (pw !== pw2) return setPwErr('Passwords do not match.');
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);
    if (error) {
      setPwErr(error.message);
    } else {
      setPwMsg('Password updated.');
      setPw('');
      setPw2('');
      setTimeout(() => { setShowPw(false); setPwMsg(null); }, 2000);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav-brand">Luxury That Stays</div>
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
          <button onClick={() => setShowPw(!showPw)}>Change password</button>
          {showPw && (
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
              <input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
              {pwErr && <p className="form-error">{pwErr}</p>}
              {pwMsg && <p className="form-success">{pwMsg}</p>}
              <button type="submit" disabled={pwSaving} style={{ background: 'none', border: '1px solid var(--lemon)', color: 'var(--lemon)', padding: '6px', borderRadius: 2, cursor: 'pointer', fontSize: 12 }}>
                {pwSaving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
          <button onClick={signOut}>Log out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
