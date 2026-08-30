/**
 * Patient Store & Dynamic Emergency Department Queue State Manager
 * Implements computed 0-100 Numerical Severity Scoring based on actual clinical signals,
 * Strict Severity-Descending Sorting, Additive Batch Inflow, and ETA Calculations.
 */

const mongoose = require('mongoose');
const { BENCHMARK_PATIENTS } = require('../data/simulatedPatients');
const { fallbackTriageReasoning, generateSBARNote } = require('../services/geminiService');
const { calibrateVitals } = require('../services/vitalCalibrator');
const { logAuditEvent } = require('../services/auditService');
const PatientModel = require('./PatientModel');

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Saanvi', 'Aanya', 'Aadhya', 'Aarohi', 'Ananya', 'Pari', 'Diya', 'Riya', 'Anushka', 'Navya',
  'Ramesh', 'Suresh', 'Kamla', 'Sushila', 'Balram', 'Harish', 'Manju', 'Laxmi', 'Vikram', 'Meera',
  'Deepak', 'Sunita', 'Santosh', 'Tanmay', 'Ritu', 'Farzana', 'Gaurav', 'Tarun', 'Shalini', 'Nandlal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Mishra', 'Yadav', 'Reddy', 'Nair',
  'Mukherjee', 'Bhattacharya', 'Chauhan', 'Joshi', 'Kulkarni', 'Deshmukh', 'Mehra', 'Sengupta',
  'Saxena', 'Narang', 'Iyer', 'Khatri', 'Singhania', 'Rawat', 'Sethi', 'Hegde', 'Banerjee', 'Goswami'
];

class PatientStore {
  constructor() {
    this.patients = [];
    this.patientCounter = 1000;
    this.isSurgeMode = false;
    this.surgeMultiplier = 1;
    this.activeDoctors = 3;
    this.avgConsultMinutes = 12;
  }

  initBenchmarkCohort(count = 20) {
    this.patients = [];
    this.patientCounter = 1000;
    const initialCases = BENCHMARK_PATIENTS.slice(0, count);

    for (const template of initialCases) {
      this.patientCounter += 1;
      const rawPatient = {
        ...template,
        id: template.id || `PT-${this.patientCounter}`,
        waitTimeMinutes: template.waitTimeMinutes || Math.floor(Math.random() * 15)
      };

      const triage = fallbackTriageReasoning(rawPatient);
      const sbar = generateSBARNote(rawPatient, triage);

      const processedPatient = {
        ...rawPatient,
        triageResult: triage,
        currentESI: triage.esiLevel,
        sbarNote: sbar,
        isOverridden: false,
        overrideDetails: null,
        maxSafeWaitMinutes:
          triage.esiLevel === 1 ? 0 : triage.esiLevel === 2 ? 10 : triage.esiLevel === 3 ? 30 : 60,
        deteriorationAlert:
          rawPatient.waitTimeMinutes > (triage.esiLevel === 1 ? 0 : triage.esiLevel === 2 ? 10 : 30) &&
          triage.esiLevel <= 2,
        deteriorationReason: null,
        historyLog: [
          {
            timestamp: new Date(Date.now() - (rawPatient.waitTimeMinutes || 0) * 60000).toISOString(),
            action: 'INITIAL_TRIAGE',
            note: `Patient admitted to triage queue as ESI ${triage.esiLevel}`
          }
        ]
      };

      if (processedPatient.deteriorationAlert) {
        processedPatient.deteriorationReason = `SLA Exceeded: Waited ${processedPatient.waitTimeMinutes}m for ESI ${triage.esiLevel}`;
      }

      processedPatient.severityScore = this.calculateSeverityScore(processedPatient);
      this.patients.push(processedPatient);
    }
  }

