import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

const sections = [
  { id: 'daily-production', icon: 'factory', titleTr: 'Günlük Üretim Raporu', titleEn: 'Daily Production Report', descTr: 'Günlük üretim verilerinin analizi ve raporlaması', descEn: 'Daily production data analysis and reporting' },
  { id: 'production-analysis', icon: 'query_stats', titleTr: 'Üretim Analizi', titleEn: 'Production Analysis', descTr: 'Üretim hızı, verimlilik ve trend analizi', descEn: 'Production speed, efficiency and trend analysis' },
  { id: 'employee-performance', icon: 'groups', titleTr: 'Çalışan Performansı', titleEn: 'Employee Performance', descTr: 'Yanıt süresi, çözüm süresi, çalışma saatleri analizi', descEn: 'Response time, resolution time, working hours analysis' },
  { id: 'machine-utilization', icon: 'precision_manufacturing', titleTr: 'Makine Kullanımı', titleEn: 'Machine Utilization', descTr: 'Makine kullanım oranları ve verimlilik analizi', descEn: 'Machine usage rates and efficiency analysis' },
  { id: 'cycle-time', icon: 'timer', titleTr: 'Çevrim Süresi Analizi', titleEn: 'Cycle Time Analysis', descTr: 'Üretim çevrim süreleri ve optimizasyon', descEn: 'Production cycle times and optimization' },
  { id: 'breakdown-downtime', icon: 'build_circle', titleTr: 'Arıza / Duruş Analizi', titleEn: 'Breakdown / Downtime Analysis', descTr: 'Makine arızaları, planlı ve plansız duruşların analizi', descEn: 'Machine breakdowns, planned and unplanned downtime analysis' },
  { id: 'quality-analysis', icon: 'verified', titleTr: 'Ürün Kalite Analizi', titleEn: 'Quality Analysis by Product', descTr: 'Ürün bazlı kalite kontrol ve hata oranı analizi', descEn: 'Product-based quality control and defect rate analysis' },
  { id: 'raw-materials', icon: 'inventory_2', titleTr: 'Hammadde Kullanım Analizi', titleEn: 'Raw Materials Utilization', descTr: 'Hammadde tüketimi, israf oranları ve maliyet analizi', descEn: 'Raw material consumption, waste rates and cost analysis' },
  { id: 'kpi-analysis', icon: 'speed', titleTr: 'KPI Analizi', titleEn: 'Key Performance Indicators', descTr: 'Temel performans göstergelerinin izlenmesi ve raporlaması', descEn: 'Monitoring and reporting of key performance indicators' },
  { id: 'planned-vs-actual', icon: 'compare_arrows', titleTr: 'Planlanan vs Gerçekleşen', titleEn: 'Planned vs Actual', descTr: 'Hedef ve gerçekleşen üretim karşılaştırması', descEn: 'Target vs actual production comparison' },
];

const statusColors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600', 'from-amber-500 to-amber-600', 'from-red-500 to-red-600', 'from-cyan-500 to-cyan-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600', 'from-orange-500 to-orange-600'];

export default function AnalysisDashboard() {
  const { isDark } = useTheme();
  const { locale } = useLocale();
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          <span className="icon mr-2 text-blue-500" style={{fontSize: '28px'}}>analytics</span>
          {locale === 'tr' ? 'Dinamik Analiz & Raporlama' : 'Dynamic Analysis & Reporting'}
        </h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          {locale === 'tr' ? 'Üretim, performans ve kalite analizleri' : 'Production, performance and quality analytics'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={`${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 group ${
              activeSection === section.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${statusColors[idx % statusColors.length]} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className="icon text-white text-xl">{section.icon}</span>
            </div>
            <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {locale === 'tr' ? section.titleTr : section.titleEn}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {locale === 'tr' ? section.descTr : section.descEn}
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-yellow-400' : 'bg-yellow-500'}`}></span>
              <span className={`text-xs font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {locale === 'tr' ? 'Yakında' : 'Coming Soon'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeSection && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg p-8 border-2 border-dashed text-center`}>
          <span className="icon text-5xl mb-3 block text-blue-500">engineering</span>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {locale === 'tr' ? 'Bu modül geliştirme aşamasında' : 'This module is under development'}
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto`}>
            {locale === 'tr' 
              ? 'Bu analiz modülü yakında aktif olacaktır. Gerçek zamanlı üretim verileri, grafikler ve detaylı raporlar bu alandan erişilebilir olacak.'
              : 'This analysis module will be active soon. Real-time production data, charts and detailed reports will be accessible from here.'}
          </p>
        </div>
      )}
    </div>
  );
}
