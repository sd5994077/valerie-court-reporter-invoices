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
    // For overdue appeals (negative days), send daily notifications
    else if (daysLeft < 0 && daysLeft >= policy.untilDaysBefore) {
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
  const trialNum = appeal.trialCourtCaseNumber || '';
  const isSMS = channel === 'sms';
  
  // Calculate effective deadline for display
  const baseDeadline = new Date(appeal.appealDeadline);
  const totalExtDays = appeal.extensions.reduce((n, e) => n + (e.daysGranted || 0), 0);
  const effDeadline = new Date(baseDeadline);
  effDeadline.setDate(effDeadline.getDate() + totalExtDays);
  const deadlineStr = effDeadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  
  // Overdue - EMERGENCY
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    if (isSMS) {
      return `🚨 OVERDUE: "${style}" (${courtNum}) - ${overdueDays}d past deadline! Due: ${deadlineStr}. Immediate action required.`;
    }
    return `🚨 EMERGENCY: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) is ${overdueDays} day${overdueDays > 1 ? 's' : ''} PAST DEADLINE.\n\nDeadline was: ${deadlineStr}\n\nImmediate action required.`;
  }
  
  // Deadline day - URGENT
  if (daysLeft === 0) {
    if (isSMS) {
      return `⚠️ TODAY: "${style}" (${courtNum}) deadline is TODAY ${deadlineStr}! Submit now.`;
    }
    return `⚠️ URGENT: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) deadline is TODAY!\n\nDeadline: ${deadlineStr}\n\nSubmit immediately.`;
  }
  
  // Tomorrow - HIGH PRIORITY
  if (daysLeft === 1) {
    if (isSMS) {
      return `⚠️ TOMORROW: "${style}" (${courtNum}) due ${deadlineStr}. Final prep day!`;
    }
    return `⚠️ HIGH PRIORITY: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) deadline is TOMORROW.\n\nDeadline: ${deadlineStr}\n\nThis is your final preparation day.`;
  }
  
  // Critical window (2-3 days) - CRITICAL
  if (daysLeft <= 3) {
    if (isSMS) {
      return `🔴 CRITICAL: "${style}" (${courtNum}) - ${daysLeft}d left. Due: ${deadlineStr}`;
    }
    return `🔴 CRITICAL: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) - Only ${daysLeft} days remaining.\n\nDeadline: ${deadlineStr}\n\nComplete and submit soon.`;
  }
  
  // Action window (4-7 days) - ACTION REQUIRED
  if (daysLeft <= 7) {
    if (isSMS) {
      return `📋 ACTION: "${style}" (${courtNum}) - ${daysLeft}d left. Due: ${deadlineStr}`;
    }
    return `📋 ACTION REQUIRED: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) - ${daysLeft} days until deadline.\n\nDeadline: ${deadlineStr}\n\nBegin final review and preparation.`;
  }
  
  // Planning window (8-15 days) - REMINDER
  if (isSMS) {
    return `📅 Reminder: "${style}" (${courtNum}) - ${daysLeft}d left. Due: ${deadlineStr}`;
  }
  return `📅 REMINDER: Appeal "${style}" (COA #${courtNum}${trialNum ? `, Trial #${trialNum}` : ''}) - ${daysLeft} days until deadline.\n\nDeadline: ${deadlineStr}\n\nPlan your schedule accordingly.`;
}
