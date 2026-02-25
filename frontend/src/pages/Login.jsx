import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../components/Toast';
import QRCode from 'qrcode';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, downloading, completed, error
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { login, setUserFromToken } = useAuth();
  const { workspace, isSubdomain, isMainDomain } = useWorkspace();
  const { t } = useLocale();
  const { addToast, updateToast, removeToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Download launcher handler
  const handleDownloadLauncher = () => {
    setShowDownloadModal(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    
    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadStatus('completed');
        // Trigger actual download
        const link = document.createElement('a');
        link.href = '/downloads/BaridaLauncher-Setup.exe';
        link.download = 'BaridaLauncher-Setup.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setDownloadProgress(Math.min(progress, 100));
    }, 200);
  };

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
    
    // Show API testing toast
    const toastId = addToast(t('login.apiTesting'), 'loading', 0);
    
    try {
      // Get subdomain from current hostname
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      let subdomain = null;
      
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'admin') {
        subdomain = parts[0];
      }

      const result = await login(username, password, subdomain);
      
      // Update toast to success
      updateToast(toastId, t('login.apiConnected'), 'success');
      
      // If user needs to be redirected to their workspace
      if (result.redirectToWorkspace) {
        // Clear local storage before redirect (different subdomain)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to workspace subdomain with token in URL
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const workspaceUrl = `${protocol}//${result.redirectToWorkspace}.barida.xyz${port}/login?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
        
        // Show redirect toast
        setTimeout(() => {
          removeToast(toastId);
          addToast(t('login.redirecting'), 'info', 2000);
        }, 1000);
        
        // Redirect to workspace
        setTimeout(() => {
          window.location.href = workspaceUrl;
        }, 1500);
        return;
      }
      
      // Check if biometric verification is required
      if (result.requiresBiometric) {
        removeToast(toastId);
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
        // Show redirect toast and navigate
        setTimeout(() => {
          removeToast(toastId);
          addToast(t('login.redirecting'), 'success', 2000);
        }, 800);
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      removeToast(toastId);
      setError(err.response?.data?.error || t('login.error'));
      addToast(t('login.error'), 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md h-full mx-auto px-3 sm:px-4 pt-2 pb-1 sm:pt-3 sm:pb-2 flex flex-col justify-between">
        <div className="w-full flex-1 flex flex-col justify-center min-h-0">
          {/* Logo */}
          <div className="text-center mb-2 w-full">
            <img 
              src="https://www.baridamakina.com/wp-content/uploads/2020/06/barida-logo.png" 
              alt="Barida Logo" 
              className="w-[214px] sm:w-[232px] h-auto mx-auto mb-1.5 brightness-0 invert object-contain block"
            />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">Recipe Management System</h1>
            {!isSubdomain && (
              <p className="text-gray-400 mt-0.5 text-xs sm:text-sm">
                Industrial Automation Platform
              </p>
            )}
            {isSubdomain && workspace && (
              <div className="mt-1.5 inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-xs sm:text-sm">
                <span className="icon icon-sm">business</span>
                {workspace.name}
              </div>
            )}
          </div>

          {/* Login Card */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-3 sm:p-4 border border-gray-700 w-full">
          <div className="text-center mb-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="icon text-blue-400 text-xl">login</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">{t('login.heading')}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {isSubdomain ? t('login.workspaceHint') : t('login.adminHint')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                {t('login.username')}
              </label>
              <div className="relative">
                <span className="icon icon-sm absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition"
                  placeholder={t('login.usernamePlaceholder')}
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                {t('login.password')}
              </label>
              <div className="relative">
                <span className="icon icon-sm absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <span className="icon icon-sm flex-shrink-0">error</span>
                <span className="break-words">{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-semibold text-white transition text-sm sm:text-base mt-0.5 ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-600/25'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.loading')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

        </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-1 pb-0.5 text-gray-500 text-[11px] sm:text-xs">
          {t('footer.copyright')}
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
              <h3 className="text-xl font-bold text-white mb-2">{t('biometric.required')}</h3>
              <p className="text-gray-400 text-sm mb-6">
                {t('biometric.scanQR')}
              </p>
              
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <p className="text-gray-500 text-xs mb-4">
                {t('login.redirectToIdentity')}
              </p>

              {checkingVerification && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('biometric.waiting')}</span>
                </div>
              )}

              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setCheckingVerification(false);
                }}
                className="mt-4 text-gray-400 hover:text-white text-sm"
              >
                {t('biometric.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Launcher Button - Bottom Left (only on main domain) */}
      {isMainDomain && (
        <button
          onClick={handleDownloadLauncher}
          className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 z-40"
        >
          <span className="icon">download</span>
          <span className="font-medium text-sm">{t('download.launcher')}</span>
        </button>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => downloadStatus !== 'downloading' && setShowDownloadModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {downloadStatus === 'completed' ? (
                  <span className="icon text-4xl">check_circle</span>
                ) : downloadStatus === 'error' ? (
                  <span className="icon text-4xl">error</span>
                ) : (
                  <span className="icon text-4xl animate-bounce">download</span>
                )}
              </div>
              <h3 className="text-xl font-bold">
                {downloadStatus === 'completed' ? t('download.completed') : 
                 downloadStatus === 'error' ? t('download.error') : 
                 t('download.inProgress')}
              </h3>
              <p className="text-blue-200 text-sm mt-1">Barida Launcher v1.0.0</p>
            </div>
            
            <div className="p-6">
              {/* Progress Bar */}
              {downloadStatus === 'downloading' && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{t('download.downloading')}</span>
                    <span>{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed State */}
              {downloadStatus === 'completed' && (
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                    <span className="icon">verified</span>
                    <span>{t('download.verified')}</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {t('download.instructions')}
                  </p>
                </div>
              )}

              {/* App Info */}
              <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    B
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Barida Launcher</h4>
                    <p className="text-gray-400 text-sm">{t('download.appDescription')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-600">
                  <span className="px-2 py-1 bg-gray-600/50 rounded-lg text-xs text-gray-300 flex items-center gap-1">
                    <span className="icon icon-sm">memory</span> ~85 MB
                  </span>
                  <span className="px-2 py-1 bg-gray-600/50 rounded-lg text-xs text-gray-300 flex items-center gap-1">
                    <span className="icon icon-sm">desktop_windows</span> Windows 10+
                  </span>
                  <span className="px-2 py-1 bg-gray-600/50 rounded-lg text-xs text-gray-300 flex items-center gap-1">
                    <span className="icon icon-sm">verified_user</span> {t('download.signed')}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                {downloadStatus === 'completed' && (
                  <button
                    onClick={handleDownloadLauncher}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    <span className="icon">refresh</span>
                    {t('download.downloadAgain')}
                  </button>
                )}
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className={`${downloadStatus === 'downloading' ? 'flex-1' : ''} py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition`}
                  disabled={downloadStatus === 'downloading'}
                >
                  {downloadStatus === 'downloading' ? t('download.pleaseWait') : t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
