import React, { useEffect, useState } from 'react';
import { MobileNavigation } from '../src/components/MobileNavigation';
import type { GlobalNotificationSettings, NotificationPolicy, DueNotification } from '../src/types/notifications';
import { evaluateDueNotifications } from '../src/lib/notifications/policy';
import type { Appeal } from './appeals';

// Industry-standard notification schedule for legal deadlines
// Tiered escalation: Planning (15-8d) → Action (7-4d) → Critical (3-0d)
const DEFAULTS: GlobalNotificationSettings = {
  email: { 
    channel: 'email', 
    enabled: true, 
    startDaysBefore: 15, 
    repeatEveryDays: null, 
    untilDaysBefore: -7, // Continue 7 days past deadline for overdue
    specificDays: [15, 10, 7, 5, 3, 2, 1, 0] // Key milestones
  },
  sms: { 
    channel: 'sms', 
    enabled: true, // SMS critical for urgent deadlines
    startDaysBefore: 7, // Only start SMS when it's urgent
    repeatEveryDays: null, 
    untilDaysBefore: -3, // Continue 3 days past deadline for overdue
    specificDays: [7, 5, 3, 2, 1, 0] // Urgent days only
  },
  globalContacts: { emails: [], phones: [] },
};

function loadSettings(): GlobalNotificationSettings {
  try {
    const raw = localStorage.getItem('notif_settings_v1');
    const parsed = raw ? JSON.parse(raw) : DEFAULTS;
    // Merge with defaults to ensure new fields exist
    return { ...DEFAULTS, ...parsed, globalContacts: parsed.globalContacts || DEFAULTS.globalContacts };
  } catch {
    return DEFAULTS;
  }
}
function saveSettings(s: GlobalNotificationSettings) {
  localStorage.setItem('notif_settings_v1', JSON.stringify(s));
}

