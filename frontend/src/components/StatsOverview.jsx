import React from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  Bed,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function StatsOverview({ stats }) {
  const {
    totalPatients = 0,
    waiting = 0,
    inExam = 0,
    fastTrack = 0,
    criticalCount = 0,
    avgWaitTime = 0,
    alertCount = 0,
    bedOccupancyRate = 78,
    nurseToPatientRatio = '1:3',
    esiBreakdown = {}
  } = stats || {};

  const level1Count = esiBreakdown.level1 || 0;
  const level2Count = esiBreakdown.level2 || 0;

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden mb-5">
      {/* Primary Operational Row */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-y-3 gap-x-8 bg-white">
        
        {/* Metric 1: Active Inflow */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800 shadow-2xs">
            <Users className="h-5 w-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active ED Inflow
            </div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-slate-950 tracking-tight tabular-nums">
                {totalPatients}
              </span>
              <span className="text-xs text-slate-700 font-semibold">
                ({waiting} waiting · {inExam} in exam{fastTrack > 0 ? ` · ${fastTrack} fast-track` : ''})
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-slate-300" />

        {/* Metric 2: Critical Urgency */}
        <div className="flex items-center space-x-3.5">
          <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shadow-2xs ${
            criticalCount > 0
              ? 'bg-rose-100 border-rose-400 text-rose-800'
              : 'bg-white border-slate-300 text-slate-600'
          }`}>
            <AlertTriangle className="h-5 w-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Critical Urgency
            </div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                criticalCount > 0 ? 'text-rose-700' : 'text-slate-950'
              }`}>
                {criticalCount}
              </span>
              <span className="text-xs text-slate-700 font-semibold">
                (ESI 1: <strong className={level1Count > 0 ? 'text-rose-700 font-bold' : 'text-slate-900'}>{level1Count}</strong> · ESI 2: <strong className={level2Count > 0 ? 'text-amber-800 font-bold' : 'text-slate-900'}>{level2Count}</strong>)
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-slate-300" />

        {/* Metric 3: Average Wait Time */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 shadow-2xs">
            <Clock className="h-5 w-5 text-slate-700 stroke-[2.3]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Average Wait Time
            </div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-slate-950 tracking-tight tabular-nums">
                {avgWaitTime}
              </span>
              <span className="text-xs text-slate-700 font-bold">min <span className="font-semibold text-slate-600">(Safe Target &lt; 30m)</span></span>
            </div>
          </div>
        </div>

        {/* Metric 4: SLA Alerts (Dynamic solid calm alert) */}
        {alertCount > 0 && (
          <>
            <div className="hidden lg:block h-8 w-px bg-slate-300" />
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-lg bg-rose-100 border border-rose-400 text-rose-950 shadow-2xs">
              <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 stroke-[2.4]" />
              <div>
                <div className="text-xs font-extrabold text-rose-950 tabular-nums">
                  {alertCount} SLA Breach{alertCount > 1 ? 'es' : ''}
                </div>
                <div className="text-[11px] text-rose-900 font-bold">Immediate re-check required</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Secondary Situational Context Bar */}
      <div className="px-6 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-800 gap-2">
        <div className="flex items-center space-x-4 sm:space-x-6 font-medium">
          <div className="flex items-center space-x-1.5">
            <Bed className="h-4 w-4 text-slate-700" />
            <span className="text-slate-700 font-semibold">Bed Occupancy:</span>
            <strong className="text-slate-950 font-mono font-bold">{bedOccupancyRate}%</strong>
            <span className="text-slate-600 text-xs font-semibold">(28/36 ED Bays)</span>
          </div>

          <span className="text-slate-400 font-bold">•</span>

          <div className="flex items-center space-x-1.5">
            <UserCheck className="h-4 w-4 text-slate-700" />
            <span className="text-slate-700 font-semibold">Nurse Ratio:</span>
            <strong className="text-slate-950 font-mono font-bold">{nurseToPatientRatio}</strong>
            <span className="text-slate-600 text-xs font-semibold">(Safe Staffing)</span>
          </div>

          <span className="text-slate-400 font-bold hidden sm:inline">•</span>

          <div className="hidden sm:flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span className="text-slate-800 font-bold">ABDM Level-2 Gateway</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 font-semibold">
          Station 01 · Triage Lead
        </div>
      </div>
    </div>
  );
}
