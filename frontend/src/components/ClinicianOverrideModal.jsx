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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Clinician Triage Override</h2>
              <p className="text-xs text-slate-400">
                Human-in-the-Loop • DISHA / ABDM Tamper-Evident Audit Logging
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Patient Overview */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white text-sm">{patient.name}</span>
              <div className="text-slate-400 text-[11px] font-mono">
                {patient.id} • {patient.age}y • {patient.gender}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Suggested</span>
              <span className="font-bold text-sky-400 text-sm">ESI Level {patient.triageResult?.esiLevel || initialESI}</span>
            </div>
          </div>

          {/* New ESI Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Select Overridden ESI Priority Level *
            </label>
            <div className="grid grid-cols-5 gap-2 font-semibold text-center">
              {[
                { level: 1, label: 'Level 1', sub: 'Resus', color: 'hover:bg-rose-950 focus:ring-rose-500' },
                { level: 2, label: 'Level 2', sub: 'Emergent', color: 'hover:bg-orange-950 focus:ring-orange-500' },
                { level: 3, label: 'Level 3', sub: 'Urgent', color: 'hover:bg-amber-950 focus:ring-amber-500' },
                { level: 4, label: 'Level 4', sub: 'Less Urgent', color: 'hover:bg-emerald-950 focus:ring-emerald-500' },
                { level: 5, label: 'Level 5', sub: 'Non-Urgent', color: 'hover:bg-sky-950 focus:ring-sky-500' }
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setNewESI(item.level)}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    newESI === item.level
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{item.label}</div>
                  <div className="text-[10px] opacity-80">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Structured Clinical Justification Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">
              Regulatory Justification Category (DISHA Mandated) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              {JUSTIFICATION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clinician Justification Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">
              Clinical Assessment & Rationalization Note *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail the clinical observations, bedside cues, or risk factors leading to this override..."
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Clinician Signature / ID */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Licensed Clinician Name & ID
              </label>
              <input
                type="text"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Digital Signature Token
              </label>
              <div className="px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-purple-400 font-mono flex items-center justify-between">
                <span>SIG_ABDM_RN4042</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
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
