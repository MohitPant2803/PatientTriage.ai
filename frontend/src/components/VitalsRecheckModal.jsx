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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Vitals Re-check & Continuous Triage</h2>
              <p className="text-xs text-slate-400">
                Dynamic physiological re-assessment for waiting patient
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
                {patient.id} • {patient.age}y ({patient.triageResult?.vitalCalib?.cohortName || 'Cohort'})
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current ESI</span>
              <span className="font-bold text-sky-400 text-sm">Level {patient.currentESI}</span>
            </div>
          </div>

          {/* Quick Trigger Preset for Judges */}
          <div className="flex justify-between items-center bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/60">
            <span className="text-[11px] text-rose-300 font-medium flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-400" />
              Judge Demonstration:
            </span>
            <button
              type="button"
              onClick={handleSimulateDecompensation}
              className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs shadow transition-colors flex items-center space-x-1"
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Simulate Acute Decompensation</span>
            </button>
          </div>

          {/* Vitals Input Grid */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitals.hr}
                onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.sbp}
                onChange={(e) => setVitals({ ...vitals, sbp: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.dbp}
                onChange={(e) => setVitals({ ...vitals, dbp: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Resp Rate (bpm)</label>
              <input
                type="number"
                value={vitals.rr}
                onChange={(e) => setVitals({ ...vitals, rr: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">SpO2 Oxygen (%)</label>
              <input
                type="number"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Body Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="flex items-center space-x-1.5 px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
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
