import { Outlet, Link } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="brand">REIS <span>PERFUMES</span></Link>
        <nav>
          <Link to="/products">Collection</Link>
          <Link to="/contact">Order</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Reis Perfumes — Luxury That Stays</p>
      </footer>
    </div>
  );
}
