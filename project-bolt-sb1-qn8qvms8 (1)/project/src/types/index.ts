export type UserRole = 'admin' | 'dealer' | 'customer';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  company_name: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  dealer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
}

export interface Device {
  id: string;
  dealer_id: string;
  customer_id: string | null;
  imei: string;
  device_name: string;
  device_model: string;
  status: 'active' | 'locked' | 'stolen' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface EmiSchedule {
  id: string;
  dealer_id: string;
  customer_id: string;
  device_id: string;
  total_amount: number;
  duration_months: number;
  start_date: string;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
}

export interface Payment {
  id: string;
  emi_schedule_id: string;
  month_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  payment_method: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface DeviceLock {
  id: string;
  device_id: string;
  lock_status: 'locked' | 'unlocked';
  reason: string | null;
  locked_at: string | null;
  locked_by: string | null;
}
