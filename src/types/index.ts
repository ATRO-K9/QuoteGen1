export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  created_at: Date;
}

export interface Project {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  start_date: Date;
  status: 'pending' | 'in-progress' | 'completed';
  created_at: Date;
  currency: 'LKR' | 'USD' | 'AUD';
}

export interface ServiceItem {
  id: string;
  project_id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  created_at: Date;
}

export interface Quotation {
  id: string;
  project_id: string;
  customer_id: string;
  date: Date;
  valid_until: Date;
  items: ServiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: Date;
  currency: 'LKR' | 'USD' | 'AUD';
}

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  created_at?: string;
  updated_at?: string;
}