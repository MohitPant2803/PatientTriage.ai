/**
 * Google Gemini Clinical AI Service with Offline Clinical Fallback
 * Provides LLM-driven differential reasoning, dynamic probing question generation,
 * voice transcript entity extraction, and automated SBAR clinical handover notes.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { evaluateDeterministicRules } = require('./safetyRuleEngine');
const { calculateUncertainty, applyAsymmetricEscalation } = require('./uncertaintyEngine');
const { calibrateVitals } = require('./vitalCalibrator');

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  try {
    return new GoogleGenerativeAI(apiKey.trim());
  } catch (err) {
    console.warn('Failed to initialize GoogleGenerativeAI:', err.message);
    return null;
  }
}

/**
 * Deterministic Clinical Reasoning Fallback (Used if Gemini API key is absent or offline)
 */
function fallbackTriageReasoning(patientData) {
  const age = Number(patientData.age) || 35;
  const vitalCalib = calibrateVitals(patientData.vitals, age);
  const detResult = evaluateDeterministicRules(patientData);
  const uncertainty = calculateUncertainty(patientData);

  let suggestedLevel = 3;
  let severityLabel = 'Level 3 - Urgent (Multiple Resources Needed)';
  let differential = ['Undifferentiated Acute Presentation', 'Systemic Inflammatory Response', 'Symptomatic Pain Syndrome'];
  let resourceNeeds = ['Blood Labs (CBC, LFT/RFT)', 'IV Access / Hydration', 'Point of Care Ultrasound (POCUS)'];
  let probingQuestions = [
    'When exactly did the symptoms peak, and does anything relieve or worsen the pain?',
    'Have you noticed any shortness of breath, dizziness, or radiating pain?',
    'Do you have any known allergies or prior hospital admissions for similar episodes?'
  ];

  if (detResult.ruleTriggered) {
    suggestedLevel = detResult.forcedLevel;
    if (suggestedLevel === 1) {
      severityLabel = 'Level 1 - Resuscitation (Immediate Life Threat)';
      differential = ['Cardiopulmonary Collapse / Shock', 'Airway Obstruction', 'Severe Neurological Impairment'];
      resourceNeeds = ['Immediate Resuscitation Bay', 'Endotracheal Airway Management', 'Continuous Telemetry & ACLS Protocol'];
      probingQuestions = [
        'Is the airway patent and maintainable?',
        'What was the exact time of collapse or neurological decline?',
        'Any known ingestion, trauma, or anaphylactic allergen exposure?'
      ];
    } else if (suggestedLevel === 2) {
      severityLabel = 'Level 2 - Emergent (High Risk / Time-Sensitive)';
      differential = ['Acute Coronary / Vascular Event', 'Severe Sepsis / Decompensation', 'Acute Organ Ischemia'];
      resourceNeeds = ['Immediate Bedside ECG (within 10 min)', 'STAT Troponin / Lactate / ABG', 'Continuous SpO2 & BP Telemetry'];
      probingQuestions = [
        'Is there any chest tightness, diaphoresis, or pain radiating to jaw or left arm?',
        'Any sudden difficulty in speaking, facial weakness, or limb numbness?',
        'Are there risk factors such as diabetes, recent travel, or oral contraceptive use?'
      ];
    }
  } else {
    // ESI Level 3, 4, 5 estimation
    const complaint = (patientData.chiefComplaint || '').toLowerCase();
    const symptoms = (patientData.symptoms || []).join(' ').toLowerCase();
    const fullText = `${complaint} ${symptoms}`;

    const isMinor = fullText.includes('sprain') || fullText.includes('rash') || fullText.includes('suture') || fullText.includes('prescription') || fullText.includes('mild cold') || fullText.includes('minor cut') || fullText.includes('ear pain');

    if (isMinor && vitalCalib.isPhysiologicallyStable) {
      if (fullText.includes('prescription') || fullText.includes('refill') || fullText.includes('mild cold')) {
        suggestedLevel = 5;
        severityLabel = 'Level 5 - Non-Urgent (Zero Complex Resources)';
        resourceNeeds = ['Clinical Examination', 'Outpatient Prescription'];
        differential = ['Minor Upper Respiratory Infection', 'Medication Refill Request', 'Localized Skin Irritation'];
      } else {
        suggestedLevel = 4;
        severityLabel = 'Level 4 - Less Urgent (Single Diagnostic Resource)';
        resourceNeeds = ['Single X-Ray / Local Wound Dressing', 'Oral Analgesia'];
        differential = ['Musculoskeletal Strain / Sprain', 'Simple Laceration', 'Localized Mild Infection'];
      }
    }
  }

  // Apply Asymmetric Safety Escalation
  const escalation = applyAsymmetricEscalation(suggestedLevel, uncertainty);
  const finalLevel = escalation.finalLevel;

  return {
    esiLevel: finalLevel,
    severityLabel: escalation.wasEscalated
      ? `Level ${finalLevel} - Safety Escalated from Level ${suggestedLevel}`
      : severityLabel,
    confidenceScore: uncertainty.confidenceScore,
    uncertaintyPercentage: uncertainty.compositeUncertainty,
    uncertaintyTier: uncertainty.uncertaintyTier,
    wasEscalated: escalation.wasEscalated,
    escalationReason: escalation.escalationReason,
    deterministicRuleTriggered: detResult.ruleTriggered,
    deterministicTriggers: detResult.triggers,
    vitalCalib,
    differentialDiagnosis: differential,
    predictedResourceNeeds: resourceNeeds,
    suggestedProbingQuestions: probingQuestions,
    clinicalRationale: detResult.ruleTriggered
      ? detResult.clinicalRationale
      : `Patient presented with ${patientData.chiefComplaint || 'acute symptoms'}. Physiological vital analysis in ${vitalCalib.cohortName} cohort indicates risk score ${vitalCalib.vitalRiskScore}/10. ${escalation.wasEscalated ? escalation.escalationReason : 'Stable for urgent/standard workflow.'}`,
    missingDataRisk: uncertainty.missingFields,
    aiModel: 'Deterministic Clinical Engine (PALS/ESI Protocol Fallback)'
  };
}

