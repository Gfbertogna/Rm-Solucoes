
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  address: string;
  cnpj_cpf?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: string;
  order_number: string;
  opening_date: string;
  client_id?: string;
  client_name: string;
  client_contact: string;
  client_address: string;
  service_description: string;
  sale_value?: number;
  status: OrderStatus;
  urgency: Urgency;
  assigned_worker_id?: string;
  deadline?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  default_price?: number;
  estimated_hours?: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  budget_number: string;
  client_id?: string;
  client_name: string;
  client_contact: string;
  client_address: string;
  description: string;
  status: BudgetStatus;
  total_value: number;
  valid_until?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  service_id?: string;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface ServiceOrderTask {
  id: string;
  service_order_id: string;
  title: string;
  description?: string;
  assigned_worker_id?: string;
  status: TaskStatus;
  status_details?: string;
  priority: TaskPriority;
  estimated_hours?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTimeLog {
  id: string;
  task_id: string;
  worker_id: string;
  start_time: string;
  end_time?: string;
  description?: string;
  hours_worked?: number;
  created_at: string;
}

export interface ServiceOrderImage {
  id: string;
  service_order_id?: string;
  task_id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  description?: string;
  created_at: string;
}

export interface Observation {
  id: string;
  service_order_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  current_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  movement_type: 'in' | 'out';
  quantity: number;
  date: string;
  user_id?: string;
  service_order_id?: string;
  created_at: string;
}

export type OrderStatus = 
  | 'received' 
  | 'pending' 
  | 'planning' 
  | 'production' 
  | 'quality_control' 
  | 'ready_for_shipment' 
  | 'in_transit' 
  | 'delivered' 
  | 'invoiced' 
  | 'completed' 
  | 'cancelled';

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export type Urgency = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskProductUsage {
  id: string;
  task_id: string;
  item_id: string;
  quantity_used: number;
  created_by?: string;
  created_at: string;
}
