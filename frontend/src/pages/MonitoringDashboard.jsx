import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';

export default function MonitoringDashboard() {
  const { isDark } = useTheme();
  const { locale } = useLocale();
  const tr = locale === 'tr';
  const [liveData, setLiveData] = useState(null);
  const [oeeData, setOeeData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [metricsHistory, setMetricsHistory] = useState([]);
  const historyRef = useRef([]);

  const chartColors = {
    bg: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#111827' : '#1f2937'
  };

  const card = (cls = '') => `${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg ${cls}`;
  const labelCls = isDark ? 'text-gray-400' : 'text-gray-500';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.get('/api/analytics/monitoring/live');
        setLiveData(res.data);
        // Keep last 30 data points for history chart
        const point = {
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          clients: res.data.clients?.online || 0,
          memory: res.data.server?.memoryMb || 0,
          dbLatency: res.data.server?.dbLatencyMs || 0,
          records: res.data.production?.todayRecords || 0
        };
        historyRef.current = [...historyRef.current.slice(-29), point];
        setMetricsHistory([...historyRef.current]);
      } catch {}
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get('/api/analytics/monitoring/oee?days=7')
      .then(res => setOeeData(res.data))
      .catch(() => {});
  }, []);

  // Gauge component
  const Gauge = ({ value, max, label, color, unit = '' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const angle = (pct / 100) * 180;
    return (
      <div className="text-center">
        <div className="relative w-28 h-14 mx-auto overflow-hidden">
          <div className={`absolute w-28 h-28 rounded-full border-8 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} style={{ top: 0 }}></div>
          <div className="absolute w-28 h-28 rounded-full border-8 border-transparent" style={{
            top: 0,
            borderTopColor: color,
            borderRightColor: pct > 50 ? color : 'transparent',
            transform: `rotate(${angle - 90}deg)`,
            transition: 'transform 0.5s ease'
          }}></div>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-lg font-bold ${headingCls}`}>
            {value}{unit}
          </div>
        </div>
        <p className={`text-xs mt-1 ${labelCls}`}>{label}</p>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', icon: 'dashboard', label: tr ? 'Genel Bakış' : 'Overview' },
    { id: 'clients', icon: 'devices', label: tr ? 'İstemciler' : 'Clients' },
    { id: 'performance', icon: 'speed', label: tr ? 'Performans' : 'Performance' },
    { id: 'quality', icon: 'verified', label: tr ? 'Kalite Trendi' : 'Quality Trend' },
    { id: 'reports', icon: 'summarize', label: tr ? 'Raporlar' : 'Reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${headingCls}`}>
            <span className="icon mr-2 text-green-500" style={{fontSize: '28px'}}>monitor_heart</span>
            {tr ? 'Canlı İzleme' : 'Online Monitoring'}
          </h1>
          <p className={labelCls}>{tr ? 'Gerçek zamanlı sistem ve üretim izleme' : 'Real-time system and production monitoring'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className={`text-sm ${labelCls}`}>{tr ? 'Her 10 saniyede güncellenir' : 'Updates every 10s'}</span>
        </div>
      </div>

      {/* Live Status Strip */}
      {liveData && (
        <div className={`${card()} p-4`}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Çevrimiçi' : 'Online'}</p>
              <p className="text-2xl font-bold text-green-500">{liveData.clients?.online || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Ort. RAM' : 'Avg RAM'}</p>
              <p className="text-2xl font-bold text-blue-500">{liveData.clients?.avgRamMb || 0}<span className="text-sm">MB</span></p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Sunucu RAM' : 'Server RAM'}</p>
              <p className="text-2xl font-bold text-purple-500">{liveData.server?.memoryMb || 0}<span className="text-sm">MB</span></p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>DB Latency</p>
              <p className={`text-2xl font-bold ${(liveData.server?.dbLatencyMs || 0) > 100 ? 'text-red-500' : 'text-cyan-500'}`}>
                {liveData.server?.dbLatencyMs || 0}<span className="text-sm">ms</span>
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>Uptime</p>
              <p className={`text-2xl font-bold ${headingCls}`}>{liveData.server?.uptimeHours || 0}<span className="text-sm">h</span></p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Bugün Kayıt' : 'Today Records'}</p>
              <p className="text-2xl font-bold text-amber-500">{liveData.production?.todayRecords || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Aktif Reçete' : 'Active Recipes'}</p>
              <p className="text-2xl font-bold text-indigo-500">{liveData.production?.todayActiveRecipes || 0}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
              <p className={`text-xs ${labelCls}`}>{tr ? 'Toplam İstemci' : 'Total Clients'}</p>
              <p className={`text-2xl font-bold ${headingCls}`}>{liveData.clients?.total || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-green-500 text-white shadow'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300'
            }`}>
            <span className="icon icon-sm">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Real-time metrics chart */}
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
              <span className="icon icon-sm mr-1 text-green-500">timeline</span>
              {tr ? 'Canlı Metrikler' : 'Live Metrics'}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="time" tick={{ fill: chartColors.text, fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: chartColors.text, fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="clients" stroke="#10B981" strokeWidth={2} dot={false} name={tr ? 'İstemci' : 'Clients'} />
                <Line yAxisId="left" type="monotone" dataKey="memory" stroke="#8B5CF6" strokeWidth={2} dot={false} name="RAM (MB)" />
                <Line yAxisId="right" type="monotone" dataKey="dbLatency" stroke="#F59E0B" strokeWidth={2} dot={false} name="DB (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gauges */}
          {liveData && (
            <div className={`${card()} p-5`}>
              <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
                <span className="icon icon-sm mr-1 text-blue-500">speed</span>
                {tr ? 'Kapasite Göstergeleri' : 'Capacity Gauges'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Gauge value={liveData.clients?.online || 0} max={Math.max(liveData.clients?.total || 1, 10)} label={tr ? 'İstemci Kapasitesi' : 'Client Capacity'} color="#10B981" />
                <Gauge value={liveData.server?.memoryMb || 0} max={512} label={tr ? 'Sunucu Bellek' : 'Server Memory'} color="#8B5CF6" unit="MB" />
                <Gauge value={liveData.server?.dbLatencyMs || 0} max={200} label="DB Latency" color={liveData.server?.dbLatencyMs > 100 ? '#EF4444' : '#06B6D4'} unit="ms" />
                <Gauge value={liveData.production?.todayRecords || 0} max={Math.max(liveData.production?.todayRecords || 1, 100)} label={tr ? 'Bugün Üretim' : 'Today Production'} color="#F59E0B" />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="space-y-4">
          {liveData?.clients?.list?.length > 0 ? (
            <div className={`${card()} p-5`}>
              <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
                <span className="icon icon-sm mr-1 text-green-500">devices</span>
                {tr ? 'Bağlı İstemciler' : 'Connected Clients'} ({liveData.clients.list.length})
              </h3>
              <div className="space-y-2">
                {liveData.clients.list.map((client, i) => (
                  <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex flex-col md:flex-row md:items-center md:justify-between gap-2`}>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      <div>
                        <p className={`font-medium ${headingCls}`}>{client.username || 'Anonymous'}</p>
                        <p className={`text-xs ${labelCls}`}>{client.workspace}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} ${labelCls}`}>
                        <span className="icon icon-sm mr-1" style={{fontSize: '14px'}}>memory</span>
                        {client.ram_mb?.toFixed(0) || 0} MB
                      </span>
                      <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} ${labelCls}`}>
                        <span className="icon icon-sm mr-1" style={{fontSize: '14px'}}>update</span>
                        v{client.version}
                      </span>
                      <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} ${labelCls}`}>
                        <span className="icon icon-sm mr-1" style={{fontSize: '14px'}}>computer</span>
                        {client.os}
                      </span>
                      <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} ${labelCls}`}>
                        {client.device_id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`${card()} p-12 text-center`}>
              <span className="icon text-4xl text-gray-400 block mb-2">devices_off</span>
              <p className={labelCls}>{tr ? 'Şu anda bağlı istemci yok' : 'No clients connected'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Performance over time */}
          <div className={`${card()} p-5`}>
            <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
              <span className="icon icon-sm mr-1 text-purple-500">monitoring</span>
              {tr ? 'Sunucu Performansı (Canlı)' : 'Server Performance (Live)'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="time" tick={{ fill: chartColors.text, fontSize: 10 }} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="memory" stroke="#8B5CF6" fillOpacity={1} fill="url(#memGrad)" name="RAM (MB)" />
                <Area type="monotone" dataKey="dbLatency" stroke="#F59E0B" fillOpacity={1} fill="url(#latGrad)" name="DB Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance stats */}
          {metricsHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(() => {
                const memValues = metricsHistory.map(m => m.memory).filter(Boolean);
                const latValues = metricsHistory.map(m => m.dbLatency).filter(Boolean);
                return (
                  <>
                    <div className={`${card()} p-5`}>
                      <p className={`text-xs ${labelCls}`}>{tr ? 'RAM Ortalaması' : 'Avg RAM'}</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {memValues.length > 0 ? Math.round(memValues.reduce((a, b) => a + b, 0) / memValues.length) : 0} MB
                      </p>
                    </div>
                    <div className={`${card()} p-5`}>
                      <p className={`text-xs ${labelCls}`}>{tr ? 'RAM Maks' : 'RAM Max'}</p>
                      <p className="text-2xl font-bold text-red-500">
                        {memValues.length > 0 ? Math.max(...memValues) : 0} MB
                      </p>
                    </div>
                    <div className={`${card()} p-5`}>
                      <p className={`text-xs ${labelCls}`}>{tr ? 'DB Gecikme Ort.' : 'Avg DB Latency'}</p>
                      <p className="text-2xl font-bold text-cyan-500">
                        {latValues.length > 0 ? Math.round(latValues.reduce((a, b) => a + b, 0) / latValues.length) : 0} ms
                      </p>
                    </div>
                    <div className={`${card()} p-5`}>
                      <p className={`text-xs ${labelCls}`}>{tr ? 'DB Gecikme Maks' : 'Max DB Latency'}</p>
                      <p className={`text-2xl font-bold ${(Math.max(...latValues) || 0) > 100 ? 'text-red-500' : 'text-green-500'}`}>
                        {latValues.length > 0 ? Math.max(...latValues) : 0} ms
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-4">
          {oeeData?._demo && (
            <div className={`px-4 py-2 rounded-lg text-xs flex items-center gap-2 ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <span className="icon icon-sm">science</span>
              {tr ? 'Demo veriler gösteriliyor' : 'Showing demo data'}
            </div>
          )}
          {oeeData?.daily?.length > 0 ? (
            <>
              <div className={`${card()} p-5`}>
                <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
                  <span className="icon icon-sm mr-1 text-green-500">trending_up</span>
                  {tr ? 'Kalite Trendi (Son 7 Gün)' : 'Quality Trend (Last 7 Days)'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={oeeData.daily.map(d => ({ ...d, date: d.date?.slice(5) }))}>
                    <defs>
                      <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 11 }} />
                    <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Legend />
                    <Area type="monotone" dataKey="qualityRate" stroke="#10B981" fillOpacity={1} fill="url(#qGrad)" name={tr ? 'Kalite %' : 'Quality %'} />
                    <Line type="monotone" dataKey="scrapRate" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name={tr ? 'Hurda %' : 'Scrap %'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className={`${card()} p-5`}>
                <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
                  {tr ? 'Günlük Üretim Miktarı' : 'Daily Production Volume'}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={oeeData.daily.map(d => ({ ...d, date: d.date?.slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 11 }} />
                    <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="totalRecords" fill="#6366F1" radius={[4, 4, 0, 0]} name={tr ? 'Kayıt' : 'Records'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className={`${card()} p-12 text-center`}>
              <span className="icon text-4xl text-gray-400 block mb-2">trending_up</span>
              <p className={labelCls}>{tr ? 'Kalite trend verisi bulunamadı' : 'No quality trend data found'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className={`${card()} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${headingCls}`}>
              <span className="icon icon-sm mr-1 text-amber-500">summarize</span>
              {tr ? 'Otomatik Raporlama' : 'Automatic Reporting'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="icon text-blue-500">description</span>
                  <div>
                    <p className={`font-medium ${headingCls}`}>{tr ? 'Günlük Üretim Raporu' : 'Daily Production Report'}</p>
                    <p className={`text-xs ${labelCls}`}>{tr ? 'Her gün saat 23:59 da otomatik oluşturulur' : 'Generated automatically at 23:59 daily'}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    const res = await api.get('/api/analytics/production/daily?days=1');
                    const data = res.data;
                    const csv = `Date,Records\n${(data.daily || []).map(d => `${d.date},${d.count}`).join('\n')}`;
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `production_report_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <span className="icon icon-sm">download</span> {tr ? 'İndir (CSV)' : 'Download (CSV)'}
                </button>
              </div>
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="icon text-green-500">assessment</span>
                  <div>
                    <p className={`font-medium ${headingCls}`}>{tr ? 'Kalite Raporu' : 'Quality Report'}</p>
                    <p className={`text-xs ${labelCls}`}>{tr ? 'Kalite parametrelerinin detaylı analizi' : 'Detailed analysis of quality parameters'}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    const res = await api.get('/api/analytics/quality?days=30');
                    const elements = res.data.elements || [];
                    const csv = `Parameter,Recipe,Min,Max,Avg,StdDev,DefectRate\n${elements.map(e => `${e.elementName},${e.recipeName},${e.minValue ?? ''},${e.maxValue ?? ''},${e.avg},${e.stdDev},${e.defectRate}%`).join('\n')}`;
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `quality_report_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <span className="icon icon-sm">download</span> {tr ? 'İndir (CSV)' : 'Download (CSV)'}
                </button>
              </div>
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="icon text-purple-500">groups</span>
                  <div>
                    <p className={`font-medium ${headingCls}`}>{tr ? 'Çalışan Performans Raporu' : 'Employee Performance Report'}</p>
                    <p className={`text-xs ${labelCls}`}>{tr ? 'Kullanıcı bazlı üretim ve aktivite raporu' : 'User-based production and activity report'}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    const res = await api.get('/api/analytics/employees?days=30');
                    const users = res.data.userProduction || [];
                    const csv = `User,Records\n${users.map(u => `${u['creator.username'] || u.created_by},${u.recordCount}`).join('\n')}`;
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `employee_report_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <span className="icon icon-sm">download</span> {tr ? 'İndir (CSV)' : 'Download (CSV)'}
                </button>
              </div>
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="icon text-amber-500">compare_arrows</span>
                  <div>
                    <p className={`font-medium ${headingCls}`}>{tr ? 'Planlanan vs Gerçekleşen' : 'Planned vs Actual Report'}</p>
                    <p className={`text-xs ${labelCls}`}>{tr ? 'Hedef ve gerçekleşen değer karşılaştırması' : 'Target vs actual value comparison'}</p>
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    const res = await api.get('/api/analytics/planned-vs-actual?days=30');
                    const comps = res.data.comparisons || [];
                    const csv = `Recipe,Parameter,Unit,Planned,Actual,Deviation%,Samples\n${comps.map(c => `${c.recipeName},${c.elementName},${c.unit || ''},${c.planned},${c.actual},${c.deviation}%,${c.sampleCount}`).join('\n')}`;
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `planned_vs_actual_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <span className="icon icon-sm">download</span> {tr ? 'İndir (CSV)' : 'Download (CSV)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
