import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { AuditLog } from '../../types/database';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data as AuditLog[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Activity log</h1>
      <p className="admin-page-sub">
        Written automatically by database triggers on every product, image, contact method, and
        workflow change — not by application code, so it can't be bypassed from the client.
      </p>
      {loading ? (
        <p>Loading…</p>
      ) : logs.length === 0 ? (
        <p className="empty-state">No activity recorded yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Table</th>
              <th>Target</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.action}</td>
                <td>{l.target_table}</td>
                <td className="truncate">{l.target_id}</td>
                <td>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
