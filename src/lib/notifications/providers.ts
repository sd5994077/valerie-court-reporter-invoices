import twilio from 'twilio';
import type { DueNotification } from '../../types/notifications';

/**
 * Validates phone number format (E.164: +[country code][number])
 * Returns true if valid, false otherwise
 */
function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[1-3 digit country code][up to 15 digits]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Truncates SMS message to fit within character limits
 * - Single SMS: 160 chars (GSM-7) or 70 chars (UCS-2/Unicode)
 * - We use 155 chars to be safe and add "..." if truncated
 */
function truncateSMSMessage(message: string, maxLength: number = 155): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Send email notification
 * 
 * TODO: Replace with real email provider (Resend or SendGrid)
 * 
 * Setup instructions:
 * 1. For Resend: Get API key from https://resend.com, add RESEND_API_KEY to .env
 * 2. For SendGrid: Get API key from https://sendgrid.com, add SENDGRID_API_KEY to .env
 * 3. Replace this function with actual API call
 */
export async function sendEmail(notification: DueNotification): Promise<void> {
  // STUB: Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[EMAIL STUB] Would send email:', {
      to: notification.recipients,
      subject: `Appeal Deadline Reminder: ${notification.daysLeft} days left`,
      body: notification.message
    });
  }

  // TODO: Implement real email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'notifications@yourdomain.com',
  //   to: notification.recipients,
  //   subject: `Appeal Deadline Reminder: ${notification.daysLeft} days left`,
  //   html: `<p>${notification.message}</p>`
  // });

  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: recipientEmail,
  //   from: 'notifications@yourdomain.com',
  //   subject: `Appeal Deadline Reminder: ${notification.daysLeft} days left`,
  //   text: notification.message
  // });
}

/**
 * Send SMS notification via Twilio
 * 
 * Features:
 * - Phone number validation (E.164 format)
 * - Message truncation for SMS length limits
 * - Batch sending with error tracking
 * - Cost logging for budget tracking
 * 
 * Required env vars:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_FROM: Your Twilio phone number (E.164 format, e.g., +15551234567)
 */
export async function sendSMS(notification: DueNotification): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM;

  // Validate Twilio credentials
  if (!accountSid || !authToken || !fromNumber) {
    const missingVars = [];
    if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
    if (!fromNumber) missingVars.push('TWILIO_FROM');
    
    console.error(`[SMS] Missing Twilio credentials: ${missingVars.join(', ')}`);
    throw new Error(`Twilio not configured. Missing: ${missingVars.join(', ')}`);
  }

  // Validate and filter recipients
  const validRecipients = notification.recipients.filter(phone => {
    const isValid = isValidPhoneNumber(phone);
    if (!isValid) {
      console.warn(`[SMS] Invalid phone number format (must be E.164): ${phone}`);
    }
    return isValid;
  });

  if (validRecipients.length === 0) {
    console.warn('[SMS] No valid recipients after validation');
    return;
  }

  // Truncate message if needed
  const message = truncateSMSMessage(notification.message);
  if (message !== notification.message) {
    console.info(`[SMS] Message truncated from ${notification.message.length} to ${message.length} chars`);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SMS DEV] Would send SMS:', {
      to: validRecipients,
      message: message,
      charCount: message.length
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    
    // Send to all valid recipients with individual error tracking
    const results = await Promise.allSettled(
      validRecipients.map(async (recipient) => {
        try {
          const msg = await client.messages.create({
            body: message,
            from: fromNumber,
            to: recipient
          });
          
          // Log success with message SID for tracking
          console.log(`[SMS] ✓ Sent to ${recipient} - SID: ${msg.sid} - Status: ${msg.status}`);
          return { success: true, recipient, sid: msg.sid };
        } catch (err: any) {
          console.error(`[SMS] ✗ Failed to ${recipient} - Error: ${err.message}`);
          throw err;
        }
      })
    );
    
    // Calculate success/failure counts
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[SMS] Batch complete: ${successful} sent, ${failed} failed (${validRecipients.length} total)`);
    
    // Log estimated cost (approximate: $0.0079/SMS for US)
    const estimatedCost = successful * 0.0079;
    console.info(`[SMS] Estimated cost: $${estimatedCost.toFixed(4)} USD`);
    
    // If any failed, throw error with details
    if (failed > 0) {
      const failedRecipients = results
        .map((r, idx) => r.status === 'rejected' ? validRecipients[idx] : null)
        .filter(Boolean);
      throw new Error(`SMS failed for ${failed} recipient(s): ${failedRecipients.join(', ')}`);
    }
    
  } catch (error: any) {
    console.error('[SMS] Error sending notifications:', error);
    throw error;
  }
}

