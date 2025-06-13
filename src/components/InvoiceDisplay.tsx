import React, { ReactNode } from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { SignatureImage } from './SignatureImage';
import { VenmoQRCode } from './VenmoQRCode';

// Load html2pdf dynamically to avoid SSR issues
const loadHtml2Pdf = async () => {
  if (typeof window !== 'undefined') {
    // Check if already loaded
    if ((window as any).html2pdf) {
      return (window as any).html2pdf;
    }

    try {
      // Try to import from npm package
      const html2pdf = await import('html2pdf.js');
      (window as any).html2pdf = html2pdf.default;
      return html2pdf.default;
    } catch (error) {
      console.warn('Failed to load html2pdf from npm, trying CDN fallback:', error);
      
      // Fallback to CDN
      return new Promise((resolve, reject) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          if ((window as any).html2pdf) {
            resolve((window as any).html2pdf);
          } else {
            reject(new Error('html2pdf failed to load from CDN'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load html2pdf script from CDN'));
        document.head.appendChild(script);
      });
    }
  }
  throw new Error('Window object not available (SSR environment)');
};

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

// Clean filename utility - removes special characters for PDF filename
const cleanForFilename = (text: string): string => {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

// Date formatting utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// PDF generation function
export const generatePDF = async (invoiceData: InvoiceFormData) => {
  try {
    // Load html2pdf library
    const html2pdf = await loadHtml2Pdf();
    if (!html2pdf) {
      throw new Error('PDF library failed to load');
    }

    const element = document.getElementById('invoice-content');
    if (!element) {
      throw new Error('Invoice content element not found');
    }

    // Create a temporary container with print-optimized styles
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '8.5in';
    tempContainer.style.backgroundColor = 'white';
    
    // Clone the invoice content
    const clonedElement = element.cloneNode(true) as HTMLElement;
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);
    
    // Apply print-specific optimizations to the cloned element
    clonedElement.style.padding = '0.1in 0.25in 0.25in 0.25in'; // Tighter top/bottom padding for better fit
    clonedElement.style.fontSize = '11px';
    clonedElement.style.lineHeight = '1.3';
    
    // Add graceful page break controls
    clonedElement.style.pageBreakInside = 'auto';
    clonedElement.style.orphans = '3';
    clonedElement.style.widows = '3';
    
    // Force desktop layout for PDF - override responsive classes
    // Show desktop table (normally hidden on mobile)
    const desktopTable = clonedElement.querySelector('.hidden.sm\\:block');
    if (desktopTable) {
      (desktopTable as HTMLElement).style.display = 'block';
    }
    
    // Hide mobile cards (normally shown on mobile)
    const mobileCards = clonedElement.querySelector('.sm\\:hidden');
    if (mobileCards) {
      (mobileCards as HTMLElement).style.display = 'none';
    }
    
    // Reduce header spacing for PDF but allow breaking if needed
    const header = clonedElement.querySelector('.flex.flex-col.space-y-3');
    if (header) {
      (header as HTMLElement).style.marginBottom = '8px';
      (header as HTMLElement).style.pageBreakAfter = 'avoid';
      // Remove pageBreakInside='avoid' to allow multi-page PDFs
    }
    
    // Ensure side-by-side layout for Bill To & Invoice Details but allow page breaks
    const billToSection = clonedElement.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    if (billToSection) {
      (billToSection as HTMLElement).style.pageBreakInside = 'auto'; // Allow breaking
      (billToSection as HTMLElement).style.setProperty('display', 'grid', 'important');
      (billToSection as HTMLElement).style.setProperty('grid-template-columns', '1fr 1fr', 'important');
      (billToSection as HTMLElement).style.setProperty('gap', '24px', 'important');
    }
    
    // Optimize table spacing for PDF and prevent row splitting
    const table = clonedElement.querySelector('table');
    if (table) {
      table.style.fontSize = '9.5px'; // Smaller font for more rows
      table.style.lineHeight = '1.25'; // Tighter line height
      table.style.pageBreakInside = 'auto';
      table.style.borderCollapse = 'collapse';
      
      // Prevent table header from being orphaned
      const thead = table.querySelector('thead');
      if (thead) {
        (thead as HTMLElement).style.pageBreakAfter = 'avoid';
      }
      
      // Prevent individual table rows from breaking
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        (row as HTMLElement).style.pageBreakInside = 'avoid';
        (row as HTMLElement).style.pageBreakAfter = 'auto';
      });
      
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        (cell as HTMLElement).style.padding = '4px 6px'; // Tighter cell padding for more rows
      });
    }
    
    // Fix payment section text overlapping but allow page breaks
    const paymentSection = clonedElement.querySelector('.bg-green-50');
    if (paymentSection) {
      (paymentSection as HTMLElement).style.padding = '12px';
      (paymentSection as HTMLElement).style.marginBottom = '8px';
      (paymentSection as HTMLElement).style.pageBreakInside = 'auto'; // Allow breaking
      (paymentSection as HTMLElement).style.marginTop = '4px'; // Much smaller gap above Payment Options
      
      // Force desktop layout for Payment Options in PDF
      const paymentGrid = paymentSection.querySelector('.flex.flex-col.lg\\:grid');
      if (paymentGrid) {
        (paymentGrid as HTMLElement).style.setProperty('display', 'grid', 'important');
        (paymentGrid as HTMLElement).style.setProperty('grid-template-columns', '2fr 1fr', 'important');
        (paymentGrid as HTMLElement).style.setProperty('gap', '16px', 'important');
        (paymentGrid as HTMLElement).style.setProperty('align-items', 'flex-start', 'important');
      }
      
      // Hide mobile divider in PDF
      const mobileDivider = paymentSection.querySelector('.block.lg\\:hidden');
      if (mobileDivider) {
        (mobileDivider as HTMLElement).style.setProperty('display', 'none', 'important');
      }
      
      // Force Venmo section to horizontal layout for PDF
      const venmoSection = paymentSection.querySelector('.flex.flex-col.items-center.lg\\:col-span-2');
      if (venmoSection) {
        (venmoSection as HTMLElement).style.setProperty('display', 'flex', 'important');
        (venmoSection as HTMLElement).style.setProperty('flex-direction', 'row', 'important');
        (venmoSection as HTMLElement).style.setProperty('align-items', 'flex-start', 'important');
        (venmoSection as HTMLElement).style.setProperty('gap', '12px', 'important');
        
        // Ensure QR code doesn't take full width
        const qrContainer = venmoSection.querySelector('.flex-shrink-0');
        if (qrContainer) {
          (qrContainer as HTMLElement).style.setProperty('margin-bottom', '0', 'important');
        }
        
        // Align text content properly
        const textContainer = venmoSection.querySelector('.flex.flex-col.items-center');
        if (textContainer) {
          (textContainer as HTMLElement).style.setProperty('text-align', 'left', 'important');
          (textContainer as HTMLElement).style.setProperty('align-items', 'flex-start', 'important');
        }
      }
      
      // Force override all text in payment section to be larger and clearer
      const allElements = paymentSection.querySelectorAll('*');
      allElements.forEach(element => {
        const text = element.textContent || '';
        const htmlElement = element as HTMLElement;
        
        // Force larger font sizes with higher specificity and better clarity
        if (text.includes('@ValerieDeLeon-CSR') || text.includes('Valerie De Leon, CSR') || 
            text.includes('126 Old Settlers Drive') || text.includes('San Marcos, TX')) {
          htmlElement.style.setProperty('font-family', 'Arial, sans-serif', 'important');
          htmlElement.style.setProperty('font-size', '12.5px', 'important');
          htmlElement.style.setProperty('font-weight', '500', 'important');
          htmlElement.style.setProperty('line-height', '1.4', 'important');
          htmlElement.style.setProperty('letter-spacing', '0.1px', 'important');
        } else if (text.includes('Venmo') || text.includes('Mail Check To')) {
          htmlElement.style.setProperty('font-family', 'Arial, sans-serif', 'important');
          htmlElement.style.setProperty('font-size', '12px', 'important');
          htmlElement.style.setProperty('font-weight', '600', 'important');
          htmlElement.style.setProperty('line-height', '1.3', 'important');
          htmlElement.style.setProperty('letter-spacing', '0.1px', 'important');
        } else if (text.trim() && text.includes('Scan QR code')) {
          htmlElement.style.setProperty('font-family', 'Arial, sans-serif', 'important');
          htmlElement.style.setProperty('font-size', '10px', 'important');
          htmlElement.style.setProperty('line-height', '1.3', 'important');
        }
      });
    }
    
    // Keep signature section together (small element, safe to avoid breaking)
    const signatureSection = clonedElement.querySelector('.flex.flex-col.sm\\:flex-row.sm\\:justify-between');
    if (signatureSection) {
      (signatureSection as HTMLElement).style.marginTop = '8px'; // Tighter spacing
      (signatureSection as HTMLElement).style.marginBottom = '6px'; // Tighter spacing
      (signatureSection as HTMLElement).style.pageBreakInside = 'avoid'; // Keep - small element
    }
    
    // Keep "Thank you" footer together (small element, safe to avoid breaking)
    const thankYouSection = clonedElement.querySelector('.text-center.text-gray-600');
    if (thankYouSection) {
      (thankYouSection as HTMLElement).style.pageBreakInside = 'avoid'; // Keep - small element
      (thankYouSection as HTMLElement).style.marginTop = '6px'; // Tighter spacing
      (thankYouSection as HTMLElement).style.marginBottom = '0'; // Container padding handles this
      (thankYouSection as HTMLElement).style.fontSize = '10px';
    }

    // Make sure signature image is properly sized for PDF
    const signatureImages = clonedElement.querySelectorAll('img');
    signatureImages.forEach(img => {
      if (img.src.includes('signature') || img.alt.includes('signature')) {
        img.style.maxHeight = '50px';
        img.style.width = 'auto';
      }
    });

    // Generate filename: Invoice-YYYY-MM-DD-ClientName.pdf
    const invoiceDate = new Date(invoiceData.date);
    const dateStr = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const clientName = invoiceData.manualClient?.name || invoiceData.manualClient?.company || 'Client';
    console.log('🔍 PDF Filename Debug:', {
      clientName,
      originalName: invoiceData.manualClient?.name,
      originalCompany: invoiceData.manualClient?.company,
      cleanedName: cleanForFilename(clientName)
    });
    const filename = `Invoice-${dateStr}-${cleanForFilename(clientName)}.pdf`;

    const opt = {
      margin: [0.25, 0.3, 0.25, 0.3], // Better margins for multi-page support
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollY: 0 // Avoid capturing off-position content
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait'
      },
      pagebreak: { 
        mode: ['css', 'legacy', 'avoid-all'] // Enable proper page breaking
      }
    };

    await html2pdf().set(opt).from(clonedElement).save();
    
    // Clean up temporary container
    document.body.removeChild(tempContainer);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'PDF generation failed');
  }
};

