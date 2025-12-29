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
  customFields?: {
    county?: string;
    causeNumber?: string; // New field - replaces client identification
    description?: string; // Multi-line description field (Judge, Cause No., etc)
    caseName?: string; // Kept for backward compatibility
    dateOfHearing?: string;
    comments?: string; // Optional comments shown on invoice
    includeJudgeSignature?: boolean;
    judgeName?: string | null; // null = generic "Judge's Signature", string = specific judge name
    serviceType?: 'Appeals' | 'Transcripts' | 'Other';
    serviceTypeOther?: string; // only used when serviceType is 'Other'
    [key: string]: any; // allow additional custom fields
  };
  notes?: string;
  internalNotes?: string;
}