function loadAppeals(): Appeal[] {
  try {
    const raw = localStorage.getItem('appeals_store_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function AdminNotificationsPage() {
  const [settings, setSettings] = useState<GlobalNotificationSettings>(DEFAULTS);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [preview, setPreview] = useState<DueNotification[]>([]);
  const [testPhone, setTestPhone] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    setSettings(loadSettings());
    setAppeals(loadAppeals());
  }, []);

  // Validates E.164 phone number format
  function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    if (!phone || phone.trim() === '') {
      return { valid: false, error: 'Phone number is required' };
    }
    
    // Must start with +
    if (!phone.startsWith('+')) {
      return { valid: false, error: 'Must start with + (e.g., +1 for US)' };
    }
    
    // E.164: +[country code][number] (max 15 digits after +)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phone)) {
      return { valid: false, error: 'Invalid format. Use E.164: +1234567890' };
    }
    
    return { valid: true };
  }

  async function sendTestSMS() {
    // Validate phone number
    const validation = validatePhoneNumber(testPhone);
    if (!validation.valid) {
      setTestStatus('error');
      setTestMessage(`Invalid phone number: ${validation.error}`);
      return;
    }
    
    setTestStatus('sending');
    setTestMessage('');
    
    try {
      const res = await fetch('/api/notifications/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhone })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`✅ Test SMS sent successfully!\n\nMessage SID: ${data.messageSid}\nStatus: ${data.status}\nTo: ${data.to}\nFrom: ${data.from}`);
      } else {
        setTestStatus('error');
        const errorDetails = data.details 
          ? `\n\nMissing credentials:\n${Object.entries(data.details).map(([k, v]) => `- ${k}: ${v ? '✓' : '✗'}`).join('\n')}`
          : '';
        setTestMessage(`❌ Failed: ${data.message || data.error}${errorDetails}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`❌ Network error: ${error}`);
    }
  }

  function daysLeft(appeal: Appeal) {
    const base = new Date(appeal.appealDeadline);
    const total = appeal.extensions.reduce((n, e) => n + (e.daysGranted || 0), 0);
    const eff = new Date(base);
    eff.setDate(eff.getDate() + total);
    const today = new Date();
    const ms = new Date(eff.getFullYear(), eff.getMonth(), eff.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  function onChangePolicy(channel: keyof GlobalNotificationSettings, patch: Partial<NotificationPolicy>) {
    if (channel === 'globalContacts') return; // Handled separately
    const next = { ...settings, [channel]: { ...settings[channel as 'email' | 'sms'], ...patch } } as GlobalNotificationSettings;
    setSettings(next);
    saveSettings(next);
  }

  function onChangeGlobalContacts(contacts: { emails: string[]; phones: string[] }) {
    const next = { ...settings, globalContacts: contacts };
    setSettings(next);
    saveSettings(next);
  }

  function runPreview() {
    setPreview(evaluateDueNotifications(appeals, settings, daysLeft));
  }

  async function sendNow() {
    const due = evaluateDueNotifications(appeals, settings, daysLeft);
    if (due.length === 0) return alert('No notifications due.');
    
    if (!confirm(`Send ${due.length} notifications now?`)) return;

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications: due }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      alert(`Triggered ${due.length} notifications.\nSuccess: ${result.successCount}\nFailed: ${result.failureCount}`);
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Failed to send notifications. See console for details.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications Admin</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <PolicyCard
            title="Email Settings"
            policy={settings.email}
            onChange={(p) => onChangePolicy('email', p)}
          />
          <PolicyCard
            title="SMS Settings"
            policy={settings.sms}
            onChange={(p) => onChangePolicy('sms', p)}
          />
        </div>

        <div className="mb-6">
          <ContactsCard 
            globalContacts={settings.globalContacts} 
            onChange={onChangeGlobalContacts} 
          />
        </div>

        {/* Test SMS Section */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">🧪 Test Twilio SMS Configuration</h3>
          <p className="text-sm text-gray-500 mb-3">
            Send a test message to verify your Twilio integration is working correctly.
          </p>
          
          {/* Configuration Checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm">
            <div className="font-medium text-blue-900 mb-2">📋 Required Environment Variables:</div>
            <ul className="text-blue-800 space-y-1 ml-4 list-disc">
              <li><code className="bg-blue-100 px-1 rounded">TWILIO_ACCOUNT_SID</code> - Your Account SID from Twilio Console</li>
              <li><code className="bg-blue-100 px-1 rounded">TWILIO_AUTH_TOKEN</code> - Your Auth Token from Twilio Console</li>
              <li><code className="bg-blue-100 px-1 rounded">TWILIO_FROM</code> - Your Twilio phone number (E.164 format)</li>
            </ul>
          </div>
          
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (E.164 format)
              </label>
              <input 
                type="tel"
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono" 
                placeholder="+15551234567"
                value={testPhone}
                onChange={(e) => {
                  setTestPhone(e.target.value);
                  if (testStatus !== 'idle') setTestStatus('idle');
                  if (testMessage) setTestMessage('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && sendTestSMS()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +[country code][number] (e.g., +1 for US, +44 for UK)
              </p>
            </div>
            <button 
              onClick={sendTestSMS}
              disabled={testStatus === 'sending'}
              className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testStatus === 'sending' ? '📤 Sending...' : '📤 Send Test SMS'}
            </button>
          </div>
          {testMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm whitespace-pre-line ${
              testStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              testStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-gray-50 text-gray-800'
            }`}>
              {testMessage}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button onClick={runPreview} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 bg-white">Preview Today</button>
          <button onClick={sendNow} className="rounded-lg bg-purple-600 text-white px-3 py-2 text-sm font-semibold hover:bg-purple-700">Send Now</button>
        </div>
        
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Due Today</h2>
          {preview.length === 0 ? (
            <div className="text-sm text-gray-500">No notifications due based on current settings.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {preview.map((n, idx) => (
                <li key={idx} className="flex items-start justify-between gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${n.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {n.channel.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{n.daysLeft}d left</span>
                    </div>
                    <div className="text-gray-800 mb-1">{n.message}</div>
                    <div className="text-gray-500 text-xs">
                      To: {n.recipients.join(', ') || <span className="text-red-500 italic">(No recipients configured)</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function PolicyCard({ title, policy, onChange }: { title: string; policy: NotificationPolicy; onChange: (p: Partial<NotificationPolicy>) => void }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={policy.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} />
          <span>Enabled</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <LabeledInput label="Start at ≤ days" type="number" value={policy.startDaysBefore} onChange={(v) => onChange({ startDaysBefore: Number(v) })} />
        <LabeledInput label="Repeat every days" type="number" value={policy.repeatEveryDays ?? ''} onChange={(v) => onChange({ repeatEveryDays: v === '' ? null : Number(v) })} />
        <LabeledInput label="Stop at < days" type="number" value={policy.untilDaysBefore} onChange={(v) => onChange({ untilDaysBefore: Number(v) })} />
        <LabeledInput label="Specific days (csv)" type="text" value={(policy.specificDays || []).join(',')} onChange={(v) => onChange({ specificDays: v.trim() ? v.split(',').map((x) => Number(x.trim())).filter((n) => !isNaN(n)) : [] })} />
      </div>
    </div>
  );
}

function ContactsCard({ globalContacts, onChange }: { globalContacts: { emails: string[]; phones: string[] }; onChange: (v: { emails: string[]; phones: string[] }) => void }) {
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const addEmail = () => {
    setEmailError('');
    if (!emailInput.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(emailInput)) {
      setEmailError('Invalid email format');
      return;
    }
    if (globalContacts.emails.includes(emailInput)) {
      setEmailError('Email already added');
      return;
    }
    onChange({ ...globalContacts, emails: [...globalContacts.emails, emailInput] });
    setEmailInput('');
  };

  const addPhone = () => {
    setPhoneError('');
    if (!phoneInput.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    if (!validatePhone(phoneInput)) {
      setPhoneError('Invalid format. Use E.164: +1234567890');
      return;
    }
    if (globalContacts.phones.includes(phoneInput)) {
      setPhoneError('Phone number already added');
      return;
    }
    onChange({ ...globalContacts, phones: [...globalContacts.phones, phoneInput] });
    setPhoneInput('');
  };

  const removeEmail = (email: string) => {
    onChange({ ...globalContacts, emails: globalContacts.emails.filter(e => e !== email) });
  };

  const removePhone = (phone: string) => {
    onChange({ ...globalContacts, phones: globalContacts.phones.filter(p => p !== phone) });
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Global Admin Recipients</h3>
      <p className="text-sm text-gray-500 mb-4">These contacts will receive a copy of ALL notifications sent by the system.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emails */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Emails</label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <input 
                className={`w-full rounded-lg border px-3 py-2 text-sm ${emailError ? 'border-red-300' : ''}`}
                placeholder="admin@example.com" 
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
            </div>
            <button onClick={addEmail} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1">
            {globalContacts.emails.length === 0 && <li className="text-xs text-gray-400 italic">No admin emails configured</li>}
            {globalContacts.emails.map(email => (
              <li key={email} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                <span className="truncate">{email}</span>
                <button onClick={() => removeEmail(email)} className="text-gray-400 hover:text-red-500 ml-2 text-lg">×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Phones (SMS)</label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <input 
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono ${phoneError ? 'border-red-300' : ''}`}
                placeholder="+15551234567" 
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && addPhone()}
              />
              {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
              {!phoneError && <p className="text-xs text-gray-500 mt-1">E.164 format: +[country code][number]</p>}
            </div>
            <button onClick={addPhone} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1">
            {globalContacts.phones.length === 0 && <li className="text-xs text-gray-400 italic">No admin phones configured</li>}
            {globalContacts.phones.map(phone => (
              <li key={phone} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                <span className="font-mono truncate">{phone}</span>
                <button onClick={() => removePhone(phone)} className="text-gray-400 hover:text-red-500 ml-2 text-lg">×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type }: { label: string; value: any; onChange: (v: string) => void; type: 'text' | 'number' }) {
  return (
    <label className="block">
      <span className="block text-gray-700 mb-1">{label}</span>
      <input className="w-full rounded-lg border px-3 py-2" type={type} value={value as any} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
