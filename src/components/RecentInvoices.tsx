import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Toast } from './Toast';

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

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  finalizedAt: string;
  status: 'pending' | 'completed' | 'overdue' | 'closed';
  lineItems: Array<{
    quantity: number;
    rate: number;
    number?: number;
    description?: string;
  }>;
  manualClient?: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  customFields?: {
    county?: string;
    caseName?: string;
    dateOfHearing?: string;
  };
  pdfGenerated?: boolean;
}

interface RecentInvoicesProps {
  isLoading: boolean;
  invoices: Invoice[];
  onRefresh: () => void;
}

export function RecentInvoices({ isLoading, invoices, onRefresh }: RecentInvoicesProps) {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showClosedInvoices, setShowClosedInvoices] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [processingPdf, setProcessingPdf] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'county' | 'status' | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  // Filter invoices based on showClosedInvoices
  const filteredInvoices = invoices.filter(invoice => 
    showClosedInvoices || invoice.status !== 'closed'
  );

  // Sort invoices with primary sort by date, then by status priority
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      // Primary sort: Date (newest first by default)
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      
      // If user specifically selected date sorting, use the direction
      if (sortField === 'date') {
        return sortDirection === 'asc' ? -dateComparison : dateComparison;
      }
      
      // Secondary sort: Status priority (Overdue, Pending, Complete, Closed)
      const statusOrder = { 'overdue': 1, 'pending': 2, 'completed': 3, 'closed': 4 };
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 5;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 5;
      
      if (sortField === 'status') {
        const statusComparison = statusA - statusB;
        if (statusComparison !== 0) {
          return sortDirection === 'asc' ? statusComparison : -statusComparison;
        }
        // If statuses are equal, fall back to date
        return dateComparison;
      }
      
      if (sortField === 'county') {
        const countyA = a.customFields?.county || 'Other';
        const countyB = b.customFields?.county || 'Other';
        const countyComparison = countyA.localeCompare(countyB);
        if (countyComparison !== 0) {
          return sortDirection === 'asc' ? countyComparison : -countyComparison;
        }
        // If counties are equal, fall back to status then date
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        return dateComparison;
      }
      
      // Default sort: Status priority first, then date
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      return dateComparison;
    });
  }, [filteredInvoices, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'county' | 'status') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with appropriate default direction
      setSortField(field);
      if (field === 'date') {
        setSortDirection('desc'); // Newest first for dates
      } else if (field === 'status') {
        setSortDirection('asc'); // Overdue first for status
      } else {
        setSortDirection('asc'); // A-Z for county
      }
    }
  };

  const getSortIcon = (field: 'date' | 'county' | 'status') => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  // PDF generation function
  const generatePDF = async (invoiceData: Invoice) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Import React DOM to render the component
      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const { InvoicePDF } = await import('./InvoicePDF');
      
      // Convert Invoice to InvoiceFormData format
      const invoiceFormData = {
        invoiceNumber: invoiceData.invoiceNumber,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate || invoiceData.date, // Use date as fallback if dueDate missing
        lineItems: invoiceData.lineItems.map(item => ({
          number: item.number || 1,
          description: item.description || '',
          quantity: item.quantity,
          rate: item.rate
        })),
        manualClient: {
          name: invoiceData.manualClient?.name || '',
          company: invoiceData.manualClient?.company,
          address: invoiceData.manualClient?.address || '',
          email: invoiceData.manualClient?.email,
          phone: invoiceData.manualClient?.phone
        },
        customFields: invoiceData.customFields
      };
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Render the InvoicePDF component
      const root = ReactDOM.createRoot(tempContainer);
      
      // Create a promise that resolves when rendering is complete
      await new Promise<void>((resolve) => {
        root.render(React.createElement(InvoicePDF, { invoiceData: invoiceFormData }));
        // Give React time to render
        setTimeout(resolve, 100);
      });
      
      const pdfElement = tempContainer.querySelector('#invoice-pdf-content');
      
      if (!pdfElement) {
        throw new Error('Failed to render PDF content');
      }

      // Generate filename: Invoice-YYYY-MM-DD-ClientName.pdf
      const invoiceDate = new Date(invoiceData.date);
      const dateStr = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const clientName = invoiceData.manualClient?.name || invoiceData.manualClient?.company || 'Client';
      console.log('🔍 Recent Invoices PDF Filename Debug:', {
        clientName,
        originalName: invoiceData.manualClient?.name,
        originalCompany: invoiceData.manualClient?.company,
        cleanedName: cleanForFilename(clientName)
      });
      const filename = `Invoice-${dateStr}-${cleanForFilename(clientName)}.pdf`;

      const opt = {
        margin: [0, 0.3, 0, 0.3], // Zero top and bottom margins for maximum space
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
        }
      };

      await html2pdf().set(opt).from(pdfElement).save();
      
      // Clean up temporary container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      
      return true;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    setProcessingPdf(invoice.id);
    
    try {
      await generatePDF(invoice);
      
      // Update the invoice to mark PDF as generated
      updateInvoiceStatus(invoice.id, invoice.status, { pdfGenerated: true });
      
      setToastMessage(`PDF for ${invoice.invoiceNumber} downloaded successfully!`);
      setToastType('success');
      setShowToast(true);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      setToastMessage(`Failed to generate PDF for ${invoice.invoiceNumber}. Please try again.`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setProcessingPdf(null);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: 'pending' | 'completed' | 'overdue' | 'closed', extraData?: any) => {
    try {
      // Update in database first
      const response = await fetch('/api/invoices/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status in database');
      }

      // Update localStorage as well for backward compatibility
      const finalizedInvoices = localStorage.getItem('finalizedInvoices');
      const invoices = finalizedInvoices ? JSON.parse(finalizedInvoices) : [];
      
      const invoiceIndex = invoices.findIndex((inv: Invoice) => inv.id === invoiceId);
      if (invoiceIndex !== -1) {
        invoices[invoiceIndex] = { 
          ...invoices[invoiceIndex], 
          status: newStatus,
          ...extraData
        };
        localStorage.setItem('finalizedInvoices', JSON.stringify(invoices));
      }

      const statusLabels = {
        pending: 'Pending',
        completed: 'Completed', 
        overdue: 'Overdue',
        closed: 'Closed'
      };
      
      setToastMessage(`Invoice ${invoices[invoiceIndex]?.invoiceNumber || 'Unknown'} marked as ${statusLabels[newStatus]}!`);
      setToastType('success');
      setShowToast(true);

      // Refresh dashboard data after a small delay to ensure database is updated
      setTimeout(() => {
        console.log('Refreshing dashboard after status change...');
        onRefresh();
      }, 500);
      
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      setToastMessage('Failed to update invoice status. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
    setOpenDropdown(null);
  };

  const handleDeleteInvoice = (invoiceId: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      try {
        const finalizedInvoices = localStorage.getItem('finalizedInvoices');
        const invoices = finalizedInvoices ? JSON.parse(finalizedInvoices) : [];
        
        const filteredInvoices = invoices.filter((inv: Invoice) => inv.id !== invoiceId);
        localStorage.setItem('finalizedInvoices', JSON.stringify(filteredInvoices));
        onRefresh();
        
        setToastMessage(`Invoice ${invoiceNumber} has been deleted successfully.`);
        setToastType('success');
        setShowToast(true);
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        setToastMessage('Failed to delete invoice. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    }
    setOpenDropdown(null);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    // Save invoice data for viewing and navigate to view page
    localStorage.setItem('viewingInvoice', JSON.stringify(invoice));
    router.push('/view-invoice');
    setOpenDropdown(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Calculate invoice total with proper financial truncation (cut off at 2 decimals)
  const calculateInvoiceTotal = (invoice: Invoice) => {
    const lineItemsTotal = invoice.lineItems.reduce((sum, item) => {
      const lineTotal = truncateToTwoDecimals(item.quantity * item.rate);
      return sum + lineTotal;
    }, 0);
    return truncateToTwoDecimals(lineItemsTotal);
  };

  // Function to handle dropdown positioning based on viewport
  const handleDropdownToggle = (invoiceId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openDropdown === invoiceId) {
      setOpenDropdown(null);
      return;
    }

    // Calculate position based on click location
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const dropdownHeight = 320; // Approximate height of dropdown menu

    // Position dropdown above if not enough space below
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }

    setOpenDropdown(invoiceId);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow overflow-hidden">
        <div className="bg-purple-700 text-white px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Recent Invoices
            </h3>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <p className="text-sm text-gray-600">Most recent invoice activity</p>
              {sortField && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full self-start">
                  {sortField === 'date' && `Sorted by Date (${sortDirection === 'desc' ? 'Newest First' : 'Oldest First'})`}
                  {sortField === 'status' && `Sorted by Action (${sortDirection === 'asc' ? 'Overdue → Closed' : 'Closed → Overdue'})`}
                  {sortField === 'county' && `Sorted by County (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showClosedInvoices}
                  onChange={(e) => setShowClosedInvoices(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Show Closed</span>
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedInvoices.length > 0 ? (
            <>
              {/* Mobile Card View (on small screens) */}
              <div className="block sm:hidden space-y-4">
                {sortedInvoices.map((invoice, index) => (
                  <div key={invoice.id} className={`border rounded-lg p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {invoice.manualClient?.company || invoice.manualClient?.name || 'Unknown Client'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">
                          {formatCurrency(calculateInvoiceTotal(invoice))}
                        </p>
                        {getStatusBadge(invoice.status || 'pending')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">County:</span> {invoice.customFields?.county || 'Other'}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={processingPdf === invoice.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded transition-colors duration-200"
                          title="Download PDF"
                        >
                          {processingPdf === invoice.id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          )}
                        </button>

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => handleDropdownToggle(invoice.id, e)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 p-2 rounded transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>

                          {openDropdown === invoice.id && (
                            <div className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dropdown-menu ${
                              dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}>
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                                  Invoice Actions
                                </div>
                                
                                <div className="px-3 py-2 text-xs font-medium text-gray-500">
                                  Set Status
                                </div>
                                
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'pending')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  <span>Mark as Pending</span>
                                </button>
                                
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'completed')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  <span>Mark as Completed</span>
                                </button>
                                
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                  </svg>
                                  <span>Mark as Overdue</span>
                                </button>
                                
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'closed')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Mark as Closed</span>
                                </button>

                                <div className="border-t border-gray-100 mt-1 pt-1">
                                  <button
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                    <span>View Invoice</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    <span>Delete Invoice</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (hidden on small screens) */}
              <div className="hidden sm:block overflow-x-auto overflow-y-visible">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-purple-800 text-sm">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <span>INVOICE #</span>
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-2 font-medium text-purple-800 text-sm cursor-pointer hover:bg-purple-50 transition-colors duration-200 rounded"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                          </svg>
                          <span>DATE</span>
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-purple-800 text-sm">CLIENT</th>
                      <th 
                        className="text-left py-3 px-2 font-medium text-purple-800 text-sm cursor-pointer hover:bg-purple-50 transition-colors duration-200 rounded"
                        onClick={() => handleSort('county')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>COUNTY</span>
                          {getSortIcon('county')}
                        </div>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-purple-800 text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <svg className="w-4 h-4 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span>AMOUNT</span>
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-2 font-medium text-purple-800 text-sm cursor-pointer hover:bg-purple-50 transition-colors duration-200 rounded"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>STATUS</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-purple-800 text-sm">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInvoices.map((invoice, index) => (
                      <tr key={invoice.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}`}>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-gray-600">{formatDate(invoice.date)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-gray-900">
                            {invoice.manualClient?.company || invoice.manualClient?.name || 'Unknown Client'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-gray-600">{invoice.customFields?.county || 'Other'}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(calculateInvoiceTotal(invoice))}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {getStatusBadge(invoice.status || 'pending')}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Download PDF Button */}
                            <button
                              onClick={() => handleDownloadPDF(invoice)}
                              disabled={processingPdf === invoice.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 rounded transition-colors duration-200"
                              title="Download PDF"
                            >
                              {processingPdf === invoice.id ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                              )}
                            </button>

                            {/* Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => handleDropdownToggle(invoice.id, e)}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="19" cy="12" r="1"></circle>
                                  <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                              </button>

                              {openDropdown === invoice.id && (
                                <div className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dropdown-menu ${
                                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                                }`}>
                                  <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                                      Invoice Actions
                                    </div>
                                    
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500">
                                      Set Status
                                    </div>
                                    
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice.id, 'pending')}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                      <span>Mark as Pending</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice.id, 'completed')}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                      <span>Mark as Completed</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                      </svg>
                                      <span>Mark as Overdue</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice.id, 'closed')}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Mark as Closed</span>
                                    </button>

                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                      <button
                                        onClick={() => handleViewInvoice(invoice)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                      >
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        <span>View Invoice</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                      >
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                        <span>Delete Invoice</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No invoices found</p>
              <p className="text-gray-400 mb-4">Create your first invoice to get started</p>
              <button
                onClick={() => router.push('/create-invoice')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Create Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setOpenDropdown(null)}
        ></div>
      )}

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