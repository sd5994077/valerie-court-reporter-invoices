import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { invoiceId, status } = req.body;

    if (!invoiceId || !status) {
      return res.status(400).json({ message: 'Invoice ID and status are required' });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'overdue', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update invoice status in database
    const result = await sql`
      UPDATE invoices 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({ 
      message: 'Invoice status updated successfully',
      invoice: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ 
      message: 'Failed to update invoice status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 