import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Key, Plus, Trash2, Copy, Check, AlertTriangle, Loader2, 
  Eye, EyeOff, Clock, Shield
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await axios.get(`${API_URL}/client/api-keys`);
      setKeys(res.data.data);
    } catch (err) {
      // Demo data
      setKeys([
        {
          id: '1',
          name: 'Production API Key',
          keyPrefix: 'cpk_live_****',
          lastUsed: '2024-01-15T10:30:00Z',
          createdAt: '2023-06-01T00:00:00Z',
          expiresAt: '2025-06-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Development Key',
          keyPrefix: 'cpk_test_****',
          lastUsed: '2024-01-14T15:45:00Z',
          createdAt: '2023-09-15T00:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/client/api-keys`, { name: newKeyName });
      setNewKeySecret(res.data.data.fullKey);
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      alert('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    setDeleting(keyId);
    try {
      await axios.delete(`${API_URL}/client/api-keys/${keyId}`);
      fetchKeys();
    } catch (err) {
      alert('Failed to delete API key');
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Keep your API keys secure</p>
          <p className="text-sm text-yellow-700 mt-1">
            Never share your API keys in public repositories or client-side code. 
            Rotate keys periodically and revoke immediately if compromised.
          </p>
        </div>
      </div>

      {/* Keys List */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
          <p className="text-gray-500 mb-4">Create your first API key to start integrating</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Key</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Last Used</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Expires</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.keyPrefix}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {key.expiresAt ? (
                      <span className={new Date(key.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-500'}>
                        {new Date(key.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(key.id)}
                      disabled={deleting === key.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      {deleting === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documentation Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          API Documentation
        </h3>
        <p className="text-gray-600 mb-4">
          Learn how to authenticate and use the ChexPro API in your applications.
        </p>
        <a
          href="#"
          className="text-blue-600 hover:underline"
        >
          View API Documentation →
        </a>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            {newKeySecret ? (
              <>
                <h2 className="text-xl font-bold mb-4">API Key Created</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-medium text-sm">
                    ⚠️ Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm break-all">
                      {newKeySecret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKeySecret, 'new-key')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {copied === 'new-key' ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeySecret(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Create API Key</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Production API Key"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create Key
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
