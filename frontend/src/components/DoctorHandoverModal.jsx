import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Printer,
  ShieldCheck
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-modal w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Physician SBAR Clinical Handover</h2>
              <p className="text-xs text-slate-700 font-medium">
                Automated clinical handover note for attending emergency doctor
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

        {/* SBAR Sheet Preview */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-xs bg-white">
          {/* Patient Card Header */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-extrabold text-slate-950 text-sm">{patient.name}</span>
              <span className="text-slate-700 ml-2 font-mono text-xs font-bold">({patient.id})</span>
              <div className="text-xs text-slate-700 font-semibold mt-1">
                {patient.age}y • {patient.gender} • Intake {patient.waitTimeMinutes}m ago
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-sky-100 text-sky-950 font-black border border-sky-300 text-xs font-mono">
                ESI Level {patient.currentESI}
              </span>
            </div>
          </div>

          {/* S - Situation */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
            <div className="font-bold text-sky-900 uppercase tracking-wider text-xs mb-1.5 flex items-center">
              <span className="h-2 w-2 rounded-full bg-sky-600 mr-2"></span>
              S - Situation (Chief Complaint & Immediate Concern)
            </div>
            <p className="text-slate-950 leading-relaxed font-medium">
              {sbar.situation || patient.chiefComplaint}
            </p>
          </div>

          {/* B - Background */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
            <div className="font-bold text-sky-900 uppercase tracking-wider text-xs mb-1.5 flex items-center">
              <span className="h-2 w-2 rounded-full bg-sky-600 mr-2"></span>
              B - Background (History, Allergies, Context)
            </div>
            <p className="text-slate-950 leading-relaxed font-medium">
              {sbar.background || (patient.medicalHistory || []).join(', ') || 'No prior medical history on file'}
            </p>
          </div>

          {/* A - Assessment */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
            <div className="font-bold text-sky-900 uppercase tracking-wider text-xs mb-1.5 flex items-center">
              <span className="h-2 w-2 rounded-full bg-sky-600 mr-2"></span>
              A - Assessment (AI CDS Clinical Impression & Vitals)
            </div>
            <p className="text-slate-950 leading-relaxed font-medium">
              {sbar.assessment || patient.triageResult?.clinicalRationale || 'Physiological assessment nominal'}
            </p>
          </div>

          {/* R - Recommendation */}
          <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
            <div className="font-bold text-emerald-950 uppercase tracking-wider text-xs mb-1.5 flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
              R - Recommendation (Immediate Orders & Workup)
            </div>
            <p className="text-slate-950 leading-relaxed font-medium">
              {sbar.recommendation || (patient.triageResult?.predictedResourceNeeds || []).join(', ')}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>DISHA Certified Clinical Handover</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 flex items-center space-x-1.5 font-bold transition-all shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Print</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 font-bold shadow-xs transition-all duration-150 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.4]" />
                  <span>Copied SBAR!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 stroke-[2.4]" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
