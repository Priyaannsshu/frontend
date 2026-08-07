// import React, { useState } from 'react';
// import axios from 'axios';

// const InventoryForm = () => {
//   const [formData, setFormData] = useState({
//     itemName: '',
//     batch: '',
//     partyName: '',
//     expiryDate: '',
//     pack: '',
//     quantity: 0,
//     purchaseRate: 0,
//     mrp: 0,
//     gstPercentage: 0,
//     description: '',
//     email: localStorage.getItem('email') || ''
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       const response = await axios.post(`${API_BASE_URL}/api/inventory/add`, formData);
//       setSuccess('Item added to inventory successfully');
//       setFormData({
//         itemName: '',
//         batch: '',
//         partyName: '',
//         expiryDate: '',
//         pack: '',
//         quantity: 0,
//         purchaseRate: 0,
//         mrp: 0,
//         gstPercentage: 0,
//         description: '',
//         email: localStorage.getItem('email') || ''
//       });
//     } catch (err) {
//       setError(err.response?.data?.message || 'Error adding item to inventory');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="bg-white rounded-lg shadow-lg p-8">
//           <h1 className="text-3xl font-bold text-gray-800 mb-8">Add Item to Inventory</h1>
          
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//               {error}
//             </div>
//           )}
          
//           {success && (
//             <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//               {success}
//             </div>
//           )}
          
//           <form onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Item Name</label>
//                 <input
//                   type="text"
//                   name="itemName"
//                   value={formData.itemName}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Batch Number</label>
//                 <input
//                   type="text"
//                   name="batch"
//                   value={formData.batch}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Party Name</label>
//                 <input
//                   type="text"
//                   name="partyName"
//                   value={formData.partyName}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   required
//                   placeholder="Enter supplier/party name"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Expiry Date</label>
//                 <input
//                   type="date"
//                   name="expiryDate"
//                   value={formData.expiryDate}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Pack</label>
//                 <input
//                   type="text"
//                   name="pack"
//                   value={formData.pack}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Quantity</label>
//                 <input
//                   type="number"
//                   name="quantity"
//                   value={formData.quantity}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   min="0"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Purchase Rate</label>
//                 <input
//                   type="number"
//                   name="purchaseRate"
//                   value={formData.purchaseRate}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   min="0"
//                   step="0.01"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">MRP</label>
//                 <input
//                   type="number"
//                   name="mrp"
//                   value={formData.mrp}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   min="0"
//                   step="0.01"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-lg font-medium text-gray-700 mb-2">GST Percentage</label>
//                 <input
//                   type="number"
//                   name="gstPercentage"
//                   value={formData.gstPercentage}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   min="0"
//                   max="100"
//                   step="0.01"
//                   required
//                 />
//               </div>
              
//               <div className="md:col-span-2">
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Description</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
//                   rows="3"
//                 />
//               </div>
//             </div>

//             <div className="mt-8">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full px-8 py-4 text-lg bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
//               >
//                 {loading ? 'Adding...' : 'Add to Inventory'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InventoryForm; 

