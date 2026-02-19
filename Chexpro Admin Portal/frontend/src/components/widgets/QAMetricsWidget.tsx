import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface QAMetrics {
  pendingReviews: number;
  inProgress: number;
  completedToday: number;
  failedToday: number;
  passRate: number;
}

export function QAMetricsWidget() {
  const [data, setData] = useState<QAMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/qa-metrics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error('Failed to fetch QA metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          QA Metrics
        </h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          QA Metrics
        </h3>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>

      {/* Pass Rate - Large Display */}
      <div className="text-center mb-4 p-3 rounded-lg bg-muted/50">
        <p className="text-3xl font-bold text-success">{data.passRate}%</p>
        <p className="text-xs text-muted-foreground">7-day pass rate</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded bg-warning/10 text-center">
          <div className="flex items-center justify-center gap-1 text-warning mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">{data.pendingReviews}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>

        <div className="p-2 rounded bg-primary/10 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">{data.inProgress}</p>
          <p className="text-xs text-muted-foreground">In Review</p>
        </div>

        <div className="p-2 rounded bg-success/10 text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-1">
            <CheckCircle className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">{data.completedToday}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>

        <div className="p-2 rounded bg-destructive/10 text-center">
          <div className="flex items-center justify-center gap-1 text-destructive mb-1">
            <XCircle className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">{data.failedToday}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>
    </div>
  );
}