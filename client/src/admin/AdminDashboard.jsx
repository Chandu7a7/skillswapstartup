// client/src/admin/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Bar, Doughnut } from 'react-chartjs-2'; // 1. Import chart components
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// 2. Register the components Chart.js needs to draw the charts
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [userSignupsData, setUserSignupsData] = useState(null);
  const [swapDistributionData, setSwapDistributionData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [statsRes, signupsRes, swapsRes] = await Promise.all([
          fetch('/api/admin/stats', { credentials: 'include' }),
          fetch('/api/admin/stats/user-signups', { credentials: 'include' }),
          fetch('/api/admin/stats/swap-distribution', { credentials: 'include' }),
        ]);

        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data); else throw new Error(statsData.message);
        
        const signupsData = await signupsRes.json();
        if (signupsData.success) {
            // Format data for the Bar chart
            const labels = signupsData.data.map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}));
            const data = signupsData.data.map(d => d.count);
            setUserSignupsData({
                labels,
                datasets: [{ label: 'New Users', data, backgroundColor: 'rgba(59, 130, 246, 0.5)' }]
            });
        } else throw new Error(signupsData.message);

        const swapsData = await swapsRes.json();
        if(swapsData.success){
            // Format data for the Doughnut chart
            const labels = swapsData.data.map(d => d._id);
            const data = swapsData.data.map(d => d.count);
            setSwapDistributionData({
                labels,
                datasets: [{ label: 'Swaps', data, backgroundColor: ['#34D399', '#FBBF24', '#EF4444', '#9CA3AF'] }]
            });
        } else throw new Error(swapsData.message);

      } catch (error) {
        toast.error(error.message || "Failed to fetch dashboard data.");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">Total Users: <span className="font-bold text-2xl">{stats.users}</span></div>
          <div className="bg-white p-6 rounded-lg shadow border">Total Swaps: <span className="font-bold text-2xl">{stats.swaps}</span></div>
          <div className="bg-white p-6 rounded-lg shadow border">Total Sessions: <span className="font-bold text-2xl">{stats.sessions}</span></div>
        </div>
      ) : <p>Loading stats...</p>}

      {/* --- NEW: CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">New User Signups (Last 7 Days)</h2>
            {userSignupsData ? <Bar data={userSignupsData} /> : <p>Loading chart data...</p>}
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Skill Swap Status Distribution</h2>
            {swapDistributionData ? <Doughnut data={swapDistributionData} /> : <p>Loading chart data...</p>}
        </div>
      </div>
    </div>
  );
}