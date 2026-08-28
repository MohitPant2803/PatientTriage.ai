import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  Radio,
  Clock,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  alertCount
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-300 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Station Navigation Bar */}
        <div className="flex items-center justify-between h-20">
          {/* Clinical Brand & Identity */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Activity className="h-7 w-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-950">
                  PatientTriage<span className="text-sky-600">.ai</span>
                </span>
                <span className="text-slate-400 font-bold text-base">•</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-950">
                  Emergency Department
                </span>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-md bg-white text-slate-950 border border-slate-300 font-black shadow-2xs">
                  Level 1 Trauma
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                Clinical Decision Support System
              </p>
            </div>
          </div>

          {/* Context & Critical Status Actions */}
          <div className="flex items-center space-x-3.5">
            {/* Live Station Clock */}
            <div className="hidden xl:flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm font-mono text-slate-950 font-bold shadow-2xs">
              <Clock className="h-4 w-4 text-slate-800 stroke-[2.3]" />
              <span className="tabular-nums font-extrabold">{currentTime.toLocaleTimeString('en-US', { hour12: false })} IST</span>
            </div>

            {/* ABDM Status */}
            <div className="hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs sm:text-sm text-emerald-950 font-extrabold shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-700 stroke-[2.3]" />
              <span>ABDM Connected</span>
            </div>

            {/* SLA Alert Counter */}
            {alertCount > 0 && (
              <div className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-rose-100 border border-rose-400 text-xs sm:text-sm text-rose-950 font-black shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-700 stroke-[2.4]" />
                <span>{alertCount} SLA Alert{alertCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Clinician Profile */}
            <div className="flex items-center space-x-3 pl-3.5 border-l-2 border-slate-300">
              <div className="h-10 w-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
                PS
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-extrabold text-slate-950 text-sm leading-tight">Nurse P. Sharma, RN</div>
                <div className="text-xs text-slate-700 font-semibold mt-0.5">Lead Triage Clinician</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 pb-2.5">
          <nav className="flex space-x-2.5">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'queue'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Live Emergency Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'audit'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>ABDM / DISHA Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 active:scale-[0.98] ${
                activeTab === 'simulation'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-800 bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Surge & Capacity Simulation</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
