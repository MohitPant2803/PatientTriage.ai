import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Activity,
  User,
  Zap,
  HelpCircle,
  Stethoscope,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_PRESETS = [
  {
    name: '1. Geriatric Silent MI (Atypical)',
    data: {
      name: 'Kamla Devi',
      age: 76,
      gender: 'Female',
      abhaId: '91-4509-2211-7788',
      hasPriorHistory: true,
      medicalHistory: 'Type 2 Diabetes (20y), Hypertension, Neuropathy',
      chiefComplaint: 'Feeling unusual exhaustion, mild stomach queasiness and cold sweat for 4 hours. No crushing chest pain.',
      symptoms: 'Diaphoresis, Mild nausea, Extreme fatigue',
      painScore: 2,
      gcs: 15,
      hr: 106,
      sbp: 94,
      dbp: 60,
      rr: 22,
      spo2: 93,
      temp: 36.4
    }
  },
  {
    name: '2. Pediatric Febrile Decompensation',
    data: {
      name: 'Vihaan Joshi',
      age: 2,
      gender: 'Male',
      abhaId: '91-8899-1122-3344',
      hasPriorHistory: true,
      medicalHistory: 'Nil significant',
      chiefComplaint: 'High fever for 14h, not making eye contact, rapid shallow breathing, unusually limp.',
      symptoms: 'Fever 39.2°C, Lethargy, Tachypnea, Poor oral intake',
      painScore: 5,
      gcs: 13,
      hr: 162,
      sbp: 84,
      dbp: 50,
      rr: 48,
      spo2: 94,
      temp: 39.2
    }
  },
  {
    name: '3. Zero-History Migrant (High Uncertainty)',
    data: {
      name: 'Ramu Paswan',
      age: 31,
      gender: 'Male',
      abhaId: '', // Zero history
      hasPriorHistory: false,
      medicalHistory: '',
      chiefComplaint: 'Acute severe right-sided abdominal cramping since morning, doubled over in pain.',
      symptoms: 'Sharp abdominal pain, Repeated vomiting, Inability to stand straight',
      painScore: 9,
      gcs: 15,
      hr: 114,
      sbp: 136,
      dbp: 86,
      rr: 24,
      spo2: 98,
      temp: 37.8
    }
  },
  {
    name: '4. Ambiguous PE vs Anxiety',
    data: {
      name: 'Shreya Roy',
      age: 27,
      gender: 'Female',
      abhaId: '91-3311-8822-4455',
      hasPriorHistory: true,
      medicalHistory: 'On Oral Contraceptive Pills (OCP 10 months)',
      chiefComplaint: 'Sudden sharp stabbing chest pain when inhaling, feels dizzy, rapid heart rate.',
      symptoms: 'Pleuritic chest pain, Dyspnea, Tachycardia, Anxiety',
      painScore: 7,
      gcs: 15,
      hr: 124,
      sbp: 116,
      dbp: 72,
      rr: 26,
      spo2: 93,
      temp: 37.0
    }
  }
];

