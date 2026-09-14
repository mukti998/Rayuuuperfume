import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Inquiry, InquiryStatus } from '../../types/database';

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setInquiryStatus(inquiry: Inquiry, status: InquiryStatus) {
    await supabase.from('inquiries').update({ status }).eq('id', inquiry.id);
    load();
  }

  return (
    <div>
      <h1>Inquiries</h1>
      {loading ? (
        <p>Loading…</p>
      ) : inquiries.length === 0 ? (
        <p className="empty-state">No inquiries yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Message</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.email || i.phone || '—'}</td>
                <td className="truncate">{i.message || '—'}</td>
                <td>
                  <select value={i.status} onChange={(e) => setInquiryStatus(i, e.target.value as InquiryStatus)}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td>{new Date(i.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
