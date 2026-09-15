import { Outlet, Link } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Reis Perfumes" className="brand-logo" />
          <span className="brand-text">Luxury That Stays</span>
        </Link>
        <nav>
          <Link to="/products">Collection</Link>
          <Link to="/contact">Order</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <img src="/logo.png" alt="Reis Perfumes" className="footer-logo" />
        <p>Reis Perfumes — Luxury That Stays</p>
      </footer>
    </div>
  );
}
