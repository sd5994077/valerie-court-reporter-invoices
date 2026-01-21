import React, { useState } from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { SignatureImage } from './SignatureImage';
import { VenmoQRCode } from './VenmoQRCode';
import { Toast } from './Toast';
import { useRouter } from 'next/router';
import { getBranding } from '../config/branding';
import { generatePDF, isProbablyIOS } from '../utils/pdfGenerator';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceReviewProps {
  invoiceData: InvoiceFormData;
}

interface FinalizedInvoice extends InvoiceFormData {
  id: string;
  status: 'finalized';
  finalizedAt: string;
  pdfGenerated: boolean;
}

export function InvoiceReview({ invoiceData }: InvoiceReviewProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizedInvoice, setFinalizedInvoice] = useState<FinalizedInvoice | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const branding = getBranding();
  
  // Calculate totals
  const lineItemsWithTotals = invoiceData.lineItems.map(item => ({
    ...item,
    total: item.quantity * item.rate
  }));
  
  const grandTotal = lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0);
  const includeJudgeSignature = !!invoiceData.customFields?.includeJudgeSignature;

  const handleFinalize = async () => {
    setIsProcessing(true);
    
    try {
      // Create finalized invoice with unique ID
      const finalizedData: FinalizedInvoice = {
        ...invoiceData,
        id: `invoice_${Date.now()}`,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
        pdfGenerated: false
      };

      // Save to localStorage (simulating database save)
      const existingInvoices = localStorage.getItem('finalizedInvoices');
      const invoices = existingInvoices ? JSON.parse(existingInvoices) : [];
      invoices.push(finalizedData);
      localStorage.setItem('finalizedInvoices', JSON.stringify(invoices));

      // Clear the temporary draft data
      localStorage.removeItem('invoiceData');
      localStorage.removeItem('invoiceDraft');

      setFinalizedInvoice(finalizedData);
      setIsFinalized(true);
      
      // Show success toast
      setToastMessage(`🎉 Invoice ${invoiceData.invoiceNumber} has been finalized! You can now download the PDF or create a new invoice.`);
      setShowToast(true);
      
    } catch (error) {
      console.error('Failed to finalize invoice:', error);
      setToastMessage('Failed to finalize invoice. Please try again.');
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    
    try {
      const result = await generatePDF(invoiceData);
      
      // Update the saved invoice to mark PDF as generated
      if (finalizedInvoice) {
        const updatedInvoice = { ...finalizedInvoice, pdfGenerated: true };
        const existingInvoices = localStorage.getItem('finalizedInvoices');
        const invoices = existingInvoices ? JSON.parse(existingInvoices) : [];
        const invoiceIndex = invoices.findIndex((inv: FinalizedInvoice) => inv.id === finalizedInvoice.id);
        if (invoiceIndex !== -1) {
          invoices[invoiceIndex] = updatedInvoice;
          localStorage.setItem('finalizedInvoices', JSON.stringify(invoices));
        }
        setFinalizedInvoice(updatedInvoice);
      }
      
      if (result.method === 'ios-share') {
        setToastMessage('✅ PDF saved! Open Files app to view.');
      } else if (result.method === 'ios-view') {
        setToastMessage('📱 PDF opened! Tap Share icon to save.');
      } else {
        setToastMessage('✅ PDF downloaded successfully!');
      }
      setShowToast(true);
      
    } catch (error) {
      console.error('PDF failed:', error);
      const msg = error instanceof Error ? error.message : 'PDF generation failed';
      alert(`PDF Error: ${msg}`);
      setToastMessage(`❌ ${msg}`);
      setShowToast(true);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleEdit = () => {
    if (invoiceData) {
      // Save current data as draft for editing
      localStorage.setItem('invoiceDraft', JSON.stringify(invoiceData));
      localStorage.setItem('editMode', Date.now().toString());
      router.push('/create-invoice');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Action Buttons */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Review Your Invoice</h1>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {!isFinalized ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 group"
                      disabled={isProcessing}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        <span>Edit Invoice</span>
                      </div>
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors duration-200 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Finalizing...</span>
                        </>
                      ) : (
                        <span>Finalize Invoice</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={pdfGenerating}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors duration-200 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
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
                    <button
                      onClick={() => router.push('/create-invoice')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors duration-200 shadow-lg flex items-center justify-center space-x-2 group"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>Create New Invoice</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="invoice-content">
            <div className="p-4 sm:p-8">
              {/* Header */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 pb-2 mb-6 sm:mb-8 border-b-2 border-purple-500">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">Court Reporter Invoice</h1>
                  <p className="text-gray-600 text-lg">{invoiceData.invoiceNumber}</p>
                </div>
                <div className="text-center sm:text-right">
                  <h2 className="text-base sm:text-xl font-bold text-purple-600 mb-1">Valerie De Leon, CSR #13025</h2>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">126 Old Settlers Drive, San Marcos, TX 78666</p>
                  <p className="text-xs sm:text-sm text-gray-600">valeriedeleon.csr@gmail.com</p>
                </div>
              </div>

              {/* Invoice Details Left Aligned, No Bill To */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Details:</h3>
                <div className="space-y-2 max-w-md">
                  {invoiceData.customFields?.causeNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Cause Number:</span>
                      <span className="text-gray-800 text-right font-medium">{invoiceData.customFields.causeNumber}</span>
                    </div>
                  )}
                  {invoiceData.customFields?.caseName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Case Name:</span>
                      <span className="text-gray-800 text-right break-words">{invoiceData.customFields.caseName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Invoice Number:</span>
                    <span className="text-gray-800 text-right">{invoiceData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Date:</span>
                    <span className="text-gray-800 text-right">{formatDate(invoiceData.date)}</span>
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
                  {invoiceData.customFields?.serviceType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Service Type:</span>
                      <span className="text-gray-800 text-right font-bold">
                        {invoiceData.customFields.serviceType === 'Other' 
                          ? invoiceData.customFields.serviceTypeOther || 'Other'
                          : invoiceData.customFields.serviceType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice-level Comments (Optional) */}
              {invoiceData.customFields?.comments && (
                <div className="mb-6 sm:mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Invoice Comments:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {invoiceData.customFields.comments}
                  </p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="mb-6 sm:mb-8">
                {/* Desktop Table */}
                <div className="hidden sm:block">
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
                          <td className="border border-gray-200 px-4 py-3 text-center text-gray-800">{item.number}</td>
                          <td className="border border-gray-200 px-4 py-3 text-gray-800 whitespace-pre-line">{item.description}</td>
                          <td className="border border-gray-200 px-4 py-3 text-center text-gray-800">{item.quantity}</td>
                          <td className="border border-gray-200 px-4 py-3 text-right text-gray-800">{formatCurrency(item.rate)}</td>
                          <td className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.total)}</td>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Venmo block: QR + info */}
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <VenmoQRCode hideCaption sizePx={128} />
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full inline-flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-800 leading-none">Venmo</p>
                      </div>
                      <p className="text-gray-600 mt-2">@ValerieDeLeon-CSR</p>
                    </div>
                  </div>

                  {/* Mail block */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full inline-flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-800 leading-none">Mail Check To:</p>
                    </div>
                    <address className="not-italic text-gray-600 mt-2 leading-relaxed">
                      Valerie De Leon, CSR<br />
                      126 Old Settlers Drive<br />
                      San Marcos, TX 78666
                    </address>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 mt-4">
                <div className="text-center sm:text-left">
                  <p className="text-gray-600 font-medium mb-2">Court Reporter Signature:</p>
                  <SignatureImage />
                </div>

                {includeJudgeSignature && (
                  <div className="text-center sm:text-left sm:self-end">
                    <div className="border-t border-gray-400 w-64 mx-auto sm:mx-0 mb-1" />
                    <p className="text-gray-500 text-sm">
                      {invoiceData.customFields?.judgeName 
                        ? invoiceData.customFields.judgeName 
                        : "Judge's Signature"}
                    </p>
                  </div>
                )}
              </div>

              {/* Thank You Message */}
              <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-gray-600 font-medium">Thank you for your business!</p>
                <p className="text-gray-500 text-sm mt-1">Payment is due within 30 days of invoice date.</p>
              </div>
            </div>
          </div>
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