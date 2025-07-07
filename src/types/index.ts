
export type UserRole = 'admin' | 'manager' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

export type Urgency = 'low' | 'medium' | 'high';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  openingDate: string;
  clientName: string;
  clientContact: string;
  clientAddress: string;
  serviceDescription: string;
  saleValue?: number; // Only visible to admin
  status: OrderStatus;
  urgency: Urgency;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  deadline?: string;
  observations: Observation[];
}

export interface Observation {
  id: string;
  date: string;
  userId: string;
  userName: string;
  text: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  address: string;
}
