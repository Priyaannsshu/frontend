import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ExpiryBillForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOptionSelect = (option) => {
    setLoading(true);
    try {
      if (option.toLowerCase() === 'client') {
        navigate('/expiry-bill/client');
      } else if (option.toLowerCase() === 'supplier') {
        navigate('/expiry-bill/supplier');
      } else {
        navigate(`/expiry/${option.toLowerCase()}`);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">Expiry Bill Management</h1>
          <p className="text-xl text-gray-600 mb-4">Efficiently manage expired items through client or supplier returns.</p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Our system helps you track and process expired medicines, ensuring proper documentation 
            and maintaining compliance with regulatory requirements. Choose the appropriate return 
            type below to proceed.
          </p>
        </div>

        {/* Options Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Expiry Return Option */}
          <div 
            onClick={() => handleOptionSelect('client')}
            className="cursor-pointer transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-1">
              <div className="bg-white rounded-3xl p-6 h-full">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-2xl p-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-8 w-8 text-orange-500"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">Client Expiry Return</h2>
                    <p className="text-gray-600 mt-1">Process expired items returned by clients</p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-500">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Record client details and return date
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Generate client return receipt
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Update inventory automatically
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Expiry Return Option */}
          <div 
            onClick={() => handleOptionSelect('supplier')}
            className="cursor-pointer transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl p-1">
              <div className="bg-white rounded-3xl p-6 h-full">
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 rounded-2xl p-4">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-8 w-8 text-emerald-500"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">Supplier Expiry Return</h2>
                    <p className="text-gray-600 mt-1">Return expired items to suppliers</p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-500">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Track supplier return policies
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Generate return documentation
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Manage credit notes and refunds
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl bg-opacity-60 backdrop-blur-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Need Assistance?</h2>
            <p className="text-gray-600 text-lg mb-8">
              Our support team is available to guide you through any expiry return process.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                onClick={() => window.location.href = '/support'}
              >
                Contact Support
              </button>
              <button 
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-colors"
                onClick={() => window.location.href = '/docs'}
              >
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default ExpiryBillForm;