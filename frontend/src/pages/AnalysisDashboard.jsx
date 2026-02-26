import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
         Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];

const sections = [
  { id: 'daily-production', icon: 'factory', titleTr: 'Günlük Üretim Raporu', titleEn: 'Daily Production Report' },
  { id: 'production-analysis', icon: 'query_stats', titleTr: 'Üretim Analizi', titleEn: 'Production Analysis' },
  { id: 'employee-performance', icon: 'groups', titleTr: 'Çalışan Performansı', titleEn: 'Employee Performance' },
  { id: 'machine-utilization', icon: 'precision_manufacturing', titleTr: 'Makine Kullanımı', titleEn: 'Machine Utilization' },
  { id: 'cycle-time', icon: 'timer', titleTr: 'Çevrim Süresi Analizi', titleEn: 'Cycle Time Analysis' },
  { id: 'breakdown-downtime', icon: 'build_circle', titleTr: 'Arıza / Duruş Analizi', titleEn: 'Breakdown / Downtime' },
  { id: 'quality-analysis', icon: 'verified', titleTr: 'Kalite Analizi', titleEn: 'Quality Analysis' },
  { id: 'raw-materials', icon: 'inventory_2', titleTr: 'Hammadde Kullanımı', titleEn: 'Raw Materials' },
  { id: 'kpi-analysis', icon: 'speed', titleTr: 'KPI Analizi', titleEn: 'KPI Analysis' },
  { id: 'planned-vs-actual', icon: 'compare_arrows', titleTr: 'Planlanan vs Gerçekleşen', titleEn: 'Planned vs Actual' },
];

const gradients = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600', 'from-amber-500 to-amber-600', 'from-red-500 to-red-600', 'from-cyan-500 to-cyan-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600', 'from-orange-500 to-orange-600'];

