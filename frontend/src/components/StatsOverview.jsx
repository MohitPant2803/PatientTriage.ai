import React from 'react';
import {
  Users,
  AlertOctagon,
  Clock,
  Bed,
  ShieldAlert,
  UserCheck,
  TrendingDown,
  ArrowUpRight
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Active ED Inflow */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Active Queue</span>
          <Users className="h-4 w-4 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalPatients}</span>
          <span className="text-xs text-slate-400">patients</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{waiting} waiting</span>
          <span>•</span>
          <span>{inExam} in bay</span>
          <span>•</span>
          <span>{fastTrack} fast-track</span>
        </div>
      </div>

      {/* 2. Critical & Emergent (ESI 1 & 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">ESI Level 1 & 2</span>
          <AlertOctagon className="h-4 w-4 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-rose-400 tracking-tight">{criticalCount}</span>
          <span className="text-xs text-slate-400">critical</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
          <span className="text-rose-400 font-mono font-medium">L1: {esiBreakdown.level1 || 0}</span>
          <span>|</span>
          <span className="text-orange-400 font-mono font-medium">L2: {esiBreakdown.level2 || 0}</span>
        </div>
      </div>

      {/* 3. Average Wait Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Avg Wait Time</span>
          <Clock className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">{avgWaitTime}</span>
          <span className="text-xs text-slate-400">minutes</span>
        </div>
        <div className="text-[11px] text-emerald-400 mt-1 flex items-center">
          <TrendingDown className="h-3.5 w-3.5 mr-1" />
          <span>-4.5m triage speedup</span>
        </div>
      </div>

      {/* 4. Bed Occupancy */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Bed Occupancy</span>
          <Bed className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${bedOccupancyRate > 90 ? 'text-amber-400' : 'text-white'}`}>
            {bedOccupancyRate}%
          </span>
          <span className="text-xs text-slate-400">capacity</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${bedOccupancyRate > 90 ? 'bg-amber-500' : 'bg-sky-500'}`}
            style={{ width: `${Math.min(100, bedOccupancyRate)}%` }}
          ></div>
        </div>
      </div>

      {/* 5. Deterioration Alarms */}
      <div className={`border rounded-lg p-3.5 shadow-sm ${
        alertCount > 0
          ? 'bg-rose-950/40 border-rose-800/60'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Deterioration SLA</span>
          <ShieldAlert className={`h-4 w-4 ${alertCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${alertCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {alertCount}
          </span>
          <span className="text-xs text-slate-400">breaches</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {alertCount > 0 ? 'Requires Re-triage' : 'All SLAs nominal'}
        </div>
      </div>

      {/* 6. Nurse Load & Overrides */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium uppercase tracking-wider">Nurse Load</span>
          <UserCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold text-white tracking-tight">{nurseToPatientRatio}</span>
          <span className="text-[10px] text-slate-400">(WHO: 1:4)</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Overrides: {overriddenCount}</span>
          <span className="text-[10px] text-sky-400">DISHA Logged</span>
        </div>
      </div>
    </div>
  );
}
