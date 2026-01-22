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

      {/* Header */}
      <div className="no-break" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 16, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 0.5, color: '#6d28d9' }}>INVOICE</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12.5 }}>
            <span style={{ marginRight: 14 }}>#{invoiceData.invoiceNumber}</span>
            <span>DATE: {formatDate(invoiceData.date)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Valerie De Leon, CSR</div>
          <div style={{ color: '#4b5563', fontSize: 12.5 }}>126 Old Settlers Drive, San Marcos, TX 78666</div>
          <div style={{ color: '#4b5563', fontSize: 12.5 }}>valeriedeleon.csr@gmail.com</div>
        </div>
      </div>

      <div style={{ height: 2, background: '#6d28d9', opacity: 0.85, margin: '8px 0 14px' }} />

      {/* Bill To + Invoice Details */}
      <div className="no-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>BILL TO:</div>
          {invoiceData.manualClient?.company && (
            <div style={{ fontWeight: 700, fontSize: 14 }}>{invoiceData.manualClient.company}</div>
          )}
          <div style={{ fontWeight: 700, fontSize: 14 }}>{invoiceData.manualClient?.name}</div>
          <div style={{ color: '#374151', fontSize: 12.5, whiteSpace: 'pre-line' }}>{invoiceData.manualClient?.address}</div>
          {invoiceData.manualClient?.email && (
            <div style={{ color: '#374151', fontSize: 12.5 }}>{invoiceData.manualClient.email}</div>
          )}
          {invoiceData.manualClient?.phone && (
            <div style={{ color: '#374151', fontSize: 12.5 }}>{invoiceData.manualClient.phone}</div>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Invoice Details:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 4 }}>
            <div style={{ color: '#6b7280' }}>Invoice Number:</div>
            <div style={{ color: '#111827' }}>{invoiceData.invoiceNumber}</div>
            <div style={{ color: '#6b7280' }}>Date:</div>
            <div style={{ color: '#111827' }}>{formatDate(invoiceData.date)}</div>
            {invoiceData.dueDate && (
              <>
                <div style={{ color: '#6b7280' }}>Due Date:</div>
                <div style={{ color: '#111827' }}>{formatDate(invoiceData.dueDate)}</div>
              </>
            )}
            {invoiceData.customFields?.dateOfHearing && (
              <>
                <div style={{ color: '#6b7280' }}>Hearing Date:</div>
                <div style={{ color: '#111827' }}>{formatDate(invoiceData.customFields.dateOfHearing)}</div>
              </>
            )}
            {invoiceData.customFields?.county && (
              <>
                <div style={{ color: '#6b7280' }}>County:</div>
                <div style={{ color: '#111827' }}>{invoiceData.customFields.county}</div>
              </>
            )}
            {invoiceData.customFields?.caseName && (
              <>
                <div style={{ color: '#6b7280' }}>Case Name:</div>
                <div style={{ color: '#111827' }}>{invoiceData.customFields.caseName}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="no-break" style={{ marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '60%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              {['ITEM', 'QTY', 'PRICE', 'TOTAL'].map(h => (
                <th key={h} style={{ textAlign: h === 'ITEM' ? 'left' : 'right', padding: cellPad, fontSize: 12, letterSpacing: 0.4, color: '#6b7280', fontWeight: 700, verticalAlign: 'middle', height: rowHeight }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: cellPad, verticalAlign: 'middle', height: rowHeight, textAlign: 'left', wordBreak: 'break-word' }}>{it.description}</td>
                <td style={{ padding: cellPad, verticalAlign: 'middle', height: rowHeight, textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ padding: cellPad, verticalAlign: 'middle', height: rowHeight, textAlign: 'right' }}>{money(it.rate)}</td>
                <td style={{ padding: cellPad, verticalAlign: 'middle', height: rowHeight, textAlign: 'right', fontWeight: 700 }}>{money(it.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} />
              <td style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, borderTop: '1px solid #e5e7eb' }}>TOTAL</td>
              <td style={{ padding: cellPad, textAlign: 'right', fontWeight: 800, borderTop: '1px solid #e5e7eb', color: '#6d28d9' }}>{money(subtotal)}</td>
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


