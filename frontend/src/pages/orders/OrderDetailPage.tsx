import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "../../lib/api";
import { formatDate, formatDateTime, getStatusColor, formatStatus } from "../../lib/utils";
import { 
  ChevronLeft, Download, X, RefreshCw, FileText, 
  Clock, CheckCircle, AlertTriangle, Loader2, User, 
  Building, Phone, Mail, MapPin, Calendar, Package
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  positionTitle: string | null;
  department: string | null;
  referenceNumber: string | null;
  totalPrice: string | number;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  package?: {
    id: string;
    name: string;
    services?: string[];
  } | null;
  applicant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    currentAddress: any;
    dateOfBirth: string | null;
    portalCompleted: boolean;
  } | null;
  documents?: Array<{
    id: string;
    documentType: string;
    fileName: string;
    createdAt: string;
  }>;
}

interface TimelineEntry {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  createdBy?: string;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [noteText, setNoteText] = useState("");

  // Fetch order details
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => get(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch timeline
  const { data: timeline = [] } = useQuery<TimelineEntry[]>({
    queryKey: ["order", id, "timeline"],
    queryFn: () => get(`/orders/${id}/timeline`),
    enabled: !!id,
  });

  // Submit order mutation
  const submitOrder = useMutation({
    mutationFn: () => post(`/orders/${id}/submit`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  // Cancel order mutation
  const cancelOrder = useMutation({
    mutationFn: (reason: string) => post(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      setShowCancelModal(false);
      setCancelReason("");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Order not found</p>
          <button onClick={() => navigate("/orders")} className="text-sm text-blue-600 hover:underline mt-2">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    awaiting_applicant: "bg-yellow-100 text-yellow-700",
    data_verification: "bg-purple-100 text-purple-700",
    in_progress: "bg-blue-100 text-blue-700",
    pending_review: "bg-orange-100 text-orange-700",
    requires_action: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const canCancel = !["completed", "cancelled"].includes(order.status);
  const canSubmit = order.status === "draft";
  const canDownload = order.status === "completed";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate("/orders")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                {formatStatus(order.status)}
              </span>
              <span className="text-lg font-semibold text-gray-900">${Number(order.totalPrice).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={() => submitOrder.mutate()}
                disabled={submitOrder.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Position</dt>
                <dd className="font-medium mt-1">{order.positionTitle || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Department</dt>
                <dd className="font-medium mt-1">{order.department || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reference #</dt>
                <dd className="font-medium mt-1">{order.referenceNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Package</dt>
                <dd className="font-medium mt-1">{order.package?.name || "Custom"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium mt-1">{formatDateTime(order.createdAt)}</dd>
              </div>
              {order.submittedAt && (
                <div>
                  <dt className="text-gray-500">Submitted</dt>
                  <dd className="font-medium mt-1">{formatDateTime(order.submittedAt)}</dd>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <dt className="text-gray-500">Completed</dt>
                  <dd className="font-medium mt-1">{formatDateTime(order.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Applicant Card */}
          {order.applicant && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Applicant Information</h2>
                {order.applicant.portalCompleted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.applicant.firstName} {order.applicant.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{order.applicant.email || "No email"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {order.applicant.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {order.applicant.phone}
                    </div>
                  )}
                  {order.applicant.currentAddress && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {(order.applicant.currentAddress as any)?.city}, {(order.applicant.currentAddress as any)?.province}
                    </div>
                  )}
                </div>

                {/* Documents */}
                {order.documents && order.documents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {order.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{doc.documentType}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(doc.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                {timeline.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            
            {canDownload && (
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // Placeholder - would call report endpoint
                  alert("Report download coming soon");
                }}
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                Cancel Order
              </button>
            )}

            <button
              onClick={() => setShowNoteModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Request Update
            </button>

            {order.status === "completed" && (
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // Placeholder - would call rescreen endpoint
                  alert("Re-screen coming soon");
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Re-screen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                No, Keep Order
              </button>
              <button
                onClick={() => cancelOrder.mutate(cancelReason)}
                disabled={cancelOrder.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {cancelOrder.isPending ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Update</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your message or question..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Would submit note here
                  setShowNoteModal(false);
                  setNoteText("");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
