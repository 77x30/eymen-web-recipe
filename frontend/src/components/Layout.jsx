import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-700 text-white shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">Recipe Management System</h1>
            <nav className="flex space-x-4">
              <Link to="/" className="hover:text-gray-300 transition">Dashboard</Link>
              <Link to="/recipes" className="hover:text-gray-300 transition">Recipes</Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user?.username} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
