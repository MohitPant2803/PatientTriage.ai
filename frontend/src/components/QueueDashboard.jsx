import React from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Eye,
  SlidersHorizontal,
  HeartPulse,
  FileSpreadsheet,
  Baby,
  User,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function QueueDashboard({
  patients = [],
  onSelectPatient,
  onOpenOverride,
  onOpenVitalsRecheck,
  onOpenSbar,
  currentFilter,
  setFilter,
  searchQuery,
  setSearchQuery
}) {
  const filterTabs = [
    { id: 'all', label: 'All Cases' },
    { id: 'pediatric', label: 'Pediatric (<12y)', icon: Baby },
    { id: 'geriatric', label: 'Geriatric (65+y)', icon: User },
    { id: 'zero-history', label: 'Zero-History' },
    { id: 'high-uncertainty', label: 'High Uncertainty' },
    { id: 'overridden', label: 'Overridden' },
    { id: 'deterioration', label: 'Deterioration SLAs', alert: true }
  ];

  // Helper for ESI badge colors
  const getESIBadge = (level) => {
    switch (Number(level)) {
      case 1:
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-700/80 ring-1 ring-rose-600/40',
          label: 'ESI 1: Resuscitation',
          text: 'Immediate'
        };
      case 2:
        return {
          bg: 'bg-orange-950/80 text-orange-300 border-orange-700/80',
          label: 'ESI 2: Emergent',
          text: '≤ 10 min'
        };
      case 3:
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
          label: 'ESI 3: Urgent',
          text: '≤ 30 min'
        };
      case 4:
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
          label: 'ESI 4: Less Urgent',
          text: '≤ 60 min'
        };
      case 5:
        return {
          bg: 'bg-sky-950/80 text-sky-300 border-sky-700/80',
          label: 'ESI 5: Non-Urgent',
          text: '≤ 120 min'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: `ESI ${level}`,
          text: 'Standard'
        };
    }
  };

  // Helper for age cohort tag
  const getAgeCohortTag = (age) => {
    const a = Number(age);
    if (a <= 1) return { label: 'Infant', color: 'bg-purple-950/80 text-purple-300 border-purple-800/80' };
    if (a <= 5) return { label: 'Toddler', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80' };
    if (a <= 12) return { label: 'Child', color: 'bg-blue-950/80 text-blue-300 border-blue-800/80' };
    if (a >= 65) return { label: 'Geriatric', color: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
    return { label: 'Adult', color: 'bg-slate-850 text-slate-300 border-slate-750' };
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-lg shadow-sm overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-925">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ID, symptom, or ABHA token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 flex-shrink-0" />
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] ${
                currentFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-750'
              }`}
            >
              {tab.icon && <tab.icon className="h-3 w-3" />}
              <span>{tab.label}</span>
              {tab.alert && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping ml-0.5"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Patient & ID</th>
              <th className="py-2.5 px-3">Age / Cohort</th>
              <th className="py-2.5 px-3">Chief Complaint & Presentation</th>
              <th className="py-2.5 px-3">Calibrated Vitals</th>
              <th className="py-2.5 px-3">Triage Priority (ESI)</th>
              <th className="py-2.5 px-3">Wait & SLA</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                  No patient cases match the active filter.
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const esiInfo = getESIBadge(patient.currentESI);
                const cohortTag = getAgeCohortTag(patient.age);
                const triage = patient.triageResult || {};
                const isOverridden = patient.isOverridden;
                const hasDeterioration = patient.deteriorationAlert;
                const wasEscalated = triage.wasEscalated;

                return (
                  <tr
                    key={patient.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      hasDeterioration ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    {/* 1. Patient & ABDM Status */}
                    <td className="py-2.5 px-3">
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                          <span>{patient.name}</span>
                          {patient.hasPriorHistory ? (
                            <span
                              className="inline-flex items-center text-[9.5px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800/60"
                              title={`ABDM Linked: ${patient.abhaId}`}
                            >
                              <ShieldCheck className="h-3 w-3 mr-0.5" />
                              ABDM
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-[9.5px] font-mono text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-800/60"
                              title="Zero-History: First-time arrival, no prior EHR record on file"
                            >
                              Zero-Hist
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-400">
                          {patient.id} ({patient.gender})
                        </div>
                      </div>
                    </td>

                    {/* 2. Age / Cohort */}
                    <td className="py-2.5 px-3">
                      <div>
                        <span className="font-semibold font-mono text-slate-200">{patient.age}y</span>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded border ${cohortTag.color}`}
                          >
                            {cohortTag.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Chief Complaint & Presentation */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="text-slate-200 line-clamp-2 leading-relaxed text-[11.5px]">
                        {patient.chiefComplaint}
                      </div>
                      {patient.painScore > 0 && (
                        <div className="mt-0.5 text-[10.5px] text-slate-400 flex items-center space-x-1">
                          <span>Pain:</span>
                          <span className={`font-mono font-semibold ${patient.painScore >= 7 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {patient.painScore}/10
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 4. Calibrated Vitals Telemetry */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-[10.5px] space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">HR:</span>
                          <span
                            className={`font-semibold ${
                              patient.vitals?.hr > 110 || patient.vitals?.hr < 55
                                ? 'text-rose-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {patient.vitals?.hr || '--'}
                          </span>
                          <span className="text-slate-400">BP:</span>
                          <span
                            className={`font-semibold ${
                              patient.vitals?.sbp < 90 || patient.vitals?.sbp > 160
                                ? 'text-rose-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {patient.vitals?.sbp}/{patient.vitals?.dbp || '--'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">SpO2:</span>
                          <span
                            className={`font-semibold ${
                              patient.vitals?.spo2 <= 92 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {patient.vitals?.spo2 || '--'}%
                          </span>
                          <span className="text-slate-400">Temp:</span>
                          <span
                            className={`font-semibold ${
                              patient.vitals?.temp >= 38.0 || patient.vitals?.temp <= 35.8
                                ? 'text-rose-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {patient.vitals?.temp || '--'}°C
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Triage Priority (ESI) & Flags */}
                    <td className="py-2.5 px-3">
                      <div>
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${esiInfo.bg}`}
                        >
                          {esiInfo.label}
                        </div>

                        {/* Safety Escalation / Override Flags */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {wasEscalated && (
                            <span
                              className="inline-flex items-center text-[9.5px] font-medium px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-mono"
                              title={triage.escalationReason}
                            >
                              <Zap className="h-2.5 w-2.5 mr-0.5" />
                              Safety Escalated
                            </span>
                          )}

                          {isOverridden && (
                            <span
                              className="inline-flex items-center text-[9.5px] font-medium px-1 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-mono"
                              title={`Overridden by ${patient.overrideDetails?.nurseId}: ${patient.overrideDetails?.reason}`}
                            >
                              <SlidersHorizontal className="h-2.5 w-2.5 mr-0.5" />
                              Overridden
                            </span>
                          )}

                          {triage.uncertaintyPercentage >= 35 && (
                            <span
                              className="inline-flex items-center text-[9.5px] font-mono font-medium px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                              title={`Clinical Uncertainty: ${triage.uncertaintyPercentage}%`}
                            >
                              <HelpCircle className="h-2.5 w-2.5 mr-0.5 text-amber-400" />
                              {triage.uncertaintyPercentage}% Uncert.
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Wait & SLA */}
                    <td className="py-2.5 px-3">
                      <div>
                        <div className="flex items-center space-x-1 font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span
                            className={`font-semibold ${
                              hasDeterioration ? 'text-rose-400' : 'text-slate-200'
                            }`}
                          >
                            {patient.waitTimeMinutes}m wait
                          </span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 font-mono">
                          Target: {esiInfo.text}
                        </div>

                        {hasDeterioration && (
                          <div
                            className="mt-1 inline-flex items-center text-[9.5px] font-semibold text-rose-300 bg-rose-950 px-1 py-0.5 rounded border border-rose-800 animate-pulse"
                            title={patient.deteriorationReason}
                          >
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5 text-rose-400" />
                            SLA Breached
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7. Clinical Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Deep Clinical View */}
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="p-1.5 rounded bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition-all duration-150 active:scale-[0.98]"
                          title="Deep Clinical Rationale & Telemetry"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Clinician Override */}
                        <button
                          onClick={() => onOpenOverride(patient)}
                          className="p-1.5 rounded bg-slate-850 hover:bg-purple-950/70 text-purple-300 hover:text-purple-200 border border-slate-750 hover:border-purple-800 transition-all duration-150 active:scale-[0.98]"
                          title="1-Click Clinician Override"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>

                        {/* Vitals Recheck / Deterioration */}
                        <button
                          onClick={() => onOpenVitalsRecheck(patient)}
                          className="p-1.5 rounded bg-slate-850 hover:bg-emerald-950/70 text-emerald-300 hover:text-emerald-200 border border-slate-750 hover:border-emerald-800 transition-all duration-150 active:scale-[0.98]"
                          title="Re-record Vitals / Re-assess"
                        >
                          <HeartPulse className="h-3.5 w-3.5" />
                        </button>

                        {/* SBAR Handover */}
                        <button
                          onClick={() => onOpenSbar(patient)}
                          className="p-1.5 rounded bg-slate-850 hover:bg-sky-950/70 text-sky-300 hover:text-sky-200 border border-slate-750 hover:border-sky-800 transition-all duration-150 active:scale-[0.98]"
                          title="Generate Doctor SBAR Handover Note"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
