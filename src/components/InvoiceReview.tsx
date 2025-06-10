// InvoiceReview Component - Refactored to use shared InvoiceDisplay
import React, { useState } from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { InvoiceDisplay, generatePDF } from './InvoiceDisplay';
import { Toast } from './Toast';
import { useRouter } from 'next/router';
import { getBranding } from '../config/branding';

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
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const branding = getBranding();
  
  // Use finalized invoice data if available, otherwise use original
  const currentInvoiceData = finalizedInvoice || invoiceData;

  const handleFinalize = async () => {
    setIsProcessing(true);
    
    try {
      // Save invoice to database
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData,
          userEmail: 'demo@example.com' // For now, using demo user
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save invoice');
      }

      // Create finalized invoice data for local display
      const finalizedData: FinalizedInvoice = {
        ...invoiceData,
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber, // Use database-generated number
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
        pdfGenerated: false
      };

      // Also save to localStorage for backward compatibility
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
      setToastMessage(`🎉 Invoice ${finalizedData.invoiceNumber} has been saved to database and finalized! You can now download the PDF or create a new invoice.`);
      setToastType('success');
      setShowToast(true);
      
    } catch (error) {
      console.error('Failed to finalize invoice:', error);
      setToastMessage(`❌ Failed to save invoice to database: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    
    try {
      await generatePDF(currentInvoiceData);
      
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
      
      setToastMessage('📄 PDF downloaded successfully!');
      setToastType('success');
      setShowToast(true);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      setToastMessage(`❌ Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleEdit = () => {
    if (currentInvoiceData) {
      // Save current data as draft for editing
      localStorage.setItem('invoiceDraft', JSON.stringify(currentInvoiceData));
      localStorage.setItem('editMode', Date.now().toString());
      router.push('/create-invoice');
    }
  };

  // Create action buttons based on invoice state
  const actionButtons = !isFinalized ? (
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
  );

  return (
    <>
      <InvoiceDisplay 
        invoiceData={currentInvoiceData}
        actionButtons={actionButtons}
        title="Review Your Invoice"
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          show={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
} 