// // components/Inventory.js
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function Inventory() {
//   const [inventoryItems, setInventoryItems] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       const response = await axios.get('/api/inventory'); // Adjust the API endpoint as needed
//       setInventoryItems(response.data);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };

//   return (
//     <div className="container mx-auto mt-8">
//       <h2 className="text-2xl font-bold mb-4">Inventory</h2>
//       {inventoryItems.length > 0 ? (
//         <table className="w-full border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="py-2 px-4 border">Item Name</th>
//               <th className="py-2 px-4 border">Batch</th>
//               <th className="py-2 px-4 border">Expiry Date</th>
//               <th className="py-2 px-4 border">Pack</th>
//               <th className="py-2 px-4 border">Quantity</th>
//               <th className="py-2 px-4 border">Purchase Rate</th>
//               <th className="py-2 px-4 border">MRP</th>
//               <th className="py-2 px-4 border">GST Percentage</th>
//               <th className="py-2 px-4 border">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map((item, index) => (
//               <tr key={index} className="text-center">
//                 <td className="py-2 px-4 border">{item.itemName}</td>
//                 <td className="py-2 px-4 border">{item.batch}</td>
//                 <td className="py-2 px-4 border">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="py-2 px-4 border">{item.pack}</td>
//                 <td className="py-2 px-4 border">{item.quantity}</td>
//                 <td className="py-2 px-4 border">{item.purchaseRate}</td>
//                 <td className="py-2 px-4 border">{item.mrp}</td>
//                 <td className="py-2 px-4 border">{item.gstPercentage}%</td>
//                 <td className="py-2 px-4 border">{item.description || 'N/A'}</td>
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

// export default Inventory;


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function Inventory() {
//   const [inventoryItems, setInventoryItems] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       // Get the email from localStorage
//       const email = localStorage.getItem('email');
//       if (!email) {
//         console.error("No email found in localStorage");
//         return;
//       }

//       // Make API call with email directly in the URL
//       const response = await axios.get(`http://localhost:5000/api/inventory/${email}`);
//       setInventoryItems(response.data);  // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };

//   return (
//     <div className="container mx-auto mt-8">
//       <h2 className="text-2xl font-bold mb-4">Inventory</h2>
//       {inventoryItems.length > 0 ? (
//         <table className="w-full border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="py-2 px-4 border">Item Name</th>
//               <th className="py-2 px-4 border">Batch</th>
//               <th className="py-2 px-4 border">Expiry Date</th>
//               <th className="py-2 px-4 border">Pack</th>
//               <th className="py-2 px-4 border">Quantity</th>
//               <th className="py-2 px-4 border">Purchase Rate</th>
//               <th className="py-2 px-4 border">MRP</th>
//               <th className="py-2 px-4 border">GST Percentage</th>
//               <th className="py-2 px-4 border">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map((item, index) => (
//               <tr key={index} className="text-center">
//                 <td className="py-2 px-4 border">{item.itemName}</td>
//                 <td className="py-2 px-4 border">{item.batch}</td>
//                 <td className="py-2 px-4 border">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="py-2 px-4 border">{item.pack}</td>
//                 <td className="py-2 px-4 border">{item.quantity}</td>
//                 <td className="py-2 px-4 border">{item.purchaseRate}</td>
//                 <td className="py-2 px-4 border">{item.mrp}</td>
//                 <td className="py-2 px-4 border">{item.gstPercentage}%</td>
//                 <td className="py-2 px-4 border">{item.description || 'N/A'}</td>
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

// export default Inventory;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const Inventory = () => {
//   const [inventory, setInventory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchInventory = async () => {
//     try {
//       const email = localStorage.getItem('email');
//       const token = localStorage.getItem('token');
      
//       if (!email || !token) {
//         throw new Error('Authentication required');
//       }

//       const response = await axios.get(
//         `https://medicine-inventory-system.onrender.com/api/inventory/${encodeURIComponent(email)}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // Ensure partyName is included in the response data
//       const inventoryWithPartyName = response.data.map(item => ({
//         ...item,
//         partyName: item.partyName || 'N/A' // Provide a default value if partyName is missing
//       }));

//       setInventory(inventoryWithPartyName);
//       setError(null);
//     } catch (error) {
//       console.error('Fetch error:', error);
//       setError(error.response?.data?.message || error.message);
//       setInventory([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      
//       {loading ? (
//         <p className="text-gray-600">Loading inventory...</p>
//       ) : error ? (
//         <p className="text-red-500">Error: {error}</p>
//       ) : (
//         <>
//           <p className="mb-4">Total Medicines: {inventory.length}</p>
//           <div className="overflow-x-auto">
//             <table className="min-w-full border-collapse border border-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>
//                   {[
//                     'Item Name', 'Batch', 'Party Name', 'Expiry Date', 'Pack',
//                     'Quantity', 'Purchase Rate', 'MRP', 'GST (%)', 'Description'
//                   ].map((header) => (
//                     <th key={header} className="p-3 border text-left text-sm font-semibold">
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {inventory.map((item) => (
//                   <tr key={item._id} className="hover:bg-gray-50">
//                     <td className="p-3 border">{item.itemName}</td>
//                     <td className="p-3 border">{item.batch}</td>
//                     <td className="p-3 border">{item.partyName || 'N/A'}</td>
//                     <td className="p-3 border">
//                       {new Date(item.expiryDate).toLocaleDateString()}
//                     </td>
//                     <td className="p-3 border">{item.pack}</td>
//                     <td className="p-3 border">{item.quantity}</td>
//                     <td className="p-3 border">₹{item.purchaseRate?.toFixed(2)}</td>
//                     <td className="p-3 border">₹{item.mrp?.toFixed(2)}</td>
//                     <td className="p-3 border">{item.gstPercentage}%</td>
//                     <td className="p-3 border">{item.description || '-'}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Inventory;


import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from 'axios';
// Make sure you have lucide-react installed: npm install lucide-react
import { SearchIcon, RefreshCw, AlertCircle, Package, Calendar, User, Info } from 'lucide-react';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const fetchInventory = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      setLoading(true);
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');

      if (!email || !token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log(`[Frontend] Fetching inventory for email: ${email}`);
      const response = await axiosInstance.get(
        `/api/inventory?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Log the raw data exactly as received from the backend API
      console.log('[Frontend] Raw API response data received:', JSON.stringify(response.data, null, 2));


      // Process data - keep partyName as received, parse date
      const processedInventory = response.data.map(item => {
         // Log the specific partyName being processed for each item
         console.log(`[Frontend] Processing item: ${item.itemName} (${item.batch}), Raw Party Name from API: "${item.partyName}" (Type: ${typeof item.partyName})`);
         return {
           ...item,
           // Keep partyName exactly as it is received from backend
           partyName: item.partyName,
           // Convert expiryDate string to Date object, handle potential invalid dates
           expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
         };
      });

      setInventory(processedInventory); // Update main state

    } catch (error) {
      console.error('[Frontend] Fetch error:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setError('Authentication failed. Please log out and log in again.');
      } else {
          setError(error.response?.data?.message || error.message || 'Failed to fetch inventory');
      }
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch inventory data when the component mounts
  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means run once on mount

   // Recalculate derived states (expiring, low stock) whenever the main inventory changes
   useEffect(() => {
       const today = new Date();
       today.setHours(0, 0, 0, 0); // Start of today
       const thirtyDaysFromNow = new Date();
       thirtyDaysFromNow.setDate(today.getDate() + 30);
       thirtyDaysFromNow.setHours(23, 59, 59, 999); // End of the 30th day

       const expiring = inventory.filter(item =>
           item.expiryDate instanceof Date && !isNaN(item.expiryDate) && // Check if valid Date
           item.expiryDate <= thirtyDaysFromNow && item.expiryDate >= today
       );
       setExpiringSoon(expiring);

       const low = inventory.filter(item => item.quantity != null && item.quantity < 10 && item.quantity > 0);
       setLowStock(low);
   }, [inventory]);


  // Update filteredInventory whenever search, filter, or main inventory changes
  useEffect(() => {
    if (!inventory) { // Handle case where inventory might be null briefly
        setFilteredInventory([]);
        return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = inventory.filter(item => {
        // Search Match Logic
        const matchesSearch = !lowerSearchTerm ||
            item.itemName?.toLowerCase().includes(lowerSearchTerm) ||
            item.batch?.toLowerCase().includes(lowerSearchTerm) ||
            item.description?.toLowerCase().includes(lowerSearchTerm);

        // Party Filter Match Logic
        let matchesParty = true; // Default to true (show all if no filter)
        if (partyFilter) { // Only apply filter if partyFilter is set
            if (partyFilter === "[Missing Supplier]") {
                // Check for null, undefined, or empty string after trimming
                matchesParty = !item.partyName || !String(item.partyName).trim();
            } else {
                // Standard case-insensitive check for other filter values
                const itemPartyNameLower = String(item.partyName ?? '').toLowerCase(); // Safely convert to string
                matchesParty = itemPartyNameLower.includes(partyFilter.toLowerCase());
            }
        }
        // Item must match both search (if any) and party filter (if any)
        return matchesSearch && matchesParty;
    });
    setFilteredInventory(filtered);
  }, [searchTerm, partyFilter, inventory]);


  // Calculate unique party names for the filter dropdown
  const uniquePartyNames = useMemo(() => {
      const names = new Set();
      let hasMissing = false;
      inventory.forEach(item => {
          const name = item.partyName;
          // Check if it's a string and has non-whitespace characters
          if (name && typeof name === 'string' && name.trim()) {
              names.add(name.trim()); // Add the trimmed name
          } else {
              hasMissing = true; // Mark that at least one item is missing a valid name
          }
      });
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b)); // Sort alphabetically
      // Add the special filter option only if there were actually missing names
      if (hasMissing) {
          sortedNames.unshift("[Missing Supplier]");
      }
      return sortedNames;
  }, [inventory]);


  // Format date helper function
  const formatDate = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return 'N/A';
    try {
        // Example format: 30-Apr-2025 (adjust locale/options as needed)
        return dateObj.toLocaleDateString('en-GB', {
            year: 'numeric', month: 'short', day: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", dateObj, e);
        return 'Invalid Date';
    }
  };

  // Check if expiry date is near
  const isExpiringSoon = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    today.setHours(0, 0, 0, 0); // Compare date part only
    thirtyDaysFromNow.setHours(23, 59, 59, 999);
    return dateObj <= thirtyDaysFromNow && dateObj >= today;
  };

  // Helper function to display party name or a placeholder
  const displayPartyName = (partyName, itemName = 'Unknown Item', batch = 'N/A') => {
    const name = partyName; // Raw value received by component

    // Log the value received by this specific rendering instance
    console.log(`[displayPartyName] Rendering - Item: ${itemName} (${batch}), Received partyName: "${name}", Type: ${typeof name}`);

    // Check if it's a non-empty string after trimming
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const isValid = trimmedName.length > 0;

    if (isValid) {
        // Display the valid, trimmed name
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {trimmedName}
            </span>
        );
    } else {
        // Display placeholder if name is missing or invalid
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 italic" title="Party Name Missing or Invalid">
                <Info size={12} className="mr-1" /> N/A
            </span>
        );
      }
  };

  // --- JSX Rendering ---
  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen pb-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 py-6 px-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Medicine Inventory</h1>
        <p className="text-blue-100 mt-1">Manage your pharmaceutical stock efficiently</p>
      </div>

      {/* Dashboard Cards */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* Card: Total Medicines */}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border-l-4 border-indigo-500">
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Items</p>
                 <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{inventory.length}</p>
               </div>
               <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full">
                 <Package className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
               </div>
             </div>
           </div>
          {/* Card: Unique Suppliers */}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border-l-4 border-amber-500">
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Suppliers</p>
                 <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{uniquePartyNames.includes("[Missing Supplier]") ? uniquePartyNames.length -1 : uniquePartyNames.length}</p>
               </div>
               <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
                 <User className="h-7 w-7 text-amber-600 dark:text-amber-400" />
               </div>
             </div>
           </div>
           {/* Card: Expiring Soon */}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border-l-4 border-rose-500">
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Expiring Soon</p>
                 <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{expiringSoon.length}</p>
               </div>
               <div className="bg-rose-100 dark:bg-rose-900/50 p-3 rounded-full">
                 <Calendar className="h-7 w-7 text-rose-600 dark:text-rose-400" />
               </div>
             </div>
           </div>
           {/* Card: Low Stock */}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border-l-4 border-emerald-500">
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Low Stock</p>
                 <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{lowStock.length}</p>
               </div>
               <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full">
                 <AlertCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
               </div>
             </div>
           </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
             {/* Search Input */}
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
               </div>
               <input type="text" placeholder="Search name, batch, description..." className="pl-10 pr-4 py-2 block w-full border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             {/* Supplier Filter */}
             <div>
               <select className="block w-full border border-gray-300 dark:border-slate-700 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200" value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}>
                 <option value="">All Suppliers</option>
                 {uniquePartyNames.map((name) => ( <option key={name} value={name}>{name}</option> ))}
               </select>
             </div>
             {/* Refresh Button */}
             <div className="flex justify-end">
               <button onClick={fetchInventory} disabled={isRefreshing} className={`flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}>
                 <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                 {isRefreshing ? 'Refreshing...' : 'Refresh'}
               </button>
             </div>
           </div>
        </div>

        {/* Main Content Area: Table or Messages */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
             <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div><p className="text-gray-600 dark:text-gray-400 mt-4">Loading inventory data...</p></div>
          ) : error ? (
             <div className="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20"><div className="flex items-center"><AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" /><div><p className="text-red-700 dark:text-red-300 font-semibold">Error Fetching Inventory</p><p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p></div></div><button onClick={fetchInventory} className="mt-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">Try Again</button></div>
          ) : (
            <>
              {filteredInventory.length === 0 ? (
                 <div className="p-8 text-center"><Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No inventory items found</h3><p className="mt-1 text-gray-500 dark:text-gray-400">{searchTerm || partyFilter ? "Try adjusting filters or refresh." : "Inventory is empty."}</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        {['Item Name', 'Batch', 'Supplier', 'Expiry', 'Pack', 'Qty', 'Rate (₹)', 'MRP (₹)', 'GST (%)'].map((header) => (<th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{header}</th>))}
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desc.</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredInventory.map((item) => (
                        <tr key={item._id} className={`hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors duration-150 ease-in-out ${item.quantity > 0 && item.quantity < 10 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${isExpiringSoon(item.expiryDate) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.itemName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.batch}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {/* Display party name using helper */}
                            {displayPartyName(item.partyName, item.itemName, item.batch)}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${isExpiringSoon(item.expiryDate) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>{formatDate(item.expiryDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.pack || 'N/A'}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-center ${item.quantity < 10 && item.quantity > 0 ? 'text-orange-600 dark:text-orange-400' : item.quantity === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'}`}>{item.quantity}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{item.purchaseRate?.toFixed(2) ?? 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-medium">{item.mrp?.toFixed(2) ?? 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-center">{item.gstPercentage ?? 0}%</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={item.description || ''}>{item.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Footer with item count */}
              {!loading && !error && (
                <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div><p className="text-sm text-gray-700 dark:text-gray-300">Showing <span className="font-medium">{filteredInventory.length}</span> {searchTerm || partyFilter ? 'matching' : ''} items{searchTerm || partyFilter ? ` (of ${inventory.length} total)` : ''}</p></div>
                      <div>{/* Pagination placeholder */}</div>
                    </div>
                  </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;