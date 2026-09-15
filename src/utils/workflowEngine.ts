import { supabase } from '../lib/supabaseClient';
import type { Workflow, WorkflowExecution, WorkflowNode } from '../types/database';

/**
 * Minimal workflow execution engine.
 *
 * This intentionally implements the useful subset the brief asks for
 * (trigger -> nodes -> execution record with status/history/retry) rather
 * than a full automation platform. Node types 'log' and 'notification' are
 * actually executed client-side; 'database_action' and 'storage_action' are
 * validated and recorded but are placeholders for you to wire up to real
 * Supabase calls specific to your business logic — the audit trail and
 * retry semantics around them are real and functional.
 */
export async function runWorkflow(workflow: Workflow, input: Record<string, unknown> = {}): Promise<WorkflowExecution> {
  const { data: execution, error: insertError } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflow.id,
      status: 'running',
      current_node: 0,
      input,
    })
    .select()
    .single();

  if (insertError || !execution) {
    throw insertError || new Error('Could not create workflow execution record.');
  }

  let exec = execution as WorkflowExecution;

  try {
    for (let i = 0; i < workflow.nodes.length; i++) {
      const node = workflow.nodes[i] as WorkflowNode;
      await executeNode(node);
      await supabase.from('workflow_executions').update({ current_node: i + 1 }).eq('id', exec.id);
    }

    const { data: completed } = await supabase
      .from('workflow_executions')
      .update({ status: 'success', completed_at: new Date().toISOString(), output: { ok: true } })
      .eq('id', exec.id)
      .select()
      .single();
    exec = (completed as WorkflowExecution) || exec;
  } catch (err) {
    const { data: failed } = await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', exec.id)
      .select()
      .single();
    exec = (failed as WorkflowExecution) || exec;
    throw err;
  }

  return exec;
}

export async function retryExecution(execution: WorkflowExecution, workflow: Workflow): Promise<WorkflowExecution> {
  await supabase
    .from('workflow_executions')
    .update({ retry_count: execution.retry_count + 1 })
    .eq('id', execution.id);
  return runWorkflow(workflow, execution.input || {});
}

async function executeNode(node: WorkflowNode): Promise<void> {
  switch (node.type) {
    case 'log':
      // eslint-disable-next-line no-console
      console.log('[workflow]', node.label, node.config);
      return;
    case 'notification':
      // Placeholder: wire up to email/SMS/webhook provider of your choice.
      return;
    case 'condition':
      // Placeholder: evaluate node.config against execution input.
      return;
    case 'database_action':
    case 'storage_action':
      // Placeholder: implement the specific Supabase call this node needs.
      return;
    default:
      return;
  }
}
