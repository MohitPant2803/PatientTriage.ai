/**
 * Age-Cohort Physiological Vital Sign Calibrator
 * Calibrates normal physiological thresholds across Pediatric, Adult, and Geriatric cohorts
 * Based on PALS (Pediatric Advanced Life Support) and Geriatric Emergency Medicine Guidelines
 */

const VITAL_THRESHOLDS = {
  infant: {
    // 0 - 1 year
    name: 'Infant (< 1 yr)',
    hr: { min: 100, max: 160, criticalHigh: 180, criticalLow: 80 },
    rr: { min: 30, max: 55, criticalHigh: 60, criticalLow: 20 },
    sbp: { min: 70, max: 100, criticalLow: 60 },
    temp: { min: 36.5, max: 37.5, fever: 38.0, hypothermia: 36.0 },
    spo2: { min: 95, criticalLow: 90 }
  },
  child: {
    // 1 - 5 years
    name: 'Young Child (1-5 yrs)',
    hr: { min: 80, max: 130, criticalHigh: 160, criticalLow: 65 },
    rr: { min: 20, max: 32, criticalHigh: 40, criticalLow: 14 },
    sbp: { min: 80, max: 110, criticalLow: 70 },
    temp: { min: 36.5, max: 37.5, fever: 38.3, hypothermia: 36.0 },
    spo2: { min: 95, criticalLow: 90 }
  },
  olderChild: {
    // 6 - 12 years
    name: 'School Age (6-12 yrs)',
    hr: { min: 70, max: 110, criticalHigh: 140, criticalLow: 55 },
    rr: { min: 16, max: 24, criticalHigh: 30, criticalLow: 12 },
    sbp: { min: 90, max: 120, criticalLow: 80 },
    temp: { min: 36.5, max: 37.5, fever: 38.3, hypothermia: 35.8 },
    spo2: { min: 95, criticalLow: 91 }
  },
  adult: {
    // 13 - 64 years
    name: 'Adult (13-64 yrs)',
    hr: { min: 60, max: 100, criticalHigh: 130, criticalLow: 45 },
    rr: { min: 12, max: 20, criticalHigh: 28, criticalLow: 10 },
    sbp: { min: 90, max: 130, criticalHigh: 180, criticalLow: 85 },
    temp: { min: 36.5, max: 37.5, fever: 38.3, hypothermia: 35.5 },
    spo2: { min: 95, criticalLow: 92 }
  },
  geriatric: {
    // 65+ years
    name: 'Geriatric (65+ yrs)',
    hr: { min: 55, max: 90, criticalHigh: 115, criticalLow: 45 },
    rr: { min: 14, max: 22, criticalHigh: 26, criticalLow: 10 },
    sbp: { min: 100, max: 145, criticalHigh: 190, criticalLow: 90 },
    temp: { min: 36.0, max: 37.2, fever: 37.8, hypothermia: 35.5 }, // Geriatric fever threshold is lower!
    spo2: { min: 94, criticalLow: 90 }
  }
};

/**
 * Determines the age cohort key based on age in years (or months if < 1)
 */
function getAgeCohort(ageYears) {
  const age = Number(ageYears);
  if (isNaN(age) || age < 1) return 'infant';
  if (age <= 5) return 'child';
  if (age <= 12) return 'olderChild';
  if (age < 65) return 'adult';
  return 'geriatric';
}

/**
 * Calibrates and analyzes vitals against the age-specific cohort
 * @param {Object} vitals { hr, sbp, dbp, rr, temp, spo2 }
 * @param {Number} age Age in years
 * @returns {Object} Analysis containing abnormalities, risk points, and age cohort metadata
 */
