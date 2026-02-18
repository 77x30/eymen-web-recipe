import { useState, useEffect, useRef } from 'react';

export default function MachineControl() {
  const [machineState, setMachineState] = useState({
    running: false,
    speed: 0,
    temperature: 25,
    pressure: 0,
    coilPosition: 0,
    motorStatus: 'stopped',
    alarms: []
  });
  
  const [setpoints, setSetpoints] = useState({
    speedSetpoint: 50,
    tempSetpoint: 180,
    pressureSetpoint: 5
  });

  const [manualMode, setManualMode] = useState(false);
  const animationRef = useRef(null);

  // Simulate machine operation
  useEffect(() => {
    if (machineState.running) {
      animationRef.current = setInterval(() => {
        setMachineState(prev => {
          const newCoilPosition = (prev.coilPosition + prev.speed * 0.1) % 360;
          const tempDiff = setpoints.tempSetpoint - prev.temperature;
          const newTemp = prev.temperature + tempDiff * 0.02 + (Math.random() - 0.5) * 2;
          const pressureDiff = setpoints.pressureSetpoint - prev.pressure;
          const newPressure = prev.pressure + pressureDiff * 0.05 + (Math.random() - 0.5) * 0.2;
          
          return {
            ...prev,
            coilPosition: newCoilPosition,
            temperature: Math.max(20, Math.min(300, newTemp)),
            pressure: Math.max(0, Math.min(10, newPressure)),
            speed: prev.speed + (setpoints.speedSetpoint - prev.speed) * 0.1
          };
        });
      }, 100);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [machineState.running, setpoints]);

  const handleStart = () => {
    setMachineState(prev => ({ ...prev, running: true, motorStatus: 'running' }));
  };

  const handleStop = () => {
    setMachineState(prev => ({ ...prev, running: false, motorStatus: 'stopped', speed: 0 }));
  };

  const handleEmergencyStop = () => {
    setMachineState(prev => ({ 
      ...prev, 
      running: false, 
      motorStatus: 'emergency_stop', 
      speed: 0,
      alarms: [...prev.alarms, { id: Date.now(), message: 'Emergency Stop Activated', time: new Date().toLocaleTimeString() }]
    }));
  };

  const clearAlarms = () => {
    setMachineState(prev => ({ ...prev, alarms: [], motorStatus: prev.running ? 'running' : 'stopped' }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'emergency_stop': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="icon icon-lg">precision_manufacturing</span>
          Machine Control - Coil Opener
        </h1>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg text-white font-bold ${getStatusColor(machineState.motorStatus)}`}>
            {machineState.motorStatus.toUpperCase().replace('_', ' ')}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={manualMode} 
              onChange={(e) => setManualMode(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="font-medium">Manual Mode</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Machine Visualization - CAD Style */}
        <div className="col-span-8 bg-gray-900 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 left-4 text-green-400 font-mono text-sm">
            LIVE VISUALIZATION
          </div>
          
          {/* SVG Machine Drawing */}
          <svg viewBox="0 0 800 400" className="w-full h-80">
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#grid)"/>
            
            {/* Machine Base */}
            <rect x="50" y="300" width="700" height="40" fill="#334155" stroke="#64748b" strokeWidth="2"/>
            
            {/* Left Support Frame */}
            <rect x="80" y="150" width="30" height="150" fill="#475569" stroke="#64748b" strokeWidth="2"/>
            <rect x="65" y="140" width="60" height="20" fill="#64748b" stroke="#94a3b8" strokeWidth="1"/>
            
            {/* Coil Holder (Left) */}
            <circle cx="200" cy="200" r="80" fill="#1e293b" stroke="#3b82f6" strokeWidth="3"/>
            <circle cx="200" cy="200" r="60" fill="#0f172a" stroke="#60a5fa" strokeWidth="2"/>
            <circle cx="200" cy="200" r="20" fill="#334155" stroke="#94a3b8" strokeWidth="2"/>
            
            {/* Rotating Coil */}
            <g transform={`rotate(${machineState.coilPosition}, 200, 200)`}>
              <ellipse cx="200" cy="200" rx="55" ry="55" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="20 10"/>
              <line x1="200" y1="145" x2="200" y2="165" stroke="#ef4444" strokeWidth="3"/>
            </g>
            
            {/* Material Path */}
            <path 
              d="M 280 200 Q 350 200 400 180 T 520 180" 
              fill="none" 
              stroke="#f59e0b" 
              strokeWidth="4"
              strokeDasharray={machineState.running ? "10 5" : "none"}
            >
              {machineState.running && (
                <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="0.5s" repeatCount="indefinite"/>
              )}
            </path>
            
            {/* Guide Rollers */}
            <circle cx="350" cy="190" r="15" fill="#475569" stroke="#64748b" strokeWidth="2">
              {machineState.running && (
                <animateTransform attributeName="transform" type="rotate" from="0 350 190" to="360 350 190" dur="1s" repeatCount="indefinite"/>
              )}
            </circle>
            <circle cx="450" cy="175" r="15" fill="#475569" stroke="#64748b" strokeWidth="2">
              {machineState.running && (
                <animateTransform attributeName="transform" type="rotate" from="0 450 175" to="-360 450 175" dur="1s" repeatCount="indefinite"/>
              )}
            </circle>
            
            {/* Tension Control Unit */}
            <rect x="500" y="140" width="80" height="100" fill="#334155" stroke="#64748b" strokeWidth="2" rx="5"/>
            <text x="540" y="130" textAnchor="middle" fill="#94a3b8" fontSize="12">TENSION</text>
            <rect x="515" y="160" width="50" height="60" fill="#0f172a" stroke="#3b82f6" strokeWidth="1"/>
            <text x="540" y="195" textAnchor="middle" fill="#22c55e" fontSize="14" fontFamily="monospace">
              {machineState.pressure.toFixed(1)} bar
            </text>
            
            {/* Right Frame */}
            <rect x="620" y="150" width="30" height="150" fill="#475569" stroke="#64748b" strokeWidth="2"/>
            <rect x="605" y="140" width="60" height="20" fill="#64748b" stroke="#94a3b8" strokeWidth="1"/>
            
            {/* Output Roller */}
            <circle cx="680" cy="200" r="40" fill="#1e293b" stroke="#10b981" strokeWidth="3"/>
            <circle cx="680" cy="200" r="25" fill="#0f172a" stroke="#34d399" strokeWidth="2"/>
            <g transform={`rotate(${-machineState.coilPosition * 0.8}, 680, 200)`}>
              <line x1="680" y1="175" x2="680" y2="185" stroke="#ef4444" strokeWidth="2"/>
            </g>
            
            {/* Motor */}
            <rect x="160" y="280" width="80" height="30" fill={machineState.running ? '#22c55e' : '#475569'} stroke="#64748b" strokeWidth="2" rx="3"/>
            <text x="200" y="300" textAnchor="middle" fill="white" fontSize="10">MOTOR</text>
            
            {/* Speed Display */}
            <rect x="300" y="50" width="200" height="60" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" rx="5"/>
            <text x="400" y="75" textAnchor="middle" fill="#94a3b8" fontSize="12">SPEED</text>
            <text x="400" y="100" textAnchor="middle" fill="#22c55e" fontSize="24" fontFamily="monospace">
              {machineState.speed.toFixed(1)} m/min
            </text>
            
            {/* Temperature Display */}
            <rect x="520" y="50" width="150" height="60" fill="#0f172a" stroke="#ef4444" strokeWidth="2" rx="5"/>
            <text x="595" y="75" textAnchor="middle" fill="#94a3b8" fontSize="12">TEMP</text>
            <text x="595" y="100" textAnchor="middle" fill={machineState.temperature > 200 ? '#ef4444' : '#22c55e'} fontSize="24" fontFamily="monospace">
              {machineState.temperature.toFixed(0)}°C
            </text>
            
            {/* Status Indicators */}
            <circle cx="70" cy="70" r="8" fill={machineState.running ? '#22c55e' : '#6b7280'}>
              {machineState.running && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
            </circle>
            <text x="85" y="75" fill="#94a3b8" fontSize="12">RUN</text>
            
            <circle cx="70" cy="95" r="8" fill={machineState.motorStatus === 'emergency_stop' ? '#ef4444' : '#6b7280'}>
              {machineState.motorStatus === 'emergency_stop' && <animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite"/>}
            </circle>
            <text x="85" y="100" fill="#94a3b8" fontSize="12">ALARM</text>
          </svg>
        </div>

        {/* Control Panel */}
        <div className="col-span-4 space-y-4">
          {/* Main Controls */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="icon icon-sm">gamepad</span> Main Controls
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleStart}
                disabled={machineState.running || machineState.motorStatus === 'emergency_stop'}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="icon">play_arrow</span> START
              </button>
              <button
                onClick={handleStop}
                disabled={!machineState.running}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="icon">stop</span> STOP
              </button>
            </div>
            <button
              onClick={handleEmergencyStop}
              className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg border-4 border-red-800"
            >
              <span className="icon icon-lg">emergency</span> EMERGENCY STOP
            </button>
          </div>

          {/* Setpoints */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="icon icon-sm">tune</span> Setpoints
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Speed</span>
                  <span className="font-mono">{setpoints.speedSetpoint} m/min</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={setpoints.speedSetpoint}
                  onChange={(e) => setSetpoints(prev => ({ ...prev, speedSetpoint: Number(e.target.value) }))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-200"
                  disabled={!manualMode}
                />
              </div>
              <div>
                <label className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Temperature</span>
                  <span className="font-mono">{setpoints.tempSetpoint}°C</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={setpoints.tempSetpoint}
                  onChange={(e) => setSetpoints(prev => ({ ...prev, tempSetpoint: Number(e.target.value) }))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-200"
                  disabled={!manualMode}
                />
              </div>
              <div>
                <label className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Pressure</span>
                  <span className="font-mono">{setpoints.pressureSetpoint} bar</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={setpoints.pressureSetpoint}
                  onChange={(e) => setSetpoints(prev => ({ ...prev, pressureSetpoint: Number(e.target.value) }))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-200"
                  disabled={!manualMode}
                />
              </div>
            </div>
          </div>

          {/* Manual Jog Controls */}
          {manualMode && (
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="icon icon-sm">open_with</span> Jog Controls
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div></div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition active:scale-95">
                  <span className="icon">keyboard_arrow_up</span>
                </button>
                <div></div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition active:scale-95">
                  <span className="icon">keyboard_arrow_left</span>
                </button>
                <button className="bg-gray-300 text-gray-700 py-3 rounded-lg font-bold">
                  <span className="icon">radio_button_checked</span>
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition active:scale-95">
                  <span className="icon">keyboard_arrow_right</span>
                </button>
                <div></div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition active:scale-95">
                  <span className="icon">keyboard_arrow_down</span>
                </button>
                <div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Process Values and Alarms */}
      <div className="grid grid-cols-2 gap-6">
        {/* Process Values */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="icon icon-sm">speed</span> Process Values
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">Speed</div>
                <div className="text-3xl font-mono font-bold text-blue-600">{machineState.speed.toFixed(1)}</div>
                <div className="text-gray-400 text-sm">m/min</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">Temperature</div>
                <div className={`text-3xl font-mono font-bold ${machineState.temperature > 200 ? 'text-red-600' : 'text-green-600'}`}>
                  {machineState.temperature.toFixed(0)}
                </div>
                <div className="text-gray-400 text-sm">°C</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">Pressure</div>
                <div className="text-3xl font-mono font-bold text-purple-600">{machineState.pressure.toFixed(2)}</div>
                <div className="text-gray-400 text-sm">bar</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-gray-500 text-sm">Coil Position</div>
                <div className="text-3xl font-mono font-bold text-orange-600">{machineState.coilPosition.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">°</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alarms */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="icon icon-sm">warning</span> Alarms ({machineState.alarms.length})
            </h3>
            {machineState.alarms.length > 0 && (
              <button onClick={clearAlarms} className="text-white text-sm hover:underline">
                Clear All
              </button>
            )}
          </div>
          <div className="p-4 max-h-48 overflow-y-auto">
            {machineState.alarms.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <span className="icon icon-lg">check_circle</span>
                <p className="mt-2">No active alarms</p>
              </div>
            ) : (
              <div className="space-y-2">
                {machineState.alarms.map(alarm => (
                  <div key={alarm.id} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="icon text-red-500">error</span>
                    <div className="flex-1">
                      <div className="font-medium text-red-700">{alarm.message}</div>
                      <div className="text-red-400 text-sm">{alarm.time}</div>
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
