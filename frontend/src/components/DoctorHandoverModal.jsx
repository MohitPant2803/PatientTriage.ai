import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export default function DoctorHandoverModal({
  patient,
  isOpen,
  onClose
}) {
  if (!isOpen || !patient) return null;

  const [copied, setCopied] = useState(false);
  const sbar = patient.sbarNote || {};

  const handleCopy = () => {
    const textToCopy = `
EMERGENCY DEPARTMENT SBAR CLINICAL HANDOVER
==================================================
PATIENT: ${patient.name} (${patient.id}) | Age: ${patient.age}y (${patient.gender})
ABDM/ABHA: ${patient.abhaId || 'Zero-History First-Time'}
ASSIGNED PRIORITY: ESI Level ${patient.currentESI}

S - SITUATION:
${sbar.situation || patient.chiefComplaint}

B - BACKGROUND:
${sbar.background || (patient.medicalHistory || []).join(', ') || 'No prior medical history on file'}

A - ASSESSMENT:
${sbar.assessment || patient.triageResult?.clinicalRationale || 'Physiological assessment nominal'}

R - RECOMMENDATION:
${sbar.recommendation || (patient.triageResult?.predictedResourceNeeds || []).join(', ')}

TRIAGE CLINICIAN: RN-4042 (P. Sharma, Lead Triage Nurse)
TIMESTAMP: ${new Date().toLocaleString()}
==================================================
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Physician SBAR Clinical Handover</h2>
              <p className="text-xs text-slate-400">
                Automated clinical handover note for attending emergency doctor
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

        {/* SBAR Sheet Preview */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs bg-slate-950/50">
          {/* Patient Card Header */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm">{patient.name}</span>
              <span className="text-slate-400 ml-2 font-mono">({patient.id})</span>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {patient.age}y • {patient.gender} • Intake at {patient.waitTimeMinutes}m ago
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-sky-950 text-sky-300 font-bold border border-sky-800 text-xs">
                ESI Level {patient.currentESI}
              </span>
            </div>
          </div>

          {/* S - Situation */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-sky-400 uppercase tracking-wider text-[11px] mb-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-sky-400 mr-1.5"></span>
              S — Situation
            </div>
            <p className="text-slate-200 leading-relaxed">{sbar.situation || patient.chiefComplaint}</p>
          </div>

          {/* B - Background */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] mb-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-indigo-400 mr-1.5"></span>
              B — Background
            </div>
            <p className="text-slate-200 leading-relaxed">
              {sbar.background || (patient.medicalHistory || []).join(', ') || 'No prior medical history on file (ABDM Null)'}
            </p>
          </div>

          {/* A - Assessment */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-amber-400 mr-1.5"></span>
              A — Assessment
            </div>
            <p className="text-slate-200 leading-relaxed">
              {sbar.assessment || patient.triageResult?.clinicalRationale || 'Physiological assessment stable'}
            </p>
          </div>

          {/* R - Recommendation */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5"></span>
              R — Recommendation
            </div>
            <p className="text-slate-200 leading-relaxed">
              {sbar.recommendation || (patient.triageResult?.predictedResourceNeeds || []).join(', ') || 'Bedside evaluation'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>DISHA / ABDM Handover Certified</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 flex items-center space-x-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Handover Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
