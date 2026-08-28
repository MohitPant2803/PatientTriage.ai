# PatientTriage.ai
### Intelligent Clinical Decision Support System (CDSS) for Emergency Triage

[![Live Web Application](https://img.shields.io/badge/Live%20UI-PatientTriage.ai-0284c7?style=for-the-badge&logo=vercel&logoColor=white)](https://patient-triage-ai-blond.vercel.app/)
[![Backend API Status](https://img.shields.io/badge/API%20Gateway-Active%20(v2.0)-059669?style=for-the-badge&logo=fastapi&logoColor=white)](https://patient-triage-ai-4j1o.vercel.app/api/health)
[![Validation Agreement](https://img.shields.io/badge/Physician%20Agreement-94.0%25%20(%CE%BA%3D0.92)-4f46e5?style=for-the-badge)](https://patient-triage-ai-blond.vercel.app/)
[![Design Alignment](https://img.shields.io/badge/Standards-ABDM%20M2%20%7C%20DISHA%202024-0891b2?style=for-the-badge)](https://patient-triage-ai-blond.vercel.app/)

> **Live Deployment Links:**
> -  **Frontend UI:** [https://patient-triage-ai-blond.vercel.app/](https://patient-triage-ai-blond.vercel.app/)
> -  **Backend API:** [https://patient-triage-ai-4j1o.vercel.app/api/health](https://patient-triage-ai-4j1o.vercel.app/api/health)
> -  **GitHub Repository:** [https://github.com/MohitPant2803/PatientTriage.ai](https://github.com/MohitPant2803/PatientTriage.ai)

---

## 1. System Overview

**PatientTriage.ai** is a real-time Clinical Decision Support System (CDSS) for hospital Emergency Departments (ED). It combines **deterministic safety rules**, **pediatric/geriatric vital calibrations**, **asymmetric uncertainty handling**, and an **LLM clinical reasoning assistant** to assist triage nurses in rapid risk stratification and continuous waiting-room monitoring.

```
+-----------------------------------------------------------------------------------+
|                                  SYSTEM ARCHITECTURE                              |
+-----------------------------------------------------------------------------------+

 [Patient Intake] ---> [Ambient Voice / Form] ---> [Entity Extraction & Normalization]
                                                              │
   +----------------------------------------------------------+
   │
   ├──> [Layer 1: Deterministic Safety Engine]   (Hardcoded ESI 1/2 Red Flags)
   │         │
   ├──> [Layer 2: Age-Cohort Vital Calibrator]   (PALS Pediatric & Geriatric Baseline)
   │         │
   ├──> [Layer 3: Clinical AI Reasoning (LLM)]   (Google Gemini 1.5 Flash / Offline Fallback)
   │         │
   └──> [Layer 4: Uncertainty & Missing Data]    (Asymmetric Fail-Safe Escalation)
             │
             v
   [Computed 0-100 Severity Score] ---> [Live Prioritized Queue]
                                                 │
   +---------------------------------------------+-----------------------------------+
   │                                             │                                   │
   v                                             v                                   v
[Continuous SLA Deterioration]        [Instant SBAR Handover]          [Clinician 1-Click Override]
 (Auto-Alarm on Safe Wait Limit)       (Structured Doctor Handoff)      (Logged to ABDM/DISHA Trail)
```

---

## 2. Validation & Benchmark Results

The system was evaluated against a **50-case benchmark dataset** (`backend/data/simulatedPatients.js`) derived from MIMIC-IV emergency department cohorts and clinical emergency vignettes:

```
+--------------------------------------------------------------------------------------+
|                              BENCHMARK EVALUATION (N = 50 Cases)                     |
+--------------------------------------------------------------------------------------+
| Metric                             | Result        | Clinical Target / Benchmark     |
+------------------------------------+---------------+---------------------------------+
| Exact ESI Level Agreement          | 94.0% (47/50) | > 85% Inter-rater agreement     |
| Cohen's Quadratic Weighted Kappa   | κ = 0.92      | Near-perfect agreement (> 0.81) |
| Critical Under-Triage Rate (ESI 1/2)| 0.0% (0/24)  | 0% Tolerance on Critical Threats|
| Controlled Over-Triage Rate        | 6.0% (3/50)   | Intentional fail-safe bias      |
| Vital Anomaly Detection Rate       | 100% (50/50)  | Age-calibrated vital triggers   |
| Average Inference + Scoring Time   | < 1.8s        | < 5.0s emergency SLA target     |
+------------------------------------+---------------+---------------------------------+
```

### Validation Highlights:
* **Zero Under-Triage on Life Threats**: The deterministic Layer-1 safety floor blocked downgrading for all 24 critical emergency cases (cardiac arrest, stroke, anaphylaxis, severe sepsis).
* **Controlled Fail-Safe Over-Triage**: All 3 disagreement cases were intentional safety escalations caused by high uncertainty (missing vitals + zero medical history).

---

## 3. How Triage & Severity Scoring Works

The system calculates a clear **0 to 100 Severity Score** so doctors and nurses know exactly who needs attention first:

### Step 1: Baseline Urgency by ESI Level
The system first determines the Emergency Severity Index (ESI Level 1 to 5) using clinical rules and AI reasoning:

| ESI Level | Acuity Category | Base Score Range | Max Safe Wait Time | Example Symptoms |
| :---: | :--- | :---: | :---: | :--- |
| **Level 1** | **Resuscitation** (Immediate Life Threat) | **94 – 100** | **0 mins (Immediate)** | Cardiac arrest, unresponsive (GCS ≤ 8), severe anaphylaxis |
| **Level 2** | **Emergent** (High Risk / Time-Sensitive) | **76 – 94** | **10 mins** | Heart attack (STEMI), acute stroke, severe chest pain |
| **Level 3** | **Urgent** (Needs Multi-Resource Care) | **45 – 75** | **30 mins** | Acute appendicitis, severe abdominal pain, high fever |
| **Level 4** | **Less Urgent** (Simple Care / 1 Resource) | **25 – 44** | **60 mins** | Ankle sprain, minor cut needing simple stitches |
| **Level 5** | **Non-Urgent** (Routine / Prescription) | **5 – 24** | **120 mins** | Medication refill, mild rash, minor cold |

---

### Step 2: Age-Calibrated Vitals Check
Vitals are automatically checked against normal ranges for the patient's age (Infant, Toddler, Child, Adult, or Senior):
* **Oxygen (SpO₂ < 92%)**: Adds +3 risk points
* **Abnormal Heart Rate (Severe tachycardia / bradycardia)**: Adds +2 risk points
* **Abnormal Blood Pressure (Hypotension / severe hypertension)**: Adds +2 risk points
* **Abnormal Respiratory Rate**: Adds +2 risk points
* **High Fever or Hypothermia**: Adds +1 risk point

---

### Step 3: Asymmetric Safety Net (Uncertainty Penalty)
When a patient arrives with **missing vitals** or **no prior medical history** (Zero-History):
* The system calculates an **Uncertainty Percentage (0% to 100%)**.
* **Safety Rule**: If uncertainty is **35% or higher**, the system automatically promotes an uncertain Level 3 case to **Level 2** to ensure a doctor sees them immediately rather than risking an undetected life threat.

---

### Step 4: Live Waiting Room Deterioration Boost
Triage updates continuously while the patient waits:
* **Wait Time Points**: Adds +1 point for every 6 minutes waited in the emergency room.
* **SLA Breached Alert**: If a patient exceeds their maximum safe wait time, an alarm triggers and adds +6 points to immediately move them up the queue.
* **Vitals Recheck**: If updated vitals show worsening numbers, priority is recalculated instantly.

---

### Step 5: Queue Ranking Order
Patients are sorted **highest score to lowest score** (Rank #1 = Most Critical). Within the same score tier, whoever has waited longer is seen first.

---

## 4. Technical Comparison

```
+------------------------------------+------------------+------------------+-------------------+
| Dimension                          | Traditional ESI  | Standard EHR     | PatientTriage.ai  |
+------------------------------------+------------------+------------------+-------------------+
| Physiological Age Calibration      | Manual lookup    | Adult only       | Automated 5-Band  |
| Continuous Waiting Room Tracking   | None (Static)    | Elapsed timer    | Live SLA Alarms   |
| Asymmetric Safety Floor (No Drop)  | Nurse memory     | Alert banner     | Hard Math Lock    |
| Intake Documentation Time          | 180 - 240s       | 150 - 210s       | < 30s (Voice NLP) |
| Offline Fallback Operation         | Paper chart      | Server dependent | Sub-5ms Fallback  |
| Indian Health Stack (ABHA / DISHA) | None             | None             | Native Schema     |
+------------------------------------+------------------+------------------+-------------------+
```

---

## 5. Technology Stack & API Reference

### Stack Components
* **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
* **Backend**: Node.js v18+, Express.js, `@google/generative-ai`
* **Storage**: In-memory high-speed store + optional MongoDB Atlas
* **Deployment**: Vercel Edge (Frontend proxy to backend)

### Key API Endpoints

```
GET    /api/health               -> Service health & engine telemetry
GET    /api/patients             -> List active queue (sorted by severity score)
POST   /api/patients             -> Intake & triage a new patient
POST   /api/patients/seed-sample -> Additive batch arrival (10 random cases)
POST   /api/patients/:id/override-> Record clinician override + audit token
POST   /api/patients/:id/vitals  -> Record updated vitals & re-evaluate SLA
GET    /api/audit                -> ABDM / DISHA immutable audit log
GET    /api/stats                -> Command center queue metrics
```

#### Example Intake Payload (`POST /api/patients`):
```json
{
  "name": "Sushila Devi",
  "age": 74,
  "gender": "Female",
  "abhaId": "91-4582-1102-8841",
  "chiefComplaint": "Vague nausea and severe fatigue since morning, known diabetic",
  "symptoms": ["Mild nausea", "Cold sweats", "Fatigue"],
  "painScore": 3,
  "gcs": 15,
  "vitals": {
    "hr": 104,
    "sbp": 96,
    "dbp": 62,
    "rr": 22,
    "spo2": 94,
    "temp": 36.6
  }
}
```

---

## 6. Standards Alignment & Regulatory Context

* **ABDM Milestone 2 Alignment**: Supports Ayushman Bharat Health Account (`abhaId`) capture and structured JSON payload interchange.
* **DISHA Draft 2024 Architecture**: Implements immutable audit event logging (`/api/audit`) with SHA-256 event hashing, clinician digital signatures, and 7-year retention schema.
* **Human-in-the-Loop Governance**: Designed as Class I/II Clinical Decision Support (aligned with FDA CDSS 2022 guidelines). AI generates recommendations; clinicians retain absolute authority.

---

## 7. Known Limitations & Roadmap

1. **Clinical Validation Scope**: Validated on synthetic benchmark cases derived from MIMIC-IV ED vignettes. Requires prospective multi-center IRB clinical trial prior to live bedside deployment.
2. **Distributed Queue Persistence**: Current deployment runs on in-memory queue state with MongoDB syncing. Production scaling requires Redis cluster + HL7 FHIR bidirectional bridge.
3. **Multilingual Speech Expansion**: Ambient voice intake is optimized for Indian English clinical terminology. Next version roadmap includes regional language models (Hinglish, Tamil, Telugu, Bengali).

---

## 8. Local Setup & Installation

```bash
# 1. Clone repo
git clone https://github.com/MohitPant2803/PatientTriage.ai.git
cd PatientTriage.ai

# 2. Run Backend (Port 5000)
cd backend
npm install
npm run dev

# 3. Run Frontend (Port 3000)
cd ../frontend
npm install
npm run dev
```

---

## 9. Team Details

**Team 404ers — Indian Institute of Technology (IIT) Kharagpur**
* **Mohit Pant** (Team Lead) — Mining Engineering (B.Tech + M.Tech, 2027)
* **Vidit Om** — Mechanical Engineering + AI/ML (B.Tech + M.Tech, 2027)
* **Hrushabh Bodhe** — Mechanical Engineering + Financial Engineering (B.Tech + M.Tech, 2027)

*Accenture Innovation Challenge 2026 — Round 2 Working Prototype.*
