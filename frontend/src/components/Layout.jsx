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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center gap-3">
              <img 
                src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
                alt="Barida" 
                className="h-8"
              />
              <h1 className="text-xl font-bold">Recipe Management</h1>
            </div>
            <nav className="flex space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg transition ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                📊 Dashboard
              </Link>
              <Link 
                to="/recipes" 
                className={`px-4 py-2 rounded-lg transition ${
                  location.pathname.startsWith('/recipes')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                📋 Recipes
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 rounded-lg transition ${
                    isActive('/admin')
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  ⚙️ Admin
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
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm">
          © 2026 Barida Makina • Industrial Solutions
        </div>
      </footer>
    </div>
  );
}
