import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import { AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle, Send, User, ChevronRight } from "lucide-react";

interface Dispute {
  id: string;
  status: string;
  disputedSection: string | null;
  disputeReason: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  order: { id: string; orderNumber: string; positionTitle: string | null };
  applicant: { firstName: string; lastName: string; email: string };
  assignedUser: { firstName: string; lastName: string; email: string } | null;
  _count: { communications: number };
}

interface DisputeDetail extends Dispute {
  communications: Array<{
    id: string;
    fromParty: string;
    message: string;
    sentAt: string;
    attachments: string[] | null;
  }>;
}

interface DisputesResponse {
  items: Dispute[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface Stats {
  total: number;
  open: number;
  resolved: number;
  avgResolutionDays: number;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function DisputesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: stats } = useQuery<Stats>({
    queryKey: ["disputes-stats"],
    queryFn: async () => {
      const res = await api.get("/disputes/stats/summary");
      return res.data.data;
    },
  });

  const { data: disputesData, isLoading } = useQuery<DisputesResponse>({
    queryKey: ["disputes", { status, page }],
    queryFn: async () => {
      const res = await api.get("/disputes", { params: { status: status || undefined, page, limit: 20 } });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  const { data: selectedDisputeData, isLoading: loadingDetail } = useQuery<DisputeDetail>({
    queryKey: ["dispute-detail", selectedDispute],
    queryFn: async () => {
      const res = await api.get(`/disputes/${selectedDispute}`);
      return res.data.data;
    },
    enabled: !!selectedDispute,
  });

  const updateDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, data }: { disputeId: string; data: { status?: string; resolutionNotes?: string } }) => {
      const res = await api.put(`/disputes/${disputeId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute-detail", selectedDispute] });
      queryClient.invalidateQueries({ queryKey: ["disputes-stats"] });
    },
  });

  const addCommunicationMutation = useMutation({
    mutationFn: async ({ disputeId, message }: { disputeId: string; message: string }) => {
      const res = await api.post(`/disputes/${disputeId}/communications`, { message });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute-detail", selectedDispute] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      setNewMessage("");
    },
  });

  const disputes = disputesData?.items ?? [];
  const meta = disputesData?.pagination;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">Manage candidate disputes and communications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
              <p className="text-sm text-gray-500">Total Disputes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.open ?? 0}</p>
              <p className="text-sm text-gray-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.resolved ?? 0}</p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgResolutionDays ?? 0}</p>
              <p className="text-sm text-gray-500">Avg Days to Resolve</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1">
          <div className="flex gap-3 mb-4">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Order #</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Submitted</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                )}
                {!isLoading && disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedDispute === dispute.id ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedDispute(dispute.id)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{dispute.order?.orderNumber}</td>
                    <td className="px-6 py-4">
                      {dispute.applicant ? (
                        <div>
                          <p className="font-medium">{dispute.applicant.firstName} {dispute.applicant.lastName}</p>
                          <p className="text-xs text-gray-400">{dispute.applicant.email}</p>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[dispute.status] || "bg-gray-100 text-gray-800"}`}>
                        {dispute.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(dispute.submittedAt)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {dispute.assignedUser ? (
                        <span>{dispute.assignedUser.firstName} {dispute.assignedUser.lastName}</span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && disputes.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No disputes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDispute && (
          <div className="w-96 bg-white rounded-xl border border-gray-200 p-4 h-fit">
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : selectedDisputeData && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Dispute Details</h3>
                  <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Order: {selectedDisputeData.order?.orderNumber}</p>
                  <p className="text-sm text-gray-500">Position: {selectedDisputeData.order?.positionTitle ?? "—"}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Dispute Reason</p>
                  <p className="text-sm text-gray-900">{selectedDisputeData.disputeReason}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedDisputeData.status]}`}>
                    {selectedDisputeData.status.replace("_", " ")}
                  </span>
                </div>

                {/* Status Actions */}
                {selectedDisputeData.status === "submitted" && (
                  <button
                    onClick={() => updateDisputeMutation.mutate({ disputeId: selectedDispute, data: { status: "under_review" } })}
                    className="w-full mb-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Start Review
                  </button>
                )}
                {selectedDisputeData.status === "under_review" && (
                  <button
                    onClick={() => updateDisputeMutation.mutate({ disputeId: selectedDispute, data: { status: "resolved" } })}
                    className="w-full mb-3 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}

                {/* Communications */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">Communications</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedDisputeData.communications?.map((comm) => (
                      <div key={comm.id} className={`p-2 rounded-lg ${comm.fromParty === "client" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"}`}>
                        <p className="text-xs text-gray-500 mb-1">{comm.fromParty} • {formatDate(comm.sentAt)}</p>
                        <p className="text-sm text-gray-900">{comm.message}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Message */}
                  {selectedDisputeData.status !== "resolved" && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Add a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMessage.trim()) {
                            addCommunicationMutation.mutate({ disputeId: selectedDispute, message: newMessage });
                          }
                        }}
                      />
                      <button
                        onClick={() => addCommunicationMutation.mutate({ disputeId: selectedDispute, message: newMessage })}
                        disabled={!newMessage.trim() || addCommunicationMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
