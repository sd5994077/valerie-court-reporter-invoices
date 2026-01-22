import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MobileNavigation } from '../src/components/MobileNavigation';

export type AppealStatus =
  | 'Intake'
  | 'Active'
  | 'Scope'
  | 'Proofread'
  | 'Awaiting Extension'
  | 'Submitted'
  | 'Completed'
  | 'Archived';

export interface ExtensionEntry {
  id: string;
  requestedOn: string;
  daysGranted: number;
}

export interface Appeal {
  id: string;
  requesterName: string;
  requesterAddress: string;
  requesterEmail?: string;
  requesterPhone?: string;
  courtOfAppealsNumber: string;
  trialCourtCaseNumber: string;
  style: string;
  appealDeadline: string;
  status: AppealStatus;
  extensions: ExtensionEntry[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const STORAGE_KEY = 'appeals_store_v1';

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

function bucket(days: number): 'lt7' | '8to15' | 'gt15' | 'past' {
  if (days < 0) return 'past';
  if (days <= 7) return 'lt7';
  if (days <= 15) return '8to15';
  return 'gt15';
}

function getBorderClass(appeal: Appeal) {
  if (appeal.status === 'Completed' || appeal.status === 'Archived') return 'border-gray-200';
  if (appeal.extensions.length >= 3) return 'border-pink-300';
  const d = daysLeft(appeal);
  if (d < 0 || d <= 7) return 'border-red-300';
  if (d <= 15) return 'border-yellow-300';
  return 'border-emerald-300';
}

function getBackgroundClass(appeal: Appeal) {
  if (appeal.status === 'Completed' || appeal.status === 'Archived') return 'bg-white';
  if (appeal.extensions.length >= 3) return 'bg-pink-50';
  return 'bg-white';
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
  'Intake',
  'Active',
  'Scope',
  'Proofread',
  'Awaiting Extension',
  'Submitted',
  'Completed',
  'Archived',
];

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appeal | null>(null);
  const [showAllArchived, setShowAllArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const draggingRef = useRef<string | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setAppeals(loadStore());
  }, []);

  useEffect(() => {
    saveStore(appeals);
  }, [appeals]);

  const filteredAppeals = useMemo(() => {
    if (!searchQuery) return appeals;
    const q = searchQuery.toLowerCase();
    return appeals.filter((a) =>
      (a.requesterName || '').toLowerCase().includes(q) ||
      (a.style || '').toLowerCase().includes(q) ||
      (a.courtOfAppealsNumber || '').toLowerCase().includes(q) ||
      (a.trialCourtCaseNumber || '').toLowerCase().includes(q)
    );
  }, [appeals, searchQuery]);

