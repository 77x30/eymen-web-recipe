import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchSystemStatus()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const start = Date.now();
      const response = await api.get('/health');
      const latency = Date.now() - start;
      
      setSystemStatus({
        status: 'online',
        latency,
        timestamp: response.data.timestamp,
        uptime: response.data.uptime || 'N/A'
      });
    } catch (error) {
      setSystemStatus({
        status: 'offline',
        latency: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await api.post('/admin/users', newUser);
      setSuccess('User created successfully!');
      setNewUser({ username: '', password: '', role: 'operator' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-xl p-8 text-center">
        <span className="icon icon-xl text-red-400 mb-4 block">block</span>
        <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
        <p className="text-gray-400 mt-2">Admin privileges required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-6 text-white shadow-lg ${
          systemStatus?.status === 'online' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">API Status</p>
              <p className="text-2xl font-bold uppercase">{systemStatus?.status || 'Unknown'}</p>
            </div>
            <span className={`icon icon-lg ${systemStatus?.status === 'online' ? 'animate-pulse' : ''}`}>
              {systemStatus?.status === 'online' ? 'check_circle' : 'cancel'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">API Latency</p>
              <p className="text-2xl font-bold">{systemStatus?.latency || 0} ms</p>
            </div>
            <span className="icon icon-lg">bolt</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <span className="icon icon-lg">group</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Last Check</p>
              <p className="text-lg font-bold">
                {systemStatus?.timestamp 
                  ? new Date(systemStatus.timestamp).toLocaleTimeString() 
                  : 'N/A'}
              </p>
            </div>
            <span className="icon icon-lg">schedule</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 flex items-center gap-2">
          <span className="icon icon-sm">error</span> {error}
          <button onClick={() => setError('')} className="ml-auto">×</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 flex items-center gap-2">
          <span className="icon icon-sm">check_circle</span> {success}
          <button onClick={() => setSuccess('')} className="ml-auto">×</button>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="icon icon-sm">group</span> User Management
          </h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
          >
            <span className="icon icon-sm">person_add</span> Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="p-4 bg-gray-50 border-b">
            <form onSubmit={handleAddUser} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Users Table */}
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">#{u.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{u.username}</span>
                    {u.id === user.id && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">You</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === user.id}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' :
                      u.role === 'operator' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    } ${u.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {u.id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                    >
                      <span className="icon icon-sm">delete</span> Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-sm font-medium">Viewer</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> View recipes</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> View data records</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-red-500">cancel</span> Create/Edit recipes</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-red-500">cancel</span> Admin panel</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-200 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">Operator</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> View recipes</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> Create/Edit recipes</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> Manage data records</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-red-500">cancel</span> Admin panel</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded text-sm font-medium">Admin</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> Full recipe access</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> User management</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> System monitoring</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check_circle</span> All permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
