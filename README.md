# PatientTriage.ai
### Intelligent Clinical Decision Support System for Emergency Department Triage

> **"AI Guides. Professional Decides."**  
> An assistive clinical co-pilot designed to reduce cognitive load, detect hidden physiological deterioration, and streamline emergency intake without replacing clinician judgment.

---

## 1. Problem Context & Clinical Urgency

Emergency Departments (EDs) operate under extreme cognitive pressure, unpredictable patient influx, and high diagnostic uncertainty. In many healthcare settings—particularly across high-volume tertiary hospitals in developing countries—the nurse-to-patient ratio in emergency wards frequently exceeds **1:10 to 1:20**, far above the **1:4** ratio recommended by the World Health Organization (WHO).

Under standard hospital operations, triage is typically conducted as a **static, 60-second snapshot** at the front door. However, emergency clinical realities present critical challenges:

1. **Atypical & Ambiguous Presentations**: Certain patient populations (such as diabetic, immunocompromised, or geriatric individuals) frequently present with silent or atypical symptoms (e.g., severe myocardial ischemia presenting only as mild epigastric discomfort and fatigue).
2. **Age-Bracket Physiological Variance**: Standard adult vital sign thresholds do not apply to pediatric or elderly populations. A heart rate of 145 bpm is normal in an infant but indicates severe tachycardia in an octogenarian; conversely, geriatric sepsis often presents as hypothermia rather than high fever.
3. **Asymmetric Risk of Error**: In emergency triage, under-triaging a deteriorating patient carries catastrophic, life-threatening consequences, whereas over-triaging a stable case incurs only minor operational delay. Standard statistical models optimized for average accuracy introduce silent safety risks.
4. **Triage Decay & Waiting Room Deterioration**: A patient's physiological state is continuous, not static. Patients waiting for extended periods in overcrowded waiting rooms often deteriorate unnoticed before seeing a physician.
5. **Documentation Fatigue**: Clinicians spend significant time manually entering vitals, chief complaints, and handover notes, reducing direct patient interaction time.

**PatientTriage.ai** addresses these challenges by providing a real-time, explainable clinical co-pilot that continuously assesses patient trajectory, applies age-calibrated physiological baselines, enforces fail-safe safety rules, and maintains full clinician oversight.

---

## 2. Core Architecture & Technical Highlights

```
                          ┌─────────────────────────────────────────┐
                          │         PATIENT INTAKE & SENSING        │
                          │ Voice-to-Text • Calibrated Vitals • EHR │
                          └────────────────────┬────────────────────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                     ▼
    ┌────────────────────────────────┐                  ┌────────────────────────────────┐
    │  LAYER 1: DETERMINISTIC RULES  │                  │  LAYER 2: LLM CLINICAL REASON  │
    │      (Non-Negotiable Safety)   │                  │     (Google Gemini Co-Pilot)   │
    ├────────────────────────────────┤                  ├────────────────────────────────┤
    │ • Hardcoded Red-Flag Triggers  │                  │ • Differential Risk Synthesis  │
    │ • GCS ≤ 8, SpO₂ < 85%, Stridor │                  │ • Atypical Presentation Flag   │
    │ • PALS Pediatric Vital Bands   │                  │ • 3 High-Yield Probing Qs      │
    └────────────────┬───────────────┘                  └────────────────┬───────────────┘
                     │                                                   │
                     └─────────────────────────┬─────────────────────────┘
                                               ▼
                    ┌─────────────────────────────────────────────────────┐
                    │      ASYMMETRIC UNCERTAINTY & ESCALATION ENGINE     │
                    │   Missing Data Penalty • Dynamic Safety Escalation  │
                    └──────────────────────────┬──────────────────────────┘
                                               ▼
                    ┌─────────────────────────────────────────────────────┐
                    │       CONTINUOUS TRIAGE & DETERIORATION ENGINE      │
                    │   Live SLA Monitoring • Automated Re-Triage Alarms  │
                    └──────────────────────────┬──────────────────────────┘
                                               ▼
                    ┌─────────────────────────────────────────────────────┐
                    │      CLINICIAN OVERRIDE & COMPLIANT AUDIT TRAIL     │
                    │    1-Click Override • SBAR Note • ABDM/DISHA Log    │
                    └─────────────────────────────────────────────────────┘
```

### Key Technical Modules:

