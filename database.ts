// Minimal hand-written types matching supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once your project is linked,
// for full generated accuracy.

export type ProductStatus = 'draft' | 'published';
export type ContactType = 'whatsapp' | 'telegram' | 'phone' | 'email' | 'other';
export type InquiryStatus = 'new' | 'contacted' | 'closed';
export type WorkflowExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string | null;
  status: ProductStatus;
  featured: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ContactMethod {
  id: string;
  type: ContactType;
  label: string;
  value: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  product_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  channel: string | null;
  status: InquiryStatus;
  created_at: string;
}

export interface WorkflowNode {
  type: 'trigger' | 'condition' | 'database_action' | 'storage_action' | 'notification' | 'log';
  label: string;
  config?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: WorkflowExecutionStatus;
  current_node: number;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  retry_count: number;
  started_at: string;
  completed_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Loose Database type so `createClient<Database>()` type-checks without
// hand-maintaining every Supabase-generated helper type.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_images: { Row: ProductImage; Insert: Partial<ProductImage>; Update: Partial<ProductImage> };
      contact_methods: { Row: ContactMethod; Insert: Partial<ContactMethod>; Update: Partial<ContactMethod> };
      inquiries: { Row: Inquiry; Insert: Partial<Inquiry>; Update: Partial<Inquiry> };
      workflows: { Row: Workflow; Insert: Partial<Workflow>; Update: Partial<Workflow> };
      workflow_executions: { Row: WorkflowExecution; Insert: Partial<WorkflowExecution>; Update: Partial<WorkflowExecution> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
}
