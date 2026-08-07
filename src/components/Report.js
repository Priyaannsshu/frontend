import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axiosInstance from '../utils/axios';

function MedicineSalesSummary() {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableParties, setAvailableParties] = useState([]);
  
  // Refs for debouncing
  const suggestionTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Memoize the fetch function
  const fetchSalesData = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Fetching sales data with params:', params);
      console.log('Token present:', !!token);
      
      const response = await axiosInstance.get('/api/bills/medicine-sales', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.salesDetails) {
        // Extract unique parties from the response data for dropdown
        const uniqueParties = [...new Set(response.data.salesDetails.map(sale => sale.partyName))];
        setAvailableParties(uniqueParties);
        setSalesData(response.data);
        setError(null);
      } else {
        console.log('No sales data in response:', response.data);
        setError('No sales records found for the selected criteria');
        setSalesData(null);
      }
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError('Please log in to view sales data');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('No sales records found for the selected criteria');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch sales data. Please try again.');
      }
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle input changes for suggestions only
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMedicineName(value);
    
    // Clear existing timeouts for suggestions
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Update suggestions with debounce
    suggestionTimeoutRef.current = setTimeout(() => {
      if (value.length > 0) {
        const filtered = availableMedicines.filter(medicine =>
          medicine.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Build search parameters
  const buildSearchParams = () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
      return null;
    }

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const params = {
      email,
      startDate: formatDate(startDate) || formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1))),
      endDate: formatDate(endDate) || formatDate(new Date())
    };

    if (medicineName.trim()) {
      params.medicineName = medicineName.trim();
    }

    // Fix: Properly add partyName to params if it exists
    if (partyName && partyName.trim() !== '') {
      params.partyName = partyName.trim();
    }

    return params;
  };

  // Handle search button click
  const handleSearch = () => {
    if (!medicineName.trim()) {
      setError('Please enter a medicine name');
      return;
    }

    const params = buildSearchParams();
    if (!params) return;
    
    fetchSalesData(params);
  };

  // Handle filter button click (for party and date filters)
  const handleFilterSearch = () => {
    const params = buildSearchParams();
    if (!params) return;
    
    if (!params.medicineName) {
      setError('Please enter a medicine name');
      return;
    }
    
    fetchSalesData(params);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setMedicineName(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input blur with proper timing
  const handleInputBlur = () => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (medicineName.length > 0) {
      const filtered = availableMedicines.filter(medicine =>
        medicine.toLowerCase().includes(medicineName.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setMedicineName('');
    setPartyName('');
    setStartDate('');
    setEndDate('');
    setSalesData(null);
    setError(null);
  };

  // Generate and download PDF
  const handleDownloadPDF = () => {
    if (!salesData || !salesData.salesDetails || salesData.salesDetails.length === 0) {
      setError('No data available to download');
      return;
    }

    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Medicine Sales Report - ${medicineName}`,
      subject: 'Medicine Sales Summary',
      author: 'Pharmacy Management System',
      creator: 'Pharmacy App'
    });
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('Medicine Sales Summary', 105, 15, { align: 'center' });
    
    // Add medicine name
    doc.setFontSize(14);
    doc.text(`Medicine: ${medicineName}`, 14, 25);
    
    // Add date range
    const dateRange = `Date Range: ${startDate || 'All time'} to ${endDate || 'Present'}`;
    doc.text(dateRange, 14, 32);
    
    // Add filter info if applicable
    if (partyName) {
      doc.text(`Party: ${partyName}`, 14, 39);
    }
    
    // Add summary stats
    doc.setFillColor(52, 152, 219);
    doc.rect(14, 45, 182, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Sales Summary', 105, 52, { align: 'center' });
    
    const totalSales = salesData.salesDetails.reduce((sum, sale) => sum + (sale.mrp * sale.quantity - sale.discount), 0).toFixed(2);
    const totalQuantity = salesData.salesDetails.reduce((sum, sale) => sum + sale.quantity, 0);
    const avgPrice = (totalSales / totalQuantity).toFixed(2);
    
    doc.text(`Total Sales: ₹${totalSales}`, 24, 62);
    doc.text(`Total Quantity: ${totalQuantity} units`, 85, 62);
    doc.text(`Avg. Price: ₹${avgPrice}`, 150, 62);
    
    // Create table
    const tableColumn = ["Invoice #", "Date", "Party", "Qty", "MRP(₹)", "Discount(₹)", "Total(₹)"];
    const tableRows = [];
    
    salesData.salesDetails.forEach(sale => {
      const formattedDate = new Date(sale.date).toLocaleDateString();
      const total = (sale.mrp * sale.quantity - sale.discount).toFixed(2);
      const rowData = [
        sale.saleInvoiceNumber,
        formattedDate,
        sale.partyName,
        sale.quantity,
        sale.mrp,
        sale.discount,
        total
      ];
      tableRows.push(rowData);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [189, 195, 199]
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on: ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        105, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`Medicine_Sales_Report_${medicineName.replace(/\s+/g, '_')}.pdf`);
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  // Initial fetch of available medicines
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
      navigate('/login');
      return;
    }

    const fetchAvailableMedicines = async () => {
      try {
        const response = await axiosInstance.get('/api/inventory', {
          params: { email },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const medicines = response.data.map(item => item.itemName);
        setAvailableMedicines([...new Set(medicines)]);
      } catch (err) {
        console.error('Error fetching available medicines:', err);
      }
    };

    fetchAvailableMedicines();
  }, [navigate]);

  const calculateTotal = (sale) => {
    return (sale.mrp * sale.quantity - sale.discount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <div className="text-xl text-gray-700">Loading sales data...</div>
        </div>
      </div>
    );
  }

  if (error && !salesData) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-indigo-800 mb-6 border-b pb-4">Medicine Sales Summary</h1>
          
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <div className="text-gray-600 text-lg mb-4">{error}</div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                Reset Filters
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Medicine Name Search */}
          <div className="mt-8">
            <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700 mb-2">
              Try searching for a different medicine
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-grow">
          <input
                  ref={inputRef}
                  id="medicineName"
            type="text"
            value={medicineName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  placeholder="e.g., Paracetamol, Amoxicillin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition duration-150"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 shadow-md"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-indigo-800 mb-6 border-b pb-4">Medicine Sales Summary</h1>
          
          {/* Medicine Name Search */}
          <div className="mb-8">
            <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Medicine Name
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-grow">
          <input
                  ref={inputRef}
                  id="medicineName"
            type="text"
                  value={medicineName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  placeholder="e.g., Paracetamol, Amoxicillin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking suggestions
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition duration-150"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 shadow-md"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Additional Filters */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-indigo-800 mb-4">Additional Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="partyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name (Optional)
                </label>
                <select
                  id="partyName"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                >
                  <option value="">All Parties</option>
                  {availableParties.map((party, index) => (
                    <option key={index} value={party}>{party}</option>
                  ))}
                </select>
        </div>

        <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
          <input
                  id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
          />
        </div>
              
        <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
          <input
                  id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
          />
        </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 shadow-sm"
              >
                Reset Filters
              </button>
          <button
                onClick={handleFilterSearch}
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 shadow-md"
                disabled={!medicineName.trim()}
          >
                Apply Filters
          </button>
            </div>
          </div>
          
          <div className="text-gray-600 text-center py-8 border-t">
            {availableMedicines.length > 0 ? (
              <div>
                <p className="mb-3 text-indigo-700 font-medium">Popular medicines in your inventory:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableMedicines.slice(0, 5).map((medicine, index) => (
                    <span
                      key={index}
                      onClick={() => handleSuggestionClick(medicine)}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm cursor-pointer hover:bg-indigo-200 transition duration-150 shadow-sm"
                    >
                      {medicine}
                    </span>
                  ))}
                  {availableMedicines.length > 5 && (
                    <span className="text-gray-500">+{availableMedicines.length - 5} more</span>
                  )}
                </div>
              </div>
            ) : (
              <p>No medicines found in your inventory</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-indigo-800">Medicine Sales Summary</h1>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition duration-200 shadow-md flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PDF</span>
            </button>
      </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div>
              <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700 mb-2">
                Medicine Name
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <input
                    ref={inputRef}
                    id="medicineName"
                    type="text"
                    value={medicineName}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={handleInputFocus}
                    placeholder="Enter medicine name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition duration-150"
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                >
                  Search
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="partyName" className="block text-sm font-medium text-gray-700 mb-2">
                Party Name
              </label>
              <select
                id="partyName"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              >
                <option value="">All Parties</option>
                {availableParties.map((party, index) => (
                  <option key={index} value={party}>{party}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-end space-x-3 mb-8">
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 shadow-sm"
            >
              Reset Filters
            </button>
            <button
              onClick={handleFilterSearch}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 shadow-md"
            >
              Apply Filters
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm font-medium mb-2 opacity-80">Total Sales</div>
              <div className="text-3xl font-bold">
                ₹{salesData.salesDetails.reduce((sum, sale) => sum + (sale.mrp * sale.quantity - sale.discount), 0).toFixed(2)}
              </div>
              <div className="text-sm opacity-80 mt-2">Total Revenue</div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm font-medium mb-2 opacity-80">Total Quantity</div>
              <div className="text-3xl font-bold">
                {salesData.salesDetails.reduce((sum, sale) => sum + sale.quantity, 0)}
              </div>
              <div className="text-sm opacity-80 mt-2">Units Sold</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm font-medium mb-2 opacity-80">Average Price</div>
              <div className="text-3xl font-bold">
                ₹{(
                  salesData.salesDetails.reduce((sum, sale) => sum + (sale.mrp * sale.quantity - sale.discount), 0) /
                  salesData.salesDetails.reduce((sum, sale) => sum + sale.quantity, 0)
                ).toFixed(2)}
              </div>
              <div className="text-sm opacity-80 mt-2">Per Unit</div>
            </div>
            </div>
          </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Invoice Number</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Party Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">MRP</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.salesDetails.length > 0 ? (
                  salesData.salesDetails.map((sale, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'} hover:bg-indigo-100 transition duration-150`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.saleInvoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.partyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{sale.mrp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{sale.discount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{calculateTotal(sale)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No sales data found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-indigo-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {salesData.salesDetails.reduce((sum, sale) => sum + sale.quantity, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{salesData.salesDetails.reduce((sum, sale) => sum + sale.discount, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{salesData.salesDetails.reduce((sum, sale) => sum + (sale.mrp * sale.quantity - sale.discount), 0).toFixed(2)}
                  </td>
                    </tr>
              </tfoot>
              </table>
            </div>
          </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 shadow-md flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition duration-200 shadow-md flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicineSalesSummary;