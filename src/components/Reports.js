// In MedicineSalesSummary.js - Full corrected code
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

import API_BASE_URL from '../config/api';

// Create axios instance with interceptors
const api = axiosInstance.create({
  baseURL: `${API_BASE_URL}/api/bills/medicine-sales`
});

const MedicineSalesSummary = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    medicineName: '',
    startDate: '',
    endDate: '',
    partyName: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add request interceptor
  useEffect(() => {
    const interceptor = api.interceptors.request.use(config => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, []);

  // Authorization check
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please login to access this page');
      navigate('/login');
    }
  }, [navigate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      if (!filters.medicineName) {
        toast.error('Medicine name is required');
        return;
      }

      const params = {
        medicineName: filters.medicineName.trim(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.partyName && { partyName: filters.partyName.trim() })
      };

      const res = await api.get('/bills/medicine-sales', { params });
      
      // Transform data for display
      const transformedData = {
        totalQuantity: res.data.totalSales,
        salesByParty: res.data.salesDetails.reduce((acc, sale) => {
          acc[sale.partyName] = {
            quantity: sale.quantity,
            amount: sale.mrp * sale.quantity,
            discount: sale.discount
          };
          return acc;
        }, {}),
        salesByDate: res.data.salesDetails.reduce((acc, sale) => {
          const date = new Date(sale.date).toISOString().split('T')[0];
          acc[date] = {
            quantity: sale.quantity,
            amount: sale.mrp * sale.quantity,
            discount: sale.discount
          };
          return acc;
        }, {})
      };

      setResult(transformedData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again');
      localStorage.removeItem('authToken');
      navigate('/login');
    } else {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-blue-600">Medicine Sales Summary</h1>
      
      {/* Filter inputs and results display */}
    </div>
  );
};

export default MedicineSalesSummary;
