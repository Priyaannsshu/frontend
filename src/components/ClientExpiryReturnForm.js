import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axiosInstance from '../utils/axios';

import API_BASE_URL from '../config/api';

// Set up axios auth interceptor
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Handle authentication errors globally
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired: Redirecting to login');
      localStorage.removeItem('token');
      // Use window.location instead of useNavigate() in interceptors
      // as useNavigate() is a hook that can only be used inside components
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const ClientExpiryReturnForm = () => {
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    partyName: '',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    email: '',
    notes: ''
  });

  // State for selected item
  const [selectedItem, setSelectedItem] = useState({
    itemName: '',
    batch: '',
    soldQuantity: 0,
    returnQuantity: 0,
    originalSaleInvoiceNumber: '',
    expiryDate: '',
    mrp: 0,
    purchaseRate: 0
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [medicinesList, setMedicinesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('email');
    
    if (token && userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    } else {
      navigate('/login', { state: { from: window.location.pathname } });
    }
  }, [navigate]);

  // Calculate total value whenever returnItems changes
  useEffect(() => {
    const total = returnItems.reduce((sum, item) => sum + (item.returnQuantity * item.mrp), 0);
    setTotalValue(total);
  }, [returnItems]);

  // Fetch medicines sold to selected client
  const fetchClientMedicines = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!formData.partyName) {
        setError('Please enter a client name first.');
        setIsLoading(false);
        return;
      }
      
      // Create URL with explicitly encoded parameters to avoid parameter problems
      const partyName = encodeURIComponent(formData.partyName);
      const email = encodeURIComponent(formData.email);
      const startDate = encodeURIComponent(formData.date);
      const endDate = encodeURIComponent(formData.endDate);
      
      const url = `${API_BASE_URL}/api/expiry-bills/client-purchase-history?partyName=${partyName}&email=${email}&startDate=${startDate}&endDate=${endDate}`;
      
      console.log('Requesting URL:', url);
      
      const response = await axios.get(url);
      
      if (response.data.success && response.data.data.length > 0) {
        // Extract unique medicine names
        const medicines = [...new Set(response.data.data.map(item => item.itemName))];
        setMedicinesList(medicines);
      } else {
        setMedicinesList([]);
        setError('No purchase history found for this client.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setError('Failed to fetch medicines. Please try again.');
      setIsLoading(false);
    }
  };

  // Fetch batches for selected medicine
  const fetchMedicineBatches = async (medicineName) => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!medicineName) {
        setBatchesList([]);
        setIsLoading(false);
        return;
      }
      
      // Create URL with explicitly encoded parameters
      const partyName = encodeURIComponent(formData.partyName);
      const email = encodeURIComponent(formData.email);
      const itemNameEncoded = encodeURIComponent(medicineName);
      const startDate = encodeURIComponent(formData.date);
      const endDate = encodeURIComponent(formData.endDate);
      
      const url = `${API_BASE_URL}/api/expiry-bills/client-purchase-history?partyName=${partyName}&email=${email}&itemName=${itemNameEncoded}&startDate=${startDate}&endDate=${endDate}`;
      
      console.log('Requesting medicine batches URL:', url);
      
      const response = await axios.get(url);
      
      if (response.data.success && response.data.data.length > 0) {
        setBatchesList(response.data.data);
      } else {
        setBatchesList([]);
        setError('No batches found for this medicine.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // When party name changes, fetch medicines
    if (name === 'partyName' && value.trim().length > 2) {
      setMedicinesList([]);
      setBatchesList([]);
      setSelectedItem({
        itemName: '',
        batch: '',
        soldQuantity: 0,
        returnQuantity: 0,
        originalSaleInvoiceNumber: '',
        expiryDate: '',
        mrp: 0,
        purchaseRate: 0
      });
      
      // Only fetch if there's a valid party name (at least 3 characters)
      setTimeout(() => fetchClientMedicines(), 500);
    }
    
    // When date fields change and party name exists, refresh medicine list
    if ((name === 'date' || name === 'endDate') && formData.partyName.trim().length > 2) {
      setMedicinesList([]);
      setBatchesList([]);
      // Clear the selected item too since the available medicines may change
      setSelectedItem({
        itemName: '',
        batch: '',
        soldQuantity: 0,
        returnQuantity: 0,
        originalSaleInvoiceNumber: '',
        expiryDate: '',
        mrp: 0,
        purchaseRate: 0
      });
      
      // Fetch updated medicine list with new date range
      setTimeout(() => fetchClientMedicines(), 500);
    }
  };

  // Handle medicine selection
  const handleMedicineChange = (e) => {
    const medicineName = e.target.value;
    
    setSelectedItem({
      ...selectedItem,
      itemName: medicineName,
      batch: ''
    });
    
    fetchMedicineBatches(medicineName);
  };

  // Handle batch selection
  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const selectedBatch = batchesList.find(batch => batch.batch === batchId);
    
    if (selectedBatch) {
      setSelectedItem({
        itemName: selectedBatch.itemName,
        batch: selectedBatch.batch,
        soldQuantity: selectedBatch.quantity,
        returnQuantity: selectedBatch.quantity, // Default to full quantity
        originalSaleInvoiceNumber: selectedBatch.saleInvoiceNumber,
        expiryDate: new Date(selectedBatch.expiryDate).toISOString().split('T')[0],
        mrp: selectedBatch.mrp,
        purchaseRate: selectedBatch.mrp // Assuming purchase rate is same as MRP
      });
    }
  };

  // Handle return quantity change
  const handleQuantityChange = (e) => {
    const newQuantity = Math.min(
      Math.max(1, parseInt(e.target.value) || 0), 
      selectedItem.soldQuantity
    );
    
    setSelectedItem({
      ...selectedItem,
      returnQuantity: newQuantity
    });
  };

  // Add item to return list
  const addItemToReturn = () => {
    if (!selectedItem.itemName || !selectedItem.batch || selectedItem.returnQuantity <= 0) {
      setError('Please select a medicine, batch, and enter a valid return quantity.');
      return;
    }
    
    // Check if this batch is already in the return list
    const existingItemIndex = returnItems.findIndex(
      item => item.itemName === selectedItem.itemName && item.batch === selectedItem.batch
    );
    
    if (existingItemIndex !== -1) {
      setError('This item is already added to the return list.');
      return;
    }
    
    // Calculate value
    const itemValue = selectedItem.returnQuantity * selectedItem.mrp;
    
    // Add to return items list
    setReturnItems([
      ...returnItems,
      {
        ...selectedItem,
        value: itemValue
      }
    ]);
    
    // Reset selected item
    setSelectedItem({
      itemName: '',
      batch: '',
      soldQuantity: 0,
      returnQuantity: 0,
      originalSaleInvoiceNumber: '',
      expiryDate: '',
      mrp: 0,
      purchaseRate: 0
    });
    
    // Clear any errors
    setError('');
  };

  // Remove item from return list
  const removeItem = (index) => {
    const updatedItems = [...returnItems];
    updatedItems.splice(index, 1);
    setReturnItems(updatedItems);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (returnItems.length === 0) {
      setError('Please add at least one item to return.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Prepare the payload
      const payload = {
        partyName: formData.partyName,
        date: formData.date,
        endDate: formData.endDate,
        items: returnItems.map(item => ({
          itemName: item.itemName,
          batch: item.batch,
          expiryDate: item.expiryDate,
          originalSaleInvoiceNumber: item.originalSaleInvoiceNumber,
          soldQuantity: item.soldQuantity,
          returnQuantity: item.returnQuantity,
          mrp: item.mrp,
          purchaseRate: item.purchaseRate
        })),
        email: formData.email,
        notes: formData.notes
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/expiry-bills/client`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Generate and download PDF
        generatePDF(response.data.data);
        
        setSuccess('Client expiry return created successfully!');
        // Reset form
        setFormData({
          partyName: '',
          date: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          email: formData.email,
          notes: ''
        });
        setMedicinesList([]);
        setBatchesList([]);
        setReturnItems([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating client expiry return:', error);
      setError(error.response?.data?.message || 'Failed to create client expiry return. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Generate PDF function
  const generatePDF = (billData) => {
    try {
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Client Expiry Return - ${billData.returnBillNumber}`,
        subject: 'Client Expiry Return Bill',
        author: 'Medicine Inventory Management System',
        creator: 'Medicine Inventory Management System'
      });
      
      // Add heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(63, 81, 181); // Indigo color
      doc.text('CLIENT EXPIRY RETURN BILL', 105, 20, { align: 'center' });
      
      // Add bill number
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Bill Number: ${billData.returnBillNumber}`, 20, 30);
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      doc.text(`Date: ${currentDate}`, 20, 36);
      
      // Add company details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Medicine Inventory Management', 20, 50);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Your Address Line 1', 20, 56);
      doc.text('Your Address Line 2', 20, 61);
      doc.text('Phone: +91 XXXXXXXXXX', 20, 66);
      doc.text('Email: contact@example.com', 20, 71);
      
      // Add client details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Client Details:', 120, 50);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Name: ${billData.partyName}`, 120, 56);
      doc.text(`Start Date: ${new Date(billData.date).toLocaleDateString()}`, 120, 61);
      doc.text(`End Date: ${new Date(billData.endDate).toLocaleDateString()}`, 120, 66);
      
      // Add item table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Returned Items:', 20, 85);
      
      const tableColumn = [
        'Sr. No.', 
        'Item Name', 
        'Batch', 
        'Expiry Date', 
        'Original Sale', 
        'Return Qty', 
        'MRP', 
        'Value'
      ];
      
      const tableRows = billData.items.map((item, index) => [
        index + 1,
        item.itemName,
        item.batch,
        new Date(item.expiryDate).toLocaleDateString(),
        item.originalSaleInvoiceNumber,
        item.returnQuantity,
        `₹${item.mrp}`,
        `₹${(item.returnQuantity * item.mrp).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [63, 81, 181], 
          textColor: 255,
          fontStyle: 'bold' 
        },
        alternateRowStyles: { 
          fillColor: [240, 240, 250] 
        },
        margin: { top: 20 }
      });
      
      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Items: ${billData.totalItems}`, 130, finalY);
      doc.text(`Total Quantity: ${billData.totalQuantity}`, 130, finalY + 6);
      doc.text(`Total Value: ₹${billData.totalValue.toFixed(2)}`, 130, finalY + 12);
      
      // Add notes if any
      if (billData.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, finalY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(billData.notes, 20, finalY + 16);
      }
      
      // Add footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer-generated document. No signature is required.', 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`ClientExpiryReturn_${billData.returnBillNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error generating PDF. Please try again.');
    }
  };

  // If not authenticated, show loading or redirect
  if (!localStorage.getItem('token')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Client Expiry Return</h1>
          <p className="mt-2 text-lg text-gray-600">Create a return bill for expired items from clients</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-8">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Client and Date Selection */}
              <div>
                <label htmlFor="partyName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  id="partyName"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter client name"
                  required
                />
                {medicinesList.length > 0 && (
                  <p className="mt-1 text-xs text-green-600">Found medicines sold to this client</p>
                )}
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Medicine Selection and Details */}
            <div className="bg-indigo-50 p-5 rounded-lg mb-6 border border-indigo-100">
              <h3 className="text-lg font-semibold text-indigo-700 mb-4">Select Medicine and Batch</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Medicine Name */}
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name *
                  </label>
                  <select
                    id="itemName"
                    value={selectedItem.itemName}
                    onChange={handleMedicineChange}
                    className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    disabled={!formData.partyName || medicinesList.length === 0}
                  >
                    <option value="">Select Medicine</option>
                    {medicinesList.map((medicine, index) => (
                      <option key={index} value={medicine}>{medicine}</option>
                    ))}
                  </select>
                </div>
                
                {/* Batch Selection */}
                <div>
                  <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                    Batch *
                  </label>
                  <select
                    id="batch"
                    value={selectedItem.batch}
                    onChange={handleBatchChange}
                    className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    disabled={!selectedItem.itemName || batchesList.length === 0}
                  >
                    <option value="">Select Batch</option>
                    {batchesList.map((batch, index) => (
                      <option key={index} value={batch.batch}>
                        {batch.batch} (Exp: {new Date(batch.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Return Quantity */}
                <div>
                  <label htmlFor="returnQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Return Quantity *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="returnQuantity"
                      value={selectedItem.returnQuantity || ''}
                      onChange={handleQuantityChange}
                      min="1"
                      max={selectedItem.soldQuantity}
                      className="w-full p-3 text-md border-2 border-indigo-200 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      disabled={!selectedItem.batch}
                    />
                    <span className="inline-flex items-center px-3 bg-gray-200 text-gray-600 border-2 border-l-0 border-indigo-200 rounded-r-lg">
                      / {selectedItem.soldQuantity}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedItem.batch && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={selectedItem.expiryDate}
                      className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  
                  {/* MRP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP
                    </label>
                    <input
                      type="text"
                      value={`₹${selectedItem.mrp}`}
                      className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  
                  {/* Original Invoice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Invoice
                    </label>
                    <input
                      type="text"
                      value={selectedItem.originalSaleInvoiceNumber}
                      className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addItemToReturn}
                  disabled={!selectedItem.batch || selectedItem.returnQuantity <= 0}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add Item to Return
                </button>
              </div>
            </div>
            
            {/* Return Items List */}
            {returnItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Return Items</h3>
                <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{item.batch}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{item.returnQuantity}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">₹{item.mrp}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-indigo-700">
                            ₹{(item.returnQuantity * item.mrp).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="5" className="px-3 py-3 text-sm font-bold text-gray-700 text-right">
                          Total Value:
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-indigo-700">
                          ₹{totalValue.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            
            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full p-3 text-md border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Any additional notes about this return"
              ></textarea>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={returnItems.length === 0 || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Create Client Expiry Return
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientExpiryReturnForm; 