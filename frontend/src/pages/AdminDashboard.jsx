import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
  const [maintenanceItems, setMaintenanceItems] = useState([
    { id: 1, title: 'Veritabanı Yedekleme', date: '2026-02-20', status: 'scheduled', type: 'backup' },
    { id: 2, title: 'Güvenlik Güncellemesi v1.0.1', date: '2026-02-25', status: 'pending', type: 'update' },
    { id: 3, title: 'SSL Sertifika Yenileme', date: '2026-03-15', status: 'scheduled', type: 'maintenance' }
  ]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({ title: '', date: '', type: 'maintenance' });
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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

  // Monthly activity simulation
  const monthlyActivity = [
    { month: 'Oca', logins: 245, recipes: 12, workspaces: 2 },
    { month: 'Şub', logins: 312, recipes: 18, workspaces: 3 },
    { month: 'Mar', logins: 428, recipes: 25, workspaces: 4 },
    { month: 'Nis', logins: 389, recipes: 22, workspaces: 4 },
    { month: 'May', logins: 456, recipes: 30, workspaces: 5 },
    { month: 'Haz', logins: 521, recipes: 35, workspaces: 6 }
  ];

  const handleAddMaintenance = () => {
    if (newMaintenance.title && newMaintenance.date) {
      setMaintenanceItems([
        ...maintenanceItems,
        {
          id: Date.now(),
          ...newMaintenance,
          status: 'scheduled'
        }
      ]);
      setNewMaintenance({ title: '', date: '', type: 'maintenance' });
      setShowMaintenanceModal(false);
    }
  };

  const handlePublishUpdate = () => {
    if (updateNote) {
      // In real app, this would trigger live update across all workspaces
      alert('Güncelleme tüm workspace\'lere yayınlandı!');
      setUpdateNote('');
      setShowUpdateModal(false);
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
            onClick={() => setShowMaintenanceModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <span className="icon icon-sm">build</span> Bakım Planla
          </button>
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
        {/* Monthly Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aylık Aktivite</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyActivity}>
              <defs>
                <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
              />
              <Legend />
              <Area type="monotone" dataKey="logins" stroke="#3B82F6" fillOpacity={1} fill="url(#colorLogins)" name="Giriş Sayısı" />
            </AreaChart>
          </ResponsiveContainer>
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

      {/* Workspaces and Maintenance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspaces Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Workspace'ler</h3>
            <Link to="/workspaces" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
              Tümünü Gör <span className="icon icon-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {workspaces.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
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
              <div className="text-center py-8 text-gray-500">
                <span className="icon text-4xl mb-2 block">business</span>
                <p>Henüz workspace yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Planned Maintenance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Planlı Bakım</h3>
            <button 
              onClick={() => setShowMaintenanceModal(true)}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
            >
              <span className="icon icon-sm">add</span> Ekle
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {maintenanceItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === 'backup' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'update' ? 'bg-green-100 text-green-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <span className="icon">
                      {item.type === 'backup' ? 'backup' :
                       item.type === 'update' ? 'system_update' : 'build'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.title}</h4>
                    <p className="text-gray-500 text-xs">{new Date(item.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.status === 'scheduled' ? 'Planlandı' :
                   item.status === 'pending' ? 'Bekliyor' : 'Tamamlandı'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <p className="text-green-600 text-xs">Yanıt: 45ms</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Veritabanı</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Aktif</p>
            <p className="text-green-600 text-xs">Railway MySQL</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Frontend</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Aktif</p>
            <p className="text-green-600 text-xs">Vercel Edge</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">SSL</span>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <p className="text-2xl font-bold text-green-700">Geçerli</p>
            <p className="text-green-600 text-xs">Let's Encrypt</p>
          </div>
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMaintenanceModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="icon text-orange-600">build</span> Bakım Planla
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={newMaintenance.title}
                  onChange={(e) => setNewMaintenance({...newMaintenance, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Bakım açıklaması"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) => setNewMaintenance({...newMaintenance, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({...newMaintenance, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="maintenance">Bakım</option>
                  <option value="update">Güncelleme</option>
                  <option value="backup">Yedekleme</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handleAddMaintenance}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              >
                Planla
              </button>
            </div>
          </div>
        </div>
      )}

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
