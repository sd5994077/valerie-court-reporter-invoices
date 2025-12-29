import type { Appeal } from '../../../pages/appeals';
import type { GlobalNotificationSettings, DueNotification } from '../../types/notifications';

/**
 * Evaluates which notifications should be sent today based on appeal deadlines and notification policies
 */
export function evaluateDueNotifications(
  appeals: Appeal[],
  settings: GlobalNotificationSettings,
  daysLeftFn: (appeal: Appeal) => number
): DueNotification[] {
  const due: DueNotification[] = [];

  for (const appeal of appeals) {
    // Skip archived and completed appeals
    if (appeal.status === 'Archived' || appeal.status === 'Completed') {
      continue;
    }

    const daysLeft = daysLeftFn(appeal);
    
    // Check email notifications
    if (settings.email.enabled) {
      const emailNotifs = evaluatePolicy(
        appeal, 
        settings.email, 
        daysLeft, 
        'email', 
        settings.globalContacts?.emails || []
      );
      due.push(...emailNotifs);
    }

    // Check SMS notifications
    if (settings.sms.enabled) {
      const smsNotifs = evaluatePolicy(
        appeal, 
        settings.sms, 
        daysLeft, 
        'sms', 
        settings.globalContacts?.phones || []
      );
      due.push(...smsNotifs);
    }
  }

  return due;
}

function evaluatePolicy(
  appeal: Appeal,
  policy: import('../../types/notifications').NotificationPolicy,
  daysLeft: number,
  channel: 'email' | 'sms',
  globalRecipients: string[]
): DueNotification[] {
  const notifications: DueNotification[] = [];

  // Must be within the start window
  if (daysLeft > policy.startDaysBefore) {
    return notifications;
  }

  // Must be past the stop threshold
  if (daysLeft < policy.untilDaysBefore) {
    return notifications;
  }

  // Determine recipients
  const recipients = [...globalRecipients];
  if (channel === 'email' && appeal.requesterEmail) {
    recipients.push(appeal.requesterEmail);
  }
  if (channel === 'sms' && appeal.requesterPhone) {
    recipients.push(appeal.requesterPhone);
  }
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

  // Helper to add notification
  const addNotif = () => {
    notifications.push({
      appealId: appeal.id,
      channel,
      daysLeft,
      message: formatMessage(appeal, daysLeft, channel),
      recipients: uniqueRecipients
    });
  };

  // Check specific milestone days (e.g., [15, 7, 3, 1])
  if (policy.specificDays && policy.specificDays.length > 0) {
    if (policy.specificDays.includes(daysLeft)) {
      addNotif();
    }
    return notifications;
  }

  // Check repeat interval
  if (policy.repeatEveryDays !== null && policy.repeatEveryDays > 0) {
    // Calculate if today is a repeat day
    const daysSinceStart = policy.startDaysBefore - daysLeft;
    if (daysSinceStart >= 0 && daysSinceStart % policy.repeatEveryDays === 0) {
      addNotif();
    }
  }

  return notifications;
}

function formatMessage(appeal: Appeal, daysLeft: number, channel: 'email' | 'sms'): string {
  const style = appeal.style || 'Untitled Case';
  const courtNum = appeal.courtOfAppealsNumber || 'N/A';
  
  if (daysLeft < 0) {
    return `${channel === 'email' ? 'URGENT: ' : ''}Appeal "${style}" (${courtNum}) is ${Math.abs(daysLeft)} days past deadline!`;
  } else if (daysLeft === 0) {
    return `${channel === 'email' ? 'URGENT: ' : ''}Appeal "${style}" (${courtNum}) deadline is TODAY!`;
  } else if (daysLeft === 1) {
    return `Appeal "${style}" (${courtNum}) deadline is TOMORROW (${daysLeft} day left)`;
  } else {
    return `Appeal "${style}" (${courtNum}) deadline in ${daysLeft} days`;
  }
}
