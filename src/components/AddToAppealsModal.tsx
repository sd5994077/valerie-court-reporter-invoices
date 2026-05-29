import React, { useState } from 'react';
import { safeGetFromStorage, safeSetToStorage } from '../utils/storage';
import { logger } from '../utils/logger';

const APPEALS_KEY = 'appeals_store_v1';

const STATUS_OPTIONS = ['Intake', 'Active', 'Scope', 'Proofread', 'Awaiting Extension', 'Submitted', 'Completed', 'Archived'] as const;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') return { valid: true };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address (e.g., name@example.com)' };
  }
  return { valid: true };
}

export interface AppealPrefill {
  invoiceRef: string;
  requesterName: string;
  trialCourtCaseNumber: string;
  courtOfAppealsNumber: string;
  style: string;
}

interface Props {
  prefill: AppealPrefill;
  onClose: () => void;
  onSaved: () => void;
}

export function AddToAppealsModal({ prefill, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    requesterName: prefill.requesterName,
    requesterEmail: '',
    requesterPhone: '',
    requesterAddress: '',
    courtOfAppealsNumber: prefill.courtOfAppealsNumber,
    trialCourtCaseNumber: prefill.trialCourtCaseNumber,
    style: prefill.style,
    appealDeadline: '',
    status: 'Intake' as typeof STATUS_OPTIONS[number],
    notes: '',
  });
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  function handleEmailChange(value: string) {
    setForm({ ...form, requesterEmail: value });
    const v = validateEmail(value);
    setEmailError(v.valid ? undefined : v.error);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appealDeadline) {
      alert('Please set an appeal deadline.');
      return;
    }
    const emailValidation = validateEmail(form.requesterEmail);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error);
      return;
    }

    const now = new Date().toISOString();
    const newAppeal = {
      id: uid(),
      requesterName: form.requesterName,
      requesterEmail: form.requesterEmail || undefined,
      requesterPhone: form.requesterPhone || undefined,
      requesterAddress: form.requesterAddress,
      courtOfAppealsNumber: form.courtOfAppealsNumber,
      trialCourtCaseNumber: form.trialCourtCaseNumber,
      style: form.style,
      appealDeadline: form.appealDeadline,
      status: form.status,
      extensions: [],
      notes: form.notes || undefined,
      invoiceRef: prefill.invoiceRef,
      createdAt: now,
      updatedAt: now,
    };

    const existing = safeGetFromStorage<object[]>({ key: APPEALS_KEY, defaultValue: [], validator: (d) => Array.isArray(d) });
    const success = safeSetToStorage(APPEALS_KEY, [newAppeal, ...existing]);
    if (!success) {
      logger.error('Failed to save appeal from dashboard modal');
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto overscroll-contain"
      style={{ touchAction: 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[95vw] sm:max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-x-hidden"
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold">New Appeal</h3>
            {prefill.invoiceRef && (
              <p className="text-xs text-purple-600 mt-0.5">From Invoice #{prefill.invoiceRef}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form — matches AppealForm grid exactly */}
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">

          <TF label="Requester Name" value={form.requesterName} onChange={(v) => setForm({ ...form, requesterName: v })} />
          <TF label="Requester Email" type="email" value={form.requesterEmail} onChange={handleEmailChange} error={emailError} />
          <TF label="Requester Phone" type="tel" value={form.requesterPhone} onChange={(v) => setForm({ ...form, requesterPhone: v })} />
          <TF label="Requester Address" value={form.requesterAddress} onChange={(v) => setForm({ ...form, requesterAddress: v })} />
          <TF label="COA #" value={form.courtOfAppealsNumber} onChange={(v) => setForm({ ...form, courtOfAppealsNumber: v })} />
          <TF label="Trial Court Case Number" value={form.trialCourtCaseNumber} onChange={(v) => setForm({ ...form, trialCourtCaseNumber: v })} />
          <TF label="Style (e.g., First Last vs The State of Texas)" value={form.style} onChange={(v) => setForm({ ...form, style: v })} className="sm:col-span-2" />

          {/* Appeal Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appeal Deadline</label>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={form.appealDeadline}
              onChange={(e) => setForm({ ...form, appealDeadline: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof STATUS_OPTIONS[number] })}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Local TextField matching AppealForm's TextField component
function TF({ label, value, onChange, className, type = 'text', error }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: 'text' | 'email' | 'tel';
  error?: string;
}) {
  const phonePattern = type === 'tel' ? '[0-9]{3}-?[0-9]{3}-?[0-9]{4}' : undefined;
  const placeholder = type === 'tel' ? '123-456-7890' : type === 'email' ? 'name@example.com' : undefined;
  return (
    <div className={`min-w-0 ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        pattern={phonePattern}
        placeholder={placeholder}
        className={`w-full max-w-full rounded-lg border px-3 py-2 ${error ? 'border-red-500' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={type === 'tel' ? 'Phone format: 123-456-7890 or 1234567890' : type === 'email' ? 'Enter a valid email address' : undefined}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
