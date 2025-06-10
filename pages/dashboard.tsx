import React, { useState, useEffect } from 'react';
import { getBranding } from '../src/config/branding';
import { MobileNavigation } from '../src/components/MobileNavigation';
import { RevenueByCounty } from '../src/components/RevenueByCounty';
import { RecentInvoices } from '../src/components/RecentInvoices';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Get invoices from both database and localStorage
      let databaseInvoices = [];
      try {
        const response = await fetch('/api/invoices/list?email=demo@example.com');
        if (response.ok) {
          const result = await response.json();
          databaseInvoices = result.invoices || [];
        }
      } catch (error) {
        console.warn('Could not load invoices from database:', error);
      }

      // Get finalized invoices from localStorage (for backward compatibility)
      const finalizedInvoices = localStorage.getItem('finalizedInvoices');
      const localStorageInvoices = finalizedInvoices ? JSON.parse(finalizedInvoices) : [];

      // Combine and deduplicate invoices (database takes priority)
      const allInvoices = [...databaseInvoices];
      localStorageInvoices.forEach((localInvoice: any) => {
        const existsInDatabase = databaseInvoices.some((dbInvoice: any) => 
          dbInvoice.id === localInvoice.id || dbInvoice.invoiceNumber === localInvoice.invoiceNumber
        );
        if (!existsInDatabase) {
          allInvoices.push(localInvoice);
        }
      });

      const invoices = allInvoices;
      
      // Ensure all invoices have a status (default to 'pending' if not set)
      const invoicesWithStatus = invoices.map((invoice: any) => ({
        ...invoice,
        status: invoice.status || 'pending'
      }));
      
      // Update localStorage with invoices that have status
      if (invoicesWithStatus.length > 0) {
        localStorage.setItem('finalizedInvoices', JSON.stringify(invoicesWithStatus));
      }
      
      // Count invoices by status
      const invoiceCounts = {
        pending: 0,
        completed: 0,
        overdue: 0,
        closed: 0
      };
      
      invoicesWithStatus.forEach((invoice: any) => {
        const status = invoice.status as keyof typeof invoiceCounts;
        if (status in invoiceCounts) {
          invoiceCounts[status]++;
        }
      });
      
      // Calculate revenue ONLY from completed and closed invoices
      const revenueInvoices = invoicesWithStatus.filter((invoice: any) => 
        invoice.status === 'completed' || invoice.status === 'closed'
      );
      
      console.log('Total invoices:', invoicesWithStatus.length);
      console.log('Revenue invoices (completed/closed):', revenueInvoices.length);
      console.log('Invoice statuses:', invoicesWithStatus.map(inv => ({ id: inv.id, status: inv.status, number: inv.invoiceNumber })));
      
      const totalRevenue = truncateToTwoDecimals(revenueInvoices.reduce((sum: number, invoice: any) => {
        const invoiceTotal = truncateToTwoDecimals(invoice.lineItems.reduce((lineSum: number, item: any) => 
          lineSum + truncateToTwoDecimals(item.quantity * item.rate), 0
        ));
        return sum + invoiceTotal;
      }, 0));
      
      console.log('Total Revenue:', totalRevenue);
      
      const invoiceCount = invoicesWithStatus.length;
      const averageInvoice = revenueInvoices.length > 0 ? truncateToTwoDecimals(totalRevenue / revenueInvoices.length) : 0;
      
      // Group by county (only for revenue-generating invoices)
      const countyRevenue: { [key: string]: number } = {};
      revenueInvoices.forEach((invoice: any) => {
        const county = invoice.customFields?.county || 'Other';
        const invoiceTotal = truncateToTwoDecimals(invoice.lineItems.reduce((sum: number, item: any) => 
          sum + truncateToTwoDecimals(item.quantity * item.rate), 0
        ));
        countyRevenue[county] = truncateToTwoDecimals((countyRevenue[county] || 0) + invoiceTotal);
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
        changePercentage: -100, // Placeholder - would calculate from previous period
        averageChangePercentage: -100, // Placeholder - would calculate from previous period
        countyRevenue: countyRevenueArray
      });
      
      // Sort invoices by date (newest first), then by status priority (Overdue, Pending, Complete, Closed)
      const sortedInvoices = invoicesWithStatus.sort((a: any, b: any) => {
        // Primary sort: Date (newest first)
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        
        // Secondary sort: Status priority (Overdue, Pending, Complete, Closed)
        const statusOrder = { 'overdue': 1, 'pending': 2, 'completed': 3, 'closed': 4 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] || 5;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] || 5;
        
        // If dates are the same (or very close), sort by status
        if (Math.abs(dateComparison) < 86400000) { // Less than 1 day difference
          return statusA - statusB;
        }
        
        return dateComparison;
      });
      
      setRecentInvoices(sortedInvoices.slice(0, 10)); // First 10 invoices (newest with proper priority)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    console.log('Dashboard refreshing data...');
    setIsLoading(true);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Revenue Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your court reporting business performance</p>
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

        {/* Revenue by County - Full Width Row */}
        <div className="mb-6 sm:mb-8">
          <RevenueByCounty
            countyRevenue={dashboardStats?.countyRevenue || []}
            isLoading={isLoading}
          />
        </div>

        {/* Recent Invoices - Full Width Row */}
        <div>
          <RecentInvoices
            invoices={recentInvoices}
            isLoading={isLoading}
            onRefresh={refreshData}
          />
        </div>
      </main>
    </div>
  );
}