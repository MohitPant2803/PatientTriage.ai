/**
 * Patient Management Routes
 * Handles CRUD operations, dynamic queue filtering, clinician overrides,
 * continuous deterioration simulation, and surge management.
 *
 * IMPORTANT: Static routes (seed-sample, clear, simulation/*) MUST be
 * registered BEFORE the parameterized /:id route, otherwise Express
 * will match "seed-sample" as an :id parameter.
 */

const express = require('express');
const router = express.Router();
const { patientStore } = require('../models/patientStore');
const { analyzePatientTriage, generateSBARNote } = require('../services/geminiService');

/**
 * GET /api/patients
 * Retrieve all patients in the dynamic queue with optional filters (strictly sorted by severity)
 */
router.get('/', (req, res) => {
  try {
    const patients = patientStore.getAllPatients(req.query);
    return res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch patients', details: err.message });
  }
});

/**
 * POST /api/patients/seed-sample
 * Additively adds 10 more random simulated patients to the active queue
 * MUST be registered before /:id to prevent Express treating "seed-sample" as an id
 */
router.post('/seed-sample', (req, res) => {
  try {
    const { count = 10 } = req.body;
    const updatedQueue = patientStore.addRandomBatch(Number(count));
    return res.json({
      success: true,
      message: `Added ${count} more patients to queue. Total active cases: ${updatedQueue.length}.`,
      count: updatedQueue.length,
      patients: updatedQueue
    });
  } catch (err) {
    console.error('Error in seed-sample:', err);
    return res.status(500).json({ error: 'Failed to add random batch patients', details: err.message });
  }
});

/**
 * POST /api/patients/clear
 * Clears all patients from the active triage queue
 */
router.post('/clear', (req, res) => {
  try {
    const result = patientStore.clearQueue();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear queue', details: err.message });
  }
});

/**
 * POST /api/patients/simulation/advance-time
 * Simulates wait time passing (e.g. +15 or +30 mins) to demonstrate deterioration alerts
 */
router.post('/simulation/advance-time', (req, res) => {
  try {
    const { minutes = 15 } = req.body;
    const updatedPatients = patientStore.simulateQueueTimeAdvance(Number(minutes));
    return res.json({
      success: true,
      message: `Queue wait time advanced by ${minutes} minutes. Deterioration alerts refreshed.`,
      patients: updatedPatients
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to advance simulation time', details: err.message });
  }
});

/**
 * POST /api/patients/simulation/toggle-surge
 * Toggles Surge Mode (1x Normal vs 3x Surge)
 */
router.post('/simulation/toggle-surge', (req, res) => {
  try {
    const { enable } = req.body;
    const result = patientStore.toggleSurgeMode(enable !== undefined ? enable : null);
    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle surge mode', details: err.message });
  }
});

/**
 * POST /api/patients/simulation/reset
 * Clears and resets the queue
 */
router.post('/simulation/reset', (req, res) => {
  try {
    const result = patientStore.resetStore();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset store', details: err.message });
  }
});

/**
 * POST /api/patients
 * Create and triage a new patient arrival manually
 */
router.post('/', async (req, res) => {
  try {
    const patientData = req.body;
    const triageResult = await analyzePatientTriage(patientData);
    const sbarNote = generateSBARNote(patientData, triageResult);

    const createdPatient = patientStore.addPatient(patientData, triageResult, sbarNote);

    return res.status(201).json({
      success: true,
      patient: createdPatient
    });
  } catch (err) {
    console.error('Error creating patient:', err);
    return res.status(500).json({ error: 'Failed to create and triage patient', details: err.message });
  }
});

/**
 * GET /api/patients/:id
 * Retrieve a single patient by ID
 * MUST be registered AFTER all static routes above
 */
router.get('/:id', (req, res) => {
  try {
    const patient = patientStore.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    return res.json({ success: true, patient });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch patient', details: err.message });
  }
});

/**
 * POST /api/patients/:id/override
 * Clinician 1-Click Override with structured justification
 */
router.post('/:id/override', (req, res) => {
  try {
    const { id } = req.params;
    const { newESI, reason, category, nurseId, nurseRole } = req.body;

    if (!newESI || !reason) {
      return res.status(400).json({ error: 'Missing mandatory override fields: newESI and reason are required' });
    }

    const updatedPatient = patientStore.applyClinicianOverride(id, {
      newESI: Number(newESI),
      reason,
      category,
      nurseId,
      nurseRole
    });

    if (!updatedPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json({
      success: true,
      message: `Triage priority successfully updated to ESI ${newESI} and logged to ABDM/DISHA audit trail`,
      patient: updatedPatient
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to apply clinician override', details: err.message });
  }
});

/**
 * POST /api/patients/:id/vitals
 * Update patient vitals & trigger re-assessment check
 */
router.post('/:id/vitals', (req, res) => {
  try {
    const { id } = req.params;
    const { vitals } = req.body;

    if (!vitals) {
      return res.status(400).json({ error: 'Missing updated vitals payload' });
    }

    const updatedPatient = patientStore.updatePatientVitals(id, vitals);
    if (!updatedPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json({
      success: true,
      message: 'Vitals updated and re-triage calculated',
      patient: updatedPatient
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update vitals', details: err.message });
  }
});

module.exports = router;
