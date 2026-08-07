import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../utils/axios';

const ReturnBillForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    customerName: '',
    originalBillNumber: '',
    items: [
      {
        itemName: '',
        batch: '',
        quantity: 0,
        discount: 0,
        amount: 0,
        expiryDate: '',
        returnableQuantity: 0
      }
    ]
  });

  const [customers, setCustomers] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    totalDiscount: 0,
    totalGST: 0,
    netAmount: 0
  });

  // Load email from localStorage on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, []);

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!formData.email) return;
      
      try {
        const response = await axiosInstance.get('/api/customers', {
          params: { email: formData.email }
        });
        setCustomers(response.data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    if (formData.email) {
      fetchCustomers();
    }
  }, [formData.email]);

  // Fetch customer's purchase bills when customer is selected
  useEffect(() => {
    const fetchPurchaseBills = async () => {
      if (!formData.customerName || !formData.email) return;
      
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/salebills`, {
          params: {
            email: formData.email,
            partyName: formData.customerName
          }
        });
        setPurchaseBills(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching purchase bills:', err);
        setLoading(false);
      }
    };

    if (formData.customerName && formData.email) {
      fetchPurchaseBills();
    }
  }, [formData.customerName, formData.email]);

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBillSelect = async (e) => {
    const { value } = e.target;
    if (!value) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/salebills/${value}`);
      const bill = response.data;
      
      setFormData({
        ...formData,
        originalBillNumber: bill.invoiceNumber,
        items: bill.items.map(item => ({
          itemName: item.itemName,
          batch: item.batch,
          quantity: 0, // Start with 0 quantity for return
          discount: item.discount || 0,
          amount: item.rate || 0,
          expiryDate: item.expiryDate || '',
          returnableQuantity: 0 // Will be calculated
        }))
      });
      
      // Fetch returnable quantities for these items
      fetchReturnableQuantities(bill.items);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setLoading(false);
      setError('Error fetching bill details');
    }
  };

  const fetchReturnableQuantities = async (items) => {
    try {
      const response = await axiosInstance.post('/api/returnable-quantities', {
        email: formData.email,
        customerName: formData.customerName,
        items: items.map(item => ({
          itemName: item.itemName,
          batch: item.batch
        }))
      });

      // Update items with returnable quantities
      const updatedItems = formData.items.map((item, idx) => {
        const key = `${item.itemName}-${item.batch}`;
        const returnableInfo = response.data[key];
        
        if (returnableInfo) {
          return {
            ...item,
            returnableQuantity: returnableInfo.remainingReturnable,
            expiryDate: returnableInfo.expiryDate
          };
        }
        return item;
      });

      setFormData({
        ...formData,
        items: updatedItems
      });
    } catch (err) {
      console.error('Error fetching returnable quantities:', err);
      setError('Could not determine returnable quantities');
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    
    if (name === 'quantity') {
      const parsedValue = parseInt(value);
      const returnableQty = updatedItems[index].returnableQuantity;
      
      if (parsedValue > returnableQty) {
        setError(`Cannot return more than ${returnableQty} units`);
        return;
      }
      
      updatedItems[index][name] = parsedValue;
    } else {
      updatedItems[index][name] = value;
    }
    
    setFormData({ ...formData, items: updatedItems });
    setError('');
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
          discount: 0,
          amount: 0,
          expiryDate: '',
          returnableQuantity: 0
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
      if (item.quantity && item.amount) {
        const itemTotal = item.quantity * item.amount;
        const itemDiscount = itemTotal * (item.discount / 100);
        const discountedPrice = itemTotal - itemDiscount;
        const itemGST = discountedPrice * 0.18; // 18% GST

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

  const validateForm = () => {
    if (!formData.email) return 'Email is required';
    if (!formData.date) return 'Date is required';
    if (!formData.receiptNumber) return 'Receipt number is required';
    if (!formData.customerName) return 'Customer name is required';
    if (!formData.originalBillNumber) return 'Original bill number is required';
    
    if (formData.items.length === 0) return 'At least one item is required';
    
    for (const item of formData.items) {
      if (!item.itemName) return 'Item name is required';
      if (!item.batch) return 'Batch is required';
      if (!item.quantity || item.quantity <= 0) return 'Quantity must be greater than 0';
      if (!item.amount || item.amount <= 0) return 'Amount must be greater than 0';
      
      // Check if item is expired
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const currentDate = new Date();
        if (expiryDate < currentDate) {
          return `Item ${item.itemName} (Batch: ${item.batch}) is expired. Cannot return expired items.`;
        }
      }
      
      if (item.quantity > item.returnableQuantity) {
        return `Cannot return more than ${item.returnableQuantity} units of ${item.itemName}`;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      // Transform form data to match backend expectations
      const returnBillData = {
        email: formData.email,
        date: formData.date,
        receiptNumber: formData.receiptNumber,
        customerName: formData.customerName,
        originalBillNumber: formData.originalBillNumber,
        items: formData.items.map(item => ({
          itemName: item.itemName,
          batch: item.batch,
          quantity: item.quantity,
          discount: item.discount,
          amount: item.quantity * item.amount
        }))
      };
      
      const response = await axiosInstance.post('/api/return-bills', returnBillData);
      setSuccess('Return bill created successfully!');
      setError('');
      
      // Reset form
      setFormData({
        ...formData,
        receiptNumber: '',
        originalBillNumber: '',
        items: [
          {
            itemName: '',
            batch: '',
            quantity: 0,
            discount: 0,
            amount: 0,
            expiryDate: '',
            returnableQuantity: 0
          }
        ]
      });
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error creating return bill');
      }
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Return Bill</h1>
          
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
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Automatically loaded from your account</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    list="customersList"
                    required
                  />
                  <datalist id="customersList">
                    {customers.map((customer, index) => (
                      <option key={index} value={customer.name} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-gray-500 mt-1">Type a name or select from suggestions</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Purchase Bill</label>
                <select
                  name="originalBillNumber"
                  onChange={handleBillSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Purchase Bill</option>
                  {purchaseBills.map((bill, index) => (
                    <option key={index} value={bill._id}>
                      {bill.invoiceNumber} - {new Date(bill.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Return Items</h2>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b border-r text-left">Item Name</th>
                    <th className="py-2 px-4 border-b border-r text-left">Batch</th>
                    <th className="py-2 px-4 border-b border-r text-center">Returnable Qty</th>
                    <th className="py-2 px-4 border-b border-r text-center">Return Qty</th>
                    <th className="py-2 px-4 border-b border-r text-center">Price</th>
                    <th className="py-2 px-4 border-b border-r text-center">Discount %</th>
                    <th className="py-2 px-4 border-b border-r text-center">Expiry Date</th>
                    <th className="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="text"
                          name="itemName"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          readOnly={!!formData.originalBillNumber}
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="text"
                          name="batch"
                          value={item.batch}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          readOnly={!!formData.originalBillNumber}
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r text-center">
                        <span className="font-medium">{item.returnableQuantity}</span>
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, e)}
                          min="1"
                          max={item.returnableQuantity}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md mx-auto text-center"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="number"
                          name="amount"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md mx-auto text-center"
                          readOnly={!!formData.originalBillNumber}
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="number"
                          name="discount"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md mx-auto text-center"
                          readOnly={!!formData.originalBillNumber}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r text-center">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.items.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mb-6">
              <button
                type="button"
                onClick={addItemRow}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Add Item
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total Amount:</span>
                    <span>₹{calculations.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total Discount:</span>
                    <span>₹{calculations.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total GST (18%):</span>
                    <span>₹{calculations.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span>Net Refund Amount:</span>
                    <span>₹{calculations.netAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Refund Calculation Example:</h4>
                  <ol className="list-decimal pl-5 text-sm">
                    <li className="mb-1">
                      Discounted Price = Price - (Price * Discount%) = ₹100 - (₹100 * 5 / 100) = ₹95
                    </li>
                    <li className="mb-1">
                      GST = Discounted Price * GST% = ₹95 * 18 / 100 = ₹17.10
                    </li>
                    <li className="mb-1">
                      Total Refund = Discounted Price + GST = ₹95 + ₹17.10 = ₹112.10
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Create Return Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnBillForm;