import React, { useState, useEffect } from 'react';
import type { InvoiceFormData } from '../types/invoice';
import { formatCurrency, roundToTwoDecimals } from '../utils/formatters';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onPreview?: (data: InvoiceFormData) => void;
  draftData?: InvoiceFormData | null;
}

export function InvoiceForm({ onSubmit, onPreview, draftData }: InvoiceFormProps) {
  // Invoice Details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [county, setCounty] = useState('');
  const [causeNumber, setCauseNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [caseName, setCaseName] = useState('');

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  // Add state for field validation timing
  const [validationTrigger, setValidationTrigger] = useState<{[key: string]: boolean}>({});

  // Judges State
  const [judges, setJudges] = useState<string[]>(['Judge R. Bruce Boyer']);
  const [selectedJudge, setSelectedJudge] = useState('Judge R. Bruce Boyer');
  const [customJudge, setCustomJudge] = useState('');

  // Load judges from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedJudges = localStorage.getItem('savedJudges');
      if (savedJudges) {
        setJudges(JSON.parse(savedJudges));
      }
    }
  }, []);

  const handleCustomJudgeBlur = () => {
    if (customJudge.trim()) {
      // Check if already in list
      if (!judges.includes(customJudge.trim())) {
        if (window.confirm(`Do you want to add "${customJudge}" to the saved list of Judges?`)) {
          const newJudges = [...judges, customJudge.trim()];
          setJudges(newJudges);
          localStorage.setItem('savedJudges', JSON.stringify(newJudges));
          setSelectedJudge(customJudge.trim());
          setCustomJudge(''); // Clear custom input as it's now selected from dropdown (or we can keep it as is, but logic suggests we switch to dropdown)
          // Actually, if we add it to dropdown, we should select it in dropdown.
        }
      }
    }
  };


  // Generate invoice number on client side only
  useEffect(() => {
    // Generate sequential invoice number: INV-YYYY-#### format
    const now = new Date();
    const year = now.getFullYear();
    
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // Get the last invoice number from localStorage for this year
      const storageKey = `lastInvoiceNumber_${year}`;
      const lastNumber = parseInt(localStorage.getItem(storageKey) || '0');
      const nextNumber = lastNumber + 1;
      
      // Store the new number
      localStorage.setItem(storageKey, nextNumber.toString());
      
      // Format as 4-digit number with leading zeros
      const formattedNumber = String(nextNumber).padStart(4, '0');
      setInvoiceNumber(`INV-${year}-${formattedNumber}`);
    }
  }, []); // Empty dependency array - run once on mount

  // Line Items
  const [lineItems, setLineItems] = useState([
    { number: 1, description: '', quantity: 1, volumePages: '', total: 0 }
  ]);

  // Case Information - Simplified
  const [dateOfHearing, setDateOfHearing] = useState('');
  const [includeJudgeSignature, setIncludeJudgeSignature] = useState(false);
  // judgeName logic is now handled by selectedJudge/customJudge but we keep this for consistency with previous code if needed, 
  // but we will use selectedJudge primarily.
  
  // Service Type
  const [serviceType, setServiceType] = useState('');
  const [serviceTypeOther, setServiceTypeOther] = useState('');

  // Invoice-level Comments (optional)
  const [comments, setComments] = useState('');

  const counties = [
    'Caldwell County',
    'Comal County',
    'Hays County',
    'Other'
  ];

  const addLineItem = () => {
    setLineItems([...lineItems, {
      number: lineItems.length + 1,
      description: '',
      quantity: 1,
      volumePages: '',
      total: 0
    }]);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = lineItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
  };

  // Format money input to 2 decimal places on blur (when user finishes editing)
  const handleMoneyBlur = (index: number, value: number) => {
    const formattedValue = roundToTwoDecimals(value);
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
      setLineItems([{ number: 1, description: '', quantity: 1, volumePages: '', total: 0 }]);
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
    
    // Check cause number (replaces client name requirement)
    if (!causeNumber.trim()) {
      errors.push('Cause Number is required');
    }

    // Check Case (new field)
    if (!caseName.trim()) {
        errors.push('Case Name is required');
    }
    
    // Check county
    if (!county) {
      errors.push('County is required');
    }
    
    // Check service type
    if (!serviceType) {
      errors.push('Service Type is required');
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

  const grandTotal = roundToTwoDecimals(
    lineItems.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const rate = item.total || 0;
      return sum + qty * rate;
    }, 0)
  );

  const populateFirstLineItem = () => {
    // "Judge R. Bruce Boyer\nCauseNo. CR2024-562A\nState of Texas vs. Shad Modesett"
    const judge = selectedJudge === 'Other' ? customJudge : selectedJudge;
    const description = `${judge}\nCauseNo. ${causeNumber}\n${caseName}`;
    
    const updated = [...lineItems];
    updated[0] = {
        ...updated[0],
        description: description
    };
    setLineItems(updated);
    showToastMessage('Line item description populated', 'success');
  };

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
    
    const finalJudgeName = selectedJudge === 'Other' ? customJudge : selectedJudge;

    const formData: InvoiceFormData = {
      date,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      invoiceNumber,
      // manualClient kept for backward compatibility but not used in new invoices
      manualClient: {
        name: causeNumber, // Store cause number in name field for backward compatibility
        company: undefined,
        phone: undefined,
        email: undefined,
        address: ''
      },
      // Only include non-empty line items in the final invoice
      lineItems: nonEmptyItems.map(item => ({
        number: item.number,
        description: item.description,
        quantity: item.quantity,
        // Treat the entered value as the per‑unit rate
        rate: item.total || 0,
        category: 'Court Reporting',
        taxable: true,
        notes: item.volumePages || undefined // Store volume/pages in notes field
      })),
      customFields: {
        county,
        causeNumber,
        caseName,
        dateOfHearing,
        includeJudgeSignature,
        judgeName: finalJudgeName,
        comments: comments.trim() ? comments.trim() : undefined,
        serviceType: serviceType as 'Appeals' | 'Transcripts' | 'Other' | undefined,
        serviceTypeOther: serviceType === 'Other' ? serviceTypeOther : undefined
      }
    };

    await onSubmit(formData);
  };

  // Pre-populate form with draft data when editing
  useEffect(() => {
    if (draftData) {
      // Client information no longer used - commented out
      // ...

      // Populate invoice details
      setDate(draftData.date || new Date().toISOString().split('T')[0]);
      setInvoiceNumber(draftData.invoiceNumber || '');
      
      // Populate custom fields
      if (draftData.customFields) {
        setCounty(draftData.customFields.county || '');
        setCauseNumber(draftData.customFields.causeNumber || '');
        setCaseName(draftData.customFields.caseName || ''); // Populate Case Name
        setDateOfHearing(draftData.customFields.dateOfHearing || '');
        setIncludeJudgeSignature(!!draftData.customFields.includeJudgeSignature);
        setComments(draftData.customFields.comments || '');
        
        // Handle Judge Name
        const draftJudge = draftData.customFields.judgeName;
        if (draftJudge) {
            if (judges.includes(draftJudge)) {
                setSelectedJudge(draftJudge);
            } else {
                // If judge is not in list (e.g. was custom), maybe add to list or just set as Other + Custom?
                // For now, let's just add it to list implicitly or set as custom
                // Simple approach: set as Other and fill custom
                // Better approach: Check if it matches default, if not, it's 'Other' or we add it?
                // Let's add it to the list if it's not there to simplify
                if (!judges.includes(draftJudge)) {
                    setJudges(prev => [...prev, draftJudge]);
                    setSelectedJudge(draftJudge);
                }
            }
        }
        
        setServiceType(draftData.customFields.serviceType || '');
        setServiceTypeOther(draftData.customFields.serviceTypeOther || '');
      }

      // Populate line items - convert from FormData format back to form format
      if (draftData.lineItems && draftData.lineItems.length > 0) {
        const formLineItems = draftData.lineItems.map((item, index) => ({
          number: item.number || index + 1,
          description: item.description || '',
          quantity: item.quantity || 1,
          volumePages: item.notes || '',
          // Use the stored per‑unit rate when reloading into the form
          total: item.rate || 0
        }));
        setLineItems(formLineItems);
      }

      console.log('Form pre-populated with draft data');
    }
  }, [draftData, judges]); // Added judges dependency to ensure we can check against loaded judges

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
        {/* Client Information Section - REMOVED per requirements */}
        {/* Client info no longer needed - using Cause Number instead */}

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Judge Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judge <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={selectedJudge}
                      onChange={(e) => {
                          setSelectedJudge(e.target.value);
                          if (e.target.value !== 'Other') {
                              setCustomJudge('');
                          }
                      }}
                    >
                      {judges.map((judge, idx) => (
                        <option key={idx} value={judge}>{judge}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {selectedJudge === 'Other' && (
                    <div className="mt-3">
                        <input 
                            type="text"
                            placeholder="Enter Judge Name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={customJudge}
                            onChange={(e) => setCustomJudge(e.target.value)}
                            onBlur={handleCustomJudgeBlur}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter name. You will be asked to save it to the list.</p>
                    </div>
                  )}
                </div>

                {/* Case Textbox */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. State of Texas vs. ..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        shouldShowValidation('caseName') && !caseName.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      value={caseName}
                      onChange={(e) => setCaseName(e.target.value)}
                      onBlur={() => handleFieldBlur('caseName')}
                      required
                    />
                    {shouldShowValidation('caseName') && !caseName.trim() && (
                        <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                          Case is required
                        </p>
                    )}
                  </div>
                </div>
            </div>

            {/* Cause Number - New Required Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cause Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., CR2094-542A"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    shouldShowValidation('causeNumber') && !causeNumber.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={causeNumber}
                  onChange={(e) => setCauseNumber(e.target.value)}
                  onBlur={() => handleFieldBlur('causeNumber')}
                  required
                />
                {shouldShowValidation('causeNumber') && !causeNumber.trim() && (
                  <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                    Cause Number is required
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-sm text-purple-600 mt-1 italic">Auto-generated</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      shouldShowValidation('serviceType') && !serviceType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={serviceType}
                    onChange={(e) => {
                      setServiceType(e.target.value);
                      if (e.target.value !== 'Other') {
                        setServiceTypeOther('');
                      }
                    }}
                    onBlur={() => handleFieldBlur('serviceType')}
                    required
                  >
                    <option value="">Select a service type</option>
                    <option value="Appeals">Appeals</option>
                    <option value="Transcripts">Transcripts</option>
                    <option value="Other">Other</option>
                  </select>
                  {shouldShowValidation('serviceType') && !serviceType && (
                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm z-10">
                      Service Type is required
                    </p>
                  )}
                </div>
                
                {serviceType === 'Other' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Please specify service type"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={serviceTypeOther}
                      onChange={(e) => setServiceTypeOther(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Line Items</span>
            </h2>
            <button
                type="button"
                onClick={populateFirstLineItem}
                className="text-sm bg-white text-purple-600 px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                title="Populate Line Item 1 with Case Info"
            >
                Auto-fill Description
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
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
                    <th className="px-4 py-3 text-left font-medium">VOLUME/PAGES</th>
                    <th className="px-4 py-3 text-left font-medium">QUANTITY</th>
                    <th className="px-4 py-3 text-left font-medium">AMOUNT</th>
                    <th className="px-4 py-3 text-left font-medium">LINE TOTAL</th>
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
                          <textarea
                            placeholder="Enter description (e.g., Judge name, Cause No., Case details)"
                            rows={3}
                            className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none ${
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
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          placeholder="e.g., 1 Volume 48 pages"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          value={item.volumePages || ''}
                          onChange={(e) => updateLineItem(index, 'volumePages', e.target.value)}
                          onBlur={() => handleFieldBlur(`volumePages_${index}`)}
                        />
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
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="w-32 pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            value={item.total || ''}
                            onChange={(e) => updateLineItem(index, 'total', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleMoneyBlur(index, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle pl-4">
                        <span className="font-semibold text-gray-800">
                          {formatCurrency((item.quantity || 0) * (item.total || 0))}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-500"
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

            {/* Invoice-level Comments (Optional) */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Comments (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Optional notes to appear on the invoice/PDF (e.g., payment instructions, special notes)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                onBlur={() => handleFieldBlur('comments')}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will appear on the PDF if provided.
              </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Hearing (Optional)
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={dateOfHearing}
                onChange={(e) => setDateOfHearing(e.target.value)}
                onBlur={() => handleFieldBlur('dateOfHearing')}
              />
              <p className="text-xs text-gray-500 mt-1">
                Will appear in the Date column on invoice
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="inline-flex items-center space-x-3">
              <input
                type="checkbox"
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                checked={includeJudgeSignature}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setIncludeJudgeSignature(isChecked);
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                Include Judge Signature section on invoice and PDF
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              When checked, an extra signature line for the Judge ({selectedJudge === 'Other' ? (customJudge || 'Custom Judge') : selectedJudge}) will appear below the payment section.
            </p>
          </div>
        </div>
      </div>
      
      {/* Judge Name Confirmation Modal - REMOVED */}

        {/* Submit Button */}
        <div className="flex justify-center sm:justify-end">
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