export default function AnalysisDashboard() {
  const { isDark } = useTheme();
  const { locale } = useLocale();
  const tr = locale === 'tr';
  const [activeSection, setActiveSection] = useState(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const chartColors = {
    bg: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#111827' : '#1f2937'
  };

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    setData(null);
    const endpoints = {
      'daily-production': `/api/analytics/production/daily?days=${period}`,
      'production-analysis': `/api/analytics/production/analysis?days=${period}`,
      'employee-performance': `/api/analytics/employees?days=${period}`,
      'machine-utilization': `/api/analytics/machines?days=${period}`,
      'cycle-time': `/api/analytics/production/analysis?days=${period}`,
      'breakdown-downtime': `/api/analytics/monitoring/oee?days=${period}`,
      'quality-analysis': `/api/analytics/quality?days=${period}`,
      'raw-materials': `/api/analytics/quality?days=${period}`,
      'kpi-analysis': `/api/analytics/kpi?days=${period}`,
      'planned-vs-actual': `/api/analytics/planned-vs-actual?days=${period}`,
    };
    api.get(endpoints[activeSection])
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeSection, period]);

  const card = (cls = '') => `${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg ${cls}`;
  const label = isDark ? 'text-gray-400' : 'text-gray-500';
  const heading = isDark ? 'text-white' : 'text-gray-800';

  const renderSection = () => {
    if (loading) return (
      <div className={`${card()} p-12 text-center`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className={label}>{tr ? 'Yükleniyor...' : 'Loading...'}</p>
      </div>
    );
    if (!data) return (
      <div className={`${card()} p-12 text-center`}>
        <span className="icon text-4xl text-gray-400 block mb-2">info</span>
        <p className={label}>{tr ? 'Veri bulunamadı' : 'No data found'}</p>
      </div>
    );

    switch (activeSection) {
      case 'daily-production': return renderDailyProduction();
      case 'production-analysis': return renderProductionAnalysis();
      case 'employee-performance': return renderEmployeePerformance();
      case 'machine-utilization': return renderMachineUtilization();
      case 'cycle-time': return renderCycleTime();
      case 'breakdown-downtime': return renderBreakdownDowntime();
      case 'quality-analysis': return renderQualityAnalysis();
      case 'raw-materials': return renderRawMaterials();
      case 'kpi-analysis': return renderKPI();
      case 'planned-vs-actual': return renderPlannedVsActual();
      default: return null;
    }
  };

  // ============ DAILY PRODUCTION ============
  const renderDailyProduction = () => (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Toplam Kayıt' : 'Total Records'}</p>
          <p className={`text-3xl font-bold ${heading}`}>{data.summary?.totalRecords || 0}</p>
          <p className={`text-xs ${label}`}>{tr ? `Son ${period} gün` : `Last ${period} days`}</p>
        </div>
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Bugün' : 'Today'}</p>
          <p className="text-3xl font-bold text-green-500">{data.summary?.todayCount || 0}</p>
          <p className={`text-xs ${label}`}>{tr ? 'kayıt oluşturuldu' : 'records created'}</p>
        </div>
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Aktif Reçete' : 'Active Recipes'}</p>
          <p className="text-3xl font-bold text-blue-500">{data.summary?.totalRecipes || 0}</p>
          <p className={`text-xs ${label}`}>{tr ? 'toplam reçete' : 'total recipes'}</p>
        </div>
      </div>
      {/* Daily chart */}
      <div className={`${card()} p-5`}>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Günlük Üretim Trendi' : 'Daily Production Trend'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.daily || []}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
            <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
            <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" name={tr ? 'Kayıt' : 'Records'} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ============ PRODUCTION ANALYSIS ============
  const renderProductionAnalysis = () => (
    <div className="space-y-4">
      {/* Weekly comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Bu Hafta' : 'This Week'}</p>
          <p className={`text-3xl font-bold ${heading}`}>{data.weeklyComparison?.thisWeek || 0}</p>
        </div>
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Geçen Hafta' : 'Last Week'}</p>
          <p className={`text-3xl font-bold ${heading}`}>{data.weeklyComparison?.lastWeek || 0}</p>
        </div>
        <div className={`${card()} p-5`}>
          <p className={`text-sm ${label}`}>{tr ? 'Değişim' : 'Change'}</p>
          <p className={`text-3xl font-bold ${(data.weeklyComparison?.changePercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(data.weeklyComparison?.changePercent || 0) > 0 ? '+' : ''}{data.weeklyComparison?.changePercent || 0}%
          </p>
        </div>
      </div>
      {/* Hourly distribution */}
      <div className={`${card()} p-5`}>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Saatlik Üretim Dağılımı' : 'Hourly Production Distribution'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={(data.hourlyDistribution || []).map(h => ({ ...h, hour: `${String(h.hour).padStart(2, '0')}:00` }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="hour" tick={{ fill: chartColors.text, fontSize: 11 }} />
            <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
            <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name={tr ? 'Kayıt' : 'Records'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Recipe distribution pie */}
      <div className={`${card()} p-5`}>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Reçete Dağılımı' : 'Recipe Distribution'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={(data.recipeDistribution || []).map(r => ({ name: r['Recipe.name'] || `Recipe ${r.recipe_id}`, value: parseInt(r.count) }))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
              {(data.recipeDistribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ============ EMPLOYEE PERFORMANCE ============
  const renderEmployeePerformance = () => {
    const users = (data.userProduction || []).map(u => ({
      name: u['creator.username'] || `User ${u.created_by}`,
      records: parseInt(u.recordCount)
    }));

    return (
      <div className="space-y-4">
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Çalışan Bazlı Üretim' : 'Production by Employee'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={users} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: chartColors.text, fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="records" fill="#10B981" radius={[0, 4, 4, 0]} name={tr ? 'Kayıt' : 'Records'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Working hours table */}
        {data.workingHours?.length > 0 && (
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Çalışma Saatleri' : 'Working Hours'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    <th className="text-left p-2">{tr ? 'Tarih' : 'Date'}</th>
                    <th className="text-left p-2">{tr ? 'Kullanıcı' : 'User'}</th>
                    <th className="text-left p-2">{tr ? 'İlk Aktivite' : 'First Activity'}</th>
                    <th className="text-left p-2">{tr ? 'Son Aktivite' : 'Last Activity'}</th>
                    <th className="text-right p-2">{tr ? 'Dakika' : 'Minutes'}</th>
                    <th className="text-right p-2">{tr ? 'İşlem' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workingHours.slice(0, 20).map((wh, i) => (
                    <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className={`p-2 ${heading}`}>{wh.date}</td>
                      <td className={`p-2 ${heading}`}>{wh.created_by}</td>
                      <td className={`p-2 ${label}`}>{wh.first_activity}</td>
                      <td className={`p-2 ${label}`}>{wh.last_activity}</td>
                      <td className={`p-2 text-right font-medium ${heading}`}>{wh.active_minutes || 0}</td>
                      <td className={`p-2 text-right ${label}`}>{wh.actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============ MACHINE UTILIZATION ============
  const renderMachineUtilization = () => {
    const recipes = (data.recipeUsage || []).map(r => ({
      name: r.Recipe?.name || `Recipe ${r.recipe_id}`,
      records: parseInt(r.dataValues?.totalRecords || r.totalRecords || 0),
      elements: r.Recipe?.elements?.length || 0,
      firstUsed: r.dataValues?.firstUsed || r.firstUsed,
      lastUsed: r.dataValues?.lastUsed || r.lastUsed
    }));

    return (
      <div className="space-y-4">
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Reçete/Makine Kullanım Oranı' : 'Recipe/Machine Utilization Rate'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recipes}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="records" fill="#F59E0B" radius={[4, 4, 0, 0]} name={tr ? 'Kayıt Sayısı' : 'Record Count'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Recipe details table */}
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Reçete Detayları' : 'Recipe Details'}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  <th className="text-left p-2">{tr ? 'Reçete' : 'Recipe'}</th>
                  <th className="text-right p-2">{tr ? 'Kayıt' : 'Records'}</th>
                  <th className="text-right p-2">{tr ? 'Parametre' : 'Parameters'}</th>
                  <th className="text-left p-2">{tr ? 'Son Kullanım' : 'Last Used'}</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r, i) => (
                  <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className={`p-2 font-medium ${heading}`}>{r.name}</td>
                    <td className={`p-2 text-right ${heading}`}>{r.records}</td>
                    <td className={`p-2 text-right ${label}`}>{r.elements}</td>
                    <td className={`p-2 ${label}`}>{r.lastUsed ? new Date(r.lastUsed).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ============ CYCLE TIME ============
  const renderCycleTime = () => {
    const hourly = (data.hourlyDistribution || []).map(h => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      count: parseInt(h.count)
    }));

    // Simulate cycle time from hourly distribution
    const total = hourly.reduce((s, h) => s + h.count, 0);
    const peakHour = hourly.reduce((max, h) => h.count > max.count ? h : max, { count: 0, hour: '-' });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Toplam Döngü' : 'Total Cycles'}</p>
            <p className={`text-3xl font-bold ${heading}`}>{total}</p>
          </div>
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'En Yoğun Saat' : 'Peak Hour'}</p>
            <p className="text-3xl font-bold text-amber-500">{peakHour.hour}</p>
          </div>
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Ort. Kayıt/Saat' : 'Avg Records/Hour'}</p>
            <p className="text-3xl font-bold text-cyan-500">{hourly.length > 0 ? Math.round(total / hourly.length) : 0}</p>
          </div>
        </div>
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Saatlik Çevrim Dağılımı' : 'Hourly Cycle Distribution'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="hour" tick={{ fill: chartColors.text, fontSize: 11 }} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} dot={{ r: 4 }} name={tr ? 'Döngü' : 'Cycles'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ============ BREAKDOWN / DOWNTIME ============
  const renderBreakdownDowntime = () => {
    const daily = (data.daily || []).map(d => ({
      date: d.date?.slice(5),
      quality: d.qualityRate,
      scrap: d.scrapRate,
      records: d.totalRecords
    }));

    return (
      <div className="space-y-4">
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Günlük Kalite & Hurda Oranı' : 'Daily Quality & Scrap Rate'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="qualityG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="scrapG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 11 }} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              <Legend />
              <Area type="monotone" dataKey="quality" stroke="#10B981" fillOpacity={1} fill="url(#qualityG)" name={tr ? 'Kalite %' : 'Quality %'} />
              <Area type="monotone" dataKey="scrap" stroke="#EF4444" fillOpacity={1} fill="url(#scrapG)" name={tr ? 'Hurda %' : 'Scrap %'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={`${card()} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Günlük Üretim Miktarı' : 'Daily Production Volume'}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 11 }} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="records" fill="#6366F1" radius={[4, 4, 0, 0]} name={tr ? 'Kayıt' : 'Records'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ============ QUALITY ANALYSIS ============
  const renderQualityAnalysis = () => {
    const elements = data.elements || [];

    return (
      <div className="space-y-4">
        {/* Overall quality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Genel Kalite Skoru' : 'Overall Quality Score'}</p>
            <p className={`text-4xl font-bold ${(data.overallQuality || 0) >= 95 ? 'text-green-500' : (data.overallQuality || 0) >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
              {data.overallQuality || 0}%
            </p>
          </div>
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Toplam Ölçüm' : 'Total Measurements'}</p>
            <p className={`text-3xl font-bold ${heading}`}>{data.totalMeasurements || 0}</p>
          </div>
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Kontrollü Parametre' : 'Controlled Parameters'}</p>
            <p className="text-3xl font-bold text-blue-500">{elements.length}</p>
          </div>
        </div>
        {/* Quality per element */}
        {elements.length > 0 && (
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Parametre Bazlı Kalite' : 'Quality by Parameter'}</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, elements.length * 40)}>
              <BarChart data={elements.map(e => ({
                name: `${e.elementName} (${e.recipeName || ''})`,
                inRange: e.inRange,
                outOfRange: e.outOfRange,
                defectRate: e.defectRate
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} width={160} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                <Legend />
                <Bar dataKey="inRange" stackId="a" fill="#10B981" name={tr ? 'Aralıkta' : 'In Range'} />
                <Bar dataKey="outOfRange" stackId="a" fill="#EF4444" name={tr ? 'Dışında' : 'Out of Range'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Element detail table */}
        {elements.length > 0 && (
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Detaylı Kalite Tablosu' : 'Detailed Quality Table'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    <th className="text-left p-2">{tr ? 'Parametre' : 'Parameter'}</th>
                    <th className="text-left p-2">{tr ? 'Reçete' : 'Recipe'}</th>
                    <th className="text-right p-2">Min</th>
                    <th className="text-right p-2">Max</th>
                    <th className="text-right p-2">{tr ? 'Ort.' : 'Avg'}</th>
                    <th className="text-right p-2">{tr ? 'Std Dev' : 'Std Dev'}</th>
                    <th className="text-right p-2">{tr ? 'Hata %' : 'Defect %'}</th>
                  </tr>
                </thead>
                <tbody>
                  {elements.map((e, i) => (
                    <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className={`p-2 font-medium ${heading}`}>{e.elementName} {e.unit ? `(${e.unit})` : ''}</td>
                      <td className={`p-2 ${label}`}>{e.recipeName}</td>
                      <td className={`p-2 text-right ${label}`}>{e.minValue ?? '-'}</td>
                      <td className={`p-2 text-right ${label}`}>{e.maxValue ?? '-'}</td>
                      <td className={`p-2 text-right ${heading}`}>{e.avg}</td>
                      <td className={`p-2 text-right ${label}`}>{e.stdDev}</td>
                      <td className={`p-2 text-right font-medium ${e.defectRate > 5 ? 'text-red-500' : e.defectRate > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {e.defectRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============ RAW MATERIALS ============
  const renderRawMaterials = () => {
    const elements = data.elements || [];
    // Show element value distributions as a materials usage view
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'İzlenen Parametre' : 'Monitored Parameters'}</p>
            <p className={`text-3xl font-bold ${heading}`}>{elements.length}</p>
          </div>
          <div className={`${card()} p-5`}>
            <p className={`text-sm ${label}`}>{tr ? 'Toplam Ölçüm' : 'Total Measurements'}</p>
            <p className="text-3xl font-bold text-purple-500">{data.totalMeasurements || 0}</p>
          </div>
        </div>
        {elements.length > 0 && (
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Malzeme Kullanım Dağılımı' : 'Material Usage Distribution'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={elements.filter(e => e.totalValues > 0).map(e => ({ name: e.elementName, value: e.totalValues }))} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {elements.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Avg values radar chart */}
        {elements.length >= 3 && (
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Parametre Radar Grafiği' : 'Parameter Radar Chart'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={elements.slice(0, 8).map(e => ({
                subject: e.elementName.length > 12 ? e.elementName.slice(0, 12) + '…' : e.elementName,
                value: e.avg,
                fullMark: e.maxValue ? parseFloat(e.maxValue) : e.avg * 1.5
              }))}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.text, fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: chartColors.text, fontSize: 10 }} />
                <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name={tr ? 'Ortalama' : 'Average'} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // ============ KPI ============
  const renderKPI = () => {
    const kpis = data.kpis || [];
    const kpiColors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-amber-500', 'text-cyan-500', 'text-red-500', 'text-indigo-500'];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={kpi.id} className={`${card()} p-5`}>
              <p className={`text-sm ${label}`}>{tr ? kpi.label : kpi.label}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={`text-3xl font-bold ${kpiColors[i % kpiColors.length]}`}>{kpi.value}</p>
                {kpi.unit && <span className={`text-sm ${label}`}>{kpi.unit}</span>}
              </div>
              {kpi.change !== null && kpi.change !== undefined && (
                <p className={`text-xs mt-1 font-medium ${kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change > 0 ? '▲' : kpi.change < 0 ? '▼' : '–'} {Math.abs(kpi.change)}% {tr ? 'değişim' : 'change'}
                </p>
              )}
              {kpi.total !== undefined && (
                <p className={`text-xs mt-1 ${label}`}>{tr ? 'Toplam' : 'Total'}: {kpi.total}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============ PLANNED VS ACTUAL ============
  const renderPlannedVsActual = () => {
    const comparisons = data.comparisons || [];

    return (
      <div className="space-y-4">
        {comparisons.length > 0 ? (
          <>
            <div className={`${card()} p-5`}>
              <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Planlanan vs Gerçekleşen' : 'Planned vs Actual'}</h3>
              <ResponsiveContainer width="100%" height={Math.max(250, comparisons.length * 35)}>
                <BarChart data={comparisons.map(c => ({
                  name: `${c.elementName} (${c.recipeName})`,
                  planned: c.planned,
                  actual: c.actual
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} width={160} />
                  <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="planned" fill="#3B82F6" name={tr ? 'Planlanan' : 'Planned'} />
                  <Bar dataKey="actual" fill="#10B981" name={tr ? 'Gerçekleşen' : 'Actual'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Deviation table */}
            <div className={`${card()} p-5`}>
              <h3 className={`text-sm font-semibold mb-4 ${heading}`}>{tr ? 'Sapma Detayları' : 'Deviation Details'}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      <th className="text-left p-2">{tr ? 'Reçete' : 'Recipe'}</th>
                      <th className="text-left p-2">{tr ? 'Parametre' : 'Parameter'}</th>
                      <th className="text-right p-2">{tr ? 'Planlanan' : 'Planned'}</th>
                      <th className="text-right p-2">{tr ? 'Gerçekleşen' : 'Actual'}</th>
                      <th className="text-right p-2">{tr ? 'Sapma' : 'Deviation'}</th>
                      <th className="text-right p-2">{tr ? 'Örnek' : 'Samples'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((c, i) => (
                      <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`p-2 ${heading}`}>{c.recipeName}</td>
                        <td className={`p-2 font-medium ${heading}`}>{c.elementName} {c.unit ? `(${c.unit})` : ''}</td>
                        <td className={`p-2 text-right text-blue-500`}>{c.planned}</td>
                        <td className={`p-2 text-right text-green-500`}>{c.actual}</td>
                        <td className={`p-2 text-right font-medium ${Math.abs(c.deviation) > 10 ? 'text-red-500' : Math.abs(c.deviation) > 5 ? 'text-amber-500' : 'text-green-500'}`}>
                          {c.deviation > 0 ? '+' : ''}{c.deviation}%
                        </td>
                        <td className={`p-2 text-right ${label}`}>{c.sampleCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className={`${card()} p-12 text-center`}>
            <span className="icon text-4xl text-gray-400 block mb-2">compare_arrows</span>
            <p className={label}>{tr ? 'Karşılaştırılacak veri bulunamadı. Reçete parametrelerinde varsayılan değer belirlenmelidir.' : 'No comparison data. Recipe parameters need default values set.'}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>
            <span className="icon mr-2 text-blue-500" style={{fontSize: '28px'}}>analytics</span>
            {tr ? 'Dinamik Analiz & Raporlama' : 'Dynamic Analysis & Reporting'}
          </h1>
          <p className={label}>{tr ? 'Üretim, performans ve kalite analizleri' : 'Production, performance and quality analytics'}</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === d
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}>
              {d} {tr ? 'gün' : 'days'}
            </button>
          ))}
        </div>
      </div>

      {/* Module cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={`${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} rounded-xl shadow p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 group ${
              activeSection === section.id ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''
            }`}
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${gradients[idx]} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <span className="icon text-white text-lg">{section.icon}</span>
            </div>
            <h3 className={`text-xs font-semibold leading-tight ${heading}`}>
              {tr ? section.titleTr : section.titleEn}
            </h3>
          </button>
        ))}
      </div>

      {/* Active section content */}
      {activeSection && renderSection()}
    </div>
  );
}