- **Multi-Cohort Physiological Calibrator (`vitalCalibrator.js`)**:
  Calibrates vitals across 5 distinct age cohorts (*Infant $<1\text{y}$, Toddler $1-5\text{y}$, School Age $6-12\text{y}$, Adult $13-64\text{y}$, Geriatric $65+\text{y}$*) using Pediatric Advanced Life Support (PALS) and Geriatric Emergency Medicine benchmarks.

- **Deterministic Safety Rule Engine (`safetyRuleEngine.js`)**:
  Enforces hard clinical boundaries based on Emergency Severity Index (ESI) Level 1 and Level 2 protocols. If critical physiological failure or red-flag symptoms are identified, the system locks priority to Level 1/2, preventing any downstream model from downgrading the case.

- **Asymmetric Risk & Uncertainty Engine (`uncertaintyEngine.js`)**:
  Audits missing telemetry, zero-history arrivals (unlinked to prior EHR), and ambiguous presentations. When clinical uncertainty exceeds 35%, the engine applies a deliberate fail-safe escalation (e.g., promoting ESI 3 to ESI 2) with explicit reasoning.

- **Continuous Triage & Deterioration Monitor (`patientStore.js`)**:
  Tracks waiting patients against safe maximum waiting thresholds (ESI 2: 10 mins, ESI 3: 30 mins, ESI 4: 60 mins). When an SLA is exceeded or updated vitals show decompensation, the system triggers real-time visual alerts and reprioritizes the queue.

- **Ambient Voice Intake & SBAR Generator (`triageRoutes.js` / `geminiService.js`)**:
  Transcribes clinical dictation, parses symptoms/vitals automatically, and formats instant **Situation-Background-Assessment-Recommendation (SBAR)** handover sheets for attending physicians.

- **Tamper-Evident Regulatory Audit Trail (`auditService.js`)**:
  Immutably logs every automated recommendation, confidence metric, clinician override rationale, and digital signature in compliance with **ABDM Level-2**, **DISHA Act 2024**, and **HIPAA/GDPR** standards.

---

## 3. Clinical Severity Scoring & Dynamic Queue Prioritization Formulas

To ensure that high-acuity life threats are never deprioritized and that queue ordering is mathematically transparent, **PatientTriage.ai** implements a multi-stage scoring architecture:

### Step 1: Age-Calibrated Physiological Risk Score ($S_{\text{physio}} \in [0, 10]$)
Every incoming vital sign is tested against cohort-specific normal bands:
$$S_{\text{physio}} = \sum_{v \in \text{Vitals}} w_v \cdot \mathbb{I}\big(v \notin \text{NormalCohortRange}(\text{Age})\big)$$

Where clinical parameter weights are assigned as:
- $\text{SpO}_2$ Derangement ($w = 3$)
- Heart Rate ($w = 2$)
- Systolic / Diastolic Blood Pressure ($w = 2$)
- Respiratory Rate ($w = 2$)
- Core Body Temperature ($w = 1$)

### Step 2: Deterministic Safety Floor ($L_{\text{det}}$)
Before generative reasoning, deterministic hard triggers establish an unbreakable safety floor:
$$L_{\text{det}} = \begin{cases} 
1 \text{ (Resuscitation)} & \text{if GCS} \le 8 \lor \text{SpO}_2 \le 85\% \lor \text{Arrest / Apnea} \lor \text{Anaphylactic Shock} \\
2 \text{ (Emergent)} & \text{if Atypical ACS} \lor \text{FAST Stroke} \lor \text{PALS Stridor} \lor \text{Geriatric Hypothermic Sepsis} \\
\text{Standard} & \text{otherwise}
\end{cases}$$

### Step 3: Asymmetric Clinical Uncertainty Index ($U \in [0, 100\%]$)
To account for zero-history patients and unrecorded vitals:
$$U = \min\left(100,\, P_{\text{missing\_vitals}} + P_{\text{zero\_history}}(15\%) + P_{\text{ambiguity}}\right)$$
$$\text{If } U \ge 35\% \text{ and Raw ESI} = 3 \implies \text{Escalate to ESI 2 (Fail-Safe)}$$

### Step 4: Explicit 0-100 Clinical Severity Score ($S_{\text{severity}}$)
Each patient is assigned a normalized 0-100 Severity Score:
$$S_{\text{severity}} = \text{Base}(\text{ESI}) + \min(6, 1.5 \times S_{\text{physio}}) + (6 \times \mathbb{I}_{\text{DeteriorationAlert}}) + \min\left(6, \lfloor T_{\text{waited}} / 6 \rfloor\right)$$

