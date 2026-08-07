// import React, { useState, useMemo } from 'react';
// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:5001';

// const PurchaseReturnSearch = () => {
//   const [email, setEmail] = useState('');
//   const [supplierName, setSupplierName] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [activeTab, setActiveTab] = useState('search');
  
//   // Filter states
//   const [filters, setFilters] = useState({
//     searchTerm: '',
//     expiryStatus: 'all',
//     sortBy: 'itemName',
//     sortOrder: 'asc',
//     dateRange: 'all',
//     priceRange: 'all'
//   });

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await axiosInstance.get(`${API_BASE_URL}/api/purchase-returns/returnable-quantities`, {
//         params: { email, supplierName }
//       });

//       const items = response.data.map(item => ({
//         ...item,
//         totalPurchaseValue: item.purchasedQuantity * item.purchaseRate,
//         totalSaleValue: item.soldQuantity * item.mrp,
//         avgPrice: item.purchaseRate,
//         expiryStatus: getExpiryStatus(item.expiryDate)
//       }));

//       setSearchResults(items);
//       setActiveTab('results');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Error fetching data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getExpiryStatus = (expiryDate) => {
//     const today = new Date();
//     const expiry = new Date(expiryDate);
//     const monthsLeft = (expiry - today) / (1000 * 60 * 60 * 24 * 30);
//     if (monthsLeft < 0) return 'expired';
//     if (monthsLeft < 3) return 'nearExpiry';
//     return 'good';
//   };

//   const calculateTotals = () => {
//     return filteredResults.reduce((acc, item) => ({
//       totalPurchaseValue: acc.totalPurchaseValue + (item.purchasedQuantity * item.purchaseRate),
//       totalSaleValue: acc.totalSaleValue + (item.soldQuantity * item.mrp),
//       totalPurchasedQty: acc.totalPurchasedQty + item.purchasedQuantity,
//       totalSoldQty: acc.totalSoldQty + item.soldQuantity
//     }), {
//       totalPurchaseValue: 0,
//       totalSaleValue: 0,
//       totalPurchasedQty: 0,
//       totalSoldQty: 0
//     });
//   };

//   // Filter and sort results
//   const filteredResults = useMemo(() => {
//     return searchResults
//       .filter(item => {
//         const matchesSearch = item.itemName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
//                             item.batch.toLowerCase().includes(filters.searchTerm.toLowerCase());
//         const matchesExpiry = filters.expiryStatus === 'all' || item.expiryStatus === filters.expiryStatus;
        
//         // Date range filter
//         const matchesDateRange = filters.dateRange === 'all' || (() => {
//           const purchaseDate = new Date(item.purchaseDate);
//           const today = new Date();
//           const daysDiff = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
          
//           switch (filters.dateRange) {
//             case 'last7days': return daysDiff <= 7;
//             case 'last30days': return daysDiff <= 30;
//             case 'last90days': return daysDiff <= 90;
//             default: return true;
//           }
//         })();

//         // Price range filter
//         const matchesPriceRange = filters.priceRange === 'all' || (() => {
//           const price = item.purchaseRate;
//           switch (filters.priceRange) {
//             case 'low': return price <= 100;
//             case 'medium': return price > 100 && price <= 500;
//             case 'high': return price > 500;
//             default: return true;
//           }
//         })();

//         return matchesSearch && matchesExpiry && matchesDateRange && matchesPriceRange;
//       })
//       .sort((a, b) => {
//         const order = filters.sortOrder === 'asc' ? 1 : -1;
//         if (filters.sortBy === 'itemName') {
//           return order * a.itemName.localeCompare(b.itemName);
//         }
//         if (filters.sortBy === 'expiryDate') {
//           return order * (new Date(a.expiryDate) - new Date(b.expiryDate));
//         }
//         if (filters.sortBy === 'purchaseRate') {
//           return order * (a.purchaseRate - b.purchaseRate);
//         }
//         return order * (a[filters.sortBy] - b[filters.sortBy]);
//       });
//   }, [searchResults, filters]);

//   const renderSearchForm = () => (
//     <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
//       <form onSubmit={handleSearch} className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
//             <input
//               type="text"
//               value={supplierName}
//               onChange={(e) => setSupplierName(e.target.value)}
//               className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//               required
//             />
//           </div>
//         </div>
//         <div className="flex justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-md"
//           >
//             {loading ? (
//               <div className="flex items-center space-x-2">
//                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 <span>Searching...</span>
//               </div>
//             ) : (
//               'Search'
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );

//   const renderFilters = () => (
//     <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
//           <input
//             type="text"
//             value={filters.searchTerm}
//             onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
//             placeholder="Search items..."
//             className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Status</label>
//           <select
//             value={filters.expiryStatus}
//             onChange={(e) => setFilters(prev => ({ ...prev, expiryStatus: e.target.value }))}
//             className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//           >
//             <option value="all">All</option>
//             <option value="expired">Expired</option>
//             <option value="nearExpiry">Near Expiry</option>
//             <option value="good">Good</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
//           <select
//             value={filters.dateRange}
//             onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
//             className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//           >
//             <option value="all">All Time</option>
//             <option value="last7days">Last 7 Days</option>
//             <option value="last30days">Last 30 Days</option>
//             <option value="last90days">Last 90 Days</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
//           <select
//             value={filters.priceRange}
//             onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
//             className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//           >
//             <option value="all">All Prices</option>
//             <option value="low">Low (≤ ₹100)</option>
//             <option value="medium">Medium (₹100-500)</option>
//             <option value="high">High ({'>'} ₹500)</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
//           <select
//             value={filters.sortBy}
//             onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
//             className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
//           >
//             <option value="itemName">Item Name</option>
//             <option value="expiryDate">Expiry Date</option>
//             <option value="purchaseRate">Purchase Rate</option>
//             <option value="purchasedQuantity">Quantity</option>
//           </select>
//         </div>
//       </div>
//     </div>
//   );

//   const renderResults = () => {
//     if (searchResults.length === 0) return null;

//     const totals = calculateTotals();
//     const statCards = [
//       { label: 'Total Purchase Value', value: `₹${totals.totalPurchaseValue.toFixed(2)}`, icon: '💰', color: 'blue' },
//       { label: 'Total Sale Value', value: `₹${totals.totalSaleValue.toFixed(2)}`, icon: '📈', color: 'green' },
//       { label: 'Total Purchased Quantity', value: totals.totalPurchasedQty, icon: '📦', color: 'purple' },
//       { label: 'Total Sold Quantity', value: totals.totalSoldQty, icon: '🛍️', color: 'orange' }
//     ];

//     return (
//       <div className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {statCards.map((stat, index) => (
//             <div
//               key={index}
//               className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
//                 </div>
//                 <span className="text-3xl">{stat.icon}</span>
//               </div>
//             </div>
//           ))}
//         </div>

//         {renderFilters()}

//         <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {["Item Name", "Batch", "Purchased Qty", "Sold Qty", "Avg Price", "Total Purchase", "Total Sale", "Expiry Date"].map(header => (
//                     <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredResults.map((item, idx) => (
//                   <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.batch}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.purchasedQuantity}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.soldQuantity}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.avgPrice.toFixed(2)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalPurchaseValue.toFixed(2)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalSaleValue.toFixed(2)}</td>
//                     <td className={`px-6 py-4 whitespace-nowrap text-sm ${
//                       item.expiryStatus === 'expired' ? 'text-red-500' :
//                       item.expiryStatus === 'nearExpiry' ? 'text-yellow-600' :
//                       'text-green-600'
//                     }`}>
//                       {new Date(item.expiryDate).toLocaleDateString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
//       <div className="max-w-7xl mx-auto space-y-8">
//         <div className="text-center">
//           <h1 className="text-4xl font-bold tracking-tight text-gray-900">🔎 Purchase Return Search</h1>
//           <p className="text-lg text-gray-600 mt-2">View and manage purchase return data efficiently</p>
//         </div>

//         {/* Tabs */}
//         <div className="flex space-x-4 border-b border-gray-200">
//           <button
//             onClick={() => setActiveTab('search')}
//             className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
//               activeTab === 'search'
//                 ? 'bg-white text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//             }`}
//           >
//             Search
//           </button>
//           <button
//             onClick={() => setActiveTab('results')}
//             className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
//               activeTab === 'results'
//                 ? 'bg-white text-blue-600 border-b-2 border-blue-600'
//                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
//             }`}
//             disabled={searchResults.length === 0}
//           >
//             Results {searchResults.length > 0 && `(${searchResults.length})`}
//           </button>
//         </div>

//         {/* Tab Content */}
//         <div className="mt-6">
//           {activeTab === 'search' && renderSearchForm()}
//           {activeTab === 'results' && renderResults()}
//         </div>

//         {error && (
//           <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
//             {error}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PurchaseReturnSearch;
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import axiosInstance from '../utils/axios';

import API_BASE_URL from '../config/api';

const PurchaseReturnSearch = () => {
  const [email, setEmail] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  
  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    expiryStatus: 'all',
    sortBy: 'itemName',
    sortOrder: 'asc'
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure supplier name is trimmed and capitalized to match backend
      const formattedSupplierName = supplierName.trim();
      const encodedSupplierName = encodeURIComponent(formattedSupplierName);
      const encodedEmail = encodeURIComponent(email.trim());
      const url = `${API_BASE_URL}/api/purchase-returns/returnable-quantities?email=${encodedEmail}&supplierName=${encodedSupplierName}`;
      console.log('Requesting Purchase Return Search URL:', url);
      const response = await axiosInstance.get(url);

      const items = response.data.map(item => ({
        ...item,
        totalPurchaseValue: item.purchasedQuantity * item.purchaseRate,
        totalSaleValue: item.soldQuantity * item.mrp,
        avgPrice: item.purchaseRate,
        expiryStatus: getExpiryStatus(item.expiryDate)
      }));

      setSearchResults(items);
      setActiveTab('results');
    } catch (err) {
      // Log the full error for debugging
      console.error('Purchase Return Search Error:', err, err.response);
      setError(err.response?.data?.message || err.message || 'Error fetching data');
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
    return filteredResults.reduce((acc, item) => ({
      totalPurchaseValue: acc.totalPurchaseValue + (item.purchasedQuantity * item.purchaseRate),
      totalSaleValue: acc.totalSaleValue + (item.soldQuantity * item.mrp),
      totalPurchasedQty: acc.totalPurchasedQty + item.purchasedQuantity,
      totalSoldQty: acc.totalSoldQty + item.soldQuantity
    }), {
      totalPurchaseValue: 0,
      totalSaleValue: 0,
      totalPurchasedQty: 0,
      totalSoldQty: 0
    });
  };

  // Filter and sort results
  const filteredResults = useMemo(() => {
    return searchResults
      .filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                            item.batch.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const matchesExpiry = filters.expiryStatus === 'all' || item.expiryStatus === filters.expiryStatus;
        return matchesSearch && matchesExpiry;
      })
      .sort((a, b) => {
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        if (filters.sortBy === 'itemName') {
          return order * a.itemName.localeCompare(b.itemName);
        }
        if (filters.sortBy === 'expiryDate') {
          return order * (new Date(a.expiryDate) - new Date(b.expiryDate));
        }
        return order * (a[filters.sortBy] - b[filters.sortBy]);
      });
  }, [searchResults, filters]);

  const renderSearchForm = () => (
    <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-8 border border-gray-200 transform transition-all duration-300 hover:shadow-xl">
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
            <div className="relative">
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier/Party Name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : 'Search'}
        </button>
      </form>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Search items..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Status</label>
          <select
            value={filters.expiryStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, expiryStatus: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="expired">Expired</option>
            <option value="nearExpiry">Near Expiry</option>
            <option value="good">Good</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="itemName">Item Name</option>
            <option value="expiryDate">Expiry Date</option>
            <option value="purchasedQuantity">Purchased Quantity</option>
            <option value="soldQuantity">Sold Quantity</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (searchResults.length === 0 && !loading) {
      return <div className="text-center text-gray-500 mt-8">No results found for the given criteria.</div>;
    }

    const totals = calculateTotals();
    const statCards = [
      { label: 'Total Purchase Value', value: `₹${totals.totalPurchaseValue.toFixed(2)}`, icon: '💰', color: 'blue' },
      { label: 'Total Sale Value', value: `₹${totals.totalSaleValue.toFixed(2)}`, icon: '📈', color: 'green' },
      { label: 'Total Purchased Quantity', value: totals.totalPurchasedQty, icon: '📦', color: 'purple' },
      { label: 'Total Sold Quantity', value: totals.totalSoldQty, icon: '🛍️', color: 'orange' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {renderFilters()}

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Item Name", "Batch", "Purchased Qty", "Sold Qty", "Avg Price", "Total Purchase", "Total Sale", "Expiry Date"].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.purchasedQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.soldQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.avgPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalPurchaseValue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalSaleValue.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
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
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">🔎 Purchase Return Search</h1>
          <p className="text-lg text-gray-600 mt-2">View and manage purchase return data efficiently</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
              activeTab === 'search'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
              activeTab === 'results'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            disabled={searchResults.length === 0}
          >
            Results {searchResults.length > 0 && `(${searchResults.length})`}
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'search' && renderSearchForm()}
          {activeTab === 'results' && renderResults()}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnSearch;
