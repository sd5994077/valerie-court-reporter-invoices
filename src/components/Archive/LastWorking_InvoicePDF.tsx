import React from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { SignatureImage } from './SignatureImage';
import { VenmoQRCode } from './VenmoQRCode';

// Currency formatting utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Date formatting utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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

      {/* Header */}
      <div className="no-break" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: dense ? '18px' : '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #7c3aed',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#7c3aed', 
            margin: '0 0 8px 0'
          }}>
            Court Reporter Invoice
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '16px',
            margin: '0'
          }}>
            {invoiceData.invoiceNumber}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#7c3aed', 
            margin: '0 0 4px 0'
          }}>
            Valerie De Leon, CSR #13025
          </h2>
          <p style={{ 
            color: '#666', 
            fontWeight: '500', 
            margin: '0 0 8px 0'
          }}>
            126 Old Settlers Drive, San Marcos, TX 78666
          </p>
          <p style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            gap: '8px' 
          }}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ color: 'rgb(107, 114, 128)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span>valeriedeleon.csr@gmail.com</span>
          </p>
        </div>
      </div>

      {/* Bill To & Invoice Details */}
      <div className="no-break" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: dense ? '18px' : '24px',
        marginBottom: dense ? '18px' : '24px',
      }}>
        {/* Bill To */}
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#333', 
            margin: '0 0 12px 0'
          }}>
            Bill To:
          </h3>
          <div style={{ color: '#666', lineHeight: '1.6' }}>
            {invoiceData.manualClient?.company && (
              <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                {invoiceData.manualClient.company}
              </p>
            )}
            <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
              {invoiceData.manualClient?.name?.replace(/\s+/g, ' ').trim()}
            </p>
            {invoiceData.manualClient?.address && (
              <p style={{ 
                margin: '0 0 4px 0',
                whiteSpace: 'pre-line'
              }}>
                {invoiceData.manualClient.address}
              </p>
            )}
            {invoiceData.manualClient?.email && (
              <p style={{ margin: '0 0 4px 0' }}>
                {invoiceData.manualClient.email}
              </p>
            )}
            {invoiceData.manualClient?.phone && (
              <p style={{ margin: '0' }}>
                {invoiceData.manualClient.phone}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#333', 
            margin: '0 0 12px 0'
          }}>
            Invoice Details:
          </h3>
          <div style={{ lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Invoice Number:</span>
              <span style={{ color: '#333' }}>{invoiceData.invoiceNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Date:</span>
              <span style={{ color: '#333' }}>{formatDate(invoiceData.date)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Due Date:</span>
              <span style={{ color: '#333' }}>{formatDate(invoiceData.dueDate)}</span>
            </div>
            {invoiceData.customFields?.dateOfHearing && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Hearing Date:</span>
                <span style={{ color: '#333' }}>{formatDate(invoiceData.customFields.dateOfHearing)}</span>
              </div>
            )}
            {invoiceData.customFields?.county && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>County:</span>
                <span style={{ color: '#333' }}>{invoiceData.customFields.county}</span>
              </div>
            )}
            {invoiceData.customFields?.caseName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Case Name:</span>
                <span style={{ color: '#333' }}>{invoiceData.customFields.caseName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="no-break" style={{ marginBottom: dense ? '20px' : '30px' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f9fafb',
              pageBreakInside: 'avoid' // Keep header together
            }}>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad, // Responsive padding
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle'
              }}>
                Number
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle'
              }}>
                Description
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle'
              }}>
                Quantity
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle'
              }}>
                Rate
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px',
                verticalAlign: 'middle'
              }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItemsWithTotals.map((item, index) => (
              <tr key={index} style={{ breakInside: 'avoid' }}>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  textAlign: 'center',
                  fontSize: '13px',
                  verticalAlign: 'middle'
                }}>
                  {item.number}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  fontSize: '13px',
                  verticalAlign: 'middle',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: dense ? 1.35 : 1.45
                }}>
                  {item.description}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  textAlign: 'center',
                  fontSize: '13px',
                  verticalAlign: 'middle'
                }}>
                  {item.quantity}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  textAlign: 'right',
                  fontSize: '13px',
                  verticalAlign: 'middle'
                }}>
                  {formatCurrency(item.rate)}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: tdPad,
                  textAlign: 'right', 
                  fontWeight: '600',
                  fontSize: '13px',
                  verticalAlign: 'middle'
                }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ 
              backgroundColor: '#f9fafb',
              pageBreakInside: 'avoid', // Keep total row together
              breakInside: 'avoid'
            }}>
              <td 
                colSpan={4} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: thPad,
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  fontSize: '15px'
                }}
              >
                Grand Total:
              </td>
              <td style={{ 
                border: '1px solid #e5e7eb', 
                padding: thPad,
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '15px', 
                color: '#7c3aed'
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
            <div style={{ width: 128, height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <VenmoQRCode hideCaption sizePx={128} />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, lineHeight: 1 }}>
                <div style={{ 
                  width: 22, 
                  height: 22, 
                  backgroundColor: '#22c55e', 
                  borderRadius: '50%', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flex: '0 0 22px'
                }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>$</span>
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#333' }}>Venmo</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#666' }}>@ValerieDeLeon-CSR</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Scan QR code or search for @ValerieDeLeon-CSR
              </p>
            </div>
          </div>

          {/* Mail Check */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 22, 
              height: 22, 
              backgroundColor: '#3b82f6', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: '0 0 22px'
            }}>
              <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✉</span>
            </div>
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
      </div>

      {/* Signature only (smaller) */}
      <div className="no-break" style={{ 
        display: 'block',
        marginTop: dense ? '20px' : '32px',
        marginBottom: dense ? '16px' : '24px',
        pageBreakInside: 'avoid'
      }}>
        <p style={{ color: '#666', fontWeight: 500, margin: '0 0 6px 0', fontSize: 14 }}>
          Court Reporter Signature:
        </p>
        <div style={{ transform: 'scale(0.75)', transformOrigin: 'left top', display: 'inline-block', marginBottom: dense ? 8 : 10 }}>
          <SignatureImage />
        </div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
          Valerie De Leon, CSR #13025
        </p>
      </div>

      {/* Thank You Message */}
      <div style={{ 
        textAlign: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto'
      }}>
        <p style={{ 
          color: '#666', 
          fontWeight: '500',
          margin: '0 0 4px 0'
        }}>
          Thank you for your business!
        </p>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '12px',
          margin: '0'
        }}>
          Payment is due within 30 days of invoice date.
        </p>
      </div>
    </div>
  );
} 