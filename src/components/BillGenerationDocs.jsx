import React, { useState } from 'react';

const BillGenerationDocs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-block bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg">
            <h1 className="text-4xl font-bold">📑 Bill Generation Helper Guide</h1>
            <p className="mt-2 opacity-90">Version 2.1.0 | Updated: August 2025</p>
          </div>
        </div>

        {/* Getting Started */}
        <section className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-blue-600 mb-6">🏁 Getting Started</h2>
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">System Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                  Modern web browser (Chrome/Firefox/Safari)
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                  Active internet connection
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quick Start Flow */}
        <section className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-blue-600 mb-6">🧭 Quick Start Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['1. Access Bill Console', '2. Enter Party Details', '3. Add Items', '4. Generate Bill'].map((step, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-blue-200 text-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full mb-2 mx-auto flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="font-medium">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-Step Instructions */}
        <section className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-blue-600 mb-6">📋 Step-by-Step Instructions</h2>
          
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">1. Party Information</h3>
              <div className="bg-white p-4 rounded border border-dashed border-gray-300 mb-4">
                [Customer Details Form Preview]
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded">
                  <h4 className="font-medium text-red-600">⚠️ Mandatory Fields</h4>
                  <ul className="list-disc pl-4 mt-2">
                    <li>GSTIN (15-digit format)</li>
                    <li>Shipping Address</li>
                    <li>Contact Number</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h4 className="font-medium text-green-600">💡 Pro Tip</h4>
                  <p>Use the 🔍 search icon to find existing customers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Information */}
        <section className="bg-white p-8 rounded-xl shadow-sm">
          <h3 className="text-2xl font-semibold mb-4">💸 Tax Configuration</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50">
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Rate</th>
                <th className="p-3 text-left">Code</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'GST', rate: '18%', code: 'G18' },
                { type: 'IGST', rate: '12%', code: 'IG12' },
                { type: 'Discount', rate: '5%', code: 'DISC05' }
              ].map((tax, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">{tax.type}</td>
                  <td className="p-3">{tax.rate}</td>
                  <td className="p-3 font-mono">{tax.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Support Section */}
        <section className="bg-yellow-50 p-8 rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-blue-600 mb-6">🆘 Support Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { method: 'Chat Support', availability: '24/7', response: '<5 mins' },
              { method: 'Email', availability: 'Business Hours', response: '4-8 hrs' },
              { method: 'Phone', availability: '10AM-7PM IST', response: 'Immediate' }
            ].map((channel, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{channel.method}</h3>
                <p className="text-sm">⏳ {channel.availability}</p>
                <p className="text-sm">⏱️ {channel.response} response</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Download PDF
            </button>
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Watch Video
            </button>
          </div>
          <p className="text-gray-600">Emergency Contact: helpdesk@pharmabill.com | +91 63713 87040</p>
        </div>
      </div>
    </div>
  );
};

export default BillGenerationDocs;