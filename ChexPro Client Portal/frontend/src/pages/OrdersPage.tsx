import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate, getStatusColor, formatStatus } from "../lib/utils";
import { Plus, Search, Filter } from "lucide-react";

interface Order {
  id: string; orderNumber: string; status: string; positionTitle: string | null;
  referenceNumber: string | null; createdAt: string;
  applicant: { firstName: string; lastName: string; email: string } | null;
  package: { name: string } | null;
}

interface OrdersResponse {
  data: Order[]; meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUSES = ["", "draft", "submitted", "in_progress", "completed", "requires_action", "cancelled"];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders", { search, status, page }],
    queryFn: async () => {
      const res = await api.get("/orders", { params: { search: search || undefined, status: status || undefined, page, limit: 20 } });
      return { data: res.data.data, meta: res.data.meta };
    },
    placeholderData: (prev) => prev,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button onClick={() => navigate("/orders/new")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, order #, position..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUSES.map(s => <option key={s} value={s}>{s ? formatStatus(s) : "All Statuses"}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Order #</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Position</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Package</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            )}
            {!isLoading && orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                <td className="px-6 py-4">
                  {order.applicant ? (
                    <div>
                      <p className="font-medium">{order.applicant.firstName} {order.applicant.lastName}</p>
                      <p className="text-xs text-gray-400">{order.applicant.email}</p>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-gray-700">{order.positionTitle ?? "—"}</td>
                <td className="px-6 py-4 text-gray-500">{order.package?.name ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{formatStatus(order.status)}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No orders found.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
