import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { StatsCard, OrdersOverviewWidget, SLAStatusWidget, WorkloadWidget, QAMetricsWidget, ActivityFeedWidget } from '../components/widgets';

interface DashboardStats {
  totalOrders: number;
  pendingReview: number;
  completedToday: number;
  slaBreaches: number;
  myAssignments: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the ChexPro Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Orders"
          value={loading ? '...' : (stats?.totalOrders ?? 0)}
          subtitle="Last 30 days"
          icon={FileText}
        />
        <StatsCard
          title="Pending Review"
          value={loading ? '...' : (stats?.pendingReview ?? 0)}
          subtitle="Requires attention"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Completed Today"
          value={loading ? '...' : (stats?.completedToday ?? 0)}
          subtitle="Avg TAT: 2.5 days"
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="SLA Breaches"
          value={loading ? '...' : (stats?.slaBreaches ?? 0)}
          subtitle="Action required"
          icon={AlertTriangle}
          variant={stats?.slaBreaches ? 'danger' : 'success'}
        />
        <StatsCard
          title="My Assignments"
          value={loading ? '...' : (stats?.myAssignments ?? 0)}
          subtitle="Active work items"
          icon={Briefcase}
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          <OrdersOverviewWidget />
          <WorkloadWidget />
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          <SLAStatusWidget />
          <QAMetricsWidget />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ActivityFeedWidget />
        </div>
      </div>
    </div>
  );
}