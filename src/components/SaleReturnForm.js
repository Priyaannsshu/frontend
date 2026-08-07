import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import for redirection
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axiosInstance from '../utils/axios';

const SaleReturnForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    returnInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    customerName: '',
    items: [
      {
        itemName: '',
        batch: '',
        quantity: 0,
        discount: 0,
        amount: 0,
        availableQuantity: 0,
        purchaseRate: 0,
        gstPercentage: 0,
        gstAmount: 0,
        returnableQuantity: 0,
        availableBatches: []
      }
    ],
    totalAmount: 0,
    totalDiscount: 0,
    gstAmount: 0,
    netAmount: 0
  });

  const [saleBills, setSaleBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingBills, setFetchingBills] = useState(false);
  const [showLoadBillButton, setShowLoadBillButton] = useState(false);

  // Check authentication status immediately
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      
      if (token && email) {
        console.log("Token found:", token);
        console.log("Email loaded from localStorage:", email);
        setFormData(prevState => ({
          ...prevState,
          email: email
        }));
      } else {
        console.warn("No token or email found in localStorage");
        setError("You must be logged in to access this page");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Fetch medicines when customer name is entered
  useEffect(() => {
    if (formData.customerName && formData.email) {
      setShowLoadBillButton(true);
    } else {
      setShowLoadBillButton(false);
      setSaleBills([]);
    }
  }, [formData.customerName, formData.email]);

  const handleLoadBill = async () => {
    try {
      setFetchingBills(true);
      const token = localStorage.getItem('token');
      // Use the new available inventory endpoint
      const response = await axiosInstance.get('/api/inventory/available', {
        params: {
          email: formData.email,
          // Optionally filter by itemName or batch if needed
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data && Array.isArray(response.data)) {
        // Store the medicines data with available quantities
        const formattedMedicines = response.data.map(medicine => ({
          itemName: medicine.itemName,
          batch: medicine.batch,
          quantity: medicine.availableQuantity, // Use availableQuantity
          soldQuantity: medicine.soldQuantity,
          returnedQuantity: medicine.returnedQuantity,
          mrp: medicine.mrp,
          purchaseRate: medicine.purchaseRate
        }));
        setSaleBills(formattedMedicines);
        setSuccess('Medicines loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('No medicines found for this customer');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          window.location.href = '/login';
        }, 3000);
      } else {
        setError('Failed to load medicines');
        setTimeout(() => setError(''), 3000);
      }
    } finally {
      setFetchingBills(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleItemNameChange = (index, e) => {
    const { value } = e.target;
    const updatedItems = [...formData.items];
    
    // Update item name
    updatedItems[index] = {
      ...updatedItems[index],
      itemName: value,
      batch: '', // Reset batch when item name changes
      availableBatches: [] // Reset available batches
    };
    
    // Find all matching medicines (case-insensitive)
    const matchingMedicines = saleBills.filter(medicine => 
      medicine.itemName.toLowerCase() === value.toLowerCase()
    );
    
    if (matchingMedicines.length > 0) {
      // Store available batches for dropdown
      updatedItems[index] = {
        ...updatedItems[index],
        itemName: matchingMedicines[0].itemName, // Use the original case from backend
        availableBatches: matchingMedicines.map(medicine => ({
          batch: medicine.batch,
          quantity: medicine.quantity, // Use availableQuantity
          mrp: medicine.mrp,
          purchaseRate: medicine.purchaseRate
        }))
      };

      // If only one batch, auto-select it
      if (matchingMedicines.length === 1) {
        const medicine = matchingMedicines[0];
        updatedItems[index] = {
          ...updatedItems[index],
          batch: medicine.batch,
          availableQuantity: medicine.quantity, // Use availableQuantity
          returnableQuantity: medicine.quantity,
          purchaseRate: medicine.purchaseRate,
          amount: medicine.purchaseRate,
          quantity: 1
        };
      }
    }
    
    setFormData(prevState => ({ ...prevState, items: updatedItems }));
  };

  const handleBatchChange = (index, e) => {
    const { value } = e.target;
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    // Find the selected batch details
    const selectedBatch = item.availableBatches.find(batch => batch.batch === value);
    
    if (selectedBatch) {
      updatedItems[index] = {
        ...item,
        batch: selectedBatch.batch,
        availableQuantity: selectedBatch.quantity, // Use availableQuantity
        returnableQuantity: selectedBatch.quantity,
        purchaseRate: selectedBatch.purchaseRate,
        amount: selectedBatch.purchaseRate,
        quantity: 1
      };
    }
    
    setFormData(prevState => ({ ...prevState, items: updatedItems }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    // Handle numeric inputs
    if (['quantity', 'discount', 'gstPercentage'].includes(name)) {
      const numericValue = parseFloat(value) || 0;
      
      // Validate quantity against available quantity
      if (name === 'quantity') {
        if (numericValue > item.availableQuantity) {
          setError(`Cannot return ${numericValue} units of ${item.itemName} (Batch: ${item.batch}). Maximum returnable quantity is ${item.availableQuantity}`);
          return;
        }
        if (numericValue <= 0) {
          setError('Return quantity must be greater than 0');
          return;
        }
      }
      
      updatedItems[index] = {
        ...item,
        [name]: numericValue
      };
      
      // Recalculate amounts when any value changes
      const totalAmount = item.purchaseRate * updatedItems[index].quantity;
      const discountAmount = (totalAmount * updatedItems[index].discount) / 100;
      const amountAfterDiscount = totalAmount - discountAmount;
      const gstAmount = (amountAfterDiscount * updatedItems[index].gstPercentage) / 100;
      
      updatedItems[index] = {
        ...updatedItems[index],
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        amount: amountAfterDiscount,
        gstAmount: gstAmount,
        netAmount: amountAfterDiscount + gstAmount
      };
    } else {
      updatedItems[index] = {
        ...item,
        [name]: value
      };
    }
    
    setFormData(prevState => ({ ...prevState, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const addItemRow = () => {
    setFormData(prevState => ({
      ...prevState,
      items: [
        ...prevState.items,
        {
          itemName: '',
          batch: '',
          quantity: 0,
          discount: 0,
          amount: 0,
          availableQuantity: 0,
          purchaseRate: 0,
          gstPercentage: 0,
          gstAmount: 0,
          returnableQuantity: 0,
          availableBatches: []
        }
      ]
    }));
  };

  const removeItemRow = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData(prevState => ({ ...prevState, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items) => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalGstAmount = 0;
    let netAmount = 0;

    items.forEach(item => {
      const itemTotalAmount = item.purchaseRate * item.quantity;
      const itemDiscountAmount = (itemTotalAmount * item.discount) / 100;
      const itemAmountAfterDiscount = itemTotalAmount - itemDiscountAmount;
      const itemGstAmount = (itemAmountAfterDiscount * item.gstPercentage) / 100;
      const itemNetAmount = itemAmountAfterDiscount + itemGstAmount;

      totalAmount += itemTotalAmount;
      totalDiscount += itemDiscountAmount;
      totalGstAmount += itemGstAmount;
      netAmount += itemNetAmount;
    });

    setFormData(prevState => ({
      ...prevState,
      totalAmount,
      totalDiscount,
      gstAmount: totalGstAmount,
      netAmount
    }));
  };

  const validateForm = () => {
    if (!formData.email) {
      setError("User email not found. Please try logging in again.");
      return false;
    }
    
    if (!formData.customerName) {
      setError("Please enter a customer name");
      return false;
    }
    
    if (!formData.returnInvoiceNumber) {
      setError("Please enter a return invoice number");
      return false;
    }
    
    if (!formData.receiptNumber) {
      setError("Please enter a receipt number");
      return false;
    }
    
    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.itemName || !item.batch) {
        setError(`Please fill in all required fields for item #${i+1}`);
        return false;
      }
      
      if (item.quantity <= 0) {
        setError(`Quantity must be greater than 0 for item #${i+1}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Create a map of medicines with their quantities (case-insensitive)
      const medicineMap = new Map();
      saleBills.forEach(medicine => {
        const key = `${medicine.itemName.toLowerCase()}-${medicine.batch}`;
        medicineMap.set(key, {
          quantity: parseInt(medicine.quantity) || 0,
          itemName: medicine.itemName,
          batch: medicine.batch
        });
      });

      // Validate each item's returnable quantity
      for (const item of formData.items) {
        const key = `${item.itemName.toLowerCase()}-${item.batch}`;
        const medicineData = medicineMap.get(key);

        if (!medicineData) {
          setError(`Item ${item.itemName} (Batch: ${item.batch}) was not sold to this customer`);
          setLoading(false);
          return;
        }

        if (item.quantity > medicineData.quantity) {
          setError(`Cannot return ${item.quantity} units of ${item.itemName} (Batch: ${item.batch}). Maximum returnable quantity is ${medicineData.quantity}`);
          setLoading(false);
          return;
        }
      }

      // If all validations pass, submit the form
      const response = await axiosInstance.post('/api/bills/return', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setSuccess('Sale return bill created successfully!');
        
        // Update saleBills to reflect the returned quantities
        const updatedSaleBills = saleBills.map(medicine => {
          const returnedItem = formData.items.find(item => 
            item.itemName.toLowerCase() === medicine.itemName.toLowerCase() &&
            item.batch === medicine.batch
          );
          
          if (returnedItem) {
            return {
              ...medicine,
              quantity: medicine.quantity - returnedItem.quantity
            };
          }
          return medicine;
        });
        
        setSaleBills(updatedSaleBills);
        
        // Reset form but keep email and customer
        setFormData(prevState => ({
          ...prevState,
          returnInvoiceNumber: '',
          receiptNumber: '',
          items: [
            {
              itemName: '',
              batch: '',
              quantity: 0,
              discount: 0,
              amount: 0,
              availableQuantity: 0,
              purchaseRate: 0,
              gstPercentage: 0,
              gstAmount: 0,
              returnableQuantity: 0,
              availableBatches: []
            }
          ],
          totalAmount: 0,
          totalDiscount: 0,
          gstAmount: 0,
          netAmount: 0
        }));
      } else {
        setError('Error creating sale return bill: ' + (response.data?.message || 'Unknown error'));
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          window.location.href = '/login';
        }, 3000);
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error creating sale return bill: ' + (err.message || 'Check your network connection'));
      }
      console.error('Submit error:', err);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    
    // Add header with gradient background
    doc.setFillColor(41, 128, 185); // Blue color
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Sale Return Bill', 105, 20, { align: 'center' });
    
    // Add invoice details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Return Invoice Number: ${formData.returnInvoiceNumber}`, 20, 50);
    doc.text(`Date: ${formData.date}`, 20, 60);
    doc.text(`Customer Name: ${formData.customerName}`, 20, 70);
    doc.text(`Receipt Number: ${formData.receiptNumber}`, 20, 80);
    
    // Add items table
    const tableColumn = [
      'Item Name',
      'Batch',
      'Quantity',
      'Purchase Rate',
      'Discount %',
      'GST %',
      'Amount'
    ];
    
    const tableRows = formData.items.map(item => [
      item.itemName,
      item.batch,
      item.quantity,
      `₹${item.purchaseRate}`,
      `${item.discount}%`,
      `${item.gstPercentage}%`,
      `₹${item.amount}`
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Add summary
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('Bill Summary', 20, finalY);
    
    doc.setFontSize(10);
    doc.text(`Total Amount: ₹${formData.totalAmount.toFixed(2)}`, 20, finalY + 10);
    doc.text(`Total Discount: ₹${formData.totalDiscount.toFixed(2)}`, 20, finalY + 20);
    doc.text(`GST Amount: ₹${formData.gstAmount.toFixed(2)}`, 20, finalY + 30);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Net Amount: ₹${formData.netAmount.toFixed(2)}`, 20, finalY + 45);
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`SaleReturn_${formData.returnInvoiceNumber}.pdf`);
  };

  // Render a message if not authenticated
  if (!formData.email) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Authentication Required</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error || "You must be logged in to access this page. Redirecting to login..."}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Sale Return Form</h1>
            <p className="text-blue-100 text-sm mt-1">Process customer returns and refunds</p>
          </div>
          
          <div className="p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Return Invoice Number</label>
                  <input
                    type="text"
                    name="returnInvoiceNumber"
                    value={formData.returnInvoiceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter return invoice no."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter receipt no."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                </div>

                {showLoadBillButton && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleLoadBill}
                      disabled={fetchingBills}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                      {fetchingBills ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        'Load Bill'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Return Items</h2>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Item
                  </button>
                </div>
                
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Returnable Qty</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Rate</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Return Qty</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Discount %</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              name="itemName"
                              value={item.itemName}
                              onChange={(e) => handleItemNameChange(index, e)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter medicine name"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              name="batch"
                              value={item.batch}
                              onChange={(e) => handleBatchChange(index, e)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select Batch</option>
                              {item.availableBatches && item.availableBatches.map((batch, batchIndex) => (
                                <option key={batchIndex} value={batch.batch}>
                                  {batch.batch} (Available: {batch.quantity})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              name="availableQuantity"
                              value={item.availableQuantity}
                              readOnly
                              className="w-20 px-2 py-1 text-sm text-center bg-gray-50 border border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              name="returnableQuantity"
                              value={item.returnableQuantity}
                              readOnly
                              className="w-20 px-2 py-1 text-sm text-center bg-gray-50 border border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">₹</span>
                              <input
                                type="number"
                                name="purchaseRate"
                                value={item.purchaseRate}
                                onChange={(e) => handleItemChange(index, e)}
                                step="0.01"
                                min="0"
                                className="w-24 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, e)}
                              min="1"
                              max={item.returnableQuantity}
                              className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center">
                              <input
                                type="number"
                                name="discount"
                                value={item.discount}
                                onChange={(e) => handleItemChange(index, e)}
                                step="0.01"
                                min="0"
                                max="100"
                                className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                              <span className="text-gray-500 ml-1">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center">
                              <input
                                type="number"
                                name="gstPercentage"
                                value={item.gstPercentage}
                                onChange={(e) => handleItemChange(index, e)}
                                step="0.01"
                                min="0"
                                max="100"
                                className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                              <span className="text-gray-500 ml-1">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">₹</span>
                              <input
                                type="number"
                                name="amount"
                                value={item.amount}
                                readOnly
                                className="w-24 px-2 py-1 text-sm text-center bg-gray-50 border border-gray-300 rounded-md"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400"
                              disabled={formData.items.length === 1}
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Summary</h3>
                <div className="max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm text-gray-700">Total Amount:</div>
                    <div className="text-sm font-medium text-right">₹{formData.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-700">Total Discount:</div>
                    <div className="text-sm font-medium text-right text-red-600">- ₹{formData.totalDiscount.toFixed(2)}</div>
                    
                    <div className="text-sm text-gray-700">GST (18%):</div>
                    <div className="text-sm font-medium text-right">₹{formData.gstAmount.toFixed(2)}</div>
                    
                    <div className="pt-2 border-t border-gray-200 text-base font-medium text-gray-900">Net Refund Amount:</div>
                    <div className="pt-2 border-t border-gray-200 text-base font-bold text-right text-blue-700">₹{formData.netAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      returnInvoiceNumber: '',
                      receiptNumber: '',
                      items: [
                        {
                          itemName: '',
                          batch: '',
                          quantity: 0,
                          discount: 0,
                          amount: 0,
                          availableQuantity: 0,
                          purchaseRate: 0,
                          gstPercentage: 0,
                          gstAmount: 0,
                          returnableQuantity: 0,
                          availableBatches: []
                        }
                      ],
                      totalAmount: 0,
                      totalDiscount: 0,
                      gstAmount: 0,
                      netAmount: 0
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print PDF
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={loading || !formData.email}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Create Sale Return Bill'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleReturnForm;