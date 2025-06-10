import { sql } from '@vercel/postgres';

// Configure the connection
if (process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

export { sql };

// Database connection utility functions
export async function connectToDatabase() {
  try {
    // Test the connection
    const result = await sql`SELECT 1 as test`;
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// User operations
export async function createUser(userData: {
  email: string;
  name: string;
  business_name?: string;
  profession_type?: string;
  license_number?: string;
  license_type?: string;
  phone?: string;
  website?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO users (
        email, name, business_name, profession_type, 
        license_number, license_type, phone, website
      ) VALUES (
        ${userData.email}, 
        ${userData.name}, 
        ${userData.business_name || null},
        ${userData.profession_type || 'court_reporter'},
        ${userData.license_number || null},
        ${userData.license_type || null},
        ${userData.phone || null},
        ${userData.website || null}
      ) RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Invoice operations
export async function createInvoice(invoiceData: {
  user_id: string;
  invoice_number: string;
  date: string;
  client_name: string;
  client_company?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  case_name?: string;
  county?: string;
  total_amount: number;
  tax_amount?: number;
  status?: string;
  notes?: string;
  finalized_at?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO invoices (
        user_id, invoice_number, date, client_name, client_company,
        client_address, client_email, client_phone,
        case_name, county, total_amount, tax_amount, status, notes, finalized_at
      ) VALUES (
        ${invoiceData.user_id},
        ${invoiceData.invoice_number},
        ${invoiceData.date},
        ${invoiceData.client_name},
        ${invoiceData.client_company || null},
        ${invoiceData.client_address || null},
        ${invoiceData.client_email || null},
        ${invoiceData.client_phone || null},
        ${invoiceData.case_name || null},
        ${invoiceData.county || null},
        ${invoiceData.total_amount},
        ${invoiceData.tax_amount || 0},
        ${invoiceData.status || 'pending'},
        ${invoiceData.notes || null},
        ${invoiceData.finalized_at || null}
      ) RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

export async function getInvoicesByUser(userId: string) {
  try {
    const result = await sql`
      SELECT i.*, 
             json_agg(
               json_build_object(
                 'id', li.id,
                 'description', li.description,
                 'amount', li.amount,
                 'order_index', li.order_index
               ) ORDER BY li.order_index
             ) as line_items
      FROM invoices i
      LEFT JOIN line_items li ON i.id = li.invoice_id
      WHERE i.user_id = ${userId}
      GROUP BY i.id
      ORDER BY i.date DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting invoices by user:', error);
    throw error;
  }
}

// Line item operations
export async function createLineItem(lineItemData: {
  invoice_id: string;
  description: string;
  amount: number;
  order_index: number;
}) {
  try {
    const result = await sql`
      INSERT INTO line_items (invoice_id, description, amount, order_index)
      VALUES (${lineItemData.invoice_id}, ${lineItemData.description}, ${lineItemData.amount}, ${lineItemData.order_index})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating line item:', error);
    throw error;
  }
}

// Invoice numbering
export async function getNextInvoiceNumber(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  try {
    // Get or create sequence for this user/year
    const sequence = await sql`
      INSERT INTO invoice_sequences (user_id, year, last_number)
      VALUES (${userId}, ${currentYear}, 1)
      ON CONFLICT (user_id, year)
      DO UPDATE SET last_number = invoice_sequences.last_number + 1
      RETURNING last_number
    `;
    
    const nextNumber = sequence.rows[0].last_number;
    return `INV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    throw error;
  }
} 