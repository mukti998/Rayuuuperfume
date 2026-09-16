import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { ContactMethod } from '../../types/database';
import { isValidEmail } from '../../utils/validation';
import { ContactIcon } from '../../components/ContactIcon';

export function Contact() {
  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('contact_methods')
      .select('*')
      .eq('enabled', true)
      .order('sort_order')
      .then(({ data }) => setMethods((data as ContactMethod[]) || []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (email && !isValidEmail(email)) {
      setError('That email address looks incomplete.');
      return;
    }

    setStatus('sending');
    const { error: insertError } = await supabase.from('inquiries').insert({
      name: name.trim(),
      email: email.trim() || null,
      message: message.trim() || null,
      channel: 'website_form',
    });

    if (insertError) {
      setStatus('error');
      setError('Something went wrong sending that — please try a contact channel below instead.');
      return;
    }
    setStatus('sent');
    setName('');
    setEmail('');
    setMessage('');
  }

  return (
    <div className="contact-page">
      <h1>Get in touch</h1>

      <div className="contact-row">
        {methods.map((m) => (
          <a key={m.id} className="contact-chip" href={contactHref(m)} target="_blank" rel="noreferrer">
            <ContactIcon type={m.type} />
            {m.label}
          </a>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="contact-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
        </label>
        {error && <p className="form-error">{error}</p>}
        {status === 'sent' && <p className="form-success">Message sent — we'll get back to you.</p>}
        <button type="submit" className="btn-gold" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  );
}

function contactHref(method: ContactMethod): string {
  switch (method.type) {
    case 'whatsapp':
      return `https://wa.me/${method.value.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return method.value.startsWith('http') ? method.value : `https://t.me/${method.value.replace('@', '')}`;
    case 'phone':
      return `tel:${method.value}`;
    case 'email':
      return `mailto:${method.value}`;
    default:
      return method.value;
  }
}
