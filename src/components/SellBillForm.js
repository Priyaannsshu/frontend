import React, { useState, useEffect, useCallback, useReducer } from "react";
import jsPDF from "jspdf";
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../utils/socketUtils';
import { useRef } from 'react';
import API_BASE_URL from '../config/api';

// Custom hook for managing items
const useItems = (initialGstNumber) => {
  // Initial state
  const initialState = [
    {
      itemName: "",
      batch: "",
      batchOptions: [],
      availableQuantity: 0,
      quantity: "",
      mrp: "",
      discount: "",
      amount: "",
      gstNo: initialGstNumber,
      gstPercentage: "0"
    }
  ];

  // Reducer for items state
  const itemsReducer = (state, action) => {
    switch (action.type) {
      case 'UPDATE_ITEM':
        return state.map((item, index) => 
          index === action.index ? { ...item, ...action.payload } : item
        );
      
      case 'ADD_ITEM':
        return [
          ...state,
          {
            itemName: "",
            batch: "",
            batchOptions: [],
            availableQuantity: 0,
            quantity: "",
            mrp: "",
            discount: "",
            amount: "",
            gstNo: initialGstNumber,
            gstPercentage: "0"
          }
        ];
      
      case 'RESET_ITEMS':
        return [{
          itemName: "",
          batch: "",
          batchOptions: [],
          availableQuantity: 0,
          quantity: "",
          mrp: "",
          discount: "",
          amount: "",
          gstNo: initialGstNumber,
          gstPercentage: "0"
        }];
      
      case 'UPDATE_ALL_GST':
        return state.map(item => ({
          ...item,
          gstNo: action.payload
        }));
      
      default:
        return state;
    }
  };

  const [items, dispatch] = useReducer(itemsReducer, initialState);

  // Update all items' GST number when it changes
  useEffect(() => {
    dispatch({ type: 'UPDATE_ALL_GST', payload: initialGstNumber });
  }, [initialGstNumber]);

  // Helper functions
  const updateItem = (index, payload) => {
    dispatch({ type: 'UPDATE_ITEM', index, payload });
  };

  const addItem = () => {
    dispatch({ type: 'ADD_ITEM' });
  };

  const resetItems = () => {
    dispatch({ type: 'RESET_ITEMS' });
  };

  return { items, updateItem, addItem, resetItems };
};

