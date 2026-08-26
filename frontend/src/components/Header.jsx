import React from 'react';
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
  Radio
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  isSurgeMode,
  onToggleSurge,
  alertCount,
  onOpenIntakeModal
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Top Banner: Hospital System & Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinical System Name */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
              <Activity className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">PatientTriage.ai</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                  CDS v2.0
                </span>
                <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
                  Accenture Innovation Challenge 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Decision Support for Emergency Department Triage • <span className="text-slate-300">AI Guides. Professional Decides.</span>
              </p>
            </div>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex items-center space-x-3">
            {/* ABDM Connectivity Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">ABDM Gateway: ONLINE</span>
            </div>

            {/* Deterioration Alert Counter */}
            {alertCount > 0 && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-rose-950/80 border border-rose-700/80 text-xs text-rose-300 animate-pulse-subtle">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="font-semibold">{alertCount} Deterioration Alerts</span>
              </div>
            )}

            {/* Interactive Surge Mode Toggle */}
            <button
              onClick={() => onToggleSurge(!isSurgeMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${
                isSurgeMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 ring-2 ring-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
              }`}
              title="Toggle simulated 3x patient inflow surge"
            >
              <Flame className={`h-4 w-4 ${isSurgeMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isSurgeMode ? 'Surge Mode: 3x ACTIVE' : 'Surge Mode: Normal (1x)'}</span>
            </button>

            {/* Clinician Profile */}
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserCheck className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-left text-xs">
                <div className="font-medium text-slate-200">Nurse P. Sharma, RN</div>
                <div className="text-[10px] text-slate-400">Lead Triage Clinician</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 pb-2">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Live Emergency Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>ABDM / DISHA Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'simulation'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Surge & Time Simulation</span>
            </button>
          </nav>

          {/* New Patient Intake Action Button */}
          <button
            onClick={onOpenIntakeModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-md shadow-sky-600/25 transition-all"
          >
            <Activity className="h-4 w-4" />
            <span>+ Rapid Patient Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
}
