import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from '../CartDrawer';

export function PublicLayout() {
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

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
          <button
            className="cart-icon-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Cart (${totalItems} items)`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <img src="/logo.png" alt="Reis Perfumes" className="footer-logo" />
        <p>Reis Perfumes — Luxury That Stays</p>
      </footer>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
