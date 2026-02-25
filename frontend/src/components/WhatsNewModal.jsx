import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [update, setUpdate] = useState(null);
  const { isDark } = useTheme();

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
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Yeni Güncelleme!</h2>
              <p className="text-green-100 text-sm">Versiyon {update.version}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Release date */}
          {update.released_at && (
            <div className={`flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="icon icon-sm">calendar_today</span>
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
          <div className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {update.note || 'Bu güncelleme ile sistem iyileştirmeleri yapıldı.'}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 pb-6 pt-2 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            <span className="icon icon-sm">check</span>
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
