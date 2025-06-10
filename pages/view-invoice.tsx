import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { InvoiceFormData } from '../src/types/invoice';
import { InvoiceDisplay, generatePDF } from '../src/components/InvoiceDisplay';
import { Toast } from '../src/components/Toast';

export default function ViewInvoice() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Load invoice data from localStorage
    const viewingInvoiceData = localStorage.getItem('viewingInvoice');
    if (viewingInvoiceData) {
      try {
        const invoice = JSON.parse(viewingInvoiceData);
        console.log('📋 Invoice data loaded for viewing:', invoice);
        console.log('📧 Manual client data:', invoice.manualClient);
        console.log('🏠 Address data:', invoice.manualClient?.address);
        console.log('🏠 Address type:', typeof invoice.manualClient?.address);
        console.log('🏠 Full client object keys:', Object.keys(invoice.manualClient || {}));
        
        // Log all potential address fields
        if (invoice.manualClient) {
          console.log('🏠 Direct address fields check:');
          console.log('  - address:', invoice.manualClient.address);
          console.log('  - street:', (invoice.manualClient as any).street);
          console.log('  - city:', (invoice.manualClient as any).city);
          console.log('  - state:', (invoice.manualClient as any).state);
          console.log('  - zip:', (invoice.manualClient as any).zip);
        }
        
        // Convert database Invoice format to InvoiceFormData format
        const convertedInvoiceData: InvoiceFormData = {
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.date,
          dueDate: invoice.dueDate,
          manualClient: {
            name: invoice.manualClient?.name || 'Unknown Client',
            company: invoice.manualClient?.company || undefined,
            email: invoice.manualClient?.email || undefined,
            phone: invoice.manualClient?.phone || undefined,
            // Handle different address formats
            address: (() => {
              const client = invoice.manualClient;
              if (!client) {
                console.log('🏠 No client data found');
                return '';
              }
              
              // Check for string address
              if (typeof client.address === 'string' && client.address.trim()) {
                console.log('🏠 Found string address:', client.address);
                return client.address.trim();
              }
              
              // Check for address object
              if (client.address && typeof client.address === 'object') {
                const addr = client.address;
                console.log('🏠 Found address object:', addr);
                const parts = [];
                if (addr.street) parts.push(addr.street);
                if (addr.city && addr.state) {
                  parts.push(`${addr.city}, ${addr.state} ${addr.zip || ''}`.trim());
                } else if (addr.city) {
                  parts.push(addr.city);
                }
                const result = parts.join('\n');
                console.log('🏠 Converted object address to:', result);
                return result;
              }
              
              // Check for individual fields directly on client
              const parts = [];
              if (client.street) parts.push(client.street);
              if (client.city && client.state) {
                parts.push(`${client.city}, ${client.state} ${client.zip || ''}`.trim());
              } else if (client.city) {
                parts.push(client.city);
              }
              const result = parts.join('\n');
              console.log('🏠 Converted direct fields to:', result);
              return result;
            })()
          },
          lineItems: invoice.lineItems || [],
          customFields: invoice.customFields || {}
        };
        
        console.log('🔄 Converted invoice data:', convertedInvoiceData);
        console.log('🏠 Converted address:', convertedInvoiceData.manualClient?.address);
        console.log('🏠 Converted address length:', convertedInvoiceData.manualClient?.address?.length);
        console.log('🏠 Is address empty?', !convertedInvoiceData.manualClient?.address?.trim());
        
        setInvoiceData(convertedInvoiceData);
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

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    
    try {
      await generatePDF(invoiceData);
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

  const handleBackToDashboard = () => {
    // Clear viewing invoice data
    localStorage.removeItem('viewingInvoice');
    router.push('/dashboard');
  };

  // Create action buttons for the view invoice page
  const actionButtons = (
    <>
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
    </>
  );

  return (
    <>
      <InvoiceDisplay 
        invoiceData={invoiceData}
        actionButtons={actionButtons}
        title="View Invoice"
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