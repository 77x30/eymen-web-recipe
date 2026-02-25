import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  tr: {
    // Login
    'login.title': 'Recipe Management System',
    'login.subtitle': 'Industrial Automation Platform',
    'login.heading': 'Oturum Aç',
    'login.workspaceHint': 'Workspace hesabınızla giriş yapın',
    'login.adminHint': 'Admin paneline giriş yapın',
    'login.username': 'Kullanıcı Adı',
    'login.usernamePlaceholder': 'Kullanıcı adınızı girin',
    'login.password': 'Şifre',
    'login.passwordPlaceholder': 'Şifrenizi girin',
    'login.submit': 'Giriş Yap',
    'login.loading': 'İşleniyor...',
    'login.apiTesting': 'Barida API bağlantısı sınanıyor...',
    'login.apiConnected': 'Bağlantı kuruldu!',
    'login.redirecting': 'Dashboard\'a yönlendiriliyorsunuz...',
    'login.error': 'Giriş başarısız',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.newRecipe': 'Yeni Reçete',
    'dashboard.totalRecipes': 'Toplam Reçete',
    'dashboard.totalRecords': 'Toplam Kayıt',
    'dashboard.totalElements': 'Toplam Element',
    'dashboard.recentActivity': 'Son Aktivite',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Sistem yönetimi ve izleme merkezi',
    'admin.publishUpdate': 'Güncelleme Yayınla',
    'admin.totalWorkspaces': 'Toplam Workspace',
    'admin.totalUsers': 'Toplam Kullanıcı',
    'admin.activeUsers': 'Aktif Kullanıcı',
    'admin.pendingVerifications': 'Bekleyen Doğrulama',
    'admin.workspaces': 'Workspace\'ler',
    'admin.viewAll': 'Tümünü Gör',
    'admin.users': 'kullanıcı',
    'admin.active': 'Aktif',
    'admin.noWorkspaces': 'Henüz workspace yok',
    'admin.systemStatus': 'Sistem Durumu',
    'admin.apiServer': 'API Sunucu',
    'admin.database': 'Veritabanı',
    'admin.frontend': 'Frontend',
    'admin.ssl': 'SSL',
    'admin.valid': 'Geçerli',
    
    // Settings
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.darkMode': 'Koyu Mod',
    'settings.lightMode': 'Açık Mod',
    'settings.workspaceName': 'Workspace Adı',
    'settings.subdomain': 'Subdomain',
    'settings.save': 'Kaydet',
    'settings.saving': 'Kaydediliyor...',
    'settings.saved': 'Kaydedildi!',
    'settings.cancel': 'İptal',
    
    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.confirm': 'Onayla',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.close': 'Kapat',
    
    // Footer
    'footer.copyright': '© 2026 Barida Makina • Industrial Solutions',
    
    // Biometric
    'biometric.required': 'Biyometrik Doğrulama Gerekli',
    'biometric.scanQR': 'İlk girişiniz için yüz doğrulaması yapmanız gerekmektedir. QR kodu telefonunuzla taratın.',
    'biometric.waiting': 'Doğrulama bekleniyor...',
    'biometric.cancel': 'İptal',
  },
  en: {
    // Login
    'login.title': 'Recipe Management System',
    'login.subtitle': 'Industrial Automation Platform',
    'login.heading': 'Sign In',
    'login.workspaceHint': 'Sign in with your workspace account',
    'login.adminHint': 'Sign in to admin panel',
    'login.username': 'Username',
    'login.usernamePlaceholder': 'Enter your username',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter your password',
    'login.submit': 'Sign In',
    'login.loading': 'Processing...',
    'login.apiTesting': 'Testing Barida API connection...',
    'login.apiConnected': 'Connection established!',
    'login.redirecting': 'Redirecting to Dashboard...',
    'login.error': 'Login failed',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.newRecipe': 'New Recipe',
    'dashboard.totalRecipes': 'Total Recipes',
    'dashboard.totalRecords': 'Total Records',
    'dashboard.totalElements': 'Total Elements',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'System management and monitoring center',
    'admin.publishUpdate': 'Publish Update',
    'admin.totalWorkspaces': 'Total Workspaces',
    'admin.totalUsers': 'Total Users',
    'admin.activeUsers': 'Active Users',
    'admin.pendingVerifications': 'Pending Verifications',
    'admin.workspaces': 'Workspaces',
    'admin.viewAll': 'View All',
    'admin.users': 'users',
    'admin.active': 'Active',
    'admin.noWorkspaces': 'No workspaces yet',
    'admin.systemStatus': 'System Status',
    'admin.apiServer': 'API Server',
    'admin.database': 'Database',
    'admin.frontend': 'Frontend',
    'admin.ssl': 'SSL',
    'admin.valid': 'Valid',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.darkMode': 'Dark Mode',
    'settings.lightMode': 'Light Mode',
    'settings.workspaceName': 'Workspace Name',
    'settings.subdomain': 'Subdomain',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.saved': 'Saved!',
    'settings.cancel': 'Cancel',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    
    // Footer
    'footer.copyright': '© 2026 Barida Makina • Industrial Solutions',
    
    // Biometric
    'biometric.required': 'Biometric Verification Required',
    'biometric.scanQR': 'Face verification is required for your first login. Scan the QR code with your phone.',
    'biometric.waiting': 'Waiting for verification...',
    'biometric.cancel': 'Cancel',
  }
};

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key) => {
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  };

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
