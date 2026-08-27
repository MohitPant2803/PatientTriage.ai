/**
 * Patient Store & Dynamic Emergency Department Queue State Manager
 * Handles in-memory real-time state with automatic sync to MongoDB Atlas when connected.
 */

const mongoose = require('mongoose');
const { BENCHMARK_PATIENTS } = require('../data/simulatedPatients');
const { fallbackTriageReasoning, generateSBARNote } = require('../services/geminiService');
const { logAuditEvent } = require('../services/auditService');
const PatientModel = require('./PatientModel');

class PatientStore {
  constructor() {
    this.patients = [];
    this.isSurgeMode = false;
    this.surgeMultiplier = 1;
    this.initializeStore();
  }

  initializeStore() {
    console.log('[PatientStore] Initializing benchmark patients...');
    this.patients = BENCHMARK_PATIENTS.map((p) => {
      // Pre-compute triage score
      const triage = fallbackTriageReasoning(p);
      const sbar = generateSBARNote(p, triage);

      // Log initial triage audit event
      logAuditEvent({
        eventType: 'AI_TRIAGE_RECOMMENDED',
        patientId: p.id,
        patientName: p.name,
        abhaId: p.abhaId,
        aiRecommendation: triage,
        nurseId: 'RN-4042 (P. Sharma)',
        nurseRole: 'Senior Triage Nurse',
        metadata: { archetype: p.archetype }
      });

      return {
        ...p,
        triageResult: triage,
        currentESI: triage.esiLevel,
        sbarNote: sbar,
        isOverridden: false,
        overrideDetails: null,
        deteriorationAlert: p.waitTimeMinutes > p.maxSafeWaitMinutes && p.maxSafeWaitMinutes > 0,
        deteriorationReason:
          p.waitTimeMinutes > p.maxSafeWaitMinutes && p.maxSafeWaitMinutes > 0
            ? `SLA Exceeded: Waited ${p.waitTimeMinutes}m (Safe threshold: ${p.maxSafeWaitMinutes}m for ESI ${triage.esiLevel})`
            : null,
        historyLog: [
          {
            timestamp: new Date(Date.now() - p.waitTimeMinutes * 60000).toISOString(),
            action: 'INITIAL_TRIAGE',
            note: `Initial triage completed as ESI ${triage.esiLevel} (${triage.severityLabel})`
          }
        ]
      };
    });

    // Add 1 pre-configured clinician override for demonstration
    this.applyClinicianOverride('PT-1003', {
      newESI: 2,
      category: 'HIGH_UNCERTAINTY_SURGICAL_RISK',
      reason: 'Nurse intuition: Inability to stand upright + severe right iliac tenderness indicates probable acute surgical abdomen. Zero prior history on file.',
      nurseId: 'RN-4042 (P. Sharma)',
      nurseRole: 'Senior Triage Nurse'
    });

    // Asynchronously sync seed patients to MongoDB Atlas if connected
    this.syncSeedToMongoDB();

    console.log(`[PatientStore] Loaded ${this.patients.length} patients with active triage scoring.`);
  }

  async syncSeedToMongoDB() {
    try {
      if (mongoose.connection.readyState === 1) {
        for (const p of this.patients) {
          await PatientModel.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
        }
        console.log('[PatientStore] Benchmark patient records synced to MongoDB Atlas.');
      }
    } catch (err) {
      console.warn('[PatientStore] MongoDB sync note:', err.message);
    }
  }

  getAllPatients(filter = {}) {
    let result = [...this.patients];

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

    // Dynamic queue sorting:
    // 1. ESI Level (Level 1 first, then 2, 3, 4, 5)
    // 2. Deterioration alert active
    // 3. Wait time descending
    result.sort((a, b) => {
      if (a.currentESI !== b.currentESI) {
        return a.currentESI - b.currentESI;
      }
      if (a.deteriorationAlert !== b.deteriorationAlert) {
        return b.deteriorationAlert ? 1 : -1;
      }
      return b.waitTimeMinutes - a.waitTimeMinutes;
    });

    return result;
  }

  getPatientById(id) {
    return this.patients.find((p) => p.id === id);
  }

  addPatient(newPatientData, triageResult, sbarNote) {
    const newId = `PT-${1000 + this.patients.length + 1}`;
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

    this.patients.unshift(newPatient);

    // Sync to MongoDB Atlas
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

    return newPatient;
  }

