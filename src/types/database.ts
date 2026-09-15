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

// Supabase v2 GenericSchema requires Tables (with Relationships),
// Views, and Functions. Without these the type constraint fails
// and all query types collapse to `never`.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: ProductImage;
        Insert: Partial<ProductImage>;
        Update: Partial<ProductImage>;
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_methods: {
        Row: ContactMethod;
        Insert: Partial<ContactMethod>;
        Update: Partial<ContactMethod>;
        Relationships: [];
      };
      inquiries: {
        Row: Inquiry;
        Insert: Partial<Inquiry>;
        Update: Partial<Inquiry>;
        Relationships: [
          {
            foreignKeyName: 'inquiries_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      workflows: {
        Row: Workflow;
        Insert: Partial<Workflow>;
        Update: Partial<Workflow>;
        Relationships: [
          {
            foreignKeyName: 'workflows_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_executions: {
        Row: WorkflowExecution;
        Insert: Partial<WorkflowExecution>;
        Update: Partial<WorkflowExecution>;
        Relationships: [
          {
            foreignKeyName: 'workflow_executions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
