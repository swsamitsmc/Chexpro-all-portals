import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Building, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  _count?: { orders: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'bg-warning/20 text-warning', icon: Clock },
  active: { label: 'Active', color: 'bg-success/20 text-success', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/clients?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const json = await res.json();
      if (json.success) setClients(json.data.clients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Client credentialing and management</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Building className="h-12 w-12 mb-4 opacity-50" />
          <p>No clients found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const statusConfig = STATUS_CONFIG[client.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{client.companyName}</h3>
                <p className="text-sm text-muted-foreground mb-2">{client.contactEmail}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{client._count?.orders || 0} orders</span>
                  <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}