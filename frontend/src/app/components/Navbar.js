'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, FileSpreadsheet, BarChart2, Key, X, Sun, Moon, User, HelpCircle, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the backend API base URL
const API_BASE_URL = 'http://localhost:5000';

export default function Navbar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState('');

  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => pathname === path;

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post(`${API_BASE_URL}/update_api_key`, { api_key: apiKey });

      if (response.status === 200) {
        setMessage({ text: 'API key updated successfully!', type: 'success' });
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage({ text: '', type: '' });
        }, 2000);
      } else {
        setMessage({ text: response.data.error || 'Failed to update API key', type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'An error occurred. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show tooltip for nav items
  const handleShowTooltip = (id) => {
    setShowTooltip(id);
  };

  // Hide tooltip
  const handleHideTooltip = () => {
    setShowTooltip('');
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Branding */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg w-9 h-9 shadow-sm">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-semibold tracking-tight text-lg hidden sm:block">
                Invoice Extraction Pro
              </span>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/imagedest"
                className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 
                  ${isActive('/imagedest') 
                    ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                onMouseEnter={() => handleShowTooltip('single')}
                onMouseLeave={handleHideTooltip}
              >
                <Receipt className="h-[18px] w-[18px]" />
                <span>Single Invoice</span>
                {isActive('/imagedest') && (
                  <span className="absolute bottom-0 left-0 h-0.5 bg-teal-500 w-full rounded-full animate-expandWidth"></span>
                )}
                {showTooltip === 'single' && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Process a single invoice and chat with AI
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </Link>
              
              <Link
                href="/bulkimgpro"
                className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 
                  ${isActive('/bulkimgpro') 
                    ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                onMouseEnter={() => handleShowTooltip('batch')}
                onMouseLeave={handleHideTooltip}
              >
                <BarChart2 className="h-[18px] w-[18px]" />
                <span>Batch Processing</span>
                {isActive('/bulkimgpro') && (
                  <span className="absolute bottom-0 left-0 h-0.5 bg-teal-500 w-full rounded-full animate-expandWidth"></span>
                )}
                {showTooltip === 'batch' && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Process multiple invoices at once
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </Link>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* API Key Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                onMouseEnter={() => handleShowTooltip('api')}
                onMouseLeave={handleHideTooltip}
              >
                <Key className="h-5 w-5" />
                {showTooltip === 'api' && (
                  <div className="absolute -bottom-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Configure API Key
                    <div className="absolute -top-1 right-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
              
              {/* Help Button */}
              <button 
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                onMouseEnter={() => handleShowTooltip('help')}
                onMouseLeave={handleHideTooltip}
              >
                <HelpCircle className="h-5 w-5" />
                {showTooltip === 'help' && (
                  <div className="absolute -bottom-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Help & Support
                    <div className="absolute -top-1 right-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                onMouseEnter={() => handleShowTooltip('theme')}
                onMouseLeave={handleHideTooltip}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {showTooltip === 'theme' && (
                  <div className="absolute -bottom-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
                    <div className="absolute -top-1 right-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
              
              {/* User Menu */}
              <button 
                className="hidden sm:flex p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                onMouseEnter={() => handleShowTooltip('user')}
                onMouseLeave={handleHideTooltip}
              >
                <User className="h-5 w-5" />
                {showTooltip === 'user' && (
                  <div className="absolute -bottom-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-fadeIn">
                    Account & Settings
                    <div className="absolute -top-1 right-4 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  </div>
                )}
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Optional Breadcrumb for multi-step pages
      {(pathname === '/bulkimgpro') && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 py-2 px-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="container mx-auto flex items-center gap-2">
            <span>Home</span>
            <span>/</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {pathname === '/imagedest' ? 'Single Invoice Processing' : 'Batch Invoice Processing'}
            </span>
          </div>
        </div>
      )} */}
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 animate-slideDown shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/imagedest"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/imagedest') 
                  ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5" />
                <span>Single Invoice</span>
              </div>
            </Link>
            
            <Link
              href="/bulkimgpro"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/bulkimgpro') 
                  ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="h-5 w-5" />
                <span>Batch Processing</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Update Gemini API Key</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setMessage({ text: '', type: '' });
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateApiKey}>
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter your Google Gemini API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="API Key"
                  required
                />
              </div>
              
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {message.text}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setMessage({ text: '', type: '' });
                  }}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 shadow-sm transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating
                    </span>
                  ) : 'Update API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Global styles for navbar animations */}
      <style jsx global>{`
        @keyframes expandWidth {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 200px; opacity: 1; }
        }
        
        .animate-expandWidth {
          animation: expandWidth 0.3s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
