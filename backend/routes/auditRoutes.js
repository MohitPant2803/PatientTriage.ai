/**
 * Regulatory Audit Trail Routes
 * Retrieves immutable ABDM / DISHA / HIPAA compliance logs
 */

const express = require('express');
const router = express.Router();
const { getAuditLogs, auditTrail } = require('../services/auditService');

/**
 * GET /api/audit
 * Get recent audit log entries
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, eventType } = req.query;
    const logs = getAuditLogs({ limit: Number(limit), eventType });
    return res.json({
      success: true,
      totalEvents: auditTrail.length,
      count: logs.length,
      complianceStandard: 'ABDM Level-2 / DISHA Act 2024 / HIPAA 45 CFR § 164.312',
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

module.exports = router;
