/**
 * Mongoose Schema for ABDM / DISHA Regulatory Audit Trail
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    patientId: { type: String, required: true },
    patientHash: { type: String, required: true, index: true },
    abhaId: { type: String, default: 'UNLINKED_FIRST_TIME' },
    aiRecommendation: { type: mongoose.Schema.Types.Mixed },
    clinicianAction: { type: mongoose.Schema.Types.Mixed },
    regulatoryCompliance: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
