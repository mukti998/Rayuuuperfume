import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function AdminDashboard() {
  const [counts, setCounts] = useState({ products: 0, published: 0, inquiries: 0, workflows: 0 });

  useEffect(() => {
    (async () => {
      const [products, published, inquiries, workflows] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('enabled', true),
      ]);
      setCounts({
        products: products.count || 0,
        published: published.count || 0,
        inquiries: inquiries.count || 0,
        workflows: workflows.count || 0,
      });
    })();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{counts.products}</span>
          <span className="stat-label">Total products</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{counts.published}</span>
          <span className="stat-label">Published</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{counts.inquiries}</span>
          <span className="stat-label">New inquiries</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{counts.workflows}</span>
          <span className="stat-label">Active workflows</span>
        </div>
      </div>
    </div>
  );
}
