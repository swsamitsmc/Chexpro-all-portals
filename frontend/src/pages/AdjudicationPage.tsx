import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import { Scale, Plus, Settings, Play, Eye, CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";
import { useMemo } from "react";

interface AdjudicationMatrix {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { rules: number; adjudications: number };
  createdByUser: { firstName: string; lastName: string } | null;
}

interface PendingAdjudication {
  id: string;
  automatedDecision: string;
  finalDecision: string | null;
  decidedAt: string;
  order: {
    id: string;
    orderNumber: string;
    positionTitle: string | null;
    status: string;
    createdAt: string;
    applicant: { firstName: string; lastName: string; email: string } | null;
  };
  matrix: { name: string } | null;
}

interface MatricesResponse {
  items: AdjudicationMatrix[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export default function AdjudicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"matrices" | "pending">("matrices");

  const { data: matricesData, isLoading: loadingMatrices } = useQuery<MatricesResponse>({
    queryKey: ["adjudication-matrices"],
    queryFn: async () => {
      const res = await api.get("/adjudication/matrices");
      return { items: res.data.data, pagination: res.data.meta };
    },
  });

  const { data: pendingData, isLoading: loadingPending } = useQuery<PendingAdjudication[]>({
    queryKey: ["adjudication-pending"],
    queryFn: async () => {
      const res = await api.get("/adjudication/pending");
      return res.data.data;
    },
  });

  const matrices = matricesData?.items ?? [];
  const pending = pendingData ?? [];

  const runMutation = useMutation({
    mutationFn: async ({ orderId, matrixId }: { orderId: string; matrixId?: string }) => {
      const res = await api.post("/adjudication/run", { orderId, matrixId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjudication-pending"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async ({ orderId, decision, notes }: { orderId: string; decision: string; notes?: string }) => {
      const res = await api.post(`/adjudication/order/${orderId}/override`, { decision, notes });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjudication-pending"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "auto_approve": return "bg-green-100 text-green-800";
      case "auto_reject": return "bg-red-100 text-red-800";
      case "manual_review": return "bg-yellow-100 text-yellow-800";
      case "conditional": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case "auto_approve": return "Auto Approve";
      case "auto_reject": return "Auto Reject";
      case "manual_review": return "Manual Review";
      case "conditional": return "Conditional";
      default: return decision;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adjudication</h1>
          <p className="text-gray-500 mt-1">Manage adjudication matrices and review pending cases</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("matrices")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "matrices"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Scale className="w-4 h-4 inline mr-2" />
          Matrices ({matrices.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Pending Review ({pending.length})
        </button>
      </div>

      {/* Matrices Tab */}
      {activeTab === "matrices" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Description</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Rules</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Used</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingMatrices && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loadingMatrices && matrices.map((matrix) => (
                <tr key={matrix.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{matrix.name}</td>
                  <td className="px-6 py-4 text-gray-500">{matrix.description ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${matrix.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {matrix.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{matrix._count.rules}</td>
                  <td className="px-6 py-4 text-gray-600">{matrix._count.adjudications}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(matrix.createdAt)}</td>
                </tr>
              ))}
              {!loadingMatrices && matrices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No matrices found. Create one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Review Tab */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {loadingPending && <div className="text-center py-8 text-gray-400">Loading...</div>}
          {!loadingPending && pending.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-gray-600">{item.order?.orderNumber}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDecisionColor(item.finalDecision || item.automatedDecision)}`}>
                      {getDecisionLabel(item.finalDecision || item.automatedDecision)}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {item.order?.applicant?.firstName} {item.order?.applicant?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{item.order?.positionTitle}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Matrix: {item.matrix?.name} • {formatDate(item.decidedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => overrideMutation.mutate({ orderId: item.order.id, decision: "auto_approve" })}
                    disabled={overrideMutation.isPending}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => overrideMutation.mutate({ orderId: item.order.id, decision: "auto_reject" })}
                    disabled={overrideMutation.isPending}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => navigate(`/orders/${item.order.id}`)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loadingPending && pending.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders pending manual review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
