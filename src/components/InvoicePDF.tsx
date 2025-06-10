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

// Financial truncation utility - cuts off at 2 decimal places (no rounding)
const truncateToTwoDecimals = (amount: number): number => {
  return Math.floor(amount * 100) / 100;
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
  // Calculate totals with proper financial truncation (cut off at 2 decimals)
  const lineItemsWithTotals = invoiceData.lineItems.map(item => ({
    ...item,
    total: truncateToTwoDecimals(item.quantity * item.rate)
  }));
  
  const grandTotal = truncateToTwoDecimals(lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0));

  return (
    <div 
      id="invoice-pdf-content" 
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#333',
        maxWidth: '8.5in',
        margin: '0 auto',
        padding: '0.25in 0.4in 0.4in 0.4in',
        backgroundColor: 'white',
        boxSizing: 'border-box'
      }}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '24px',
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '24px',
        marginBottom: '24px',
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
      <div style={{ marginBottom: '30px' }}>
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
                padding: '14px 10px', // More comfortable padding
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px'
              }}>
                Number
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '14px 10px',
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px'
              }}>
                Description
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '14px 10px',
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px'
              }}>
                Quantity
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '14px 10px',
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px'
              }}>
                Rate
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '14px 10px',
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '13px'
              }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItemsWithTotals.map((item, index) => (
              <tr key={index}>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '12px 10px', // Comfortable row height
                  textAlign: 'center',
                  fontSize: '13px'
                }}>
                  {item.number}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '12px 10px',
                  fontSize: '13px'
                }}>
                  {item.description}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '12px 10px',
                  textAlign: 'center',
                  fontSize: '13px'
                }}>
                  {item.quantity}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '12px 10px',
                  textAlign: 'right',
                  fontSize: '13px'
                }}>
                  {formatCurrency(item.rate)}
                </td>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '12px 10px',
                  textAlign: 'right', 
                  fontWeight: '600',
                  fontSize: '13px'
                }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ 
              backgroundColor: '#f9fafb',
              pageBreakInside: 'avoid' // Keep total row together
            }}>
              <td 
                colSpan={4} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '14px 10px',
                  textAlign: 'right', 
                  fontWeight: 'bold', 
                  fontSize: '15px'
                }}
              >
                Grand Total:
              </td>
              <td style={{ 
                border: '1px solid #e5e7eb', 
                padding: '14px 10px',
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
      <div style={{ 
        backgroundColor: '#f0fdf4', 
        border: '1px solid #bbf7d0', 
        borderRadius: '8px', 
        padding: '24px', // More comfortable padding
        marginBottom: '30px',
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
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px'
        }}>
          {/* Venmo with QR Code */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flexShrink: 0 }}>
              <VenmoQRCode />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  backgroundColor: '#22c55e', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>$</span>
                </div>
                <div>
                  <p style={{ fontWeight: '500', color: '#333', margin: '0', fontSize: '14px' }}>Venmo</p>
                  <p style={{ color: '#666', margin: '0', fontSize: '13px' }}>@ValerieDeLeon-CSR</p>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                Scan QR code or search for @ValerieDeLeon-CSR
              </p>
            </div>
          </div>

          {/* Mail Check */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: '2px'
            }}>
              <span style={{ color: 'white', fontSize: '12px' }}>✉</span>
            </div>
            <div>
              <p style={{ fontWeight: '500', color: '#333', margin: '0 0 6px 0', fontSize: '14px' }}>
                Mail Check To:
              </p>
              <div style={{ color: '#666', lineHeight: '1.6' }}>
                <p style={{ margin: '0', fontSize: '13px' }}>Valerie De Leon, CSR</p>
                <p style={{ margin: '0', fontSize: '13px' }}>126 Old Settlers Drive</p>
                <p style={{ margin: '0', fontSize: '13px' }}>San Marcos, TX 78666</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature & Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        marginBottom: '24px',
        marginTop: '32px',
        minHeight: '120px',
        pageBreakInside: 'avoid'
      }}>
        <div style={{ 
          flex: '1', 
          marginRight: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <p style={{ 
            color: '#666', 
            fontWeight: '500', 
            margin: '0 0 8px 0',
            fontSize: '14px'
          }}>
            Court Reporter Signature:
          </p>
          <div style={{ 
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            marginBottom: '16px'
          }}>
            <SignatureImage />
          </div>
          <div style={{ marginTop: 'auto' }}>
            <p style={{ 
              color: '#666', 
              fontWeight: '500',
              margin: '0 0 4px 0',
              fontSize: '14px'
            }}>
              Date:
            </p>
            <p style={{ 
              color: '#333',
              margin: '0',
              fontSize: '14px'
            }}>
              {formatDate(invoiceData.date)}
            </p>
          </div>
        </div>
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