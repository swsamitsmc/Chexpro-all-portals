import { useState, useEffect } from 'react';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Assignment {
  id: string;
  orderId: string;
  assignmentType: string;
  priority: number;
  assignedAt: string;
  notes: string | null;
}

export function WorkloadWidget() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/my-workload', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setAssignments(json.data);
      } catch (err) {
        console.error('Failed to fetch workload:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const priorityColors: Record<number, string> = {
    1: 'bg-destructive/20 text-destructive',
    2: 'bg-warning/20 text-warning',
    3: 'bg-accent/20 text-accent',
  };

  const typeLabels: Record<string, string> = {
    processing: 'Processing',
    review: 'Review',
    qa: 'QA Review',
    adjudication: 'Adjudication',
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          My Workload
        </h3>
        {assignments.length > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {assignments.length} assigned
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No pending assignments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              to={`/orders/${item.orderId}`}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[item.priority] || 'bg-muted'}`}>
                  P{item.priority}
                </span>
                <div>
                  <p className="text-sm font-medium">Order #{item.orderId.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[item.assignmentType] || item.assignmentType} • {formatTime(item.assignedAt)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
          {assignments.length > 6 && (
            <Link
              to="/orders"
              className="block text-center text-sm text-primary hover:underline mt-2"
            >
              View all {assignments.length} assignments
            </Link>
          )}
        </div>
      )}
    </div>
  );
}