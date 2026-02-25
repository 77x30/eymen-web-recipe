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
    'login.redirectToIdentity': 'QR kodu taratarak identity.barida.xyz adresine yönlendirileceksiniz',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.newRecipe': 'Yeni Reçete',
    'dashboard.totalRecipes': 'Toplam Reçete',
    'dashboard.totalRecords': 'Toplam Kayıt',
    'dashboard.totalElements': 'Toplam Element',
    'dashboard.recentActivity': 'Son Aktivite',
    'dashboard.quickActions': 'Hızlı İşlemler',
    'dashboard.recipeManagement': 'Reçete Yönetimi',
    'dashboard.recipeManagementDesc': 'Reçeteleri görüntüle ve düzenle',
    'dashboard.createRecord': 'Kayıt Oluştur',
    'dashboard.createRecordDesc': 'Yeni veri kaydı ekle',
    'dashboard.statistics': 'İstatistikler',
    'dashboard.statisticsDesc': 'Detaylı raporları görüntüle',
    'dashboard.biometricRequired': 'Sistemi tam olarak kullanmak için yüz doğrulaması yapmanız gerekmektedir.',
    'dashboard.startVerification': 'Doğrulamayı Başlat',
    'dashboard.scanQRDescription': 'Telefonunuzla QR kodu taratarak yüz doğrulaması yapın. Doğrulama tamamlandığında bu panel otomatik olarak kapanacaktır.',
    'dashboard.doLater': 'Daha sonra yap',
    'dashboard.subAdmin': 'Alt Admin',
    'dashboard.operator': 'Operatör',
    'dashboard.viewer': 'İzleyici',
    'dashboard.verified': 'Doğrulandı',
    'dashboard.pendingVerification': 'Doğrulama Bekliyor',
    'dashboard.avgParams': 'Ortalama Parametre',
    'dashboard.recipeOverview': 'Reçete Genel Bakış',
    'dashboard.parameters': 'Parametreler',
    'dashboard.records': 'Kayıtlar',
    'dashboard.elements': 'element',
    'dashboard.noRecipesYet': 'Henüz reçete yok',
    'dashboard.elementDistribution': 'Reçete Element Dağılımı',
    'dashboard.noDescription': 'Açıklama yok',
    'dashboard.createFirstRecipe': 'Başlamak için ilk reçetenizi oluşturun!',
    'dashboard.createRecipe': 'Reçete Oluştur',
    
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
    'admin.newWorkspace': 'Yeni Workspace',
    'admin.newWorkspaceDesc': 'Yeni müşteri workspace\'i oluştur',
    'admin.addUser': 'Kullanıcı Ekle',
    'admin.addUserDesc': 'Yeni kullanıcı veya admin oluştur',
    'admin.publishUpdateDesc': 'Tüm workspace\'lere anlık güncelleme',
    'admin.usersPerWorkspace': 'Workspace Başına Kullanıcı',
    'admin.roleDistribution': 'Rol Dağılımı',
    'admin.noUsers': 'Kullanıcı yok',
    'admin.winformsApps': 'WinForms Uygulamaları',
    'admin.online': 'Çevrimiçi',
    'admin.idle': 'Boşta',
    'admin.offline': 'Çevrimdışı',
    'admin.avgRam': 'Ort. RAM',
    'admin.versionDistribution': 'Versiyon Dağılımı',
    'admin.connectedClients': 'Bağlı İstemciler',
    'admin.anonymous': 'Anonim',
    'admin.noConnectedApps': 'Bağlı WinForms uygulaması yok',
    'admin.loadingTelemetry': 'Telemetri yükleniyor...',
    'admin.publishedUpdates': 'Yayınlanan Güncellemeler',
    'admin.noDescription': 'Açıklama yok',
    'admin.by': 'tarafından',
    'admin.noUpdatesYet': 'Henüz güncelleme yayınlanmadı',
    'admin.liveUpdate': 'Canlı Güncelleme',
    'admin.liveUpdateDesc': 'Bu güncelleme tüm aktif workspace\'lere anında yayınlanacak ve kullanıcılar sayfayı yenilemeden değişiklikleri görecektir.',
    'admin.version': 'Versiyon',
    'admin.updateNote': 'Güncelleme Notu',
    'admin.updateNotePlaceholder': 'Güncelleme açıklaması...',
    'admin.cancel': 'İptal',
    'admin.publish': 'Yayınla',
    'admin.publishing': 'Yayınlanıyor...',
    'admin.noWinformsConnected': 'Bağlı WinForms uygulaması yok',
    'admin.liveUpdateDescription': 'Bu güncelleme tüm aktif workspace\'lere anında yayınlanacak ve kullanıcılar sayfayı yenilemeden değişiklikleri görecektir.',
    'admin.updateDescription': 'Güncelleme açıklaması...',
    'admin.publishedBy': 'Tarafından:',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.recipes': 'Reçeteler',
    'nav.admin': 'Admin',
    'nav.management': 'Yönetim',
    'nav.workspaces': 'Workspace\'ler',
    'nav.users': 'Kullanıcılar',
    'nav.logout': 'Çıkış',
    'nav.appInfo': 'Uygulama Bilgisi',
    'nav.settings': 'Ayarlar',
    
    // Settings
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.darkMode': 'Koyu Mod',
    'settings.lightMode': 'Açık Mod',
    'settings.workspaceName': 'Workspace Adı',
    'settings.subdomain': 'Subdomain',
    'settings.subdomainNote': 'Subdomain değiştirmek için admin ile iletişime geçin',
    'settings.save': 'Kaydet',
    'settings.saving': 'Kaydediliyor...',
    'settings.saved': 'Kaydedildi!',
    'settings.cancel': 'İptal',
    'settings.general': 'Genel',
    'settings.workspace': 'Workspace',
    
    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.confirm': 'Onayla',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.close': 'Kapat',
    'common.cancel': 'İptal',
    'common.online': 'Çevrimiçi',
    
    // Footer
    'footer.copyright': '© 2026 Barida Makina • Industrial Solutions',
    'footer.adminPanel': 'Admin Panel',
    
    // Biometric
    'biometric.required': 'Biyometrik Doğrulama Gerekli',
    'biometric.scanQR': 'İlk girişiniz için yüz doğrulaması yapmanız gerekmektedir. QR kodu telefonunuzla taratın.',
    'biometric.waiting': 'Doğrulama bekleniyor...',
    'biometric.cancel': 'İptal',
    
    // Info Modal
    'info.title': 'Barida Recipe Management',
    'info.subtitle': 'Endüstriyel Reçete Yönetim Sistemi',
    'info.version': 'Sürüm',
    'info.status': 'Durum',
    'info.upToDate': 'Güncel',
    'info.developer': 'Geliştirici',
    'info.company': 'Şirket',
    'info.adminTitle': 'Barida Admin Panel',
    'info.adminSubtitle': 'Sistem Yönetim Merkezi',
    'info.administrator': 'Yönetici',
    'info.systemAdmin': 'Sistem Admini',
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
    'login.redirectToIdentity': 'You will be redirected to identity.barida.xyz by scanning the QR code',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.newRecipe': 'New Recipe',
    'dashboard.totalRecipes': 'Total Recipes',
    'dashboard.totalRecords': 'Total Records',
    'dashboard.totalElements': 'Total Elements',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recipeManagement': 'Recipe Management',
    'dashboard.recipeManagementDesc': 'View and edit recipes',
    'dashboard.createRecord': 'Create Record',
    'dashboard.createRecordDesc': 'Add new data record',
    'dashboard.statistics': 'Statistics',
    'dashboard.statisticsDesc': 'View detailed reports',
    'dashboard.biometricRequired': 'Face verification is required to fully use the system.',
    'dashboard.startVerification': 'Start Verification',
    'dashboard.scanQRDescription': 'Scan the QR code with your phone for face verification. This panel will close automatically when verification is complete.',
    'dashboard.doLater': 'Do Later',
    'dashboard.subAdmin': 'Sub Admin',
    'dashboard.operator': 'Operator',
    'dashboard.viewer': 'Viewer',
    'dashboard.verified': 'Verified',
    'dashboard.pendingVerification': 'Pending Verification',
    'dashboard.avgParams': 'Average Parameters',
    'dashboard.recipeOverview': 'Recipe Overview',
    'dashboard.parameters': 'Parameters',
    'dashboard.records': 'Records',
    'dashboard.elements': 'elements',
    'dashboard.noRecipesYet': 'No recipes yet',
    'dashboard.elementDistribution': 'Recipe Element Distribution',
    'dashboard.noDescription': 'No description',
    'dashboard.createFirstRecipe': 'Create your first recipe to get started!',
    'dashboard.createRecipe': 'Create Recipe',
    
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
    'admin.newWorkspace': 'New Workspace',
    'admin.newWorkspaceDesc': 'Create new customer workspace',
    'admin.addUser': 'Add User',
    'admin.addUserDesc': 'Create new user or admin',
    'admin.publishUpdateDesc': 'Instant update to all workspaces',
    'admin.usersPerWorkspace': 'Users Per Workspace',
    'admin.roleDistribution': 'Role Distribution',
    'admin.noUsers': 'No users',
    'admin.winformsApps': 'WinForms Applications',
    'admin.online': 'Online',
    'admin.idle': 'Idle',
    'admin.offline': 'Offline',
    'admin.avgRam': 'Avg. RAM',
    'admin.versionDistribution': 'Version Distribution',
    'admin.connectedClients': 'Connected Clients',
    'admin.anonymous': 'Anonymous',
    'admin.noConnectedApps': 'No connected WinForms apps',
    'admin.loadingTelemetry': 'Loading telemetry...',
    'admin.publishedUpdates': 'Published Updates',
    'admin.noDescription': 'No description',
    'admin.by': 'by',
    'admin.noUpdatesYet': 'No updates published yet',
    'admin.liveUpdate': 'Live Update',
    'admin.liveUpdateDesc': 'This update will be published instantly to all active workspaces and users will see changes without refreshing.',
    'admin.version': 'Version',
    'admin.updateNote': 'Update Note',
    'admin.updateNotePlaceholder': 'Update description...',
    'admin.cancel': 'Cancel',
    'admin.publish': 'Publish',
    'admin.publishing': 'Publishing...',
    'admin.noWinformsConnected': 'No connected WinForms apps',
    'admin.liveUpdateDescription': 'This update will be published instantly to all active workspaces and users will see changes without refreshing.',
    'admin.updateDescription': 'Update description...',
    'admin.publishedBy': 'By:',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.recipes': 'Recipes',
    'nav.admin': 'Admin',
    'nav.management': 'Management',
    'nav.workspaces': 'Workspaces',
    'nav.users': 'Users',
    'nav.logout': 'Logout',
    'nav.appInfo': 'App Info',
    'nav.settings': 'Settings',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.darkMode': 'Dark Mode',
    'settings.lightMode': 'Light Mode',
    'settings.workspaceName': 'Workspace Name',
    'settings.subdomain': 'Subdomain',
    'settings.subdomainNote': 'Contact admin to change subdomain',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.saved': 'Saved!',
    'settings.cancel': 'Cancel',
    'settings.general': 'General',
    'settings.workspace': 'Workspace',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.online': 'Online',
    
    // Footer
    'footer.copyright': '© 2026 Barida Makina • Industrial Solutions',
    'footer.adminPanel': 'Admin Panel',
    
    // Biometric
    'biometric.required': 'Biometric Verification Required',
    'biometric.scanQR': 'Face verification is required for your first login. Scan the QR code with your phone.',
    'biometric.waiting': 'Waiting for verification...',
    'biometric.cancel': 'Cancel',
    
    // Info Modal
    'info.title': 'Barida Recipe Management',
    'info.subtitle': 'Industrial Recipe Management System',
    'info.version': 'Version',
    'info.status': 'Status',
    'info.upToDate': 'Up to date',
    'info.developer': 'Developer',
    'info.company': 'Company',
    'info.adminTitle': 'Barida Admin Panel',
    'info.adminSubtitle': 'System Management Center',
    'info.administrator': 'Administrator',
    'info.systemAdmin': 'System Admin',
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
