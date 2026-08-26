# PatientTriage.ai — Emergency Clinical Decision Support System (v2.0)

**Accenture Innovation Challenge 2026 | Round 2 Submission**  
*Team 404ers (IIT Kharagpur) — Mohit Pant, Vidit Om, Hrushabh Bodhe*  
*"AI Guides. Professional Decides."*

---

## 1. Project Overview & Round 2 Innovations

PatientTriage.ai is an intelligent clinical decision support system engineered to transform Emergency Department (ED) triage from a static 60-second snapshot into a **dynamic, continuous risk-monitoring co-pilot**.

### Core Technical & Clinical Innovations:
1. **Multi-Cohort Physiological Calibrator**:
   - Dynamic baseline vital normalizations based on **PALS (Pediatric Advanced Life Support)** and **Geriatric Emergency Medicine** guidelines.
   - Prevents silent mis-triage (e.g., differentiating normal infant tachycardia from critical geriatric tachycardia; detecting occult hypothermic sepsis).
2. **Dual-Layer Hybrid Safety Engine**:
   - **Deterministic Hard Boundary**: Hardcoded red flags (GCS $\le 8$, $\text{SpO}_2 < 85\%$, stridor, active anaphylaxis) that LLMs *cannot downgrade*.
   - **Google Gemini Clinical Co-Pilot**: Differential diagnosis reasoning, atypical presentation detection, and dynamic probing questions.
3. **Asymmetric Risk & Fail-Safe Escalation Bias**:
   - Directly solves the asymmetric cost of errors: missing a critical case is fatal, while over-prioritizing a minor one is manageable.
   - Missing data (zero-history migrant arrivals, omitted vitals) is explicitly penalized and triggers automatic safety escalation (e.g., ESI 3 $\to$ ESI 2).
4. **Dynamic Waiting Room Deterioration Engine (Continuous Triage)**:
   - Actively monitors waiting patients against ESI safety SLA thresholds (ESI 2: 10m, ESI 3: 30m).
   - Automatically fires emergency re-assessment alerts when wait limits are breached or updated vitals show decompensation.
5. **Human-in-the-Loop Override & Regulatory Audit Trail**:
   - 1-click clinical override with mandatory structured justification.
   - Tamper-evident immutable audit log compliant with **ABDM Level-2**, **DISHA Act 2024**, and **HIPAA/GDPR** standards.
6. **Surge Mode Simulation (1x Normal $\to$ 3x Surge)**:
   - Dynamic load balancing that fast-tracks minor complaints (ESI 4/5) to outpatient bays while reserving critical resuscitation slots for ESI 1/2.
7. **Ambient Voice Dictation & Auto SBAR Handover**:
   - Voice dictation parser extracting vitals and chief complaints; instant generation of physician SBAR handover sheets.

---

## 2. Directory Structure