  applyClinicianOverride(patientId, overrideData) {
    const patient = this.getPatientById(patientId);
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

    // Update max safe wait time for new ESI
    patient.maxSafeWaitMinutes =
      patient.currentESI === 1 ? 0 : patient.currentESI === 2 ? 10 : patient.currentESI === 3 ? 30 : 60;

    patient.historyLog.push({
      timestamp: new Date().toISOString(),
      action: 'CLINICIAN_OVERRIDE',
      note: `Clinician manually overridden priority from ESI ${previousESI} to ESI ${overrideData.newESI}. Reason: ${overrideData.reason}`
    });

    // Sync to MongoDB Atlas
    if (mongoose.connection.readyState === 1) {
      PatientModel.findOneAndUpdate({ id: patient.id }, patient).catch((err) =>
        console.warn('[PatientStore] MongoDB override update notice:', err.message)
      );
    }

    // Log to ABDM / DISHA audit trail
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

    return patient;
  }

  updatePatientVitals(patientId, updatedVitals) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;

    patient.vitals = { ...patient.vitals, ...updatedVitals };

    // Re-evaluate triage with new vitals
    const newTriage = fallbackTriageReasoning(patient);
    const oldESI = patient.currentESI;
    patient.triageResult = newTriage;
    patient.currentESI = newTriage.esiLevel;

    const worsened = newTriage.esiLevel < oldESI;
    if (worsened) {
      patient.deteriorationAlert = true;
      patient.deteriorationReason = `Vitals Deterioration Detected: Re-triaged from ESI ${oldESI} to ESI ${newTriage.esiLevel} (${newTriage.vitalCalib.anomalies.map((a) => a.parameter).join(', ')})`;
    }

    patient.historyLog.push({
      timestamp: new Date().toISOString(),
      action: 'VITALS_RECHECK',
      note: `Updated vitals recorded. Triage re-evaluated: ESI ${newTriage.esiLevel}. ${worsened ? 'ALERT: Condition worsened!' : 'Condition stable.'}`
    });

    // Sync to MongoDB Atlas
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

    return patient;
  }

  simulateQueueTimeAdvance(minutes = 15) {
    this.patients.forEach((p) => {
      if (p.status === 'WAITING_FOR_DOCTOR') {
        p.waitTimeMinutes += Number(minutes);

        // Check if exceeded SLA
        if (p.maxSafeWaitMinutes > 0 && p.waitTimeMinutes > p.maxSafeWaitMinutes) {
          p.deteriorationAlert = true;
          p.deteriorationReason = `SLA Exceeded: Patient has waited ${p.waitTimeMinutes}m (Max safe wait: ${p.maxSafeWaitMinutes}m for ESI ${p.currentESI}). Immediate nurse re-assessment required.`;
        }
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

    // In surge mode, adjust routing: fast-track ESI 4/5, highlight ESI 1/2
    this.patients.forEach((p) => {
      if (this.isSurgeMode && (p.currentESI === 4 || p.currentESI === 5)) {
        p.status = 'FAST_TRACK_QUEUE';
      }
    });

    return {
      isSurgeMode: this.isSurgeMode,
      surgeMultiplier: this.surgeMultiplier,
      surgeStatusMessage: this.isSurgeMode
        ? 'SURGE PROTOCOL ACTIVE (3x Volume Load) — Fast-tracking Level 4 & 5 to ambulatory zone; reserving Resuscitation Bays for Level 1 & 2'
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

    const avgWaitTime = Math.round(
      this.patients.reduce((acc, p) => acc + (p.waitTimeMinutes || 0), 0) / (totalPatients || 1)
    );

    return {
      totalPatients,
      waiting,
      inExam,
      fastTrack,
      alertCount,
      overriddenCount,
      esiBreakdown,
      avgWaitTime,
      bedOccupancyRate: this.isSurgeMode ? 94 : 76,
      nurseToPatientRatio: this.isSurgeMode ? '1:18' : '1:8',
      isSurgeMode: this.isSurgeMode,
      surgeMultiplier: this.surgeMultiplier,
      abdmConnected: true,
      lastSyncTimestamp: new Date().toISOString()
    };
  }

  resetStore() {
    this.initializeStore();
    return { success: true, message: 'Store re-initialized to 20 benchmark patients' };
  }
}

const patientStoreInstance = new PatientStore();

module.exports = {
  patientStore: patientStoreInstance
};