interface InvoiceDisplayProps {
  invoiceData: InvoiceFormData;
  actionButtons?: ReactNode;
  title?: string;
}

export function InvoiceDisplay({ invoiceData, actionButtons, title = "Review Your Invoice" }: InvoiceDisplayProps) {
  // Debug logging for address data
  console.log('🔍 InvoiceDisplay received data:', invoiceData);
  console.log('🔍 InvoiceDisplay client data:', invoiceData.manualClient);
  console.log('🔍 InvoiceDisplay address data:', invoiceData.manualClient?.address);
  console.log('🔍 InvoiceDisplay address type:', typeof invoiceData.manualClient?.address);
  
  // Calculate totals with proper financial truncation (cut off at 2 decimals)
  const lineItemsWithTotals = invoiceData.lineItems.map(item => ({
    ...item,
    total: truncateToTwoDecimals(item.quantity * item.rate)
  }));
  
  const grandTotal = truncateToTwoDecimals(lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0));

  return (
    <>
      {/* Google Fonts */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" 
        rel="stylesheet" 
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header with Action Buttons */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
              {actionButtons && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {actionButtons}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-content">
            <div className="p-4 sm:p-8">
              {/* Header */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 mb-4 sm:mb-5">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">Court Reporter Invoice</h1>
                  <p className="text-gray-600 text-base">{invoiceData.invoiceNumber}</p>
                </div>
                <div className="text-center sm:text-right">
                  <h2 className="text-base sm:text-lg font-bold text-purple-600 mb-1">Valerie De Leon, CSR #13025</h2>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">126 Old Settlers Drive, San Marcos, TX 78666</p>
                  <p className="text-xs sm:text-sm text-gray-600">valeriedeleon.csr@gmail.com</p>
                </div>
              </div>

              {/* Bill To & Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-5 mt-2 sm:mt-4">
                {/* Bill To */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
                  <div className="text-gray-600 space-y-1 text-sm">
                    {/* Combine company and name on same line when both exist, or just name */}
                    {invoiceData.manualClient?.company && invoiceData.manualClient?.name ? (
                      <p className="font-medium">{invoiceData.manualClient.company}</p>
                    ) : null}
                    <p className="font-medium whitespace-nowrap">{invoiceData.manualClient?.name?.replace(/\s+/g, ' ').trim()}</p>
                    {/* Handle address more robustly */}
                    {(() => {
                      const client = invoiceData.manualClient;
                      if (!client) return null;
                      
                      // Check for address field (string)
                      if (client.address && typeof client.address === 'string' && client.address.trim()) {
                        return <p className="whitespace-pre-line">{client.address.trim()}</p>;
                      }
                      
                      // Check for address object with street, city, etc.
                      const addressObj = client.address as any;
                      if (addressObj && typeof addressObj === 'object') {
                        const addressParts = [];
                        if (addressObj.street) addressParts.push(addressObj.street);
                        if (addressObj.city && addressObj.state) {
                          addressParts.push(`${addressObj.city}, ${addressObj.state} ${addressObj.zip || ''}`.trim());
                        } else if (addressObj.city) {
                          addressParts.push(addressObj.city);
                        }
                        if (addressParts.length > 0) {
                          return <p className="whitespace-pre-line">{addressParts.join('\n')}</p>;
                        }
                      }
                      
                      // Check for individual address fields directly on client
                      const directAddressParts = [];
                      if ((client as any).street) directAddressParts.push((client as any).street);
                      if ((client as any).city && (client as any).state) {
                        directAddressParts.push(`${(client as any).city}, ${(client as any).state} ${(client as any).zip || ''}`.trim());
                      } else if ((client as any).city) {
                        directAddressParts.push((client as any).city);
                      }
                      if (directAddressParts.length > 0) {
                        return <p className="whitespace-pre-line">{directAddressParts.join('\n')}</p>;
                      }
                      
                      return null;
                    })()}
                    {invoiceData.manualClient?.email && (
                      <p className="break-all">{invoiceData.manualClient.email}</p>
                    )}
                    {invoiceData.manualClient?.phone && (
                      <p>{invoiceData.manualClient.phone}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Details:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Invoice Number:</span>
                      <span className="text-gray-800 text-right">{invoiceData.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="text-gray-800 text-right">{formatDate(invoiceData.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Due Date:</span>
                      <span className="text-gray-800 text-right">{formatDate(invoiceData.dueDate)}</span>
                    </div>
                    {invoiceData.customFields?.dateOfHearing && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Hearing Date:</span>
                        <span className="text-gray-800 text-right">{formatDate(invoiceData.customFields.dateOfHearing)}</span>
                      </div>
                    )}
                    {invoiceData.customFields?.county && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">County:</span>
                        <span className="text-gray-800 text-right">{invoiceData.customFields.county}</span>
                      </div>
                    )}
                    {invoiceData.customFields?.caseName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Case Name:</span>
                        <span className="text-gray-800 text-right break-words">{invoiceData.customFields.caseName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-2 sm:mb-3">
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Number</th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-800 text-sm">Description</th>
                        <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-800 text-sm">Quantity</th>
                        <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-800 text-sm">Rate</th>
                        <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-800 text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItemsWithTotals.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 text-center text-sm">{item.number}</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">{item.description}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center text-sm">{item.quantity}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right text-sm">{formatCurrency(item.rate)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right font-semibold text-sm">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="border border-gray-200 px-3 py-2 text-right font-bold text-base">
                          Grand Total:
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-right font-bold text-base text-purple-600">
                          {formatCurrency(grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Line Items:</h3>
                  {lineItemsWithTotals.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-purple-600 text-white text-sm font-semibold px-2 py-1 rounded">
                            #{item.number}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">{item.description}</p>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                          <span>Rate: {formatCurrency(item.rate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mobile Grand Total */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                      <span className="text-xl font-bold text-purple-600">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-1 sm:p-2 mb-3 sm:mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Options:</h3>
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-1">
                  {/* Venmo with QR Code */}
                  <div className="flex flex-col items-center lg:col-span-2">
                    <div className="flex-shrink-0 mb-2">
                      <VenmoQRCode />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-800 text-lg">Venmo</p>
                      <p className="text-lg text-gray-500">Scan QR code or search for:</p>
                      <p className="text-gray-600 text-lg">@ValerieDeLeon-CSR</p>
                    </div>
                  </div>
                  {/* Divider for mobile only */}
                  <div className="block lg:hidden border-t border-green-200 my-2"></div>
                  {/* Mail Check */}
                  <div className="flex items-start space-x-3 lg:col-span-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-base">Mail Check To:</p>
                      <div className="text-gray-600 text-base">
                        <p>Valerie De Leon, CSR</p>
                        <p>126 Old Settlers Drive</p>
                        <p>San Marcos, TX 78666</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature & Footer */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end space-y-3 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <p className="text-gray-600 font-medium mb-1 text-sm">Court Reporter Signature:</p>
                  <SignatureImage />
                </div>
                <div className="text-center sm:text-right">
                  <div className="flex flex-col sm:items-end space-y-1">
                    <span className="text-gray-600 font-medium text-sm">Date:</span>
                    <span className="text-gray-800 text-sm">{formatDate(invoiceData.date)}</span>
                  </div>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200">
                <p className="text-gray-600 font-medium text-sm">Thank you for your business!</p>
                <p className="text-gray-500 text-xs mt-1">Payment is due within 30 days of invoice date.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 