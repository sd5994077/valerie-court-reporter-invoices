import type { DueNotification } from '../../types/notifications';

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
 * Send SMS notification
 * 
 * TODO: Replace with real SMS provider (Twilio)
 * 
 * Setup instructions:
 * 1. Get Twilio account from https://www.twilio.com
 * 2. Add to .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (phone number)
 * 3. Replace this function with actual API call
 */
export async function sendSMS(notification: DueNotification): Promise<void> {
  // STUB: Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SMS STUB] Would send SMS:', {
      to: notification.recipients,
      message: notification.message
    });
  }

  // TODO: Implement real SMS sending
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(
  //   process.env.TWILIO_ACCOUNT_SID,
  //   process.env.TWILIO_AUTH_TOKEN
  // );
  // for (const recipient of notification.recipients) {
  //   await client.messages.create({
  //     body: notification.message,
  //     from: process.env.TWILIO_FROM,
  //     to: recipient
  //   });
  // }
}

