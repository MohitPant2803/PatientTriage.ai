import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  Activity,
  Heart,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export default function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onOpenOverride,
  onOpenVitalsRecheck,
  onOpenSbar
}) {
  if (!isOpen || !patient) return null;

  const triage = patient.triageResult || {};
  const vitalCalib = triage.vitalCalib || {};
  const isOverridden = patient.isOverridden;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              ESI {patient.currentESI}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-950">{patient.name}</h2>
                <span className="font-mono text-xs text-slate-700 font-bold">({patient.id})</span>
                {patient.hasPriorHistory ? (
                  <span className="inline-flex items-center text-[10px] font-mono text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                    <ShieldCheck className="h-3 w-3 mr-1 text-emerald-700" />
                    ABDM: {patient.abhaId}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-bold font-mono">
                    Zero-History (First Time)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                {patient.age} years ({vitalCalib.cohortName || 'Adult'}) • {patient.gender} • Intake: {patient.intakeMethod || 'Walk-in'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <X className="h-5 w-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-white">
          {/* Top Urgency & Action Banner */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assigned Clinical Urgency
              </span>
              <div className="text-base font-black text-slate-950 mt-0.5">
                ESI Level {patient.currentESI}: {triage.severityLabel || 'Standard Triage'}
              </div>
              <div className="text-xs text-slate-800 font-medium mt-1">
                Current Waiting Time: <strong className="font-mono text-slate-950 font-bold tabular-nums">{patient.waitTimeMinutes} mins</strong> (Safe SLA Threshold: {patient.maxSafeWaitMinutes} mins)
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenOverride && onOpenOverride(patient);
                }}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-purple-100 text-purple-950 border border-purple-300 flex items-center space-x-1.5 font-bold transition-all duration-150 active:scale-[0.98] shadow-2xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Override</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenVitalsRecheck && onOpenVitalsRecheck(patient);
                }}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center space-x-1.5 font-bold transition-all duration-150 active:scale-[0.98] shadow-2xs"
              >
                <Activity className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Re-check Vitals</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenSbar && onOpenSbar(patient);
                }}
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 font-bold shadow-xs transition-all duration-150 active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>SBAR Handover</span>
              </button>
            </div>
          </div>

          {/* Overridden Details Box if present */}
          {isOverridden && patient.overrideDetails && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-300 text-purple-950 font-medium">
              <div className="font-bold flex items-center space-x-1.5 text-purple-950 mb-1">
                <SlidersHorizontal className="h-4 w-4 text-purple-800 stroke-[2.2]" />
                <span>Clinician Manual Override Active (DISHA/ABDM Audit Signed)</span>
              </div>
              <p className="text-xs leading-relaxed">
                <strong>Previous ESI:</strong> Level {patient.overrideDetails.originalESI} → <strong>Overridden to:</strong> Level {patient.overrideDetails.newESI}
              </p>
              <p className="text-xs mt-1">
                <strong>Justification:</strong> {patient.overrideDetails.reason}
              </p>
              <p className="text-xs text-purple-900 mt-1 font-mono font-bold">
                Overridden by: {patient.overrideDetails.nurseId} ({patient.overrideDetails.nurseRole}) at {new Date(patient.overrideDetails.overriddenAt).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Deterioration Alert Banner */}
          {patient.deteriorationAlert && (
            <div className="p-4 rounded-xl bg-rose-100 border border-rose-400 text-rose-950">
              <div className="font-extrabold flex items-center space-x-1.5 text-rose-950 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-700 stroke-[2.4]" />
                <span>Dynamic Waiting Room Deterioration Alert</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-950 font-semibold">{patient.deteriorationReason}</p>
            </div>
          )}

          {/* Explicit Clinical Confidence & Uncertainty Assessment Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-sky-700 stroke-[2.3]" />
                <span className="font-bold text-slate-950 text-xs uppercase tracking-wider">
                  AI Clinical Confidence & Uncertainty Metrics
                </span>
              </div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-xs">
                  Confidence: {triage.confidenceScore || 85}%
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs">
                  Uncertainty: {triage.uncertaintyPercentage || 15}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  (triage.confidenceScore || 85) >= 80 ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
                style={{ width: `${triage.confidenceScore || 85}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-800 font-medium">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Missing Telemetry Penalty:</span>
                <strong className="font-mono text-slate-950 font-bold">{triage.missingDataPenalty || 0}%</strong>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Zero-History Penalty:</span>
                <strong className="font-mono text-slate-950 font-bold">{triage.zeroHistoryPenalty || 0}%</strong>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Asymmetric Safety Floor:</span>
                <strong className="text-sky-950 font-bold">{triage.wasEscalated ? 'Active (Escalated)' : 'Compliant'}</strong>
              </div>
            </div>

            {triage.wasEscalated && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium">
                <strong>Safety Rule Triggered:</strong> {triage.escalationReason}
              </div>
            )}
          </div>

          {/* Physiological Vitals Breakdown */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-1.5 text-sky-600 stroke-[2.4]" />
              Age-Calibrated Physiological Vitals ({vitalCalib.cohortName || 'Cohort'})
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 font-mono text-center">
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">Heart Rate</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.vitals?.hr || '--'} bpm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">Blood Pressure</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.vitals?.sbp || '--'}/{patient.vitals?.dbp || '--'}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">Resp. Rate</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.vitals?.rr || '--'} bpm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">SpO2 Oxygen</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.vitals?.spo2 || '--'}%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">Body Temp</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.vitals?.temp || '--'}°C</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 shadow-2xs">
                <div className="text-xs text-slate-700 font-bold">GCS Score</div>
                <div className="text-sm font-black text-slate-950 mt-0.5 tabular-nums">{patient.gcs || 15}/15</div>
              </div>
            </div>

            {/* Vital Anomalies list */}
            {vitalCalib.anomalies?.length > 0 && (
              <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-rose-700">Anomalies Detected:</div>
                {vitalCalib.anomalies.map((anom, idx) => (
                  <div key={idx} className="text-xs text-slate-700 flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                    <span><strong>{anom.parameter}:</strong> {anom.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Chief Complaint & Clinical Presentation
              </span>
              <p className="text-xs text-slate-900 mt-1 leading-relaxed">{patient.chiefComplaint}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Associated Symptoms
                </span>
                <p className="text-xs text-slate-700 mt-1">
                  {(patient.symptoms || []).join(', ') || 'None recorded'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Past Medical History
                </span>
                <p className="text-xs text-slate-700 mt-1">
                  {(patient.medicalHistory || []).join(', ') || 'No prior EHR on file'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Clinical Reasoning & Differential */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 space-y-3 shadow-2xs">
            <h3 className="font-bold text-sky-900 text-xs uppercase tracking-wider flex items-center">
              <Activity className="h-4 w-4 mr-1.5 text-sky-600 stroke-[2.2]" />
              AI Clinical Reasoning & Differential Impression
            </h3>

            <p className="text-xs text-slate-950 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-2xs font-medium">
              {triage.clinicalRationale}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Differential Diagnoses
                </span>
                <ul className="space-y-1">
                  {(triage.differentialDiagnosis || []).map((diff, idx) => (
                    <li key={idx} className="bg-white px-2.5 py-1.5 rounded-md text-slate-800 border border-slate-200 flex items-center space-x-2 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-600"></span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Predicted Resource Needs
                </span>
                <ul className="space-y-1">
                  {(triage.predictedResourceNeeds || []).map((res, idx) => (
                    <li key={idx} className="bg-white px-2.5 py-1.5 rounded-md text-slate-800 border border-slate-200 flex items-center space-x-2 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Patient Progression & History Log */}
          {patient.historyLog?.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                Dynamic Continuous Triage Timeline
              </h3>
              <div className="space-y-2">
                {patient.historyLog.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 text-xs border-l-2 border-slate-300 pl-3 py-0.5">
                    <span className="font-mono text-slate-500 tabular-nums whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-800">{log.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
