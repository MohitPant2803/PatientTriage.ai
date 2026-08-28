import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

const JUSTIFICATION_CATEGORIES = [
  { id: 'ATYPICAL_CLINICAL_APPEARANCE', label: 'Atypical clinical appearance (looks paler/sicker than vitals indicate)' },
  { id: 'HIGH_UNCERTAINTY_SURGICAL_RISK', label: 'High uncertainty: suspected acute surgical abdomen / occult perforation' },
  { id: 'DISPROPORTIONATE_PAIN', label: 'Severe pain out of proportion to exam (suspected acute ischemia)' },
  { id: 'PEDIATRIC_RAPID_DECOMPENSATION', label: 'Pediatric subtle respiratory/neurological decompensation risk' },
  { id: 'GERIATRIC_DELIRIUM_SEPSIS', label: 'Geriatric subtle delirium / occult hypothermic sepsis' },
  { id: 'SOCIAL_VULNERABILITY_FACTOR', label: 'Social vulnerability / domestic risk / lack of home support' },
  { id: 'CLINICAL_DISCRETION_OTHER', label: 'Other clinical discretion (specify in notes)' }
];

export default function ClinicianOverrideModal({
  patient,
  isOpen,
  onClose,
  onOverrideSuccess
}) {
  if (!isOpen || !patient) return null;

  const initialESI = patient.currentESI || 3;
  const [newESI, setNewESI] = useState(initialESI === 3 ? 2 : 1);
  const [category, setCategory] = useState(JUSTIFICATION_CATEGORIES[0].id);
  const [reasonNotes, setReasonNotes] = useState('');
  const [nurseName, setNurseName] = useState('Nurse P. Sharma, RN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reasonNotes.trim()) {
      alert('Please provide clinical justification notes for regulatory audit compliance.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = JUSTIFICATION_CATEGORIES.find((c) => c.id === category);
      const fullReason = `${selectedCat?.label || category}. Clinical Note: ${reasonNotes.trim()}`;

      const res = await api.overrideTriage(patient.id, {
        newESI: Number(newESI),
        category,
        reason: fullReason,
        nurseId: `RN-4042 (${nurseName})`,
        nurseRole: 'Lead Triage Nurse'
      });

      if (res.success) {
        onOverrideSuccess(res.patient);
        onClose();
      }
    } catch (err) {
      alert('Failed to override triage priority: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-modal w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Clinician Triage Override</h2>
              <p className="text-xs text-slate-700 font-medium">
                Human-in-the-Loop • DISHA / ABDM Tamper-Evident Audit Logging
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-white">
          {/* Patient Overview */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-300 flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-extrabold text-slate-950 text-sm">{patient.name}</span>
              <div className="text-slate-700 text-xs font-mono font-bold mt-0.5">
                {patient.id} • {patient.age}y • {patient.gender}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-700 font-bold block">Current Priority</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-white text-slate-950 border border-slate-300 font-extrabold text-xs">
                ESI {initialESI}
              </span>
            </div>
          </div>

          {/* New ESI Select */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Overridden ESI Level *
            </label>
            <div className="grid grid-cols-5 gap-2 font-mono text-center">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewESI(lvl)}
                  className={`py-2 rounded-lg border text-xs font-black transition-all ${
                    newESI === lvl
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ESI {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Justification Category */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Regulatory Justification Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-950 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none shadow-2xs"
            >
              {JUSTIFICATION_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Clinical Justification Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mandatory Clinical Rationale (Tamper-evident audit logged) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail clinician reasoning, exam findings, or specific risk factors..."
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-950 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:outline-none shadow-2xs"
            ></textarea>
          </div>

          {/* Clinician Signature / ID */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Licensed Clinician Name & ID
              </label>
              <input
                type="text"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Digital Signature Token
              </label>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-purple-800 font-mono font-semibold flex items-center justify-between">
                <span>SIG_ABDM_RN4042</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Recording Override...' : 'Confirm & Log Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
