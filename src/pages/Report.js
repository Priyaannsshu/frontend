import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axios';
import { FaSearch, FaPrint, FaCalendarAlt } from 'react-icons/fa';

const Report = () => {
    const navigate = useNavigate();
    const [salesData, setSalesData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        medicineName: '',
        startDate: '',
        endDate: '',
        partyName: ''
    });

    const handleSearch = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login first');
                navigate('/login');
                return;
            }

            const response = await axiosInstance.get('/api/bills/medicine-sales', {
                params: searchParams,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSalesData(response.data);
            toast.success('Sales data fetched successfully');
        } catch (error) {
            console.error('Error fetching sales data:', error);
            toast.error(error.response?.data?.message || 'Error fetching sales data');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Medicine Sales Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                        <input
                            type="text"
                            value={searchParams.medicineName}
                            onChange={(e) => setSearchParams({ ...searchParams, medicineName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter medicine name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={searchParams.startDate}
                                onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={searchParams.endDate}
                                onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                        <input
                            type="text"
                            value={searchParams.partyName}
                            onChange={(e) => setSearchParams({ ...searchParams, partyName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter party name"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                        <FaSearch />
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {salesData && (
                <div className="bg-white rounded-lg shadow-md p-6 print:p-0">
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <h3 className="text-xl font-semibold text-gray-800">Sales Report Results</h3>
                        <button
                            onClick={handlePrint}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
                        >
                            <FaPrint />
                            Print Report
                        </button>
                    </div>

                    {/* Summary Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800">Total Quantity</h4>
                            <p className="text-2xl font-bold text-blue-900">{salesData.totalQuantity}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800">Total Amount</h4>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(salesData.totalAmount)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-purple-800">Total Discount</h4>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(salesData.totalDiscount)}</p>
                        </div>
                    </div>

                    {/* Sales by Party */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Sales by Party</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(salesData.salesByParty).map(([party, data]) => (
                                        <tr key={party} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{party}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.discount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sales by Date */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Sales by Date</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(salesData.salesByDate).map(([date, data]) => (
                                        <tr key={date} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(data.discount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print\\:p-0, .print\\:p-0 * {
                            visibility: visible;
                        }
                        .print\\:p-0 {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .print\\:hidden {
                            display: none;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default Report; 