/**
 * Deterministic Safety Rule Engine
 * Implements Emergency Severity Index (ESI) Level 1 and Level 2 hard clinical triggers
 * This acts as a protective boundary that LLMs cannot downgrade.
 */

const { calibrateVitals } = require('./vitalCalibrator');

/**
 * Checks for Level 1 (Resuscitation / Immediate Life Threat) Triggers
 */
function evaluateESILevel1(patientData, vitalCalib) {
  const { vitals = {}, chiefComplaint = '', gcs, symptoms = [] } = patientData;
  const textCorpus = `${chiefComplaint} ${symptoms.join(' ')}`.toLowerCase();

  const triggers = [];

  // 1. Unresponsive / Comatose (GCS <= 8)
  if (gcs && Number(gcs) <= 8) {
    triggers.push(`Severe Neurological Depression (GCS ${gcs} ≤ 8)`);
  }

  // 2. Cardiac arrest / agonal breathing / apnea
  if (textCorpus.includes('cardiac arrest') || textCorpus.includes('agonal') || textCorpus.includes('not breathing') || textCorpus.includes('pulseless')) {
    triggers.push('Suspected Cardiac or Respiratory Arrest');
  }

  // 3. Severe respiratory collapse (SpO2 <= 85% or RR <= 8)
  if (vitalCalib.isLifeThreatening) {
    triggers.push('Catastrophic Physiological Failure (Extreme Vital Derangement)');
  }

  // 4. Anaphylactic Shock with airway compromise
  if (
    (textCorpus.includes('anaphylaxis') || (textCorpus.includes('allergic') && textCorpus.includes('swelling'))) &&
    (textCorpus.includes('stridor') || textCorpus.includes('throat closing') || textCorpus.includes('wheezing severe') || textCorpus.includes('hypotension'))
  ) {
    triggers.push('Active Anaphylaxis with Airway Compromise / Shock');
  }

  // 5. Severe active massive hemorrhage / exsanguination
  if (textCorpus.includes('massive bleeding') || textCorpus.includes('exsanguinating') || textCorpus.includes('arterial bleed')) {
    triggers.push('Uncontrolled Massive Hemorrhage');
  }

  // 6. Floppy infant / unresponsiveness in neonate
  if (vitalCalib.cohortKey === 'infant' && (textCorpus.includes('floppy') || textCorpus.includes('unresponsive') || textCorpus.includes('blue lips') || textCorpus.includes('cyanosis'))) {
    triggers.push('Lethargic / Cyanotic / Floppy Infant');
  }

  return {
    isLevel1: triggers.length > 0,
    triggers
  };
}

/**
 * Checks for Level 2 (Emergent / High Risk / Rapid Intervention) Triggers
 */
