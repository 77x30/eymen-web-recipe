import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RecipeManager from './pages/RecipeManager';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import BiometricVerification from './pages/BiometricVerification';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Admin only routes
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { notFound, isIdentityDomain, isMainDomain, isSubdomain, loading: workspaceLoading } = useWorkspace();

  // Show loading while checking workspace
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show 404 if workspace not found (subdomain that doesn't exist)
  if (notFound) {
    return <NotFound />;
  }

  // Identity domain for biometric verification
  if (isIdentityDomain) {
    return (
      <Routes>
        <Route path="/verify/:token" element={<BiometricVerification />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="icon text-5xl text-blue-400">qr_code_2</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Barida Identity</h1>
              <p className="text-gray-400">Biyometrik doğrulama için QR kodu taratın</p>
            </div>
          </div>
        } />
      </Routes>
    );
  }

  // Subdomain - workspace with recipes
  if (isSubdomain) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="recipes" element={<RecipeManager />} />
          <Route path="recipes/:id" element={<RecipeManager />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Main domain (barida.xyz) or fallback - Admin dashboard only
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute adminOnly>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="workspaces" element={<AdminPanel />} />
        <Route path="users" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