- **ESI 1 (Resuscitation)**: $94 - 100$ (Critical Life Threat)
- **ESI 2 (Emergent)**: $76 - 94$ (Emergent Intervention)
- **ESI 3 (Urgent)**: $45 - 75$ (Urgent Hospital Care)
- **ESI 4 (Less Urgent)**: $25 - 44$ (Ambulatory Fast-Track)
- **ESI 5 (Non-Urgent)**: $5 - 24$ (Minimal Risk / Routine)

### Step 5: Strict Severity-Descending Queue Ordering
The emergency queue is strictly ordered by **Severity Score descending**:
$$\text{Patient}_A \succ \text{Patient}_B \iff S_{\text{severity}}(A) > S_{\text{severity}}(B)$$
*Patients with higher severity scores always appear first at Rank #1, #2, etc. Within the same score tier, patients who have waited longer move up first.*

### Step 6: Dynamic Estimated Time to Consultation (ETA)
$$\text{ETA}(\text{Patient}_k) = \begin{cases} 
\text{Immediate (Resus Bay)} & \text{if ESI} = 1 \lor S_{\text{severity}} \ge 90 \\
\max\left(0, \text{round}\left(\frac{(k - 1) \times T_{\text{avg\_consult}}}{N_{\text{active\_doctors}}}\right)\right) & \text{otherwise}
\end{cases}$$
Where $k$ is the patient's queue position, $T_{\text{avg\_consult}} = 12\text{ mins}$, and $N_{\text{active\_doctors}} = 3$ (or $4$ in surge mode).

---

## 4. Benchmark Dataset & Patient Inflow

The prototype includes **50 comprehensive, high-fidelity benchmark clinical patient cases** (`backend/data/simulatedPatients.js`) covering:
- **Major Resuscitations**: Tension pneumothorax, hemorrhagic shock polytrauma, acute stroke, organophosphate poisoning, sedative overdose coma.
- **High-Risk Emergent Cases**: Geriatric atypical MI, pediatric stridor, hypothermic sepsis, ruptured ectopic pregnancy, exertional heat stroke, snakebite envenomation.
- **Urgent Cases**: Acute appendicitis, pyelonephritis, renal colic, pneumonia, Colles fracture, stable SVT.
- **Ambulatory & Non-Urgent**: Ankle sprain, kitchen laceration, partial thickness burn, BPPV, routine medication refills.

### Dynamic Patient Inflow:
- **`+ Add 10 More Patients`**: Clicking this button randomly samples from the 50 clinical benchmark cases, generates realistic demographic names and vital jitter, and additively injects 10 arrivals into the queue. The queue instantly re-ranks all patients by severity score.
- **Self-Intake**: Clinicians can also add their own custom patients at any time via the manual intake form or ambient voice dictation.

---

## 5. Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Intelligence Engine**: Google Gemini API (`@google/generative-ai`) paired with a robust deterministic clinical fallback engine
- **Data & Queue State**: In-memory high-speed store with MongoDB Atlas cloud persistence
- **Security & Audit**: SHA-256 anonymized health hashing, ISO 8601 audit timestamps

### Frontend
- **Framework**: React 18 (Vite build system)
- **Styling**: Tailwind CSS (custom clinical palette with dark-mode contrast)
- **Icons**: Lucide React (standardized clinical and interface iconography)
- **State & Networking**: Axios with reactive polling

---

## 6. Repository Structure

