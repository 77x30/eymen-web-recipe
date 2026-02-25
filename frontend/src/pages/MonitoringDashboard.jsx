import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import api from '../services/api';

const monitoringSections = [
  { id: 'capacity-usage', icon: 'battery_charging_full', titleTr: 'Canlı Kapasite Kullanımı', titleEn: 'Live Capacity Usage', descTr: 'Anlık kapasite kullanım oranlarının izlenmesi', descEn: 'Real-time capacity utilization monitoring' },
  { id: 'equipment-performance', icon: 'manufacturing', titleTr: 'Canlı Ekipman Performansı', titleEn: 'Live Equipment Performance', descTr: 'Makine ve ekipman performans metrikleri', descEn: 'Machine and equipment performance metrics' },
  { id: 'scrap-defect', icon: 'delete_sweep', titleTr: 'Canlı Hurda / Hata Analizi', titleEn: 'Live Scrap / Defect Analysis', descTr: 'Gerçek zamanlı hurda ve hata oranları', descEn: 'Real-time scrap and defect rates' },
  { id: 'oee-trends', icon: 'trending_up', titleTr: 'OEE / Hurda / Duruş Trendleri', titleEn: 'OEE / Scrap / Downtime Trends', descTr: 'Canlı OEE, hurda ve duruş trend analizi', descEn: 'Live OEE, scrap and downtime trend analysis' },
  { id: 'auto-reporting', icon: 'summarize', titleTr: 'Otomatik Raporlama', titleEn: 'Automatic Reporting', descTr: 'Otomatik rapor oluşturma ve dağıtım', descEn: 'Automatic report generation and distribution' },
];

export default function MonitoringDashboard() {
  const { isDark } = useTheme();
  const { locale } = useLocale();
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/system/status');
        setSystemStatus(response.data);
      } catch {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          <span className="icon mr-2 text-green-500" style={{fontSize: '28px'}}>monitor_heart</span>
          {locale === 'tr' ? 'Canlı İzleme' : 'Online Monitoring'}
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          {locale === 'tr' ? 'Gerçek zamanlı sistem ve üretim izleme' : 'Real-time system and production monitoring'}
        </p>
      </div>

      {/* Live System Status Bar */}
      {systemStatus && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {locale === 'tr' ? 'Sistem Durumu - Canlı' : 'System Status - Live'}
            </h3>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {locale === 'tr' ? 'Her 10 saniyede güncellenir' : 'Updates every 10 seconds'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>API</p>
              <p className="text-lg font-bold text-green-500">{systemStatus.latency?.api || 0}ms</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Database</p>
              <p className="text-lg font-bold text-blue-500">{systemStatus.latency?.database || 0}ms</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Memory</p>
              <p className="text-lg font-bold text-purple-500">{systemStatus.memory?.usedMb || 0} MB</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uptime</p>
              <p className={`text-lg font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{Math.floor((systemStatus.uptime || 0) / 3600)}h</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{locale === 'tr' ? 'Kullanıcılar' : 'Users'}</p>
              <p className="text-lg font-bold text-amber-500">{systemStatus.records?.users || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{locale === 'tr' ? 'İstemciler' : 'Clients'}</p>
              <p className="text-lg font-bold text-cyan-500">{systemStatus.records?.activeClients || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monitoringSections.map((section, idx) => {
          const colors = ['from-green-500 to-emerald-600', 'from-cyan-500 to-blue-600', 'from-red-500 to-rose-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600'];
          return (
            <div
              key={section.id}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className={`${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 group ${
                activeSection === section.id ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors[idx % colors.length]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="icon text-white text-2xl">{section.icon}</span>
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {locale === 'tr' ? section.titleTr : section.titleEn}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {locale === 'tr' ? section.descTr : section.descEn}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-yellow-400' : 'bg-yellow-500'}`}></span>
                    <span className={`text-xs font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {locale === 'tr' ? 'Yakında' : 'Coming Soon'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeSection && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg p-8 border-2 border-dashed text-center`}>
          <span className="icon text-5xl mb-3 block text-green-500">construction</span>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {locale === 'tr' ? 'Bu modül geliştirme aşamasında' : 'This module is under development'}
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto`}>
            {locale === 'tr'
              ? 'Canlı izleme modülü yakında aktif olacaktır. Gerçek zamanlı veriler, gösterge panelleri ve anlık uyarılar bu alandan erişilebilir olacak.'
              : 'Live monitoring module will be active soon. Real-time data, dashboards and instant alerts will be accessible from here.'}
          </p>
        </div>
      )}
    </div>
  );
}
