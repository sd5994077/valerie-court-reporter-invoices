// Universal Invoice System Types
export interface LineItem {
  id: string;
  number: number;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  date?: string;
  category?: string;
  taxable?: boolean;
  notes?: string;
}

export interface InvoiceFormData {
  invoiceNumber?: string;
  date: string;
  dueDate: string;
  serviceDate?: string;
  clientId?: string;
  manualClient?: {
    name: string;
    company?: string;
    address: string;
    email?: string;
    phone?: string;
  };
  lineItems: Omit<LineItem, 'id' | 'total'>[];
  customFields?: Record<string, any>;
  notes?: string;
  internalNotes?: string;
}