import type { NextApiRequest, NextApiResponse } from 'next';
import { createInvoice, createLineItem, createUser, getUserByEmail, getNextInvoiceNumber } from '../../../src/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { invoiceData, userEmail = 'demo@example.com' } = req.body;

    // Get or create user
    let user = await getUserByEmail(userEmail);
    if (!user) {
      user = await createUser({
        email: userEmail,
        name: userEmail.split('@')[0],
        profession_type: 'court_reporter'
      });
    }

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber(user.id);

    // Calculate total amount
    const totalAmount = invoiceData.lineItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0
    );

    // Create invoice with all client information
    const invoice = await createInvoice({
      user_id: user.id,
      invoice_number: invoiceNumber,
      date: invoiceData.date,
      client_name: invoiceData.manualClient?.name || 'Unknown Client',
      client_company: invoiceData.manualClient?.company || null,
      client_address: invoiceData.manualClient?.address || null,
      client_email: invoiceData.manualClient?.email || null,
      client_phone: invoiceData.manualClient?.phone || null,
      case_name: invoiceData.customFields?.caseName || null,
      county: invoiceData.customFields?.county || null,
      total_amount: totalAmount,
      tax_amount: 0, // Court reporters typically don't charge tax
      status: 'pending', // Invoice is finalized but awaiting payment
      notes: invoiceData.notes || null,
      finalized_at: new Date().toISOString()
    });

    // Create line items
    for (let i = 0; i < invoiceData.lineItems.length; i++) {
      const item = invoiceData.lineItems[i];
      await createLineItem({
        invoice_id: invoice.id,
        description: item.description,
        amount: item.quantity * item.rate,
        order_index: i
      });
    }

    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoice: {
        ...invoice,
        invoiceNumber
      }
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      message: 'Failed to create invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 