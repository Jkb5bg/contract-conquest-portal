'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { components } from '@/lib/theme';
import {
  UsersIcon,
  CircleStackIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const ADMIN_EMAILS = ['jasonlettered@gmail.com', 'jbcloses@gmail.com'];

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

export default function EnhancedAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'whop' | 'admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard');
    } else if (user) {
      fetchUsers();
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users?limit=100');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && u.is_active) ||
                         (filterStatus === 'inactive' && !u.is_active);
    const matchesType = filterType === 'all' || u.subscription_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return;

    if (action === 'delete' && !confirm(`Delete ${selectedUsers.size} users?`)) return;

    // TODO: Implement bulk actions API
    console.log(`Bulk ${action} for:`, Array.from(selectedUsers));
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'database', label: 'Database', icon: CircleStackIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={components.card}>
        <div className={components.cardBody}>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, database, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white/5 backdrop-blur-lg rounded-xl p-2 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters and Actions */}
          <div className={components.card}>
            <div className={components.cardBody}>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={components.input}
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as never)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as never)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="whop">Whop</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    className={`${components.button.base} ${components.button.secondary}`}
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.size > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-300">
                    {selectedUsers.size} users selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className={`${components.button.base} ${components.button.success} text-sm`}
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className={`${components.button.base} ${components.button.warning} text-sm`}
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className={`${components.button.base} ${components.button.danger} text-sm`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className={components.card}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.client_id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Opps</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Last Login</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.client_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.client_id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.client_id);
                            } else {
                              newSelected.delete(user.client_id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{user.company_name}</div>
                        <div className="text-xs text-gray-500">{user.client_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`${components.badge.base} ${
                          user.subscription_type === 'whop' ? components.badge.primary : components.badge.info
                        }`}>
                          {user.subscription_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${components.badge.base} ${
                          user.is_active ? components.badge.success : components.badge.danger
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{user.total_opportunities}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                            <PencilIcon className="h-4 w-4 text-blue-400" />
                          </button>
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Delete">
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
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <DatabaseManager />
      )}
    </div>
  );
}

// Database Manager Component
function DatabaseManager() {
  const [tables, setTables] = useState(['users', 'opportunities', 'matches', 'interests', 'leads']);
  const [selectedTable, setSelectedTable] = useState('users');

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Table List */}
      <div className={components.card}>
        <div className={components.cardHeader}>
          <h3 className="text-lg font-semibold text-white">Tables</h3>
        </div>
        <div className={components.cardBody}>
          <div className="space-y-1">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  selectedTable === table
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {table}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Operations */}
      <div className="col-span-3 space-y-4">
        <div className={components.card}>
          <div className={components.cardHeader}>
            <h3 className="text-lg font-semibold text-white capitalize">{selectedTable} Table</h3>
          </div>
          <div className={components.cardBody}>
            <div className="grid grid-cols-2 gap-4">
              <button className={`${components.button.base} ${components.button.primary}`}>
                <CircleStackIcon className="h-5 w-5 mr-2 inline" />
                View Records
              </button>
              <button className={`${components.button.base} ${components.button.secondary}`}>
                <FunnelIcon className="h-5 w-5 mr-2 inline" />
                Filter Data
              </button>
              <button className={`${components.button.base} ${components.button.success}`}>
                Export CSV
              </button>
              <button className={`${components.button.base} ${components.button.warning}`}>
                Run Query
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className={components.stat.container}>
            <p className={components.stat.label}>Total Records</p>
            <p className={components.stat.value}>1,234</p>
          </div>
          <div className={components.stat.container}>
            <p className={components.stat.label}>Added Today</p>
            <p className={components.stat.value}>45</p>
          </div>
          <div className={components.stat.container}>
            <p className={components.stat.label}>Modified Today</p>
            <p className={components.stat.value}>12</p>
          </div>
        </div>
      </div>
    </div>
  );
}