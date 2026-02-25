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
  const { t, locale, setLocale } = useLocale();
  const { addToast, updateToast, removeToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fileSize, setFileSize] = useState('~85 MB'); // Default placeholder

  // Fetch actual file size on mount
  useEffect(() => {
    const fetchSize = async () => {
      try {
        const response = await fetch('/downloads/BaridaRecipeManager.exe', { method: 'HEAD' });
        if (response.ok) {
          const bytes = parseInt(response.headers.get('content-length') || 0);
          if (bytes > 0) {
            const mb = (bytes / (1024 * 1024)).toFixed(1);
            setFileSize(`${mb} MB`);
          }
        }
      } catch (error) {
        console.error('Error fetching file size:', error);
      }
    };
    fetchSize();
  }, []);

  // Download launcher handler
  const handleDownloadLauncher = () => {
    setShowDownloadModal(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    
    // Simulate download progress while actually preparing download
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadStatus('completed');
        // Trigger actual download - single exe
        const link = document.createElement('a');
        link.href = '/downloads/BaridaRecipeManager.exe';
        link.download = 'BaridaRecipeManager.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setDownloadProgress(Math.min(progress, 100));
    }, 120);
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
    <div className="relative min-h-screen w-full bg-[#0a0a0f] overflow-hidden flex">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-r from-blue-600/8 to-cyan-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-indigo-600/8 to-purple-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Left Section - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25">
              B
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Barida</span>
          </div>
        </div>
        
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            {locale === 'tr' ? 'Endüstriyel Reçete Yönetimi' : 'Industrial Recipe Management'}
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            {locale === 'tr' 
              ? 'Üretim süreçlerinizi optimize edin. Reçetelerinizi merkezi olarak yönetin, izleyin ve analiz edin.'
              : 'Optimize your production processes. Centrally manage, monitor and analyze your recipes.'}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="icon text-green-400">verified</span>
              <span className="text-sm">{locale === 'tr' ? 'SSL Güvenli' : 'SSL Secured'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="icon text-blue-400">cloud_done</span>
              <span className="text-sm">{locale === 'tr' ? 'Bulut Tabanlı' : 'Cloud Based'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="icon text-purple-400">speed</span>
              <span className="text-sm">{locale === 'tr' ? 'Gerçek Zamanlı' : 'Real-time'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-gray-600 text-sm">
          {t('footer.copyright')}
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Language Selector */}
          <div className="flex justify-end gap-1 mb-8">
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                locale === 'en' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('tr')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                locale === 'tr' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              TR
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25">
              B
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Barida</span>
          </div>

          {/* Workspace Badge */}
          {isSubdomain && workspace && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
                {workspace.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-white text-sm font-medium">{workspace.name}</span>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t('login.heading')}</h2>
            <p className="text-gray-500">
              {isSubdomain ? t('login.workspaceHint') : t('login.adminHint')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
                placeholder={t('login.usernamePlaceholder')}
                required
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
                placeholder={t('login.passwordPlaceholder')}
                required
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <span className="icon flex-shrink-0">error_outline</span>
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
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
                <span className="flex items-center justify-center gap-2">
                  {t('login.submit')}
                  <span className="icon text-lg">arrow_forward</span>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
          </div>

          {/* Download Launcher CTA (only on main domain) */}
          {isMainDomain && (
            <button
              onClick={handleDownloadLauncher}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all group"
            >
              <span className="icon text-blue-400 group-hover:scale-110 transition-transform">download</span>
              <span className="font-medium">{t('download.launcher')}</span>
            </button>
          )}

          {/* Mobile Footer */}
          <div className="lg:hidden text-center mt-8 text-gray-600 text-sm">
            {t('footer.copyright')}
          </div>
        </div>
      </div>

      {/* Biometric Verification Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-2xl p-8 max-w-md w-full border border-white/10">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="icon text-5xl text-blue-400">qr_code_scanner</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('biometric.required')}</h3>
              <p className="text-gray-400 mb-8">
                {t('biometric.scanQR')}
              </p>
              
              {qrCodeUrl && (
                <div className="bg-white p-6 rounded-2xl inline-block mb-6 shadow-xl">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <p className="text-gray-600 text-sm mb-6">
                {t('login.redirectToIdentity')}
              </p>

              {checkingVerification && (
                <div className="flex items-center justify-center gap-3 text-blue-400 py-3 px-6 bg-blue-500/10 rounded-xl">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="font-medium">{t('biometric.waiting')}</span>
                </div>
              )}

              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setCheckingVerification(false);
                }}
                className="mt-6 text-gray-500 hover:text-white transition-colors text-sm"
              >
                {t('biometric.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => downloadStatus !== 'downloading' && setShowDownloadModal(false)}>
          <div className="bg-[#12121a] rounded-2xl max-w-md w-full overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative p-8 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  {downloadStatus === 'completed' ? (
                    <span className="icon text-4xl text-white">check</span>
                  ) : downloadStatus === 'error' ? (
                    <span className="icon text-4xl text-white">error_outline</span>
                  ) : (
                    <span className="icon text-4xl text-white">download</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {downloadStatus === 'completed' ? 'Barida.exe Ready' : 
                   downloadStatus === 'error' ? t('download.error') : 
                   t('download.inProgress')}
                </h3>
                <p className="text-gray-500 text-sm mt-1">Barida Launcher v1.0.0</p>
              </div>
            </div>
            
            <div className="p-6 pt-0">
              {/* Progress Bar */}
              {downloadStatus === 'downloading' && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{t('download.downloading')}</span>
                    <span className="text-white font-medium">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed State */}
              {downloadStatus === 'completed' && (
                <div className="text-center mb-6 py-4 px-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <span className="icon">verified</span>
                    <span className="font-medium">{t('download.verified')}</span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {t('download.instructions')}
                  </p>
                </div>
              )}

              {/* App Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                    B
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Barida Launcher</h4>
                    <p className="text-gray-500 text-sm">{t('download.appDescription')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                  <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="icon text-sm">memory</span> {fileSize}
                  </span>
                  <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="icon text-sm">desktop_windows</span> Windows 10+
                  </span>
                  <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="icon text-sm">verified_user</span> {t('download.signed')}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                {downloadStatus === 'completed' && (
                  <button
                    onClick={handleDownloadLauncher}
                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <span className="icon">refresh</span>
                    {t('download.downloadAgain')}
                  </button>
                )}
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className={`${downloadStatus === 'downloading' ? 'flex-1' : ''} py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all`}
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