function calibrateVitals(vitals = {}, age = 35) {
  const cohortKey = getAgeCohort(age);
  const thresholds = VITAL_THRESHOLDS[cohortKey];

  const hr = vitals.hr ? Number(vitals.hr) : null;
  const sbp = vitals.sbp ? Number(vitals.sbp) : null;
  const dbp = vitals.dbp ? Number(vitals.dbp) : null;
  const rr = vitals.rr ? Number(vitals.rr) : null;
  const temp = vitals.temp ? Number(vitals.temp) : null;
  const spo2 = vitals.spo2 ? Number(vitals.spo2) : null;

  const anomalies = [];
  let vitalRiskScore = 0; // 0 to 10 scale
  let isLifeThreatening = false;
  let isHighRisk = false;

  // 1. Heart Rate Evaluation
  if (hr !== null) {
    if (hr >= thresholds.hr.criticalHigh) {
      anomalies.push({
        parameter: 'Heart Rate',
        value: `${hr} bpm`,
        status: 'CRITICAL_HIGH',
        message: `Severe Tachycardia for ${thresholds.name} (Critical threshold ≥ ${thresholds.hr.criticalHigh})`
      });
      vitalRiskScore += 3;
      isHighRisk = true;
      if (hr > 180 && cohortKey === 'adult') isLifeThreatening = true;
    } else if (hr > thresholds.hr.max) {
      anomalies.push({
        parameter: 'Heart Rate',
        value: `${hr} bpm`,
        status: 'HIGH',
        message: `Elevated HR for ${thresholds.name} (Normal: ${thresholds.hr.min}-${thresholds.hr.max})`
      });
      vitalRiskScore += 1.5;
    } else if (hr <= thresholds.hr.criticalLow) {
      anomalies.push({
        parameter: 'Heart Rate',
        value: `${hr} bpm`,
        status: 'CRITICAL_LOW',
        message: `Severe Bradycardia for ${thresholds.name} (Critical threshold ≤ ${thresholds.hr.criticalLow})`
      });
      vitalRiskScore += 3;
      isHighRisk = true;
    } else if (hr < thresholds.hr.min) {
      anomalies.push({
        parameter: 'Heart Rate',
        value: `${hr} bpm`,
        status: 'LOW',
        message: `Mild Bradycardia for ${thresholds.name} (Normal: ${thresholds.hr.min}-${thresholds.hr.max})`
      });
      vitalRiskScore += 1;
    }
  }

  // 2. Respiratory Rate Evaluation
  if (rr !== null) {
    if (rr >= thresholds.rr.criticalHigh) {
      anomalies.push({
        parameter: 'Respiratory Rate',
        value: `${rr} bpm`,
        status: 'CRITICAL_HIGH',
        message: `Severe Tachypnea for ${thresholds.name} (Critical threshold ≥ ${thresholds.rr.criticalHigh})`
      });
      vitalRiskScore += 3;
      isHighRisk = true;
    } else if (rr > thresholds.rr.max) {
      anomalies.push({
        parameter: 'Respiratory Rate',
        value: `${rr} bpm`,
        status: 'HIGH',
        message: `Elevated RR for ${thresholds.name} (Normal: ${thresholds.rr.min}-${thresholds.rr.max})`
      });
      vitalRiskScore += 1.5;
    } else if (rr <= thresholds.rr.criticalLow) {
      anomalies.push({
        parameter: 'Respiratory Rate',
        value: `${rr} bpm`,
        status: 'CRITICAL_LOW',
        message: `Bradypnea / Impending Respiratory Failure for ${thresholds.name} (≤ ${thresholds.rr.criticalLow})`
      });
      vitalRiskScore += 4;
      isLifeThreatening = true;
    }
  }

  // 3. Blood Pressure Evaluation (Systolic)
  if (sbp !== null) {
    if (sbp <= thresholds.sbp.criticalLow) {
      anomalies.push({
        parameter: 'Blood Pressure',
        value: `${sbp} mmHg (Systolic)`,
        status: 'CRITICAL_LOW',
        message: `Severe Hypotension / Shock state for ${thresholds.name} (≤ ${thresholds.sbp.criticalLow} mmHg)`
      });
      vitalRiskScore += 3.5;
      isHighRisk = true;
      if (sbp < 70) isLifeThreatening = true;
    } else if (thresholds.sbp.criticalHigh && sbp >= thresholds.sbp.criticalHigh) {
      anomalies.push({
        parameter: 'Blood Pressure',
        value: `${sbp} mmHg (Systolic)`,
        status: 'CRITICAL_HIGH',
        message: `Hypertensive Crisis for ${thresholds.name} (≥ ${thresholds.sbp.criticalHigh} mmHg)`
      });
      vitalRiskScore += 2.5;
    }
  }

  // 4. Oxygen Saturation (SpO2)
  if (spo2 !== null) {
    if (spo2 <= 85) {
      anomalies.push({
        parameter: 'Oxygen Saturation (SpO2)',
        value: `${spo2}%`,
        status: 'CRITICAL_LOW',
        message: `Life-threatening Hypoxemia (SpO2 ≤ 85%)`
      });
      vitalRiskScore += 4;
      isLifeThreatening = true;
    } else if (spo2 <= thresholds.spo2.criticalLow) {
      anomalies.push({
        parameter: 'Oxygen Saturation (SpO2)',
        value: `${spo2}%`,
        status: 'CRITICAL_LOW',
        message: `Severe Hypoxia for ${thresholds.name} (≤ ${thresholds.spo2.criticalLow}%)`
      });
      vitalRiskScore += 3;
      isHighRisk = true;
    } else if (spo2 < thresholds.spo2.min) {
      anomalies.push({
        parameter: 'Oxygen Saturation (SpO2)',
        value: `${spo2}%`,
        status: 'LOW',
        message: `Sub-optimal SpO2 (${spo2}% < ${thresholds.spo2.min}%)`
      });
      vitalRiskScore += 1.5;
    }
  }

  // 5. Temperature Evaluation (Geriatric vs Pediatric)
  if (temp !== null) {
    if (temp >= thresholds.temp.fever) {
      const isGeriatricOrInfant = cohortKey === 'geriatric' || cohortKey === 'infant';
      anomalies.push({
        parameter: 'Body Temperature',
        value: `${temp}°C`,
        status: isGeriatricOrInfant ? 'CRITICAL_HIGH' : 'HIGH',
        message: `Fever for ${thresholds.name} (≥ ${thresholds.temp.fever}°C)${isGeriatricOrInfant ? ' - High risk cohort' : ''}`
      });
      vitalRiskScore += isGeriatricOrInfant ? 2.5 : 1.5;
      if (cohortKey === 'infant' && temp >= 38.5) isHighRisk = true;
    } else if (temp <= thresholds.temp.hypothermia) {
      anomalies.push({
        parameter: 'Body Temperature',
        value: `${temp}°C`,
        status: 'CRITICAL_LOW',
        message: `Hypothermia for ${thresholds.name} (≤ ${thresholds.temp.hypothermia}°C) - Indicator of occult sepsis or exposure`
      });
      vitalRiskScore += 2.5;
      if (cohortKey === 'geriatric') isHighRisk = true; // Geriatric sepsis often presents as hypothermia
    }
  }

  return {
    cohortKey,
    cohortName: thresholds.name,
    thresholds,
    anomalies,
    vitalRiskScore: Math.min(10, vitalRiskScore),
    isLifeThreatening,
    isHighRisk,
    isPhysiologicallyStable: anomalies.length === 0
  };
}

module.exports = {
  VITAL_THRESHOLDS,
  getAgeCohort,
  calibrateVitals
};
