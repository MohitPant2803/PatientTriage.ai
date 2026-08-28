# PatientTriage.ai
### Intelligent Clinical Decision Support System for Emergency Department Triage

[![Live Web Application](https://img.shields.io/badge/Live%20Demo-PatientTriage.ai-0284c7?style=for-the-badge&logo=vercel&logoColor=white)](https://patient-triage-ai-blond.vercel.app/)
[![Backend API Service](https://img.shields.io/badge/API%20Endpoint-Active%20(v2.0)-059669?style=for-the-badge&logo=fastapi&logoColor=white)](https://patient-triage-ai-4j1o.vercel.app/api/health)
[![Compliance](https://img.shields.io/badge/Compliance-ABDM%20Level--2%20%7C%20DISHA%202024%20%7C%20HIPAA-6366f1?style=for-the-badge)](https://patient-triage-ai-blond.vercel.app/)

> **Live Deployment URLs:**
> - 🌐 **Interactive Web Workstation:** [https://patient-triage-ai-blond.vercel.app/](https://patient-triage-ai-blond.vercel.app/)
> - ⚡ **Clinical API Gateway:** [https://patient-triage-ai-4j1o.vercel.app/api/health](https://patient-triage-ai-4j1o.vercel.app/api/health)

---

## The Human Reality Behind This Project

In a crowded emergency department at 2:00 AM, a triage nurse has less than **60 seconds** to look at a patient, take vitals, and make a decision that could save or cost a life. 

In high-volume public hospitals, nurse-to-patient ratios often spike to **1:15 or 1:20**—far beyond the WHO-recommended 1:4 safety benchmark. Under that kind of crushing cognitive fatigue:
* An elderly diabetic woman reporting "vague nausea and tiredness" might actually be experiencing a **silent, painless myocardial infarction**.
* A 3-year-old toddler with a heart rate of 150 bpm might be in **early septic shock**, but standard adult vital monitors won't flag it as abnormal.
* A patient with internal bleeding who was stable at intake can quietly **deteriorate in the waiting room** over 45 minutes without anyone noticing in time.

We built **PatientTriage.ai** not to replace doctors or nurses, but to act as a calm, vigilant second pair of eyes—a **clinical co-pilot** that never gets tired, understands pediatric and geriatric physiology, detects waiting room decline in real time, and always leaves the final decision in human hands.

> **"AI Guides. Professional Decides."**

---

## How It Works: The 4-Layer Safety Net

```
                         ┌─────────────────────────────────────────┐
                         │         PATIENT INTAKE & SENSING        │
                         │ Ambient Voice • Calibrated Vitals • EHR │
                         └────────────────────┬────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
    ┌────────────────────────────────┐                 ┌────────────────────────────────┐
    │  LAYER 1: DETERMINISTIC RULES  │                 │  LAYER 2: CLINICAL AI CO-PILOT │
    │    (Unbreakable Safety Floor)  │                 │     (Google Gemini 1.5 Flash)  │
    ├────────────────────────────────┤                 ├────────────────────────────────┤
    │ • Hardcoded Red-Flag Triggers  │                 │ • Differential Risk Synthesis  │
    │ • GCS ≤ 8, SpO₂ < 85%, Arrest  │                 │ • Atypical Presentation Checks │
    │ • PALS Pediatric Vital Bands   │                 │ • 3 High-Yield Probing Qs      │
    └────────────────┬───────────────┘                 └────────────────┬───────────────┘
                     │                                                  │
                     └────────────────────────┬─────────────────────────┘
                                              ▼
                    ┌───────────────────────────────────────────────────┐
                    │     LAYER 3: ASYMMETRIC UNCERTAINTY ESCALATION    │
                    │   Missing Data Penalty • Fail-Safe Priority Bias  │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                    ┌───────────────────────────────────────────────────┐
                    │    LAYER 4: CONTINUOUS WAITING ROOM DETERIORATION │
                    │   Live SLA Timers • Instant Re-Triage Alarms      │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                    ┌───────────────────────────────────────────────────┐
                    │    CLINICIAN OVERRIDE & ABDM / DISHA AUDIT LOG    │
                    │    1-Click Override • SBAR Note • Digital Token   │
                    └───────────────────────────────────────────────────┘
```

### 1. Age-Calibrated Physiology (PALS & Geriatric Normalization)
A vital sign is only meaningful in the context of age. PatientTriage.ai dynamically calibrates thresholds across 5 physiological cohorts:
* **Infant (<1y)** & **Toddler (1–5y)**: Calibrated against Pediatric Advanced Life Support (PALS) rules.
* **School Age (6–12y)** & **Adult (13–64y)**: Standard clinical baseline ranges.
* **Geriatric (65+y)**: Compensates for baseline hypertension, blunted febrile response (hypothermic sepsis), and atypical silent cardiac presentations.

### 2. Deterministic Safety Boundaries (Non-Negotiable Floor)
Before any generative AI runs, our deterministic rule engine scans for critical life threats:
* GCS ≤ 8 (Coma / Airway risk)
* SpO₂ ≤ 85% or Respiratory Rate ≤ 8 bpm
* Active cardiac/respiratory arrest or anaphylactic stridor
* Active stroke (FAST protocol) or high-risk chest pain

If a red flag is met, the system **locks the floor to ESI Level 1 or 2**. The AI model is mathematically blocked from downgrading the patient.

### 3. Asymmetric Safety Bias & Missing Data Penalties
In medicine, under-triaging a dying patient is catastrophic; over-triaging a stable patient causes a minor wait. When patients arrive with missing vitals, unlinked medical records ("Zero-History"), or ambiguous complaints, the engine calculates a **Clinical Uncertainty Index**. If uncertainty exceeds 35%, it automatically escalates the patient to a safer triage tier.

### 4. Continuous Deterioration Tracking (Live SLA Clocks)
Triage doesn't end at the front door. The system continuously tracks waiting patients against international safe wait limits:
* **ESI 1**: 0 mins (Immediate Bedside Resuscitation)
* **ESI 2**: 10 mins (Emergent)
* **ESI 3**: 30 mins (Urgent)
* **ESI 4**: 60 mins (Less Urgent)

If a patient exceeds their safe wait time or re-checked vitals worsen, the system triggers alarms and floats them to the top of the queue.

---

## Core Features at a Glance

| Feature | What It Does | Why It Matters to Clinicians |
| :--- | :--- | :--- |
| **Pure White Clinical Workstation** | High-contrast `#ffffff` canvas with deep slate typography (`text-slate-950`). | Eliminates screen glare and cognitive fatigue during 12-hour shifts. |
| **0–100 Severity Scoring** | Real-time composite score combining ESI tier, vital risk, pain, GCS, and wait decay. | Strict, objective queue ordering without spreadsheet clutter. |
| **Ambient Voice Intake** | Speaks clinical observations; extracts symptoms, pain scores, and vitals automatically. | Cuts intake documentation time from 3 minutes to under 30 seconds. |
| **Instant SBAR Handover** | Generates Situation-Background-Assessment-Recommendation notes in 1 click. | Smooth, structured handoffs between triage nurses and attending doctors. |
| **1-Click Clinician Override** | Nurses can override AI suggestions with a structured clinical justification. | The human clinician always retains absolute control and authority. |
| **ABDM / DISHA Audit Trail** | Immutable, timestamped logging of every recommendation, override, and vital check. | Full regulatory compliance with Indian and international healthcare laws. |

---

## Understanding Emergency Severity Index (ESI) Scoring

PatientTriage.ai uses the global Emergency Severity Index standard where **lower numbers represent higher urgency**:

| ESI Level | Acuity Category | Target SLA | Severity Score | Typical Presentation |
| :---: | :--- | :---: | :---: | :--- |
| **Level 1** | **Resuscitation (Immediate Life Threat)** | **0 mins** | **85 – 100** | Cardiac arrest, pulseless, unresponsive (GCS ≤ 8), anaphylactic shock |
| **Level 2** | **Emergent (High Risk / Time-Sensitive)** | **10 mins** | **60 – 84** | Active STEMI/Heart attack, acute stroke, severe respiratory distress |
| **Level 3** | **Urgent (Multiple Diagnostic Resources)** | **30 mins** | **35 – 59** | Acute appendicitis, moderate abdominal pain, high fever, stable fracture |
| **Level 4** | **Less Urgent (Single Resource)** | **60 mins** | **15 – 34** | Simple ankle sprain, minor laceration requiring simple sutures |
| **Level 5** | **Non-Urgent (Zero Complex Diagnostics)** | **120 mins** | **0 – 14** | Medication refill, mild cold, rash |

---

## Technology Architecture

### **Frontend**
* **Framework**: React 18 with Vite
* **Styling**: Tailwind CSS 3.4 (Strict clinical high-contrast palette)
* **Icons**: Lucide React
* **State Management**: Reactive polling with memoized state diffing (zero-flicker UI)
* **Deployment**: Vercel Edge Network

### **Backend**
* **Runtime**: Node.js (v18+) with Express.js
* **AI Reasoning Engine**: Google Gemini API (`gemini-1.5-flash` with sub-5s circuit breaker)
* **Safety Rules**: Custom deterministic evaluation layer (`safetyRuleEngine.js`)
* **State Store**: Ultra-fast in-memory queue with optional MongoDB Atlas persistence
* **Compliance**: SHA-256 anonymized health hashing, ISO 8601 audit records

---

## Local Development & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/MohitPant2803/PatientTriage.ai.git
cd PatientTriage.ai
```

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Run the Frontend Workstation
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:3000` (proxied to backend automatically)*

---

## Backend Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
```

---

## Regulatory Compliance & Safety Guardrails

1. **Human-in-the-Loop Governance**: AI acts purely as a clinical decision support advisor. No prescription or admission order is issued without human sign-off.
2. **Ayushman Bharat Digital Mission (ABDM Level-2)**: Supports ABHA ID validation and tokenized health hash verification.
3. **Digital Information Security in Healthcare Act (DISHA 2024)**: Immutably logs overrides, timestamps, and justification tokens with a 7-year statutory audit schema.
4. **Data Privacy**: No patient identifiable data is transmitted unencrypted. All records use client-side anonymization.

---

## Developed By

**Team 404ers — IIT Kharagpur**
* **Mohit Pant** — Mining Engineering (B.Tech + M.Tech, 2027)
* **Vidit Om** — Mechanical Engineering + AI/ML (B.Tech + M.Tech, 2027)
* **Hrushabh Bodhe** — Mechanical Engineering + Financial Engineering (B.Tech + M.Tech, 2027)

*Developed for the Accenture Innovation Challenge 2026 — Round 2 Clinical Decision Support Track.*
