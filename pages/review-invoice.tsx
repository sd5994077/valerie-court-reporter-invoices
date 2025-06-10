import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { InvoiceReview } from '../src/components/InvoiceReview';
import { Logo } from '../src/components/Logo';
import type { InvoiceFormData } from '../src/types/invoice';
import Link from 'next/link';

export default function ReviewInvoicePage() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData | null>(null);

  useEffect(() => {
    // Get invoice data from localStorage (temporary storage)
    const savedData = localStorage.getItem('invoiceData');
    if (savedData) {
      setInvoiceData(JSON.parse(savedData));
    } else {
      // Redirect to create invoice if no data
      router.push('/create-invoice');
    }
  }, [router]);

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 py-4 sm:py-6">
            {/* Logo */}
            <div className="flex items-center justify-center sm:justify-start space-x-4">
              <Logo size="md" className="text-purple-600" />
            </div>
            
            {/* Business Info */}
            <div className="text-center sm:text-right">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
                Valerie De Leon, CSR
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Professional Court Reporting Services</p>
              <div className="mt-2 text-xs sm:text-sm text-gray-500 space-y-1">
                <p>126 Old Settlers Drive</p>
                <p>San Marcos, Texas 78666</p>
                <p className="flex items-center justify-center sm:justify-end space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span className="break-all">valeriedeleon.csr@gmail.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Purple Navigation Bar */}
      <nav className="bg-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <span className="text-white font-semibold text-base sm:text-lg">Invoicing System</span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link href="/">
                <button className="text-white hover:bg-white hover:text-purple-600 rounded-lg px-2 sm:px-3 py-2 transition-colors duration-200 flex items-center space-x-2 group">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                </button>
              </Link>
              
              <Link href="/dashboard">
                <button className="text-white hover:bg-white hover:text-purple-600 rounded-lg px-2 sm:px-3 py-2 transition-colors duration-200 flex items-center space-x-2 group">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Invoice Review Content */}
      <InvoiceReview invoiceData={invoiceData} />
    </div>
  );
} 