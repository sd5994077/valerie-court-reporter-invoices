import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

interface MobileNavigationProps {
  currentPage?: 'home' | 'invoice' | 'dashboard';
}

export function MobileNavigation({ currentPage }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Logo size="sm" className="text-purple-600 lg:hidden" />
              <Logo size="md" className="text-purple-600 hidden lg:block" />
            </div>
            
            {/* Business Info - Hidden on mobile, responsive on tablet+ */}
            <div className="hidden sm:block text-right">
              <h1 className="text-lg font-bold text-purple-600 sm:text-xl lg:text-2xl xl:text-3xl">
                Valerie De Leon, CSR
              </h1>
              <p className="text-sm text-gray-600 font-medium lg:text-base">Professional Court Reporting Services</p>
              <div className="mt-1 lg:mt-2 text-xs lg:text-sm text-gray-500 space-y-0.5 lg:space-y-1">
                <p className="hidden lg:block">126 Old Settlers Drive</p>
                <p className="hidden lg:block">San Marcos, Texas 78666</p>
                <p className="flex items-center justify-end space-x-2">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span className="truncate">valeriedeleon.csr@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Mobile business info */}
            <div className="sm:hidden text-right">
              <h1 className="text-sm font-bold text-purple-600">Valerie De Leon, CSR</h1>
              <p className="text-xs text-gray-600">Court Reporter</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-purple-600 shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 lg:h-16">
            <div className="flex items-center">
              <span className="text-white font-semibold text-base lg:text-lg">Invoicing System</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link 
                href="/"
                className={`text-white hover:bg-white hover:text-purple-600 rounded-lg px-3 py-2 transition-colors duration-200 flex items-center space-x-2 ${
                  currentPage === 'home' ? 'bg-white text-purple-600' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="hidden lg:inline">Home</span>
              </Link>
              
              <Link 
                href="/create-invoice"
                className={`text-white hover:bg-white hover:text-purple-600 rounded-lg px-3 py-2 transition-colors duration-200 flex items-center space-x-2 ${
                  currentPage === 'invoice' ? 'bg-white text-purple-600' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="hidden lg:inline">Invoice</span>
              </Link>

              <Link 
                href="/dashboard"
                className={`text-white hover:bg-white hover:text-purple-600 rounded-lg px-3 py-2 transition-colors duration-200 flex items-center space-x-2 ${
                  currentPage === 'dashboard' ? 'bg-white text-purple-600' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors duration-200"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden bg-purple-700 border-t border-purple-500 relative z-50">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link 
                href="/"
                onClick={closeMenu}
                className={`block w-full text-left text-white hover:bg-purple-600 rounded-lg px-3 py-3 transition-colors duration-200 ${
                  currentPage === 'home' ? 'bg-purple-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="font-medium">Home</span>
                </div>
              </Link>
              
              <Link 
                href="/create-invoice"
                onClick={closeMenu}
                className={`block w-full text-left text-white hover:bg-purple-600 rounded-lg px-3 py-3 transition-colors duration-200 ${
                  currentPage === 'invoice' ? 'bg-purple-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="font-medium">Create Invoice</span>
                </div>
              </Link>

              <Link 
                href="/dashboard"
                onClick={closeMenu}
                className={`block w-full text-left text-white hover:bg-purple-600 rounded-lg px-3 py-3 transition-colors duration-200 ${
                  currentPage === 'dashboard' ? 'bg-purple-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  <span className="font-medium">Dashboard</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden" 
          onClick={closeMenu}
        />
      )}
    </>
  );
}  
 