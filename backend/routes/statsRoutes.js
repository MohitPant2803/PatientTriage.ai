/**
 * Emergency Department Command Center Stats API Routes
 */

const express = require('express');
const router = express.Router();
const { patientStore } = require('../models/patientStore');

/**
 * GET /api/stats
 * Command center telemetry, bed occupancy, nurse-patient ratios, surge status
 */
router.get('/', (req, res) => {
  try {
    const stats = patientStore.getCommandCenterStats();
    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch command center stats', details: err.message });
  }
});

module.exports = router;
