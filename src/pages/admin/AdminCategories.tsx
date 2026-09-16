import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Category } from '../../types/database';
import { slugify } from '../../utils/validation';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data as Category[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return setError('Category name is required.');

    const slug = slugify(trimmed);
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('categories').select('id').eq('slug', slug).maybeSingle();
    if (existing) return setError('A category with that name already exists.');

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    const { error: insertErr } = await supabase.from('categories').insert({
      name: trimmed,
      slug,
      sort_order: maxOrder + 1,
    });
    if (insertErr) return setError(insertErr.message);
    setName('');
    load();
  }

  async function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  async function saveEdit(id: string) {
    setError(null);
    const trimmed = editName.trim();
    if (!trimmed) return setError('Category name is required.');

    const newSlug = slugify(trimmed);
    // Check slug uniqueness (exclude current)
    const { data: existing } = await supabase
      .from('categories').select('id').eq('slug', newSlug).maybeSingle();
    if (existing && (existing as Category).id !== id) {
      return setError('A category with that name already exists.');
    }

    const { error: updateErr } = await supabase
      .from('categories')
      .update({ name: trimmed, slug: newSlug })
      .eq('id', id);
    if (updateErr) return setError(updateErr.message);
    setEditingId(null);
    load();
  }

  async function remove(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? Products in this category will become uncategorized.`)) return;
    const { error: delErr } = await supabase.from('categories').delete().eq('id', cat.id);
    if (delErr) return setError(delErr.message);
    load();
  }

  async function moveUp(cat: Category) {
    const idx = categories.findIndex((c) => c.id === cat.id);
    if (idx <= 0) return;
    const prev = categories[idx - 1];
    // Swap sort_order values
    await Promise.all([
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', prev.id),
      supabase.from('categories').update({ sort_order: prev.sort_order }).eq('id', cat.id),
    ]);
    load();
  }

  async function moveDown(cat: Category) {
    const idx = categories.findIndex((c) => c.id === cat.id);
    if (idx < 0 || idx >= categories.length - 1) return;
    const next = categories[idx + 1];
    await Promise.all([
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', next.id),
      supabase.from('categories').update({ sort_order: next.sort_order }).eq('id', cat.id),
    ]);
    load();
  }

  return (
    <div>
      <h1>Categories</h1>

      {loading ? (
        <p>Loading…</p>
      ) : categories.length === 0 ? (
        <p className="empty-state">No categories yet — add your first one.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Sort</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                {editingId === cat.id ? (
                  <>
                    <td>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                      />
                    </td>
                    <td>{slugify(editName)}</td>
                    <td></td>
                    <td className="admin-table-actions">
                      <button className="btn-gold" onClick={() => saveEdit(cat.id)} style={{ padding: '4px 12px', marginTop: 0 }}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td className="admin-table-actions" style={{ gap: 4 }}>
                      <button onClick={() => moveUp(cat)} disabled={categories.indexOf(cat) === 0} title="Move up">↑</button>
                      <button onClick={() => moveDown(cat)} disabled={categories.indexOf(cat) === categories.length - 1} title="Move down">↓</button>
                    </td>
                    <td className="admin-table-actions">
                      <button onClick={() => startEdit(cat)}>Edit</button>
                      <button onClick={() => remove(cat)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && <p className="form-error">{error}</p>}

      <h2>Add a category</h2>
      <form onSubmit={handleAdd} className="admin-form admin-form-inline">
        <input
          placeholder="Category name (e.g. Watch)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {name.trim() && (
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Slug: {slugify(name)}</span>
        )}
        <button type="submit" className="btn-gold">Add</button>
      </form>
    </div>
  );
}
