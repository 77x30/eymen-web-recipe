import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const APP_VERSION = '1.0.0';
const CREATOR = 'Eymen Gözel';
const CREATOR_TITLE = 'Otomasyon ve Yazılım Sorumlusu';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center gap-3">
              {/* White Barida Logo Text */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
                  B
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight">BARIDA</h1>
                  <p className="text-[10px] text-blue-300 leading-tight">Recipe Management</p>
                </div>
              </div>
            </div>
            <nav className="flex space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="icon icon-sm">dashboard</span> Dashboard
              </Link>
              <Link 
                to="/recipes" 
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  location.pathname.startsWith('/recipes')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="icon icon-sm">receipt_long</span> Recipes
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    isActive('/admin')
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="icon icon-sm">admin_panel_settings</span> Admin
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Info Button */}
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition"
              title="Uygulama Bilgisi"
            >
              <span className="icon">info</span>
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium">{user?.username}</div>
                <div className="text-gray-400 text-xs capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <span className="icon icon-sm">logout</span> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1 pb-16">
        <Outlet />
      </main>

      {/* Footer - Fixed */}
      <footer className="bg-gray-800 text-gray-400 py-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg border-t border-gray-700">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>© 2026 Barida Makina</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">Industrial Solutions</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">v{APP_VERSION}</span>
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-black">B</span>
              </div>
              <h2 className="text-2xl font-bold">Barida Recipe Management</h2>
              <p className="text-blue-200 text-sm mt-1">Endüstriyel Reçete Yönetim Sistemi</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Sürüm</span>
                <span className="font-medium">v{APP_VERSION}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Durum</span>
                <span className="flex items-center gap-2 text-green-600">
                  <span className="icon icon-sm">check_circle</span> Güncel
                </span>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-500 mb-1">Geliştirici</div>
                <div className="font-medium">{CREATOR}</div>
                <div className="text-sm text-gray-400">{CREATOR_TITLE}</div>
              </div>
              <div className="py-2">
                <div className="text-gray-500 mb-1">Şirket</div>
                <div className="font-medium">Barida Makina</div>
                <div className="text-sm text-gray-400">www.baridamakina.com</div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
