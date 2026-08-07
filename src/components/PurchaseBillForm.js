import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { SOCKET_EVENTS } from '../utils/socketUtils';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const PurchaseBillForm = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [items, setItems] = useState([
    {
      itemName: "",
      batch: "",
      expiryDate: "",
      pack: "",
      quantity: "",
      purchaseRate: "",
      mrp: "",
      gstPercentage: "",
      discount: "",
      totalAmount: "",
      discountAmount: "",
      gstAmount: "",
      netAmount: ""
    },
  ]);

  const [purchaseDetails, setPurchaseDetails] = useState({
    supplierInvoiceNumber: "",
    receiptNumber: "",
    partyName: "",
    date: "",
  });

  const [message, setMessage] = useState("");

  // Add new state for file upload and loading
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Add socket event listener for inventory updates
  useEffect(() => {
    if (!socket) return;

    const handleInventoryUpdate = (data) => {
      console.log('Inventory update received in purchase form:', data);
      // Clear success message after 3 seconds
      if (message.includes("successfully")) {
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    };

    socket.on(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
    };
  }, [socket, message]);

  const calculateItemAmounts = (item) => {
    const quantity = parseFloat(item.quantity || 0);
    const purchaseRate = parseFloat(item.purchaseRate || 0);
    const discount = parseFloat(item.discount || 0);
    const gstPercentage = parseFloat(item.gstPercentage || 0);

    // Calculate total amount
    const totalAmount = quantity * purchaseRate;
    
    // Calculate discount amount
    const discountAmount = (totalAmount * discount) / 100;
    
    // Calculate amount after discount
    const amountAfterDiscount = totalAmount - discountAmount;
    
    // Calculate GST amount
    const gstAmount = (amountAfterDiscount * gstPercentage) / 100;
    
    // Calculate net amount
    const netAmount = amountAfterDiscount + gstAmount;

    return {
      totalAmount: totalAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      netAmount: netAmount.toFixed(2)
    };
  };

  const handleItemChange = (index, event) => {
    const { name, value } = event.target;
    const updatedItems = [...items];
    updatedItems[index][name] = value;

    // Calculate amounts when relevant fields change
    if (['quantity', 'purchaseRate', 'discount', 'gstPercentage'].includes(name)) {
      const calculatedAmounts = calculateItemAmounts(updatedItems[index]);
      updatedItems[index] = {
        ...updatedItems[index],
        ...calculatedAmounts
      };
    }

    setItems(updatedItems);
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setPurchaseDetails({ ...purchaseDetails, [name]: value });
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        batch: "",
        expiryDate: "",
        pack: "",
        quantity: "",
        purchaseRate: "",
        mrp: "",
        gstPercentage: "",
        discount: "",
        totalAmount: "",
        discountAmount: "",
        gstAmount: "",
        netAmount: ""
      },
    ]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Purchase Bill", 14, 15);

    // Add purchase details
    doc.setFontSize(10);
    doc.text(`Supplier Invoice: ${purchaseDetails.supplierInvoiceNumber}`, 14, 25);
    doc.text(`Receipt Number: ${purchaseDetails.receiptNumber}`, 14, 30);
    doc.text(`Party Name: ${purchaseDetails.partyName}`, 14, 35);
    doc.text(`Date: ${purchaseDetails.date}`, 14, 40);

    // Table headers
    const headers = [
      "Item Name",
      "Batch",
      "Quantity",
      "Rate",
      "Total",
      "Discount",
      "GST",
      "Net Amount"
    ];

    // Table data
    const tableData = items.map(item => [
      item.itemName,
      item.batch,
      item.quantity,
      item.purchaseRate,
      item.totalAmount,
      item.discountAmount,
      item.gstAmount,
      item.netAmount
    ]);

    // Add totals row
    const totals = {
      totalAmount: items.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0).toFixed(2),
      discountAmount: items.reduce((sum, item) => sum + parseFloat(item.discountAmount || 0), 0).toFixed(2),
      gstAmount: items.reduce((sum, item) => sum + parseFloat(item.gstAmount || 0), 0).toFixed(2),
      netAmount: items.reduce((sum, item) => sum + parseFloat(item.netAmount || 0), 0).toFixed(2)
    };

    tableData.push(['', '', '', 'Total:', totals.totalAmount, totals.discountAmount, totals.gstAmount, totals.netAmount]);

    // Add table
    doc.autoTable({
      startY: 45,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 }
    });

    doc.save("PurchaseBill.pdf");
  };

  const createPurchaseBill = async () => {
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    if (!email || !token) {
      setMessage("User is not authenticated. Please log in again.");
      return;
    }

    const purchaseAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.totalAmount || 0),
      0
    );
    const totalAmount = purchaseAmount;
    const discountAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.discountAmount || 0),
      0
    );
    const gstAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.gstAmount || 0),
      0
    );
    const netAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.netAmount || 0),
      0
    );

    const body = {
      ...purchaseDetails,
      purchaseAmount,
      totalAmount,
      discountAmount,
      gstAmount,
      netAmount,
      email,
      items: items.map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity || 0),
        purchaseRate: parseFloat(item.purchaseRate || 0),
        discount: parseFloat(item.discount || 0),
        gstPercentage: parseFloat(item.gstPercentage || 0),
        totalAmount: parseFloat(item.totalAmount || 0),
        discountAmount: parseFloat(item.discountAmount || 0),
        gstAmount: parseFloat(item.gstAmount || 0),
        netAmount: parseFloat(item.netAmount || 0)
      })),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/bills/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setMessage("Purchase bill created and inventory updated successfully!");
        generatePDF();
        
        // Emit purchase bill created event
        if (socket) {
          socket.emit('purchase_bill_created', {
            email,
            items: body.items,
            timestamp: new Date().toISOString()
          });
        }

        // Clear form
        setItems([{
          itemName: "",
          batch: "",
          expiryDate: "",
          pack: "",
          quantity: "",
          purchaseRate: "",
          mrp: "",
          gstPercentage: "",
          discount: "",
          totalAmount: "",
          discountAmount: "",
          gstAmount: "",
          netAmount: ""
        }]);
        setPurchaseDetails({
          supplierInvoiceNumber: "",
          receiptNumber: "",
          partyName: "",
          date: "",
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(
          `Failed to create purchase bill: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      setMessage(`Error occurred while creating the purchase bill: ${error.message}`);
    }
  };

  // Calculate totals
  const totals = {
    totalAmount: items.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0).toFixed(2),
    discountAmount: items.reduce((sum, item) => sum + parseFloat(item.discountAmount || 0), 0).toFixed(2),
    gstAmount: items.reduce((sum, item) => sum + parseFloat(item.gstAmount || 0), 0).toFixed(2),
    netAmount: items.reduce((sum, item) => sum + parseFloat(item.netAmount || 0), 0).toFixed(2)
  };

  // Handler for file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  // Handler for uploading the file to backend
  const handleUpload = async () => {
    if (!uploadFile) {
      setMessage('Please select an image or PDF file to upload.');
      return;
    }
    setUploading(true);
    setMessage('Uploading and processing...');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      // Adjust the endpoint as per your backend route
      const response = await axios.post('/api/ocr-bill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      // Assume backend returns { purchaseDetails, items }
      if (data.purchaseDetails && data.items) {
        setPurchaseDetails(data.purchaseDetails);
        setItems(data.items);
        setMessage('Bill data extracted and form auto-filled!');
      } else {
        setMessage('Could not extract bill data. Please check the file or fill manually.');
      }
    } catch (error) {
      setMessage('Error processing file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-2xl rounded-xl">
      <h2 className="text-4xl font-bold text-center text-blue-600 mb-10">
        Create Purchase Bill
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <input
          type="text"
          name="supplierInvoiceNumber"
          placeholder="Supplier Invoice Number"
          value={purchaseDetails.supplierInvoiceNumber}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="text"
          name="receiptNumber"
          placeholder="Receipt Number"
          value={purchaseDetails.receiptNumber}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="text"
          name="partyName"
          placeholder="Party Name"
          value={purchaseDetails.partyName}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="date"
          name="date"
          value={purchaseDetails.date}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
      </div>

      <div className="overflow-auto mb-10">
        <table className="table-auto w-full text-sm shadow-lg border-collapse border border-gray-200">
          <thead className="bg-blue-100 text-blue-600">
            <tr>
              {[
                "Item Name",
                "Batch",
                "Expiry Date",
                "Pack",
                "Quantity",
                "Purchase Rate",
                "MRP",
                "GST (%)",
                "Discount (%)",
                "Total Amount",
                "Discount Amount",
                "GST Amount",
                "Net Amount"
              ].map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-3 text-left font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIndex) => (
              <tr key={rowIndex} className="bg-white hover:bg-gray-100">
                {Object.keys(item).map((field, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 p-3">
                    <input
                      type={
                        ["quantity", "purchaseRate", "mrp", "gstPercentage", "discount", 
                         "totalAmount", "discountAmount", "gstAmount", "netAmount"].includes(field)
                          ? "number"
                          : field === "expiryDate"
                          ? "date"
                          : "text"
                      }
                      name={field}
                      value={item[field]}
                      onChange={(e) => handleItemChange(rowIndex, e)}
                      placeholder={field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      readOnly={["totalAmount", "discountAmount", "gstAmount", "netAmount"].includes(field)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-blue-50">
            <tr>
              <td colSpan="9" className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                Totals:
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                {totals.totalAmount}
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                {totals.discountAmount}
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                {totals.gstAmount}
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                {totals.netAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between gap-6">
        <button
          onClick={addItem}
          className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-shadow shadow-md"
        >
          Add Item
        </button>
        <button
          onClick={createPurchaseBill}
          className="bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition-shadow shadow-md"
        >
          Create Purchase Bill
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="bill-upload" className="block font-medium mb-1">Upload Bill (Image or PDF):</label>
        <input
          type="file"
          id="bill-upload"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="border p-2 rounded w-full"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={handleUpload}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={uploading || !uploadFile}
        >
          {uploading ? 'Processing...' : 'Upload & Extract Bill'}
        </button>
      </div>

      {message && (
        <p
          className={`mt-6 text-center font-semibold py-3 px-6 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default PurchaseBillForm;