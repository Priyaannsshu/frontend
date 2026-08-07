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

const SupplierExpiryBillGenerator = () => {
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    partyName: '',
    startDate: '',
    endDate: new Date().toISOString().split('T')[0], // Today's date by default
    items: [],
    email: ''
  });

  // UI state
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [availableParties, setAvailableParties] = useState([]);
  const [expiryItems, setExpiryItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('email');
    
    if (token && userEmail) {
      console.log('Loading data for email:', userEmail);
      setIsAuthenticated(true);
      setFormData(prev => ({ ...prev, email: userEmail }));
      fetchSuppliers(userEmail);
    } else {
      navigate('/login', { state: { from: window.location.pathname } });
    }
  }, [navigate]);

  // Fetch suppliers from inventory when component mounts
  const fetchSuppliers = async (email) => {
    try {
      setIsLoading(true);
      console.log(`Fetching suppliers for email: ${email}`);
      
      const response = await axiosInstance.get(`${API_BASE_URL}/api/inventory`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Inventory API Response:', response.data);
      
      // Extract unique supplier names
      const uniqueSuppliers = [...new Set(response.data.map(item => item.partyName).filter(Boolean))];
      console.log('Unique suppliers found:', uniqueSuppliers);
      
      setAvailableParties(uniqueSuppliers.map(name => ({ name })));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      setError('Failed to fetch suppliers. Please try again.');
      setIsLoading(false);
    }
  };

  // Fetch expiry items by party and date range
  const fetchExpiryItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Create URL with explicitly encoded parameters to avoid parameter problems
      const partyName = encodeURIComponent(formData.partyName);
      const email = encodeURIComponent(formData.email);
      const startDate = encodeURIComponent(formData.startDate);
      const endDate = encodeURIComponent(formData.endDate);
      
      const url = `${API_BASE_URL}/api/expiry-bills/party-expiry?partyName=${partyName}&email=${email}&startDate=${startDate}&endDate=${endDate}`;
      
      console.log('Requesting URL:', url);
      
      const response = await axiosInstance.get(url);
      
      console.log('Expiry items response:', response.data);
      
      if (response.data.success && response.data.data.length > 0) {
        // Filter out items with quantity 0 or less
        const filteredItems = response.data.data
          .filter(item => item.quantity > 0)
          .map(item => ({
            ...item,
            returnQuantity: item.quantity, // Set initial return quantity equal to available quantity
            isSelected: true // Select all items by default
          }));
        
        console.log('Filtered items:', filteredItems.length);
        
        if (filteredItems.length === 0) {
          setExpiryItems([]);
          setSelectedItems([]);
          setError('No items with quantity greater than zero found for the selected party and date range.');
        } else {
          setExpiryItems(filteredItems);
          setSelectedItems(filteredItems.map(item => item._id));
          calculateSummary(filteredItems);
        }
      } else {
        setExpiryItems([]);
        setSelectedItems([]);
        
        // Show more specific error message for user troubleshooting
        if (response.data.success) {
          const today = new Date();
          const selectedStartDate = new Date(formData.startDate);
          const selectedEndDate = new Date(formData.endDate);
          
          if (selectedStartDate > today) {
            setError('Start date is in the future. Try selecting a past or current date.');
          } else if (selectedEndDate < selectedStartDate) {
            setError('End date must be after or equal to start date.');
          } else {
            setError(`No expiring items found for supplier "${formData.partyName}" in the selected date range. 
                     Check that the supplier has items with expiry dates between ${formData.startDate} and ${formData.endDate}.`);
      }
        } else {
          setError(response.data.message || 'No expiring items found for the selected party and date range.');
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching expiry items:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      setError(error.response?.data?.message || 'Failed to fetch expiring items. Please try again.');
      setIsLoading(false);
    }
  };

  // Calculate summary totals
  const calculateSummary = (items = null) => {
    const itemsToCalculate = items || expiryItems.filter(item => selectedItems.includes(item._id));
    
    const totalItems = itemsToCalculate.length;
    const totalQuantity = itemsToCalculate.reduce((sum, item) => sum + (parseInt(item.returnQuantity) || 0), 0);
    const totalValue = itemsToCalculate.reduce((sum, item) => sum + ((parseInt(item.returnQuantity) || 0) * item.purchaseRate), 0);
    
    setSummary({ totalItems, totalQuantity, totalValue });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle item selection/deselection
  const handleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Handle expired quantity change
  const handleQuantityChange = (itemId, value) => {
    const updatedItems = expiryItems.map(item => {
      if (item._id === itemId) {
        const newQuantity = parseInt(value) || 0;
        // Ensure quantity doesn't exceed available quantity
        const validQuantity = Math.min(newQuantity, item.quantity);
        return { ...item, returnQuantity: validQuantity };
      }
      return item;
    });
    
    setExpiryItems(updatedItems);
    calculateSummary(updatedItems.filter(item => selectedItems.includes(item._id)));
  };

  // Handle step navigation
  const nextStep = () => {
    if (step === 1) {
      if (!formData.partyName || !formData.startDate || !formData.endDate) {
        setError('Please select a party name, start date, and end date.');
        return;
      }
      
      // Validate that end date is after or equal to start date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Check for invalid dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Please enter valid date values in YYYY-MM-DD format.');
        return;
      }
      
      if (endDate < startDate) {
        setError('End date must be after or equal to start date.');
        return;
      }
      
      // Add one day to include the end date in the range (end of day)
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        adjustedEndDate: adjustedEndDate.toISOString().split('T')[0]
      }));
      
      fetchExpiryItems();
    } else if (step === 2) {
      if (selectedItems.length === 0) {
        setError('Please select at least one item.');
        return;
      }
    }
    
    setError('');
    setStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prevStep => prevStep - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const selectedExpiryItems = expiryItems
        .filter(item => selectedItems.includes(item._id))
        .map(item => ({
          _id: item._id,
          itemName: item.itemName,
          batch: item.batch,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          returnQuantity: item.returnQuantity,
          mrp: item.mrp,
          purchaseRate: item.purchaseRate,
          gstPercentage: item.gstPercentage || 0
        }));
      
      const payload = {
        partyName: formData.partyName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        items: selectedExpiryItems,
        email: formData.email
      };
      
      console.log('Submitting supplier expiry return with payload:', payload);
      
      const response = await axiosInstance.post(`${API_BASE_URL}/api/expiry-bills/supplier`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Generate and download PDF
        generatePDF(response.data.data);
        
        setSuccess('Supplier expiry return bill created successfully!');
        // Reset form after successful submission
        setFormData({
          partyName: '',
          startDate: '',
          endDate: new Date().toISOString().split('T')[0],
          items: [],
          email: formData.email
        });
        setExpiryItems([]);
        setSelectedItems([]);
        setStep(1);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating supplier expiry return:', error);
      setError(error.response?.data?.message || 'Failed to create supplier expiry return. Please try again.');
      setIsLoading(false);
    }
  };

  // Generate PDF function
  const generatePDF = (billData) => {
    try {
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Supplier Expiry Return - ${billData.expiryBillNumber}`,
        subject: 'Supplier Expiry Return Bill',
        author: 'Medicine Inventory Management System',
        creator: 'Medicine Inventory Management System'
      });
      
      // Add heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(63, 81, 181); // Indigo color
      doc.text('SUPPLIER EXPIRY RETURN BILL', 105, 20, { align: 'center' });
      
      // Add bill number
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Bill Number: ${billData.expiryBillNumber}`, 20, 30);

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
      
      // Add party details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Party Details:', 120, 50);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Name: ${billData.partyName}`, 120, 56);
      
      // Date Range with clear separation of start and end dates
      doc.text('Date Range:', 120, 61);
      doc.text(`Start: ${new Date(billData.startDate).toLocaleDateString()}`, 120, 66);
      doc.setTextColor(0, 100, 0); // Green color for end date
      doc.text(`End: ${new Date(billData.endDate).toLocaleDateString()}`, 120, 71);
      
      // Add item table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Item Details:', 20, 85);
      
      const tableColumn = [
        'Sr. No.', 
        'Item Name', 
        'Batch', 
        'Expiry Date', 
        'Qty', 
        'Purchase Rate', 
        'Value'
      ];
      
      const tableRows = billData.items.map((item, index) => [
        index + 1,
        item.itemName,
        item.batch,
        new Date(item.expiryDate).toLocaleDateString(),
        item.returnQuantity,
        `₹${item.purchaseRate.toFixed(2)}`,
        `₹${(item.returnQuantity * item.purchaseRate).toFixed(2)}`
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
      
      // Add footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer-generated document. No signature is required.', 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`SupplierExpiryReturn_${billData.expiryBillNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error generating PDF. Please try again.');
    }
  };

  // Render step 1: Party and date selection
  const renderStepOne = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-indigo-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3">1</span>
        Select Party and Date Range
      </h2>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
          <div className="flex items-center text-blue-700">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <p className="text-sm">
              Search for items with expiry dates in the selected range. Expiry items may come from inventory or purchase bills.
            </p>
          </div>
              </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label htmlFor="partyName" className="block text-sm font-semibold text-gray-700 mb-2">
              Party Name (Supplier) *
              </label>
            <div className="relative">
              <input
                type="text"
                id="partyName"
                name="partyName"
                value={formData.partyName}
                onChange={handleInputChange}
                className="w-full p-4 text-lg border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Enter party name"
                list="partyNamesList"
                required
              />
              <datalist id="partyNamesList">
                {availableParties.map((party, index) => (
                  <option key={index} value={party.name} />
                ))}
              </datalist>
            </div>
            {availableParties.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {availableParties.length} suppliers found. Type or select from the list.
              </p>
            )}
            </div>
            
          <div className="col-span-1">
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date (Expiry Range) *
              </label>
              <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full p-4 text-lg border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Select the earliest expiry date you want to search for
              </p>
            </div>
            
          <div className="col-span-1">
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
              End Date (Expiry Range) *
            </label>
            <div className="relative">
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full p-4 text-lg border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-indigo-600">Choose the latest expiry date to include in your search</p>
          </div>
            </div>
            
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={nextStep}
            disabled={isLoading}
            className="px-8 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                Search for Expiry Items
                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
          </div>
        </div>
      </div>
    );

  // Render step 2: Item selection
  const renderStepTwo = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-indigo-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3">2</span>
        Select Expiring Items
      </h2>
      
      {expiryItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600">No expiring items found for the selected criteria.</p>
          <button
            onClick={prevStep}
            className="mt-6 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow"
          >
            Go Back
          </button>
        </div>
      ) : (
        <>
          <div className="bg-indigo-50 p-4 mb-6 rounded-lg border border-indigo-100">
            <div className="flex items-center text-indigo-700">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <div>
                <p className="text-sm">Select items to include in the return bill and adjust quantities if needed.</p>
                <p className="text-sm mt-1 font-medium">Note: The available quantities shown reflect current inventory levels after sales and returns.</p>
              </div>
                  </div>
                </div>
          
          <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Select
                              </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Item Name
                              </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Batch
                              </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Expiry Date
                              </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Available Qty
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Return Qty
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Purchase Rate
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    MRP
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                {expiryItems.map((item) => (
                  <tr key={item._id} className={`${selectedItems.includes(item._id) ? 'bg-indigo-50' : ''} hover:bg-gray-50 transition-colors duration-150`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleItemSelection(item._id)}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {item.batch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.returnQuantity}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        min="1"
                        max={item.quantity}
                        disabled={!selectedItems.includes(item._id)}
                        className="w-24 p-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                                </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      ₹{item.purchaseRate}
                                </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      ₹{item.mrp}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <button
              type="button"
              onClick={prevStep}
              className="w-full sm:w-auto px-6 py-3 border-2 border-indigo-300 rounded-lg shadow-sm text-base font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <span className="flex items-center justify-center">
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </span>
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={selectedItems.length === 0 || isLoading}
              className="w-full sm:w-auto px-8 py-3 text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              <span className="flex items-center justify-center">
                Next
                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
                      </div>
        </>
                    )}
                  </div>
  );

  // Render step 3: Confirmation
  const renderStepThree = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-indigo-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 p-2 rounded-full mr-3">3</span>
        Confirm and Submit
      </h2>
      
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-8 shadow-inner">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 mr-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-indigo-700">{summary.totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Quantity</p>
                <p className="text-2xl font-bold text-purple-700">{summary.totalQuantity}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-indigo-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                </div>
                <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-green-700">₹{summary.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Return Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Party Name</p>
            <p className="text-lg font-bold text-gray-900">{formData.partyName}</p>
                        </div>
                        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Date Range</p>
            <div className="flex flex-col">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-gray-500 w-24">Start Date:</span>
                <span className="text-lg font-bold text-gray-900">{new Date(formData.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">End Date:</span>
                <span className="text-lg font-bold text-indigo-700">{new Date(formData.endDate).toLocaleDateString()}</span>
              </div>
            </div>
                        </div>
                      </div>
                    </div>
                    
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Selected Items</h3>
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Qty</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
              {expiryItems
                .filter(item => selectedItems.includes(item._id))
                .map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.returnQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">₹{item.purchaseRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-700">₹{(item.returnQuantity * item.purchaseRate).toFixed(2)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-6 py-3 border-2 border-indigo-300 rounded-lg shadow-sm text-base font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <span className="flex items-center justify-center">
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto px-8 py-4 text-base bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Supplier Expiry Return
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // If not authenticated, show loading or redirect
  if (!isAuthenticated) {
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
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Supplier Expiry Return</h1>
          <p className="mt-2 text-lg text-gray-600">Create a return bill for expired items to supplier</p>
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
        
        <div className="mb-8">
          <nav className="flex justify-center">
            <ol className="flex items-center">
              <li className="flex items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                  1
            </div>
                <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>Party & Date</span>
              </li>
              
              <li className="flex items-center">
                <div className={`h-0.5 w-12 mx-2 ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
              </li>
              
              <li className="flex items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                  2
            </div>
                <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>Select Items</span>
              </li>
              
              <li className="flex items-center">
                <div className={`h-0.5 w-12 mx-2 ${step >= 3 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
              </li>
              
              <li className="flex items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 3 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                  3
          </div>
                <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>Confirm</span>
              </li>
            </ol>
          </nav>
        </div>
        
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
      </div>
    </div>
  );
};

export default SupplierExpiryBillGenerator;