  const stats = useMemo(() => {
    const byBucket = { lt7: 0, '8to15': 0, gt15: 0, past: 0 } as Record<string, number>;
    const byStatus: Record<AppealStatus, number> = {
      Intake: 0,
      Active: 0,
      Scope: 0,
      Proofread: 0,
      'Awaiting Extension': 0,
      Submitted: 0,
      Completed: 0,
      Archived: 0,
    };
    // Use filtered appeals for stats so the dashboard reflects the search
    filteredAppeals.forEach((a) => {
      const d = daysLeft(a);
      byBucket[bucket(d)]++;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    return { byBucket, byStatus, total: filteredAppeals.length };
  }, [filteredAppeals]);

  const columns: AppealStatus[] = ['Intake', 'Active', 'Scope', 'Proofread', 'Awaiting Extension', 'Submitted', 'Completed', 'Archived'];

  // Memoize sorted appeals by column for performance
  const appealsByColumn = useMemo(() => {
    const result: Record<AppealStatus, Appeal[]> = {
      'Intake': [],
      'Active': [],
      'Scope': [],
      'Proofread': [],
      'Awaiting Extension': [],
      'Submitted': [],
      'Completed': [],
      'Archived': [],
    };
    
    filteredAppeals.forEach((appeal) => {
      result[appeal.status].push(appeal);
    });
    
    // Sort each column
    Object.keys(result).forEach((status) => {
      const col = status as AppealStatus;
      if (col === 'Archived') {
        // Archived: sort by updatedAt (newest first), limit to 50 unless showAllArchived
        result[col] = result[col]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, showAllArchived ? undefined : 50);
      } else {
        // Other columns: sort by days left (urgent first)
        result[col] = result[col].sort((a, b) => daysLeft(a) - daysLeft(b));
      }
    });
    
    return result;
  }, [filteredAppeals, showAllArchived]);

  // Helper: Determine if cards in a column should be compact
  // Mobile: compact if multiple cards, Desktop: compact if more than 5 cards
  function shouldBeCompact(status: AppealStatus, count: number): boolean {
    if (status === 'Completed' || status === 'Archived') return true; // Always compact for these
    if (isMobile) {
      return count > 1; // Mobile: compact if more than 1 card
    }
    return count > 5; // Desktop: compact if more than 5 cards
  }

  // Toggle card expansion
  function toggleCardExpansion(id: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exportToCSV() {
    const headers = [
      'ID', 'Style', 'Requester Name', 'Requester Email', 'Requester Phone', 'Requester Address', 
      'Court of Appeals #', 'Trial Court Case #', 'Status', 
      'Appeal Deadline', 'Effective Deadline', 'Extensions Count', 
      'Total Extension Days', 'Notes', 'Created At', 'Updated At'
    ];
    
    const rows = appeals.map(a => {
      const totalExtDays = a.extensions.reduce((n, e) => n + (e.daysGranted || 0), 0);
      const eff = parseISO(a.appealDeadline);
      eff.setDate(eff.getDate() + totalExtDays);
      const effDate = eff.toISOString().split('T')[0];
      
      return [
        a.id,
        `"${(a.style || '').replace(/"/g, '""')}"`,
        `"${(a.requesterName || '').replace(/"/g, '""')}"`,
        `"${(a.requesterEmail || '').replace(/"/g, '""')}"`,
        `"${(a.requesterPhone || '').replace(/"/g, '""')}"`,
        `"${(a.requesterAddress || '').replace(/"/g, '""')}"`,
        `"${(a.courtOfAppealsNumber || '').replace(/"/g, '""')}"`,
        `"${(a.trialCourtCaseNumber || '').replace(/"/g, '""')}"`,
        a.status,
        a.appealDeadline,
        effDate,
        a.extensions.length,
        totalExtDays,
        `"${(a.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        a.createdAt,
        a.updatedAt
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `appeals_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function createAppeal(a: Omit<Appeal, 'id' | 'createdAt' | 'updatedAt' | 'extensions' | 'status'> & { status?: AppealStatus }) {
    const now = new Date().toISOString();
    const newA: Appeal = {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      extensions: [],
      status: a.status || 'Intake',
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
        
        // Handle status changes
        if (patch.status && patch.status !== a.status) {
          // When moving TO Completed, set completedAt timestamp
          if (patch.status === 'Completed' && !a.completedAt) {
            next.completedAt = now;
          }
          // When moving AWAY FROM Completed, clear completedAt (back to active status)
          else if (a.status === 'Completed' && patch.status !== 'Completed' && patch.status !== 'Archived') {
            next.completedAt = undefined;
          }
        }
        return next;
      })
    );
  }

  function handleStatusChange(id: string, newStatus: AppealStatus) {
    // Confirm before archiving
    if (newStatus === 'Archived') {
      const confirmed = window.confirm(
        'Archive this appeal?\n\nOnce archived, no further edits are allowed. The appeal will be read-only.'
      );
      if (!confirmed) {
        return; // User cancelled
      }
    }
    updateAppeal(id, { status: newStatus });
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

  function onDragStart(e: React.DragEvent, id: string) {
    const appeal = appeals.find(a => a.id === id);
    if (appeal?.status === 'Archived') {
      e.preventDefault();
      return;
    }
    draggingRef.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDrop(e: React.DragEvent, status: AppealStatus) {
    e.preventDefault();
    if (status === 'Archived') {
      // Prevent dropping into archived - must explicitly archive via status change
      draggingRef.current = null;
      return;
    }
    const id = draggingRef.current || e.dataTransfer.getData('text/plain');
    const appeal = appeals.find(a => a.id === id);
    if (id && appeal?.status !== 'Archived') {
      updateAppeal(id, { status });
    }
    draggingRef.current = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="appeals" />

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold shadow-md">A</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appeals Board</h1>
              <p className="text-xs text-gray-600 -mt-0.5">Trello-style workflow + deadline tracking</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full mx-auto md:mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Search appeals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button 
              onClick={exportToCSV}
              className="flex rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 items-center gap-2 print:hidden"
              aria-label="Export to CSV"
              title="Export to CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex rounded-xl border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 items-center gap-2 print:hidden"
              aria-label="Export to PDF (Print)"
              title="Export to PDF (Print)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"/></svg>
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button onClick={() => setShowForm(true)} className="rounded-xl bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700 print:hidden">
              New Appeal
            </button>
          </div>
        </div>
      </header>

      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, header button, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          header { border: none !important; }
          /* Transform grid to flex for print to show more columns if possible, or keep grid but adjust width */
          .grid-cols-1 { display: grid; grid-template-columns: repeat(4, 1fr) !important; gap: 1rem !important; }
          /* Hide archived column in print to save space if needed, or keep it */
          
          /* Ensure cards break properly */
          .rounded-2xl { break-inside: avoid; page-break-inside: avoid; border: 1px solid #ddd; background: #f9fafb; }
          .group { break-inside: avoid; page-break-inside: avoid; border: 1px solid #eee; }
        }
      `}</style>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Appeals" value={stats.total} />
          <BucketCard label="0–7 days left" value={stats.byBucket.lt7} tone="urgent" />
          <BucketCard label="8–15 days left" value={stats.byBucket['8to15']} tone="warn" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
          {columns.map((col) => {
            const colAppeals = appealsByColumn[col];
            const colCount = colAppeals.length;
            const isEmptyMobile = isMobile && colCount === 0;
            
            // Show collapsed version on mobile when empty
            if (isEmptyMobile) {
              return (
                <div
                  key={col}
                  className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-between"
                >
                  <h3 className="font-medium text-gray-600 text-sm">{col}</h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">0</span>
                </div>
              );
            }
            
            return (
              <div
                key={col}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col)}
                className="rounded-2xl bg-gray-100 p-3 md:p-4 shadow-inner min-h-[320px]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">{col}</h3>
                  <span className="text-xs text-gray-500">{colCount}</span>
                </div>
                <div className="space-y-3">
                {(() => {
                  // Use pre-computed appeals from memoized appealsByColumn
                  const isCompactMode = shouldBeCompact(col, colAppeals.length);
                  
                  return colAppeals.map((a) => {
                    const isExpanded = expandedCards.has(a.id);
                    
                    // Always compact for Completed/Archived (unless expanded)
                    if (col === 'Completed' || col === 'Archived') {
                      return isExpanded ? (
                        <ExpandableCard
                          key={a.id}
                          appeal={a}
                          onDragStart={onDragStart}
                          onDelete={col === 'Archived' ? undefined : () => deleteAppeal(a.id)}
                          onUpdate={(p) => updateAppeal(a.id, p)}
                          onEdit={() => setEditing(a)}
                          onCollapse={() => toggleCardExpansion(a.id)}
                          isArchived={col === 'Archived'}
                        />
                      ) : (
                        <CompactCard 
                          key={a.id} 
                          appeal={a} 
                          onDelete={col === 'Archived' ? undefined : () => deleteAppeal(a.id)} 
                          onEdit={() => setEditing(a)}
                          onExpand={() => toggleCardExpansion(a.id)}
                          isArchived={col === 'Archived'}
                        />
                      );
                    }
                    
                    // For other statuses: use compact mode based on count
                    if (isCompactMode && !isExpanded) {
                      return (
                        <CompactCard 
                          key={a.id} 
                          appeal={a} 
                          onDelete={() => deleteAppeal(a.id)} 
                          onEdit={() => setEditing(a)}
                          onExpand={() => toggleCardExpansion(a.id)}
                          showDeadline={true}
                        />
                      );
                    }
                    
                    // Full card view
                    return isCompactMode ? (
                      <ExpandableCard
                        key={a.id}
                        appeal={a}
                        onDragStart={onDragStart}
                        onDelete={() => deleteAppeal(a.id)}
                        onUpdate={(p) => updateAppeal(a.id, p)}
                        onEdit={() => setEditing(a)}
                        onCollapse={() => toggleCardExpansion(a.id)}
                      />
                    ) : (
                      <AppealCard
                        key={a.id}
                        appeal={a}
                        onDragStart={onDragStart}
                        onDelete={() => deleteAppeal(a.id)}
                        onAddExtension={() => setEditing(a)}
                        onUpdate={(p) => updateAppeal(a.id, p)}
                        onEdit={() => setEditing(a)}
                      />
                    );
                  });
                })()}
                {col === 'Archived' && !showAllArchived && filteredAppeals.filter((a) => a.status === col).length > 50 && (
                  <button
                    onClick={() => setShowAllArchived(!showAllArchived)}
                    className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium py-2"
                  >
                    {`View All (${filteredAppeals.filter((a) => a.status === col).length - 50} more)`}
                  </button>
                )}
                {col === 'Archived' && showAllArchived && filteredAppeals.filter((a) => a.status === col).length > 50 && (
                  <button
                    onClick={() => setShowAllArchived(!showAllArchived)}
                    className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium py-2"
                  >
                    {`Show Less (${filteredAppeals.filter((a) => a.status === col).length - 50} hidden)`}
                  </button>
                )}
                  {colCount === 0 && (
                    <div className="text-sm text-gray-500 py-6 text-center">
                      {searchQuery ? 'No matches' : 'Drop appeals here'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showForm && (
        <AppealForm onClose={() => setShowForm(false)} onCreate={(a) => createAppeal(a)} />
      )}

      {editing && (
        <AppealEditModal
          appeal={editing}
          isReadOnly={editing.status === 'Archived'}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            if (editing.status !== 'Archived') {
              updateAppeal(editing.id, patch);
            }
            setEditing(null);
          }}
          onAddExtension={(days) => {
            if (editing.extensions.length >= 3) return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const entry: ExtensionEntry = { id: uid(), requestedOn: today.toISOString(), daysGranted: days || 30 };
            const newExts = [...editing.extensions, entry];
            updateAppeal(editing.id, { extensions: newExts });
            setEditing({ ...editing, extensions: newExts });
          }}
          onUpdateExtensionDate={(extId, date) => {
            const newExts = editing.extensions.map((e) => (e.id === extId ? { ...e, requestedOn: date } : e));
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white shadow p-4">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function BucketCard({ label, value, tone }: { label: string; value: number; tone: 'urgent' | 'warn' | 'ok' }) {
  const toneMap = {
    urgent: 'bg-red-50 text-red-700 border-red-200',
    warn: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  } as const;
  return (
    <div className={`rounded-2xl border ${toneMap[tone]} p-4`}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Badge({ children, tone = 'default' as 'default' | 'red' | 'yellow' | 'green' }) {
  const cls: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-emerald-100 text-emerald-700',
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

  // Disable dragging on mobile (touch devices)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  // Helper to render deadline badge based on status
  const renderDeadlineBadge = () => {
    // If completed or archived, show status instead of days
    if (appeal.status === 'Completed') {
      return <Badge tone="green">Completed</Badge>;
    }
    if (appeal.status === 'Archived') {
      return <Badge tone="default">Archived</Badge>;
    }
    
    // For active statuses, show days left
    if (dLeft < 0) {
      return <Badge tone="red">Past due {Math.abs(dLeft)}d</Badge>;
    } else if (dLeft === 0) {
      return <Badge tone="red">Due today</Badge>;
    } else if (dLeft <= 7) {
      return <Badge tone="red">{dLeft}d left</Badge>;
    } else if (dLeft <= 15) {
      return <Badge tone="yellow">{dLeft}d left</Badge>;
    } else {
      return <Badge tone="green">{dLeft}d left</Badge>;
    }
  };
  
  return (
    <div
      draggable={!isTouchDevice}
      onDragStart={(e) => !isTouchDevice && onDragStart(e, appeal.id)}
      onClick={onEdit}
      className={`group rounded-xl ${getBackgroundClass(appeal)} p-3 shadow hover:shadow-md border ${getBorderClass(appeal)} cursor-pointer relative`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 leading-tight mb-1">{appeal.style || 'Untitled Case'}</div>
          <div className="text-xs text-gray-500 truncate">
            <span className="font-medium text-gray-600">COA:</span> {appeal.courtOfAppealsNumber || '—'} 
            <span className="mx-1.5 text-gray-300">|</span> 
            <span className="font-medium text-gray-600">Trial:</span> {appeal.trialCourtCaseNumber || '—'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {renderDeadlineBadge()}
          <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200" title="Extensions Used">
            Ext: {appeal.extensions.length}/3
          </span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <select
            className="text-xs sm:text-sm rounded-lg border px-2 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 max-w-[140px] sm:max-w-[160px]"
            value={appeal.status}
            onChange={(e) => {
              const newStatus = e.target.value as AppealStatus;
              if (newStatus === 'Archived') {
                const confirmed = window.confirm(
                  'Archive this appeal?\n\nOnce archived, no further edits are allowed. The appeal will be read-only.'
                );
                if (!confirmed) {
                  e.target.value = appeal.status; // Reset dropdown
                  return;
                }
              }
              onUpdate({ status: newStatus });
            }}
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

function CompactCard({ 
  appeal, 
  onDelete, 
  onEdit, 
  onExpand,
  isArchived = false,
  showDeadline = false 
}: { 
  appeal: Appeal; 
  onDelete?: () => void; 
  onEdit: () => void; 
  onExpand?: () => void;
  isArchived?: boolean;
  showDeadline?: boolean;
}) {
  const dLeft = daysLeft(appeal);
  
  // Urgency border color for visual scanning
  const getUrgencyBorder = () => {
    if (isArchived || appeal.status === 'Completed' || appeal.status === 'Archived') {
      return 'border-l-gray-300';
    }
    if (appeal.extensions.length >= 3) return 'border-l-pink-400';
    if (dLeft < 0 || dLeft <= 7) return 'border-l-red-500';
    if (dLeft <= 15) return 'border-l-yellow-400';
    return 'border-l-emerald-500';
  };
  
  // Helper to render deadline badge
  const renderDeadlineBadge = () => {
    // If completed or archived, show status
    if (appeal.status === 'Completed') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          Completed
        </span>
      );
    }
    if (appeal.status === 'Archived') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          Archived
        </span>
      );
    }
    
    // For active statuses, show days left
    if (dLeft < 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          {Math.abs(dLeft)}d overdue
        </span>
      );
    } else if (dLeft === 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Due today
        </span>
      );
    } else if (dLeft <= 7) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          {dLeft}d left
        </span>
      );
    } else if (dLeft <= 15) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          {dLeft}d left
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
          {dLeft}d left
        </span>
      );
    }
  };
  
  return (
    <div 
      className={`group rounded-xl bg-white p-3 shadow hover:shadow-md border border-gray-200 border-l-4 ${getUrgencyBorder()} cursor-pointer transition-all`}
      onClick={onExpand}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 truncate">{appeal.style || 'Untitled Case'}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            {showDeadline ? (
              <>
                {renderDeadlineBadge()}
                <span className="text-gray-400">•</span>
                <span>Ext: {appeal.extensions.length}/3</span>
              </>
            ) : (
              appeal.completedAt ? `Completed: ${new Date(appeal.completedAt).toLocaleDateString()}` : `Updated: ${new Date(appeal.updatedAt).toLocaleDateString()}`
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExpand && (
            <button 
              onClick={(e) => { e.stopPropagation(); onExpand(); }} 
              className="text-gray-400 hover:text-purple-600 transition" 
              title="Expand"
              aria-label="Expand appeal details"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="text-gray-400 hover:text-purple-600" 
              title={isArchived ? "View (Read-only)" : "Edit"}
              aria-label={isArchived ? "View appeal (read-only)" : "Edit appeal"}
            >
              {isArchived ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1-.518 1.006L7 15v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5l4.964-1.672a1.012 1.012 0 0 1 .518-1.006L21 11.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5.5z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638L8.25 13.098V15.75h2.652l8.612-8.612m-2.638-2.651a1.875 1.875 0 1 1 2.652 2.652M7.5 19.5h9"/></svg>
              )}
            </button>
            {!isArchived && onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="text-gray-400 hover:text-red-600" 
                title="Delete"
                aria-label="Delete appeal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandableCard({
  appeal,
  onDragStart,
  onDelete,
  onUpdate,
  onEdit,
  onCollapse,
  isArchived = false,
}: {
  appeal: Appeal;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDelete?: () => void;
  onUpdate: (patch: Partial<Appeal>) => void;
  onEdit: () => void;
  onCollapse: () => void;
  isArchived?: boolean;
}) {
  const dLeft = daysLeft(appeal);
  const eff = effectiveDeadline(appeal);
  
  // Disable dragging on mobile (touch devices)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Helper to render deadline badge based on status
  const renderDeadlineBadge = () => {
    // If completed or archived, show status instead of days
    if (appeal.status === 'Completed') {
      return <Badge tone="green">Completed</Badge>;
    }
    if (appeal.status === 'Archived') {
      return <Badge tone="default">Archived</Badge>;
    }
    
    // For active statuses, show days left
    if (dLeft < 0) {
      return <Badge tone="red">Past due {Math.abs(dLeft)}d</Badge>;
    } else if (dLeft === 0) {
      return <Badge tone="red">Due today</Badge>;
    } else if (dLeft <= 7) {
      return <Badge tone="red">{dLeft}d left</Badge>;
    } else if (dLeft <= 15) {
      return <Badge tone="yellow">{dLeft}d left</Badge>;
    } else {
      return <Badge tone="green">{dLeft}d left</Badge>;
    }
  };

  return (
    <div
      draggable={!isArchived && !isTouchDevice}
      onDragStart={(e) => !isArchived && !isTouchDevice && onDragStart(e, appeal.id)}
      className={`group rounded-xl ${getBackgroundClass(appeal)} p-3 shadow hover:shadow-md border ${getBorderClass(appeal)} relative`}
    >
      {/* Collapse button */}
      <button 
        onClick={onCollapse}
        className="absolute top-2 right-2 text-gray-400 hover:text-purple-600 transition z-10"
        title="Collapse"
        aria-label="Collapse appeal details"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
        </svg>
      </button>
      
      <div className="cursor-pointer" onClick={onEdit}>
        <div className="flex items-start justify-between gap-3 mb-2 pr-6">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 leading-tight mb-1">{appeal.style || 'Untitled Case'}</div>
            <div className="text-xs text-gray-500 truncate">
              <span className="font-medium text-gray-600">COA:</span> {appeal.courtOfAppealsNumber || '—'} 
              <span className="mx-1.5 text-gray-300">|</span> 
              <span className="font-medium text-gray-600">Trial:</span> {appeal.trialCourtCaseNumber || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {renderDeadlineBadge()}
            <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200" title="Extensions Used">
              Ext: {appeal.extensions.length}/3
            </span>
          </div>

          {!isArchived && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <select
                className="text-xs sm:text-sm rounded-lg border px-2 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 max-w-[140px] sm:max-w-[160px]"
                value={appeal.status}
                onChange={(e) => {
                  const newStatus = e.target.value as AppealStatus;
                  if (newStatus === 'Archived') {
                    const confirmed = window.confirm(
                      'Archive this appeal?\n\nOnce archived, no further edits are allowed. The appeal will be read-only.'
                    );
                    if (!confirmed) {
                      e.target.value = appeal.status; // Reset dropdown
                      return;
                    }
                  }
                  onUpdate({ status: newStatus });
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppealEditModal({
  appeal,
  isReadOnly = false,
  onClose,
  onSave,
  onAddExtension,
  onRemoveExtension,
  onUpdateExtension,
  onUpdateExtensionDate,
}: {
  appeal: Appeal;
  isReadOnly?: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Appeal>) => void;
  onAddExtension: (days?: number) => void;
  onRemoveExtension: (extId: string) => void;
  onUpdateExtension: (extId: string, days: number) => void;
  onUpdateExtensionDate: (extId: string, date: string) => void;
}) {
  // View-first mode: starts in view mode, click Edit to enable editing
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = !isReadOnly && isEditing;
  
  const [form, setForm] = useState({
    requesterName: appeal.requesterName,
    requesterEmail: appeal.requesterEmail || '',
    requesterPhone: appeal.requesterPhone || '',
    requesterAddress: appeal.requesterAddress,
    courtOfAppealsNumber: appeal.courtOfAppealsNumber,
    trialCourtCaseNumber: appeal.trialCourtCaseNumber,
    style: appeal.style,
    appealDeadline: appeal.appealDeadline,
    status: appeal.status as AppealStatus,
    notes: appeal.notes || '',
  });

  // Calculate effective deadline for display
  const dLeft = daysLeft(appeal);
  const effDeadline = effectiveDeadline(appeal);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form });
    onClose();
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

  // Get title based on mode
  const getTitle = () => {
    if (isReadOnly) return 'View Appeal (Archived)';
    if (isEditing) return 'Edit Appeal';
    return 'Appeal Details';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto overscroll-contain" 
      style={{ touchAction: 'none' }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-[95vw] sm:max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-x-hidden" 
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{getTitle()}</h3>
            {!isReadOnly && !isEditing && (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638L8.25 13.098V15.75h2.652l8.612-8.612m-2.638-2.651a1.875 1.875 0 1 1 2.652 2.652M7.5 19.5h9"/>
                </svg>
                Edit
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        {/* Quick info bar when in view mode */}
        {!isEditing && !isReadOnly && (
          <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap items-center gap-3 text-sm">
            {/* Show deadline info for active appeals, status info for completed/archived */}
            {appeal.status === 'Completed' || appeal.status === 'Archived' ? (
              <>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                  appeal.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {appeal.status}
                </div>
                {appeal.completedAt && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{appeal.status === 'Completed' ? 'Completed' : 'Archived'} on: <strong>{new Date(appeal.completedAt).toLocaleDateString()}</strong></span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">Original deadline: <strong>{effDeadline.toLocaleDateString()}</strong></span>
              </>
            ) : (
              <>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                  dLeft < 0 ? 'bg-red-100 text-red-700' :
                  dLeft === 0 ? 'bg-red-100 text-red-700' :
                  dLeft <= 7 ? 'bg-red-100 text-red-700' :
                  dLeft <= 15 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {dLeft < 0 ? `${Math.abs(dLeft)} days overdue` : dLeft === 0 ? 'Due today' : `${dLeft} days remaining`}
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">Due: <strong>{effDeadline.toLocaleDateString()}</strong></span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">Extensions: <strong>{appeal.extensions.length}/3</strong></span>
                <span className="text-gray-400">•</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  'bg-purple-100 text-purple-700'
                }`}>{appeal.status}</span>
              </>
            )}
          </div>
        )}
        
        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
          <TextField label="Requester Name" value={form.requesterName} onChange={(v) => setForm({ ...form, requesterName: v })} disabled={!canEdit} />
          <TextField label="Requester Email" type="email" value={form.requesterEmail} onChange={(v) => setForm({ ...form, requesterEmail: v })} disabled={!canEdit} />
          <TextField label="Requester Phone" type="tel" value={form.requesterPhone} onChange={(v) => setForm({ ...form, requesterPhone: v })} disabled={!canEdit} />
          <TextField label="Requester Address" value={form.requesterAddress} onChange={(v) => setForm({ ...form, requesterAddress: v })} disabled={!canEdit} />
          <TextField label="Court of Appeals Number" value={form.courtOfAppealsNumber} onChange={(v) => setForm({ ...form, courtOfAppealsNumber: v })} disabled={!canEdit} />
          <TextField label="Trial Court Case Number" value={form.trialCourtCaseNumber} onChange={(v) => setForm({ ...form, trialCourtCaseNumber: v })} disabled={!canEdit} />
          <TextField label="Style (e.g., First Last vs The State of Texas)" value={form.style} onChange={(v) => setForm({ ...form, style: v })} className="sm:col-span-2" disabled={!canEdit} />
          <DateField label="Appeal Deadline" value={form.appealDeadline} onChange={(v) => setForm({ ...form, appealDeadline: v })} disabled={!canEdit} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className={`w-full rounded-lg border px-3 py-2 ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={form.status} 
              onChange={(e) => {
                const newStatus = e.target.value as AppealStatus;
                if (canEdit && newStatus === 'Archived') {
                  const confirmed = window.confirm(
                    'Archive this appeal?\n\nOnce archived, no further edits are allowed. The appeal will be read-only.'
                  );
                  if (!confirmed) {
                    return; // Don't update form state
                  }
                }
                setForm({ ...form, status: newStatus });
              }}
              disabled={!canEdit}
            >
              {!canEdit ? (
                <option value={form.status}>{form.status}</option>
              ) : (
                STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              )}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              className={`w-full rounded-lg border px-3 py-2 ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              rows={4} 
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })} 
              disabled={!canEdit}
            />
          </div>

          <div className="sm:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">Extensions</h4>
              {canEdit && (
                <div className="flex gap-2 items-center">
                  <select 
                    className="rounded-lg border px-2 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        onAddExtension(Number(e.target.value));
                        e.target.value = ""; // Reset
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add Extension...</option>
                    <option value="15">+15 Days</option>
                    <option value="30">+30 Days</option>
                    <option value="45">+45 Days</option>
                    <option value="60">+60 Days</option>
                    <option value="90">+90 Days</option>
                  </select>
                </div>
              )}
            </div>
            {appeal.extensions.length === 0 && (
              <div className="text-xs text-gray-500">No extensions yet.</div>
            )}
            <div className="space-y-2">
              {appeal.extensions.map((ext) => (
                <div key={ext.id} className="flex flex-wrap items-center gap-3 text-sm">
                  {canEdit ? (
                    <>
                      <input
                        type="date"
                        className="w-40 rounded-lg border px-2 py-1"
                        value={ext.requestedOn ? ext.requestedOn.split('T')[0] : ''}
                        onChange={(e) => onUpdateExtensionDate(ext.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                      />
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded-lg border px-2 py-1"
                        value={ext.daysGranted}
                        onChange={(e) => onUpdateExtension(ext.id, Number(e.target.value) || 0)}
                      />
                      <span className="text-gray-500">days</span>
                      <button type="button" onClick={() => onRemoveExtension(ext.id)} className="ml-auto text-xs text-red-600 hover:underline">Remove</button>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600">{ext.requestedOn ? new Date(ext.requestedOn).toLocaleDateString() : '—'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">+{ext.daysGranted} days</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-4 border-t mt-2">
            {/* Left side: Calendar actions - always available */}
            <div className="flex items-center gap-2">
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Appeal Deadline: ${form.style || 'Untitled'}`)}&dates=${(() => {
                  const base = parseISO(form.appealDeadline);
                  const totalExt = appeal.extensions.reduce((n, e) => n + (e.daysGranted || 0), 0);
                  const eff = addDays(base, totalExt);
                  const y = eff.getFullYear();
                  const m = String(eff.getMonth() + 1).padStart(2, '0');
                  const d = String(eff.getDate()).padStart(2, '0');
                  return `${y}${m}${d}/${y}${m}${d}`;
                })()}&details=${encodeURIComponent(`Court of Appeals #: ${form.courtOfAppealsNumber || 'N/A'}\nTrial Court Case #: ${form.trialCourtCaseNumber || 'N/A'}\nRequester: ${form.requesterName || 'N/A'}\nNotes: ${form.notes || ''}`)}`}
                target="_blank" 
                rel="noreferrer"
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 bg-white"
              >
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/></svg>
                <span className="hidden sm:inline">Google Cal</span>
                <span className="sm:hidden">Add to Cal</span>
              </a>
              <a 
                href="/api/calendar/appeals.ics" 
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 bg-white hidden sm:flex items-center gap-1" 
                target="_blank" 
                rel="noreferrer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ICS
              </a>
            </div>
            
            {/* Right side: Form actions */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-lg bg-purple-600 text-white px-3 py-2 text-sm font-semibold hover:bg-purple-700"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppealForm({ onClose, onCreate }: { onClose: () => void; onCreate: (a: Omit<Appeal, 'id' | 'createdAt' | 'updatedAt' | 'extensions' | 'status'> & { status?: AppealStatus }) => void }) {
  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterAddress: '',
    courtOfAppealsNumber: '',
    trialCourtCaseNumber: '',
    style: '',
    appealDeadline: '',
    status: 'Intake' as AppealStatus,
    notes: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appealDeadline) return alert('Please set an appeal deadline.');
    onCreate(form);
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto overscroll-contain" 
      style={{ touchAction: 'none' }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-[95vw] sm:max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-x-hidden" 
        style={{ touchAction: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold">New Appeal</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
          <TextField label="Requester Name" value={form.requesterName} onChange={(v) => setForm({ ...form, requesterName: v })} />
          <TextField label="Requester Email" type="email" value={form.requesterEmail} onChange={(v) => setForm({ ...form, requesterEmail: v })} />
          <TextField label="Requester Phone" type="tel" value={form.requesterPhone} onChange={(v) => setForm({ ...form, requesterPhone: v })} />
          <TextField label="Requester Address" value={form.requesterAddress} onChange={(v) => setForm({ ...form, requesterAddress: v })} />
          <TextField label="Court of Appeals Number" value={form.courtOfAppealsNumber} onChange={(v) => setForm({ ...form, courtOfAppealsNumber: v })} />
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

function TextField({ label, value, onChange, className, disabled, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; className?: string; disabled?: boolean; type?: 'text' | 'email' | 'tel' }) {
  // Add pattern for phone validation (US format)
  const phonePattern = type === 'tel' ? '[0-9]{3}-?[0-9]{3}-?[0-9]{4}' : undefined;
  const placeholder = type === 'tel' ? '123-456-7890' : type === 'email' ? 'name@example.com' : undefined;
  
  return (
    <div className={`min-w-0 ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input 
        type={type}
        pattern={phonePattern}
        placeholder={placeholder}
        className={`w-full max-w-full rounded-lg border px-3 py-2 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled}
        title={type === 'tel' ? 'Phone format: 123-456-7890 or 1234567890' : type === 'email' ? 'Enter a valid email address' : undefined}
      />
    </div>
  );
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="date" className={`w-full rounded-lg border px-3 py-2 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}
