// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// function GenerateBillOptions() {
//   console.log('Rendering GenerateBillOptions'); // Ensure this logs

//   const navigate = useNavigate();

//   return (
//     <div className="bill-options-container">
//       <h2 className="text-center text-lg font-bold mb-6">Select Bill Type</h2>
//       <div className="flex flex-col items-center space-y-4">
//         <button
//           onClick={() => navigate('/purchase-bill')}
//           className="bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           Purchase Bill
//         </button>
//         <button
//           onClick={() => navigate('/sell-bill')}
//           className="bg-green-500 text-white px-4 py-2 rounded"
//         >
//           Sell Bill
//         </button>
//         <button
//           onClick={() => navigate('/return-bill')}
//           className="bg-yellow-500 text-white px-4 py-2 rounded"
//         >
//           Return Bill
//         </button>
//         <button
//           onClick={() => navigate('/expiry-bill')}
//           className="bg-red-500 text-white px-4 py-2 rounded"
//         >
//           Expiry Bill
//         </button>
//       </div>
//     </div>
//   );
// }

// export default GenerateBillOptions;

import React from 'react';
import { useNavigate } from 'react-router-dom';

function GenerateBillOptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-6">
          <h2 className="text-5xl font-bold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Smart Bill Generation
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            Streamline your pharmacy's financial operations with our intuitive bill management system. 
            Select a bill type below to maintain perfect records and optimize your inventory flow.
          </p>
        </div>

        {/* Bill Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <CardButton
            title="Purchase Bill"
            subtitle="Record incoming stock"
            gradient="from-teal-500 to-cyan-600"
            icon="📥"
            onClick={() => navigate('/purchase-bill')}
          />
          <CardButton
            title="Sell Bill"
            subtitle="Track customer sales"
            gradient="from-indigo-500 to-blue-600"
            icon="💰"
            onClick={() => navigate('/sell-bill')}
          />
          <CardButton
            title="Return Bill"
            subtitle="Manage product returns"
            gradient="from-purple-500 to-fuchsia-600"
            icon="🔄"
            onClick={() => navigate('/return-bill')}
          />
          <CardButton
            title="Expiry Bill"
            subtitle="Handle expired stock"
            gradient="from-rose-500 to-pink-600"
            icon="⚠️"
            onClick={() => navigate('/expiry-bill')}
          />
        </div>

        {/* Support Section */}
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Need Assistance?</h3>
          <p className="text-gray-700 mb-6">
            Our support team is ready to help you optimize your billing processes.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all">
              Contact Support
            </button>
            <button 
  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 transition-all"
  onClick={() => navigate('/documentation/bill-generation')}
>
  Documentation
</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Card Button Component
const CardButton = ({ title, subtitle, gradient, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`group bg-gradient-to-br ${gradient} text-white p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-95`}
  >
    <div className="flex items-start space-x-4">
      <span className="text-4xl bg-white/20 p-4 rounded-lg">{icon}</span>
      <div className="text-left">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-white/90">{subtitle}</p>
      </div>
    </div>
  </button>
);

export default GenerateBillOptions;