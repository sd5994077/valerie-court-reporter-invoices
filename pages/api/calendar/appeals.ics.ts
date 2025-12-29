import type { NextApiRequest, NextApiResponse } from 'next';

function loadAppeals() {
  try {
    // In dev, localStorage isn't accessible on server; this is a stub.
    // Later, replace with DB fetch. For now, return empty ICS with comment.
    return [] as any[];
  } catch {
    return [] as any[];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const appeals = loadAppeals();
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Valerie CSR//Appeals//EN');

  for (const a of appeals) {
    const base = new Date(a.appealDeadline);
    const total = (a.extensions || []).reduce((n: number, e: any) => n + (e.daysGranted || 0), 0);
    const eff = new Date(base);
    eff.setDate(eff.getDate() + total);
    const y = eff.getFullYear();
    const m = (eff.getMonth() + 1).toString().padStart(2, '0');
    const d = eff.getDate().toString().padStart(2, '0');
    const dt = `${y}${m}${d}`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:appeal-${a.id}@valerie-csr`);
    lines.push(`DTSTAMP:${y}${m}${d}T000000Z`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push(`DTEND;VALUE=DATE:${dt}`);
    lines.push(`SUMMARY:Appeal Deadline: ${a.style || 'Untitled'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.send(lines.join('\r\n'));
}