/**
 * Generates comprehensive clinical triage analysis via Gemini LLM
 */
async function analyzePatientTriage(patientData) {
  // Always evaluate deterministic rules & uncertainty first (Safety Boundary)
  const age = Number(patientData.age) || 35;
  const vitalCalib = calibrateVitals(patientData.vitals, age);
  const detResult = evaluateDeterministicRules(patientData);
  const uncertainty = calculateUncertainty(patientData);

  const genAI = getGenAI();
  if (!genAI) {
    return fallbackTriageReasoning(patientData);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert Emergency Medicine Physician Co-Pilot assisting a triage nurse under severe time pressure.
Analyze the following patient arriving at the Emergency Department:

PATIENT DATA:
- Name: ${patientData.name || 'Anonymous'}
- Age: ${patientData.age} (${vitalCalib.cohortName})
- Gender: ${patientData.gender || 'Not specified'}
- Prior Medical Records on File: ${patientData.hasPriorHistory ? 'Yes (ABDM Hash Found)' : 'No (Zero-History / First-time patient)'}
- Medical History: ${(patientData.medicalHistory || []).join(', ') || 'None recorded'}
- Chief Complaint: "${patientData.chiefComplaint || 'None provided'}"
- Associated Symptoms: ${(patientData.symptoms || []).join(', ') || 'None'}
- Pain Score: ${patientData.painScore || 0}/10
- GCS (Glasgow Coma Scale): ${patientData.gcs || 15}/15
- Vitals: HR=${patientData.vitals?.hr || 'Missing'} bpm, BP=${patientData.vitals?.sbp || 'Missing'}/${patientData.vitals?.dbp || 'Missing'} mmHg, RR=${patientData.vitals?.rr || 'Missing'} bpm, SpO2=${patientData.vitals?.spo2 || 'Missing'}%, Temp=${patientData.vitals?.temp || 'Missing'}°C

CALIBRATED PHYSIOLOGY:
- Age Cohort: ${vitalCalib.cohortName}
- Vital Anomalies Detected: ${JSON.stringify(vitalCalib.anomalies)}
- Deterministic Safety Triggers: ${JSON.stringify(detResult.triggers)}

INSTRUCTIONS:
1. Provide a rigorous ESI Triage Score (1 = Resuscitation, 2 = Emergent, 3 = Urgent, 4 = Less Urgent, 5 = Non-urgent).
2. DO NOT DOWNGRADE if deterministic safety triggers are present (e.g. Level 1 or 2 triggers must be at least Level 1 or 2).
3. If presentation is ambiguous, atypical (e.g., geriatric silent cardiac, pediatric stridor, occult sepsis), or missing critical vitals, BIAS TOWARD ESCALATION.
4. Output strictly valid JSON matching this exact structure:
{
  "esiLevel": 1, 2, 3, 4, or 5,
  "differentialDiagnosis": ["Top 3 differential diagnoses"],
  "clinicalRationale": "Concise 2-3 sentence clinical reasoning highlighting age-specific baselines, atypical risk factors, and vital status.",
  "predictedResourceNeeds": ["List of likely interventions/diagnostics needed, e.g. ECG, Troponin, CT scan, IV Fluids"],
  "suggestedProbingQuestions": ["3 high-yield questions for the nurse to ask right now to eliminate life threats"]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean JSON formatting
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    // Enforce Safety Floor: Gemini cannot downgrade a deterministic rule!
    let rawLevel = parsed.esiLevel || 3;
    if (detResult.forcedLevel && rawLevel > detResult.forcedLevel) {
      rawLevel = detResult.forcedLevel;
    }

    // Apply Asymmetric Escalation Bias
    const escalation = applyAsymmetricEscalation(rawLevel, uncertainty);
    const finalLevel = escalation.finalLevel;

    return {
      esiLevel: finalLevel,
      severityLabel: getESILabel(finalLevel, escalation.wasEscalated, rawLevel),
      confidenceScore: uncertainty.confidenceScore,
      uncertaintyPercentage: uncertainty.compositeUncertainty,
      uncertaintyTier: uncertainty.uncertaintyTier,
      wasEscalated: escalation.wasEscalated,
      escalationReason: escalation.escalationReason,
      deterministicRuleTriggered: detResult.ruleTriggered,
      deterministicTriggers: detResult.triggers,
      vitalCalib,
      differentialDiagnosis: parsed.differentialDiagnosis || ['Atypical Clinical Presentation'],
      predictedResourceNeeds: parsed.predictedResourceNeeds || ['Bedside Clinical Evaluation'],
      suggestedProbingQuestions: parsed.suggestedProbingQuestions || [
        'When did the symptoms begin?',
        'Any prior history of similar episodes?',
        'Any radiating pain or dizziness?'
      ],
      clinicalRationale: parsed.clinicalRationale || detResult.clinicalRationale,
      missingDataRisk: uncertainty.missingFields,
      aiModel: 'Google Gemini 1.5 Flash + Deterministic Safety Layer'
    };
  } catch (err) {
    console.error('Gemini API Error, falling back to clinical rule engine:', err.message);
    return fallbackTriageReasoning(patientData);
  }
}

/**
 * Helper to get human-readable ESI Label
 */
function getESILabel(level, wasEscalated, originalLevel) {
  const map = {
    1: 'Level 1 - Resuscitation (Immediate Life Threat)',
    2: 'Level 2 - Emergent (High Risk / Time-Sensitive)',
    3: 'Level 3 - Urgent (Multiple Resources Needed)',
    4: 'Level 4 - Less Urgent (Single Resource Needed)',
    5: 'Level 5 - Non-Urgent (Zero Complex Resources)'
  };
  if (wasEscalated) {
    return `${map[level]} (Escalated from Level ${originalLevel} for Safety)`;
  }
  return map[level] || `Level ${level}`;
}

/**
 * Generates an automated SBAR Clinical Handover Note
 */
function generateSBARNote(patient, triageResult) {
  const vitalsStr = patient.vitals
    ? `HR: ${patient.vitals.hr || 'N/A'} bpm, BP: ${patient.vitals.sbp || 'N/A'}/${patient.vitals.dbp || 'N/A'} mmHg, SpO2: ${patient.vitals.spo2 || 'N/A'}%, RR: ${patient.vitals.rr || 'N/A'} bpm, Temp: ${patient.vitals.temp || 'N/A'}°C`
    : 'No vitals recorded';

  return {
    situation: `Patient ${patient.name || 'Anonymous'} (${patient.age}y, ${patient.gender || 'U'}) triaged as ESI ${triageResult.esiLevel} for ${patient.chiefComplaint || 'Acute presentation'}.`,
    background: `Medical History: ${(patient.medicalHistory || []).join(', ') || 'No prior EHR on file (ABDM Null)'}. Pain Score: ${patient.painScore || 0}/10.`,
    assessment: `Vitals: ${vitalsStr}. AI Clinical Impression: ${triageResult.clinicalRationale} Differential: ${(triageResult.differentialDiagnosis || []).join(', ')}. Uncertainty: ${triageResult.uncertaintyPercentage}%.`,
    recommendation: `Immediate Bed Allocation: ${triageResult.esiLevel <= 2 ? 'Resuscitation / Monitored Telemetry Bay' : 'Urgent Assessment Ward'}. Recommended Orders: ${(triageResult.predictedResourceNeeds || []).join(', ')}.`
  };
}

module.exports = {
  analyzePatientTriage,
  fallbackTriageReasoning,
  generateSBARNote
};
