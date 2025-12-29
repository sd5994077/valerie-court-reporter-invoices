import React from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { VenmoQRCode } from './VenmoQRCode';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function InvoicePDFOnePager({ invoiceData }: { invoiceData: InvoiceFormData }) {
  const items = invoiceData.lineItems.map(it => ({
    description: it.description,
    quantity: it.quantity,
    rate: it.rate,
    total: it.quantity * it.rate
  }));
  const subtotal = items.reduce((s, it) => s + it.total, 0);

  const cellPad = '8px 10px';
  const rowHeight = 28;
  const chip: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 9999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 22px'
  };

  return (
    <div id="invoice-pdf-content" style={{ maxWidth: '8.5in', margin: '0 auto', padding: '0.45in 0.5in 0.5in', color: '#111827', fontFamily: 'Inter, Arial, sans-serif', fontSize: 13.5, lineHeight: 1.35, background: '#fff', boxSizing: 'border-box' }}>
      <style jsx global>{`
        @page { size: Letter; margin: 0.5in; }
        @media print {
          html, body { height: auto !important; }
          table thead { display: table-header-group; }
          table tfoot { display: table-footer-group; }
          .no-break { break-inside: avoid; }
        }
      `}</style>

      {/* Header - Centered Court Reporter Information */}
      <div className="no-break" style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Valerie DeLeon, CSR</div>
        <div style={{ color: '#4b5563', fontSize: 12 }}>126 Old Settlers Drive</div>
        <div style={{ color: '#4b5563', fontSize: 12 }}>San Marcos, Texas 78666</div>
        <div style={{ color: '#4b5563', fontSize: 12 }}>512-878-3327</div>
        <div style={{ color: '#4b5563', fontSize: 12 }}>valeriedeleon.csr@gmail.com</div>
      </div>

      <div style={{ height: 2, background: '#6d28d9', opacity: 0.85, margin: '8px 0 12px' }} />

      {/* Invoice Date and Number - Same Line */}
      <div className="no-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Invoice Date: </span>
          <span style={{ fontSize: 12 }}>{formatDate(invoiceData.date)}</span>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Invoice Number: </span>
          <span style={{ fontSize: 12 }}>{invoiceData.invoiceNumber}</span>
        </div>
      </div>

      {/* Simplified - No separate Invoice Details section */}

      {/* Items table - Matching Image Layout */}
      <div className="no-break" style={{ marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '50%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              {['TRANSCRIPT', 'VOLUME/PAGES', 'DATE', 'AMOUNT'].map(h => (
                <th key={h} style={{ textAlign: h === 'TRANSCRIPT' ? 'left' : h === 'AMOUNT' ? 'right' : 'left', padding: cellPad, fontSize: 11, letterSpacing: 0.4, color: '#6b7280', fontWeight: 700, verticalAlign: 'middle', height: rowHeight }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: cellPad, verticalAlign: 'top', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'pre-line', fontSize: 11.5 }}>{it.description}</td>
                <td style={{ padding: cellPad, verticalAlign: 'top', fontSize: 11.5 }}>{invoiceData.lineItems[i]?.notes || ''}</td>
                <td style={{ padding: cellPad, verticalAlign: 'top', fontSize: 11.5 }}>{invoiceData.customFields?.dateOfHearing ? formatDate(invoiceData.customFields.dateOfHearing) : ''}</td>
                <td style={{ padding: cellPad, verticalAlign: 'top', textAlign: 'right', fontWeight: 700, fontSize: 11.5 }}>{money(it.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, borderTop: '1px solid #e5e7eb', fontSize: 12 }}>Total:</td>
              <td style={{ padding: cellPad, textAlign: 'right', fontWeight: 800, borderTop: '1px solid #e5e7eb', color: '#000', fontSize: 12 }}>{money(subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment inline with QR */}
      <div className="no-break" style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, alignItems: 'start', marginTop: 6 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Payment Methods:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 10, rowGap: 8, alignItems: 'center' }}>
            <div style={{ ...chip, background: '#22c55e' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 1v14M11.5 4.5c0-1.38-1.79-2.5-3.5-2.5S4.5 3.12 4.5 4.5 6.29 7 8 7s3.5 1.12 3.5 2.5S9.71 12 8 12s-3.5-1.12-3.5-2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 12.5, color: '#374151' }}>Venmo: <strong>@ValerieDeLeon-CSR</strong></div>
            <div style={{ ...chip, background: '#3b82f6' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 6h18v12H3z" stroke="white" strokeWidth="1.8"/>
                <path d="M3 7l9 6 9-6" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <div style={{ fontSize: 12.5, color: '#374151' }}>
              <div>Mail check to:</div>
              <div>Valerie De Leon, CSR</div>
              <div>126 Old Settlers Drive</div>
              <div>San Marcos, TX 78666</div>
            </div>
          </div>
        </div>
        <div style={{ width: 200, textAlign: 'center' }}>
          <VenmoQRCode hideCaption sizePx={160} tight scale={1.05} />
          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 8, lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word' }}>Scan QR code or search for <strong>@ValerieDeLeon-CSR</strong></div>
        </div>
      </div>
    </div>
  );
}


