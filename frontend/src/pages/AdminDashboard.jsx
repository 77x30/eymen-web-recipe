import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalWorkspaces: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [updateVersion, setUpdateVersion] = useState('');
  const [systemUpdates, setSystemUpdates] = useState([]);
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetchData();
    fetchTelemetry();
    const telemetryInterval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(telemetryInterval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const response = await api.get('/system/telemetry');
      setTelemetry(response.data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [workspacesRes, usersRes] = await Promise.all([
        api.get('/workspaces'),
        api.get('/admin/users')
      ]);
      
      setWorkspaces(workspacesRes.data);
      setUsers(usersRes.data);
      
      // Calculate stats
      const pendingVerifications = usersRes.data.filter(u => !u.biometric_verified && u.role !== 'admin').length;
      const activeUsers = usersRes.data.filter(u => u.biometric_verified || u.role === 'admin').length;
      
      setStats({
        totalWorkspaces: workspacesRes.data.length,
        totalUsers: usersRes.data.length,
        activeUsers,
        pendingVerifications
      });
      
      // Fetch updates separately to avoid breaking main data fetch
      try {
        const updatesRes = await api.get('/system/updates');
        setSystemUpdates(updatesRes.data);
      } catch (updateError) {
        console.error('Error fetching updates:', updateError);
        setSystemUpdates([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data - users per workspace
  const usersByWorkspace = workspaces.map(ws => ({
    name: ws.name.length > 10 ? ws.name.substring(0, 10) + '...' : ws.name,
    users: users.filter(u => u.workspace_id === ws.id).length
  }));

  // Role distribution
  const roleDistribution = [
    { name: 'Admin', value: users.filter(u => u.role === 'admin').length },
    { name: 'Alt Admin', value: users.filter(u => u.role === 'sub_admin').length },
    { name: 'Operatör', value: users.filter(u => u.role === 'operator').length },
    { name: 'İzleyici', value: users.filter(u => u.role === 'viewer').length }
  ].filter(r => r.value > 0);



  const handlePublishUpdate = async () => {
    if (updateNote) {
      try {
        await api.post('/system/updates', {
          version: updateVersion || '1.0.0',
          note: updateNote
        });
        setUpdateNote('');
        setUpdateVersion('');
        setShowUpdateModal(false);
        fetchData();
      } catch (error) {
        console.error('Error publishing update:', error);
        alert('Güncelleme yayınlanamadı');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">Sistem yönetimi ve izleme merkezi</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpdateModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
          >
            <span className="icon icon-sm">system_update</span> Güncelleme Yayınla
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Toplam Workspace</p>
              <p className="text-3xl font-bold">{stats.totalWorkspaces}</p>
            </div>
            <span className="icon icon-lg opacity-80">business</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Toplam Kullanıcı</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <span className="icon icon-lg opacity-80">people</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Aktif Kullanıcı</p>
              <p className="text-3xl font-bold">{stats.activeUsers}</p>
            </div>
            <span className="icon icon-lg opacity-80">verified_user</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Bekleyen Doğrulama</p>
              <p className="text-3xl font-bold">{stats.pendingVerifications}</p>
            </div>
            <span className="icon icon-lg opacity-80">pending</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/workspaces" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition">
              <span className="icon text-red-600 text-2xl">add_business</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition">Yeni Workspace</h3>
              <p className="text-gray-500 text-sm">Yeni müşteri workspace'i oluştur</p>
            </div>
          </div>
        </Link>
        
        <Link to="/users" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
              <span className="icon text-blue-600 text-2xl">person_add</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Kullanıcı Ekle</h3>
              <p className="text-gray-500 text-sm">Yeni kullanıcı veya admin oluştur</p>
            </div>
          </div>
        </Link>
        
        <div 
          onClick={() => setShowUpdateModal(true)}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
              <span className="icon text-green-600 text-2xl">rocket_launch</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">Güncelleme Yayınla</h3>
              <p className="text-gray-500 text-sm">Tüm workspace'lere anlık güncelleme</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Per Workspace Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Workspace Başına Kullanıcı</h3>
          {usersByWorkspace.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usersByWorkspace}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Legend />
                <Bar dataKey="users" name="Kullanıcı Sayısı" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Workspace yok
            </div>
          )}
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rol Dağılımı</h3>
          {roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Kullanıcı yok
            </div>
          )}
        </div>
      </div>

      {/* Workspaces Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Workspace'ler</h3>
          <Link to="/workspaces" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
            Tümünü Gör <span className="icon icon-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{ws.name}</h4>
                  <p className="text-gray-500 text-xs">{ws.subdomain}.barida.xyz</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {users.filter(u => u.workspace_id === ws.id).length} kullanıcı
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Aktif
                </div>
              </div>
            </div>
          ))}
          {workspaces.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <span className="icon text-4xl mb-2 block">business</span>
              <p>Henüz workspace yok</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistem Durumu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">API Sunucu</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Aktif</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Veritabanı</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Aktif</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Frontend</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Aktif</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">SSL</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Geçerli</p>
          </div>
        </div>
      </div>

      {/* WinForms Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="icon text-purple-600">desktop_windows</span>
            WinForms Uygulamaları
          </h3>
          {telemetry ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm">Çevrimiçi</p>
                  <p className="text-2xl font-bold text-purple-700">{telemetry.summary.online}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm">Boşta</p>
                  <p className="text-2xl font-bold text-yellow-700">{telemetry.summary.idle}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm">Çevrimdışı</p>
                  <p className="text-2xl font-bold text-gray-700">{telemetry.summary.offline}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm">Ort. RAM</p>
                  <p className="text-2xl font-bold text-blue-700">{telemetry.summary.avgRamMb} MB</p>
                </div>
              </div>
              
              {/* Version Distribution */}
              {Object.keys(telemetry.versions).length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Versiyon Dağılımı</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(telemetry.versions).map(([version, count]) => (
                      <span key={version} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        v{version}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Connected Clients List */}
              {telemetry.clients.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Bağlı İstemciler</p>
                  <div className="space-y-2">
                    {telemetry.clients.slice(0, 10).map((client, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            client.status === 'online' ? 'bg-green-500' :
                            client.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="font-medium">{client.username || 'Anonim'}</span>
                          <span className="text-gray-500">({client.workspace})</span>
                        </div>
                        <div className="text-gray-500 flex items-center gap-3">
                          <span>{client.ram_usage_mb?.toFixed(0)} MB</span>
                          <span className="text-xs">v{client.app_version}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {telemetry.clients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <span className="icon text-3xl mb-2 block">desktop_access_disabled</span>
                  <p>Bağlı WinForms uygulaması yok</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Telemetri yükleniyor...</p>
            </div>
          )}
        </div>

        {/* Published Updates History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="icon text-green-600">history</span>
            Yayınlanan Güncellemeler
          </h3>
          {systemUpdates.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {systemUpdates.map((update) => (
                <div key={update.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">v{update.version}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.created_at).toLocaleDateString('tr-TR')} {new Date(update.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{update.note || 'Açıklama yok'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {update.creator?.username || 'Admin'} tarafından
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="icon text-3xl mb-2 block">update</span>
              <p>Henüz güncelleme yayınlanmadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpdateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="icon text-green-600">rocket_launch</span> Güncelleme Yayınla
            </h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <span className="icon icon-sm">info</span>
                <span className="font-medium">Canlı Güncelleme</span>
              </div>
              <p className="text-green-600 text-sm">
                Bu güncelleme tüm aktif workspace'lere anında yayınlanacak ve kullanıcılar sayfayı yenilemeden değişiklikleri görecektir.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Versiyon</label>
              <input
                type="text"
                value={updateVersion}
                onChange={(e) => setUpdateVersion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                placeholder="1.0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Güncelleme Notu</label>
              <textarea
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-24 resize-none"
                placeholder="Güncelleme açıklaması..."
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handlePublishUpdate}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <span className="icon icon-sm">send</span> Yayınla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
