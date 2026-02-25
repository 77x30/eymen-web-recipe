import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import api from '../services/api';

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [update, setUpdate] = useState(null);
  const { isDark } = useTheme();
  const { t } = useLocale();

  useEffect(() => {
    checkForNewUpdates();
  }, []);

  const checkForNewUpdates = async () => {
    try {
      const response = await api.get('/system/version');
      const latestUpdate = response.data;
      
      if (!latestUpdate.version || !latestUpdate.released_at) return;
      
      // Get last seen version from localStorage
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      const lastSeenTime = localStorage.getItem('lastSeenUpdateTime');
      
      // Show if: new version OR same version but newer release
      if (lastSeenVersion !== latestUpdate.version || 
          (lastSeenTime && new Date(latestUpdate.released_at) > new Date(lastSeenTime))) {
        setUpdate(latestUpdate);
        setIsOpen(true);
      }
    } catch (error) {
      // Silently ignore - API might not be available yet
    }
  };

  const handleClose = () => {
    if (update) {
      localStorage.setItem('lastSeenVersion', update.version);
      localStorage.setItem('lastSeenUpdateTime', update.released_at);
    }
    setIsOpen(false);
  };

  if (!isOpen || !update) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
      <div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-6 py-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white"></div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
              <span className="icon text-white text-3xl">new_releases</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t('update.newUpdate')}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-white text-sm font-medium">
                  v{update.version}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Release date */}
          {update.released_at && (
            <div className={`flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="icon icon-sm">schedule</span>
              {new Date(update.released_at).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Update note */}
          <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-4`}>
            <div className={`flex items-start gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className="icon text-blue-500 mt-0.5">description</span>
              <p className="text-base leading-relaxed">
                {update.note || t('update.defaultNote')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 pb-6 pt-2`}>
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <span className="icon icon-sm">check_circle</span>
            {t('update.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
