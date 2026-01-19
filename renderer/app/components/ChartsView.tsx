'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Analytics } from '../../../shared/types';

const COLORS = {
  succeeded: '#10b981', // green-500
  failed: '#ef4444', // red-500
  running: '#3b82f6', // blue-500
  canceled: '#f59e0b', // amber-500
  timed_out: '#f97316', // orange-500
};

const ChartsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await window.electronAPI.getAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Failed to load analytics</div>
      </div>
    );
  }

  const { overview, statusBreakdown, dailyRuns, agentPerformance } = analytics;

  // Format pie chart data
  const pieData = statusBreakdown.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  // Format daily runs data for line chart
  const lineData = dailyRuns.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    succeeded: day.succeeded,
    failed: day.failed,
    timed_out: day.timed_out,
  }));

  // Format agent performance data for bar chart
  const barData = agentPerformance.slice(0, 10).map((agent) => ({
    name: agent.agent_name.length > 20 ? agent.agent_name.substring(0, 17) + '...' : agent.agent_name,
    total: agent.total_runs,
    success: agent.successful_runs,
    failed: agent.failed_runs,
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">Performance insights and statistics</p>
          </div>
          <button onClick={loadAnalytics} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Runs</div>
              <div className="text-3xl font-semibold text-gray-900">{overview.total}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Succeeded</div>
              <div className="text-3xl font-semibold text-green-600">{overview.succeeded}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Failed</div>
              <div className="text-3xl font-semibold text-red-600">{overview.failed}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Running</div>
              <div className="text-3xl font-semibold text-blue-600">{overview.running}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Canceled</div>
              <div className="text-3xl font-semibold text-amber-600">{overview.canceled}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm font-medium text-gray-500 mb-1">Timed Out</div>
              <div className="text-3xl font-semibold text-orange-600">{overview.timed_out}</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution - Pie Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Daily Runs Trend - Line Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Runs (Last 30 Days)</h3>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="succeeded" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="timed_out" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-8">
            {/* Agent Performance - Bar Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance (Top 10)</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#10b981" name="Successful" />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No agent data available
                </div>
              )}
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Agent Stats</h3>
            {agentPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Agent</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Runs</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Success Rate</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Avg Duration</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Last Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.map((agent, index) => {
                      const successRate = agent.total_runs > 0
                        ? Math.round((agent.successful_runs / agent.total_runs) * 100)
                        : 0;
                      const avgDuration = agent.average_duration_seconds
                        ? Math.round(agent.average_duration_seconds)
                        : 0;

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{agent.agent_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">{agent.total_runs}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={successRate >= 80 ? 'text-green-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                              {successRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {avgDuration > 0 ? `${avgDuration}s` : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {agent.last_run ? new Date(agent.last_run).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No agent performance data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsView;
