import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator', workspace_id: '' });
  const [newWorkspace, setNewWorkspace] = useState({ name: '', subdomain: '', company: '', location: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchSystemStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchSystemStatus(), fetchWorkspaces()]);
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

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
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
      const userData = {
        ...newUser,
        workspace_id: isSubAdmin ? user?.workspace_id : (newUser.workspace_id ? parseInt(newUser.workspace_id) : null)
      };
      await api.post('/admin/users', userData);
      setSuccess('Kullanıcı başarıyla oluşturuldu!');
      setNewUser({ username: '', password: '', role: 'operator', workspace_id: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı oluşturulamadı');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kullanıcı silinemedi');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Rol güncellenemedi');
    }
  };

  const handleWorkspaceChange = async (userId, workspaceId) => {
    try {
      await api.put(`/admin/users/${userId}`, { 
        workspace_id: workspaceId ? parseInt(workspaceId) : null 
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Workspace güncellenemedi');
    }
  };

  const handleResetBiometric = async (userId) => {
    if (!confirm('Biyometrik doğrulamayı sıfırlamak istediğinizden emin misiniz?')) return;
    
    try {
      await api.put(`/admin/users/${userId}/reset-biometric`);
      setSuccess('Biyometrik doğrulama sıfırlandı');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Biyometrik sıfırlanamadı');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Yeni şifreyi girin:');
    if (!newPassword) return;
    
    try {
      await api.put(`/admin/users/${userId}/reset-password`, { password: newPassword });
      setSuccess('Şifre başarıyla değiştirildi');
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre değiştirilemedi');
    }
  };

  const handleAddWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await api.post('/workspaces', newWorkspace);
      setSuccess('Workspace başarıyla oluşturuldu!');
      setNewWorkspace({ name: '', subdomain: '', company: '', location: '', description: '' });
      setShowAddWorkspace(false);
      fetchWorkspaces();
    } catch (err) {
      setError(err.response?.data?.error || 'Workspace oluşturulamadı');
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm('Bu workspace\'i silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      fetchWorkspaces();
    } catch (err) {
      setError(err.response?.data?.error || 'Workspace silinemedi');
    }
  };

  const handleTestWorkspace = async (workspaceId) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/test`);
      setSuccess(`${response.data.workspace}: ${response.data.online ? 'Online' : 'Offline'} (${response.data.ping}ms)`);
    } catch (err) {
      setError('Workspace test edilemedi');
    }
  };

  const handleWorkspaceStatusChange = async (workspaceId, newStatus) => {
    try {
      await api.put(`/workspaces/${workspaceId}`, { status: newStatus });
      fetchWorkspaces();
    } catch (err) {
      setError(err.response?.data?.error || 'Workspace durumu güncellenemedi');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub_admin';

  // sub_admin can only see their own workspace
  const availableWorkspaces = isSubAdmin 
    ? workspaces.filter(ws => ws.id === user?.workspace_id)
    : workspaces;

  // Roles that sub_admin can assign
  const availableRoles = isSubAdmin 
    ? [{ value: 'operator', label: 'Operator' }, { value: 'viewer', label: 'Viewer' }]
    : [
        { value: 'viewer', label: 'Viewer' },
        { value: 'operator', label: 'Operator' },
        { value: 'sub_admin', label: 'Alt Admin' },
        { value: 'admin', label: 'Admin' }
      ];

  // Count users in workspace for sub_admin limit
  const workspaceUserCount = isSubAdmin 
    ? users.filter(u => u.workspace_id === user?.workspace_id).length
    : 0;

  if (!isAdmin && !isSubAdmin) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-xl p-8 text-center">
        <span className="icon icon-xl text-red-400 mb-4 block">block</span>
        <h2 className="text-xl font-bold text-red-400">Erişim Engellendi</h2>
        <p className="text-gray-400 mt-2">Admin yetkisi gerekli</p>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {isSubAdmin ? 'Workspace Yönetimi' : 'Admin Panel'}
        </h1>
        {/* Tabs - sub_admin only sees limited tabs */}
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="icon icon-sm">group</span> Kullanıcılar
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'workspaces' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="icon icon-sm">domain</span> Workspaces
            </button>
          )}
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`rounded-xl p-4 text-white shadow-lg ${
          systemStatus?.status === 'online' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs">API Status</p>
              <p className="text-xl font-bold uppercase">{systemStatus?.status || 'Unknown'}</p>
            </div>
            <span className={`icon ${systemStatus?.status === 'online' ? 'animate-pulse' : ''}`}>
              {systemStatus?.status === 'online' ? 'check_circle' : 'cancel'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">API Latency</p>
              <p className="text-xl font-bold">{systemStatus?.latency || 0} ms</p>
            </div>
            <span className="icon">bolt</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs">Kullanıcılar</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
            <span className="icon">group</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-xs">Workspaces</p>
              <p className="text-xl font-bold">{workspaces.length}</p>
            </div>
            <span className="icon">domain</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs">Son Kontrol</p>
              <p className="text-sm font-bold">
                {systemStatus?.timestamp 
                  ? new Date(systemStatus.timestamp).toLocaleTimeString() 
                  : 'N/A'}
              </p>
            </div>
            <span className="icon">schedule</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-600 flex items-center gap-2">
          <span className="icon icon-sm">error</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-xl">×</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-600 flex items-center gap-2">
          <span className="icon icon-sm">check_circle</span> {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-xl">×</button>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
      <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="icon icon-sm">group</span> Kullanıcı Yönetimi
            {isSubAdmin && (
              <span className="ml-2 text-xs bg-orange-500/30 text-orange-200 px-2 py-1 rounded">
                {workspaceUserCount}/4 kullanıcı
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            disabled={isSubAdmin && workspaceUserCount >= 4}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
              isSubAdmin && workspaceUserCount >= 4 
                ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <span className="icon icon-sm">person_add</span> Kullanıcı Ekle
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="p-4 bg-gray-50 border-b">
            <form onSubmit={handleAddUser} className="grid grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {availableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
                <select
                  value={isSubAdmin ? user?.workspace_id : newUser.workspace_id}
                  onChange={(e) => setNewUser({...newUser, workspace_id: e.target.value})}
                  disabled={isSubAdmin}
                  className={`w-full px-3 py-2 border rounded-lg ${isSubAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  {isSubAdmin ? (
                    availableWorkspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="">Yok (Global)</option>
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kullanıcı</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Workspace</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Biyometrik</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.biometric_photo ? (
                        <img 
                          src={u.biometric_photo} 
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 ring-blue-500"
                          onClick={() => setShowBiometricModal(u)}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-800">{u.username}</span>
                        {u.id === user.id && (
                          <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">Siz</span>
                        )}
                        <p className="text-xs text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user.id || (isSubAdmin && (u.role === 'admin' || u.role === 'sub_admin'))}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'sub_admin' ? 'bg-orange-100 text-orange-700' :
                        u.role === 'operator' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      } ${u.id === user.id || (isSubAdmin && (u.role === 'admin' || u.role === 'sub_admin')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubAdmin ? (
                        <>
                          <option value="viewer">Viewer</option>
                          <option value="operator">Operator</option>
                        </>
                      ) : (
                        <>
                          <option value="viewer">Viewer</option>
                          <option value="operator">Operator</option>
                          <option value="sub_admin">Alt Admin</option>
                          <option value="admin">Admin</option>
                        </>
                      )}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.workspace_id || ''}
                      onChange={(e) => handleWorkspaceChange(u.id, e.target.value)}
                      disabled={u.id === user.id || u.role === 'admin' || isSubAdmin}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        u.id === user.id || u.role === 'admin' || isSubAdmin ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">Global</option>
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </select>
                    {u.workspace && (
                      <p className="text-xs text-cyan-600 mt-1">{u.workspace.subdomain}.barida.xyz</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex items-center gap-2">
                        {u.biometric_verified ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                            <span className="icon icon-sm">verified</span> Doğrulandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                            <span className="icon icon-sm">pending</span> Bekliyor
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && !(isSubAdmin && (u.role === 'admin' || u.role === 'sub_admin')) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                          title="Şifre Sıfırla"
                        >
                          <span className="icon icon-sm">key</span>
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleResetBiometric(u.id)}
                            className="p-1 text-orange-500 hover:bg-orange-100 rounded"
                            title="Biyometrik Sıfırla"
                          >
                            <span className="icon icon-sm">face_retouching_off</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Sil"
                        >
                          <span className="icon icon-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Kullanıcı bulunamadı
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Rol Yetkileri</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-sm font-medium">Viewer</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Reçeteleri görüntüle</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-red-500">close</span> Düzenleme yetkisi yok</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-200 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">Operator</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Reçete düzenleme</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Kayıt yönetimi</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-200 text-orange-700 px-2 py-0.5 rounded text-sm font-medium">Alt Admin</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Workspace yönetimi</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Kullanıcı yönetimi (ws)</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded text-sm font-medium">Admin</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Tüm yetkiler</li>
              <li className="flex items-center gap-1"><span className="icon icon-sm text-green-500">check</span> Sistem yönetimi</li>
            </ul>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Workspaces Tab */}
      {activeTab === 'workspaces' && (
      <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="icon icon-sm">domain</span> Workspace Yönetimi
          </h2>
          <button
            onClick={() => setShowAddWorkspace(!showAddWorkspace)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
          >
            <span className="icon icon-sm">add</span> Yeni Workspace
          </button>
        </div>

        {/* Add Workspace Form */}
        {showAddWorkspace && (
          <div className="p-4 bg-gray-50 border-b">
            <form onSubmit={handleAddWorkspace} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Adı</label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({...newWorkspace, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Örn: Fabrika 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <div className="flex">
                  <input
                    type="text"
                    value={newWorkspace.subdomain}
                    onChange={(e) => setNewWorkspace({...newWorkspace, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="flex-1 px-3 py-2 border rounded-l-lg"
                    placeholder="fabrika1"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-200 border border-l-0 rounded-r-lg text-gray-600 text-sm">.barida.xyz</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket</label>
                <input
                  type="text"
                  value={newWorkspace.company}
                  onChange={(e) => setNewWorkspace({...newWorkspace, company: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Şirket adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                <input
                  type="text"
                  value={newWorkspace.location}
                  onChange={(e) => setNewWorkspace({...newWorkspace, location: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="İstanbul, Türkiye"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({...newWorkspace, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Workspace açıklaması..."
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium">
                  Oluştur
                </button>
                <button type="button" onClick={() => setShowAddWorkspace(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium">
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => {
              const workspaceUsers = users.filter(u => u.workspace_id === workspace.id);
              return (
              <div key={workspace.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-cyan-300 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{workspace.name}</h3>
                    <a href={`https://${workspace.subdomain}.barida.xyz`} target="_blank" rel="noopener noreferrer" 
                      className="text-cyan-600 text-sm hover:underline flex items-center gap-1">
                      <span className="icon icon-sm">link</span>
                      {workspace.subdomain}.barida.xyz
                    </a>
                  </div>
                  <select
                    value={workspace.status}
                    onChange={(e) => handleWorkspaceStatusChange(workspace.id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      workspace.status === 'active' ? 'bg-green-100 text-green-700' :
                      workspace.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <option value="active">Aktif</option>
                    <option value="maintenance">Bakım</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
                
                {workspace.company && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                    <span className="icon icon-sm">business</span> {workspace.company}
                  </p>
                )}
                {workspace.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <span className="icon icon-sm">location_on</span> {workspace.location}
                  </p>
                )}
                
                {/* Workspace Users */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Kullanıcılar ({workspaceUsers.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {workspaceUsers.slice(0, 5).map(u => (
                      <span key={u.id} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {u.username}
                      </span>
                    ))}
                    {workspaceUsers.length > 5 && (
                      <span className="text-gray-400 text-xs">+{workspaceUsers.length - 5} daha</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => handleTestWorkspace(workspace.id)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <span className="icon icon-sm">speed</span> Test
                  </button>
                  <button
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <span className="icon icon-sm">delete</span>
                  </button>
                </div>
              </div>
            )})}

            {workspaces.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-400">
                <span className="icon icon-xl block mb-2">domain_disabled</span>
                <p>Henüz workspace oluşturulmadı</p>
                <button
                  onClick={() => setShowAddWorkspace(true)}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  İlk Workspace'i Oluştur
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Biometric Photo Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowBiometricModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Biyometrik Fotoğraf</h3>
              <button onClick={() => setShowBiometricModal(null)} className="text-gray-400 hover:text-gray-600">
                <span className="icon">close</span>
              </button>
            </div>
            <div className="text-center">
              <img 
                src={showBiometricModal.biometric_photo} 
                alt={showBiometricModal.username}
                className="w-64 h-64 rounded-xl object-cover mx-auto mb-4"
              />
              <h4 className="font-semibold text-gray-800">{showBiometricModal.username}</h4>
              <p className="text-sm text-gray-500">
                {showBiometricModal.workspace?.name || 'Global Kullanıcı'}
              </p>
              {showBiometricModal.biometric_verified && (
                <span className="inline-flex items-center gap-1 mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  <span className="icon icon-sm">verified</span> Doğrulanmış
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
