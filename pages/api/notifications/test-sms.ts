import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

/**
 * Test SMS endpoint - sends a test message to verify Twilio configuration
 * POST /api/notifications/test-sms
 * Body: { phoneNumber: "+1234567890" }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM;

  // Check if credentials are configured
  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ 
      message: 'Twilio credentials not configured',
      details: {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasFromNumber: !!fromNumber
      }
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    
    const message = await client.messages.create({
      body: `✅ Valerie Court Reporter Invoice System - SMS Test\n\nThis is a test message to verify your notification system is working correctly.\n\nSent: ${new Date().toLocaleString()}`,
      from: fromNumber,
      to: phoneNumber
    });

    res.status(200).json({ 
      success: true, 
      messageSid: message.sid,
      to: phoneNumber,
      from: fromNumber,
      status: message.status
    });
  } catch (error: any) {
    console.error('Twilio test SMS error:', error);
    res.status(500).json({ 
      message: 'Failed to send test SMS',
      error: error.message || String(error),
      code: error.code
    });
  }
}