```
PatientTriage.ai/
├── backend/
│   ├── data/
│   │   └── simulatedPatients.js      # 20 Benchmark clinical cases
│   ├── models/
│   │   └── patientStore.js           # Dynamic queue state & in-memory store
│   ├── routes/
│   │   ├── triageRoutes.js           # Live scoring, vital calibration, NLP voice
│   │   ├── patientRoutes.js          # Queue CRUD, overrides, vitals update
│   │   ├── auditRoutes.js            # ABDM/DISHA audit trail API
│   │   └── statsRoutes.js            # ED telemetry & command stats
│   ├── services/
│   │   ├── vitalCalibrator.js        # PALS & Geriatric age calibration
│   │   ├── safetyRuleEngine.js       # Deterministic ESI 1/2 safety triggers
│   │   ├── uncertaintyEngine.js      # Asymmetric uncertainty & escalation
│   │   ├── geminiService.js          # Google Gemini AI + offline clinical fallback
│   │   └── auditService.js           # Tamper-evident compliance logger
│   ├── server.js                     # Express server entry point
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # Command center status, surge toggle, tabs
│   │   │   ├── StatsOverview.jsx     # ED telemetry & occupancy metrics
│   │   │   ├── QueueDashboard.jsx    # Live dynamic queue & filters
│   │   │   ├── PatientIntakeModal.jsx # Voice intake & AI co-pilot modal
│   │   │   ├── PatientDetailModal.jsx # Deep clinical telemetry & differential
│   │   │   ├── ClinicianOverrideModal.jsx # 1-Click override with DISHA signing
│   │   │   ├── VitalsRecheckModal.jsx # Re-record vitals & deterioration test
│   │   │   ├── DoctorHandoverModal.jsx # Auto SBAR physician handover
│   │   │   ├── AuditLogViewer.jsx    # ABDM / DISHA compliance audit table
│   │   │   └── SurgeSimulationPanel.jsx # Surge load & time fast-forward panel
│   │   ├── services/
│   │   │   └── api.js                # Axios client for backend API
│   │   ├── App.jsx                   # Root application
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind CSS & clinical styles
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 3. How to Run the Prototype

### Prerequisites
- Node.js (v18 or v20+)
- npm

### Step 1: Start the Backend
```bash
cd backend
npm install
npm start
```
*The backend will start on `http://localhost:5000` with pre-seeded 20 benchmark clinical patient records.*

### Step 2: Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your web browser.*

> **Zero Configuration**: The entire application works 100% out of the box with high-fidelity offline deterministic clinical intelligence. To enable live Google Gemini LLM reasoning, add `GEMINI_API_KEY=your_key` into `backend/.env`.

---

## 4. Walking Judges Through the Prototype Demo

### Demo Flow:
1. **Live Emergency Queue (`Live Emergency Queue` tab)**:
   - Show the 20 preloaded diverse clinical patients.
   - Filter by **Pediatric (<12y)**, **Geriatric (65+y)**, **Zero-History**, and **High Uncertainty**.
   - Note the age-calibrated vital anomalies and composite priority sorting.
2. **Judge Archetype 1: Geriatric Silent MI**:
   - Click `+ Rapid Patient Intake` $\to$ Click `1. Geriatric Silent MI (Atypical)` preset.
   - Show how the AI spots diabetic silent neuropathy, tags atypical ACS, and assigns **ESI Level 2** despite mild symptoms.
3. **Judge Archetype 2: Pediatric Febrile Decompensation**:
   - Click `2. Pediatric Febrile Decompensation` preset.
   - Show how PALS vital curves recognize high danger in an infant with HR 162 and tachypnea.
4. **Judge Archetype 3: Zero-History Migrant & Asymmetric Safety Bias**:
   - Click `3. Zero-History Migrant (High Uncertainty)` preset.
   - Notice the **High Uncertainty (42%)** flag and the automatic **Asymmetric Safety Escalation** from Level 3 $\to$ Level 2.
5. **Continuous Triage & Deterioration Alarm**:
   - Go to `Surge & Time Simulation` tab $\to$ Click `+30 Minutes`.
   - Switch back to `Live Emergency Queue` $\to$ Observe how patients who exceeded safe SLA limits are highlighted with flashing **SLA Breached** badges and reprioritized.
   - Click `Recheck Vitals` on any patient $\to$ Click `Simulate Acute Decompensation` $\to$ See queue update instantly.
6. **Clinician 1-Click Override & ABDM / DISHA Audit Trail**:
   - Click the `Override Priority` icon on any patient $\to$ Select new ESI level $\to$ Choose justification $\to$ Submit.
   - Switch to `ABDM / DISHA Audit Trail` tab $\to$ Show the tamper-evident log containing the hashed patient token, initial AI recommendation, clinician override rationale, and electronic signature.
7. **Doctor SBAR Handover**:
   - Click the `SBAR Handover` icon $\to$ Show the auto-generated structured clinical sheet ready for 1-click physician handover.
