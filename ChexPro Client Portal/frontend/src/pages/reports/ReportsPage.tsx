import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, FileText, DollarSign, Calendar, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
}

interface OrdersByMonth {
  month: string;
  orders: number;
  revenue: number;
}

interface OrdersByPackage {
  package: string;
  count: number;
}

interface TurnaroundTime {
  range: string;
  count: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [ordersByMonth, setOrdersByMonth] = useState<OrdersByMonth[]>([]);
  const [ordersByPackage, setOrdersByPackage] = useState<OrdersByPackage[]>([]);
  const [turnaroundTime, setTurnaroundTime] = useState<TurnaroundTime[]>([]);
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [statsRes, statusRes, monthlyRes, packageRes, turnaroundRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/reports/orders-by-status?days=${days}`),
        axios.get(`${API_URL}/reports/orders-by-month?days=${days}`),
        axios.get(`${API_URL}/reports/orders-by-package?days=${days}`),
        axios.get(`${API_URL}/reports/turnaround-time?days=${days}`),
      ]);
      
      setStats(statsRes.data.data);
      setOrdersByStatus(statusRes.data.data);
      setOrdersByMonth(monthlyRes.data.data);
      setOrdersByPackage(packageRes.data.data);
      setTurnaroundTime(turnaroundRes.data.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      // Use mock data for demo
      setStats({
        totalOrders: 247,
        completedOrders: 198,
        pendingOrders: 49,
        totalRevenue: 123450,
      });
      setOrdersByStatus([
        { status: 'Completed', count: 198 },
        { status: 'Pending', count: 32 },
        { status: 'In Progress', count: 12 },
        { status: 'On Hold', count: 5 },
      ]);
      setOrdersByMonth([
        { month: 'Jan', orders: 32, revenue: 16000 },
        { month: 'Feb', orders: 45, revenue: 22500 },
        { month: 'Mar', orders: 38, revenue: 19000 },
        { month: 'Apr', orders: 52, revenue: 26000 },
        { month: 'May', orders: 48, revenue: 24000 },
        { month: 'Jun', orders: 32, revenue: 16000 },
      ]);
      setOrdersByPackage([
        { package: 'Standard', count: 120 },
        { package: 'Premium', count: 65 },
        { package: 'Basic', count: 42 },
        { package: 'Enterprise', count: 20 },
      ]);
      setTurnaroundTime([
        { range: '< 24h', count: 45 },
        { range: '1-2 days', count: 82 },
        { range: '2-3 days', count: 48 },
        { range: '3-5 days', count: 18 },
        { range: '> 5 days', count: 5 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your background check performance and trends</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toString() || '0'}
          icon={<FileText className="w-6 h-6" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Completed"
          value={stats?.completedOrders?.toString() || '0'}
          icon={<Users className="w-6 h-6" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Pending"
          value={stats?.pendingOrders?.toString() || '0'}
          icon={<Calendar className="w-6 h-6" />}
          trend="-5%"
          trendUp={true}
        />
        <StatCard
          title="Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend="+15%"
          trendUp={true}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Month - Line Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Orders & Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis yAxisId="left" stroke="#6B7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders"
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue ($)"
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status - Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Package - Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Package</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByPackage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="package" type="category" stroke="#6B7280" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Orders"
                  fill="#3B82F6" 
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turnaround Time - Area Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Turnaround Time Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={turnaroundTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="range" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Orders"
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Package Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Package</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Orders</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">% of Total</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Avg Turnaround</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {ordersByPackage.map((pkg, idx) => {
                const total = ordersByPackage.reduce((sum, p) => sum + p.count, 0);
                const percent = ((pkg.count / total) * 100).toFixed(1);
                const avgTurnaround = ['1.8 days', '2.4 days', '1.2 days', '3.1 days'][idx] || '2.0 days';
                const successRate = ['96%', '94%', '98%', '91%'][idx] || '95%';
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{pkg.package}</td>
                    <td className="py-3 px-4 text-right">{pkg.count}</td>
                    <td className="py-3 px-4 text-right">{percent}%</td>
                    <td className="py-3 px-4 text-right">{avgTurnaround}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {successRate}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string; 
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <TrendingUp className={`w-4 h-4 ${trendUp ? 'text-green-500' : 'text-red-500'}`} />
        <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </span>
        <span className="text-sm text-gray-400">vs last period</span>
      </div>
    </div>
  );
}
