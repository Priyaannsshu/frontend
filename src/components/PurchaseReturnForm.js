import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../utils/axios';

import API_BASE_URL from '../config/api';

const PurchaseReturnForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    supplierName: '',
    supplierGST: '',
    items: [
      {
        itemName: '',
        batch: '',
        quantity: 0,
        purchaseRate: 0,
        mrp: 0,
        discount: 0,
        gstPercentage: 0,
        expiryDate: '',
        returnableQuantity: 0,
        originalPurchaseQuantity: 0,
        soldQuantity: 0,
        returnedQuantity: 0,
        currentInventoryQuantity: 0
      }
    ]
  });

  const [suppliers, setSuppliers] = useState([]);
  const [returnableItems, setReturnableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBillsLoaded, setIsBillsLoaded] = useState(false);
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    totalDiscount: 0,
    totalGST: 0,
    netAmount: 0
  });

  // Load email from localStorage on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, []);

  // Add request interceptor for authentication
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => axiosInstance.interceptors.request.eject(interceptor);
  }, []);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!formData.email) return;
      
      try {
        console.log('Fetching inventory for email:', formData.email);
        const response = await axios.get(`${API_BASE_URL}/api/inventory/${formData.email}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Inventory response:', response.data);
        
        // Extract unique supplier names from inventory items
        const uniqueSuppliers = [...new Set(response.data.map(item => item.partyName))];
        console.log('Unique suppliers:', uniqueSuppliers);
        
        if (uniqueSuppliers.length === 0) {
          setError('No inventory items found. Please add items to inventory first.');
          setSuppliers([]);
        } else {
          setSuppliers(uniqueSuppliers.map(name => ({ name })));
          setError('');
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        if (err.response?.status === 404) {
          setError('No inventory items found. Please add items to inventory first.');
        } else {
          setError(err.response?.data?.message || 'Error fetching suppliers. Please try again.');
        }
        setSuppliers([]);
      }
    };

    if (formData.email) {
      fetchSuppliers();
    }
  }, [formData.email]);

  const handleLoadBills = async () => {
    if (!formData.supplierName || !formData.email) {
      setError('Please enter supplier name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`${API_BASE_URL}/api/purchase-returns/returnable-quantities`, {
        params: {
          email: formData.email,
          supplierName: formData.supplierName
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.length === 0) {
        setError('No returnable items found for this supplier.');
        setReturnableItems([]);
      } else {
        setReturnableItems(response.data);
        setIsBillsLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching returnable quantities:', err);
      if (err.response?.status === 404) {
        setError('No returnable items found for this supplier.');
      } else {
        setError(err.response?.data?.message || 'Error loading bills. Please try again.');
      }
      setReturnableItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'supplierName') {
      setIsBillsLoaded(false);
      setReturnableItems([]);
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };

    // If item name changes, update available batches and other details
    if (name === 'itemName') {
      updatedItems[index].batch = ''; // Reset batch when item changes
      const returnableItem = returnableItems.find(
        item => item.itemName.toLowerCase() === value.toLowerCase()
      );
      if (returnableItem) {
        // Check if the item has expired
        const today = new Date();
        const expiryDate = new Date(returnableItem.expiryDate);
        const isExpired = expiryDate < today;

        if (isExpired) {
          setError(`Item ${returnableItem.itemName} (Batch: ${returnableItem.batch}) has expired on ${returnableItem.expiryDate}`);
          return;
        }

        updatedItems[index] = {
          ...updatedItems[index],
          returnableQuantity: returnableItem.returnableQuantity,
          originalPurchaseQuantity: returnableItem.originalPurchaseQuantity,
          soldQuantity: returnableItem.soldQuantity,
          returnedQuantity: returnableItem.returnedQuantity,
          currentInventoryQuantity: returnableItem.currentInventoryQuantity,
          purchaseRate: returnableItem.purchaseRate || 0,
          mrp: returnableItem.mrp || 0,
          expiryDate: returnableItem.expiryDate || '',
          gstPercentage: returnableItem.gstPercentage || 0,
          discount: returnableItem.discount || 0
        };
      }
    }

    // If batch changes, update item details for that specific batch
    if (name === 'batch' && value) {
      const returnableItem = returnableItems.find(
        item => item.itemName.toLowerCase() === updatedItems[index].itemName.toLowerCase() &&
               item.batch.toLowerCase() === value.toLowerCase()
      );
      if (returnableItem) {
        // Check if the item has expired
        const today = new Date();
        const expiryDate = new Date(returnableItem.expiryDate);
        const isExpired = expiryDate < today;

        if (isExpired) {
          setError(`Item ${returnableItem.itemName} (Batch: ${returnableItem.batch}) has expired on ${returnableItem.expiryDate}`);
          return;
        }

        updatedItems[index] = {
          ...updatedItems[index],
          returnableQuantity: returnableItem.returnableQuantity,
          originalPurchaseQuantity: returnableItem.originalPurchaseQuantity,
          soldQuantity: returnableItem.soldQuantity,
          returnedQuantity: returnableItem.returnedQuantity,
          currentInventoryQuantity: returnableItem.currentInventoryQuantity,
          purchaseRate: returnableItem.purchaseRate || 0,
          mrp: returnableItem.mrp || 0,
          expiryDate: returnableItem.expiryDate || '',
          gstPercentage: returnableItem.gstPercentage || 0,
          discount: returnableItem.discount || 0
        };
      }
    }

    setFormData({ ...formData, items: updatedItems });
    calculateTotals();
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemName: '',
          batch: '',
          quantity: 0,
          purchaseRate: 0,
          mrp: 0,
          discount: 0,
          gstPercentage: 0,
          expiryDate: '',
          returnableQuantity: 0,
          originalPurchaseQuantity: 0,
          soldQuantity: 0,
          returnedQuantity: 0,
          currentInventoryQuantity: 0
        }
      ]
    });
  };

  const removeItemRow = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalGST = 0;

    formData.items.forEach(item => {
      if (item.quantity && item.purchaseRate) {
        const itemTotal = item.quantity * item.purchaseRate;
        const itemDiscount = (itemTotal * item.discount) / 100;
        const amountAfterDiscount = itemTotal - itemDiscount;
        const itemGST = (amountAfterDiscount * item.gstPercentage) / 100;

        totalAmount += itemTotal;
        totalDiscount += itemDiscount;
        totalGST += itemGST;
      }
    });

    const netAmount = totalAmount - totalDiscount + totalGST;

    setCalculations({
      totalAmount,
      totalDiscount,
      totalGST,
      netAmount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierName || !formData.receiptNumber) {
        setError('Please fill in all required fields');
        return;
    }

    // Validate items
    if (!formData.items.length) {
        setError('Please add at least one item');
        return;
    }

    for (const item of formData.items) {
        if (!item.itemName || !item.batch || !item.quantity) {
            setError('Please fill in all item details');
            return;
        }

        const returnableItem = returnableItems.find(
            ri => ri.itemName.toLowerCase() === item.itemName.toLowerCase() && 
                 ri.batch.toLowerCase() === item.batch.toLowerCase()
        );

        if (!returnableItem) {
            setError(`Item ${item.itemName} (Batch: ${item.batch}) is not returnable`);
            return;
        }

        if (item.quantity > returnableItem.returnableQuantity) {
            setError(`Return quantity exceeds returnable quantity for ${item.itemName} (Batch: ${item.batch})`);
            return;
        }
    }

    try {
        setLoading(true);
        setError('');

        const response = await axiosInstance.post(`${API_BASE_URL}/api/purchase-returns/create`, {
            ...formData,
            date: formData.date
        });

        if (response.data.success) {
            // Update the returnable items with the new quantities
            if (response.data.updatedReturnableQuantities) {
                setReturnableItems(response.data.updatedReturnableQuantities);
            }

            // Reset form but keep supplier name and email
            setFormData(prevState => ({
                ...prevState,
                receiptNumber: '',
                items: [{
                    itemName: '',
                    batch: '',
                    quantity: 0,
                    purchaseRate: 0,
                    mrp: 0,
                    discount: 0,
                    gstPercentage: 0,
                    expiryDate: '',
                    returnableQuantity: 0,
                    originalPurchaseQuantity: 0,
                    soldQuantity: 0,
                    returnedQuantity: 0,
                    currentInventoryQuantity: 0
                }]
            }));

            setSuccess('Purchase return bill created successfully');
            
            // Download PDF
            if (response.data.pdfUrl) {
                try {
                    const pdfResponse = await axiosInstance.get(
                        `${API_BASE_URL}/api/purchase-returns${response.data.pdfUrl}`,
                        { responseType: 'blob' }
                    );
                    
                    const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${response.data.returnBill.returnInvoiceNumber}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                } catch (pdfError) {
                    console.error('Error downloading PDF:', pdfError);
                    setError('Bill created successfully but failed to download PDF. Please try downloading from the bills list.');
                }
            }

            // Refresh the returnable items list
            await handleLoadBills();
        }
    } catch (err) {
        console.error('Error creating purchase return bill:', err);
        setError(err.response?.data?.message || 'Error creating purchase return bill');
    } finally {
        setLoading(false);
    }
  };

  const createTestInventoryItem = async () => {
    try {
      const testItem = {
        itemName: "Test Medicine",
        batch: "BATCH001",
        partyName: "ABC Pharmaceuticals",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        pack: "Strip",
        quantity: 100,
        purchaseRate: 10,
        mrp: 15,
        gstPercentage: 12,
        email: formData.email
      };

      const response = await axiosInstance.post(`${API_BASE_URL}/api/inventory`, testItem, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Test inventory item created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating test inventory item:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Create Purchase Return Bill</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <button
            onClick={createTestInventoryItem}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Test Inventory Item
          </button>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              <div className="relative group">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-5 py-4 text-lg border-2 border-indigo-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  readOnly
                />
              </div>
              
              <div className="relative group">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              
              <div className="relative group">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Receipt Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  required
                  placeholder="Enter receipt number"
                />
              </div>
              
              <div className="relative group">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Supplier Name</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    list="suppliersList"
                    required
                    placeholder="Select supplier"
                  />
                  <datalist id="suppliersList">
                    {suppliers.map((supplier, index) => (
                      <option key={index} value={supplier.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleLoadBills}
                    disabled={loading || !formData.supplierName}
                    className="px-6 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-md whitespace-nowrap"
                  >
                    {loading ? 'Loading...' : 'Load Bills'}
                  </button>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Supplier GST</label>
                <input
                  type="text"
                  name="supplierGST"
                  value={formData.supplierGST}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  required
                  placeholder="Enter supplier GST"
                />
              </div>
            </div>

            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-indigo-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-800">Items</h2>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-6 py-3 text-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-md disabled:from-gray-400 disabled:to-gray-500"
                  disabled={!isBillsLoaded}
                >
                  <span className="flex items-center"><span className="mr-2">+</span> Add Item</span>
                </button>
              </div>

              <div className="overflow-x-auto bg-indigo-50 rounded-lg shadow-inner">
                <table className="w-full divide-y divide-indigo-200 table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[15%]">Item Name</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Batch</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Quantity</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Returnable Qty</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Original Purchase</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Sold Qty</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Already Returned</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Purchase Rate</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">MRP</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Discount %</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">GST %</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[10%]">Expiry Date</th>
                      <th className="px-6 py-4 text-left text-lg font-medium uppercase tracking-wider w-[5%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-indigo-100">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-indigo-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            name="itemName"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            required
                            disabled={!isBillsLoaded}
                            placeholder="Enter item name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            name="batch"
                            value={item.batch}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            required
                            disabled={!item.itemName}
                          >
                            <option value="">Select Batch</option>
                            {returnableItems
                              .filter(ri => ri.itemName.toLowerCase() === item.itemName.toLowerCase())
                              .map((returnableItem, idx) => (
                                <option key={idx} value={returnableItem.batch}>
                                  {returnableItem.batch}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            min="1"
                            max={item.returnableQuantity}
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.returnableQuantity}
                            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg bg-gray-100"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.originalPurchaseQuantity}
                            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg bg-gray-100"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.soldQuantity}
                            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg bg-gray-100"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.returnedQuantity}
                            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg bg-gray-100"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="purchaseRate"
                            value={item.purchaseRate}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            min="0"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="mrp"
                            value={item.mrp}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            min="0"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="discount"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            min="0"
                            max="100"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="gstPercentage"
                            value={item.gstPercentage}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            min="0"
                            max="100"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            name="expiryDate"
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="text-red-600 hover:text-red-800 text-xl font-medium bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors duration-300"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-6 shadow-md mb-8">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">Bill Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <label className="block text-lg font-medium text-gray-700 mb-2">Total Amount</label>
                  <input
                    type="number"
                    value={calculations.totalAmount.toFixed(2)}
                    className="w-full px-4 py-3 text-xl font-bold text-indigo-700 border-2 border-indigo-200 rounded-lg bg-indigo-50"
                    readOnly
                  />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <label className="block text-lg font-medium text-gray-700 mb-2">Total Discount</label>
                  <input
                    type="number"
                    value={calculations.totalDiscount.toFixed(2)}
                    className="w-full px-4 py-3 text-xl font-bold text-green-700 border-2 border-green-200 rounded-lg bg-green-50"
                    readOnly
                  />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <label className="block text-lg font-medium text-gray-700 mb-2">Total GST</label>
                  <input
                    type="number"
                    value={calculations.totalGST.toFixed(2)}
                    className="w-full px-4 py-3 text-xl font-bold text-blue-700 border-2 border-blue-200 rounded-lg bg-blue-50"
                    readOnly
                  />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <label className="block text-lg font-medium text-gray-700 mb-2">Net Amount</label>
                  <input
                    type="number"
                    value={calculations.netAmount.toFixed(2)}
                    className="w-full px-4 py-3 text-xl font-bold text-purple-700 border-2 border-purple-200 rounded-lg bg-purple-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 text-lg bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg font-bold"
              >
                {loading ? 'Creating...' : 'Create Return Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnForm; 