```
PatientTriage.ai/
├── backend/
│   ├── data/
│   │   └── simulatedPatients.js      # 50 Diverse clinical benchmark test cases
│   ├── models/
│   │   ├── PatientModel.js           # Mongoose patient cloud persistence schema
│   │   ├── AuditLogModel.js          # Mongoose immutable audit schema
│   │   └── patientStore.js           # Live queue state, continuous triage & surge logic
│   ├── routes/
│   │   ├── triageRoutes.js           # Live scoring, vital calibration, NLP voice intake
│   │   ├── patientRoutes.js          # Queue CRUD, batch arrivals, clinician overrides
│   │   ├── auditRoutes.js            # ABDM/DISHA compliance audit API
│   │   └── statsRoutes.js            # ED command center telemetry API
│   ├── services/
│   │   ├── vitalCalibrator.js        # Age-cohort vital sign normalization engine
│   │   ├── safetyRuleEngine.js       # Deterministic ESI Level 1/2 safety triggers
│   │   ├── uncertaintyEngine.js      # Asymmetric uncertainty & escalation bias
│   │   ├── geminiService.js          # Google Gemini AI service + offline clinical fallback
│   │   └── auditService.js           # ABDM/DISHA compliant tamper-evident logger
│   ├── server.js                     # Main Express server
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # Command center status, surge toggle, tabs
│   │   │   ├── StatsOverview.jsx     # Real-time ED telemetry cards
│   │   │   ├── QueueDashboard.jsx    # Live dynamic queue table, severity scores & ETA
│   │   │   ├── PatientIntakeModal.jsx # Rapid intake, voice parser & AI co-pilot modal
│   │   │   ├── PatientDetailModal.jsx # Deep clinical telemetry & differential diagnosis
│   │   │   ├── ClinicianOverrideModal.jsx # 1-Click override with DISHA audit signing
│   │   │   ├── VitalsRecheckModal.jsx # Continuous triage re-assessment simulator
│   │   │   ├── DoctorHandoverModal.jsx   # Automated SBAR physician handover sheet
│   │   │   ├── AuditLogViewer.jsx    # ABDM / DISHA compliance audit table
│   │   │   └── SurgeSimulationPanel.jsx # 3x Surge load & time fast-forward panel
│   │   ├── services/
│   │   │   └── api.js                # Axios client for backend API
│   │   ├── App.jsx                   # Root application
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind CSS clinical styling
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 7. Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm start
```
The backend service will start on **`http://localhost:5000`** with a clean queue ready for manual intake or batch loading.

### 2. Frontend Setup
In a separate terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The web dashboard will be accessible at **`http://localhost:3000`**.

### 3. Environment Variables (Optional)
The system includes full offline clinical reasoning and works immediately out of the box. To optionally enable generative Gemini LLM reasoning:

In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 8. Functional Walkthrough

1. **Live Emergency Department Command Center**:
   - Real-time queue view sorted strictly by **Severity Score (0 - 100)** with explicit Queue Ranks (`#1, #2, ...`) and dynamic consultation ETAs.
   - Filter by specific clinical cohorts (*Pediatric, Geriatric, Zero-History, High Uncertainty, Overridden, or SLA Breached*).
   - Use **`+ Add 10 More Patients`** to additively inject random cohorts that immediately self-sort into severity positions.

2. **Rapid Patient Intake & Voice Co-Pilot**:
   - Allows nurses to enter patient vitals, chief complaints, and past medical history manually.
   - Includes an ambient voice transcription parser that extracts clinical symptoms and vitals directly from speech dictation.
   - Generates real-time ESI scoring, confidence metrics, missing data penalties, and 3 targeted follow-up probing questions.

3. **1-Click Clinician Override & Audit Logging**:
   - Clinicians can override any AI recommendation with a single click.
   - Overrides require structured justification categories (e.g., *atypical distress, high uncertainty surgical risk, pediatric decompensation*), a clinical note, and an electronic signature token logged directly to the immutable audit trail.

4. **Dynamic Waiting Room Deterioration Tracking**:
   - Allows clinicians to re-record vitals for waiting patients.
   - If physiological parameters deteriorate or waiting time exceeds safe SLA limits, the system raises visual alarms and automatically re-ranks the patient to the top of the queue.

5. **Physician SBAR Clinical Handover**:
   - Generates a complete, structured SBAR clinical note ready for 1-click clipboard copy or printing for attending physicians.

6. **Surge Mode & Time Fast-Forward Simulation**:
   - Toggle between standard operating load ($1\times$) and acute surge ($3\times$). In surge mode, the system automatically redirects low-acuity cases (ESI 4 & 5) to fast-track ambulatory care while protecting critical resuscitation bays.

---

## 9. Regulatory & Safety Compliance

- **Human-in-the-Loop Architecture**: AI acts strictly as an advisory layer. Every decision remains fully overridable by licensed medical staff.
- **Ayushman Bharat Digital Mission (ABDM Level-2)**: Supports unique health ID (ABHA) resolution and tokenized health record hashing.
- **Digital Information Security in Healthcare Act (DISHA)**: Implements tamper-evident audit logging, statutory 7-year retention schemas, and structured justification capture.
- **Data Privacy**: No persistent personal health information (PHI) is transmitted or stored unencrypted. All records are tokenized with SHA-256 hashes.

---

## 10. Authors & Team Details

**Team 404ers (IIT Kharagpur)**
- **Mohit Pant** (Team Leader) — Mining Engineering (B.Tech + M.Tech, 2027)
- **Vidit Om** — Mechanical Engineering + AI/ML (B.Tech + M.Tech, 2027)
- **Hrushabh Bodhe** — Mechanical Engineering + Financial Engineering (B.Tech + M.Tech, 2027)
