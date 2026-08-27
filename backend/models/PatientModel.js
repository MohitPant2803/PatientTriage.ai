/**
 * Mongoose Schema for Patient Emergency Records
 */

const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, default: 'Unspecified' },
    abhaId: { type: String, default: null },
    hasPriorHistory: { type: Boolean, default: false },
    medicalHistory: [{ type: String }],
    chiefComplaint: { type: String, required: true },
    symptoms: [{ type: String }],
    painScore: { type: Number, default: 0 },
    gcs: { type: Number, default: 15 },
    vitals: {
      hr: Number,
      sbp: Number,
      dbp: Number,
      rr: Number,
      spo2: Number,
      temp: Number
    },
    currentESI: { type: Number, required: true, index: true },
    triageResult: { type: mongoose.Schema.Types.Mixed },
    sbarNote: { type: mongoose.Schema.Types.Mixed },
    isOverridden: { type: Boolean, default: false },
    overrideDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    waitTimeMinutes: { type: Number, default: 0 },
    maxSafeWaitMinutes: { type: Number, default: 30 },
    deteriorationAlert: { type: Boolean, default: false },
    deteriorationReason: { type: String, default: null },
    status: { type: String, default: 'WAITING_FOR_DOCTOR' },
    assignedBay: { type: String, default: null },
    historyLog: [
      {
        timestamp: { type: String },
        action: { type: String },
        note: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
