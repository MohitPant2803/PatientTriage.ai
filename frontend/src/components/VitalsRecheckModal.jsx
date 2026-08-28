import React, { useState } from 'react';
import {
  X,
  HeartPulse,
  Activity,
  AlertTriangle,
  FileCheck,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

export default function VitalsRecheckModal({
  patient,
  isOpen,
  onClose,
  onVitalsUpdated
}) {
  if (!isOpen || !patient) return null;

  const [vitals, setVitals] = useState({
    hr: patient.vitals?.hr || '',
    sbp: patient.vitals?.sbp || '',
    dbp: patient.vitals?.dbp || '',
    rr: patient.vitals?.rr || '',
    spo2: patient.vitals?.spo2 || '',
    temp: patient.vitals?.temp || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Deterioration Simulator button for testing in front of judges
  const handleSimulateDecompensation = () => {
    setVitals({
      hr: Math.min(170, (Number(vitals.hr) || 80) + 35),
      sbp: Math.max(75, (Number(vitals.sbp) || 120) - 30),
      dbp: Math.max(45, (Number(vitals.dbp) || 80) - 20),
      rr: Math.min(42, (Number(vitals.rr) || 16) + 12),
      spo2: Math.max(86, (Number(vitals.spo2) || 98) - 9),
      temp: vitals.temp || 38.5
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.updateVitals(patient.id, vitals);
      if (res.success) {
        onVitalsUpdated(res.patient);
        onClose();
      }
    } catch (err) {
      alert('Failed to update vitals: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-modal w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-300 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <HeartPulse className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Vitals Re-check & Continuous Triage</h2>
              <p className="text-xs text-slate-700 font-medium">
                Dynamic physiological re-assessment for waiting patient
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
                {patient.id} • {patient.age}y ({patient.triageResult?.vitalCalib?.cohortName || 'Cohort'})
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wider block">Current ESI</span>
              <span className="font-black text-slate-950 text-sm">Level {patient.currentESI}</span>
            </div>
          </div>

          {/* Quick Demo Simulator trigger */}
          <div className="p-3 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-rose-950 block text-xs">Simulate Deterioration</span>
              <span className="text-[11px] text-rose-900 font-medium">Inject sudden tachycardia + hypoxia</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateDecompensation}
              className="px-3 py-1 rounded-md bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              Simulate Drop
            </button>
          </div>

          {/* Vitals Form Grid */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitals.hr}
                onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Systolic BP</label>
              <input
                type="number"
                value={vitals.sbp}
                onChange={(e) => setVitals({ ...vitals, sbp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Diastolic BP</label>
              <input
                type="number"
                value={vitals.dbp}
                onChange={(e) => setVitals({ ...vitals, dbp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Resp Rate (bpm)</label>
              <input
                type="number"
                value={vitals.rr}
                onChange={(e) => setVitals({ ...vitals, rr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Updating...' : 'Re-evaluate Triage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
