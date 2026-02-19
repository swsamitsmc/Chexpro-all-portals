import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Building, Clock, FileText, Users } from 'lucide-react';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  priority: number;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_phone: string;
  client_id: string;
  client_name: string;
  sla_due_date: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-warning/20 text-warning' },
  in_progress: { label: 'In Progress', color: 'bg-primary/20 text-primary' },
  pending_review: { label: 'Pending Review', color: 'bg-accent/20 text-accent' },
  requires_action: { label: 'Requires Action', color: 'bg-destructive/20 text-destructive' },
  completed: { label: 'Completed', color: 'bg-success/20 text-success' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) {
          setOrder(json.data.order);
          setServices(json.data.services || []);
          setAssignments(json.data.assignments || []);
          setStatusHistory(json.data.statusHistory || []);
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder({ ...order, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-muted-foreground">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/orders" className="p-2 rounded hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <span className={`px-2 py-1 rounded text-sm font-medium ${STATUS_CONFIG[order.status]?.color || 'bg-muted'}`}>
              {STATUS_CONFIG[order.status]?.label || order.status}
            </span>
          </div>
          <p className="text-muted-foreground">Candidate: {order.candidate_first_name} {order.candidate_last_name}</p>
        </div>
        <div className="flex gap-2">
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              onClick={() => updateStatus(order.status === 'pending' ? 'in_progress' : 'completed')}
              disabled={updating}
              className="btn btn-primary"
            >
              {updating ? 'Updating...' : order.status === 'pending' ? 'Start Processing' : 'Mark Complete'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Info */}
        <div className="space-y-6">
          {/* Candidate Info */}
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              Candidate Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{order.candidate_first_name} {order.candidate_last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.candidate_email}</p>
              </div>
              {order.candidate_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.candidate_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              Client Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{order.client_name}</p>
              </div>
            </div>
          </div>

          {/* SLA & Priority */}
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">SLA Due Date</p>
                <p className={`font-medium ${order.sla_due_date && new Date(order.sla_due_date) < new Date() ? 'text-destructive' : ''}`}>
                  {order.sla_due_date ? formatDate(order.sla_due_date) : 'Not set'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Priority</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.priority === 1 ? 'bg-destructive text-white' : order.priority === 2 ? 'bg-warning text-white' : 'bg-muted'}`}>
                  P{order.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Services & Status */}
        <div className="space-y-6">
          {/* Services */}
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Services ({services.length})
            </h3>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-sm">No services found</p>
            ) : (
              <div className="space-y-2">
                {services.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{service.service_name || service.name || 'Service'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${service.status === 'completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {service.status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status History */}
          <div className="card">
            <h3 className="font-semibold mb-4">Status History</h3>
            {statusHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history available</p>
            ) : (
              <div className="space-y-3">
                {statusHistory.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{item.fromStatus}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-medium">{item.toStatus}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Assignments */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              Assignments
            </h3>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assignments</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment, idx) => (
                  <div key={idx} className="p-3 rounded bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">
                        {assignment.admin?.firstName} {assignment.admin?.lastName}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs ${assignment.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted'}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{assignment.assignmentType}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}