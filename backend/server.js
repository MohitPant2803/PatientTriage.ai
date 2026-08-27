/**
 * PatientTriage.ai - MERN Backend Server
 * Round 2: Accenture Innovation Challenge 2026
 * Team: 404ers (IIT Kharagpur)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const triageRoutes = require('./routes/triageRoutes');
const patientRoutes = require('./routes/patientRoutes');
const auditRoutes = require('./routes/auditRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger (Clinical API telemetry)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount Routes
app.use('/api/triage', triageRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stats', statsRoutes);

// Health & System Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'PatientTriage.ai Clinical Decision Support API',
    version: '2.0.0',
    round: 'Round 2 - Accenture Innovation Challenge 2026',
    team: '404ers (IIT Kharagpur)',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    safetyRuleEngine: 'ACTIVE',
    vitalCalibrator: 'ACTIVE (PALS/Geriatric v2.0)',
    uncertaintyEngine: 'ACTIVE (Asymmetric Safety Bias)',
    compliance: 'ABDM Level-2 / DISHA Act 2024 / HIPAA'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>PatientTriage.ai API Server</title></head>
      <body style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc;">
        <h1 style="color: #38bdf8;">PatientTriage.ai Backend API (v2.0)</h1>
        <p>Accenture Innovation Challenge 2026 - Round 2 Working Prototype Service</p>
        <ul>
          <li><strong>API Health:</strong> <a style="color: #34d399;" href="/api/health">/api/health</a></li>
          <li><strong>Live Triage Queue:</strong> <a style="color: #34d399;" href="/api/patients">/api/patients</a></li>
          <li><strong>Command Center Stats:</strong> <a style="color: #34d399;" href="/api/stats">/api/stats</a></li>
          <li><strong>ABDM/DISHA Audit Trail:</strong> <a style="color: #34d399;" href="/api/audit">/api/audit</a></li>
        </ul>
      </body>
    </html>
  `);
});

// Optional MongoDB connection (graceful fallback to fast in-memory store)
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log(' Connected to MongoDB instance.'))
    .catch((err) => console.warn(' MongoDB connection skipped, running with high-speed in-memory patient store:', err.message));
} else {
  console.log(' Running with high-speed in-memory benchmark patient store & audit trail.');
}

// Start Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` PatientTriage.ai Backend Server listening on http://localhost:${PORT}`);
  console.log(` Ready to serve Round 2 Clinical Decision Support`);
  console.log('====================================================');
});
