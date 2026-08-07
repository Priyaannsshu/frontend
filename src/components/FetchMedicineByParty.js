import React, { useState } from 'react';
import axios from 'axios';

import API_BASE_URL from '../config/api';

const FetchMedicineByParty = () => {
  const [email, setEmail] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/api/purchase-returns/returnable-quantities`, {
        params: { email, supplierName }
      });

      const items = response.data.map(item => ({
        ...item,
        totalPurchaseValue: item.purchasedQuantity * item.purchaseRate,
        totalSaleValue: item.soldQuantity * item.mrp,
        avgPrice: item.purchaseRate,
        expiryStatus: getExpiryStatus(item.expiryDate)
      }));

      setSearchResults(items);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const monthsLeft = (expiry - today) / (1000 * 60 * 60 * 24 * 30);
    if (monthsLeft < 0) return 'expired';
    if (monthsLeft < 3) return 'nearExpiry';
    return 'good';
  };

  const calculateTotals = () => {
    return searchResults.reduce((acc, item) => ({
      totalPurchaseValue: acc.totalPurchaseValue + item.totalPurchaseValue,
      totalSaleValue: acc.totalSaleValue + item.totalSaleValue,
      totalPurchasedQty: acc.totalPurchasedQty + item.purchasedQuantity,
      totalSoldQty: acc.totalSoldQty + item.soldQuantity
    }), {
      totalPurchaseValue: 0,
      totalSaleValue: 0,
      totalPurchasedQty: 0,
      totalSoldQty: 0
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">🔎 Fetch Medicine by Party</h1>
          <p className="text-lg text-gray-600 mt-2">Easily view purchase and sales data from specific suppliers</p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white/80 backdrop-blur-md shadow-md rounded-2xl p-6 md:p-10 space-y-6 border border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier/Party Name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg border border-red-300 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              {Object.entries(calculateTotals()).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white shadow-md rounded-xl p-5 border border-gray-200"
                >
                  <p className="text-sm text-gray-500">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </p>
                  <h2 className="text-xl font-semibold text-blue-600 mt-1">
                    {key.includes('Value') ? `₹${value.toFixed(2)}` : value}
                  </h2>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mt-10 shadow-sm border border-gray-200 rounded-xl bg-white">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    {["Item Name", "Batch", "Purchased Qty", "Sold Qty", "Avg Price", "Total Purchase", "Total Sale", "Expiry Date"].map(header => (
                      <th key={header} className="px-6 py-3 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">{item.itemName}</td>
                      <td className="px-6 py-4">{item.batch}</td>
                      <td className="px-6 py-4">{item.purchasedQuantity}</td>
                      <td className="px-6 py-4">{item.soldQuantity}</td>
                      <td className="px-6 py-4">₹{item.avgPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">₹{item.totalPurchaseValue.toFixed(2)}</td>
                      <td className="px-6 py-4">₹{item.totalSaleValue.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-medium ${
                        item.expiryStatus === 'expired' ? 'text-red-500' :
                        item.expiryStatus === 'nearExpiry' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FetchMedicineByParty;
