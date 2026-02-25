import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import QRCode from 'qrcode';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { workspace } = useWorkspace();
  const { t } = useLocale();
  const { isDark } = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ totalRecipes: 0, totalRecords: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [showBiometricPanel, setShowBiometricPanel] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check if user needs biometric verification
  const needsBiometric = user && !user.biometric_verified && user.role !== 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for biometric verification status
  useEffect(() => {
    let interval;
    if (verificationToken && checkingVerification) {
      interval = setInterval(async () => {
        try {
          await api.get(`/auth/verification-status/${verificationToken}`);
        } catch (err) {
          // Token no longer valid = verification complete
          setCheckingVerification(false);
          setShowBiometricPanel(false);
          setQrCodeUrl('');
          refreshUser();
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [verificationToken, checkingVerification, refreshUser]);

  const startBiometricVerification = async () => {
    try {
      const response = await api.post('/auth/generate-verification');
      const { verificationUrl, token } = response.data;
      
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e40af', light: '#ffffff' }
      });
      
      setQrCodeUrl(qrDataUrl);
      setVerificationToken(token);
      setShowBiometricPanel(true);
      setCheckingVerification(true);
    } catch (error) {
      console.error('Error generating verification:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await api.get('/recipes');
      const recipesData = response.data;
      setRecipes(recipesData);
      
      // Calculate stats
      let totalRecords = 0;
      let totalElements = 0;
      recipesData.forEach(r => {
        totalElements += r.elements?.length || 0;
      });
      
      // Fetch records count for each recipe
      for (const recipe of recipesData) {
        try {
          const recordsRes = await api.get(`/recipes/${recipe.id}/records`);
          recipe.recordCount = recordsRes.data.length;
          totalRecords += recipe.recordCount;
        } catch (e) {
          recipe.recordCount = 0;
        }
      }
      
      setStats({
        totalRecipes: recipesData.length,
        totalRecords,
        totalElements
      });
      setRecipes([...recipesData]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const recipeChartData = recipes.map(r => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
    elements: r.elements?.length || 0,
    records: r.recordCount || 0
  }));

  const pieData = recipes.map(r => ({
    name: r.name,
    value: r.elements?.length || 0
  }));



  // Chart dark mode colors
  const chartBg = isDark ? '#1f2937' : '#ffffff';
  const chartText = isDark ? '#9ca3af' : '#6b7280';
  const chartGrid = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? '#111827' : '#1f2937';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Biometric Verification Alert Banner */}
      {needsBiometric && !showBiometricPanel && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="icon icon-lg">face</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{t('biometric.required')}</h3>
                <p className="text-amber-100 text-sm">{t('dashboard.biometricRequired')}</p>
              </div>
            </div>
            <button
              onClick={startBiometricVerification}
              className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition flex items-center gap-2"
            >
              <span className="icon icon-sm">qr_code_scanner</span>
              {t('dashboard.startVerification')}
            </button>
          </div>
        </div>
      )}

      {/* Biometric QR Panel */}
      {showBiometricPanel && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-2 border-blue-500`}>
          <div className="flex items-center gap-8">
            <div className="bg-white p-4 rounded-xl border">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{t('biometric.required')}</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                {t('dashboard.scanQRDescription')}
              </p>
              <div className="flex items-center gap-4">
                {checkingVerification && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('biometric.waiting')}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowBiometricPanel(false);
                    setCheckingVerification(false);
                  }}
                  className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} text-sm`}
                >
                  {t('dashboard.doLater')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.username}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user?.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user?.role === 'sub_admin' ? 'bg-orange-100 text-orange-700' :
                  user?.role === 'operator' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {user?.role === 'admin' ? 'Admin' :
                   user?.role === 'sub_admin' ? t('dashboard.subAdmin') :
                   user?.role === 'operator' ? t('dashboard.operator') : t('dashboard.viewer')}
                </span>
                {workspace && (
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                    <span className="icon icon-sm">business</span>
                    {workspace.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role !== 'admin' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                user?.biometric_verified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <span className="icon icon-sm">
                  {user?.biometric_verified ? 'verified_user' : 'pending'}
                </span>
                <span className="text-sm font-medium">
                  {user?.biometric_verified ? t('dashboard.verified') : t('dashboard.pendingVerification')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.title')}</h1>
        <Link
          to="/recipes"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="icon icon-sm">add</span> {t('dashboard.newRecipe')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">{t('dashboard.totalRecipes')}</p>
              <p className="text-3xl font-bold">{stats.totalRecipes}</p>
            </div>
            <span className="icon icon-lg opacity-80">description</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{t('dashboard.totalRecords')}</p>
              <p className="text-3xl font-bold">{stats.totalRecords}</p>
            </div>
            <span className="icon icon-lg opacity-80">analytics</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{t('dashboard.totalElements')}</p>
              <p className="text-3xl font-bold">{stats.totalElements}</p>
            </div>
            <span className="icon icon-lg opacity-80">settings</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">{t('dashboard.avgParams')}</p>
              <p className="text-3xl font-bold">{stats.totalRecipes > 0 ? Math.round(stats.totalElements / stats.totalRecipes) : 0}</p>
            </div>
            <span className="icon icon-lg opacity-80">tune</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Overview Bar Chart */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>{t('dashboard.recipeOverview')}</h3>
          {recipeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recipeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="name" stroke={chartText} tick={{ fontSize: 12 }} />
                <YAxis stroke={chartText} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Legend />
                <Bar dataKey="elements" name={t('dashboard.parameters')} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="records" name={t('dashboard.records')} fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('dashboard.noRecipesYet')}
            </div>
          )}
        </div>

        {/* Recipe Elements Distribution */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>{t('dashboard.elementDistribution')}</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('dashboard.noRecipesYet')}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Cards */}
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>{t('nav.recipes')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe, index) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className={`${isDark ? 'bg-gray-800 hover:shadow-xl' : 'bg-white hover:shadow-xl'} rounded-xl shadow-lg transition-all duration-300 overflow-hidden group`}
            >
              <div className={`h-2 bg-gradient-to-r ${
                index % 3 === 0 ? 'from-blue-500 to-blue-600' :
                index % 3 === 1 ? 'from-green-500 to-green-600' :
                'from-purple-500 to-purple-600'
              }`}></div>
              <div className="p-5">
                <h3 className={`font-semibold text-lg ${isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'} transition`}>
                  {recipe.name}
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1 line-clamp-2`}>
                  {recipe.description || t('dashboard.noDescription')}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="icon icon-sm text-blue-500">settings</span> {recipe.elements?.length || 0} {t('dashboard.elements')}
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="icon icon-sm text-green-500">analytics</span> {recipe.recordCount || 0} {t('dashboard.records')}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {recipes.length === 0 && (
            <div className={`col-span-full ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
              <span className="icon icon-xl text-gray-400 mb-4 block">description</span>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('dashboard.noRecipesYet')}</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>{t('dashboard.createFirstRecipe')}</p>
              <Link
                to="/recipes"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {t('dashboard.createRecipe')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
