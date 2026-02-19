import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import { Shield, AlertTriangle, Clock, Users, Activity, CheckCircle, XCircle, Eye, Bell, RefreshCw } from "lucide-react";

interface MonitoringEnrollment {
  id: string;
  status: string;
  monitoringType: string;
  employeeId: string | null;
  enrolledAt: string;
  lastCheckAt: string | null;
  nextCheckAt: string | null;
  applicant: { firstName: string; lastName: string; email: string };
  originalOrder: { orderNumber: string; positionTitle: string } | null;
  _count: { alerts: number };
}

interface MonitoringAlert {
  id: string;
  status: string;
  severity: string;
  alertType: string;
  description: string;
  createdAt: string;
  actionTaken: string | null;
  enrollment: {
    applicant: { firstName: string; lastName: string; email: string };
    originalOrder: { orderNumber: string } | null;
  };
  reviewedByUser: { firstName: string; lastName: string } | null;
}

interface EnrollmentsResponse {
  items: MonitoringEnrollment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface AlertsResponse {
  items: MonitoringAlert[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"enrollments" | "alerts">("enrollments");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery<EnrollmentsResponse>({
    queryKey: ["monitoring-enrollments", { status: statusFilter, page }],
    queryFn: async () => {
      const res = await api.get("/monitoring/enrollments", { params: { status: statusFilter || undefined, page, limit: 20 } });
      return res.data.data;
    },
  });

  const { data: alertsData, isLoading: loadingAlerts } = useQuery<AlertsResponse>({
    queryKey: ["monitoring-alerts", { severity: severityFilter, page }],
    queryFn: async () => {
      const res = await api.get("/monitoring/alerts", { params: { severity: severityFilter || undefined, page, limit: 20 } });
      return res.data.data;
    },
  });

  const { data: criticalCount } = useQuery<{ count: number }>({
    queryKey: ["monitoring-alerts-critical"],
    queryFn: async () => {
      const res = await api.get("/monitoring/alerts/critical");
      return res.data.data;
    },
  });

  const reviewAlertMutation = useMutation({
    mutationFn: async ({ alertId, status, actionTaken }: { alertId: string; status: string; actionTaken?: string }) => {
      const res = await api.post(`/monitoring/alerts/${alertId}/review`, { status, actionTaken });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["monitoring-alerts-critical"] });
    },
  });

  const enrollments = enrollmentsData?.items ?? [];
  const alerts = alertsData?.items ?? [];
  const metaEnroll = enrollmentsData?.pagination;
  const metaAlerts = alertsData?.pagination;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Continuous Monitoring</h1>
        <p className="text-gray-500 mt-1">Monitor enrolled candidates for ongoing compliance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enrollmentsData?.pagination?.total ?? 0}</p>
              <p className="text-sm text-gray-500">Active Enrollments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{criticalCount?.count ?? 0}</p>
              <p className="text-sm text-gray-500">Critical Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {alertsData?.pagination?.total ?? 0}
              </p>
              <p className="text-sm text-gray-500">Total Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter((e) => e.status === "active").length}
              </p>
              <p className="text-sm text-gray-500">Active Monitors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "enrollments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Enrollments
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "alerts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Alerts
        </button>
      </div>

      {/* Enrollments Tab */}
      {activeTab === "enrollments" && (
        <>
          <div className="flex gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Employee ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Alerts</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Enrolled</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Next Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingEnrollments && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                )}
                {!loadingEnrollments && enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{enrollment.applicant.firstName} {enrollment.applicant.lastName}</p>
                        <p className="text-xs text-gray-400">{enrollment.applicant.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{enrollment.employeeId ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{enrollment.monitoringType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[enrollment.status] || "bg-gray-100 text-gray-800"}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {enrollment._count.alerts > 0 ? (
                        <span className="text-red-600 font-medium">{enrollment._count.alerts}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(enrollment.enrolledAt)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {enrollment.nextCheckAt ? formatDate(enrollment.nextCheckAt) : "—"}
                    </td>
                  </tr>
                ))}
                {!loadingEnrollments && enrollments.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No enrollments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <>
          <div className="flex gap-3 mb-4">
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="space-y-3">
            {loadingAlerts && <div className="text-center py-8 text-gray-400">Loading...</div>}
            {!loadingAlerts && alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[alert.severity] || "bg-gray-100 text-gray-800"}`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{alert.alertType}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === "new" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{alert.enrollment.applicant.firstName} {alert.enrollment.applicant.lastName}</span>
                      {alert.enrollment.originalOrder && (
                        <span>Order: {alert.enrollment.originalOrder.orderNumber}</span>
                      )}
                      <span>{formatDate(alert.createdAt)}</span>
                      {alert.reviewedByUser && (
                        <span>Reviewed by: {alert.reviewedByUser.firstName} {alert.reviewedByUser.lastName}</span>
                      )}
                    </div>
                  </div>
                  {alert.status === "new" && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => reviewAlertMutation.mutate({ alertId: alert.id, status: "actioned", actionTaken: "Alert addressed" })}
                        disabled={reviewAlertMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Address
                      </button>
                      <button
                        onClick={() => reviewAlertMutation.mutate({ alertId: alert.id, status: "dismissed" })}
                        disabled={reviewAlertMutation.isPending}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loadingAlerts && alerts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No alerts found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
