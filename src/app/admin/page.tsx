'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  UsersIcon,
  PlusIcon,
  TrashIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface User {
  user_id: number;
  client_id: string;
  email: string;
  company_name: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  total_opportunities: number;
  subscription_type: string;
}

interface Stats {
  users: {
    total: number;
    active: number;
    whop: number;
    admin_created: number;
    new_today: number;
    recent_logins: number;
  };
  opportunities: {
    total: number;
    total_matches: number;
    avg_matches_per_user: number;
  };
}

interface CreateUserResponse {
  message: string;
  userId: string;
  success: boolean;
}

const ADMIN_EMAILS = ['jasonlettered@gmail.com', 'jbcloses@gmail.com'];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check if user is admin
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/stats')
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleActive = async (clientId: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${clientId}/toggle-active`);
      showMessage('success', response.data.message);
      fetchData();
    } catch (error) {
      showMessage('error', 'Failed to toggle user status');
    }
  };

  const handleResetPassword = async (clientId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${clientId}/reset-password`);
      showMessage('success', `New password: ${response.data.new_password}`);
    } catch (error) {
      showMessage('error', 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/admin/users/${clientId}`);
      showMessage('success', 'User deleted successfully');
      fetchData();
    } catch (error) {
      showMessage('error', 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <div className="text-white">Access denied</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-white">{stats?.users.total || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats?.users.active || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Whop Users</p>
          <p className="text-2xl font-bold text-purple-400">{stats?.users.whop || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Admin Created</p>
          <p className="text-2xl font-bold text-blue-400">{stats?.users.admin_created || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">New Today</p>
          <p className="text-2xl font-bold text-yellow-400">{stats?.users.new_today || 0}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Matches</p>
          <p className="text-2xl font-bold text-white">{stats?.opportunities.total_matches || 0}</p>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <UsersIcon className="h-6 w-6 mr-2" />
            User Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600"
          >
            <PlusIcon className="h-5 w-5 inline mr-1" />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr>
                <th className="pb-3 text-sm text-gray-400">Company</th>
                <th className="pb-3 text-sm text-gray-400">Email</th>
                <th className="pb-3 text-sm text-gray-400">Type</th>
                <th className="pb-3 text-sm text-gray-400">Status</th>
                <th className="pb-3 text-sm text-gray-400">Opportunities</th>
                <th className="pb-3 text-sm text-gray-400">Created</th>
                <th className="pb-3 text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.client_id} className="hover:bg-white/5">
                  <td className="py-3 text-white">{user.company_name}</td>
                  <td className="py-3 text-gray-300">{user.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.subscription_type === 'whop' 
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.subscription_type}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{user.total_opportunities}</td>
                  <td className="py-3 text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(user.client_id)}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Toggle Active"
                      >
                        {user.is_active ? (
                          <XMarkIcon className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.client_id)}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Reset Password"
                      >
                        <KeyIcon className="h-4 w-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.client_id)}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Delete User"
                      >
                        <TrashIcon className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
            showMessage('success', 'User created successfully');
          }}
        />
      )}
    </div>
  );
}

function isCreateUserResponse(obj: unknown): obj is {
  email: string;
  client_id: string;
  temporary_password: string;
} {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'email' in obj &&
    'client_id' in obj &&
    'temporary_password' in obj
  );
}

// Create User Modal Component
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    primary_naics: '',
    capabilities: '',
    contract_value_min: 10000,
    contract_value_max: 1000000,
    send_welcome_email: true,
    notes: 'Complimentary access granted'
  });
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<unknown>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        primary_naics: formData.primary_naics.split(',').map(s => s.trim()),
        capabilities: formData.capabilities.split(',').map(s => s.trim()),
        secondary_naics: []
      };

      const res = await apiClient.post('/admin/users/create', payload);
      setResponse(res.data);
      setTimeout(onSuccess, 3000);
    } catch (error: unknown) {
      // @ts-expect-error Normal linting issue with the error below
        alert(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-4">Create New User (Free Account)</h3>

        {isCreateUserResponse(response) ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400">✅ User created successfully!</p>
            <p className="text-white mt-2">Email: {response.email}</p>
            <p className="text-white">Client ID: {response.client_id}</p>
            <p className="text-white">
              Temporary Password:{' '}
              <code className="bg-black/30 px-2 py-1 rounded">
                {response.temporary_password}
              </code>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Primary NAICS (comma-separated)</label>
              <input
                type="text"
                required
                placeholder="541330, 541511"
                value={formData.primary_naics}
                onChange={(e) => setFormData({...formData, primary_naics: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Capabilities (comma-separated)</label>
              <textarea
                required
                placeholder="IT Services, Cybersecurity, Cloud Computing"
                value={formData.capabilities}
                onChange={(e) => setFormData({...formData, capabilities: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Min Contract Value</label>
                <input
                  type="number"
                  value={formData.contract_value_min}
                  onChange={(e) => setFormData({...formData, contract_value_min: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max Contract Value</label>
                <input
                  type="number"
                  value={formData.contract_value_max}
                  onChange={(e) => setFormData({...formData, contract_value_max: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.send_welcome_email}
                  onChange={(e) => setFormData({...formData, send_welcome_email: e.target.checked})}
                  className="mr-2"
                />
                Send welcome email with credentials
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}