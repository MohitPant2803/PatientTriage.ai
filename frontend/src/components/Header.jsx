import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Flame,
  UserCheck,
  Building2,
  Clock,
  Layers,
  FileText,
  Radio,
  Plus
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  isSurgeMode,
  onToggleSurge,
  alertCount,
  onOpenIntakeModal
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Station Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Clinical Brand & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="h-9 w-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Activity className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">PatientTriage.ai</span>
                <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60">
                  CDS v2.0
                </span>
                <span className="text-[11px] text-slate-400 hidden lg:inline font-mono">
                  Level 1 Trauma ED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Emergency Decision Support - <span className="text-slate-300 font-medium">AI Guides. Professional Decides.</span>
              </p>
            </div>
          </div>

          {/* Real-Time Telemetry & Status Badges */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Live Station Clock */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })} IST</span>
            </div>

            {/* ABDM Connectivity Indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">ABDM: ONLINE</span>
            </div>

            {/* Deterioration Alert Counter */}
            {alertCount > 0 && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-700/80 text-xs text-rose-300 animate-pulse-subtle">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-semibold">{alertCount} SLA Alert{alertCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Interactive Surge Mode Toggle */}
            <button
              onClick={() => onToggleSurge(!isSurgeMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                isSurgeMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
              title="Toggle simulated 3x patient inflow surge"
            >
              <Flame className={`h-3.5 w-3.5 ${isSurgeMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isSurgeMode ? 'Surge: 3x ACTIVE' : 'Surge: Normal (1x)'}</span>
            </button>

            {/* Clinician Profile */}
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-sky-400" />
              </div>
              <div className="text-left text-xs">
                <div className="font-medium text-slate-200 text-[11px]">Nurse P. Sharma, RN</div>
                <div className="text-[10px] text-slate-400">Lead Triage Clinician</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Rapid Action Bar */}
        <div className="flex items-center justify-between border-t border-slate-850 pt-2 pb-2">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'queue'
                  ? 'bg-slate-850 text-sky-400 border border-slate-750 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Live Emergency Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'audit'
                  ? 'bg-slate-850 text-sky-400 border border-slate-750 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ABDM / DISHA Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'simulation'
                  ? 'bg-slate-850 text-sky-400 border border-slate-750 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Surge & Time Simulation</span>
            </button>
          </nav>

          {/* Rapid Patient Intake Button */}
          <button
            onClick={onOpenIntakeModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Rapid Patient Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
}
