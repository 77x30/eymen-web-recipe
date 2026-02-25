import { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsModal({ isOpen, onClose }) {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme, isDark } = useTheme();
  const { workspace, refreshWorkspace } = useWorkspace();
  const { user } = useAuth();
  
  const [workspaceName, setWorkspaceName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || '');
      setSubdomain(workspace.subdomain || '');
    }
  }, [workspace]);

  const handleSaveWorkspace = async () => {
    if (!workspace) return;
    
    setSaving(true);
    setSaveStatus('');
    
    try {
      await api.put(`/workspaces/${workspace.id}`, {
        name: workspaceName,
        // subdomain change is not allowed for safety
      });
      
      setSaveStatus('success');
      if (refreshWorkspace) {
        refreshWorkspace();
      }
      
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving workspace:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub_admin';
  const canEditWorkspace = isAdmin || isSubAdmin;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <span className="icon text-blue-500">settings</span>
            </div>
            <h2 className="text-xl font-bold">{t('settings.title')}</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <span className="icon">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'general' 
                ? 'text-blue-500 border-b-2 border-blue-500' 
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="icon icon-sm mr-1">tune</span>
            {t('settings.general')}
          </button>
          {canEditWorkspace && workspace && (
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'workspace' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="icon icon-sm mr-1">business</span>
              {t('settings.workspace')}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <>
              {/* Language */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="icon icon-sm mr-1 align-middle">language</span>
                  {t('settings.language')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLocale('tr')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      locale === 'tr'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">🇹🇷</span>
                    <span className="font-medium">Türkçe</span>
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      locale === 'en'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">🇬🇧</span>
                    <span className="font-medium">English</span>
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="icon icon-sm mr-1 align-middle">palette</span>
                  {t('settings.theme')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="icon">light_mode</span>
                    <span className="font-medium">{t('settings.lightMode')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : isDark 
                          ? 'border-gray-600 hover:border-gray-500' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="icon">dark_mode</span>
                    <span className="font-medium">{t('settings.darkMode')}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'workspace' && workspace && (
            <>
              {/* Workspace Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="icon icon-sm mr-1 align-middle">badge</span>
                  {t('settings.workspaceName')}
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition focus:border-blue-500 focus:outline-none ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
              </div>

              {/* Subdomain (read-only display) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="icon icon-sm mr-1 align-middle">link</span>
                  {t('settings.subdomain')}
                </label>
                <div className={`flex items-center rounded-xl border-2 overflow-hidden ${
                  isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <input
                    type="text"
                    value={subdomain}
                    disabled
                    className={`flex-1 px-4 py-3 bg-transparent outline-none ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                  <span className={`px-3 py-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    .barida.xyz
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('settings.subdomainNote')}
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveWorkspace}
                disabled={saving}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : saveStatus === 'success'
                      ? 'bg-green-500 hover:bg-green-600'
                      : saveStatus === 'error'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {saving ? (
                  <>
                    <span className="icon icon-sm animate-spin">sync</span>
                    {t('settings.saving')}
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <span className="icon icon-sm">check</span>
                    {t('settings.saved')}
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <span className="icon icon-sm">error</span>
                    {t('common.error')}
                  </>
                ) : (
                  <>
                    <span className="icon icon-sm">save</span>
                    {t('settings.save')}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
