import React, { useState, useEffect } from 'react';
import type { InvoiceFormData } from '../types/invoice';
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
const truncateToTwoDecimals = (num: number) => {
  return Math.floor(num * 100) / 100;
};

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onPreview?: (data: InvoiceFormData) => void;
  draftData?: InvoiceFormData | null;
}

export function InvoiceForm({ onSubmit, onPreview, draftData }: InvoiceFormProps) {
  // Client Information
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Invoice Details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [county, setCounty] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('Draft - Will be assigned on save');

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  // Add state for field validation timing
  const [validationTrigger, setValidationTrigger] = useState<{[key: string]: boolean}>({});

  // Line Items
  const [lineItems, setLineItems] = useState([
    { number: 1, description: '', quantity: 1, total: 0 }
  ]);

  // Case Information
  const [caseName, setCaseName] = useState('');
  const [dateOfHearing, setDateOfHearing] = useState('');

  const counties = [
    'Caldwell County',
    'Comal County',
    'Hays County',
    'Other'
  ];

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addLineItem = () => {
    const newLineNumber = lineItems.length + 1;
    setLineItems([...lineItems, {
      number: newLineNumber,
      description: '',
      quantity: 1,
      total: 0
    }]);
    
    // Auto-scroll within the line items table container to show the new row and any warning messages
    setTimeout(() => {
      const tableContainer = document.getElementById('line-items-table-container');
      if (tableContainer) {
        // Scroll to bottom to show the new row and any warning messages below it
        tableContainer.scrollTo({
          top: tableContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = lineItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
  };

  // Format money input to 2 decimal places on blur (when user finishes editing)
  const handleMoneyBlur = (index: number, value: number) => {
    const formattedValue = truncateToTwoDecimals(value);
    updateLineItem(index, 'total', formattedValue);
  };

  // Check if a line item needs description (has total > 0)
  const isDescriptionRequired = (item: any) => {
    return item.total > 0;
  };

  // Check if a line item is completely empty
  const isLineItemEmpty = (item: any) => {
    return !item.description.trim() && (!item.total || item.total === 0);
  };

  // Check if a line item has partial content (either description OR total, but not both)
  const isLineItemPartial = (item: any) => {
    const hasDescription = item.description.trim().length > 0;
    const hasTotal = item.total > 0;
    return (hasDescription && !hasTotal) || (!hasDescription && hasTotal);
  };

  // Remove all empty line items
  const removeEmptyLineItems = () => {
    const nonEmptyItems = lineItems.filter(item => !isLineItemEmpty(item));
    if (nonEmptyItems.length === 0) {
      // Keep at least one line item
      setLineItems([{ number: 1, description: '', quantity: 1, total: 0 }]);
    } else {
      const reNumberedItems = nonEmptyItems.map((item, index) => ({
        ...item,
        number: index + 1
      }));
      setLineItems(reNumberedItems);
    }
  };

  // Show toast notification
  const showToastMessage = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Remove empty line items with notification
  const removeEmptyLineItemsWithToast = () => {
    const emptyCount = lineItems.filter(item => isLineItemEmpty(item)).length;
    if (emptyCount > 0) {
      removeEmptyLineItems();
      showToastMessage(`Removed ${emptyCount} empty line item${emptyCount > 1 ? 's' : ''}`, 'success');
    }
  };

  // Validation for required fields
  const validateForm = () => {
    const errors: string[] = [];
    
    // Check client name
    if (!clientName.trim()) {
      errors.push('Client Name is required');
    }
    
    // Check county
    if (!county) {
      errors.push('County is required');
    }
    
    // Filter out empty line items for validation
    const nonEmptyItems = lineItems.filter(item => !isLineItemEmpty(item));
    
    // Check that we have at least one non-empty line item
    if (nonEmptyItems.length === 0) {
      errors.push('At least one line item with description and amount is required');
    }
    
    // Check line items - if total > 0, description is required
    nonEmptyItems.forEach((item, index) => {
      if (item.total > 0 && !item.description.trim()) {
        errors.push(`Description is required for Line Item ${item.number}`);
      }
    });
    
    return errors;
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const updated = lineItems.filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, number: i + 1 }));
      setLineItems(updated);
    }
  };

  // Handle removing individual empty line item on mobile
  const handleRemoveEmptyItem = (index: number) => {
    if (isLineItemEmpty(lineItems[index]) && lineItems.length > 1) {
      removeLineItem(index);
      showToastMessage('Empty line item removed', 'success');
    }
  };

  const grandTotal = truncateToTwoDecimals(lineItems.reduce((sum, item) => sum + (item.total || 0), 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-remove empty line items before validation
    const nonEmptyItems = lineItems.filter(item => !isLineItemEmpty(item));
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
      return;
    }
    
    const formData: InvoiceFormData = {
      date,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // invoiceNumber will be generated by database
      manualClient: {
        name: clientName,
        company: company || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address
      },
      // Only include non-empty line items in the final invoice
      lineItems: nonEmptyItems.map(item => ({
        number: item.number,
        description: item.description,
        quantity: item.quantity,
        rate: item.total / item.quantity || 0,
        category: 'Court Reporting',
        taxable: true
      })),
      customFields: {
        county,
        caseName,
        dateOfHearing
      }
    };

    await onSubmit(formData);
  };

  // Pre-populate form with draft data when editing
  useEffect(() => {
    if (draftData) {
      // Populate client information
      if (draftData.manualClient) {
        setClientName(draftData.manualClient.name || '');
        setCompany(draftData.manualClient.company || '');
        setPhone(draftData.manualClient.phone || '');
        setEmail(draftData.manualClient.email || '');
        setAddress(draftData.manualClient.address || '');
      }

      // Populate invoice details
      setDate(draftData.date || new Date().toISOString().split('T')[0]);
      setInvoiceNumber(draftData.invoiceNumber || '');
      
      // Populate custom fields
      if (draftData.customFields) {
        setCounty(draftData.customFields.county || '');
        setCaseName(draftData.customFields.caseName || '');
        setDateOfHearing(draftData.customFields.dateOfHearing || '');
      }

      // Populate line items - convert from FormData format back to form format
      if (draftData.lineItems && draftData.lineItems.length > 0) {
        const formLineItems = draftData.lineItems.map((item, index) => ({
          number: item.number || index + 1,
          description: item.description || '',
          quantity: item.quantity || 1,
          total: truncateToTwoDecimals((item.quantity || 1) * (item.rate || 0))
        }));
        setLineItems(formLineItems);
      }

      console.log('Form pre-populated with draft data');
    }
  }, [draftData]);

  // Handle field blur for validation timing
  const handleFieldBlur = (fieldKey: string) => {
    setValidationTrigger(prev => ({
      ...prev,
      [fieldKey]: true
    }));
  };

  // Check if field should show validation error
  const shouldShowValidation = (fieldKey: string) => {
    return validationTrigger[fieldKey] || false;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Create Invoice</h1>
        <button className="text-gray-600 hover:text-gray-800 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear Draft</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Client Information</span>
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Client Full Name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      shouldShowValidation('clientName') && !clientName.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={clientName}
                    onChange={(e) => {
                      // Remove any line breaks and normalize whitespace
                      const cleanValue = e.target.value.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ');
                      setClientName(cleanValue);
                    }}
                    onPaste={(e) => {
                      // Handle paste events to clean up any copied text with line breaks
                      e.preventDefault();
                      const paste = e.clipboardData.getData('text');
                      const cleanPaste = paste.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
                      setClientName(cleanPaste);
                    }}
                    required
                    onBlur={() => handleFieldBlur('clientName')}
                  />
                  {shouldShowValidation('clientName') && !clientName.trim() && (
                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                      Client Name is required
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onBlur={() => handleFieldBlur('company')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="(123) 456-7890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  onBlur={() => handleFieldBlur('phone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="client@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      shouldShowValidation('email') && email && !isValidEmail(email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                  />
                  {shouldShowValidation('email') && email && !isValidEmail(email) && (
                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Address</span>
                </label>
                <textarea
                  placeholder="123 Main St, City, State ZIP"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => handleFieldBlur('address')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Invoice Details</span>
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      shouldShowValidation('date') && !date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={() => handleFieldBlur('date')}
                    required
                  />
                  {shouldShowValidation('date') && !date && (
                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                      Date is required
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      shouldShowValidation('county') && !county ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    onBlur={() => handleFieldBlur('county')}
                    required
                  >
                    <option value="">Select a county</option>
                    {counties.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {shouldShowValidation('county') && !county && (
                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                      County is required
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  value={invoiceNumber}
                  readOnly
                />
                <p className="text-sm text-purple-600 mt-1 italic">Will be auto-generated when finalized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Line Items</span>
            </h2>
          </div>
          <div className="p-6">
            <div id="line-items-table-container" className="overflow-x-auto overflow-y-auto max-h-96 border border-gray-100 rounded-lg" style={{ scrollBehavior: 'smooth' }}>
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-50 text-purple-700">
                    <th className="px-4 py-3 text-left font-medium">NUMBER</th>
                    <th className="px-4 py-3 text-left font-medium">
                      <div className="flex items-center space-x-1">
                        <span>DESCRIPTION</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">QUANTITY</th>
                    <th className="px-4 py-3 text-left font-medium">TOTAL</th>
                    <th className="px-4 py-3 text-left font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-4 py-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center font-semibold text-purple-700">
                          {item.number}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter description"
                            className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${
                              shouldShowValidation(`description_${index}`) && isDescriptionRequired(item) && !item.description.trim() 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            onBlur={() => handleFieldBlur(`description_${index}`)}
                          />
                          {shouldShowValidation(`description_${index}`) && isDescriptionRequired(item) && !item.description.trim() && (
                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-1 rounded shadow-sm z-10">
                              Description required for billed items
                            </p>
                          )}
                          {isLineItemEmpty(item) && lineItems.length > 1 && (
                            <div className="absolute left-0 top-full mt-1 flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded shadow-sm z-10 w-full">
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>Empty</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmptyItem(index)}
                                className="text-red-500 hover:text-red-700 underline"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            className="w-20 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-center"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            onBlur={() => handleFieldBlur(`quantity_${index}`)}
                          />
                          {shouldShowValidation(`quantity_${index}`) && item.quantity < 1 && (
                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-1 rounded shadow-sm z-10 whitespace-nowrap">
                              Quantity must be at least 1
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600 font-semibold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            value={item.total || ''}
                            onChange={(e) => updateLineItem(index, 'total', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleMoneyBlur(index, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lineItems.length > 1 && !isLineItemEmpty(lineItems[index]) && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="group relative text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-500"
                            title="Delete line item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
              <div className="flex justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Line Item</span>
                </button>
              </div>
              
              <div className="text-center lg:text-right">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  Grand Total: <span className="text-gray-800">{formatCurrency(grandTotal)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
              </svg>
              <span>Case Information</span>
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Name
                </label>
                <input
                  type="text"
                  placeholder="Enter case name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  onBlur={() => handleFieldBlur('caseName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Hearing
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={dateOfHearing}
                  onChange={(e) => setDateOfHearing(e.target.value)}
                  onBlur={() => handleFieldBlur('dateOfHearing')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 text-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Review Invoice</span>
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
          <div className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            toastType === 'success' ? 'bg-green-500 text-white' :
            toastType === 'warning' ? 'bg-amber-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {toastType === 'success' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toastType === 'warning' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toastType === 'error' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="font-medium">{toastMessage}</p>
              <button
                onClick={() => setShowToast(false)}
                className="ml-auto flex-shrink-0 opacity-75 hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}