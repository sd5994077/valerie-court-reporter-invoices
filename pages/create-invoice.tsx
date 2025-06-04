import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { InvoiceForm } from '../src/components/InvoiceForm';
import { getBranding } from '../src/config/branding';
import { MobileNavigation } from '../src/components/MobileNavigation';
import type { InvoiceFormData } from '../src/types/invoice';
import Link from 'next/link';

export default function CreateInvoicePage() {
  const router = useRouter();
  const branding = getBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [draftData, setDraftData] = useState<InvoiceFormData | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleCreateInvoice = async (data: InvoiceFormData) => {
    setIsLoading(true);
    
    try {
      // Save invoice data to localStorage for review
      localStorage.setItem('invoiceData', JSON.stringify(data));
      
      // Navigate to review page
      router.push('/review-invoice');
    } catch (error) {
      console.error('Error saving invoice data:', error);
      alert('Error saving invoice data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing data if coming back from review (edit mode)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draftData = localStorage.getItem('invoiceDraft');
      const editMode = localStorage.getItem('editMode');
      
      if (draftData && editMode) {
        // We're in edit mode - load the draft data
        setDraftData(JSON.parse(draftData));
        // Force form re-mount by updating key
        setFormKey(parseInt(editMode));
        // Clear edit mode flag
        localStorage.removeItem('editMode');
        console.log('Loaded draft data for editing');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="invoice" />

      {/* Breadcrumb */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-purple-600">Home</Link>
            <span className="text-gray-400">›</span>
            <span className="text-purple-600 font-medium">
              {draftData ? 'Edit Invoice' : 'Create Invoice'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600"></div>
              <span className="text-gray-700 text-sm sm:text-base">Preparing invoice review...</span>
            </div>
          </div>
        )}
        <InvoiceForm 
          key={formKey}
          onSubmit={handleCreateInvoice} 
          draftData={draftData}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500">
            <p>© 2025 Valerie De Leon</p>
            <p>© ESTD 2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
}