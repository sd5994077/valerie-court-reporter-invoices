import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { InvoiceFormData } from '../src/types/invoice';
import { SignatureImage } from '../src/components/SignatureImage';
import { VenmoQRCode } from '../src/components/VenmoQRCode';
import { Toast } from '../src/components/Toast';

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

// PDF generation function
const isProbablyIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;
  // iPadOS 13+ often reports as "MacIntel" but has touch points.
  const iPadOS = platform === 'MacIntel' && maxTouchPoints > 1;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  return iOSUA || iPadOS;
};

const generatePDF = async (invoiceData: InvoiceFormData) => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Find the existing PDF content element or create it
    let pdfElement = document.getElementById('invoice-pdf-content');
    let cleanupTempContainer: HTMLDivElement | null = null;
    let cleanupRoot: { unmount: () => void } | null = null;
    
    if (!pdfElement) {
      // If the PDF element doesn't exist, we need to create it temporarily
      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const { InvoicePDF } = await import('../src/components/InvoicePDF');
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      cleanupTempContainer = tempContainer;
      
      // Render the InvoicePDF component
      const root = ReactDOM.createRoot(tempContainer);
      cleanupRoot = root;
      
      // Create a promise that resolves when rendering is complete
      await new Promise<void>((resolve) => {
        root.render(React.createElement(InvoicePDF, { invoiceData }));
        setTimeout(resolve, 100);
      });
      
      pdfElement = tempContainer.querySelector('#invoice-pdf-content');
      
      if (!pdfElement) {
        throw new Error('Failed to render PDF content');
      }
    }

    // Wait for images to load (critical for iOS)
    const imgs = Array.from(pdfElement.querySelectorAll('img'));
    await Promise.all(
      imgs.map(img => 
        img.complete ? Promise.resolve() : new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 3000); // 3s timeout per image
        })
      )
    );

    // Detect iOS devices
    const isIOS = isProbablyIOS();
    const pdfFilename = `${invoiceData.invoiceNumber}.pdf`;

    const opt = {
      margin: [0.25, 0.4, 0.4, 0.4],
      filename: pdfFilename,
      image: { type: 'jpeg', quality: 0.92 }, // Lower quality for iOS memory
      html2canvas: { 
        scale: isIOS ? 1 : 2, // Scale 1 prevents iOS RAM crashes
        useCORS: true,
        logging: false,
        removeContainer: true
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    if (isIOS) {
      console.log('[iOS PDF] Generating with scale:1 for memory safety...');
      
      // Generate the PDF blob
      const pdfBlob = await html2pdf().set(opt).from(pdfElement).output('blob') as Blob;
      console.log('[iOS PDF] Generated! Size:', Math.round(pdfBlob.size / 1024), 'KB');
      
      // Clean up immediately
      if (cleanupRoot) cleanupRoot.unmount();
      if (cleanupTempContainer?.parentNode) {
        cleanupTempContainer.parentNode.removeChild(cleanupTempContainer);
      }

      // Create File for sharing
      const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });

      // Try Web Share API (native iOS share sheet)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        console.log('[iOS PDF] Opening native share sheet...');
        await navigator.share({ files: [file], title: 'Invoice PDF' });
        return { success: true, method: 'ios-share' };
      }
      
      // Fallback: Open PDF in new tab (Safari will display it)
      console.log('[iOS PDF] Share API unavailable, opening in new tab...');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const newTab = window.open(blobUrl, '_blank');
      
      if (!newTab) {
        // If popup blocked, navigate current page
        window.location.href = blobUrl;
      }
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return { success: true, method: 'ios-view' };
      
    } else {
      // Android/Desktop: Direct download
      await html2pdf().set(opt).from(pdfElement).save();
      
      if (cleanupRoot) cleanupRoot.unmount();
      if (cleanupTempContainer && cleanupTempContainer.parentNode) cleanupTempContainer.parentNode.removeChild(cleanupTempContainer);
      
      return { success: true, method: 'download' };
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export default function ViewInvoice() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Load invoice data from localStorage
    const viewingInvoiceData = localStorage.getItem('viewingInvoice');
    if (viewingInvoiceData) {
      try {
        const invoice = JSON.parse(viewingInvoiceData);
        setInvoiceData(invoice);
      } catch (error) {
        console.error('Failed to parse viewing invoice data:', error);
        router.push('/dashboard');
      }
    } else {
      // No invoice data, redirect to dashboard
      router.push('/dashboard');
    }
  }, [router]);

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const lineItemsWithTotals = invoiceData.lineItems.map(item => ({
    ...item,
    total: item.quantity * item.rate
  }));
  
  const grandTotal = lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0);

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    
    try {
      console.log('=== PDF DOWNLOAD v3.1 ===');
      console.log('iOS:', isProbablyIOS(), '| UA:', navigator.userAgent.slice(0, 50));

      const result = await generatePDF(invoiceData);
      
      if (result.method === 'ios-share') {
        setToastMessage('✅ PDF saved! Open Files app to view.');
      } else if (result.method === 'ios-view') {
        setToastMessage('📱 PDF opened! Tap Share icon to save to Files.');
      } else {
        setToastMessage('✅ PDF downloaded successfully!');
      }
      setShowToast(true);
    } catch (error) {
      console.error('PDF failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`PDF Error: ${msg}`);
      setToastMessage(`❌ ${msg}`);
      setShowToast(true);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleBackToDashboard = () => {
    // Clear viewing invoice data
    localStorage.removeItem('viewingInvoice');
    router.push('/dashboard');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* DEPLOYMENT VERSION INDICATOR - REMOVE AFTER TESTING */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-2 px-4 text-center font-bold text-lg shadow-lg">
          🚀 v3.1-iOS-NoPreOpen 🚀
        </div>
        
        {/* Header with Action Buttons */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">View Invoice</h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Dashboard</span>
                  </div>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {pdfGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-content">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-purple-600 mb-2">Court Reporter Invoice</h1>
                  <p className="text-gray-600 text-lg">{invoiceData.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-purple-600 mb-1">Valerie De Leon, CSR #13025</h2>
                  <p className="text-gray-600 font-medium mb-2">126 Old Settlers Drive, San Marcos, TX 78666</p>
                  <p className="text-gray-600">valeriedeleon.csr@gmail.com</p>
                </div>
              </div>

              {/* Bill To & Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Bill To */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
                  <div className="text-gray-600 space-y-1">
                    {invoiceData.manualClient?.company && (
                      <p className="font-medium">{invoiceData.manualClient.company}</p>
                    )}
                    <p className="font-medium">{invoiceData.manualClient?.name?.replace(/\s+/g, ' ').trim()}</p>
                    {invoiceData.manualClient?.address && (
                      <p className="whitespace-pre-line">{invoiceData.manualClient.address}</p>
                    )}
                    {invoiceData.manualClient?.email && (
                      <p>{invoiceData.manualClient.email}</p>
                    )}
                    {invoiceData.manualClient?.phone && (
                      <p>{invoiceData.manualClient.phone}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Details:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Invoice Number:</span>
                      <span className="text-gray-800">{invoiceData.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="text-gray-800">{formatDate(invoiceData.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Due Date:</span>
                      <span className="text-gray-800">{formatDate(invoiceData.dueDate)}</span>
                    </div>
                    {invoiceData.customFields?.dateOfHearing && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Hearing Date:</span>
                        <span className="text-gray-800">{formatDate(invoiceData.customFields.dateOfHearing)}</span>
                      </div>
                    )}
                    {invoiceData.customFields?.county && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">County:</span>
                        <span className="text-gray-800">{invoiceData.customFields.county}</span>
                      </div>
                    )}
                    {invoiceData.customFields?.caseName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Case Name:</span>
                        <span className="text-gray-800">{invoiceData.customFields.caseName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-8">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Number</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Description</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Quantity</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-800">Rate</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-800">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItemsWithTotals.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-center">{item.number}</td>
                        <td className="border border-gray-200 px-4 py-3">{item.description}</td>
                        <td className="border border-gray-200 px-4 py-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right">{formatCurrency(item.rate)}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="border border-gray-200 px-4 py-3 text-right font-bold text-lg">
                        Grand Total:
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right font-bold text-lg text-purple-600">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Options */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Venmo with QR Code */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <VenmoQRCode />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Venmo</p>
                          <p className="text-gray-600">@ValerieDeLeon-CSR</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Scan QR code or search for @ValerieDeLeon-CSR</p>
                    </div>
                  </div>

                  {/* Mail Check */}
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Mail Check To:</p>
                      <div className="text-gray-600">
                        <p>Valerie De Leon, CSR</p>
                        <p>126 Old Settlers Drive</p>
                        <p>San Marcos, TX 78666</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature & Footer */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-gray-600 font-medium mb-2">Court Reporter Signature:</p>
                  <SignatureImage />
                </div>
                <div className="text-right">
                  <p className="text-gray-600 font-medium">Date:</p>
                  <p className="text-gray-800">{formatDate(invoiceData.date)}</p>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 font-medium">Thank you for your business!</p>
                <p className="text-gray-500 text-sm mt-1">Payment is due within 30 days of invoice date.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Version Indicator - Remove after testing */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">v2.1-ios-fix-blob</p>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
} 