export default function PatientIntakeModal({ isOpen, onClose, onPatientAdmitted }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    age: 35,
    gender: 'Male',
    abhaId: '',
    hasPriorHistory: true,
    medicalHistory: '',
    chiefComplaint: '',
    symptoms: '',
    painScore: 0,
    gcs: 15,
    vitals: {
      hr: '',
      sbp: '',
      dbp: '',
      rr: '',
      spo2: '',
      temp: ''
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveTriage, setLiveTriage] = useState(null);

  // Load a demo preset
  const handleLoadPreset = (preset) => {
    setFormData({
      name: preset.data.name,
      age: preset.data.age,
      gender: preset.data.gender,
      abhaId: preset.data.abhaId,
      hasPriorHistory: preset.data.hasPriorHistory,
      medicalHistory: preset.data.medicalHistory,
      chiefComplaint: preset.data.chiefComplaint,
      symptoms: preset.data.symptoms,
      painScore: preset.data.painScore,
      gcs: preset.data.gcs,
      vitals: {
        hr: preset.data.hr,
        sbp: preset.data.sbp,
        dbp: preset.data.dbp,
        rr: preset.data.rr,
        spo2: preset.data.spo2,
        temp: preset.data.temp
      }
    });
  };

  // Run live triage calculation whenever key fields change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.chiefComplaint.length > 5 || formData.vitals.hr) {
        setIsAnalyzing(true);
        try {
          const payload = {
            name: formData.name,
            age: Number(formData.age) || 35,
            gender: formData.gender,
            hasPriorHistory: formData.hasPriorHistory,
            abhaId: formData.abhaId,
            medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((s) => s.trim()) : [],
            chiefComplaint: formData.chiefComplaint,
            symptoms: formData.symptoms ? formData.symptoms.split(',').map((s) => s.trim()) : [],
            painScore: Number(formData.painScore) || 0,
            gcs: Number(formData.gcs) || 15,
            vitals: formData.vitals
          };

          const res = await api.analyzeTriage(payload);
          if (res.success) {
            setLiveTriage(res.triageResult);
          }
        } catch (err) {
          console.error('Live analysis failed:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData]);

  // Voice transcript simulation
  const toggleVoiceDictation = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate live ambient nursing intake transcription
      const simulatedTranscript =
        'Patient presents with sharp right-sided chest pain, pulse is 118, blood pressure 130 over 85, oxygen saturation 93 percent, pain level 8, states difficulty catching breath.';

      setTimeout(async () => {
        setIsRecording(false);
        setFormData((prev) => ({
          ...prev,
          chiefComplaint: simulatedTranscript
        }));

        try {
          const res = await api.parseTranscript(simulatedTranscript);
          if (res.success && res.extracted) {
            setFormData((prev) => ({
              ...prev,
              symptoms: res.extracted.symptoms.join(', '),
              painScore: res.extracted.painScore || prev.painScore,
              vitals: {
                ...prev.vitals,
                ...res.extracted.vitals
              }
            }));
          }
        } catch (err) {
          console.error('NLP parse failed:', err);
        }
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  // Submit and admit patient
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.chiefComplaint) {
      alert('Please provide patient name and chief complaint.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age) || 35,
        gender: formData.gender,
        hasPriorHistory: formData.hasPriorHistory,
        abhaId: formData.abhaId,
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((s) => s.trim()) : [],
        chiefComplaint: formData.chiefComplaint,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map((s) => s.trim()) : [],
        painScore: Number(formData.painScore) || 0,
        gcs: Number(formData.gcs) || 15,
        vitals: formData.vitals
      };

      const res = await api.createPatient(payload);
      if (res.success) {
        onPatientAdmitted(res.patient);
        onClose();
      }
    } catch (err) {
      alert('Failed to admit patient: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Rapid Patient Intake & AI Co-Pilot</h2>
              <p className="text-xs text-slate-400">
                Age-Calibrated Physiology • Asymmetric Safety Engine • Google Gemini CDS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Preset Bar for Judges */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider whitespace-nowrap">
            Judge Archetype Presets:
          </span>
          <div className="flex space-x-1.5">
            {DEMO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadPreset(p)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-900/60 text-slate-200 hover:text-sky-300 border border-slate-700 text-xs whitespace-nowrap transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Intake Form (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {/* Demographics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* ABDM Health ID & Zero-History Toggle */}
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex-1 mr-3">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Ayushman Bharat Health ID (ABHA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91-4582-1102-8841 (Leave blank for Zero-History)"
                  value={formData.abhaId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      abhaId: e.target.value,
                      hasPriorHistory: e.target.value.trim().length > 0
                    })
                  }
                  className="w-full px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col items-end text-xs">
                <span className="text-[11px] text-slate-400 mb-1">EHR Status</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      hasPriorHistory: !formData.hasPriorHistory,
                      abhaId: !formData.hasPriorHistory ? '91-4402-9911-3344' : ''
                    })
                  }
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    formData.hasPriorHistory
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {formData.hasPriorHistory ? 'ABDM EHR Matched' : 'Zero-History (First-Time)'}
                </button>
              </div>
            </div>

            {/* Chief Complaint & Voice Dictation Simulator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Chief Complaint & Observed Cues *
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium border transition-all ${
                    isRecording
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3 w-3 text-rose-400" />
                      <span>Recording Live Voice...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 text-sky-400" />
                      <span>Simulate Ambient Voice Intake</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Describe presenting symptoms, onset time, and clinical distress..."
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Associated Symptoms & Medical History */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Associated Symptoms (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diaphoresis, Nausea, Radiating pain"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Past Medical History
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Pain Score & GCS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                  <span>Pain Score (0 - 10)</span>
                  <span className="font-bold text-sky-400">{formData.painScore}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painScore}
                  onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                  className="w-full accent-sky-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Glasgow Coma Scale (GCS 3 - 15)
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={formData.gcs}
                  onChange={(e) => setFormData({ ...formData, gcs: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Vitals Telemetry Grid */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                  <Activity className="h-3.5 w-3.5 mr-1 text-sky-400" />
                  Age-Calibrated Physiological Vitals
                </span>
                <span className="text-[10px] text-slate-400">PALS & Geriatric Calibrated</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">HR (bpm)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.vitals.hr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, hr: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">SBP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={formData.vitals.sbp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, sbp: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">DBP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={formData.vitals.dbp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, dbp: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">RR (bpm)</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={formData.vitals.rr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, rr: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={formData.vitals.spo2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, spo2: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="37.0"
                    value={formData.vitals.temp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: { ...formData.vitals, temp: e.target.value }
                      })
                    }
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Form Submit Button */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
              >
                <FileCheck className="h-4 w-4" />
                <span>{isSubmitting ? 'Admitting...' : 'Admit & Queue Patient'}</span>
              </button>
            </div>
          </form>

          {/* Right Column: Real-Time AI Co-Pilot & Explainability Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Live AI Clinical Co-Pilot
                </span>
                {isAnalyzing ? (
                  <span className="text-[10px] text-slate-400 animate-pulse">Analyzing...</span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400">Sub-second Inference</span>
                )}
              </div>

              {liveTriage ? (
                <div className="space-y-3">
                  {/* Score & Uncertainty Pill */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Recommended Priority
                      </div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        ESI Level {liveTriage.esiLevel}
                      </div>
                      <div className="text-[11px] text-slate-300">{liveTriage.severityLabel}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Confidence
                      </div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {liveTriage.confidenceScore}%
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        {liveTriage.uncertaintyPercentage}% Uncertainty
                      </div>
                    </div>
                  </div>

                  {/* Asymmetric Safety Escalation Alert */}
                  {liveTriage.wasEscalated && (
                    <div className="p-2.5 rounded bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200">
                      <div className="flex items-center space-x-1.5 font-semibold text-amber-300">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Asymmetric Safety Escalation Active</span>
                      </div>
                      <p className="text-[11px] text-amber-300/90 mt-1 leading-relaxed">
                        {liveTriage.escalationReason}
                      </p>
                    </div>
                  )}

                  {/* Deterministic Triggers Alert */}
                  {liveTriage.deterministicRuleTriggered && (
                    <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200">
                      <div className="flex items-center space-x-1.5 font-semibold text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Hard Safety Boundary Triggered</span>
                      </div>
                      <ul className="text-[11px] text-rose-300/90 mt-1 list-disc list-inside space-y-0.5">
                        {liveTriage.deterministicTriggers?.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Clinical Rationale */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Clinical Rationale
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      {liveTriage.clinicalRationale}
                    </p>
                  </div>

                  {/* 3 Dynamic Probing Questions */}
                  {liveTriage.suggestedProbingQuestions?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider mb-1 flex items-center">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        AI Probing Questions for Nurse
                      </div>
                      <div className="space-y-1.5">
                        {liveTriage.suggestedProbingQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-800 flex items-start space-x-1.5"
                          >
                            <span className="font-bold text-sky-400">{idx + 1}.</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Provide patient symptoms or vitals to generate real-time AI clinical analysis.
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <span>Model: Google Gemini + Rule Safety Floor</span>
              <span>ABDM Level-2 Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