  /**
   * Computes a 0-100 Clinical Severity Score from actual patient data.
   *
   * The score has TWO layers:
   *
   * LAYER 1 — ESI Acuity Floor (0-100 baseline)
   *   The ESI level determined by the clinical reasoning pipeline (safety rule engine +
   *   LLM/fallback + uncertainty escalation) IS the holistic clinical judgment. It already
   *   incorporates symptom keywords, vital derangements, age-cohort risks, and deterministic
   *   safety triggers. A patient forced to ESI 1 by the safety engine (e.g. "cardiac arrest",
   *   "tension pneumothorax", GCS <= 8) MUST have a high baseline score — this is the clinical
   *   reality, not a hack. The floor ensures that no ESI 1 patient can ever score below 85,
   *   no ESI 2 below 60, etc.
   *
   * LAYER 2 — Computed Clinical Modifiers (spread within the ESI band)
   *   Within each ESI band, patients are differentiated by:
   *   - Vital sign derangement (from age-calibrated calibrator, 0-10 scale)
   *   - GCS depression
   *   - Pain intensity
   *   - Number of safety rule triggers
   *   - Clinical uncertainty (missing data, zero-history)
   *   - Deterioration alert status
   *   - Wait time decay
   *
   * This produces scores like:
   *   ESI 1 cardiac arrest, GCS 3:           98/100
   *   ESI 1 tension pneumothorax, GCS 15:    88/100
   *   ESI 2 atypical MI, high vital risk:    78/100
   *   ESI 2 stable emergent:                 64/100
   *   ESI 3 acute abdomen, pain 9:           52/100
   *   ESI 3 stable urgent:                   38/100
   *   ESI 4 ankle sprain:                    18/100
   *   ESI 5 prescription refill:              6/100
   */
  calculateSeverityScore(patient) {
    const age = Number(patient.age) || 35;
    const vitals = patient.vitals || {};
    const gcs = Number(patient.gcs) || 15;
    const painScore = Number(patient.painScore) || 0;
    const esi = Number(patient.currentESI) || 3;

    // --- LAYER 1: ESI Acuity Floor & Ceiling ---
    // Each ESI level defines a score band. The floor is the minimum possible score
    // for that acuity level. The bandwidth determines how much the modifiers can add.
    let floor, bandwidth;
    switch (esi) {
      case 1: floor = 85; bandwidth = 15; break;   // Score range: 85-100
      case 2: floor = 60; bandwidth = 25; break;   // Score range: 60-85
      case 3: floor = 30; bandwidth = 30; break;   // Score range: 30-60
      case 4: floor = 12; bandwidth = 18; break;   // Score range: 12-30
      case 5: floor = 2;  bandwidth = 10; break;   // Score range: 2-12
      default: floor = 30; bandwidth = 30;
    }

    // --- LAYER 2: Computed Clinical Modifiers (normalized to 0.0 - 1.0) ---
    const vitalCalib = patient.triageResult?.vitalCalib || calibrateVitals(vitals, age);
    const vitalRiskRaw = Number(vitalCalib.vitalRiskScore) || 0;   // 0-10
    const isLifeThreatening = vitalCalib.isLifeThreatening || false;
    const isHighRisk = vitalCalib.isHighRisk || false;

    // GCS modifier (0.0 - 1.0): GCS 15 = 0, GCS 3 = 1.0
    const gcsNorm = Math.min(1.0, Math.max(0, (15 - gcs) / 12));

    // Vital derangement modifier (0.0 - 1.0)
    let vitalNorm = Math.min(1.0, vitalRiskRaw / 10);
    if (isLifeThreatening) vitalNorm = Math.max(vitalNorm, 0.9);
    else if (isHighRisk) vitalNorm = Math.max(vitalNorm, 0.5);

    // Pain modifier (0.0 - 1.0)
    const painNorm = Math.min(1.0, painScore / 10);

    // Safety trigger count modifier (0.0 - 1.0)
    const triggerCount = (patient.triageResult?.deterministicTriggers || []).length;
    const triggerNorm = Math.min(1.0, triggerCount / 3);

    // Uncertainty modifier (0.0 - 1.0)
    const uncertaintyPct = Number(patient.triageResult?.uncertaintyPercentage) || 0;
    const uncertaintyNorm = Math.min(1.0, uncertaintyPct / 100);

    // Deterioration flag (0 or 1)
    const deteriorationNorm = patient.deteriorationAlert ? 1.0 : 0;

    // Wait time modifier (0.0 - 1.0, caps at 60 mins)
    const waitMins = Number(patient.waitTimeMinutes) || 0;
    const waitNorm = Math.min(1.0, waitMins / 60);

    // Weighted composite modifier (0.0 - 1.0)
    // Weights reflect clinical importance for within-band differentiation
    const composite = (
      gcsNorm * 0.25 +          // 25% weight: consciousness level
      vitalNorm * 0.30 +        // 30% weight: physiological derangement
      painNorm * 0.10 +         // 10% weight: pain severity
      triggerNorm * 0.15 +      // 15% weight: safety rule triggers
      uncertaintyNorm * 0.05 +  //  5% weight: clinical uncertainty
      deteriorationNorm * 0.10 + // 10% weight: SLA breach / deterioration
      waitNorm * 0.05           //  5% weight: wait time urgency
    );

    // Final score = floor + (composite * bandwidth)
    const rawScore = floor + Math.round(composite * bandwidth);
    return Math.min(100, Math.max(1, rawScore));
  }

