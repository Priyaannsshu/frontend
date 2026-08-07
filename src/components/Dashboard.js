import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from "../utils/socketUtils.js";

import API_BASE_URL from '../config/api';

// Create axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    topSellingMedicines: [],
    salesGrowth: 0
  });
  
  // Real-time activity metrics
  const [activityMetrics, setActivityMetrics] = useState({
    dailySales: "₹0",
    monthlySales: "₹0",
    activeCustomers: 0
  });

  // Refs to prevent multiple API calls
  const dataFetchedRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const fetchTimeout = useRef(null);
  
  // Process inventory data for low stock and expiring items
  const processInventoryData = useCallback((inventoryData) => {
    console.log('Processing inventory data:', inventoryData);
    
    if (!inventoryData || !Array.isArray(inventoryData)) {
      console.warn('Invalid inventory data received:', inventoryData);
      return;
    }

    const lowStockThreshold = 10;
    const expiringSoonThreshold = 30;
    const lowStockItems = [];
    const expiringSoonItems = [];
    const currentDate = new Date();

    inventoryData.forEach((item) => {
      // Check for low stock
      const quantity = parseInt(item.quantity) || 0;
      if (quantity <= lowStockThreshold && quantity > 0) {
        lowStockItems.push({
          name: item.itemName || item.name,
          quantity: quantity
        });
      }

      // Check for expiring items
      if (item.expiryDate) {
        const expirationDate = new Date(item.expiryDate);
        const daysToExpire = Math.ceil((expirationDate - currentDate) / (1000 * 3600 * 24));
        
        if (daysToExpire > 0 && daysToExpire <= expiringSoonThreshold) {
          expiringSoonItems.push({
            name: item.itemName || item.name,
            expiryDate: item.expiryDate,
            daysRemaining: daysToExpire,
            quantity: quantity
          });
        }
      }
    });

    // Generate purchase suggestions based on low stock and sales data
    const suggestions = generatePurchaseSuggestions(lowStockItems, inventoryData);
    setPurchaseSuggestions(suggestions);

    setLowStockCount(lowStockItems.length);
    setExpiringSoonCount(expiringSoonItems.length);

    const lowStockNotifications = lowStockItems.map(item => ({
      type: "warning",
      message: `Low stock: ${item.name} (${item.quantity} units remaining)`,
      priority: "high"
    }));

    const expiringSoonNotifications = expiringSoonItems.map(item => ({
      type: "danger",
      message: `Expiring soon: ${item.name} (${item.daysRemaining} days remaining)`,
      priority: "urgent"
    }));

    setNotifications([...lowStockNotifications, ...expiringSoonNotifications]);
  }, []);

  // Generate purchase suggestions
  const generatePurchaseSuggestions = useCallback((lowStockItems, inventoryData) => {
    const suggestions = [];
    
    // Suggest reordering for low stock items
    lowStockItems.forEach(item => {
      const inventoryItem = inventoryData.find(inv => 
        (inv.itemName || inv.name) === item.name
      );
      
      if (inventoryItem) {
        const suggestedQuantity = Math.max(50, item.quantity * 5); // Suggest 5x current stock or minimum 50
        suggestions.push({
          type: 'reorder',
          itemName: item.name,
          currentStock: item.quantity,
          suggestedQuantity,
          reason: 'Low stock alert',
          priority: 'high',
          estimatedCost: (inventoryItem.mrp || 0) * suggestedQuantity * 0.7 // Assuming 70% of MRP as cost
        });
      }
    });

    // Add seasonal/trending suggestions (mock data for now)
    if (suggestions.length < 5) {
      const commonMedicines = [
        { name: 'Paracetamol 500mg', suggestedQty: 100, reason: 'High demand medicine' },
        { name: 'Amoxicillin 250mg', suggestedQty: 50, reason: 'Antibiotic essential' },
        { name: 'Vitamin D3', suggestedQty: 75, reason: 'Seasonal demand' }
      ];

      commonMedicines.forEach(med => {
        if (!suggestions.find(s => s.itemName === med.name)) {
          suggestions.push({
            type: 'trending',
            itemName: med.name,
            currentStock: 0,
            suggestedQuantity: med.suggestedQty,
            reason: med.reason,
            priority: 'medium',
            estimatedCost: med.suggestedQty * 10 // Mock cost
          });
        }
      });
    }

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }, []);

  const fetchUserEmail = useCallback(() => {
    let userEmail = null;
    
    // Try multiple sources for email
    userEmail = localStorage.getItem("email");
    
    if (!userEmail) {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          userEmail = userData.email;
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
    
    const emailToUse = userEmail || "Guest";
    setEmail(emailToUse);
    
    return userEmail;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const userEmail = fetchUserEmail();
    if (!userEmail || userEmail === "Guest") {
      console.warn('No valid email found, skipping data fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching dashboard data for:', userEmail);
      setLoading(true);

      const inventoryRes = await axiosInstance.get('/api/inventory', {
        params: { email: userEmail }
      });

      console.log('Inventory response:', inventoryRes.data);
      
      const inventoryData = inventoryRes.data;
      if (Array.isArray(inventoryData)) {
        setInventoryCount(inventoryData.length);
        processInventoryData(inventoryData);
      } else {
        console.warn('Inventory data is not an array:', inventoryData);
        setInventoryCount(0);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setInventoryCount(0);
      setLowStockCount(0);
      setExpiringSoonCount(0);
      setNotifications([{
        type: "error",
        message: "Error loading inventory data. Please refresh the page.",
        priority: "high"
      }]);
    } finally {
      setLoading(false);
    }
  }, [processInventoryData, fetchUserEmail]);

  const fetchAnalyticsData = useCallback(async () => {
    const userEmail = fetchUserEmail();
    if (!userEmail || userEmail === "Guest") return;

    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Only include medicineName if not empty
      const params = {
        email: userEmail,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      // If you ever want to filter by medicine, add it here:
      // if (medicineName && medicineName.trim() !== '') params.medicineName = medicineName;

      const response = await axiosInstance.get('/api/bills/medicine-sales', { params });

      if (response.data && response.data.salesDetails) {
        const sales = response.data.salesDetails;
        
        const totalRevenue = sales.reduce((sum, sale) => 
          sum + (sale.mrp * sale.quantity - sale.discount), 0);

        const uniqueInvoices = [...new Set(sales.map(sale => sale.saleInvoiceNumber))];
        const averageOrderValue = uniqueInvoices.length > 0 ? totalRevenue / uniqueInvoices.length : 0;

        const medicineMap = sales.reduce((acc, sale) => {
          const key = sale.itemName;
          if (!acc[key]) acc[key] = 0;
          acc[key] += sale.quantity;
          return acc;
        }, {});

        const topSellingMedicines = Object.entries(medicineMap)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity }));

        setAnalyticsData({
          totalRevenue,
          averageOrderValue,
          topSellingMedicines,
          salesGrowth: 0
        });

        // Update activity metrics
        setActivityMetrics(prev => ({
          ...prev,
          monthlySales: `₹${totalRevenue.toFixed(2)}`,
          dailySales: `₹${(totalRevenue / 30).toFixed(2)}` // Rough daily average
        }));
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setAnalyticsData({
        totalRevenue: 0,
        averageOrderValue: 0,
        topSellingMedicines: [],
        salesGrowth: 0
      });
    }
  }, [fetchUserEmail]);

  // Setup authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token && window.location.pathname !== '/login') {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!socket || socketConnectedRef.current) return;

    const userEmail = fetchUserEmail();
    if (!userEmail || userEmail === "Guest") return;

    console.log('Setting up socket connection for:', userEmail);

    const handleInventoryUpdate = () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
      fetchTimeout.current = setTimeout(() => {
        fetchDashboardData();
        fetchTimeout.current = null;
      }, 1000); // 1 second debounce
    };

    const handleDashboardUpdate = (data) => {
      console.log('WebSocket dashboard update received:', data);
      if (data && data.userEmail === userEmail) {
        setActivityMetrics(prev => ({
          ...prev,
          dailySales: data.dailySales || prev.dailySales,
          monthlySales: data.monthlySales || prev.monthlySales,
          activeCustomers: data.activeCustomers || prev.activeCustomers
        }));
      }
    };

    const handleConnect = () => {
      console.log('Socket connected, joining room for:', userEmail);
      socket.emit('join', { email: userEmail, room: 'dashboard' });
      socketConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      socketConnectedRef.current = false;
    };

    // Remove existing listeners
    socket.off(SOCKET_EVENTS.INVENTORY_UPDATE);
    socket.off(SOCKET_EVENTS.DASHBOARD_UPDATE);
    socket.off('connect');
    socket.off('disconnect');

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
    socket.on(SOCKET_EVENTS.DASHBOARD_UPDATE, handleDashboardUpdate);

    // Join room if already connected
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.INVENTORY_UPDATE, handleInventoryUpdate);
      socket.off(SOCKET_EVENTS.DASHBOARD_UPDATE, handleDashboardUpdate);
      socketConnectedRef.current = false;
    };
  }, [socket, processInventoryData, fetchUserEmail, fetchDashboardData, fetchAnalyticsData]);

  // Initial data fetch
  useEffect(() => {
    if (!dataFetchedRef.current) {
      const userEmail = fetchUserEmail();
      if (userEmail && userEmail !== "Guest") {
        fetchDashboardData();
        fetchAnalyticsData();
        dataFetchedRef.current = true;
      }
    }
  }, [fetchDashboardData, fetchAnalyticsData, fetchUserEmail]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const userEmail = fetchUserEmail();
        if (userEmail && userEmail !== "Guest") {
          fetchDashboardData();
          fetchAnalyticsData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboardData, fetchAnalyticsData, fetchUserEmail]);

  const handleLogout = () => {
    // Clean up socket connection
    if (socket) {
      socket.disconnect();
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAlertClick = () => {
    navigate('/alerts');
  };

  const handlePurchaseSuggestionClick = (suggestion) => {
    // Navigate to purchase/inventory page with suggestion data
    navigate('/inventory', { 
      state: { 
        suggestion,
        action: 'purchase'
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {email || "Guest"}!
            </h1>
            <p className="text-gray-600">Pharmacy Management Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            {socket?.connected && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live</span>
              </span>
            )}
            <span 
              onClick={handleAlertClick}
              className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-teal-200 transition-colors"
            >
              {notifications.length} Alerts
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-sm hover:bg-red-600 transition-all"
            >
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Inventory Health Card */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-teal-100 rounded-xl">
                <span className="text-3xl text-teal-600">💊</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Inventory Health</h2>
            </div>
            <div className="space-y-4">
              <MetricItem 
                label="Total Medicines"
                value={inventoryCount}
                icon="📦"
                color="teal"
                onClick={() => navigate("/inventory")}
              />
              <MetricItem 
                label="Low Stock"
                value={lowStockCount}
                icon="⚠️"
                color="amber"
                onClick={handleAlertClick}
              />
              <MetricItem 
                label="Expiring Soon"
                value={expiringSoonCount}
                icon="⌛"
                color="rose"
                onClick={handleAlertClick}
              />
            </div>
          </div>

          {/* Purchase Suggestions Card */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <span className="text-3xl text-orange-600">💡</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Purchase Suggestions</h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {purchaseSuggestions.length > 0 ? (
                purchaseSuggestions.slice(0, 5).map((suggestion, index) => (
                  <div 
                    key={index}
                    onClick={() => handlePurchaseSuggestionClick(suggestion)}
                    className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg cursor-pointer hover:shadow-md transition-all border border-orange-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{suggestion.itemName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{suggestion.reason}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Qty: {suggestion.suggestedQuantity}</span>
                      <span>₹{suggestion.estimatedCost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <span className="text-2xl mb-2 block">✨</span>
                  <p className="text-sm">No urgent purchase suggestions</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Bill Advisor */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <span className="text-3xl text-indigo-600">📈</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Smart Bill Advisor</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 gap-4">
                  <ActivityItem 
                    title="Today's Sales"
                    amount={activityMetrics.dailySales}
                    icon="💰"
                    color="green"
                  />
                  <ActivityItem 
                    title="Monthly Revenue"
                    amount={activityMetrics.monthlySales}
                    icon="📆"
                    color="indigo"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Top Selling Medicines</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analyticsData.topSellingMedicines.length > 0 ? (
                    analyticsData.topSellingMedicines.map((medicine, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{medicine.name}</span>
                        <span className="text-sm text-indigo-600 font-semibold">{medicine.quantity} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No sales data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Advanced Analytics Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <span className="text-3xl text-purple-600">📊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton 
              label="Sales Report"
              icon="💰"
              description="Daily/Weekly/Monthly sales trends"
              onClick={() => navigate("/medicine-sales-summary")}
              gradient="from-green-400 to-blue-400"
            />
            <ActionButton 
              label="Inventory Report"
              icon="📦"
              description="Stock levels & valuation"
              onClick={() => navigate("/view-inventory")}
              gradient="from-teal-400 to-cyan-400"
            />
            <ActionButton 
              label="Purchase History"
              icon="🕰️"
              description="Detailed purchase records"
              onClick={() => navigate("/purchase-history")}
              gradient="from-purple-500 to-pink-500"
            />
            <ActionButton 
              label="Generate Bill"
              icon="🧾"
              description="Create new purchase/sell/return bills"
              onClick={() => navigate("/generate-bill")}
              gradient="from-blue-400 to-purple-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
const MetricItem = ({ label, value, icon, color, onClick }) => {
  const colorClasses = {
    teal: { bg: "bg-teal-100", text: "text-teal-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
    rose: { bg: "bg-rose-100", text: "text-rose-600" }
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <span className={`text-2xl ${colorClasses[color].bg} p-2 rounded-lg ${colorClasses[color].text}`}>
          {icon}
        </span>
        <span className="text-gray-700">{label}</span>
      </div>
      <span className={`text-xl font-bold ${colorClasses[color].text}`}>{value || 0}</span>
    </div>
  );
};

const ActivityItem = ({ title, amount, icon, color }) => {
  const colorClasses = {
    green: { bg: "bg-green-50", text: "text-green-600", hover: "hover:bg-green-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:bg-indigo-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "hover:bg-purple-100" }
  };

  return (
    <div className={`p-4 ${colorClasses[color].bg} rounded-xl ${colorClasses[color].hover} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`text-2xl ${colorClasses[color].text}`}>{icon}</span>
          <span className="text-gray-700">{title}</span>
        </div>
        <span className={`text-lg font-semibold ${colorClasses[color].text}`}>{amount}</span>
      </div>
    </div>
  );
};

const ActionButton = ({ label, icon, description, onClick, gradient }) => (
  <button 
    onClick={onClick}
    className={`group relative flex flex-col items-center p-6 rounded-xl bg-gradient-to-br ${gradient} 
      hover:shadow-xl transition-all transform hover:scale-[1.02] min-h-[180px] justify-between
      overflow-hidden`}
  >
    <div className="absolute inset-0 bg-black/5 transition-all group-hover:bg-black/10"></div>
    <div className="z-10 w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl text-white drop-shadow-md">{icon}</span>
        <span className="text-white/80 text-sm">View Report →</span>
      </div>
      <div className="text-left">
        <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
        <p className="text-sm text-white/90 leading-tight">{description}</p>
      </div>
    </div>
  </button>
);

export default Dashboard;
