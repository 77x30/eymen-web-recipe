import { useState, useEffect, useRef } from 'react';

export default function MachineControl() {
  const [machineState, setMachineState] = useState({
    running: false,
    speed: 0,
    temperature: 25,
    pressure: 0,
    coilPosition: 0,
    motorStatus: 'stopped',
    alarms: [],
    coilDiameter: 100,
    tensionForce: 0,
    lineSpeed: 0
  });
  
  const [setpoints, setSetpoints] = useState({
    speedSetpoint: 50,
    tempSetpoint: 180,
    pressureSetpoint: 5,
    tensionSetpoint: 3
  });

  const [manualMode, setManualMode] = useState(false);
  const [jogActive, setJogActive] = useState({ forward: false, reverse: false });
  const animationRef = useRef(null);

  useEffect(() => {
    if (machineState.running || jogActive.forward || jogActive.reverse) {
      animationRef.current = setInterval(() => {
        setMachineState(prev => {
          const jogSpeed = jogActive.forward ? 10 : (jogActive.reverse ? -10 : 0);
          const targetSpeed = prev.running ? setpoints.speedSetpoint : jogSpeed;
          const newSpeed = prev.speed + (targetSpeed - prev.speed) * 0.1;
          const newCoilPosition = (prev.coilPosition + Math.abs(newSpeed) * 0.15) % 360;
          const tempDiff = setpoints.tempSetpoint - prev.temperature;
          const newTemp = prev.temperature + tempDiff * 0.02 + (Math.random() - 0.5) * 2;
          const pressureDiff = setpoints.pressureSetpoint - prev.pressure;
          const newPressure = prev.pressure + pressureDiff * 0.05 + (Math.random() - 0.5) * 0.2;
          const tensionDiff = setpoints.tensionSetpoint - prev.tensionForce;
          const newTension = prev.tensionForce + tensionDiff * 0.08 + (Math.random() - 0.5) * 0.1;
          
          return {
            ...prev,
            coilPosition: newCoilPosition,
            temperature: Math.max(20, Math.min(300, newTemp)),
            pressure: Math.max(0, Math.min(10, newPressure)),
            speed: newSpeed,
            lineSpeed: Math.abs(newSpeed) * 0.9,
            tensionForce: Math.max(0, Math.min(10, newTension)),
            coilDiameter: Math.max(20, prev.coilDiameter - (prev.running ? 0.01 : 0))
          };
        });
      }, 50);
    } else {
      if (animationRef.current) clearInterval(animationRef.current);
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [machineState.running, setpoints, jogActive]);

  const handleStart = () => {
    setMachineState(prev => ({ ...prev, running: true, motorStatus: 'running' }));
  };

  const handleStop = () => {
    setMachineState(prev => ({ ...prev, running: false, motorStatus: 'stopped', speed: 0 }));
  };

  const handleEmergencyStop = () => {
    setMachineState(prev => ({ 
      ...prev, running: false, motorStatus: 'emergency_stop', speed: 0,
      alarms: [...prev.alarms, { id: Date.now(), message: 'ACİL DURDURMA AKTİF', time: new Date().toLocaleTimeString() }]
    }));
  };

  const clearAlarms = () => {
    setMachineState(prev => ({ ...prev, alarms: [], motorStatus: prev.running ? 'running' : 'stopped' }));
  };

  const resetCoil = () => {
    setMachineState(prev => ({ ...prev, coilDiameter: 100 }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'emergency_stop': return 'bg-red-500 animate-pulse';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="icon icon-lg">precision_manufacturing</span>
          Coil Opener - Manuel Kontrol HMI
        </h1>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg text-white font-bold ${getStatusColor(machineState.motorStatus)}`}>
            <span className="icon icon-sm mr-1">{machineState.running ? 'play_circle' : 'stop_circle'}</span>
            {machineState.motorStatus === 'emergency_stop' ? 'ACİL STOP' : machineState.motorStatus.toUpperCase()}
          </div>
          <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow cursor-pointer">
            <input type="checkbox" checked={manualMode} onChange={(e) => setManualMode(e.target.checked)} className="w-5 h-5 rounded accent-blue-600"/>
            <span className="font-medium">Manuel Mod</span>
          </label>
        </div>
      </div>

      {/* Main Control Area */}
      <div className="grid grid-cols-12 gap-4">
        {/* 3D CAD Machine Visualization */}
        <div className="col-span-9 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 relative overflow-hidden shadow-2xl">
          {/* Status Bar */}
          <div className="absolute top-3 left-3 flex items-center gap-3 z-10">
            <div className={`w-3 h-3 rounded-full ${machineState.running ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-green-400 font-mono text-xs tracking-wider">CANLI GÖRÜNTÜ</span>
          </div>
          
          {/* SVG 3D-Style Machine */}
          <svg viewBox="0 0 900 450" className="w-full h-96">
            <defs>
              {/* Gradients for 3D effect */}
              <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:'#64748b'}}/>
                <stop offset="50%" style={{stopColor:'#475569'}}/>
                <stop offset="100%" style={{stopColor:'#334155'}}/>
              </linearGradient>
              <linearGradient id="metalDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:'#475569'}}/>
                <stop offset="100%" style={{stopColor:'#1e293b'}}/>
              </linearGradient>
              <linearGradient id="coilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#f59e0b'}}/>
                <stop offset="50%" style={{stopColor:'#d97706'}}/>
                <stop offset="100%" style={{stopColor:'#b45309'}}/>
              </linearGradient>
              <linearGradient id="rollerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:'#94a3b8'}}/>
                <stop offset="50%" style={{stopColor:'#64748b'}}/>
                <stop offset="100%" style={{stopColor:'#475569'}}/>
              </linearGradient>
              <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor:'#1e40af'}}/>
                <stop offset="100%" style={{stopColor:'#3b82f6'}}/>
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="3" stdDeviation="5" floodOpacity="0.4"/>
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
              </pattern>
            </defs>
            
            {/* Background Grid */}
            <rect width="900" height="450" fill="url(#gridPattern)"/>
            
            {/* Floor/Base with 3D perspective */}
            <path d="M 0 400 L 100 350 L 800 350 L 900 400 L 900 450 L 0 450 Z" fill="#1e293b" stroke="#334155" strokeWidth="2"/>
            
            {/* Left Frame Structure - 3D */}
            <g filter="url(#shadow)">
              <path d="M 60 350 L 80 180 L 130 180 L 150 350 Z" fill="url(#metalGradient)" stroke="#64748b" strokeWidth="2"/>
              <rect x="70" y="170" width="70" height="20" fill="url(#frameGradient)" stroke="#60a5fa" strokeWidth="1" rx="3"/>
              <text x="105" y="184" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">UNCOILER</text>
            </g>
            
            {/* Main Coil Assembly - 3D appearance */}
            <g filter="url(#shadow)">
              {/* Coil holder back plate */}
              <ellipse cx="180" cy="250" rx="15" ry="70" fill="#1e293b" stroke="#334155" strokeWidth="2"/>
              
              {/* Main Coil with rotation */}
              <g transform={`rotate(${machineState.coilPosition}, 180, 250)`}>
                {/* Outer coil ring */}
                <ellipse cx="180" cy="250" rx={machineState.coilDiameter * 0.7} ry={machineState.coilDiameter * 0.7} fill="none" stroke="url(#coilGradient)" strokeWidth={machineState.coilDiameter * 0.4} opacity="0.9"/>
                {/* Coil texture lines */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                  <line key={angle} x1={180 + Math.cos(angle * Math.PI / 180) * 30} y1={250 + Math.sin(angle * Math.PI / 180) * 30}
                    x2={180 + Math.cos(angle * Math.PI / 180) * (machineState.coilDiameter * 0.7)} y2={250 + Math.sin(angle * Math.PI / 180) * (machineState.coilDiameter * 0.7)}
                    stroke="#92400e" strokeWidth="1" opacity="0.5"/>
                ))}
                {/* Center hub */}
                <circle cx="180" cy="250" r="25" fill="url(#metalDark)" stroke="#64748b" strokeWidth="3"/>
                <circle cx="180" cy="250" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2"/>
                {/* Position indicator */}
                <line x1="180" y1="225" x2="180" y2="205" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
              </g>
              
              {/* Coil diameter display */}
              <rect x="130" y="330" width="100" height="30" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" rx="3"/>
              <text x="180" y="350" textAnchor="middle" fill="#22c55e" fontSize="14" fontFamily="monospace">Ø {machineState.coilDiameter.toFixed(0)}%</text>
            </g>
            
            {/* Material Strip Path with animation */}
            <g>
              <path d={`M 250 250 Q 320 250 380 230 T 500 220 T 620 230 T 720 240`}
                fill="none" stroke="url(#coilGradient)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={machineState.running ? "15 8" : "none"}>
                {machineState.running && <animate attributeName="stroke-dashoffset" from="0" to="-46" dur="0.3s" repeatCount="indefinite"/>}
              </path>
              {/* Strip edge highlight */}
              <path d={`M 250 248 Q 320 248 380 228 T 500 218 T 620 228 T 720 238`}
                fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5"/>
            </g>
            
            {/* Guide Rollers with 3D effect */}
            {[[350, 235], [450, 220], [550, 225], [650, 235]].map(([cx, cy], i) => (
              <g key={i} filter="url(#shadow)">
                <ellipse cx={cx} cy={cy} rx="8" ry="20" fill="url(#rollerGradient)" stroke="#94a3b8" strokeWidth="1"/>
                <ellipse cx={cx} cy={cy} rx="15" ry="15" fill="url(#metalDark)" stroke="#64748b" strokeWidth="2">
                  {machineState.running && (
                    <animateTransform attributeName="transform" type="rotate" 
                      from={`0 ${cx} ${cy}`} to={`${i % 2 === 0 ? 360 : -360} ${cx} ${cy}`} dur="0.8s" repeatCount="indefinite"/>
                  )}
                </ellipse>
                <circle cx={cx} cy={cy} r="5" fill="#1e293b"/>
              </g>
            ))}
            
            {/* Tension Unit - 3D Box */}
            <g filter="url(#shadow)">
              <path d="M 460 140 L 480 130 L 560 130 L 540 140 L 540 200 L 560 210 L 480 210 L 460 200 Z" fill="url(#metalGradient)" stroke="#64748b" strokeWidth="1"/>
              <rect x="470" y="145" width="60" height="50" fill="#0f172a" stroke="#3b82f6" strokeWidth="1"/>
              <text x="500" y="125" textAnchor="middle" fill="#94a3b8" fontSize="11">TENSION</text>
              <text x="500" y="175" textAnchor="middle" fill="#22c55e" fontSize="16" fontFamily="monospace">{machineState.tensionForce.toFixed(1)}</text>
              <text x="500" y="190" textAnchor="middle" fill="#64748b" fontSize="10">kN</text>
            </g>
            
            {/* Right Frame - Rewinder */}
            <g filter="url(#shadow)">
              <path d="M 750 350 L 770 180 L 820 180 L 840 350 Z" fill="url(#metalGradient)" stroke="#64748b" strokeWidth="2"/>
              <rect x="760" y="170" width="70" height="20" fill="url(#frameGradient)" stroke="#60a5fa" strokeWidth="1" rx="3"/>
              <text x="795" y="184" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RECOILER</text>
              
              {/* Output roller */}
              <g transform={`rotate(${-machineState.coilPosition * 0.6}, 795, 270)`}>
                <circle cx="795" cy="270" r="45" fill="#1e293b" stroke="#64748b" strokeWidth="3"/>
                <circle cx="795" cy="270" r="30" fill="url(#coilGradient)" stroke="#d97706" strokeWidth="2"/>
                <circle cx="795" cy="270" r="12" fill="url(#metalDark)" stroke="#475569" strokeWidth="2"/>
                <line x1="795" y1="258" x2="795" y2="240" stroke="#ef4444" strokeWidth="2"/>
              </g>
            </g>
            
            {/* Motor Unit - 3D */}
            <g filter="url(#shadow)">
              <rect x="140" y="320" width="80" height="35" fill={machineState.running ? '#16a34a' : '#475569'} stroke="#64748b" strokeWidth="2" rx="5"/>
              <rect x="145" y="325" width="70" height="25" fill={machineState.running ? '#22c55e' : '#64748b'} rx="3"/>
              <text x="180" y="342" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                {machineState.running ? '● MOTOR' : '○ MOTOR'}
              </text>
              {machineState.running && (
                <circle cx="155" cy="337" r="4" fill="#4ade80">
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite"/>
                </circle>
              )}
            </g>
            
            {/* Speed Display Panel */}
            <g>
              <rect x="300" y="40" width="180" height="70" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" rx="8" filter="url(#shadow)"/>
              <text x="390" y="65" textAnchor="middle" fill="#64748b" fontSize="12">LINE SPEED</text>
              <text x="390" y="95" textAnchor="middle" fill="#22c55e" fontSize="28" fontFamily="monospace" filter="url(#glow)">
                {machineState.lineSpeed.toFixed(1)} <tspan fontSize="14" fill="#64748b">m/min</tspan>
              </text>
            </g>
            
            {/* Temperature Display */}
            <g>
              <rect x="500" y="40" width="140" height="70" fill="#0f172a" stroke={machineState.temperature > 200 ? '#ef4444' : '#3b82f6'} strokeWidth="2" rx="8" filter="url(#shadow)"/>
              <text x="570" y="65" textAnchor="middle" fill="#64748b" fontSize="12">TEMPERATURE</text>
              <text x="570" y="95" textAnchor="middle" fill={machineState.temperature > 200 ? '#ef4444' : '#22c55e'} fontSize="28" fontFamily="monospace">
                {machineState.temperature.toFixed(0)}<tspan fontSize="14" fill="#64748b">°C</tspan>
              </text>
            </g>
            
            {/* Pressure Display */}
            <g>
              <rect x="660" y="40" width="140" height="70" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" rx="8" filter="url(#shadow)"/>
              <text x="730" y="65" textAnchor="middle" fill="#64748b" fontSize="12">PRESSURE</text>
              <text x="730" y="95" textAnchor="middle" fill="#a78bfa" fontSize="28" fontFamily="monospace">
                {machineState.pressure.toFixed(1)}<tspan fontSize="14" fill="#64748b">bar</tspan>
              </text>
            </g>
            
            {/* Status LEDs */}
            <g>
              <circle cx="50" cy="50" r="8" fill={machineState.running ? '#22c55e' : '#374151'}>
                {machineState.running && <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite"/>}
              </circle>
              <text x="65" y="55" fill="#94a3b8" fontSize="11">RUN</text>
              
              <circle cx="50" cy="75" r="8" fill={machineState.motorStatus === 'emergency_stop' ? '#ef4444' : '#374151'}>
                {machineState.motorStatus === 'emergency_stop' && <animate attributeName="opacity" values="1;0;1" dur="0.3s" repeatCount="indefinite"/>}
              </circle>
              <text x="65" y="80" fill="#94a3b8" fontSize="11">ALARM</text>
              
              <circle cx="50" cy="100" r="8" fill={manualMode ? '#f59e0b' : '#374151'}/>
              <text x="65" y="105" fill="#94a3b8" fontSize="11">MANUAL</text>
            </g>
          </svg>
        </div>

        {/* Control Panel */}
        <div className="col-span-3 space-y-3">
          {/* Main Controls */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
              <span className="icon icon-sm">gamepad</span> ANA KONTROL
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleStart} disabled={machineState.running || machineState.motorStatus === 'emergency_stop'}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95">
                <span className="icon icon-lg">play_arrow</span>
                <span className="text-xs">BAŞLAT</span>
              </button>
              <button onClick={handleStop} disabled={!machineState.running}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95">
                <span className="icon icon-lg">stop</span>
                <span className="text-xs">DURDUR</span>
              </button>
            </div>
            <button onClick={handleEmergencyStop}
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg border-4 border-red-800 active:scale-95">
              <span className="icon icon-lg">emergency</span>
              <span>ACİL STOP</span>
            </button>
            <button onClick={resetCoil}
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2">
              <span className="icon icon-sm">refresh</span> Rulo Sıfırla
            </button>
          </div>

          {/* Setpoints */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
              <span className="icon icon-sm">tune</span> AYAR DEĞERLERİ
            </h3>
            <div className="space-y-3">
              {[
                { key: 'speedSetpoint', label: 'Hız', unit: 'm/min', min: 0, max: 100 },
                { key: 'tempSetpoint', label: 'Sıcaklık', unit: '°C', min: 20, max: 300 },
                { key: 'pressureSetpoint', label: 'Basınç', unit: 'bar', min: 0, max: 10 },
                { key: 'tensionSetpoint', label: 'Gergi', unit: 'kN', min: 0, max: 10 }
              ].map(({ key, label, unit, min, max }) => (
                <div key={key}>
                  <label className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span>
                    <span className="font-mono font-bold text-blue-600">{setpoints[key]} {unit}</span>
                  </label>
                  <input type="range" min={min} max={max} step={key === 'pressureSetpoint' || key === 'tensionSetpoint' ? 0.5 : 1}
                    value={setpoints[key]} onChange={(e) => setSetpoints(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-blue-600" disabled={!manualMode}/>
                </div>
              ))}
            </div>
          </div>

          {/* Jog Controls */}
          {manualMode && (
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                <span className="icon icon-sm">open_with</span> JOG KONTROL
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onMouseDown={() => setJogActive({ forward: false, reverse: true })}
                  onMouseUp={() => setJogActive({ forward: false, reverse: false })}
                  onMouseLeave={() => setJogActive({ forward: false, reverse: false })}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold transition active:scale-95 flex flex-col items-center gap-1">
                  <span className="icon">fast_rewind</span>
                  <span className="text-xs">GERİ</span>
                </button>
                <button
                  onMouseDown={() => setJogActive({ forward: true, reverse: false })}
                  onMouseUp={() => setJogActive({ forward: false, reverse: false })}
                  onMouseLeave={() => setJogActive({ forward: false, reverse: false })}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-bold transition active:scale-95 flex flex-col items-center gap-1">
                  <span className="icon">fast_forward</span>
                  <span className="text-xs">İLERİ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Process Values & Alarms */}
      <div className="grid grid-cols-3 gap-4">
        {/* Process Values */}
        <div className="col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
            <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
              <span className="icon icon-sm">speed</span> PROSES DEĞERLERİ
            </h3>
          </div>
          <div className="p-4 grid grid-cols-5 gap-3">
            {[
              { label: 'Hız', value: machineState.speed.toFixed(1), unit: 'm/min', color: 'blue' },
              { label: 'Hat Hızı', value: machineState.lineSpeed.toFixed(1), unit: 'm/min', color: 'green' },
              { label: 'Sıcaklık', value: machineState.temperature.toFixed(0), unit: '°C', color: machineState.temperature > 200 ? 'red' : 'green' },
              { label: 'Basınç', value: machineState.pressure.toFixed(2), unit: 'bar', color: 'purple' },
              { label: 'Gergi', value: machineState.tensionForce.toFixed(1), unit: 'kN', color: 'orange' }
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">{label}</div>
                <div className={`text-2xl font-mono font-bold text-${color}-600`}>{value}</div>
                <div className="text-gray-400 text-xs">{unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alarms */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
              <span className="icon icon-sm">warning</span> ALARMLAR ({machineState.alarms.length})
            </h3>
            {machineState.alarms.length > 0 && (
              <button onClick={clearAlarms} className="text-white text-xs hover:underline">Temizle</button>
            )}
          </div>
          <div className="p-3 max-h-32 overflow-y-auto">
            {machineState.alarms.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                <span className="icon text-green-500">check_circle</span>
                <p className="text-xs mt-1">Aktif alarm yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {machineState.alarms.map(alarm => (
                  <div key={alarm.id} className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2 text-sm">
                    <span className="icon icon-sm text-red-500">error</span>
                    <div className="flex-1">
                      <div className="font-medium text-red-700 text-xs">{alarm.message}</div>
                      <div className="text-red-400 text-[10px]">{alarm.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
