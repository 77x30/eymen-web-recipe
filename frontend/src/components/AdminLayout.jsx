import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useVersion } from '../context/VersionContext';
import SettingsModal from './SettingsModal';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLocale();
  const { version } = useVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`shadow-lg sticky top-0 z-40 ${isDark ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-r from-gray-900 to-gray-800'} text-white`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
                B
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">BARIDA</h1>
                <p className="text-[10px] text-red-300 leading-tight">{t('footer.adminPanel')}</p>
              </div>
            </div>
            <nav className="flex space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isActive('/') 
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="icon icon-sm">dashboard</span> {t('nav.dashboard')}
              </Link>
              <Link 
                to="/workspaces" 
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isActive('/workspaces')
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="icon icon-sm">business</span> {t('nav.workspaces')}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition"
              title={t('nav.settings')}
            >
              <span className="icon">settings</span>
            </button>
            
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition"
              title={t('nav.appInfo')}
            >
              <span className="icon">info</span>
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium">{user?.username}</div>
                <div className="text-red-400 text-xs">Admin</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <span className="icon icon-sm">logout</span> {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1 pb-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-3 fixed bottom-0 left-0 right-0 z-30 shadow-lg border-t border-gray-700">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>{t('footer.copyright')}</span>
            <span className="text-gray-600">|</span>
            <span className="text-red-400">{t('footer.adminPanel')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">v{version}</span>
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {t('common.online')}
            </span>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfo(false)}>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-black">B</span>
              </div>
              <h2 className="text-2xl font-bold">{t('info.adminTitle')}</h2>
              <p className="text-red-200 text-sm mt-1">{t('info.adminSubtitle')}</p>
            </div>
            
            <div className={`p-6 space-y-4 ${isDark ? 'text-gray-300' : ''}`}>
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-gray-700' : ''}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('info.version')}</span>
                <span className="font-medium">v{version}</span>
              </div>
              <div className={`flex justify-between py-2 border-b ${isDark ? 'border-gray-700' : ''}`}>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('info.status')}</span>
                <span className="flex items-center gap-2 text-green-600">
                  <span className="icon icon-sm">check_circle</span> {t('admin.active')}
                </span>
              </div>
              <div className={`py-2 border-b ${isDark ? 'border-gray-700' : ''}`}>
                <div className={isDark ? 'text-gray-400 mb-1' : 'text-gray-500 mb-1'}>{t('info.administrator')}</div>
                <div className="font-medium">{user?.username}</div>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('info.systemAdmin')}</div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowInfo(false)}
                className={`w-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} py-3 rounded-xl font-medium transition`}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
