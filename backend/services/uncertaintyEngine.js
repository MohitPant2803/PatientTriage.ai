/**
 * Asymmetric Uncertainty & Safety-First Escalation Engine
 *
 * Core Concept:
 * Under-triage (failing to identify a deteriorating patient) has catastrophic clinical costs.
 * Over-triage (assigning higher priority) carries modest operational cost.
 *
 * Hence, the system deliberately penalizes uncertainty (missing vitals, zero-history, ambiguous cues)
 * and automatically biases toward escalation under clinical ambiguity.
 */

function calculateUncertainty(patientData) {
  const { vitals = {}, chiefComplaint = '', hasPriorHistory = true, symptoms = [], age } = patientData;

  let missingPoints = 0;
  let ambiguityPoints = 0;
  const missingFields = [];
  const ambiguityFlags = [];

  // 1. Missing Vital Sign Audit
  if (!vitals.hr) {
    missingPoints += 15;
    missingFields.push('Heart Rate');
  }
  if (!vitals.sbp) {
    missingPoints += 15;
    missingFields.push('Blood Pressure');
  }
  if (!vitals.rr) {
    missingPoints += 20; // Respiratory rate is the earliest indicator of physiological collapse
    missingFields.push('Respiratory Rate');
  }
  if (!vitals.spo2) {
    missingPoints += 20;
    missingFields.push('SpO2 Oxygen Saturation');
  }
  if (!vitals.temp) {
    missingPoints += 10;
    missingFields.push('Body Temperature');
  }

  // 2. Zero-History Penalty (First-time arrival vs rich EHR)
  let zeroHistoryPenalty = 0;
  if (!hasPriorHistory) {
    zeroHistoryPenalty = 15;
    ambiguityFlags.push('Zero-History Arrival (No prior EHR / ABDM records on file)');
  }

  // 3. Vague Chief Complaint / Ambiguity Analysis
  const complaintLength = (chiefComplaint || '').trim().length;
  if (complaintLength === 0) {
    ambiguityPoints += 25;
    ambiguityFlags.push('Empty Chief Complaint');
  } else if (complaintLength < 15 && symptoms.length <= 1) {
    ambiguityPoints += 15;
    ambiguityFlags.push('Sparse Symptom Description (Ambiguous Presentation)');
  }

  // Check for discordance (e.g. high pain score but low details)
  const painScore = Number(patientData.painScore) || 0;
  if (painScore >= 8 && complaintLength < 20) {
    ambiguityPoints += 10;
    ambiguityFlags.push('High Pain Score with Limited Clinical Specifics');
  }

  // Composite uncertainty score (0 - 100%)
  const rawUncertainty = missingPoints + zeroHistoryPenalty + ambiguityPoints;
  const compositeUncertainty = Math.min(100, Math.max(5, rawUncertainty));
  const confidenceScore = Math.max(10, 100 - compositeUncertainty);

  // Determine Uncertainty Tier
  let uncertaintyTier = 'LOW';
  if (compositeUncertainty > 45) {
    uncertaintyTier = 'HIGH';
  } else if (compositeUncertainty > 25) {
    uncertaintyTier = 'MODERATE';
  }

  return {
    compositeUncertainty,
    confidenceScore,
    uncertaintyTier,
    missingFields,
    ambiguityFlags,
    isMissingDataCritical: missingPoints >= 35,
    isZeroHistory: !hasPriorHistory
  };
}

/**
 * Applies Asymmetric Safety Escalation Bias
 * If clinical uncertainty is elevated, we automatically escalate ESI level
 * (e.g. Level 3 -> Level 2, or Level 4 -> Level 3)
 */
function applyAsymmetricEscalation(rawLevel, uncertaintyResult) {
  let finalLevel = rawLevel;
  let wasEscalated = false;
  let escalationReason = null;

  // If uncertainty is HIGH (> 35%) and case is currently non-emergent (Level 3 or 4)
  if (uncertaintyResult.compositeUncertainty >= 35) {
    if (rawLevel === 3) {
      finalLevel = 2;
      wasEscalated = true;
      escalationReason = `Asymmetric Safety Escalation: Promoted from Level 3 to Level 2 (Emergent) due to ${uncertaintyResult.compositeUncertainty}% clinical uncertainty & missing parameters (${uncertaintyResult.missingFields.join(', ') || 'No prior history'}). Bias towards patient safety.`;
    } else if (rawLevel === 4) {
      finalLevel = 3;
      wasEscalated = true;
      escalationReason = `Asymmetric Safety Escalation: Promoted from Level 4 to Level 3 (Urgent) due to high uncertainty score (${uncertaintyResult.compositeUncertainty}%).`;
    }
  }

  return {
    rawLevel,
    finalLevel,
    wasEscalated,
    escalationReason
  };
}

module.exports = {
  calculateUncertainty,
  applyAsymmetricEscalation
};
