import React, { useState, useEffect } from 'react';
import { getBranding } from '../src/config/branding';
import { MobileNavigation } from '../src/components/MobileNavigation';
import { RevenueByCounty } from '../src/components/RevenueByCounty';
import { RecentInvoices } from '../src/components/RecentInvoices';
import { formatCurrency } from '../src/utils/formatters';
import { logger } from '../src/utils/logger';
import { safeGetFromStorage, safeSetToStorage } from '../src/utils/storage';
import { migrateData } from '../src/utils/migration';
import { INVOICE_MIGRATIONS, INVOICE_CURRENT_VERSION } from '../src/config/invoiceMigrations';
import { calculateInvoiceTotal, calculateRevenue, calculateAverageInvoice } from '../src/utils/invoiceCalculations';
import Link from 'next/link';

interface DashboardStats {
  totalRevenue: number;
  invoiceCount: number;
  invoiceCounts: {
    pending: number;
    completed: number;
    overdue: number;
    closed: number;
  };
  averageInvoice: number;
  changePercentage: number;
  averageChangePercentage: number;
  countyRevenue: Array<{
    county: string;
    revenue: number;
    percentage: number;
  }>;
}

export default function Dashboard() {
  const branding = getBranding();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    // Load raw data from localStorage
    loadRawData();
  }, []);

  // Recalculate stats when invoices or selected year changes
  useEffect(() => {
    if (allInvoices.length > 0) {
      calculateStats(allInvoices);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allInvoices, selectedYear]);

  const loadRawData = () => {
    setIsLoading(true);
    try {
      // Apply migrations first
      const migrationResult = migrateData(
        'finalizedInvoices',
        INVOICE_MIGRATIONS,
        INVOICE_CURRENT_VERSION
      );
      
      if (!migrationResult.success) {
        logger.error('Failed to migrate invoice data:', migrationResult.error);
      }
      
      // Load invoices with safe storage
      const invoices = safeGetFromStorage({
        key: 'finalizedInvoices',
        defaultValue: [],
        validator: (data) => Array.isArray(data),
        version: INVOICE_CURRENT_VERSION
      });

      // Extract available years
      const years = new Set<string>();
      invoices.forEach((inv: any) => {
        if (inv.date) {
          const year = new Date(inv.date).getFullYear().toString();
          years.add(year);
        }
      });
      // Sort years descending
      setAvailableYears(Array.from(years).sort().reverse());

      setAllInvoices(invoices);
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  };

  const calculateStats = (invoices: any[]) => {
    setIsLoading(true);
    try {
      // Filter by selected year
      const filteredInvoices = selectedYear === 'All' 
        ? invoices 
        : invoices.filter((inv: any) => {
            if (!inv.date) return false;
            return new Date(inv.date).getFullYear().toString() === selectedYear;
          });

      // Count invoices by status
      const invoiceCounts = {
        pending: 0,
        completed: 0,
        overdue: 0,
        closed: 0
      };
      
      filteredInvoices.forEach((invoice: any) => {
        // Normalize status to lowercase for counting
        const status = (invoice.status || 'pending').toLowerCase() as keyof typeof invoiceCounts;
        if (status in invoiceCounts) {
          invoiceCounts[status]++;
        }
      });
      
      // Calculate revenue ONLY from completed and closed invoices
      const revenueInvoices = filteredInvoices.filter((invoice: any) => {
        const status = (invoice.status || '').toLowerCase();
        return status === 'completed' || status === 'closed';
      });
      
      // Use centralized calculation utilities
      const totalRevenue = calculateRevenue(revenueInvoices);
      const invoiceCount = filteredInvoices.length;
      const averageInvoice = calculateAverageInvoice(revenueInvoices);
      
      // Group by county (only for revenue-generating invoices)
      const countyRevenue: { [key: string]: number } = {};
      revenueInvoices.forEach((invoice: any) => {
        const county = invoice.customFields?.county || 'Other';
        const invoiceTotal = calculateInvoiceTotal(invoice);
        countyRevenue[county] = (countyRevenue[county] || 0) + invoiceTotal;
      });
      
      // Convert to array with percentages
      const countyRevenueArray = Object.entries(countyRevenue).map(([county, revenue]) => ({
        county,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);
      
      setDashboardStats({
        totalRevenue,
        invoiceCount,
        invoiceCounts,
        averageInvoice,
        changePercentage: -100,
        averageChangePercentage: -100,
        countyRevenue: countyRevenueArray
      });
      
      // Sort invoices by date (newest first), then by status priority
      const sortedInvoices = [...filteredInvoices].sort((a: any, b: any) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        const statusOrder = { 'overdue': 1, 'pending': 2, 'completed': 3, 'closed': 4 };
        // Normalize status to lowercase for sorting
        const statusA = statusOrder[(a.status || 'pending').toLowerCase() as keyof typeof statusOrder] || 5;
        const statusB = statusOrder[(b.status || 'pending').toLowerCase() as keyof typeof statusOrder] || 5;
        
        if (Math.abs(dateComparison) < 86400000) {
          return statusA - statusB;
        }
        return dateComparison;
      });
      
      setRecentInvoices(sortedInvoices);
      
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = () => {
    // Wrapper for compatibility if passed as prop, or just reuse loadRawData
    loadRawData();
  };

  const refreshData = () => {
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Revenue Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Track your court reporting business performance</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="All">All Time</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : formatCurrency(dashboardStats?.totalRevenue || 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Completed & Closed</p>
              </div>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : dashboardStats?.invoiceCount || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">All Statuses</p>
              </div>
            </div>
          </div>

          {/* Average Invoice */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm font-medium text-gray-500">Average Invoice</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : formatCurrency(dashboardStats?.averageInvoice || 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Revenue/Invoice</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
              <Link href="/create-invoice">
                <button className="w-full bg-purple-600 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>New Invoice</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Invoice Status Summary - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Invoice Status Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {dashboardStats?.invoiceCounts.pending || 0}
              </div>
              <div className="text-sm text-yellow-800 font-medium">Pending</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {dashboardStats?.invoiceCounts.completed || 0}
              </div>
              <div className="text-sm text-green-800 font-medium">Completed</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {dashboardStats?.invoiceCounts.overdue || 0}
              </div>
              <div className="text-sm text-red-800 font-medium">Overdue</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-gray-600">
                {dashboardStats?.invoiceCounts.closed || 0}
              </div>
              <div className="text-sm text-gray-800 font-medium">Closed</div>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid - Recent Invoices in its own column */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {/* Revenue by County - Full Width */}
          <div>
            <RevenueByCounty
              countyRevenue={dashboardStats?.countyRevenue || []}
              isLoading={isLoading}
            />
          </div>

          {/* Recent Invoices - Full Width in its own row */}
          <div>
            <RecentInvoices
              invoices={recentInvoices}
              isLoading={isLoading}
              onRefresh={refreshData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}