function evaluateESILevel2(patientData, vitalCalib) {
  const { vitals = {}, chiefComplaint = '', medicalHistory = [], age = 35, symptoms = [] } = patientData;
  const textCorpus = `${chiefComplaint} ${symptoms.join(' ')} ${medicalHistory.join(' ')}`.toLowerCase();
  const triggers = [];

  // 1. Acute Coronary Syndrome (ACS) / Myocardial Infarction indicators
  const hasChestPain = textCorpus.includes('chest pain') || textCorpus.includes('angina') || textCorpus.includes('pressure in chest');
  const isDiabeticOrElderly = age >= 60 || textCorpus.includes('diabet') || textCorpus.includes('dm');
  const hasAtypicalACS = isDiabeticOrElderly && (textCorpus.includes('epigastric') || textCorpus.includes('unexplained nausea') || textCorpus.includes('sudden extreme fatigue') || textCorpus.includes('jaw pain') || textCorpus.includes('cold sweat') || textCorpus.includes('diaphoresis'));

  if (hasChestPain && (textCorpus.includes('radiat') || textCorpus.includes('sweat') || textCorpus.includes('shortness of breath') || age > 40)) {
    triggers.push('Suspected Acute Coronary Syndrome (High-risk Chest Pain)');
  } else if (hasAtypicalACS) {
    triggers.push('High-risk Atypical Cardiac Presentation in Diabetic/Geriatric Patient');
  }

  // 2. Acute Stroke / CVA (FAST symptoms)
  if (
    textCorpus.includes('facial droop') ||
    textCorpus.includes('slurred speech') ||
    textCorpus.includes('hemiparesis') ||
    textCorpus.includes('weakness on one side') ||
    textCorpus.includes('stroke') ||
    textCorpus.includes('facial asymmetry')
  ) {
    triggers.push('Acute Stroke Presentation (Time-Critical Reperfusion Window)');
  }

  // 3. Pulmonary Embolism (PE) flags (e.g. young on OCP or post-surgery, sudden pleuritic pain + tachycardia/hypoxia)
  if (
    (textCorpus.includes('pleuritic') || textCorpus.includes('sharp chest pain')) &&
    (textCorpus.includes('oral contraceptive') || textCorpus.includes('ocp') || textCorpus.includes('flight') || textCorpus.includes('surgery') || textCorpus.includes('dvt') || textCorpus.includes('calf swelling'))
  ) {
    triggers.push('Suspected Acute Pulmonary Embolism (High Clinical Probability)');
  }

  // 4. Pediatric Stridor / Croup / Epiglottitis / Sepsis
  if (vitalCalib.cohortKey === 'infant' || vitalCalib.cohortKey === 'child') {
    if (textCorpus.includes('stridor') || textCorpus.includes('barking cough') || textCorpus.includes('drooling') || textCorpus.includes('tripod')) {
      triggers.push('Pediatric Upper Airway Obstruction / Croup / Stridor');
    }
    if (Number(age) <= 0.25 && vitals.temp && Number(vitals.temp) >= 38.0) {
      triggers.push('Neonate / Young Infant (<3 months) with High Fever (Immature Immune System)');
    }
  }

  // 5. Geriatric Hypothermic Sepsis / Altered Mental Status
  if (vitalCalib.cohortKey === 'geriatric' && (vitals.temp <= 35.8 || textCorpus.includes('confus') || textCorpus.includes('delirium') || textCorpus.includes('disoriented'))) {
    if (vitalCalib.anomalies.length > 0 || textCorpus.includes('uti') || textCorpus.includes('fever') || textCorpus.includes('chills')) {
      triggers.push('Geriatric Sepsis with Altered Mental Status / Hypothermia');
    }
  }

  // 6. Diabetic Ketoacidosis (DKA)
  if (textCorpus.includes('type 1') || textCorpus.includes('dka') || (textCorpus.includes('diabet') && (textCorpus.includes('fruity') || textCorpus.includes('kussmaul') || textCorpus.includes('vomiting and high sugar')))) {
    triggers.push('Suspected Diabetic Ketoacidosis (Metabolic Crisis)');
  }

  // 7. Thunderclap Headache (Subarachnoid Hemorrhage suspicion)
  if (textCorpus.includes('worst headache of life') || textCorpus.includes('thunderclap') || textCorpus.includes('sudden explosive headache')) {
    triggers.push('Suspected Subarachnoid Hemorrhage (Thunderclap Onset)');
  }

  // 8. Vital Sign High Risk Derangements
  if (vitalCalib.isHighRisk) {
    triggers.push(`High-Risk Vital Derangements in ${vitalCalib.cohortName}`);
  }

  // 9. Severe Acute Abdominal Pain in Elderly / Acute Surgical Abdomen
  if (textCorpus.includes('rigid abdomen') || textCorpus.includes('peritonitis') || (textCorpus.includes('severe abdominal pain') && age > 60)) {
    triggers.push('Acute Surgical Abdomen / Mesenteric Ischemia Risk');
  }

  // 10. High-Energy Major Trauma
  if (textCorpus.includes('car crash') || textCorpus.includes('fall from height') || textCorpus.includes('polytrauma') || textCorpus.includes('pedestrian hit')) {
    triggers.push('High-Mechanism Polytrauma');
  }

  return {
    isLevel2: triggers.length > 0,
    triggers
  };
}

/**
 * Runs the complete deterministic safety rule evaluation
 */
function evaluateDeterministicRules(patientData) {
  const age = Number(patientData.age) || 35;
  const vitalCalib = calibrateVitals(patientData.vitals, age);

  const level1 = evaluateESILevel1(patientData, vitalCalib);
  if (level1.isLevel1) {
    return {
      forcedLevel: 1,
      severity: 'Level 1 - Resuscitation (Immediate Life Threat)',
      ruleTriggered: true,
      triggers: level1.triggers,
      vitalCalib,
      clinicalRationale: `Forced ESI Level 1 due to critical deterministic safety trigger(s): ${level1.triggers.join('; ')}`
    };
  }

  const level2 = evaluateESILevel2(patientData, vitalCalib);
  if (level2.isLevel2) {
    return {
      forcedLevel: 2,
      severity: 'Level 2 - Emergent (High Risk / Time-Sensitive)',
      ruleTriggered: true,
      triggers: level2.triggers,
      vitalCalib,
      clinicalRationale: `Forced ESI Level 2 due to emergent clinical presentation: ${level2.triggers.join('; ')}`
    };
  }

  return {
    forcedLevel: null,
    ruleTriggered: false,
    triggers: [],
    vitalCalib,
    clinicalRationale: 'No immediate Level 1/2 deterministic rule breached. Proceed to differential scoring.'
  };
}

module.exports = {
  evaluateDeterministicRules
};
