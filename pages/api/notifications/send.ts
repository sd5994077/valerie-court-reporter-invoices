import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail, sendSMS } from '../../../src/lib/notifications/providers';
import type { DueNotification } from '../../../src/types/notifications';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const notifications: DueNotification[] = req.body.notifications;

    if (!Array.isArray(notifications)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const results = await Promise.allSettled(
      notifications.map(async (n) => {
        if (n.channel === 'email') {
          await sendEmail(n);
        } else if (n.channel === 'sms') {
          await sendSMS(n);
        }
        return n;
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    res.status(200).json({ 
      success: true, 
      processed: results.length,
      successCount,
      failureCount
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}


