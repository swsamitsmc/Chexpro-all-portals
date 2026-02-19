import { useState, useEffect } from 'react';
import { Activity, User, FileText, Settings, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  adminId: string;
}

const actionIcons: Record<string, typeof User> = {
  login: User,
  logout: User,
  create: FileText,
  update: Settings,
  delete: AlertTriangle,
  view: FileText,
};

const actionColors: Record<string, string> = {
  login: 'text-success',
  logout: 'text-muted-foreground',
  create: 'text-primary',
  update: 'text-warning',
  delete: 'text-destructive',
  view: 'text-muted-foreground',
};

export function ActivityFeedWidget() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/recent-activity', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setLogs(json.data);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No recent activity</div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {logs.map((log, idx) => {
            const Icon = actionIcons[log.action] || FileText;
            const colorClass = actionColors[log.action] || 'text-muted-foreground';
            const showDate = idx === 0 || formatDate(logs[idx - 1].createdAt) !== formatDate(log.createdAt);

            return (
              <div key={log.id}>
                {showDate && (
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {formatDate(log.createdAt)}
                  </p>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> on </span>
                      <span className="font-medium">{log.resourceType}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</p>
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