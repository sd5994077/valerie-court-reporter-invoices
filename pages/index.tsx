import React from 'react';
import { getBranding } from '../src/config/branding';
import { MobileNavigation } from '../src/components/MobileNavigation';
import Link from 'next/link';

export default function HomePage() {
  const branding = getBranding();

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="home" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Welcome Header */}
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in duration-700">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-2 sm:mb-4">
            Welcome to {branding.business.name}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            {branding.business.tagline}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-1000 delay-300">
          {/* Create Invoice Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ease-out group">
            <div className="bg-orange-600 px-4 sm:px-6 py-4 group-hover:bg-orange-700 transition-colors duration-300">
              <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center space-x-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span>Create New Invoice</span>
              </h3>
              <p className="text-orange-100 mt-1 text-sm sm:text-base">Generate professional invoices for your {branding.business.type.toLowerCase()}</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Create detailed invoices with client information, case details, and itemized billing. 
                Your invoices will be professionally formatted for immediate use.
              </p>
              <div className="flex justify-center">
                <Link href="/create-invoice">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span>Create Invoice</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ease-out group">
            <div className="bg-orange-600 px-4 sm:px-6 py-4 group-hover:bg-orange-700 transition-colors duration-300">
              <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center space-x-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <span>View Revenue Dashboard</span>
              </h3>
              <p className="text-orange-100 mt-1 text-sm sm:text-base">Track your business performance and revenue</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Monitor your revenue by service type, view recent invoices, 
                and analyze performance trends in an easy-to-understand dashboard.
              </p>
              <div className="flex justify-center">
                <Link href="/dashboard">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    <span>View Dashboard</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 sm:mt-16">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto border-l-4 border-orange-500">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
              Professional Invoice Management System
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base text-center mb-4 sm:mb-6">
              This is a template system for creating professional invoices. Customize the branding, 
              service types, and business information to match your specific needs. Perfect for 
              service providers who need professional billing solutions.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-orange-600 font-medium">
              <span className="bg-orange-50 px-2 sm:px-3 py-1 rounded-full">Template System</span>
              <span className="bg-orange-50 px-2 sm:px-3 py-1 rounded-full">Customizable</span>
              <span className="bg-orange-50 px-2 sm:px-3 py-1 rounded-full">Professional</span>
              <span className="bg-orange-50 px-2 sm:px-3 py-1 rounded-full">Easy Setup</span>
            </div>
          </div>
        </div>

        {/* Mobile Contact Info */}
        <div className="sm:hidden mt-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center border-l-4 border-red-500">
            <h4 className="font-semibold text-gray-800 mb-2">Sample Contact Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{branding.business.address.street}</p>
              <p>{branding.business.address.city}, {branding.business.address.state} {branding.business.address.zipCode}</p>
              <p className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span>{branding.business.email}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}