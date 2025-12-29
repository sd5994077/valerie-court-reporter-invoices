// pages/appeals.tsx
// Standalone Trello‑style Appeals Board + Deadline Dashboard
// Tech: React (Next.js page), Tailwind CSS, localStorage persistence, no external DnD lib
// You can later refactor into separate components/files; this single‑file version is easy to drop into Cursor now.

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ===== Types =====
export type AppealStatus =
  | "Intake"
  | "Active"
  | "Scope"
  | "Proofread"
  | "Awaiting Extension"
  | "Submitted"
  | "Completed"
  | "Archived";

export interface ExtensionEntry {
  id: string;
  requestedOn: string; // ISO date
  daysGranted: number; // usually 30
}

export interface Appeal {
  id: string;
  requesterName: string;
  requesterAddress: string;
  courtOfAppealsNumber: string;
  trialCourtCaseNumber: string;
  style: string; // e.g., "First Last vs The State of Texas"
  appealDeadline: string; // ISO date (original deadline)
  status: AppealStatus;
  extensions: ExtensionEntry[]; // up to 3
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ===== Utilities =====
const STORAGE_KEY = "appeals_store_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseISO(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function effectiveDeadline(appeal: Appeal): Date {
  const base = parseISO(appeal.appealDeadline);
  const totalExt = appeal.extensions.reduce((n, e) => n + (e.daysGranted || 0), 0);
  return addDays(base, totalExt);
}

function daysLeft(appeal: Appeal): number {
  return daysBetween(new Date(), effectiveDeadline(appeal));
}

function bucket(days: number): "lt7" | "8to15" | "gt15" | "past" {
  if (days < 0) return "past";
  if (days <= 7) return "lt7";
  if (days <= 15) return "8to15";
  return "gt15";
}

function getBorderClass(appeal: Appeal) {
  if (appeal.status === "Completed" || appeal.status === "Archived") return "border-gray-200";
  if (appeal.extensions.length >= 3) return "border-pink-300";
  const d = daysLeft(appeal);
  if (d < 0 || d <= 7) return "border-red-300";
  if (d <= 15) return "border-yellow-300";
  return "border-emerald-300";
}

function getBackgroundClass(appeal: Appeal) {
  if (appeal.status === "Completed" || appeal.status === "Archived") return "bg-white";
  if (appeal.extensions.length >= 3) return "bg-pink-50";
  return "bg-white";
}

function computeExtensionTimeline(appeal: Appeal) {
  const base = parseISO(appeal.appealDeadline);
  const steps: { label: string; date: Date; added: number }[] = [];
  let current = new Date(base);
  appeal.extensions.forEach((ext, idx) => {
    current = addDays(current, ext.daysGranted || 0);
    steps.push({ label: `Extension ${idx + 1}`, date: new Date(current), added: ext.daysGranted || 0 });
  });
  return { base, steps, final: current };
}

function saveStore(items: Appeal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadStore(): Appeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Appeal[]) : [];
  } catch {
    return [];
  }
}

const STATUS_OPTIONS: AppealStatus[] = [
  "Intake",
  "Active",
  "Scope",
  "Proofread",
  "Awaiting Extension",
  "Submitted",
  "Completed",
  "Archived",
];

