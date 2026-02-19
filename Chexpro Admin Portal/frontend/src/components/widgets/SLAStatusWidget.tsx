import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface SLAAlert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  hoursRemaining: number | null;
  createdAt: string;
}

interface SLAData {
  summary: { critical: number; high: number; medium: number; low: number };
  alerts: SLAAlert[];
}

export function SLAStatusWidget() {
  const [data, setData] = useState<SLAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/sla-status', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error('Failed to fetch SLA status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const severityColors: Record<string, string> = {
    critical: 'bg-destructive/20 text-destructive border-destructive/30',
    high: 'bg-warning/20 text-warning border-warning/30',
    medium: 'bg-accent/20 text-accent border-accent/30',
    low: 'bg-muted text-muted-foreground border-muted',
  };

  const severityIcons: Record<string, typeof AlertTriangle> = {
    critical: AlertCircle,
    high: AlertTriangle,
    medium: Clock,
    low: Clock,
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          SLA Status
        </h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  const totalAlerts = data.summary.critical + data.summary.high + data.summary.medium + data.summary.low;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          SLA Status
        </h3>
        {totalAlerts > 0 && (
          <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
            {totalAlerts} active
          </span>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {data.summary.critical > 0 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-destructive/20 text-destructive">
            {data.summary.critical} Critical
          </span>
        )}
        {data.summary.high > 0 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-warning/20 text-warning">
            {data.summary.high} High
          </span>
        )}
        {data.summary.medium > 0 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent">
            {data.summary.medium} Medium
          </span>
        )}
        {data.summary.low > 0 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
            {data.summary.low} Low
          </span>
        )}
        {totalAlerts === 0 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">
            All SLAs on track
          </span>
        )}
      </div>

      {/* Recent alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.alerts.slice(0, 5).map((alert) => {
            const Icon = severityIcons[alert.severity] || Clock;
            return (
              <div
                key={alert.id}
                className={`p-2 rounded border text-sm ${severityColors[alert.severity]}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{alert.message}</p>
                    {alert.hoursRemaining !== null && (
                      <p className="text-xs opacity-75">{alert.hoursRemaining}h remaining</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}