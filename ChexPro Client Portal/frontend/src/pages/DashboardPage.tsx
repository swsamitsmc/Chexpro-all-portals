import { useQuery } from "@tanstack/react-query";
import { get } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { formatDate, getStatusColor, formatStatus } from "../lib/utils";
import { ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus } from "lucide-react";

interface DashboardStats {
  totalOrders: number; pendingOrders: number; completedThisMonth: number;
  requiresAction: number; ordersThisWeek: number; averageTurnaroundDays: number;
}

interface RecentOrder {
  id: string; orderNumber: string; status: string; positionTitle: string | null;
  createdAt: string; applicant: { firstName: string; lastName: string } | null;
  package: { name: string } | null;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => get("/dashboard/stats"),
  });

  const { data: recentOrders = [] } = useQuery<RecentOrder[]>({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () => get("/dashboard/recent-orders", { limit: 5 }),
  });

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending", value: stats?.pendingOrders ?? 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Completed This Month", value: stats?.completedThisMonth ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Requires Action", value: stats?.requiresAction ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-0.5">Welcome back, {user?.firstName}!</p>
        </div>
        <button onClick={() => navigate("/orders/new")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />New Order
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Avg turnaround */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Turnaround</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.averageTurnaroundDays ?? 0} <span className="text-base font-normal text-gray-500">days</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Orders This Week</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.ordersThisWeek ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <button onClick={() => navigate("/orders")} className="text-sm text-blue-600 hover:underline">View all</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Order #</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Position</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                <td className="px-6 py-4 font-medium">{order.applicant ? `${order.applicant.firstName} ${order.applicant.lastName}` : "—"}</td>
                <td className="px-6 py-4 text-gray-600">{order.positionTitle ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{formatStatus(order.status)}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No orders yet. <button onClick={() => navigate("/orders/new")} className="text-blue-600 hover:underline">Create your first order</button></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
