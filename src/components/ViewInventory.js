// // src/components/ViewInventory.js

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function ViewInventory() {
//   const [inventory, setInventory] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/inventory'); // Ensure this endpoint matches your backend
//       setInventory(response.data); // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error('Error fetching inventory:', error);
//     }
//   };

//   return (
//     <div className="view-inventory-container">
//       <h2 className="text-lg font-semibold mb-4">Inventory List</h2>
//       <table className="min-w-full bg-white border border-gray-300">
//         <thead>
//           <tr>
//             <th className="border-b p-2">Item Name</th>
//             <th className="border-b p-2">Quantity</th>
//             <th className="border-b p-2">Purchase Rate</th>
//             <th className="border-b p-2">MRP</th>
//             <th className="border-b p-2">Expiry Date</th>
//             <th className="border-b p-2">Batch</th>
//             <th className="border-b p-2">GST (%)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {inventory.map((item) => (
//             <tr key={item._id}>
//               <td className="border-b p-2">{item.itemName}</td>
//               <td className="border-b p-2">{item.quantity}</td>
//               <td className="border-b p-2">{item.purchaseRate}</td>
//               <td className="border-b p-2">{item.mrp}</td>
//               <td className="border-b p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
//               <td className="border-b p-2">{item.batch}</td>
//               <td className="border-b p-2">{item.gstPercentage}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ViewInventory;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function ViewInventory() {
//   const [inventory, setInventory] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       // Get the logged-in user's email from localStorage
//       const email = localStorage.getItem('email');
//       console.log("Retrieved email:", email);  // Check if email is being fetched correctly
//       if (!email) {
//         console.error('No email found in localStorage');
//         return;
//       }

//       // Use the email directly in the API call
//       const response = await axios.get(`http://localhost:5000/api/inventory/${email}`);
//       console.log("Inventory response:", response.data);  // Check the response data
//       setInventory(response.data); // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error('Error fetching inventory:', error);
//     }
//   };

//   return (
//     <div className="view-inventory-container">
//       <h2 className="text-lg font-semibold mb-4">Inventory List</h2>
//       {console.log("Inventory State:", inventory)}  {/* Check the inventory state */}
//       {inventory.length > 0 ? (
//         <table className="min-w-full bg-white border border-gray-300">
//           <thead>
//             <tr>
//               <th className="border-b p-2">Item Name</th>
//               <th className="border-b p-2">Batch</th>
//               <th className="border-b p-2">Expiry Date</th>
//               <th className="border-b p-2">Pack</th>
//               <th className="border-b p-2">Quantity</th>
//               <th className="border-b p-2">Purchase Rate</th>
//               <th className="border-b p-2">MRP</th>
//               <th className="border-b p-2">GST (%)</th>
//               <th className="border-b p-2">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventory.map((item) => (
//               <tr key={item._id}>
//                 <td className="border-b p-2">{item.itemName}</td>
//                 <td className="border-b p-2">{item.batch}</td>
//                 <td className="border-b p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="border-b p-2">{item.pack}</td>
//                 <td className="border-b p-2">{item.quantity}</td>
//                 <td className="border-b p-2">{item.purchaseRate}</td>
//                 <td className="border-b p-2">{item.mrp}</td>
//                 <td className="border-b p-2">{item.gstPercentage}</td>
//                 <td className="border-b p-2">{item.description || 'N/A'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       ) : (
//         <p>No inventory items available.</p>
//       )}
//     </div>
//   );
// }

// export default ViewInventory;
import React, { useEffect, useState, useRef } from 'react';
import { Search, RefreshCw, AlertCircle, Package, Calendar, Tag, User, DollarSign, TrendingUp, Shield, Activity, History, Eye } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../utils/socketUtils';
import API_BASE_URL from '../config/api';

const ViewInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active'); // Changed default to 'active'
  const [showHistory, setShowHistory] = useState(false);
  const socket = useSocket();
  const fetchTimeout = useRef(null);

  const fetchInventory = async () => {
    try {
      setIsRefreshing(true);
      // Using in-memory storage instead of localStorage
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token'); // Replace with actual auth system
      
      if (!email || !token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/inventory?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch inventory');
      }
      
      const data = await response.json();

      // Process inventory data - ensure party name is properly handled
      const inventoryWithPartyName = data.map(item => ({
        ...item,
        partyName: item.partyName?.trim() || 'Unknown Supplier',
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
      }));

      setInventory(inventoryWithPartyName);
      
      // Find items expiring in the next 30 days (only for items with quantity > 0)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiring = inventoryWithPartyName.filter(item => 
        item.quantity > 0 && 
        item.expiryDate && 
        item.expiryDate <= thirtyDaysFromNow && 
        item.expiryDate >= new Date()
      );
      setExpiringSoon(expiring);
      
      // Find items with low stock (1-9 units)
      const low = inventoryWithPartyName.filter(item => item.quantity > 0 && item.quantity < 10);
      setLowStock(low);
      
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message || 'An unexpected error occurred');
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Real-time inventory update via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleInventoryUpdate = () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
      fetchTimeout.current = setTimeout(() => {
        fetchInventory();
        fetchTimeout.current = null;
      }, 1000); // debounce
    };
    socket.on(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [socket]);

  useEffect(() => {
    // Filter inventory when search term, party filter, or active filter changes
    if (inventory.length) {
      let filtered = inventory;
      
      // Apply quantity filter first
      if (activeFilter === 'active') {
        filtered = filtered.filter(item => item.quantity > 0);
      } else if (activeFilter === 'history') {
        filtered = filtered.filter(item => item.quantity <= 0);
      } else if (activeFilter === 'expiring') {
        filtered = filtered.filter(item => item.quantity > 0 && expiringSoon.some(exp => exp._id === item._id));
      } else if (activeFilter === 'lowstock') {
        filtered = filtered.filter(item => item.quantity > 0 && item.quantity < 10);
      }
      
      // Apply party filter
      if (partyFilter) {
        filtered = filtered.filter(item => 
          item.partyName.toLowerCase().includes(partyFilter.toLowerCase())
        );
      }
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(item => 
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setFilteredInventory(filtered);
    }
  }, [searchTerm, partyFilter, inventory, activeFilter, expiringSoon]);

  // Get unique party names for filter (only from active items)
  const uniquePartyNames = [...new Set(
    inventory
      .filter(item => activeFilter === 'history' ? item.quantity <= 0 : item.quantity > 0)
      .map(item => item.partyName)
  )].sort();

  // Format date accounting for null values
  const formatDate = (dateObj) => {
    if (!dateObj) return 'Not specified';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if date is within 30 days
  const isExpiringSoon = (dateObj) => {
    if (!dateObj) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return dateObj <= thirtyDaysFromNow && dateObj >= new Date();
  };
  
  // Calculate total inventory value (only for active items)
  const activeInventory = inventory.filter(item => item.quantity > 0);
  const totalInventoryValue = activeInventory.reduce((sum, item) => {
    const itemValue = (item.purchaseRate || 0) * (item.quantity || 0);
    return sum + itemValue;
  }, 0);

  // Get history items count
  const historyItemsCount = inventory.filter(item => item.quantity <= 0).length;

  return (
    <div className="bg-slate-50 min-h-screen pb-8">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-700 py-8 px-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white">Medicine Inventory</h1>
          <p className="text-blue-100 mt-2 text-lg">
            {activeFilter === 'history' ? 'Product History & Returns' : 'Manage your pharmaceutical stock efficiently'}
          </p>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-5 border-b-4 border-indigo-500 transition-all hover:shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Medicines</p>
                <p className="text-3xl font-bold text-gray-800">{activeInventory.length}</p>
                <p className="text-indigo-500 text-sm mt-1">In stock</p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-full">
                <Package className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-5 border-b-4 border-purple-500 transition-all hover:shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">Unique Suppliers</p>
                <p className="text-3xl font-bold text-gray-800">{uniquePartyNames.length}</p>
                <p className="text-purple-500 text-sm mt-1">Registered partners</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <User className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-5 border-b-4 border-rose-500 transition-all hover:shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">Expiring Soon</p>
                <p className="text-3xl font-bold text-gray-800">{expiringSoon.length}</p>
                <p className="text-rose-500 text-sm mt-1">Within 30 days</p>
              </div>
              <div className="bg-rose-100 p-4 rounded-full">
                <Calendar className="h-8 w-8 text-rose-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-5 border-b-4 border-emerald-500 transition-all hover:shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {activeFilter === 'history' ? 'History Items' : 'Inventory Value'}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {activeFilter === 'history' ? historyItemsCount : `₹${totalInventoryValue.toLocaleString('en-IN')}`}
                </p>
                <p className="text-emerald-500 text-sm mt-1">
                  {activeFilter === 'history' ? 'Total records' : 'Total investment'}
                </p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-full">
                {activeFilter === 'history' ? (
                  <History className="h-8 w-8 text-emerald-600" />
                ) : (
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Cards - Only show for active inventory */}
        {activeFilter !== 'history' && (lowStock.length > 0 || expiringSoon.length > 0) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStock.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Low Stock Alert</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>You have {lowStock.length} items with low inventory levels.</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button 
                          onClick={() => setActiveFilter('lowstock')}
                          className="bg-amber-100 px-3 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-200 focus:outline-none"
                        >
                          View Items
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {expiringSoon.length > 0 && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md shadow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-rose-800">Expiry Alert</h3>
                    <div className="mt-2 text-sm text-rose-700">
                      <p>You have {expiringSoon.length} medicines expiring within 30 days.</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          onClick={() => setActiveFilter('expiring')}
                          className="bg-rose-100 px-3 py-1.5 rounded-md text-sm font-medium text-rose-800 hover:bg-rose-200 focus:outline-none"
                        >
                          View Items
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Filter Pills */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700 font-medium">View:</span>
            <button 
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'active' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Active Stock ({activeInventory.length})
            </button>
            <button 
              onClick={() => setActiveFilter('history')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'history' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <History className="h-4 w-4 inline mr-1" />
              Product History ({historyItemsCount})
            </button>
            
            {/* Additional filters only for active stock */}
            {activeFilter !== 'history' && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <span className="text-gray-700 font-medium">Quick Filters:</span>
                <button 
                  onClick={() => setActiveFilter('lowstock')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'lowstock' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Low Stock ({lowStock.length})
                </button>
                <button 
                  onClick={() => setActiveFilter('expiring')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'expiring' 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Expiring Soon ({expiringSoon.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search medicines, batch..."
                className="pl-10 pr-4 py-3 block w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="block w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {uniquePartyNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={fetchInventory}
                disabled={isRefreshing}
                className="flex items-center justify-center px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-6 text-lg">Loading inventory data...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <p className="text-red-500 font-medium text-lg">Error: {error}</p>
            </div>
            <p className="mt-2 text-gray-600">Please try refreshing or check your connection.</p>
            <button 
              onClick={fetchInventory}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {filteredInventory.length === 0 ? (
              <div className="p-12 text-center">
                {activeFilter === 'history' ? (
                  <History className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                ) : (
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                )}
                <h3 className="text-xl font-medium text-gray-900">
                  {activeFilter === 'history' ? 'No history records found' : 'No inventory items found'}
                </h3>
                <p className="mt-2 text-gray-500 text-lg">
                  {searchTerm || partyFilter ? 
                    "Try adjusting your search filters" : 
                    activeFilter === 'history' ? 
                      "No returned or expired items in history" :
                      "Add items to your inventory to get started"}
                </p>
                {(searchTerm || partyFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPartyFilter('');
                    }}
                    className="mt-6 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        'Item Name', 'Batch', 'Supplier', 'Expiry Date', 'Pack',
                        'Quantity', 'Purchase Rate', 'MRP', 'GST (%)', 'Description'
                      ].map((header) => (
                        <th key={header} 
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr 
                        key={item._id} 
                        className={`hover:bg-blue-50 transition-colors ${
                          item.quantity <= 0 ? 'bg-red-50' : 
                          item.quantity < 10 ? 'bg-amber-50' : ''
                        } ${item.quantity > 0 && isExpiringSoon(item.expiryDate) ? 'bg-rose-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          {item.quantity <= 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {item.quantity < 0 ? 'Returned/Expired' : 'Out of Stock'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-600 text-sm">{item.batch}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.partyName || 'Unknown Supplier'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${
                            item.quantity > 0 && isExpiringSoon(item.expiryDate) 
                              ? 'text-rose-600 font-medium' 
                              : 'text-gray-600'
                          }`}>
                            {formatDate(item.expiryDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.pack || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${
                            item.quantity <= 0 
                              ? 'bg-red-100 text-red-800' 
                              : item.quantity < 10 
                                ? 'bg-amber-100 text-amber-800' 
                                : item.quantity > 100 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.quantity}
                            {item.quantity < 0 && (
                              <span className="ml-1 text-xs">(Return)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ₹{item.purchaseRate?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₹{item.mrp?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.gstPercentage || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination and summary info */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center text-gray-600 text-sm">
                <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                Showing <span className="font-medium mx-1">{filteredInventory.length}</span> of{' '}
                <span className="font-medium mx-1">
                  {activeFilter === 'history' ? historyItemsCount : activeInventory.length}
                </span> items
                {(activeFilter === 'lowstock' || activeFilter === 'expiring') && (
                  <span className="ml-2">
                    ({activeFilter === 'lowstock' ? 'Low Stock' : 'Expiring Soon'} filter active)
                  </span>
                )}
              </div>
              {(activeFilter === 'lowstock' || activeFilter === 'expiring') && (
                <button
                  onClick={() => setActiveFilter('active')}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Show All Active Items
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInventory;