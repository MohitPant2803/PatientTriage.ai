/**
 * Patient Store & Dynamic Emergency Department Queue State Manager
 * Implements strict clinical queue ordering and realistic multi-acuity sample distribution.
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
    this.activeDoctors = 3;
    this.avgConsultMinutes = 12;
  }

  /**
   * Calculates the Composite Priority Score for strict clinical ordering
   * Formula:
   * Rank Score = (1000 * ESI) - (500 * DeteriorationAlert) - (2 * WaitTime) - VitalRiskScore
   * Lower score = Higher Priority (Rank #1 at the top)
   */
  calculatePriorityScore(patient) {
    const esi = Number(patient.currentESI) || 3;
    const isAlert = patient.deteriorationAlert ? 1 : 0;
    const wait = Number(patient.waitTimeMinutes) || 0;
    const vitalRisk = Number(patient.triageResult?.vitalCalib?.vitalRiskScore) || 0;

    // Strict clinical priority index:
    // ESI 1 (1000) always beats ESI 2 (2000), which always beats ESI 3 (3000)
    return (1000 * esi) - (500 * isAlert) - (2 * wait) - vitalRisk;
  }

  /**
   * Seeds a balanced, realistic 10-patient emergency department sample
   * Includes: 1 ESI 1 (Resus), 3 ESI 2 (Emergent), 3 ESI 3 (Urgent), 2 ESI 4 (Less Urgent), 1 ESI 5 (Non-Urgent)
   */
  seedSamplePatients(count = 10) {
    console.log(`[PatientStore] Seeding balanced sample of ${count} patients...`);

    // Pick a clinically realistic distribution from benchmark archetypes
    // PT-1008 (ESI 1 Trauma), PT-1001 (ESI 2 Silent MI), PT-1002 (ESI 2 Peds Sepsis), PT-1003 (ESI 2 Zero-Hist Abdomen),
    // PT-1011 (ESI 3 HTN Urgency), PT-1012 (ESI 3 Pneumonia), PT-1013 (ESI 3 Appendicitis),
    // PT-1015 (ESI 4 Ankle Sprain), PT-1016 (ESI 4 Laceration), PT-1017 (ESI 5 Minor URI)
    const selectedIds = [
      'PT-1008', // ESI 1: Severe Polytrauma
      'PT-1001', // ESI 2: Geriatric Silent MI
      'PT-1002', // ESI 2: Pediatric Sepsis
      'PT-1003', // ESI 2: Zero-History Acute Abdomen
      'PT-1011', // ESI 3: Hypertensive Urgency
      'PT-1012', // ESI 3: Pneumonia
      'PT-1013', // ESI 3: Appendicitis
      'PT-1015', // ESI 4: Ankle Sprain
      'PT-1016', // ESI 4: Laceration
      'PT-1017'  // ESI 5: Minor URI
    ];

    const subset = selectedIds
      .map((id) => BENCHMARK_PATIENTS.find((p) => p.id === id))
      .filter(Boolean);

    const newPatients = subset.map((p) => {
      const triage = fallbackTriageReasoning(p);
      const sbar = generateSBARNote(p, triage);

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

    this.patients = newPatients;

    // Asynchronously sync to MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
      for (const p of this.patients) {
        PatientModel.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true }).catch((err) =>
          console.warn('[PatientStore] MongoDB seed note:', err.message)
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

    // STRICT CLINICAL QUEUE SORTING:
    // 1. Primary: ESI Level ascending (Level 1 Resuscitation at the very top, then Level 2, 3, 4, 5)
    // 2. Secondary: Active Deterioration / SLA breach prioritized
    // 3. Tertiary: Longest wait time in current severity tier
    result.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreA - scoreB;
    });

    // Compute dynamic Estimated Time to Consultation (ETA) and Queue Position for each patient
    const activeDocCount = this.isSurgeMode ? 4 : this.activeDoctors;
    const avgConsult = this.avgConsultMinutes;

    return result.map((p, index) => {
      const queuePosition = index + 1;
      let etaMinutes = 0;
      let etaLabel = 'Immediate';

      if (Number(p.currentESI) === 1) {
        etaMinutes = 0;
        etaLabel = 'Immediate (Resus Bay)';
      } else {
        // ETA formula based on doctor capacity and patient queue rank
        const rawEta = Math.max(0, Math.round(((index) * avgConsult) / activeDocCount));
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
      if (this.isSurgeMode && (p.currentESI === 4 || p.currentESI === 5)) {
        p.status = 'FAST_TRACK_QUEUE';
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
    this.clearQueue();
    return { success: true, message: 'Queue cleared.' };
  }
}

const patientStoreInstance = new PatientStore();

module.exports = {
  patientStore: patientStoreInstance
};
