import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
              <img 
                src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
                alt="Barida" 
                className="h-8 brightness-150 contrast-125"
              />
              <h1 className="text-xl font-bold">Recipe Management</h1>
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
              <Link 
                to="/machine" 
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isActive('/machine')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="icon icon-sm">precision_manufacturing</span> Machine
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
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          © 2026 Barida Makina • Industrial Solutions
        </div>
      </footer>
    </div>
  );
}
