import React from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  HelpCircle,
  Plus,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Baby,
  User,
  HeartPulse,
  FileSpreadsheet,
  ArrowRight
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
  setSearchQuery,
  onOpenIntakeModal,
  onLoadSamplePatients,
  onClearQueue,
  isLoadingSamples
}) {
  // ESI semantic styling (Symbol + Label + Urgent Text + Border Rail)
  const getESIInfo = (level) => {
    switch (Number(level)) {
      case 1:
        return {
          badge: 'bg-rose-100 text-rose-950 border-rose-400 font-extrabold',
          symbol: '!',
          title: 'ESI 1',
          sub: 'Immediate',
          railColor: 'border-l-rose-600'
        };
      case 2:
        return {
          badge: 'bg-amber-100 text-amber-950 border-amber-400 font-bold',
          symbol: '▲',
          title: 'ESI 2',
          sub: 'Emergent',
          railColor: 'border-l-amber-500'
        };
      case 3:
        return {
          badge: 'bg-yellow-100 text-yellow-950 border-yellow-400 font-bold',
          symbol: '◆',
          title: 'ESI 3',
          sub: 'Urgent',
          railColor: 'border-l-yellow-500'
        };
      case 4:
        return {
          badge: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold',
          symbol: '●',
          title: 'ESI 4',
          sub: 'Less Urgent',
          railColor: 'border-l-emerald-600'
        };
      case 5:
        return {
          badge: 'bg-white text-slate-900 border-slate-300 font-semibold',
          symbol: '○',
          title: 'ESI 5',
          sub: 'Non-Urgent',
          railColor: 'border-l-slate-400'
        };
      default:
        return {
          badge: 'bg-white text-slate-900 border-slate-300',
          symbol: '•',
          title: `ESI ${level}`,
          sub: 'Standard',
          railColor: 'border-l-slate-400'
        };
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Cases' },
    { id: 'critical', label: 'Critical & Alerts', alert: true },
    { id: 'pediatric', label: 'Pediatric (<12y)', icon: Baby },
    { id: 'geriatric', label: 'Geriatric (65+y)', icon: User },
    { id: 'zero-history', label: 'Zero-History' },
    { id: 'overridden', label: 'Overridden' }
  ];

  // Ensure strict descending order by severity score
  const sortedPatients = [...patients].sort((a, b) => {
    const scoreA = Number(a.severityScore) || (a.currentESI === 1 ? 96 : a.currentESI === 2 ? 82 : a.currentESI === 3 ? 55 : 20);
    const scoreB = Number(b.severityScore) || (b.currentESI === 1 ? 96 : b.currentESI === 2 ? 82 : b.currentESI === 3 ? 55 : 20);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return (b.waitTimeMinutes || 0) - (a.waitTimeMinutes || 0);
  });

  const criticalCount = sortedPatients.filter(
    (p) => p.currentESI <= 2 || p.deteriorationAlert
  ).length;

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
      {/* Search & Action Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search patient name, ID, symptoms, or complaint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-950 placeholder-slate-500 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 font-sans transition-all shadow-2xs"
          />
        </div>

        {/* Action Buttons: Add Patient & Add 10 More Patients */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onLoadSamplePatients}
            disabled={isLoadingSamples}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 shadow-2xs"
            title="Simulate 10 more random patient arrivals"
          >
            <span>{isLoadingSamples ? 'Adding...' : '+ Add 10 Patients'}</span>
          </button>

          <button
            onClick={onOpenIntakeModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.8]" />
            <span>+ Add Patient</span>
          </button>

          {patients.length > 0 && (
            <button
              onClick={onClearQueue}
              className="p-2 rounded-lg text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-300 hover:border-rose-300 transition-colors shadow-2xs"
              title="Clear active queue"
            >
              <RotateCcw className="h-4 w-4 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      {/* Cohort Filter Tabs */}
      {patients.length > 0 && (
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center space-x-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-slate-700 mr-1 flex-shrink-0 stroke-[2.2]" />
          {filterTabs.map((tab) => {
            const isTabActive =
              currentFilter === tab.id ||
              (tab.id === 'critical' && currentFilter === 'deterioration');

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] ${
                  isTabActive
                    ? tab.id === 'critical'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                <span>
                  {tab.id === 'all'
                    ? `All Cases (${patients.length})`
                    : tab.id === 'critical'
                    ? `Critical & Alerts (${criticalCount})`
                    : tab.label}
                </span>
                {tab.alert && criticalCount > 0 && !isTabActive && (
                  <span className="h-2 w-2 rounded-full bg-rose-600 ml-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Patient Queue Content */}
      {sortedPatients.length === 0 ? (
        <div className="py-16 px-4 text-center max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto mb-3 text-emerald-700 shadow-xs">
            <CheckCircle2 className="h-6 w-6 stroke-[2.4]" />
          </div>
          <h3 className="text-base font-bold text-slate-950">Triage Queue is Clear</h3>
          <p className="text-xs text-slate-700 mt-1 mb-5 leading-relaxed font-medium">
            No patients currently waiting in emergency intake. You can manually intake a patient or click <strong>+ Add 10 Patients</strong> to simulate batch arrivals.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onOpenIntakeModal}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.8]" />
              <span>+ Add Patient (Manual Intake)</span>
            </button>

            <button
              onClick={onLoadSamplePatients}
              disabled={isLoadingSamples}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 shadow-2xs"
            >
              <span>{isLoadingSamples ? 'Adding...' : '+ Add 10 Patients'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-white text-xs font-bold text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-10 text-center">#</th>
                <th className="py-3 px-3.5 min-w-[200px]">Patient</th>
                <th className="py-3 px-3.5 min-w-[230px]">Clinical Concern</th>
                <th className="py-3 px-3.5 min-w-[210px]">Calibrated Vitals</th>
                <th className="py-3 px-3.5 min-w-[150px]">Triage Priority</th>
                <th className="py-3 px-3.5 min-w-[100px]">Wait Time</th>
                <th className="py-3 px-3.5 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {sortedPatients.map((patient, index) => {
                const esi = getESIInfo(patient.currentESI);
                const triage = patient.triageResult || {};
                const isOverridden = patient.isOverridden;
                const hasDeterioration = patient.deteriorationAlert;
                const wasEscalated = triage.wasEscalated;
                const queueNum = index + 1;
                const score = Number(patient.severityScore) || (patient.currentESI === 1 ? 96 : patient.currentESI === 2 ? 82 : patient.currentESI === 3 ? 55 : 20);

                // Check abnormal vitals for selective highlighting
                const hr = patient.vitals?.hr;
                const isHrAbnormal = hr && (hr > 110 || hr < 55);

                const sbp = patient.vitals?.sbp;
                const isSbpAbnormal = sbp && (sbp < 90 || sbp > 160);

                const spo2 = patient.vitals?.spo2;
                const isSpo2Abnormal = spo2 && spo2 <= 92;

                const temp = patient.vitals?.temp;
                const isTempAbnormal = temp && (temp >= 38.0 || temp <= 35.8);

                return (
                  <tr
                    key={patient.id}
                    className={`border-l-4 ${esi.railColor} hover:bg-slate-50 transition-colors bg-white`}
                  >
                    {/* 1. Neutral Ordinal Rank */}
                    <td className="py-4 px-3.5 text-center">
                      <span className="font-mono text-xs font-extrabold text-slate-800 tabular-nums">
                        #{queueNum}
                      </span>
                    </td>

                    {/* 2. Patient Identity (One Coherent Piece) */}
                    <td className="py-4 px-3.5">
                      <div>
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="font-extrabold text-slate-950 text-sm hover:text-sky-700 text-left transition-colors"
                        >
                          {patient.name}
                        </button>
                        <div className="text-xs text-slate-700 font-semibold mt-0.5 flex items-center space-x-1.5">
                          <span>{patient.age}y · {patient.gender}</span>
                          <span className="text-slate-400 font-bold">•</span>
                          <span className="font-mono text-slate-800 font-bold text-xs">{patient.id}</span>
                          {patient.hasPriorHistory ? (
                            <span
                              className="inline-flex items-center text-[10px] font-mono text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold"
                              title={`ABDM Linked: ${patient.abhaId}`}
                            >
                              <ShieldCheck className="h-3 w-3 mr-0.5 text-emerald-700" />
                              ABDM
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-mono text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-bold"
                              title="Zero-History: First-time arrival, no prior EHR record on file"
                            >
                              Zero-Hist
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Clinical Concern */}
                    <td className="py-4 px-3.5 max-w-xs">
                      <div>
                        <div className="text-slate-950 text-xs font-bold leading-snug line-clamp-2">
                          {patient.chiefComplaint}
                        </div>
                        {patient.painScore > 0 && (
                          <div className="text-xs text-slate-700 font-semibold mt-0.5">
                            Pain: <strong className={`font-mono ${patient.painScore >= 7 ? 'text-rose-700 font-black' : 'text-slate-900 font-bold'}`}>{patient.painScore}/10</strong>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Physiological Vitals (Clean Scannable Inlined Group) */}
                    <td className="py-4 px-3.5 font-mono text-xs tabular-nums">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span>
                            <span className="text-slate-600 font-sans text-xs font-bold">SpO₂ </span>
                            <span className={isSpo2Abnormal ? 'text-rose-700 font-black' : 'text-slate-950 font-bold'}>
                              {spo2 || '--'}%
                            </span>
                          </span>
                          <span className="text-slate-300 font-bold">•</span>
                          <span>
                            <span className="text-slate-600 font-sans text-xs font-bold">HR </span>
                            <span className={isHrAbnormal ? 'text-rose-700 font-black' : 'text-slate-950 font-bold'}>
                              {hr || '--'}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2.5 text-xs">
                          <span>
                            <span className="text-slate-600 font-sans text-xs font-bold">BP </span>
                            <span className={isSbpAbnormal ? 'text-rose-700 font-black' : 'text-slate-950 font-bold'}>
                              {sbp || '--'}/{patient.vitals?.dbp || '--'}
                            </span>
                          </span>
                          <span className="text-slate-300 font-bold">•</span>
                          <span>
                            <span className="text-slate-600 font-sans text-xs font-bold">Temp </span>
                            <span className={isTempAbnormal ? 'text-rose-700 font-black' : 'text-slate-950 font-bold'}>
                              {temp || '--'}°C
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Triage Priority & De-emphasized Score */}
                    <td className="py-4 px-3.5">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${esi.badge}`}>
                            <span className="mr-1">{esi.symbol}</span>
                            <span>{esi.title} · {esi.sub}</span>
                          </span>
                        </div>

                        {/* Quiet Risk Score & Flags underneath */}
                        <div className="text-xs text-slate-700 font-mono mt-1 flex items-center space-x-1.5 font-medium">
                          <span>Risk score: <strong className="text-slate-950 font-bold tabular-nums">{score}</strong></span>
                          {wasEscalated && (
                            <span className="text-amber-950 text-[10px] bg-amber-100 px-1 rounded border border-amber-300 font-bold">
                              Escalated
                            </span>
                          )}
                          {isOverridden && (
                            <span className="text-purple-950 text-[10px] bg-purple-100 px-1 rounded border border-purple-300 font-bold">
                              Overridden
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Wait Time & Estimated ETA */}
                    <td className="py-4 px-3.5">
                      <div className="text-xs">
                        <div className="flex items-center space-x-1 text-slate-900 font-bold">
                          <Clock className="h-3.5 w-3.5 text-slate-600 stroke-[2.2]" />
                          <span className={`font-mono tabular-nums ${hasDeterioration ? 'text-rose-700 font-black' : 'text-slate-950 font-bold'}`}>
                            {patient.waitTimeMinutes}m wait
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-mono mt-0.5 font-semibold">
                          ETA {patient.estimatedConsultationLabel || (patient.currentESI === 1 ? 'Immediate' : `~${index * 10}m`)}
                        </div>
                        {hasDeterioration && (
                          <div className="text-[11px] font-black text-rose-700 mt-0.5 flex items-center space-x-0.5">
                            <AlertTriangle className="h-3 w-3 text-rose-700" />
                            <span>SLA Breach</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7. Actions: Primary Review Button + Quick Secondary Tools */}
                    <td className="py-4 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all duration-150 active:scale-[0.98] inline-flex items-center justify-center space-x-1 whitespace-nowrap"
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                        </button>

                        <button
                          onClick={() => onOpenOverride(patient)}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-purple-900 hover:bg-purple-100 border border-slate-300 hover:border-purple-300 transition-colors shadow-2xs"
                          title="Override Priority"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.2]" />
                        </button>

                        <button
                          onClick={() => onOpenVitalsRecheck(patient)}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100 border border-slate-300 hover:border-emerald-300 transition-colors shadow-2xs"
                          title="Re-check Vitals"
                        >
                          <HeartPulse className="h-3.5 w-3.5 stroke-[2.2]" />
                        </button>

                        <button
                          onClick={() => onOpenSbar(patient)}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-sky-900 hover:bg-sky-100 border border-slate-300 hover:border-sky-300 transition-colors shadow-2xs"
                          title="SBAR Handover Note"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
