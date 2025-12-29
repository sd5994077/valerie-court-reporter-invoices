import React, { useEffect, useState } from 'react';
import { MobileNavigation } from '../src/components/MobileNavigation';
import type { GlobalNotificationSettings, NotificationPolicy, DueNotification } from '../src/types/notifications';
import { evaluateDueNotifications } from '../src/lib/notifications/policy';
import { sendEmail, sendSMS } from '../src/lib/notifications/providers';
import type { Appeal } from './appeals';

const DEFAULTS: GlobalNotificationSettings = {
  email: { channel: 'email', enabled: true, startDaysBefore: 15, repeatEveryDays: null, untilDaysBefore: 0, specificDays: [15, 7, 3, 1] },
  sms: { channel: 'sms', enabled: false, startDaysBefore: 7, repeatEveryDays: 2, untilDaysBefore: 0 },
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

  useEffect(() => {
    setSettings(loadSettings());
    setAppeals(loadAppeals());
  }, []);

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

    for (const n of due) {
      if (n.channel === 'email') await sendEmail(n);
      if (n.channel === 'sms') await sendSMS(n);
    }
    alert(`Triggered ${due.length} notifications (logged to console in dev).`);
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

  const addEmail = () => {
    if (!emailInput) return;
    onChange({ ...globalContacts, emails: [...globalContacts.emails, emailInput] });
    setEmailInput('');
  };

  const addPhone = () => {
    if (!phoneInput) return;
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
            <input 
              className="flex-1 rounded-lg border px-3 py-2 text-sm" 
              placeholder="admin@example.com" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEmail()}
            />
            <button onClick={addEmail} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200">Add</button>
          </div>
          <ul className="space-y-1">
            {globalContacts.emails.length === 0 && <li className="text-xs text-gray-400 italic">No admin emails configured</li>}
            {globalContacts.emails.map(email => (
              <li key={email} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                <span>{email}</span>
                <button onClick={() => removeEmail(email)} className="text-gray-400 hover:text-red-500">×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Phones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Phones (SMS)</label>
          <div className="flex gap-2 mb-2">
            <input 
              className="flex-1 rounded-lg border px-3 py-2 text-sm" 
              placeholder="+15550000000" 
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPhone()}
            />
            <button onClick={addPhone} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200">Add</button>
          </div>
          <ul className="space-y-1">
            {globalContacts.phones.length === 0 && <li className="text-xs text-gray-400 italic">No admin phones configured</li>}
            {globalContacts.phones.map(phone => (
              <li key={phone} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                <span>{phone}</span>
                <button onClick={() => removePhone(phone)} className="text-gray-400 hover:text-red-500">×</button>
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
