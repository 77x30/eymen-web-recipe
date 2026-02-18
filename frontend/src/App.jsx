import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecipeManager from './pages/RecipeManager';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import BiometricVerification from './pages/BiometricVerification';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { notFound, isIdentityDomain, loading: workspaceLoading } = useWorkspace();

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

  // Show 404 if workspace not found
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

export default App;
