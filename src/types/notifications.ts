export type NotificationChannel = 'email' | 'sms';

export interface NotificationPolicy {
  channel: NotificationChannel;
  enabled: boolean;
  startDaysBefore: number; // when to start sending relative to effective deadline
  repeatEveryDays: number | null; // null means no repeat
  untilDaysBefore: number; // stop repeating when daysLeft < untilDaysBefore
  specificDays?: number[]; // optional fixed milestones e.g., [15, 7, 3, 1]
  quietHours?: {
    start: string; // '21:00'
    end: string; // '08:00'
    timezone: string; // e.g., 'America/Chicago'
  };
}

export interface GlobalNotificationSettings {
  email: NotificationPolicy;
  sms: NotificationPolicy;
  globalContacts: {
    emails: string[]; // List of admin emails that receive all notifications
    phones: string[]; // List of admin phones that receive all notifications
  };
}

export interface DueNotification {
  appealId: string;
  channel: NotificationChannel;
  daysLeft: number;
  message: string;
  recipients: string[]; // List of target addresses/numbers
}

