/**
 * Triage API Routes
 * Handles live patient triage scoring, differential reasoning, NLP transcript parsing, and SBAR generation
 */

const express = require('express');
const router = express.Router();
const { analyzePatientTriage, fallbackTriageReasoning, generateSBARNote } = require('../services/geminiService');
const { calibrateVitals } = require('../services/vitalCalibrator');
const { evaluateDeterministicRules } = require('../services/safetyRuleEngine');
const { calculateUncertainty } = require('../services/uncertaintyEngine');

/**
 * POST /api/triage/analyze
 * Comprehensive Triage Analysis
 */
router.post('/analyze', async (req, res) => {
  try {
    const patientData = req.body;
    if (!patientData) {
      return res.status(400).json({ error: 'Missing patient data payload' });
    }

    const triageResult = await analyzePatientTriage(patientData);
    const sbarNote = generateSBARNote(patientData, triageResult);

    return res.json({
      success: true,
      triageResult,
      sbarNote
    });
  } catch (err) {
    console.error('Error analyzing triage:', err);
    return res.status(500).json({ error: 'Failed to analyze patient triage', details: err.message });
  }
});

/**
 * POST /api/triage/calibrate-vitals
 * Quick vital sign evaluation against age cohort
 */
router.post('/calibrate-vitals', (req, res) => {
  try {
    const { vitals, age } = req.body;
    const result = calibrateVitals(vitals, Number(age) || 35);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to calibrate vitals', details: err.message });
  }
});

/**
 * POST /api/triage/parse-nlp-transcript
 * Extracts structured symptoms and vitals from ambient speech / voice transcripts
 */
router.post('/parse-nlp-transcript', (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Missing speech transcript' });
    }

    const text = transcript.toLowerCase();
    const extracted = {
      chiefComplaint: transcript,
      symptoms: [],
      vitals: {},
      painScore: 0,
      confidence: 88
    };

    // Extract pain score
    const painMatch = text.match(/pain\s*(?:level|score|is|of)?\s*([0-9]|10)/i);
    if (painMatch) {
      extracted.painScore = parseInt(painMatch[1], 10);
    }

    // Extract HR
    const hrMatch = text.match(/(?:pulse|heart rate|hr)\s*(?:is|of)?\s*([0-9]{2,3})/i);
    if (hrMatch) {
      extracted.vitals.hr = parseInt(hrMatch[1], 10);
    }

    // Extract BP
    const bpMatch = text.match(/(?:bp|blood pressure)\s*(?:is|of)?\s*([0-9]{2,3})\s*(?:over|\/)\s*([0-9]{2,3})/i);
    if (bpMatch) {
      extracted.vitals.sbp = parseInt(bpMatch[1], 10);
      extracted.vitals.dbp = parseInt(bpMatch[2], 10);
    }

    // Extract SpO2
    const spo2Match = text.match(/(?:spo2|oxygen|saturation|o2)\s*(?:is|of)?\s*([0-9]{2,3})/i);
    if (spo2Match) {
      extracted.vitals.spo2 = parseInt(spo2Match[1], 10);
    }

    // Extract Temp
    const tempMatch = text.match(/(?:temperature|temp)\s*(?:is|of)?\s*([0-9]{2}(?:\.[0-9])?)/i);
    if (tempMatch) {
      extracted.vitals.temp = parseFloat(tempMatch[1]);
    }

    // Extract common clinical keywords
    const keywords = [
      'chest pain',
      'shortness of breath',
      'fever',
      'cough',
      'nausea',
      'vomiting',
      'dizziness',
      'headache',
      'abdominal pain',
      'lethargy',
      'sweating',
      'weakness',
      'diaphoresis',
      'stridor',
      'barking cough'
    ];
    keywords.forEach((k) => {
      if (text.includes(k)) {
        extracted.symptoms.push(k);
      }
    });

    return res.json({
      success: true,
      extracted
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse transcript', details: err.message });
  }
});

module.exports = router;
