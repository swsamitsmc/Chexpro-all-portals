import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, MoreVertical, Mail, Shield, Trash2, Edit, 
  CheckCircle, XCircle, Loader2, UserPlus, Search
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'pending';
  department?: string;
  jobTitle?: string;
  lastLogin?: string;
  createdAt: string;
  mfaEnabled: boolean;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as const,
    department: '',
  });
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/client/users`);
      setUsers(res.data.data);
    } catch (err) {
      // Demo data
      setUsers([
        {
          id: '1',
          email: 'john.doe@acme.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'owner',
          status: 'active',
          department: 'HR',
          jobTitle: 'HR Manager',
          lastLogin: '2024-01-15T10:30:00Z',
          createdAt: '2023-06-01T00:00:00Z',
          mfaEnabled: true,
        },
        {
          id: '2',
          email: 'jane.smith@acme.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'admin',
          status: 'active',
          department: 'IT',
          jobTitle: 'IT Manager',
          lastLogin: '2024-01-14T15:45:00Z',
          createdAt: '2023-07-15T00:00:00Z',
          mfaEnabled: true,
        },
        {
          id: '3',
          email: 'bob.wilson@acme.com',
          firstName: 'Bob',
          lastName: 'Wilson',
          role: 'manager',
          status: 'active',
          department: 'Recruiting',
          jobTitle: 'Recruiter',
          lastLogin: '2024-01-10T09:00:00Z',
          createdAt: '2023-09-01T00:00:00Z',
          mfaEnabled: false,
        },
        {
          id: '4',
          email: 'alice.brown@acme.com',
          firstName: 'Alice',
          lastName: 'Brown',
          role: 'user',
          status: 'pending',
          department: 'HR',
          jobTitle: 'HR Coordinator',
          createdAt: '2024-01-05T00:00:00Z',
          mfaEnabled: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await axios.post(`${API_URL}/client/users`, inviteForm);
      setShowInviteModal(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'user', department: '' });
      fetchUsers();
    } catch (err) {
      alert('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await axios.put(`${API_URL}/client/users/${userId}`, { role });
      fetchUsers();
    } catch (err) {
      alert('Failed to update role');
    }
    setShowActionMenu(null);
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await axios.delete(`${API_URL}/client/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to deactivate user');
    }
    setShowActionMenu(null);
  };

  const handleResendInvite = async (userId: string) => {
    try {
      await axios.post(`${API_URL}/client/users/${userId}/resend-invite`);
      alert('Invitation resent');
    } catch (err) {
      alert('Failed to resend invitation');
    }
    setShowActionMenu(null);
  };

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors.user;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || colors.inactive;
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
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">Manage users and their access levels</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Last Login</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                    {user.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                     user.status === 'pending' ? <Mail className="w-3 h-3 mr-1" /> :
                     <XCircle className="w-3 h-3 mr-1" />}
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {user.department || '-'}
                </td>
                <td className="py-3 px-4 text-gray-500 text-sm">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="relative">
                    <button
                      onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                    {showActionMenu === user.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        {user.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <Shield className="w-4 h-4" />
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            {user.status === 'pending' && (
                              <button
                                onClick={() => handleResendInvite(user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                <Mail className="w-4 h-4" />
                                Resend Invite
                              </button>
                            )}
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Deactivate
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
