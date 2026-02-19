import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, get, post } from "../lib/api";
import { formatDate, formatStatus } from "../lib/utils";
import { AlertTriangle, Eye, Send, CheckCircle, XCircle, Clock, FileText, ChevronRight, RefreshCw } from "lucide-react";
import { useMemo } from "react";

interface AdverseAction {
  id: string;
  status: string;
  preNoticeSentAt: string | null;
  preNoticeMethod: string | null;
  waitingPeriodEnd: string | null;
  candidateResponse: string | null;
  candidateResponseAt: string | null;
  finalNoticeSentAt: string | null;
  finalDecision: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    positionTitle: string | null;
    applicant: { firstName: string; lastName: string; email: string } | null;
  };
  documents: Array<{
    id: string;
    documentType: string;
    sentTo: string | null;
    sentAt: string | null;
    deliveryStatus: string | null;
  }>;
}

interface AdverseActionsResponse {
  items: AdverseAction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const STATUS_LABELS: Record<string, string> = {
  initiated: "Initiated",
  pre_notice_sent: "Pre-Notice Sent",
  waiting_period: "Waiting Period",
  candidate_responded: "Candidate Responded",
  final_notice_sent: "Final Notice Sent",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  initiated: "bg-yellow-100 text-yellow-800",
  pre_notice_sent: "bg-blue-100 text-blue-800",
  waiting_period: "bg-purple-100 text-purple-800",
  candidate_responded: "bg-indigo-100 text-indigo-800",
  final_notice_sent: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function AdverseActionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<AdverseActionsResponse>({
    queryKey: ["adverse-actions", { status, page }],
    queryFn: async () => {
      const res = await api.get("/adverse-actions", { params: { status: status || undefined, page, limit: 20 } });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  const actions = data?.items ?? [];
  const meta = data?.pagination;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Adverse Actions</h1>
        <p className="text-gray-500 mt-1">Manage FCRA-compliant adverse action processes</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Order #</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Position</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Pre-Notice</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            )}
            {!isLoading && actions.map((action) => (
              <tr key={action.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{action.order?.orderNumber}</td>
                <td className="px-6 py-4">
                  {action.order?.applicant ? (
                    <div>
                      <p className="font-medium">{action.order.applicant.firstName} {action.order.applicant.lastName}</p>
                      <p className="text-xs text-gray-400">{action.order.applicant.email}</p>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-gray-700">{action.order?.positionTitle ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[action.status] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[action.status] || action.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {action.preNoticeSentAt ? formatDate(action.preNoticeSentAt) : "—"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/adverse-actions/${action.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && actions.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No adverse actions found.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
