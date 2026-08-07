import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const PartyInvoiceSearch = () => {
  const [partyName, setPartyName] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token || !email) {
      navigate('/login');
    }
  }, [navigate]);

  const searchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      
      if (!token || !email) {
        setError('Please login first');
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/bills/party-invoices/${encodeURIComponent(partyName)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invoices');
      }

      setInvoices(data.invoices);
    } catch (err) {
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-2">Search Customer Invoices</h2>
          <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600">
            Enter the customer's name to view their purchase history and invoices.
            This is the same name you used when creating sale bills or return bills.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Enter customer name"
              className="flex-1 rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
            />
            <button
              onClick={searchInvoices}
              disabled={loading || !partyName.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {invoices.length > 0 && (
          <div className="rounded-xl border-2 border-indigo-50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice Number</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-indigo-50">
                    <td className="px-4 py-3">{invoice.saleInvoiceNumber}</td>
                    <td className="px-4 py-3">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc list-inside">
                        {invoice.items.map((item, index) => (
                          <li key={index}>
                            {item.itemName} - {item.quantity} x ₹{item.mrp}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right">₹{invoice.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && invoices.length === 0 && !error && (
          <div className="text-center text-gray-500">
            No invoices found for this customer. Make sure you're using the exact name as entered in the sale bill.
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyInvoiceSearch; 