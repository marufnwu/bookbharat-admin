'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Mail, MousePointer } from 'lucide-react';

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

interface FunnelData {
  steps: FunnelStep[];
  overall_recovery_rate: number;
  overall_conversion_rate: number;
  period: { from: string; to: string };
}

interface DropoffData {
  stages: Array<{ stage: string; count: number; reason: string }>;
  total_dropoff: number;
  period: { from: string; to: string };
}

interface TrendData {
  daily_trends: Array<{ date: string; abandoned: number; recovered: number; recovery_rate: number }>;
  weekly_trends: Array<{ week: number; abandoned: number; recovered: number }>;
  summary: {
    total_abandoned: number;
    total_recovered: number;
    overall_recovery_rate: number;
    average_daily_abandoned: number;
    average_daily_recovered: number;
  };
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export const RecoveryFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'funnel' | 'dropoff' | 'trends'>('funnel');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1/admin';

  // Fetch funnel data
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['funnel'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/flow/funnel`);
      return response.data.data as FunnelData;
    }
  });

  // Fetch dropoff data
  const { data: dropoffData, isLoading: dropoffLoading } = useQuery({
    queryKey: ['dropoff'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/flow/dropoff`);
      return response.data.data as DropoffData;
    }
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/abandoned-carts/flow/trends`);
      return response.data.data as TrendData;
    }
  });

  // Funnel Tab Content
  const renderFunnel = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Recovery Rate</p>
              <p className="text-3xl font-bold text-green-600">{(funnelData?.overall_recovery_rate || 0).toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-blue-600">{(funnelData?.overall_conversion_rate || 0).toFixed(1)}%</p>
            </div>
            <ShoppingCart className="h-12 w-12 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Funnel</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={funnelData?.steps || []}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={190} />
            <Tooltip 
              formatter={(value) => `${value} carts`}
              contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel Steps Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Step</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Count</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {funnelData?.steps.map((step, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{step.name}</td>
                <td className="px-4 py-3 text-sm font-medium">{step.count.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${step.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{step.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Dropoff Tab Content
  const renderDropoff = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Dropoff</p>
              <p className="text-3xl font-bold text-red-600">{(dropoffData?.total_dropoff || 0).toLocaleString()}</p>
            </div>
            <TrendingDown className="h-12 w-12 text-red-400 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dropoff Rate</p>
              <p className="text-3xl font-bold text-orange-600">
                {funnelData && ((100 - funnelData.overall_recovery_rate).toFixed(1))}%
              </p>
            </div>
            <Users className="h-12 w-12 text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Dropoff Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dropoff Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dropoffData?.stages || []}
              dataKey="count"
              nameKey="stage"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dropoffData?.stages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} carts`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Dropoff Reasons */}
      <div className="grid grid-cols-1 gap-3">
        {dropoffData?.stages.map((stage, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                <p className="text-sm text-gray-600 mt-1">{stage.reason}</p>
              </div>
              <span className="text-lg font-bold text-gray-900">{stage.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Trends Tab Content
  const renderTrends = () => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Total Abandoned</p>
          <p className="text-2xl font-bold text-blue-600">{(trendData?.summary.total_abandoned || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Total Recovered</p>
          <p className="text-2xl font-bold text-green-600">{(trendData?.summary.total_recovered || 0).toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Recovery Rate</p>
          <p className="text-2xl font-bold text-purple-600">{(trendData?.summary.overall_recovery_rate || 0).toFixed(1)}%</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Avg Daily Abandoned</p>
          <p className="text-2xl font-bold text-orange-600">{(trendData?.summary.average_daily_abandoned || 0).toFixed(0)}</p>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Avg Daily Recovered</p>
          <p className="text-2xl font-bold text-pink-600">{(trendData?.summary.average_daily_recovered || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData?.daily_trends || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="abandoned"
              stroke="#ef4444"
              strokeWidth={2}
              name="Abandoned"
            />
            <Line
              type="monotone"
              dataKey="recovered"
              stroke="#10b981"
              strokeWidth={2}
              name="Recovered"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recovery Rate Trend */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Rate Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData?.daily_trends || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => {
              if (typeof value === 'number') {
                return `${value.toFixed(1)}%`;
              }
              return value;
            }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="recovery_rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Recovery Rate %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const isLoading = funnelLoading || dropoffLoading || trendLoading;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('funnel')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'funnel'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Recovery Funnel
          </div>
        </button>
        <button
          onClick={() => setActiveTab('dropoff')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'dropoff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Dropoff Analysis
          </div>
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'trends'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </div>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading recovery flow data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'funnel' && renderFunnel()}
          {activeTab === 'dropoff' && renderDropoff()}
          {activeTab === 'trends' && renderTrends()}
        </>
      )}
    </div>
  );
};

export default RecoveryFlow;