// ===== Page Component =====
export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appeal | null>(null);
  const draggingRef = useRef<string | null>(null);

  useEffect(() => {
    setAppeals(loadStore());
  }, []);

  useEffect(() => {
    saveStore(appeals);
  }, [appeals]);

  const stats = useMemo(() => {
    const byBucket = { lt7: 0, "8to15": 0, gt15: 0, past: 0 } as Record<string, number>;
    const byStatus: Record<AppealStatus, number> = {
      Intake: 0,
      Active: 0,
      Scope: 0,
      Proofread: 0,
      "Awaiting Extension": 0,
      Submitted: 0,
      Completed: 0,
      Archived: 0,
    };
    appeals.forEach((a) => {
      const d = daysLeft(a);
      byBucket[bucket(d)]++;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    return { byBucket, byStatus, total: appeals.length };
  }, [appeals]);

  const columns: AppealStatus[] = [
    "Intake",
    "Active",
    "Scope",
    "Proofread",
    "Awaiting Extension",
    "Submitted",
    "Completed",
    "Archived",
  ];

  function createAppeal(a: Omit<Appeal, "id" | "createdAt" | "updatedAt" | "extensions" | "status"> & { status?: AppealStatus }) {
    const now = new Date().toISOString();
    const newA: Appeal = {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      extensions: [],
      status: a.status || "Intake",
      ...a,
    };
    setAppeals((list) => [newA, ...list]);
    setShowForm(false);
  }

  function updateAppeal(id: string, patch: Partial<Appeal>) {
    setAppeals((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const now = new Date().toISOString();
        const next: Appeal = { ...a, ...patch, updatedAt: now };
        if (patch.status && patch.status !== a.status) {
          if (patch.status === "Completed" && !a.completedAt) {
            next.completedAt = now;
          }
        }
        return next;
      })
    );
  }

  function deleteAppeal(id: string) {
    setAppeals((list) => list.filter((a) => a.id !== id));
  }

  function addExtension(id: string, days: number = 30) {
    setAppeals((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        if (a.extensions.length >= 3) return a;
        const entry: ExtensionEntry = { id: uid(), requestedOn: new Date().toISOString(), daysGranted: days };
        return { ...a, extensions: [...a.extensions, entry], updatedAt: new Date().toISOString() };
      })
    );
  }

  // ===== Drag & Drop (native) =====
  function onDragStart(e: React.DragEvent, id: string) {
    draggingRef.current = id;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent, status: AppealStatus) {
    e.preventDefault();
    const id = draggingRef.current || e.dataTransfer.getData("text/plain");
    if (id) updateAppeal(id, { status });
    draggingRef.current = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Nav placeholder — integrate your MobileNavigation later */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-bold">A</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appeals Board</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Trello‑style workflow + deadline tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(true)} className="rounded-xl bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700">
              New Appeal
            </button>
            <Link href="/">
              <button className="rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Home</button>
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Appeals" value={stats.total} />
          <BucketCard label="0–7 days left" value={stats.byBucket.lt7} tone="urgent" />
          <BucketCard label="8–15 days left" value={stats.byBucket["8to15"]} tone="warn" />
          <BucketCard label="> 15 days left" value={stats.byBucket.gt15} tone="ok" />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-8 gap-2 text-sm">
          {Object.entries(stats.byStatus).map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-white p-2 text-center">
              <div className="text-xs text-gray-500">{k}</div>
              <div className="text-lg font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
          {columns.map((col) => (
            <div
              key={col}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col)}
              className="rounded-2xl bg-gray-100 p-3 md:p-4 shadow-inner min-h-[320px]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">{col}</h3>
                <span className="text-xs text-gray-500">{appeals.filter((a) => a.status === col).length}</span>
              </div>
              <div className="space-y-3">
                {appeals
                  .filter((a) => a.status === col)
                  .sort((a, b) => daysLeft(a) - daysLeft(b))
                  .map((a) => (
                    col === "Completed" || col === "Archived" ? (
                      <CompactCard key={a.id} appeal={a} onDelete={() => deleteAppeal(a.id)} onEdit={() => setEditing(a)} />
                    ) : (
                      <AppealCard
                        key={a.id}
                        appeal={a}
                        onDragStart={onDragStart}
                        onDelete={() => deleteAppeal(a.id)}
                        onAddExtension={() => addExtension(a.id)}
                        onUpdate={(p) => updateAppeal(a.id, p)}
                        onEdit={() => setEditing(a)}
                      />
                    )
                  ))}
                {appeals.filter((a) => a.status === col).length === 0 && (
                  <div className="text-sm text-gray-500 py-6 text-center">Drop appeals here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showForm && (
        <AppealForm
          onClose={() => setShowForm(false)}
          onCreate={(a) => createAppeal(a)}
        />
      )}

      {editing && (
        <AppealEditModal
          appeal={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateAppeal(editing.id, patch);
            setEditing({ ...editing, ...patch });
          }}
          onAddExtension={(days) => {
            if (editing.extensions.length >= 3) return;
            const base = effectiveDeadline(editing);
            const entry: ExtensionEntry = { id: uid(), requestedOn: base.toISOString(), daysGranted: days };
            const newExts = [...editing.extensions, entry];
            updateAppeal(editing.id, { extensions: newExts });
            setEditing({ ...editing, extensions: newExts });
          }}
          onRemoveExtension={(extId) => {
            const newExts = editing.extensions.filter((e) => e.id !== extId);
            updateAppeal(editing.id, { extensions: newExts });
            setEditing({ ...editing, extensions: newExts });
          }}
          onUpdateExtension={(extId, days) => {
            const newExts = editing.extensions.map((e) => (e.id === extId ? { ...e, daysGranted: days } : e));
            updateAppeal(editing.id, { extensions: newExts });
            setEditing({ ...editing, extensions: newExts });
          }}
        />
      )}
    </div>
  );
}

// ===== Small Components =====
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white shadow p-4">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function BucketCard({ label, value, tone }: { label: string; value: number; tone: "urgent" | "warn" | "ok" }) {
  const toneMap = {
    urgent: "bg-red-50 text-red-700 border-red-200",
    warn: "bg-yellow-50 text-yellow-700 border-yellow-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  } as const;
  return (
    <div className={`rounded-2xl border ${toneMap[tone]} p-4`}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Badge({ children, tone = "default" as "default" | "red" | "yellow" | "green" }) {
  const cls: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls[tone]}`}>{children}</span>;
}

function AppealCard({
  appeal,
  onDragStart,
  onDelete,
  onAddExtension,
  onUpdate,
  onEdit,
}: {
  appeal: Appeal;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDelete: () => void;
  onAddExtension: () => void;
  onUpdate: (patch: Partial<Appeal>) => void;
  onEdit: () => void;
}) {
  const dLeft = daysLeft(appeal);
  const eff = effectiveDeadline(appeal);
  const extLeft = 3 - appeal.extensions.length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, appeal.id)}
      className={`group rounded-xl bg-white p-3 shadow hover:shadow-md border ${getBorderClass(appeal)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{appeal.style || "Untitled Case"}</div>
          <div className="text-xs text-gray-500">Court of Appeals #: {appeal.courtOfAppealsNumber || "—"}</div>
          <div className="text-xs text-gray-500">Trial Court Case #: {appeal.trialCourtCaseNumber || "—"}</div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="text-gray-400 hover:text-purple-600" title="Edit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638L8.25 13.098V15.75h2.652l8.612-8.612m-2.638-2.651a1.875 1.875 0 1 1 2.652 2.652M7.5 19.5h9"/></svg>
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600" title="Delete">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Requester</div>
          <div className="font-medium text-gray-800 truncate">{appeal.requesterName}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Extensions Used</div>
          <div className="font-medium text-gray-800">{appeal.extensions.length}/3</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {dLeft < 0 ? (
          <Badge tone="red">Past due by {Math.abs(dLeft)}d</Badge>
        ) : dLeft <= 7 ? (
          <Badge tone="red">{dLeft}d left</Badge>
        ) : dLeft <= 15 ? (
          <Badge tone="yellow">{dLeft}d left</Badge>
        ) : (
          <Badge tone="green">{dLeft}d left</Badge>
        )}
        <Badge>Eff. deadline: {eff.toLocaleDateString()}</Badge>
      </div>

      {appeal.notes && (
        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{appeal.notes}</div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onAddExtension}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
          disabled={extLeft <= 0}
          title={extLeft > 0 ? "Add 30‑day extension" : "Max extensions reached"}
        >
          +30d Extension ({extLeft} left)
        </button>
        <div className="flex items-center gap-1">
          <select
            className="text-xs rounded-lg border px-2 py-1 bg-white"
            value={appeal.status}
            onChange={(e) => onUpdate({ status: e.target.value as AppealStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CompactCard({ appeal, onDelete, onEdit }: { appeal: Appeal; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="group rounded-xl bg-white p-3 shadow hover:shadow-md border border-gray-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{appeal.style || "Untitled Case"}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {appeal.completedAt ? `Completed: ${new Date(appeal.completedAt).toLocaleDateString()}` : `Updated: ${new Date(appeal.updatedAt).toLocaleDateString()}`}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="text-gray-400 hover:text-purple-600" title="Edit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638L8.25 13.098V15.75h2.652l8.612-8.612m-2.638-2.651a1.875 1.875 0 1 1 2.652 2.652M7.5 19.5h9"/></svg>
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600" title="Delete">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function AppealEditModal({
  appeal,
  onClose,
  onSave,
  onAddExtension,
  onRemoveExtension,
  onUpdateExtension,
}: {
  appeal: Appeal;
  onClose: () => void;
  onSave: (patch: Partial<Appeal>) => void;
  onAddExtension: (days?: number) => void;
  onRemoveExtension: (extId: string) => void;
  onUpdateExtension: (extId: string, days: number) => void;
}) {
  const [form, setForm] = useState({
    requesterName: appeal.requesterName,
    requesterAddress: appeal.requesterAddress,
    courtOfAppealsNumber: appeal.courtOfAppealsNumber,
    trialCourtCaseNumber: appeal.trialCourtCaseNumber,
    style: appeal.style,
    appealDeadline: appeal.appealDeadline,
    status: appeal.status as AppealStatus,
    notes: appeal.notes || '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form });
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Edit Appeal</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Requester Name" value={form.requesterName} onChange={(v) => setForm({ ...form, requesterName: v })} />
          <TextField label="Court of Appeals Number" value={form.courtOfAppealsNumber} onChange={(v) => setForm({ ...form, courtOfAppealsNumber: v })} />
          <TextField label="Requester Address" value={form.requesterAddress} onChange={(v) => setForm({ ...form, requesterAddress: v })} />
          <TextField label="Trial Court Case Number" value={form.trialCourtCaseNumber} onChange={(v) => setForm({ ...form, trialCourtCaseNumber: v })} />
          <TextField label="Style (e.g., First Last vs The State of Texas)" value={form.style} onChange={(v) => setForm({ ...form, style: v })} className="sm:col-span-2" />
          <DateField label="Appeal Deadline" value={form.appealDeadline} onChange={(v) => setForm({ ...form, appealDeadline: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full rounded-lg border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppealStatus })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full rounded-lg border px-3 py-2" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="sm:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">Extensions</h4>
              <div className="flex gap-2">
                <button type="button" onClick={() => onAddExtension(30)} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">+30d</button>
                <button type="button" onClick={() => onAddExtension(15)} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50">+15d</button>
              </div>
            </div>
            {appeal.extensions.length === 0 && (
              <div className="text-xs text-gray-500">No extensions yet.</div>
            )}
            <div className="space-y-2">
              {appeal.extensions.map((ext) => (
                <div key={ext.id} className="flex items-center gap-3 text-sm">
                  <div className="text-gray-600 min-w-[120px]">{new Date(ext.requestedOn).toLocaleDateString()}</div>
                  <input
                    type="number"
                    min={0}
                    className="w-24 rounded-lg border px-2 py-1"
                    value={ext.daysGranted}
                    onChange={(e) => onUpdateExtension(ext.id, Number(e.target.value) || 0)}
                  />
                  <span className="text-gray-500">days</span>
                  <button type="button" onClick={() => onRemoveExtension(ext.id)} className="ml-auto text-xs text-red-600 hover:underline">Remove</button>
                </div>
              ))}
            </div>
            {/* Timeline */}
            {(() => { const t = computeExtensionTimeline(appeal); return (
              <div className="mt-3 text-xs text-gray-600">
                <div>Original: <span className="font-medium">{t.base.toLocaleDateString()}</span></div>
                {t.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{s.label} (+{s.added}d)</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">{s.date.toLocaleDateString()}</span>
                  </div>
                ))}
                <div className="mt-1">Effective deadline: <span className="font-semibold">{t.final.toLocaleDateString()}</span></div>
              </div>
            ); })()}

          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppealForm({ onClose, onCreate }: { onClose: () => void; onCreate: (a: Omit<Appeal, "id" | "createdAt" | "updatedAt" | "extensions" | "status"> & { status?: AppealStatus }) => void }) {
  const [form, setForm] = useState({
    requesterName: "",
    requesterAddress: "",
    courtOfAppealsNumber: "",
    trialCourtCaseNumber: "",
    style: "",
    appealDeadline: "",
    status: "Intake" as AppealStatus,
    notes: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appealDeadline) return alert("Please set an appeal deadline.");
    onCreate(form);
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">New Appeal</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Requester Name" value={form.requesterName} onChange={(v) => setForm({ ...form, requesterName: v })} />
          <TextField label="Court of Appeals Number" value={form.courtOfAppealsNumber} onChange={(v) => setForm({ ...form, courtOfAppealsNumber: v })} />
          <TextField label="Requester Address" value={form.requesterAddress} onChange={(v) => setForm({ ...form, requesterAddress: v })} />
          <TextField label="Trial Court Case Number" value={form.trialCourtCaseNumber} onChange={(v) => setForm({ ...form, trialCourtCaseNumber: v })} />
          <TextField label="Style (e.g., First Last vs The State of Texas)" value={form.style} onChange={(v) => setForm({ ...form, style: v })} className="sm:col-span-2" />
          <DateField label="Appeal Deadline" value={form.appealDeadline} onChange={(v) => setForm({ ...form, appealDeadline: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full rounded-lg border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppealStatus })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full rounded-lg border px-3 py-2" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="w-full rounded-lg border px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="date" className="w-full rounded-lg border px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
