'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Database, Key, X, Receipt, BarChart2, FileSpreadsheet } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import axios from 'axios';

// Define the backend API base URL
const API_BASE_URL = 'http://localhost:5000';

export default function Navbar() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const isActive = (path) => 
    pathname === path 
      ? 'bg-teal-700 text-white' 
      : 'text-gray-300 hover:bg-teal-700 hover:text-white';

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

  return (
    <nav className="bg-teal-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo & Branding */}
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg shadow-md">
            <FileSpreadsheet className="h-5 w-5 text-teal-900" />
          </div>
          <span className="text-white text-lg font-bold tracking-wide">
            Invoice Extraction Pro
          </span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex space-x-4 items-center">
          <Link
            href="/imagedest"
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${isActive('/imagedest')}`}
          >
            <Receipt className="h-5 w-5" />
            <span>Single Invoice</span>
          </Link>
          <Link
            href="/bulkimgpro"
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${isActive('/bulkimgpro')}`}
          >
            <BarChart2 className="h-5 w-5" />
            <span>Batch Processing</span>
          </Link>
          
          {/* API Key Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-teal-800 text-white hover:bg-teal-700 transition-all duration-200"
          >
            <Key className="h-4 w-4" />
            <span>API Key</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Update Gemini API Key</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setMessage({ text: '', type: '' });
                }}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateApiKey}>
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your Google Gemini API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  placeholder="API Key"
                  required
                />
              </div>
              
              {message.text && (
                <div className={`mb-4 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
