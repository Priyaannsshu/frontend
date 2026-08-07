import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
      <h2 className="text-white text-xl font-semibold">Loading Alerts...</h2>
    </div>
  </div>
);

const AlertCard = ({ alert, onClick }) => {
  const getAlertStyles = (type) => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`${getAlertStyles(alert.type)} cursor-pointer transform transition-all duration-300 hover:scale-[1.02] 
        border-l-4 p-4 mb-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-between`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getIcon(alert.type)}</span>
        <div>
          <h3 className="font-semibold">{alert.title}</h3>
          <p className="text-sm opacity-90">{alert.message}</p>
        </div>
      </div>
      <div className="text-sm opacity-75">
        {alert.time && new Date(alert.time).toLocaleString()}
      </div>
    </div>
  );
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const email = localStorage.getItem('email');
        if (!email) {
          navigate('/login');
          return;
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get inventory data for alerts
        const response = await axiosInstance.get(`/api/inventory/${email}`);
        const inventoryData = response.data;

        const currentDate = new Date();
        const lowStockThreshold = 10;
        const expiringSoonThreshold = 30;

        // Process inventory data into alerts
        const newAlerts = [];

        // Low stock alerts
        inventoryData.forEach(item => {
          if (item.quantity <= lowStockThreshold) {
            newAlerts.push({
              type: 'danger',
              title: 'Low Stock Alert',
              message: `${item.itemName} is running low (${item.quantity} units remaining)`,
              category: 'inventory',
              time: new Date().toISOString()
            });
          }
        });

        // Expiring items alerts
        inventoryData.forEach(item => {
          if (item.expiryDate) {
            const expirationDate = new Date(item.expiryDate);
            const daysToExpire = Math.ceil((expirationDate - currentDate) / (1000 * 3600 * 24));
            
            if (daysToExpire > 0 && daysToExpire <= expiringSoonThreshold) {
              newAlerts.push({
                type: 'warning',
                title: 'Expiring Soon',
                message: `${item.itemName} will expire in ${daysToExpire} days`,
                category: 'expiry',
                time: new Date().toISOString()
              });
            }
          }
        });

        setAlerts(newAlerts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [navigate]);

  const handleAlertClick = (alert) => {
    setLoading(true);
    // Simulate navigation delay
    setTimeout(() => {
      if (alert.category === 'inventory') {
        navigate('/inventory');
      } else if (alert.category === 'expiry') {
        navigate('/inventory?filter=expiring');
      }
    }, 800);
  };

  const filteredAlerts = selectedCategory === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.category === selectedCategory);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Alert Center</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setSelectedCategory('inventory')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === 'inventory' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Inventory
              </button>
              <button 
                onClick={() => setSelectedCategory('expiry')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === 'expiry' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Expiry
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            You have {filteredAlerts.length} active {selectedCategory === 'all' ? '' : selectedCategory} alerts
          </p>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <AlertCard 
                key={index} 
                alert={alert} 
                onClick={() => handleAlertClick(alert)}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <span className="text-4xl mb-4 block">🎉</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Active Alerts
              </h3>
              <p className="text-gray-600">
                Everything is running smoothly! We'll notify you when something needs attention.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts; 