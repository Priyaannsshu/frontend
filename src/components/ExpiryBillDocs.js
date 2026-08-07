import React from 'react';

const ExpiryBillDocs = () => (
  <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-xl mt-10 font-sans">
    <h1 className="text-4xl font-extrabold text-blue-700 mb-6">Expiry Bill Documentation</h1>
    <p className="text-lg text-gray-700 mb-6">
      <b>Expiry Bills</b> help you manage medicines that are expired or near expiry, either returned by clients or sent back to suppliers. This system ensures proper documentation, inventory updates, and regulatory compliance.
    </p>
    <h2 className="text-2xl font-bold text-blue-600 mb-4">Types of Expiry Returns</h2>
    <ul className="list-disc ml-8 mb-6 text-gray-700">
      <li><b>Client Expiry Return:</b> When a customer returns expired medicines. You record the customer details and generate a return bill.</li>
      <li><b>Supplier Expiry Return:</b> When you return expired stock to your supplier. You record the supplier/party details and generate a return bill.</li>
    </ul>
    <h2 className="text-2xl font-bold text-blue-600 mb-4">How to Use the Smart Bill Generator</h2>
    <ol className="list-decimal ml-8 mb-6 text-gray-700">
      <li>Go to <b>Expiry Bill Management</b> and choose either <b>Client Expiry Return</b> or <b>Supplier Expiry Return</b>.</li>
      <li>Fill in the required header details (Email, Bill Number, Date, Customer/Supplier Name).</li>
      <li>Add all expired medicines, entering all required fields for each row.</li>
      <li>Click <b>Create Bill & Download PDF</b> to save and download your expiry bill.</li>
    </ol>
    <h2 className="text-2xl font-bold text-blue-600 mb-4">Fields in Expiry Bill</h2>
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full bg-white border border-gray-200 rounded-xl">
        <thead className="bg-blue-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">Field</th>
            <th className="py-2 px-4 border-b text-left">Description</th>
            <th className="py-2 px-4 border-b text-left">Client Return</th>
            <th className="py-2 px-4 border-b text-left">Supplier Return</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          <tr><td className="py-2 px-4 border-b">Email ID</td><td className="py-2 px-4 border-b">Your email for record</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Bill Number</td><td className="py-2 px-4 border-b">Unique bill/invoice number</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Date</td><td className="py-2 px-4 border-b">Bill date</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Customer Name</td><td className="py-2 px-4 border-b">Client's name</td><td>✔️</td><td></td></tr>
          <tr><td className="py-2 px-4 border-b">Party Name</td><td className="py-2 px-4 border-b">Supplier/party name</td><td></td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Medicine Name</td><td className="py-2 px-4 border-b">Name of the medicine</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Purchase Rate</td><td className="py-2 px-4 border-b">Rate at which medicine was purchased</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Expiry</td><td className="py-2 px-4 border-b">Expiry date of medicine</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Qty</td><td className="py-2 px-4 border-b">Quantity being returned</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Returnable Qty</td><td className="py-2 px-4 border-b">How much can be returned</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">MRP</td><td className="py-2 px-4 border-b">Maximum retail price</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">GST</td><td className="py-2 px-4 border-b">GST percentage</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Discount</td><td className="py-2 px-4 border-b">Discount applied</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Amount</td><td className="py-2 px-4 border-b">Total amount</td><td>✔️</td><td>✔️</td></tr>
          <tr><td className="py-2 px-4 border-b">Net Amount</td><td className="py-2 px-4 border-b">Final amount after discount/GST</td><td>✔️</td><td>✔️</td></tr>
        </tbody>
      </table>
    </div>
    <h2 className="text-xl font-bold text-blue-600 mb-2">Tips</h2>
    <ul className="list-disc ml-8 text-gray-700 mb-4">
      <li>Always double-check expiry dates and quantities before submitting.</li>
      <li>Download and save the PDF for your records and compliance.</li>
      <li>Contact support if you need help with expiry returns or documentation.</li>
    </ul>
  </div>
);

export default ExpiryBillDocs; 