'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Input,
  Select,
  LoadingSpinner,
  Alert,
  Modal,
} from '@/components/ui';
import {
  UsersIcon,
  CircleStackIcon,
  ChartBarIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  CommandLineIcon,
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

interface MessageState {
  type: 'success' | 'error' | 'info' | 'warning' | '';
  text: string;
}

interface TableInfo {
  name: string;
  row_count: number;
}

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

interface BulkActionResponse {
  success: string[];
  failed: string[];
}

interface QueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

const ADMIN_EMAILS = ['jasonlettered@gmail.com', 'jbcloses@gmail.com'];

export default function FunctionalAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'database', label: 'Database', icon: CircleStackIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {message.text && (
        <Alert
          type={message.type as 'success' | 'error' | 'info' | 'warning'}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />
      )}

      {/* Tabs */}
      <Card>
        <CardBody>
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {activeTab === 'users' && <UserManagement setMessage={setMessage} />}
      {activeTab === 'database' && <DatabaseManagement setMessage={setMessage} />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
    </div>
  );
}

// User Management Component
function UserManagement({
  setMessage
}: {
  setMessage: (msg: MessageState) => void
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ users: User[] }>('/admin/users?limit=100');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  }, [setMessage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;

    try {
      const response = await apiClient.put<BulkActionResponse>('/admin/users/bulk-action', {
        action,
        client_ids: Array.from(selectedUsers),
      });

      setMessage({
        type: 'success',
        text: `${action} completed: ${response.data.success.length} succeeded, ${response.data.failed.length} failed`
      });

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
      setMessage({ type: 'error', text: `Bulk ${action} failed` });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && u.is_active) ||
                         (filterStatus === 'inactive' && !u.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <Button onClick={fetchUsers} icon={<ArrowPathIcon className="h-5 w-5" />}>
              Refresh
            </Button>
          </div>

          {selectedUsers.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <span className="text-purple-300">{selectedUsers.size} selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="sm" variant="warning" onClick={() => handleBulkAction('deactivate')}>
                  Deactivate
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
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
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Company</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Opportunities</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.client_id} className="hover:bg-white/5">
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
                    />
                  </td>
                  <td className="px-6 py-4 text-white">{user.company_name}</td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.subscription_type === 'whop' ? 'primary' : 'info'}>
                      {user.subscription_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.total_opportunities}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg">
                        <PencilIcon className="h-4 w-4 text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg">
                        <TrashIcon className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Database Management Component
function DatabaseManagement({
  setMessage
}: {
  setMessage: (msg: MessageState) => void
}) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [customQuery, setCustomQuery] = useState('SELECT * FROM users LIMIT 10');

  const fetchTables = useCallback(async () => {
    try {
      const response = await apiClient.get<{ tables: TableInfo[] }>('/admin/database/tables');
      setTables(response.data.tables || []);
      if (response.data.tables.length > 0) {
        setSelectedTable(response.data.tables[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setMessage({ type: 'error', text: 'Failed to fetch tables' });
    }
  }, [setMessage]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const fetchTableData = useCallback(async (tableName: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<TableData>(`/admin/database/table/${tableName}?limit=50`);
      setTableData(response.data);
    } catch (err) {
      console.error('Failed to fetch table data:', err);
      setMessage({ type: 'error', text: 'Failed to fetch table data' });
    } finally {
      setLoading(false);
    }
  }, [setMessage]);

  const exportTable = async () => {
    try {
      const response = await apiClient.get(`/admin/database/table/${selectedTable}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTable}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'Table exported successfully' });
    } catch (err) {
      console.error('Failed to export table:', err);
      setMessage({ type: 'error', text: 'Failed to export table' });
    }
  };

  const executeQuery = async () => {
    try {
      const response = await apiClient.post<QueryResponse>('/admin/database/query', {
        query: customQuery,
      });
      setTableData({
        columns: response.data.columns,
        rows: response.data.rows,
        total: response.data.row_count,
      });
      setShowQueryModal(false);
      setMessage({ type: 'success', text: `Query executed: ${response.data.row_count} rows returned` });
    } catch (err) {
      const error = err as { response?: { data?: ApiErrorResponse } };
      console.error('Query failed:', err);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Query failed' });
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, fetchTableData]);

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Table List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Tables</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-1">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  selectedTable === table.name
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="font-medium">{table.name}</div>
                <div className="text-xs text-gray-500">{table.row_count} rows</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Table Data */}
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white capitalize">{selectedTable}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowQueryModal(true)}
                  icon={<CommandLineIcon className="h-4 w-4" />}
                >
                  Custom Query
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={exportTable}
                  icon={<DocumentArrowDownIcon className="h-4 w-4" />}
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => fetchTableData(selectedTable)}
                  icon={<ArrowPathIcon className="h-4 w-4" />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingSpinner />
            ) : tableData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10">
                    <tr>
                      {tableData.columns?.map((col: string) => (
                        <th key={col} className="px-4 py-2 text-left text-gray-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tableData.rows?.map((row: Record<string, unknown>, i: number) => (
                      <tr key={i} className="hover:bg-white/5">
                        {tableData.columns?.map((col: string) => (
                          <td key={col} className="px-4 py-2 text-gray-300">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-sm text-gray-400">
                  Showing {tableData.rows?.length || 0} of {tableData.total || 0} rows
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Select a table to view data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Query Modal */}
      <Modal
        isOpen={showQueryModal}
        onClose={() => setShowQueryModal(false)}
        title="Execute Custom Query"
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
            placeholder="SELECT * FROM users WHERE..."
          />
          <p className="text-sm text-yellow-400">
            ⚠️ Only SELECT queries are allowed for safety
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowQueryModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={executeQuery}>
              Execute Query
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  return (
    <Card>
      <CardBody>
        <p className="text-gray-400">Analytics dashboard coming soon...</p>
      </CardBody>
    </Card>
  );
}