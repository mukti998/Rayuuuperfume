import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { ContactMethod, ContactType } from '../../types/database';
import { isValidPhone, isValidTelegram, isValidEmail } from '../../utils/validation';

export function AdminContactMethods() {
  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [type, setType] = useState<ContactType>('whatsapp');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState<ContactMethod | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('contact_methods').select('*').order('sort_order');
    setMethods((data as ContactMethod[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  function validate(): string | null {
    if (!label.trim()) return 'Label is required.';
    if (!value.trim()) return 'Value is required.';
    if (type === 'whatsapp' && !isValidPhone(value)) return 'Enter a valid WhatsApp number, e.g. +2348012345678.';
    if (type === 'phone' && !isValidPhone(value)) return 'Enter a valid phone number.';
    if (type === 'telegram' && !isValidTelegram(value)) return 'Enter a valid Telegram username or t.me link.';
    if (type === 'email' && !isValidEmail(value)) return 'Enter a valid email address.';
    return null;
  }

  function validateEdit(): string | null {
    if (!editLabel.trim()) return 'Label is required.';
    if (!editValue.trim()) return 'Value is required.';
    if (editing) {
      if (editing.type === 'whatsapp' && !isValidPhone(editValue)) return 'Enter a valid WhatsApp number.';
      if (editing.type === 'phone' && !isValidPhone(editValue)) return 'Enter a valid phone number.';
      if (editing.type === 'telegram' && !isValidTelegram(editValue)) return 'Enter a valid Telegram username or t.me link.';
      if (editing.type === 'email' && !isValidEmail(editValue)) return 'Enter a valid email address.';
    }
    return null;
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError(null);

    await supabase.from('contact_methods').insert({
      type,
      label: label.trim(),
      value: value.trim(),
      enabled: true,
      sort_order: methods.length,
    });
    setLabel('');
    setValue('');
    load();
  }

  function startEdit(m: ContactMethod) {
    setEditing(m);
    setEditLabel(m.label);
    setEditValue(m.value);
    setEditError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setEditLabel('');
    setEditValue('');
    setEditError(null);
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const validationError = validateEdit();
    if (validationError) return setEditError(validationError);
    setEditError(null);

    await supabase
      .from('contact_methods')
      .update({ label: editLabel.trim(), value: editValue.trim() })
      .eq('id', editing.id);
    cancelEdit();
    load();
  }

  async function toggleEnabled(m: ContactMethod) {
    await supabase.from('contact_methods').update({ enabled: !m.enabled }).eq('id', m.id);
    load();
  }

  async function remove(m: ContactMethod) {
    if (!confirm(`Remove "${m.label}"?`)) return;
    await supabase.from('contact_methods').delete().eq('id', m.id);
    load();
  }

  return (
    <div>
      <h1>Contact methods</h1>
      <p className="admin-page-sub">
        These populate every "Order" button on the public site automatically — nothing is hardcoded in the frontend.
      </p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Value</th>
            <th>Enabled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {methods.map((m) => (
            <tr key={m.id}>
              {editing?.id === m.id ? (
                <>
                  <td>
                    <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                  </td>
                  <td>{m.type}</td>
                  <td>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                  </td>
                  <td></td>
                  <td className="admin-table-actions">
                    <button className="btn-gold" onClick={handleEditSave} style={{ padding: '4px 12px', marginTop: 0 }}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{m.label}</td>
                  <td>{m.type}</td>
                  <td>{m.value}</td>
                  <td>
                    <button className="status-pill" onClick={() => toggleEnabled(m)}>
                      {m.enabled ? 'enabled' : 'disabled'}
                    </button>
                  </td>
                  <td className="admin-table-actions">
                    <button onClick={() => startEdit(m)}>Edit</button>
                    <button onClick={() => remove(m)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editError && <p className="form-error">{editError}</p>}

      <h2>Add a channel</h2>
      <form onSubmit={handleAdd} className="admin-form admin-form-inline">
        <select value={type} onChange={(e) => setType(e.target.value as ContactType)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="other">Other</option>
        </select>
        <input placeholder="Label (e.g. Order via WhatsApp)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input placeholder="Value (e.g. +2348012345678)" value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="submit" className="btn-gold">Add</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