  /**
   * Adds 10 random simulated patients additively from the 50 clinical benchmark dataset
   */
  addRandomBatch(count = 10) {
    console.log(`[PatientStore] Adding ${count} random patients to active queue (Current count: ${this.patients.length})...`);

    // Pick from all 50 benchmark cases randomly
    const shuffled = [...BENCHMARK_PATIENTS].sort(() => 0.5 - Math.random());
    const newArrivals = [];

    for (let i = 0; i < count; i++) {
      this.patientCounter += 1;
      const template = shuffled[i % shuffled.length];

      const randomFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randomLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const patientName = `${randomFirst} ${randomLast}`;

      const jitter = (val, delta = 2) => Math.max(1, Math.round(val + (Math.random() * delta * 2 - delta)));

      const jitteredVitals = {
        hr: jitter(template.vitals.hr, 3),
        sbp: jitter(template.vitals.sbp, 4),
        dbp: jitter(template.vitals.dbp, 3),
        rr: jitter(template.vitals.rr, 2),
        spo2: Math.min(100, Math.max(70, jitter(template.vitals.spo2, 1))),
        temp: Number((template.vitals.temp + (Math.random() * 0.4 - 0.2)).toFixed(1))
      };

      const rawPatient = {
        ...template,
        id: `PT-${this.patientCounter}`,
        name: patientName,
        vitals: jitteredVitals,
        waitTimeMinutes: Math.floor(Math.random() * 15)
      };

      const triage = fallbackTriageReasoning(rawPatient);
      const sbar = generateSBARNote(rawPatient, triage);

      logAuditEvent({
        eventType: 'AI_TRIAGE_RECOMMENDED',
        patientId: rawPatient.id,
        patientName: rawPatient.name,
        abhaId: rawPatient.abhaId,
        aiRecommendation: triage,
        nurseId: 'RN-4042 (P. Sharma)',
        nurseRole: 'Senior Triage Nurse',
        metadata: { archetype: template.archetype }
      });

      const processedPatient = {
        ...rawPatient,
        triageResult: triage,
        currentESI: triage.esiLevel,
        sbarNote: sbar,
        isOverridden: false,
        overrideDetails: null,
        maxSafeWaitMinutes:
          triage.esiLevel === 1 ? 0 : triage.esiLevel === 2 ? 10 : triage.esiLevel === 3 ? 30 : 60,
        deteriorationAlert:
          rawPatient.waitTimeMinutes > (triage.esiLevel === 1 ? 0 : triage.esiLevel === 2 ? 10 : 30) &&
          triage.esiLevel <= 2,
        deteriorationReason: null,
        historyLog: [
          {
            timestamp: new Date(Date.now() - rawPatient.waitTimeMinutes * 60000).toISOString(),
            action: 'INITIAL_TRIAGE',
            note: `Patient admitted to triage queue as ESI ${triage.esiLevel}`
          }
        ]
      };

      if (processedPatient.deteriorationAlert) {
        processedPatient.deteriorationReason = `SLA Exceeded: Waited ${processedPatient.waitTimeMinutes}m for ESI ${triage.esiLevel}`;
      }

      processedPatient.severityScore = this.calculateSeverityScore(processedPatient);
      newArrivals.push(processedPatient);
    }

    // Add to existing list
    this.patients = [...this.patients, ...newArrivals];

    if (mongoose.connection.readyState === 1) {
      for (const p of newArrivals) {
        PatientModel.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true }).catch((err) =>
          console.warn('[PatientStore] MongoDB batch create notice:', err.message)
        );
      }
    }

    return this.getAllPatients();
  }

  clearQueue() {
    this.patients = [];
    return { success: true, count: 0, message: 'Triage queue cleared.' };
  }

  getAllPatients(filter = {}) {
    let result = this.patients.map((p) => ({
      ...p,
      severityScore: this.calculateSeverityScore(p)
    }));

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.chiefComplaint || '').toLowerCase().includes(q) ||
          (p.abhaId || '').toLowerCase().includes(q)
      );
    }

    if (filter.cohort) {
      if (filter.cohort === 'pediatric') {
        result = result.filter((p) => Number(p.age) <= 12);
      } else if (filter.cohort === 'geriatric') {
        result = result.filter((p) => Number(p.age) >= 65);
      } else if (filter.cohort === 'adult') {
        result = result.filter((p) => Number(p.age) > 12 && Number(p.age) < 65);
      }
    }

    if (filter.esiLevel) {
      result = result.filter((p) => Number(p.currentESI) === Number(filter.esiLevel));
    }

    if (filter.overriddenOnly === 'true' || filter.overriddenOnly === true) {
      result = result.filter((p) => p.isOverridden);
    }

    if (filter.highUncertaintyOnly === 'true' || filter.highUncertaintyOnly === true) {
      result = result.filter(
        (p) => p.triageResult && p.triageResult.uncertaintyPercentage >= 35
      );
    }

    if (filter.zeroHistoryOnly === 'true' || filter.zeroHistoryOnly === true) {
      result = result.filter((p) => !p.hasPriorHistory);
    }

    // STRICT SEVERITY SCORE DESCENDING ORDER:
    // Highest severity score (e.g. 98, 85, 72, 45, 15) comes FIRST
    result.sort((a, b) => {
      if (b.severityScore !== a.severityScore) {
        return b.severityScore - a.severityScore;
      }
      return (b.waitTimeMinutes || 0) - (a.waitTimeMinutes || 0);
    });

    const activeDocCount = this.isSurgeMode ? 4 : this.activeDoctors;
    const avgConsult = this.avgConsultMinutes;

    return result.map((p, index) => {
      const queuePosition = index + 1;
      let etaMinutes = 0;
      let etaLabel = 'Immediate';

      if (Number(p.currentESI) === 1 || p.severityScore >= 90) {
        etaMinutes = 0;
        etaLabel = 'Immediate (Resus Bay)';
      } else {
        const rawEta = Math.max(0, Math.round((index * avgConsult) / activeDocCount));
        etaMinutes = rawEta;
        etaLabel = `~${rawEta} mins`;
      }

      return {
        ...p,
        queuePosition,
        estimatedConsultationMinutes: etaMinutes,
        estimatedConsultationLabel: etaLabel
      };
    });
  }

  getPatientById(id) {
    const all = this.getAllPatients();
    return all.find((p) => p.id === id);
  }

  addPatient(newPatientData, triageResult, sbarNote) {
    this.patientCounter += 1;
    const newId = `PT-${this.patientCounter}`;
    const newPatient = {
      ...newPatientData,
      id: newId,
      hasPriorHistory: Boolean(newPatientData.abhaId),
      triageResult,
      currentESI: triageResult.esiLevel,
      sbarNote,
      isOverridden: false,
      overrideDetails: null,
      waitTimeMinutes: 0,
      maxSafeWaitMinutes:
        triageResult.esiLevel === 1 ? 0 : triageResult.esiLevel === 2 ? 10 : triageResult.esiLevel === 3 ? 30 : 60,
      deteriorationAlert: false,
      deteriorationReason: null,
      status: triageResult.esiLevel === 1 ? 'IN_EXAM_BAY' : 'WAITING_FOR_DOCTOR',
      assignedBay: triageResult.esiLevel === 1 ? 'Resus Bay 1' : null,
      historyLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'INTAKE_TRIAGE',
          note: `Patient admitted to triage queue as ESI ${triageResult.esiLevel}`
        }
      ]
    };

    newPatient.severityScore = this.calculateSeverityScore(newPatient);
    this.patients.push(newPatient);

    if (mongoose.connection.readyState === 1) {
      PatientModel.create(newPatient).catch((err) =>
        console.warn('[PatientStore] MongoDB patient create notice:', err.message)
      );
    }

    logAuditEvent({
      eventType: 'AI_TRIAGE_RECOMMENDED',
      patientId: newId,
      patientName: newPatient.name,
      abhaId: newPatient.abhaId,
      aiRecommendation: triageResult,
      nurseId: 'RN-4042 (P. Sharma)',
      nurseRole: 'Senior Triage Nurse'
    });

    return this.getPatientById(newId);
  }

  applyClinicianOverride(patientId, overrideData) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient) return null;

    const previousESI = patient.currentESI;
    patient.currentESI = Number(overrideData.newESI);
    patient.isOverridden = true;
    patient.overrideDetails = {
      originalESI: previousESI,
      newESI: Number(overrideData.newESI),
      category: overrideData.category || 'CLINICAL_JUDGMENT',
      reason: overrideData.reason,
      nurseId: overrideData.nurseId || 'RN-4042 (P. Sharma)',
      nurseRole: overrideData.nurseRole || 'Senior Triage Nurse',
      overriddenAt: new Date().toISOString()
    };

    patient.maxSafeWaitMinutes =
      patient.currentESI === 1 ? 0 : patient.currentESI === 2 ? 10 : patient.currentESI === 3 ? 30 : 60;

    patient.severityScore = this.calculateSeverityScore(patient);

    patient.historyLog.push({
      timestamp: new Date().toISOString(),
      action: 'CLINICIAN_OVERRIDE',
      note: `Clinician manually overridden priority from ESI ${previousESI} to ESI ${overrideData.newESI}. Reason: ${overrideData.reason}`
    });

    if (mongoose.connection.readyState === 1) {
      PatientModel.findOneAndUpdate({ id: patient.id }, patient).catch((err) =>
        console.warn('[PatientStore] MongoDB override update notice:', err.message)
      );
    }

    logAuditEvent({
      eventType: 'CLINICIAN_OVERRIDE',
      patientId: patient.id,
      patientName: patient.name,
      abhaId: patient.abhaId,
      aiRecommendation: patient.triageResult,
      clinicianOverride: overrideData,
      nurseId: overrideData.nurseId || 'RN-4042 (P. Sharma)',
      clinicalJustification: overrideData.reason
    });

    return this.getPatientById(patientId);
  }

  updatePatientVitals(patientId, updatedVitals) {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient) return null;

    patient.vitals = { ...patient.vitals, ...updatedVitals };

    const newTriage = fallbackTriageReasoning(patient);
    const oldESI = patient.currentESI;
    patient.triageResult = newTriage;
    patient.currentESI = newTriage.esiLevel;

    const worsened = newTriage.esiLevel < oldESI;
    if (worsened) {
      patient.deteriorationAlert = true;
      patient.deteriorationReason = `Vitals Deterioration Detected: Re-triaged from ESI ${oldESI} to ESI ${newTriage.esiLevel} (${newTriage.vitalCalib.anomalies.map((a) => a.parameter).join(', ')})`;
    }

    patient.severityScore = this.calculateSeverityScore(patient);

    patient.historyLog.push({
      timestamp: new Date().toISOString(),
      action: 'VITALS_RECHECK',
      note: `Updated vitals recorded. Triage re-evaluated: ESI ${newTriage.esiLevel}. ${worsened ? 'ALERT: Condition worsened!' : 'Condition stable.'}`
    });

    if (mongoose.connection.readyState === 1) {
      PatientModel.findOneAndUpdate({ id: patient.id }, patient).catch((err) =>
        console.warn('[PatientStore] MongoDB vitals update notice:', err.message)
      );
    }

    logAuditEvent({
      eventType: 'VITAL_REASSESSMENT_ALERT',
      patientId: patient.id,
      patientName: patient.name,
      abhaId: patient.abhaId,
      aiRecommendation: newTriage,
      nurseId: 'RN-4042 (P. Sharma)',
      metadata: { previousESI: oldESI, newESI: newTriage.esiLevel, worsened }
    });

    return this.getPatientById(patientId);
  }

  simulateQueueTimeAdvance(minutes = 15) {
    this.patients.forEach((p) => {
      if (p.status === 'WAITING_FOR_DOCTOR') {
        p.waitTimeMinutes += Number(minutes);

        if (p.maxSafeWaitMinutes > 0 && p.waitTimeMinutes > p.maxSafeWaitMinutes) {
          p.deteriorationAlert = true;
          p.deteriorationReason = `SLA Exceeded: Patient has waited ${p.waitTimeMinutes}m (Max safe wait: ${p.maxSafeWaitMinutes}m for ESI ${p.currentESI}). Immediate nurse re-assessment required.`;
        }
        p.severityScore = this.calculateSeverityScore(p);
      }
    });

    return this.getAllPatients();
  }

  toggleSurgeMode(enable = null) {
    if (enable !== null) {
      this.isSurgeMode = Boolean(enable);
    } else {
      this.isSurgeMode = !this.isSurgeMode;
    }
    this.surgeMultiplier = this.isSurgeMode ? 3 : 1;

    this.patients.forEach((p) => {
      if (this.isSurgeMode) {
        if (p.currentESI === 4 || p.currentESI === 5) {
          p.status = 'FAST_TRACK_QUEUE';
        }
      } else {
        if (p.status === 'FAST_TRACK_QUEUE') {
          p.status = 'WAITING_FOR_DOCTOR';
        }
      }
    });

    return {
      isSurgeMode: this.isSurgeMode,
      surgeMultiplier: this.surgeMultiplier,
      surgeStatusMessage: this.isSurgeMode
        ? 'SURGE PROTOCOL ACTIVE (3x Volume Load) - Fast-tracking Level 4 & 5 to ambulatory zone; reserving Resuscitation Bays for Level 1 & 2'
        : 'NORMAL OPERATING CONDITIONS (1x Baseline Volume)'
    };
  }

  getCommandCenterStats() {
    const totalPatients = this.patients.length;
    const waiting = this.patients.filter((p) => p.status === 'WAITING_FOR_DOCTOR').length;
    const inExam = this.patients.filter((p) => p.status === 'IN_EXAM_BAY').length;
    const fastTrack = this.patients.filter((p) => p.status === 'FAST_TRACK_QUEUE').length;
    const alertCount = this.patients.filter((p) => p.deteriorationAlert).length;
    const overriddenCount = this.patients.filter((p) => p.isOverridden).length;

    const esiBreakdown = {
      level1: this.patients.filter((p) => p.currentESI === 1).length,
      level2: this.patients.filter((p) => p.currentESI === 2).length,
      level3: this.patients.filter((p) => p.currentESI === 3).length,
      level4: this.patients.filter((p) => p.currentESI === 4).length,
      level5: this.patients.filter((p) => p.currentESI === 5).length
    };

    const avgWaitTime =
      totalPatients > 0
        ? Math.round(
            this.patients.reduce((acc, p) => acc + (p.waitTimeMinutes || 0), 0) / totalPatients
          )
        : 0;

    return {
      totalPatients,
      waiting,
      inExam,
      fastTrack,
      alertCount,
      overriddenCount,
      esiBreakdown,
      avgWaitTime,
      bedOccupancyRate: totalPatients > 0 ? (this.isSurgeMode ? 94 : 76) : 20,
      nurseToPatientRatio: totalPatients > 0 ? (this.isSurgeMode ? '1:18' : '1:8') : '1:0',
      isSurgeMode: this.isSurgeMode,
      surgeMultiplier: this.surgeMultiplier,
      abdmConnected: true,
      lastSyncTimestamp: new Date().toISOString()
    };
  }

  resetStore() {
    this.initBenchmarkCohort(20);
    return { success: true, count: this.patients.length, message: 'Queue reset to initial 20 benchmark clinical patients.' };
  }
}

const patientStoreInstance = new PatientStore();

module.exports = {
  patientStore: patientStoreInstance
};