const SellBillForm = () => {
  const [sellDetails, setSellDetails] = useState({
    saleInvoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    partyName: "",
    email: "",
    gstNumber: "",
  });

  // Remove the lastInvoiceNumber state since we'll get it from the server
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  const socket = useSocket();
  const fetchTimeout = useRef(null);

  // Use the custom hook for items management
  const { items, updateItem, addItem, resetItems } = useItems(sellDetails.gstNumber);

  // Fetch the next invoice number when component mounts
  useEffect(() => {
    const fetchNextInvoiceNumber = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        
        console.log('Fetching next invoice number with token:', token);
        console.log('User email:', email);
        
        if (!token || !email) {
          console.error('Missing token or email in localStorage');
          setMessage('Authentication information missing. Please log in again.');
          
          // Set default invoice number if authentication fails
          setSellDetails(prev => ({
            ...prev,
            saleInvoiceNumber: "INV001",
            date: new Date().toISOString().split("T")[0],
            receiptNumber: "",
            partyName: "",
            email: "",
            gstNumber: "",
          }));
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/bills/next-invoice-number`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });
  
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
  
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch next invoice number');
        }
  
        // Update sell details with the fetched invoice number
        setSellDetails(prev => ({
          ...prev,
          saleInvoiceNumber: data.invoiceNumber || "INV001", // Fallback to INV001 if no invoice number
          date: new Date().toISOString().split("T")[0],
          receiptNumber: "",
          partyName: "",
          email: "",
          gstNumber: "",
        }));
        
      } catch (error) {
        console.error('Error fetching next invoice number:', error);
        setMessage(error.message);
        
        // Set default invoice number in case of any error
        setSellDetails(prev => ({
          ...prev,
          saleInvoiceNumber: "INV001",
          date: new Date().toISOString().split("T")[0],
          receiptNumber: "",
          partyName: "",
          email: "",
          gstNumber: "",
        }));
      }
    };
  
    fetchNextInvoiceNumber();
  }, []);

  // Function to generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");
      
      console.log("Generating next invoice number with:", { token, email });
      
      const response = await fetch(`${API_BASE_URL}/api/bills/next-invoice-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email })
      });
      
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      if (response.ok) {
        return responseData.invoiceNumber;
      } else {
        setMessage(`Error generating next invoice number: ${responseData.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error("Error in generateNextInvoiceNumber:", error);
      setMessage(`Error generating next invoice number: ${error.message}`);
      return null;
    }
  };

  // Reset function to also handle invoice number generation
  const resetForm = async () => {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    if (nextInvoiceNumber) {
      setSellDetails(prev => ({
        ...prev,
        saleInvoiceNumber: nextInvoiceNumber,
        receiptNumber: "",
        partyName: "",
        email: "",
        gstNumber: "",
        date: new Date().toISOString().split("T")[0],
      }));
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Replace inventory fetch logic to use /api/inventory/available
  const fetchInventoryData = useCallback(
    debounce(async (itemName, email, index) => {
      if (!itemName || !email) return;
      setSearchLoading(true);
      try {
        const token = localStorage.getItem("token");
        // Use the new endpoint
        const response = await fetch(
          `${API_BASE_URL}/api/inventory/available?itemName=${encodeURIComponent(
            itemName.toLowerCase()
          )}&email=${encodeURIComponent(email)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        if (data.length > 0) {
          setSearchResults(data);
          setShowAutocomplete(true);
          // Update the current item with the first result
          const batchOptions = data.map((batch) => ({
            batchNumber: batch.batch.replace(/[^a-zA-Z0-9]/g, ''),
            quantity: batch.availableQuantity, // Use availableQuantity
            mrp: batch.mrp,
            purchaseRate: batch.purchaseRate,
            gstNo: sellDetails.gstNumber,
            expiryDate: batch.expiryDate
          }));
          const sanitizedBatch = data[0].batch.replace(/[^a-zA-Z0-9]/g, '');
          updateItem(index, {
            batchOptions,
            batch: sanitizedBatch,
            availableQuantity: data[0].availableQuantity, // Use availableQuantity
            mrp: data[0].mrp?.toString() || "",
            purchaseRate: data[0].purchaseRate?.toString() || "",
            gstPercentage: data[0].gstPercentage?.toString() || "0",
            expiryDate: data[0].expiryDate
          });
          setMessage("");
        } else {
          setSearchResults([]);
          setShowAutocomplete(false);
          setMessage(`No inventory found for ${itemName}`);
          updateItem(index, {
            batchOptions: [],
            batch: "",
            availableQuantity: 0,
            mrp: "",
            purchaseRate: "",
            gstPercentage: "0",
            expiryDate: ""
          });
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setMessage(`Error fetching inventory data: ${error.message}`);
        setSearchResults([]);
        setShowAutocomplete(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [sellDetails.gstNumber, updateItem]
  );

const handleItemChange = (index, event) => {
  const { name, value } = event.target;
  const email = localStorage.getItem("email");
  
  // Handle item name change with debounced search
  if (name === "itemName") {
    updateItem(index, { itemName: value });
    
    if (value && email) {
      setActiveItemIndex(index);
      fetchInventoryData(value, email, index);
    } else {
      setShowAutocomplete(false);
    }
    return;
  }
  
  // Handle batch selection
  if (name === "batch") {
    const currentItem = items[index];
    const cleanBatch = value.replace(/[^a-zA-Z0-9]/g, '');
    const selectedBatch = currentItem.batchOptions.find(
      (batch) => batch.batchNumber === cleanBatch
    );
    
    if (selectedBatch) {
      updateItem(index, {
        batch: cleanBatch,
        availableQuantity: selectedBatch.quantity,
        mrp: selectedBatch.mrp?.toString() || "",
        purchaseRate: selectedBatch.purchaseRate?.toString() || "",
        gstPercentage: selectedBatch.gstPercentage?.toString() || "0",
        expiryDate: selectedBatch.expiryDate
      });
    }
    return;
  }
  
  // Handle quantity, discount, and other fields
  updateItem(index, { [name]: value });
  
  // Calculate amount if quantity, mrp, and discount are available
  const currentItem = items[index];
  const quantity = parseFloat(currentItem.quantity) || 0;
  const mrp = parseFloat(currentItem.mrp) || 0;
  const discount = parseFloat(currentItem.discount) || 0;
  const gstPercentage = parseFloat(currentItem.gstPercentage) || 0;
  
  if (quantity > currentItem.availableQuantity) {
    setMessage({ type: 'error', text: `Insufficient stock for ${currentItem.itemName}` });
  } else if (quantity <= 0) {
    setMessage({ type: 'error', text: "Quantity must be greater than 0" });
  } else {
    // Base calculations
    const totalAmount = quantity * mrp;
    const discountAmount = (totalAmount * discount) / 100;
    const amountAfterDiscount = totalAmount - discountAmount;
    
    // GST calculations
    const gstAmount = (amountAfterDiscount * gstPercentage) / 100;
    // Split GST into SGST and CGST (for intra-state)
    const sgst = gstAmount / 2;
    const cgst = gstAmount / 2;
    const igst = 0; // Assuming intra-state, IGST would be 0
    
    // Final amount
    const netAmount = amountAfterDiscount + gstAmount;
    
    updateItem(index, { 
      amount: netAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      sgst: sgst.toFixed(2),
      cgst: cgst.toFixed(2),
      igst: igst.toFixed(2),
      totalGst: gstAmount.toFixed(2),
      netAmount: netAmount.toFixed(2)
    });
    setMessage("");
  }
};

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    // Prevent changing invoice number
    if (name === 'saleInvoiceNumber') return;
    setSellDetails({ ...sellDetails, [name]: value });
  };
  
  // Handle autocomplete selection
  const handleAutocompleteSelect = (itemName) => {
    if (activeItemIndex !== null) {
      updateItem(activeItemIndex, { itemName });
      setShowAutocomplete(false);
    }
  };
  
  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutocomplete(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Real-time inventory update via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleInventoryUpdate = () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
      fetchTimeout.current = setTimeout(() => {
        // Re-fetch suggestions for the active item (if any)
        if (activeItemIndex !== null && items[activeItemIndex]?.itemName) {
          const email = localStorage.getItem('email');
          fetchInventoryData(items[activeItemIndex].itemName, email, activeItemIndex);
        }
        fetchTimeout.current = null;
      }, 1000); // debounce
    };
    socket.on(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [socket, activeItemIndex, items, fetchInventoryData]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header with gradient background
    doc.setFillColor(41, 128, 185); // Blue color
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Sales Invoice', 105, 20, { align: 'center' });
    
    // Add company details
    doc.setFontSize(10);
    doc.text('Medicine Inventory Management System', 105, 30, { align: 'center' });
    
    // Add invoice details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${sellDetails.saleInvoiceNumber || 'INV001'}`, 20, 50);
    doc.text(`Date: ${sellDetails.date}`, 20, 60);
    doc.text(`Receipt Number: ${sellDetails.receiptNumber}`, 20, 70);
    
    // Add party details
    doc.setFontSize(12);
    doc.text('Party Details:', 20, 85);
    doc.setFontSize(10);
    doc.text(`Name: ${sellDetails.partyName}`, 20, 95);
    doc.text(`GST Number: ${sellDetails.gstNumber}`, 20, 100);
    
    // Add items table
    const tableColumn = [
      'Item Name',
      'Batch',
      'Qty',
      'Purchase Rate',
      'MRP',
      'Disc%',
      'GST%',
      'Expiry Date',
      'Amount'
    ];
    
    const tableRows = items.map(item => [
      item.itemName,
      item.batch,
      item.quantity,
      `₹${parseFloat(item.purchaseRate).toFixed(2)}`,
      `₹${parseFloat(item.mrp).toFixed(2)}`,
      `${item.discount}%`,
      `${item.gstPercentage}%`,
      item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '-',
      `₹${parseFloat(item.amount).toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 110,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Item Name
        1: { cellWidth: 15 }, // Batch
        2: { cellWidth: 10 }, // Quantity
        3: { cellWidth: 20 }, // Purchase Rate
        4: { cellWidth: 15 }, // MRP
        5: { cellWidth: 10 }, // Discount
        6: { cellWidth: 10 }, // GST
        7: { cellWidth: 20 }, // Expiry Date
        8: { cellWidth: 20 }  // Amount
      },
      styles: {
        cellPadding: 2,
        fontSize: 9,
        valign: 'middle'
      },
      margin: { left: 20, right: 20 }
    });
    
    // Add summary
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('Bill Summary', 20, finalY);
    
    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0);
    const totalGst = items.reduce((sum, item) => sum + (parseFloat(item.gstAmount) || 0), 0);
    const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    doc.setFontSize(10);
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 20, finalY + 10);
    doc.text(`Total Discount: ₹${totalDiscount.toFixed(2)}`, 20, finalY + 20);
    doc.text(`Total GST: ₹${totalGst.toFixed(2)}`, 20, finalY + 30);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Net Amount: ₹${netAmount.toFixed(2)}`, 20, finalY + 45);
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });
    
    // Add terms and conditions
    doc.setFontSize(8);
    doc.text('Terms and Conditions:', 20, 290);
    doc.setFontSize(7);
    doc.text('1. Goods once sold will not be taken back.', 20, 295);
    doc.text('2. Subject to local jurisdiction.', 20, 300);
    
    // Save the PDF with proper invoice number
    const invoiceNumber = sellDetails.saleInvoiceNumber || 'INV001';
    doc.save(`SalesInvoice_${invoiceNumber}.pdf`);
  };

  //New function to update inventory quantities after a sale
  // const updateInventoryQuantities = async (soldItems) => {
  //   const token = localStorage.getItem("token");
  //   const email = localStorage.getItem("email");
    
  //   try {
  //     // Create an array of inventory updates
  //     const updates = soldItems.map(item => ({
  //       email,
  //       itemName: item.itemName,
  //       batch: item.batch,
  //       quantity: -Number(item.quantity) // Negative value to reduce inventory
  //     }));
      
  //     // Make the API call to update inventory
  //     const response = await fetch("http://localhost:5001/api/inventory/update-batch-quantities", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ updates }),
  //     });
      
  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       throw new Error(data.message || "Failed to update inventory");
  //     }
      
  //     console.log("Inventory updated successfully:", data);
  //     return true;
  //   } catch (error) {
  //     console.error("Error updating inventory:", error);
  //     // Check if the error message contains a specific pattern that indicates
  //     // the inventory was actually updated despite the error message
  //     if (error.message && error.message.includes("already updated") || 
  //         error.message.includes("success")) {
  //       console.log("Inventory seems to have been updated despite the error");
  //       return true;
  //     }
  //     setMessage({ type: 'error', text: `Error updating inventory: ${error.message}` });
  //     return false;
  //   }
  // };

  
  
  // const createSellBill = async () => {
  //   const token = localStorage.getItem("token");
  //   const email = localStorage.getItem("email");
  
  //   if (!sellDetails.gstNumber) {
  //     setMessage({ type: 'error', text: "GST Number is required" });
  //     return;
  //   }
  
  //   const gstMismatch = items.some(item => item.gstNo !== sellDetails.gstNumber);
  //   if (gstMismatch) {
  //     setMessage({ type: 'error', text: "All items must have the same GST Number" });
  //     return;
  //   }
  
  //   const invalidQuantities = items.some(item => 
  //     item.availableQuantity < Number(item.quantity) || 
  //     Number(item.quantity) <= 0
  //   );
  
  //   if (invalidQuantities) {
  //     setMessage({ type: 'error', text: "Invalid quantities detected" });
  //     return;
  //   }
  
  //   // Calculate totals
  //   const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  //   const totalDiscount = items.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0);
  //   const totalGst = items.reduce((sum, item) => sum + (parseFloat(item.gstAmount) || 0), 0);
  //   const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  
  //   const body = {
  //     ...sellDetails,
  //     items: items.map(({ batchOptions, availableQuantity, ...rest }) => ({
  //       ...rest,
  //       quantity: Number(rest.quantity),
  //       mrp: Number(rest.mrp),
  //       discount: Number(rest.discount),
  //       gstPercentage: Number(rest.gstPercentage),
  //       gstNo: sellDetails.gstNumber,
  //       amount: Number(rest.amount),
  //       totalAmount: Number(rest.totalAmount),
  //       discountAmount: Number(rest.discountAmount),
  //       gstAmount: Number(rest.gstAmount),
  //       netAmount: Number(rest.netAmount)
  //     })),
  //     totalAmount,
  //     discountAmount: totalDiscount,
  //     sgstAmount: totalGst / 2,
  //     cgstAmount: totalGst / 2,
  //     igstAmount: 0,
  //     totalGstAmount: totalGst,
  //     netAmount,
  //     email
  //   };
  
  //   try {
  //     setLoading(true);
  //     const response = await fetch("http://localhost:5001/api/bills/sale", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(body),
  //     });
  
  //     const responseData = await response.json();
  
  //     if (response.ok) {
  //       // Set success message before updating inventory
  //       setMessage({ type: 'success', text: "Invoice created successfully!" });
        
  //       // Update inventory quantities after successful bill creation
  //       try {
  //         const inventoryUpdated = await updateInventoryQuantities(items);
          
  //         if (inventoryUpdated) {
  //           setMessage({ type: 'success', text: "Invoice created and inventory updated successfully!" });
  //           generatePDF();
  //           resetItems();
  //           resetForm();
  //         }
  //       } catch (updateError) {
  //         console.error("Error in inventory update:", updateError);
  //         // Don't change the success message even if inventory update has an error
  //         // Since we know the bill was created successfully
  //         generatePDF();
  //         resetItems();
  //         resetForm();
  //       }
  //     } else {
  //       setMessage({ type: 'error', text: responseData.message || "Failed to create invoice" });
  //     }
  //   } catch (error) {
  //     setMessage({ type: 'error', text: "Error creating invoice" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const createSellBill = async () => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (!sellDetails.gstNumber) {
      setMessage({ type: 'error', text: "GST Number is required" });
      return;
    }

    const gstMismatch = items.some(item => item.gstNo !== sellDetails.gstNumber);
    if (gstMismatch) {
      setMessage({ type: 'error', text: "All items must have the same GST Number" });
      return;
    }

    const invalidQuantities = items.some(item => 
      item.availableQuantity < Number(item.quantity) || 
      Number(item.quantity) <= 0
    );

    if (invalidQuantities) {
      setMessage({ type: 'error', text: "Invalid quantities detected" });
      return;
    }

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0);
    const totalGst = items.reduce((sum, item) => sum + (parseFloat(item.gstAmount) || 0), 0);
    const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const body = {
      ...sellDetails,
      items: items.map(({ batchOptions, availableQuantity, ...rest }) => ({
        ...rest,
        quantity: Number(rest.quantity),
        mrp: Number(rest.mrp),
        discount: Number(rest.discount),
        gstPercentage: Number(rest.gstPercentage),
        gstNo: sellDetails.gstNumber,
        amount: Number(rest.amount),
        totalAmount: Number(rest.totalAmount),
        discountAmount: Number(rest.discountAmount),
        gstAmount: Number(rest.gstAmount),
        netAmount: Number(rest.netAmount)
      })),
      totalAmount,
      discountAmount: totalDiscount,
      sgstAmount: totalGst / 2,
      cgstAmount: totalGst / 2,
      igstAmount: 0,
      totalGstAmount: totalGst,
      netAmount,
      email
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bills/sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      // Always treat as success if pdfUrl is present
      if (responseData.pdfUrl) {
        try {
          const pdfResponse = await fetch(`${API_BASE_URL}${responseData.pdfUrl}`);
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${sellDetails.saleInvoiceNumber}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          setMessage({ type: 'success', text: 'Invoice created and PDF downloaded!' });
          generatePDF();
          resetItems();
          resetForm();
          return;
        } catch (pdfError) {
          console.error('Error downloading PDF:', pdfError);
          setMessage({ type: 'error', text: 'Invoice created but failed to download PDF.' });
          return;
        }
      }

      // If no pdfUrl, show error
      setMessage({ type: 'error', text: responseData.message || "Failed to create invoice" });
    } catch (error) {
      setMessage({ type: 'error', text: "Error creating invoice: " + (error.message || '') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-2">Create Sales Invoice</h2>
          <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                placeholder="Enter GST Number"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.gstNumber}
                onChange={handleDetailsChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name</label>
              <input
                type="text"
                name="partyName"
                placeholder="Enter Party Name"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.partyName}
                onChange={handleDetailsChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="saleInvoiceNumber"
                  value={sellDetails.saleInvoiceNumber}
                  className="rounded-lg border-2 border-indigo-100 bg-gray-100 p-3 transition-colors"
                  readOnly
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                  value={sellDetails.date}
                  onChange={handleDetailsChange}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
              <input
                type="text"
                name="receiptNumber"
                placeholder="Receipt #"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.receiptNumber}
                onChange={handleDetailsChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-indigo-600 mb-4">Item Details</h3>
          <div className="rounded-xl border-2 border-indigo-50 ">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["Item Name", "Batch", "Available", "Qty", "Purchase Rate", "MRP", "Discount%", "GST %", "Expiry Date", "Amount"].map((header, idx) => (
                    <th 
                      key={idx}
                      className="px-4 py-3 text-left text-sm font-medium last:text-right"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {items.map((item, index) => {
                  // Calculate adjusted available quantity for this row
                  const pickedElsewhere = items.reduce((sum, row, idx) => {
                    if (
                      idx !== index &&
                      row.itemName === item.itemName &&
                      row.batch === item.batch &&
                      row.batch && row.itemName
                    ) {
                      return sum + (parseFloat(row.quantity) || 0);
                    }
                    return sum;
                  }, 0);
                  const adjustedAvailable = (parseFloat(item.availableQuantity) || 0) - pickedElsewhere;
                  return (
                    <tr 
                      key={index}
                      className="hover:bg-indigo-50 transition-colors"
                    >
                      <td className="px-4 py-3 relative">
                        <input
                          type="text"
                          name="itemName"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItemIndex(index);
                            if (item.itemName) {
                              setShowAutocomplete(true);
                            }
                          }}
                        />
                        {showAutocomplete && activeItemIndex === index && (
                          <div 
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {searchLoading ? (
                              <div className="p-2 text-center text-gray-500">
                                <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                              </div>
                            ) : searchResults.length > 0 ? (
                              <ul>
                                {searchResults.map((result, idx) => (
                                  <li 
                                    key={idx}
                                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                    onClick={() => handleAutocompleteSelect(result.itemName)}
                                  >
                                    {result.itemName}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="p-2 text-center text-gray-500">
                                No results found
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          name="batch"
                          value={item.batch}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select Batch</option>
                          {item.batchOptions.map((batch, idx) => (
                            <option key={idx} value={batch.batchNumber}>
                              {batch.batchNumber.replace(/[^a-zA-Z0-9]/g, '')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {adjustedAvailable >= 0 ? adjustedAvailable : 0}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => {
                            // Validate against adjustedAvailable
                            const val = parseFloat(e.target.value) || 0;
                            if (val > adjustedAvailable) {
                              setMessage({ type: 'error', text: `Cannot select more than available (${adjustedAvailable}) for this batch.` });
                              return;
                            }
                            setMessage("");
                            handleItemChange(index, e);
                          }}
                          className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                          min="0"
                          max={adjustedAvailable}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">₹</span>
                          <input
                            type="number"
                            name="purchaseRate"
                            value={item.purchaseRate}
                            readOnly
                            className="w-24 px-2 py-1 text-sm text-center bg-gray-50 border border-gray-300 rounded-md"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          name="mrp"
                          value={item.mrp}
                          disabled
                          className="w-full rounded-md bg-indigo-50 border-indigo-100"
                        />
                      </td>
                      
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          name="discount"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          name="expiryDate"
                          value={item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''}
                          readOnly
                          className="w-full rounded-md bg-indigo-50 border-indigo-100"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {item.amount || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={addItem}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>

          <div className="space-x-4">
            {message && (
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-rose-100 text-rose-700'
              }`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 mr-2 ${
                    message.type === 'success' ? 'text-green-500' : 'text-rose-500'
                  }`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  {message.type === 'success' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                {message.text}
              </div>
            )}
            
            <button
              onClick={createSellBill}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Create Sales Invoice"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellBillForm;


