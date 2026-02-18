import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import QRCode from 'qrcode';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { login, setUserFromToken } = useAuth();
  const { workspace, isSubdomain, isMainDomain } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for token in URL (redirect from main domain)
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const userFromUrl = searchParams.get('user');
    
    if (tokenFromUrl && userFromUrl) {
      try {
        const userData = JSON.parse(decodeURIComponent(userFromUrl));
        // Set token and user in localStorage
        localStorage.setItem('token', tokenFromUrl);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update auth context
        if (setUserFromToken) {
          setUserFromToken(tokenFromUrl, userData);
        }
        
        // Clear URL params and navigate to home
        window.history.replaceState({}, document.title, '/');
        navigate('/');
      } catch (e) {
        console.error('Error parsing redirect data:', e);
      }
    }
  }, [searchParams, navigate, setUserFromToken]);

  // Check verification status periodically
  useEffect(() => {
    let interval;
    if (verificationToken && checkingVerification) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/auth/verification-status/${verificationToken}`);
          if (!response.data.pending) {
            // Verification completed, refresh and navigate
            setCheckingVerification(false);
            setShowBiometricModal(false);
            navigate('/');
          }
        } catch (err) {
          // Token used or invalid - verification might be complete
          setCheckingVerification(false);
          setShowBiometricModal(false);
          navigate('/');
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [verificationToken, checkingVerification, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Get subdomain from current hostname
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      let subdomain = null;
      
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'admin') {
        subdomain = parts[0];
      }

      const result = await login(username, password, subdomain);
      
      // If user needs to be redirected to their workspace
      if (result.redirectToWorkspace) {
        // Clear local storage before redirect (different subdomain)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to workspace subdomain with token in URL
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const workspaceUrl = `${protocol}//${result.redirectToWorkspace}.barida.xyz${port}/login?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
        
        // Redirect to workspace
        window.location.href = workspaceUrl;
        return;
      }
      
      // Check if biometric verification is required
      if (result.requiresBiometric) {
        // Generate QR code for verification
        const verifyResponse = await api.post('/auth/generate-verification');
        const { verificationUrl, token } = verifyResponse.data;
        
        // Generate QR code image
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 256,
          margin: 2,
          color: { dark: '#1e40af', light: '#ffffff' }
        });
        
        setQrCodeUrl(qrDataUrl);
        setVerificationToken(token);
        setShowBiometricModal(true);
        setCheckingVerification(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
            alt="Barida Logo" 
            className="h-16 mx-auto mb-4 brightness-0 invert"
          />
          <h1 className="text-2xl font-bold text-white">Recipe Management System</h1>
          <p className="text-gray-400 mt-1">
            {isSubdomain && workspace ? workspace.company || workspace.name : 'Industrial Automation Platform'}
          </p>
          {isSubdomain && workspace && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm">
              <span className="icon icon-sm">business</span>
              {workspace.name}
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
              <span className="icon">login</span>
              Oturum Aç
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isSubdomain ? 'Workspace hesabınızla giriş yapın' : 'Admin paneline giriş yapın'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="icon icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kullanıcı adınızı girin"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative">
                <span className="icon icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şifrenizi girin"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="icon icon-sm">error</span> {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  İşleniyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {!isSubdomain && (
            <p className="mt-4 text-center text-gray-500 text-xs">
              Operatörler giriş yaptığında kendi workspace adreslerine yönlendirilir
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          © 2026 Barida Makina • Industrial Solutions
        </div>
      </div>

      {/* Biometric Verification Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="icon text-4xl text-blue-400">qr_code_scanner</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Biyometrik Doğrulama Gerekli</h3>
              <p className="text-gray-400 text-sm mb-6">
                İlk girişiniz için yüz doğrulaması yapmanız gerekmektedir. QR kodu telefonunuzla taratın.
              </p>
              
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <p className="text-gray-500 text-xs mb-4">
                QR kodu taratarak identity.barida.xyz adresine yönlendirileceksiniz
              </p>

              {checkingVerification && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Doğrulama bekleniyor...</span>
                </div>
              )}

              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setCheckingVerification(false);
                }}
                className="mt-4 text-gray-400 hover:text-white text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
