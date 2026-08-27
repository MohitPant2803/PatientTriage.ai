import React from 'react';
import {
  Users,
  AlertOctagon,
  Clock,
  Bed,
  ShieldAlert,
  UserCheck,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function StatsOverview({ stats }) {
  if (!stats) return null;

  const {
    totalPatients = 0,
    waiting = 0,
    inExam = 0,
    fastTrack = 0,
    alertCount = 0,
    overriddenCount = 0,
    esiBreakdown = {},
    avgWaitTime = 0,
    bedOccupancyRate = 78,
    nurseToPatientRatio = '1:8',
    isSurgeMode = false
  } = stats;

  const criticalCount = (esiBreakdown.level1 || 0) + (esiBreakdown.level2 || 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {/* 1. Active ED Inflow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-750 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Active Inflow</span>
          <Users className="h-3.5 w-3.5 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-white font-mono tracking-tight">{totalPatients}</span>
          <span className="text-xs text-slate-400">cases</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
          <span>{waiting} wait</span>
          <span>/</span>
          <span>{inExam} exam</span>
          <span>/</span>
          <span>{fastTrack} fast</span>
        </div>
      </div>

      {/* 2. Critical & Emergent (ESI 1 & 2) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-750 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Critical (ESI 1 & 2)</span>
          <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-rose-400 font-mono tracking-tight">{criticalCount}</span>
          <span className="text-xs text-slate-400">priority</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1.5 font-mono">
          <span className="text-rose-400 font-medium">L1: {esiBreakdown.level1 || 0}</span>
          <span>|</span>
          <span className="text-orange-400 font-medium">L2: {esiBreakdown.level2 || 0}</span>
          <span>|</span>
          <span className="text-amber-400">L3: {esiBreakdown.level3 || 0}</span>
        </div>
      </div>

      {/* 3. Average Wait Time */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-750 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Avg Door-to-Doctor</span>
          <Clock className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold text-white font-mono tracking-tight">{avgWaitTime}</span>
          <span className="text-xs text-slate-400">min</span>
        </div>
        <div className="text-[10px] text-emerald-400 mt-1 flex items-center font-mono">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          <span>-4.5m vs manual</span>
        </div>
      </div>

      {/* 4. Bed Occupancy */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-750 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Bed Utilization</span>
          <Bed className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${bedOccupancyRate > 90 ? 'text-amber-400' : 'text-white'}`}>
            {bedOccupancyRate}%
          </span>
          <span className="text-xs text-slate-400">capacity</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bedOccupancyRate > 90 ? 'bg-amber-500' : 'bg-sky-500'}`}
            style={{ width: `${Math.min(100, bedOccupancyRate)}%` }}
          ></div>
        </div>
      </div>

      {/* 5. Deterioration Alarms */}
      <div className={`border rounded-lg p-3 shadow-sm transition-colors ${
        alertCount > 0
          ? 'bg-rose-950/30 border-rose-800/70'
          : 'bg-slate-900/90 border border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Deterioration SLA</span>
          <ShieldAlert className={`h-3.5 w-3.5 ${alertCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${alertCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {alertCount}
          </span>
          <span className="text-xs text-slate-400">breaches</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 font-mono">
          {alertCount > 0 ? 'Action required' : 'All SLAs nominal'}
        </div>
      </div>

      {/* 6. Nurse Load & Overrides */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-750 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Nurse Load</span>
          <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold text-white font-mono tracking-tight">{nurseToPatientRatio}</span>
          <span className="text-[10px] text-slate-400">(WHO: 1:4)</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
          <span>Overrides: {overriddenCount}</span>
          <span className="text-sky-400">DISHA Logged</span>
        </div>
      </div>
    </div>
  );
}
