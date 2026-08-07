import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReturnBillOptions = () => {
  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState(null);

  const handleNavigation = (type) => {
    setLoadingType(type);
    setTimeout(() => {
      navigate(type === 'purchase' ? '/purchase-return' : '/sale-return');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-300 rounded-full opacity-20 mix-blend-multiply filter blur-3xl animate-[blob_8s_infinite]"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-300 rounded-full opacity-20 mix-blend-multiply filter blur-3xl animate-[blob_8s_infinite_2s]"></div>

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12 space-y-6">
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Return Bill Management
          </h2>
          <p className="text-xl text-gray-700">
            Choose between handling purchase returns or sale returns.
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <CardButton
            title="Purchase Return"
            subtitle="Return items to suppliers"
            gradient="from-orange-500 to-red-500"
            icon="📦"
            loading={loadingType === 'purchase'}
            onClick={() => handleNavigation('purchase')}
          />
          <CardButton
            title="Sale Return"
            subtitle="Handle customer returns"
            gradient="from-green-500 to-teal-500"
            icon="🔄"
            loading={loadingType === 'sale'}
            onClick={() => handleNavigation('sale')}
          />
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-br from-blue-100 via-pink-100 to-purple-100 border border-blue-300/30 backdrop-blur-xl p-10 rounded-3xl shadow-xl text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Need Assistance?</h3>
          <p className="text-gray-700 mb-6 font-medium">
            Our support team is available to guide you through any return process.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-700 to-purple-700 text-white rounded-full font-semibold hover:opacity-90 transition">
              Contact Support
            </button>
            <button
              onClick={() => navigate('/documentation/return-bills')}
              className="px-6 py-3 border border-gray-400 text-gray-800 bg-white/60 rounded-full font-semibold hover:bg-white/80 transition"
            >
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Component
const CardButton = ({ title, subtitle, gradient, icon, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`relative group bg-gradient-to-br ${gradient} text-white p-6 rounded-2xl shadow-lg transition transform hover:-translate-y-2 hover:shadow-2xl active:scale-95 w-full`}
  >
    {loading ? (
      <div className="flex justify-center items-center space-x-2">
        <div className="w-5 h-5 border-4 border-white border-dashed rounded-full animate-spin"></div>
        <span className="font-semibold">Loading...</span>
      </div>
    ) : (
      <div className="flex items-start space-x-4">
        <span className="text-4xl bg-white/20 p-4 rounded-lg">{icon}</span>
        <div className="text-left">
          <h3 className="text-2xl font-bold mb-1">{title}</h3>
          <p className="text-white/90">{subtitle}</p>
        </div>
      </div>
    )}
  </button>
);

export default ReturnBillOptions;
