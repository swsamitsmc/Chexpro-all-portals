import { useState, useEffect } from 'react';
import { FileText, TrendingUp } from 'lucide-react';

interface OrderStatus {
  status: string;
  count: number;
}

export function OrdersOverviewWidget() {
  const [data, setData] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/orders-overview', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error('Failed to fetch orders overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    in_progress: 'bg-primary/20 text-primary',
    pending_review: 'bg-accent/20 text-accent',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    pending_review: 'Pending Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Orders Overview
        </h3>
        <span className="text-sm text-muted-foreground">Last 30 days</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold">{total}</span>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>

          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[item.status] || 'bg-muted'}`}>
                  {statusLabels[item.status] || item.status}
                </span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>

          {/* Simple bar visualization */}
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-muted">
            {data.map((item, idx) => (
              <div
                key={idx}
                className={`${statusColors[item.status]?.split(' ')[0] || 'bg-muted'}`}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}