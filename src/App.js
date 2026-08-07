import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Alerts from './components/Alerts';

import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import ViewInventory from './components/ViewInventory';
import GenerateBillOptions from './components/GenerateBillOptions';
import PurchaseBillForm from './components/PurchaseBillForm'; // Ensure this is created
import SellBillForm from './components/SellBillForm'; // Ensure this is created
import ReturnBillOptions from './components/ReturnBillOptions';
import PurchaseReturnForm from './components/PurchaseReturnForm';
import PurchaseReturnSearch from './components/PurchaseReturnSearch';
import SaleReturnForm from './components/SaleReturnForm';
import ExpiryBillForm from './components/ExpiryBillForm';
import BillGenerationDocs from './components/BillGenerationDocs';
import PurchaseHistory from './components/PurchaseHistory';
import PartyInvoiceSearch from './components/PartyInvoiceSearch';
import { Toaster } from 'react-hot-toast';
import MedicineSalesSummary from './components/Report';
import ClientExpiryReturnForm from './components/ClientExpiryReturnForm';
import ClientExpiryBillGenerator from './components/ClientExpiryBillGenerator';
import SupplierExpiryBillGenerator from './components/SupplierExpiryBillGenerator';
import ExpiryBillDocs from './components/ExpiryBillDocs';
// import ExpiryBillList from './components/ExpiryBills/ExpiryBillList.js';
// import CreateExpiryBill from './components/ExpiryBills/CreateExpiryBill.js';
// import ViewExpiryBill from './components/ExpiryBills/ViewExpiryBill.js';
// import DeleteExpiryBill from './components/ExpiryBills/DeleteExpiryBill.js';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            <Route path="/" element={<Layout />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/view-inventory" element={<ViewInventory />} />
            <Route path="/alerts" element={<Alerts />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/generate-bill" element={<GenerateBillOptions />} />
            <Route 
          path="/documentation/bill-generation" 
          element={<BillGenerationDocs />} 
        />
            <Route path="/purchase-bill" element={<PurchaseBillForm />} />
            <Route path="/sell-bill" element={<SellBillForm />} />
            <Route path="/return-bill" element={<ReturnBillOptions />} />
            <Route path="/purchase-return" element={<PurchaseReturnForm />} />
            <Route path="/purchase-return-search" element={<PurchaseReturnSearch />} />
            <Route path="/sale-return" element={<SaleReturnForm />} />
            <Route path="/expiry-bill" element={<ExpiryBillForm />} />
            <Route path="/purchase-history" element={<PurchaseHistory />} />
            <Route path="/party-invoices" element={<PartyInvoiceSearch />} />
            <Route path="/medicine-sales-summary" element={<MedicineSalesSummary />} />
            <Route path="/expiry/client" element={<ClientExpiryReturnForm />} />
            <Route path="/expiry-bill/client" element={<ClientExpiryBillGenerator />} />
            <Route path="/expiry-bill/supplier" element={<SupplierExpiryBillGenerator />} />
            <Route path="/docs/expiry-bill" element={<ExpiryBillDocs />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
