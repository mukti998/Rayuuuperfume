import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Workflow, WorkflowExecution } from '../../types/database';
import { runWorkflow, retryExecution } from '../../utils/workflowEngine';

export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Record<string, WorkflowExecution[]>>({});
  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('product_created');
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('workflows').select('*').order('created_at', { ascending: false });
    const list = (data as Workflow[]) || [];
    setWorkflows(list);

    if (list.length > 0) {
      const { data: execs } = await supabase
        .from('workflow_executions')
        .select('*')
        .in('workflow_id', list.map((w) => w.id))
        .order('started_at', { ascending: false });
      const grouped: Record<string, WorkflowExecution[]> = {};
      (execs as WorkflowExecution[] || []).forEach((e) => {
        grouped[e.workflow_id] = grouped[e.workflow_id] || [];
        grouped[e.workflow_id].push(e);
      });
      setExecutions(grouped);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Workflow name is required.');
    setError(null);

    await supabase.from('workflows').insert({
      name: name.trim(),
      trigger_event: triggerEvent,
      enabled: true,
      nodes: [
        { type: 'trigger', label: triggerEvent },
        { type: 'log', label: 'Log event' },
      ],
    });
    setName('');
    load();
  }

  async function toggleEnabled(w: Workflow) {
    await supabase.from('workflows').update({ enabled: !w.enabled }).eq('id', w.id);
    load();
  }

  async function remove(w: Workflow) {
    if (!confirm(`Delete workflow "${w.name}"?`)) return;
    await supabase.from('workflows').delete().eq('id', w.id);
    load();
  }

  async function handleRun(w: Workflow) {
    setRunning(w.id);
    try {
      await runWorkflow(w, { manual: true });
    } catch {
      // execution row already records the failure; nothing else to do here
    } finally {
      setRunning(null);
      load();
    }
  }

  async function handleRetry(w: Workflow, execution: WorkflowExecution) {
    setRunning(w.id);
    try {
      await retryExecution(execution, w);
    } catch {
      // recorded on the execution row
    } finally {
      setRunning(null);
      load();
    }
  }

  return (
    <div>
      <h1>Workflows</h1>
      <p className="admin-page-sub">
        Trigger → nodes → result. This is the minimal subset the app needs, not a full automation
        platform — see the README for how to extend node types.
      </p>

      {workflows.length === 0 ? (
        <p className="empty-state">No workflows yet.</p>
      ) : (
        workflows.map((w) => (
          <div key={w.id} className="workflow-card">
            <div className="workflow-card-head">
              <div>
                <h3>{w.name}</h3>
                <p className="admin-page-sub">Trigger: {w.trigger_event}</p>
              </div>
              <div className="workflow-card-actions">
                <button className="status-pill" onClick={() => toggleEnabled(w)}>
                  {w.enabled ? 'enabled' : 'disabled'}
                </button>
                <button onClick={() => handleRun(w)} disabled={running === w.id}>
                  {running === w.id ? 'Running…' : 'Run now'}
                </button>
                <button onClick={() => remove(w)}>Delete</button>
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Retries</th>
                  <th>Error</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(executions[w.id] || []).slice(0, 5).map((e) => (
                  <tr key={e.id}>
                    <td>{e.status}</td>
                    <td>{new Date(e.started_at).toLocaleString()}</td>
                    <td>{e.retry_count}</td>
                    <td className="truncate">{e.error || '—'}</td>
                    <td>
                      {e.status === 'failed' && (
                        <button onClick={() => handleRetry(w, e)}>Retry</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      <h2>Create workflow</h2>
      <form onSubmit={handleCreate} className="admin-form admin-form-inline">
        <input placeholder="Workflow name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}>
          <option value="product_created">Product created</option>
          <option value="product_updated">Product updated</option>
          <option value="product_deleted">Product deleted</option>
          <option value="inquiry_created">Inquiry created</option>
          <option value="contact_setting_changed">Contact setting changed</option>
        </select>
        <button type="submit" className="btn-gold">Create</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
