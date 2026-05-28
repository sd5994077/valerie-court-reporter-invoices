import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureInvoiceColumns, ensureLineItemColumns, sql } from '../../../src/lib/db';
import type { InvoiceFormData } from '../../../src/types/invoice';

type SaveInvoiceRequest = InvoiceFormData & {
  id?: string;
  status?: 'pending' | 'completed' | 'overdue' | 'closed';
  finalizedAt?: string;
  pdfGenerated?: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await ensureInvoiceColumns();
    await ensureLineItemColumns();

    const payload = req.body as SaveInvoiceRequest;
    const invoiceNumber = payload?.invoiceNumber?.trim();

    if (!invoiceNumber) {
      return res.status(400).json({ success: false, error: 'invoiceNumber is required' });
    }

    const duplicateCheck = await sql`
      SELECT id FROM invoices WHERE invoice_number = ${invoiceNumber} LIMIT 1
    `;
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: `Invoice number ${invoiceNumber} already exists in database` });
    }

    const date = payload.date;
    const dueDate = payload.dueDate || payload.date;
    const customFields = payload.customFields || {};
    const clientName =
      payload.manualClient?.name?.trim() ||
      customFields.causeNumber ||
      customFields.coaNum ||
      'Unknown Client';

    const totalAmount = (payload.lineItems || []).reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return sum + quantity * rate;
    }, 0);

    const insertInvoice = await sql`
      INSERT INTO invoices (
        invoice_number,
        date,
        due_date,
        client_name,
        client_company,
        client_address,
        client_email,
        client_phone,
        case_name,
        COA_NUM,
        cause_number,
        county,
        date_of_hearing,
        service_type,
        description,
        comments,
        total_amount,
        status,
        notes,
        pdf_generated,
        finalized_at
      ) VALUES (
        ${invoiceNumber},
        ${date},
        ${dueDate},
        ${clientName},
        ${payload.manualClient?.company || null},
        ${payload.manualClient?.address || null},
        ${payload.manualClient?.email || null},
        ${payload.manualClient?.phone || null},
        ${customFields.caseName || null},
        ${customFields.coaNum || null},
        ${customFields.causeNumber || null},
        ${customFields.county || null},
        ${customFields.dateOfHearing || null},
        ${customFields.serviceType === 'Other' ? (customFields.serviceTypeOther || 'Other') : (customFields.serviceType || null)},
        ${customFields.description || null},
        ${customFields.comments || null},
        ${totalAmount},
        ${payload.status || 'pending'},
        ${payload.notes || null},
        ${!!payload.pdfGenerated},
        ${payload.finalizedAt || new Date().toISOString()}
      )
      RETURNING id
    `;

    const invoiceId = insertInvoice.rows[0]?.id;

    if (invoiceId && Array.isArray(payload.lineItems) && payload.lineItems.length > 0) {
      for (let i = 0; i < payload.lineItems.length; i += 1) {
        const item = payload.lineItems[i];
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const amount = quantity * rate;

        await sql`
          INSERT INTO line_items (
            invoice_id,
            item_number,
            description,
            quantity,
            rate,
            amount,
            order_index
          ) VALUES (
            ${invoiceId},
            ${item.number || i + 1},
            ${item.description || ''},
            ${quantity},
            ${rate},
            ${amount},
            ${i}
          )
        `;
      }
    }

    return res.status(200).json({ success: true, invoiceId });
  } catch (error) {
    console.error('Failed to save invoice to database:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
