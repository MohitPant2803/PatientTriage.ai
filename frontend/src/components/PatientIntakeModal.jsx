import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Activity,
  User,
  Zap,
  HelpCircle,
  Stethoscope,
  FileCheck,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_PRESETS = [
  {
    name: '1. Geriatric Silent MI',
    data: {
      name: 'Kamla Devi',
      age: 76,
      gender: 'Female',
      abhaId: '91-4509-2211-7788',
      hasPriorHistory: true,
      medicalHistory: 'Type 2 Diabetes (20y), Hypertension, Neuropathy',
      chiefComplaint: 'Unusual exhaustion, mild stomach queasiness and cold sweat for 4 hours. No crushing chest pain.',
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
    name: '3. Zero-History Migrant',
    data: {
      name: 'Ramu Paswan',
      age: 31,
      gender: 'Male',
      abhaId: '',
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

export default function PatientIntakeModal({
  isOpen,
  onClose,
  onPatientAdmitted,
  onLoadSamplePatients
}) {
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
          console.error('Live analysis error:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  const toggleVoiceDictation = async () => {
    if (!isRecording) {
      setIsRecording(true);
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
          console.error('NLP parse error:', err);
        }
      }, 1500);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.chiefComplaint.trim()) {
      alert('Please provide patient name and chief complaint.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age) || 35,
        gender: formData.gender,
        hasPriorHistory: formData.hasPriorHistory,
        abhaId: formData.abhaId.trim(),
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((s) => s.trim()) : [],
        chiefComplaint: formData.chiefComplaint.trim(),
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
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded bg-sky-600 flex items-center justify-center text-white">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Rapid Patient Intake</h2>
              <p className="text-[11px] text-slate-400">
                Age-Calibrated Baselines • Deterministic Safety Boundaries • Gemini Clinical CDS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets & Batch Sample Loader */}
        <div className="px-3.5 py-2 bg-slate-925 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Presets:
            </span>
            {DEMO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadPreset(p)}
                className="px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 text-[11px] whitespace-nowrap transition-all duration-150 active:scale-[0.98]"
              >
                {p.name}
              </button>
            ))}
          </div>

          {onLoadSamplePatients && (
            <button
              type="button"
              onClick={() => {
                onLoadSamplePatients();
                onClose();
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 text-[11px] font-medium transition-all duration-150 active:scale-[0.98]"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>+ Add 10 More Patients</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Intake Form (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-3.5">
            {/* Demographics Row */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-1">
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* ABDM Health ID & Zero-History Toggle */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex-1 mr-3">
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Ayushman Bharat Health ID (ABHA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91-4582-1102-8841 (Optional)"
                  value={formData.abhaId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      abhaId: e.target.value,
                      hasPriorHistory: e.target.value.trim().length > 0
                    })
                  }
                  className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col items-end text-xs">
                <span className="text-[10px] text-slate-400 mb-1">History Status</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      hasPriorHistory: !formData.hasPriorHistory,
                      abhaId: !formData.hasPriorHistory ? '91-4402-9911-3344' : ''
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                    formData.hasPriorHistory
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {formData.hasPriorHistory ? 'ABDM Linked' : 'Zero-History'}
                </button>
              </div>
            </div>

            {/* Chief Complaint & Ambient Voice Dictation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-medium text-slate-300">
                  Chief Complaint & Clinical Observation *
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10.5px] font-medium border transition-all ${
                    isRecording
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-slate-850 text-sky-400 border-slate-750 hover:bg-slate-800'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3 w-3 text-rose-400" />
                      <span>Transcribing Voice...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 text-sky-400" />
                      <span>Ambient Voice Dictation</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                required
                rows={2}
                placeholder="Describe presenting symptoms, onset time, and clinical appearance..."
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Symptoms & Medical History */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Associated Symptoms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diaphoresis, Nausea, Dyspnea"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  Medical History
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Pain Score & GCS */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex justify-between text-[10.5px] font-medium text-slate-300 mb-1">
                  <span>Pain Score (0 - 10)</span>
                  <span className="font-bold text-sky-400 font-mono">{formData.painScore}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painScore}
                  onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                  className="w-full accent-sky-500 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-300 mb-1">
                  GCS Coma Score (3 - 15)
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={formData.gcs}
                  onChange={(e) => setFormData({ ...formData, gcs: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Physiological Vitals Grid */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-semibold text-slate-300 uppercase tracking-wider flex items-center">
                  <Activity className="h-3 w-3 mr-1 text-sky-400" />
                  Calibrated Physiological Vitals
                </span>
                <span className="text-[9.5px] text-slate-400 font-mono">PALS / Geriatric Filter</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                <div>
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">HR (bpm)</label>
                  <input
                    type="number"
                    placeholder="80"
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
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">SBP (mmHg)</label>
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
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">DBP (mmHg)</label>
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
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">RR (bpm)</label>
                  <input
                    type="number"
                    placeholder="16"
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
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">SpO2 (%)</label>
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
                  <label className="block text-[9.5px] text-slate-400 mb-0.5">Temp (°C)</label>
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

            {/* Submit Action */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              >
                <FileCheck className="h-4 w-4" />
                <span>{isSubmitting ? 'Admitting...' : 'Admit & Queue Patient'}</span>
              </button>
            </div>
          </form>

          {/* Right Column: AI Co-Pilot Summary Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Clinical Decision Preview
                </span>
                {isAnalyzing ? (
                  <span className="text-[10px] text-slate-400 animate-pulse">Evaluating...</span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400">Ready</span>
                )}
              </div>

              {liveTriage ? (
                <div className="space-y-2.5">
                  {/* Score Card */}
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">
                        Assigned Priority
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        ESI Level {liveTriage.esiLevel}
                      </div>
                      <div className="text-[10.5px] text-slate-300">{liveTriage.severityLabel}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">
                        Confidence
                      </div>
                      <div className="text-sm font-bold text-emerald-400">
                        {liveTriage.confidenceScore}%
                      </div>
                      <div className="text-[9.5px] text-amber-400">
                        {liveTriage.uncertaintyPercentage}% Uncert.
                      </div>
                    </div>
                  </div>

                  {/* Safety Escalation Alert */}
                  {liveTriage.wasEscalated && (
                    <div className="p-2 rounded bg-amber-950/50 border border-amber-800/70 text-[11px] text-amber-200">
                      <div className="flex items-center space-x-1 font-semibold text-amber-300">
                        <Zap className="h-3 w-3" />
                        <span>Safety Escalation Active</span>
                      </div>
                      <p className="text-[10.5px] text-amber-300/90 mt-0.5 leading-relaxed">
                        {liveTriage.escalationReason}
                      </p>
                    </div>
                  )}

                  {/* Clinical Rationale */}
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Clinical Impression
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      {liveTriage.clinicalRationale}
                    </p>
                  </div>

                  {/* Probing Questions */}
                  {liveTriage.suggestedProbingQuestions?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-sky-300 uppercase tracking-wider mb-1 flex items-center">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Probing Questions for Nurse
                      </div>
                      <div className="space-y-1">
                        {liveTriage.suggestedProbingQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className="text-[10.5px] text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800 flex items-start space-x-1.5"
                          >
                            <span className="font-bold text-sky-400 font-mono">{idx + 1}.</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Enter symptoms or vitals to generate real-time clinical analysis.
                </div>
              )}
            </div>

            <div className="text-[9.5px] text-slate-500 border-t border-slate-800 pt-1.5 flex items-center justify-between font-mono">
              <span>Gemini CDS + Safety Floor</span>
              <span>ABDM Level-2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
