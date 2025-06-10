import type { NextApiRequest, NextApiResponse } from 'next';
import { getInvoicesByUser, getUserByEmail, createUser } from '../../../src/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userEmail = req.query.email as string || 'demo@example.com';

    // Get or create user
    let user = await getUserByEmail(userEmail);
    if (!user) {
      user = await createUser({
        email: userEmail,
        name: userEmail.split('@')[0],
        profession_type: 'court_reporter'
      });
    }

    // Get invoices for user
    const invoices = await getInvoicesByUser(user.id);

    // Transform to match the frontend format
    const transformedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      date: invoice.date,
      dueDate: invoice.date, // Using same date as dueDate for now
      finalizedAt: invoice.created_at,
      status: invoice.status,
      manualClient: {
        name: invoice.client_name,
        company: invoice.client_company
      },
      customFields: {
        county: invoice.county,
        caseName: invoice.case_name
      },
      lineItems: invoice.line_items ? invoice.line_items
        .filter((item: any) => item.id) // Filter out null items
        .map((item: any) => ({
          number: item.order_index + 1,
          description: item.description,
          quantity: 1, // Default quantity
          rate: item.amount // Amount is already calculated
        })) : [],
      pdfGenerated: false
    }));

    res.status(200).json({ 
      message: 'Invoices retrieved successfully',
      invoices: transformedInvoices
    });

  } catch (error) {
    console.error('Error retrieving invoices:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 