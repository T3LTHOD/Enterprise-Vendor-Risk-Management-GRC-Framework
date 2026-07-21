import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface ComplianceDashboardProps {
  organizationId: string;
  frameworkId: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  organizationId,
  frameworkId,
}) => {
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [controlData, setControlData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, assessmentRes] = await Promise.all([
          axios.get(`/api/compliance/status/${organizationId}/${frameworkId}`),
          axios.get(`/api/compliance/assessments/${organizationId}`),
        ]);

        setComplianceStatus(statusRes.data);
        setControlData(assessmentRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, frameworkId]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const complianceScore = complianceStatus?.compliance_score || 0;
  const controlBreakdown = [
    {
      name: 'Fully Effective',
      value: complianceStatus?.fully_effective_controls || 0,
      fill: '#10b981',
    },
    {
      name: 'Partially Effective',
      value: complianceStatus?.partially_effective_controls || 0,
      fill: '#f59e0b',
    },
    {
      name: 'Ineffective',
      value: complianceStatus?.ineffective_controls || 0,
      fill: '#ef4444',
    },
  ];

  return (
    <div className="w-full bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Compliance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium">Compliance Score</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{complianceScore}%</p>
          <p className="text-gray-500 text-sm mt-2">Overall framework compliance</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium">Total Controls</h3>
          <p className="text-4xl font-bold text-gray-800 mt-2">
            {complianceStatus?.total_controls}
          </p>
          <p className="text-gray-500 text-sm mt-2">Across framework</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tested Controls</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {complianceStatus?.tested_controls}
          </p>
          <p className="text-gray-500 text-sm mt-2">Recently validated</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium">Evidence Missing</h3>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {(complianceStatus?.total_controls || 0) - (complianceStatus?.tested_controls || 0)}
          </p>
          <p className="text-gray-500 text-sm mt-2">Require documentation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Control Effectiveness</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={controlBreakdown} cx="50%" cy="50%" labelLine={false} label>
                {controlBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">7-Day Compliance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { day: 'Mon', score: 85 },
              { day: 'Tue', score: 86 },
              { day: 'Wed', score: 85 },
              { day: 'Thu', score: 87 },
              { day: 'Fri', score: 88 },
              { day: 'Sat', score: 88 },
              { day: 'Sun', score: complianceScore },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Control Assessments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Assessment ID</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Completion</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {controlData.slice(0, 5).map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.id}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.completion_percentage}%` }}></div>
                    </div>
                  </td>
                  <td className="px-4 py-2">{new Date(item.started_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
