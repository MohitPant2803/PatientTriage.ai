import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  Activity,
  Heart,
  Clock,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal
} from 'lucide-react';

export default function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onOpenOverride,
  onOpenSbar
}) {
  if (!isOpen || !patient) return null;

  const triage = patient.triageResult || {};
  const vitalCalib = triage.vitalCalib || {};
  const isOverridden = patient.isOverridden;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
              ESI {patient.currentESI}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">{patient.name}</h2>
                <span className="font-mono text-xs text-slate-400">({patient.id})</span>
                {patient.hasPriorHistory ? (
                  <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    ABDM: {patient.abhaId}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-mono">
                    Zero-History (First Time)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {patient.age} years ({vitalCalib.cohortName || 'Adult'}) • {patient.gender} • Intake: {patient.intakeMethod || 'Walk-in'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Top Priority & Deterioration Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Assigned Clinical Urgency
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                ESI Level {patient.currentESI}: {triage.severityLabel || 'Standard Triage'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Current Waiting Time: <span className="font-mono text-white">{patient.waitTimeMinutes} mins</span> (Safe SLA Threshold: {patient.maxSafeWaitMinutes} mins)
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenOverride(patient);
                }}
                className="px-3 py-1.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 flex items-center space-x-1 font-medium transition-all duration-150 active:scale-[0.98]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Override Priority</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenSbar(patient);
                }}
                className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white flex items-center space-x-1 font-semibold shadow transition-all duration-150 active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>SBAR Handover</span>
              </button>
            </div>
          </div>

          {/* Overridden Details Box if present */}
          {isOverridden && patient.overrideDetails && (
            <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/80 text-purple-200">
              <div className="font-semibold flex items-center space-x-1.5 text-purple-300 mb-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Clinician Manual Override Active (DISHA/ABDM Audit Signed)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                <strong>Previous ESI:</strong> Level {patient.overrideDetails.originalESI} → <strong>Overridden to:</strong> Level {patient.overrideDetails.newESI}
              </p>
              <p className="text-[11px] mt-1">
                <strong>Justification:</strong> {patient.overrideDetails.reason}
              </p>
              <p className="text-[10px] text-purple-400/80 mt-1 font-mono">
                Overridden by: {patient.overrideDetails.nurseId} ({patient.overrideDetails.nurseRole}) at {new Date(patient.overrideDetails.overriddenAt).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Deterioration Alert Banner */}
          {patient.deteriorationAlert && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200">
              <div className="font-semibold flex items-center space-x-1.5 text-rose-300 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Dynamic Waiting Room Deterioration Alert</span>
              </div>
              <p className="text-[11px] leading-relaxed">{patient.deteriorationReason}</p>
            </div>
          )}

          {/* Physiological Vitals Breakdown */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
              Age-Calibrated Physiological Vitals ({vitalCalib.cohortName || 'Cohort'})
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Heart Rate</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.vitals?.hr || '--'} bpm</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Blood Pressure</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.vitals?.sbp || '--'}/{patient.vitals?.dbp || '--'}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Respiratory Rate</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.vitals?.rr || '--'} bpm</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">SpO2 Oxygen</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.vitals?.spo2 || '--'}%</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Body Temp</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.vitals?.temp || '--'}°C</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">GCS Score</div>
                <div className="text-sm font-bold text-white mt-0.5">{patient.gcs || 15}/15</div>
              </div>
            </div>

            {/* Vital Anomalies list */}
            {vitalCalib.anomalies?.length > 0 && (
              <div className="mt-2.5 space-y-1">
                <div className="text-[11px] font-semibold text-rose-400">Anomalies Detected:</div>
                {vitalCalib.anomalies.map((anom, idx) => (
                  <div key={idx} className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    <span><strong>{anom.parameter}:</strong> {anom.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Chief Complaint & Clinical Observation
              </span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">{patient.chiefComplaint}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Associated Symptoms
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  {(patient.symptoms || []).join(', ') || 'None recorded'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Past Medical History
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  {(patient.medicalHistory || []).join(', ') || 'No prior EHR on file'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Clinical Reasoning & Differential */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-semibold text-sky-400 text-xs uppercase tracking-wider flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI Clinical Reasoning & Differential Diagnosis
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
              {triage.clinicalRationale}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Top Differential Diagnoses
                </span>
                <ul className="space-y-1">
                  {(triage.differentialDiagnosis || []).map((diff, idx) => (
                    <li key={idx} className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800 flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Predicted Resource Needs
                </span>
                <ul className="space-y-1">
                  {(triage.predictedResourceNeeds || []).map((res, idx) => (
                    <li key={idx} className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800 flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Patient Progression & History Log */}
          {patient.historyLog?.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-2 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Dynamic Continuous Triage Timeline
              </h3>
              <div className="space-y-2">
                {patient.historyLog.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-[11px] border-l-2 border-slate-700 pl-2.5">
                    <span className="font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-300">{log.note}</span>
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
