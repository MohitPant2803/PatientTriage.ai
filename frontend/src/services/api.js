/**
 * API Service Client for PatientTriage.ai
 */

import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
let API_BASE = '/api';

if (rawApiUrl && typeof rawApiUrl === 'string' && rawApiUrl.trim()) {
  const cleaned = rawApiUrl.trim().replace(/\/+$/, '');
  API_BASE = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Patients & Queue
  getPatients: async (params = {}) => {
    const res = await client.get('/patients', { params });
    return res.data;
  },

  getPatientById: async (id) => {
    const res = await client.get(`/patients/${id}`);
    return res.data;
  },

  createPatient: async (patientData) => {
    const res = await client.post('/patients', patientData);
    return res.data;
  },

  seedSamplePatients: async (count = 10) => {
    const res = await client.post('/patients/seed-sample', { count });
    return res.data;
  },

  clearQueue: async () => {
    const res = await client.post('/patients/clear');
    return res.data;
  },

  overrideTriage: async (id, overrideData) => {
    const res = await client.post(`/patients/${id}/override`, overrideData);
    return res.data;
  },

  updateVitals: async (id, vitals) => {
    const res = await client.post(`/patients/${id}/vitals`, { vitals });
    return res.data;
  },

  // Simulation & Surge Controls
  advanceTime: async (minutes = 15) => {
    const res = await client.post('/patients/simulation/advance-time', { minutes });
    return res.data;
  },

  toggleSurge: async (enable) => {
    const res = await client.post('/patients/simulation/toggle-surge', { enable });
    return res.data;
  },

  resetStore: async () => {
    const res = await client.post('/patients/simulation/reset');
    return res.data;
  },

  // Stats & Audits
  getStats: async () => {
    const res = await client.get('/stats');
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await client.get('/audit', { params });
    return res.data;
  },

  // AI & Triage Live Engine
  analyzeTriage: async (patientData) => {
    const res = await client.post('/triage/analyze', patientData);
    return res.data;
  },

  calibrateVitals: async (vitals, age) => {
    const res = await client.post('/triage/calibrate-vitals', { vitals, age });
    return res.data;
  },

  parseTranscript: async (transcript) => {
    const res = await client.post('/triage/parse-nlp-transcript', { transcript });
    return res.data;
  }
};
