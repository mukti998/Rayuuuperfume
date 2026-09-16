import { useState, type FormEvent } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/format';
import { isValidPhone } from '../utils/validation';

const ORDER_PHONE = '251955055373';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [dbNote, setDbNote] = useState<string | null>(null);

  if (!open) return null;

  function buildOrderText(): string {
    const lines = items.map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`);
    return [
      `Hello, I'd like to place an order.`,
      ``,
      `Name: ${name}`,
      `Phone: ${phone}`,
      ``,
      `Order:`,
      ...lines,
      ``,
      `Total: ${formatPrice(totalPrice)}`,
    ].join('\n');
  }

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDbNote(null);

    if (!name.trim()) return setError('Please enter your name.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (!isValidPhone(phone)) return setError('Please enter a valid phone number.');

    setStatus('sending');
    const messageText = buildOrderText();

    // Save to Supabase inquiries table
    let dbOk = true;
    const { error: insertError } = await supabase.from('inquiries').insert({
      name: name.trim(),
      phone: phone.trim(),
      message: messageText,
      channel: 'cart_checkout',
    });
    if (insertError) {
      dbOk = false;
      setDbNote('Order saved for WhatsApp — it may not appear in the admin panel.');
    }

    // Open WhatsApp with prefilled message
    const waUrl = `https://wa.me/${ORDER_PHONE}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener');

    if (dbOk) {
      clearCart();
      setStatus('done');
    } else {
      setStatus('done');
    }
  }

  function handleClose() {
    setName('');
    setPhone('');
    setError(null);
    setStatus('idle');
    setDbNote(null);
    onClose();
  }

  return (
    <div className="cart-overlay" onClick={handleClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-head">
          <h2>Your Cart</h2>
          <button className="cart-close" onClick={handleClose} aria-label="Close cart">✕</button>
        </div>

        {status === 'done' ? (
          <div className="cart-done">
            <p className="form-success">Order sent via WhatsApp!</p>
            {dbNote && <p className="form-error">{dbNote}</p>}
            <p className="cart-done-sub">Check your WhatsApp to confirm the order.</p>
            <button className="btn-gold" onClick={handleClose}>Close</button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button className="btn-gold" onClick={handleClose}>Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-img">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="product-card-placeholder" />
                    )}
                  </div>
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">{formatPrice(item.price)}</span>
                    <div className="cart-item-controls">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                      >Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
              <span className="price">{formatPrice(totalPrice)}</span>
            </div>

            <form onSubmit={handleCheckout} className="cart-checkout-form">
              <label>
                Your name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  placeholder="+251..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              {dbNote && <p className="form-error">{dbNote}</p>}
              <button type="submit" className="btn-gold" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send order via WhatsApp'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
