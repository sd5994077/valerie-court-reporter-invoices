import React from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { SignatureImage } from './SignatureImage';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoicePDFProps {
  invoiceData: InvoiceFormData;
}

export function InvoicePDF({ invoiceData }: InvoicePDFProps) {
  // Calculate totals
  const lineItemsWithTotals = invoiceData.lineItems.map(item => ({
    ...item,
    total: item.quantity * item.rate
  }));
  
  const grandTotal = lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0);
  const includeJudgeSignature = !!invoiceData.customFields?.includeJudgeSignature;
  const serviceTypeValue = invoiceData.customFields?.serviceType === 'Other'
    ? (invoiceData.customFields?.serviceTypeOther || 'Other')
    : invoiceData.customFields?.serviceType;
  
  // Compact mode for long invoices to keep high-quality one-page output when possible
  const COMPACT_THRESHOLD = 12;
  const compact = lineItemsWithTotals.length > COMPACT_THRESHOLD;
  
  // Dense mode for small invoices to tighten whitespace
  const DENSE_THRESHOLD = 10;
  const dense = lineItemsWithTotals.length <= DENSE_THRESHOLD;
  
  const baseFont = compact ? 13 : (dense ? 13.5 : 14);
  const baseLH   = compact ? 1.35 : (dense ? 1.45 : 1.5);
  const containerPadding = compact
    ? '0.3in 0.35in 0.35in'
    : (dense ? '0.35in 0.4in 0.4in' : '0.4in 0.4in 0.45in');
  
  const thPad = compact ? '10px 8px' : (dense ? '12px 8px' : '14px 10px');
  const tdPad = compact ? '8px 8px'  : (dense ? '10px 8px' : '12px 10px');

  return (
    <div 
      id="invoice-pdf-content" 
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: `${baseFont}px`,
        lineHeight: baseLH,
        color: '#333',
        maxWidth: '8.5in',
        margin: '0 auto',
        padding: containerPadding,
        backgroundColor: 'white',
        boxSizing: 'border-box'
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');

        /* Print/page rules to stabilize PDF output */
        @page { size: Letter; margin: 0.5in; }

        @media print {
          html, body { height: auto !important; }
          #invoice-pdf-content { break-inside: avoid; }
          table thead { display: table-header-group; }
          table tfoot { display: table-footer-group; }
          .no-break { break-inside: avoid; }
          .break-before { break-before: page; }
        }
      `}</style>

      {/* Header - Centered Court Reporter Information */}
      <div className="no-break" style={{ 
        textAlign: 'center',
        marginBottom: dense ? '20px' : '28px',
        paddingBottom: '16px',
        borderBottom: '2px solid #7c3aed',
      }}>
        <h1 style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          color: '#333', 
          margin: '0 0 6px 0'
        }}>
          Valerie DeLeon, CSR
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '14px',
          margin: '0 0 2px 0'
        }}>
          126 Old Settlers Drive
        </p>
        <p style={{ 
          color: '#666', 
          fontSize: '14px',
          margin: '0 0 2px 0'
        }}>
          San Marcos, Texas 78666
        </p>
        <p style={{ 
          color: '#666', 
          fontSize: '14px',
          margin: '0 0 2px 0'
        }}>
          512-878-3327
        </p>
        <p style={{ 
          color: '#666', 
          fontSize: '14px',
          margin: '0'
        }}>
          valeriedeleon.csr@gmail.com
        </p>
      </div>

      {/* Invoice Date and Number - Same Line */}
      <div className="no-break" style={{ 
        marginBottom: dense ? '18px' : '24px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span style={{ fontWeight: '600', color: '#666' }}>Invoice Date: </span>
              <span style={{ color: '#333' }}>{formatDate(invoiceData.date)}</span>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#666' }}>Invoice Number: </span>
              <span style={{ color: '#333' }}>{invoiceData.invoiceNumber}</span>
            </div>
        </div>
        {invoiceData.customFields?.causeNumber && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#666' }}>Cause Number: </span>
                  <span style={{ color: '#333' }}>{invoiceData.customFields.causeNumber}</span>
                </div>
            </div>
        )}
        {serviceTypeValue && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <div>
              <span style={{ fontWeight: '600', color: '#666' }}>Service Type: </span>
              <span style={{ color: '#333' }}>{serviceTypeValue}</span>
            </div>
          </div>
        )}

        {invoiceData.customFields?.comments && (
          <div style={{ marginTop: 10 }}>
            <div style={{ 
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '12px 14px'
            }}>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 13, marginBottom: 6 }}>
                Invoice Comments:
              </div>
              <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: 13 }}>
                {invoiceData.customFields.comments}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simplified - No separate Invoice Details section */}

      {/* Line Items Table - Matching Image Layout */}
      <div className="no-break" style={{ marginBottom: dense ? '20px' : '30px' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f9fafb',
              pageBreakInside: 'avoid'
            }}>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle',
                width: '50%'
              }}>
                Transcript
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle',
                width: '20%'
              }}>
                Volume/Pages
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle',
                width: '15%'
              }}>
                Date
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle',
                width: '15%'
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItemsWithTotals.map((item, index) => (
              <tr key={index} style={{ breakInside: 'avoid' }}>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  fontSize: '13px',
                  verticalAlign: 'top',
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  lineHeight: dense ? 1.35 : 1.45
                }}>
                  {item.description}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  fontSize: '13px',
                  verticalAlign: 'top'
                }}>
                  {item.notes || ''}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  fontSize: '13px',
                  verticalAlign: 'top'
                }}>
                  {invoiceData.customFields?.dateOfHearing ? formatDate(invoiceData.customFields.dateOfHearing) : ''}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  textAlign: 'right', 
                  fontWeight: '600',
                  fontSize: '13px',
                  verticalAlign: 'top'
                }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ 
              backgroundColor: '#f9fafb',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              <td 
                colSpan={3} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: thPad,
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  fontSize: '15px'
                }}
              >
                Total:
              </td>
              <td style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '15px', 
                color: '#000'
              }}>
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Options */}
      <div className={compact ? 'break-before no-break' : 'no-break'} style={{ 
        backgroundColor: '#f0fdf4', 
        border: '1px solid #bbf7d0', 
        borderRadius: '8px', 
        padding: dense || compact ? '16px' : '24px',
        marginBottom: dense ? '20px' : '30px',
        pageBreakInside: 'avoid' // Keep payment options together when possible
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#333', 
          margin: '0 0 16px 0'
        }}>
          Payment Options:
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr', 
          gap: dense ? '16px' : '24px',
          alignItems: 'start'
        }}>
          {/* Venmo with QR Code */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: 128, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid #e9d5ff', borderRadius: '8px', padding: '4px', backgroundColor: 'white' }}>
              {/* Use regular img tag instead of Next Image for PDF generation compatibility */}
              <img 
                src="/assets/Venmo-Val.jpg" 
                alt="Venmo QR Code"
                width={120}
                height={120}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ marginBottom: 6, lineHeight: 1.2 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#333' }}>Venmo</p>
                <p style={{ margin: 0, fontSize: 12.5, color: '#666' }}>@ValerieDeLeon-CSR</p>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Scan QR code or search for @ValerieDeLeon-CSR
              </p>
            </div>
          </div>

          {/* Mail Check */}
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: 14, color: '#333', lineHeight: 1 }}>
              Mail Check To:
            </p>
            <div style={{ color: '#666', lineHeight: dense ? 1.35 : 1.5, fontSize: 12.5 }}>
              <p style={{ margin: 0 }}>Valerie De Leon, CSR</p>
              <p style={{ margin: 0 }}>126 Old Settlers Drive</p>
              <p style={{ margin: 0 }}>San Marcos, TX 78666</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="no-break" style={{ 
        display: 'flex',
        flexDirection: compact ? 'column' : 'row',
        justifyContent: 'flex-start',
        alignItems: compact ? 'flex-start' : 'flex-end',
        gap: compact ? 16 : 40,
        marginTop: dense ? '20px' : '32px',
        marginBottom: dense ? '16px' : '24px',
        pageBreakInside: 'avoid'
      }}>
        <div>
          <p style={{ color: '#666', fontWeight: 500, margin: '0 0 6px 0', fontSize: 14 }}>
            Court Reporter Signature:
          </p>
          <div style={{ transform: 'scale(0.75)', transformOrigin: 'left top', display: 'inline-block', marginBottom: dense ? 8 : 10 }}>
            <SignatureImage showDetails={false} />
          </div>
          <div style={{ borderTop: '1px solid #9ca3af', width: '260px', marginBottom: 4 }} />
          <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
            Valerie De Leon, CSR #13025
          </p>
        </div>

        {includeJudgeSignature && (
          <div style={{ marginTop: compact ? 8 : 0 }}>
            <div style={{ height: 80 }}></div> {/* Spacer to align bottom line with signature */}
            <div style={{ borderTop: '1px solid #9ca3af', width: '260px', marginBottom: 4 }} />
            <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
              {invoiceData.customFields?.judgeName ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: invoiceData.customFields.judgeName.replace(/22nd/g, '22<sup>nd</sup>') 
                }} />
              ) : (
                "Judge's Signature"
              )}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Blank per requirements */}
      <div style={{ 
        textAlign: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto',
        minHeight: '40px'
      }}>
        {/* Footer left blank per customer requirements */}
      </div>
    </div>
  );
} 