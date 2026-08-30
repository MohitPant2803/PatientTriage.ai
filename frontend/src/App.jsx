import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import QueueDashboard from './components/QueueDashboard';
import PatientIntakeModal from './components/PatientIntakeModal';
import PatientDetailModal from './components/PatientDetailModal';
import ClinicianOverrideModal from './components/ClinicianOverrideModal';
import VitalsRecheckModal from './components/VitalsRecheckModal';
import DoctorHandoverModal from './components/DoctorHandoverModal';
import AuditLogViewer from './components/AuditLogViewer';
import SurgeSimulationPanel from './components/SurgeSimulationPanel';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'audit', 'simulation'
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('patient_triage_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const isClearingQueueRef = useRef(false);

  // Filters & Search
  const [currentFilter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [overridePatient, setOverridePatient] = useState(null);
  const [vitalsRecheckPatient, setVitalsRecheckPatient] = useState(null);
  const [sbarPatient, setSbarPatient] = useState(null);

  // Surge State
  const [isSurgeMode, setIsSurgeMode] = useState(false);

  // Persist queue in localStorage whenever patients change
  useEffect(() => {
    try {
      if (patients && patients.length > 0) {
        localStorage.setItem('patient_triage_queue', JSON.stringify(patients));
      } else if (isClearingQueueRef.current) {
        localStorage.removeItem('patient_triage_queue');
      }
    } catch (e) {
      console.warn('localStorage sync notice:', e);
    }
  }, [patients]);

  // Fetch queue and stats
  const fetchData = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (currentFilter === 'critical' || currentFilter === 'deterioration') params.criticalOnly = true;
      if (currentFilter === 'pediatric') params.cohort = 'pediatric';
      if (currentFilter === 'geriatric') params.cohort = 'geriatric';
      if (currentFilter === 'zero-history') params.zeroHistoryOnly = true;
      if (currentFilter === 'high-uncertainty') params.highUncertaintyOnly = true;
      if (currentFilter === 'overridden') params.overriddenOnly = true;

      const [patientsRes, statsRes] = await Promise.all([
        api.getPatients(params),
        api.getStats()
      ]);

      if (patientsRes && patientsRes.success && Array.isArray(patientsRes.patients)) {
        let fetched = patientsRes.patients;
        if (currentFilter === 'deterioration') {
          fetched = fetched.filter((p) => p.deteriorationAlert);
        }

        setPatients((prev) => {
          if (isClearingQueueRef.current) {
            return [];
          }

          // If the serverless lambda returned 0 while client has active patients,
          // do NOT wipe unless explicitly cleared
          if (fetched.length === 0 && prev.length > 0 && !searchQuery && currentFilter === 'all') {
            return prev;
          }

          // Smart merge: merge server and client list by patient.id to prevent any dropouts
          const map = new Map();
          fetched.forEach((p) => {
            if (p && p.id) map.set(p.id, p);
          });
          prev.forEach((p) => {
            if (p && p.id && !map.has(p.id)) {
              map.set(p.id, p);
            }
          });

          const merged = Array.from(map.values());
          const prevKey = prev.map((p) => `${p.id}-${p.currentESI}-${p.waitTimeMinutes}-${p.isOverridden}-${p.deteriorationAlert}`).join('|');
          const nextKey = merged.map((p) => `${p.id}-${p.currentESI}-${p.waitTimeMinutes}-${p.isOverridden}-${p.deteriorationAlert}`).join('|');

          return prevKey === nextKey ? prev : merged;
        });
      }

      if (statsRes.success) {
        setStats(statsRes.stats);
        setIsSurgeMode(statsRes.stats.isSurgeMode);
      }
    } catch (err) {
      console.error('Failed to fetch hospital telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [currentFilter, searchQuery]);

  // Load 10 sample patients on demand
  const handleLoadSamplePatients = async () => {
    setIsLoadingSamples(true);
    try {
      const res = await api.seedSamplePatients(10);
      if (res.success && res.patients) {
        setPatients((prev) => {
          const map = new Map();
          res.patients.forEach((p) => map.set(p.id, p));
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to load sample patients:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Optimistic manual patient admission
  const handlePatientAdmitted = (newPatient) => {
    if (newPatient && newPatient.id) {
      setPatients((prev) => {
        const withoutNew = prev.filter((p) => p.id !== newPatient.id);
        const nextList = [newPatient, ...withoutNew];
        try {
          localStorage.setItem('patient_triage_queue', JSON.stringify(nextList));
        } catch (e) {
          console.warn('localStorage write error:', e);
        }
        return nextList;
      });
    }
    fetchData();
  };

  // Clear queue to empty
  const handleClearQueue = async () => {
    isClearingQueueRef.current = true;
    try {
      localStorage.removeItem('patient_triage_queue');
      setPatients([]);
      await api.clearQueue();
    } catch (err) {
      console.error('Failed to clear queue:', err);
    } finally {
      setTimeout(() => {
        isClearingQueueRef.current = false;
      }, 2000);
    }
  };

  // Surge toggle
  const handleToggleSurge = async (enable) => {
    try {
      const res = await api.toggleSurge(enable);
      if (res.success) {
        setIsSurgeMode(res.isSurgeMode);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle surge:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Clinical Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={stats?.alertCount || 0}
      />

      {/* Main Clinical Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Command Center Telemetry Bar */}
        <StatsOverview stats={stats} />

        {/* Dynamic Tab Content */}
        {activeTab === 'queue' && (
          <QueueDashboard
            patients={patients}
            onSelectPatient={(p) => setSelectedPatient(p)}
            onOpenOverride={(p) => setOverridePatient(p)}
            onOpenVitalsRecheck={(p) => setVitalsRecheckPatient(p)}
            onOpenSbar={(p) => setSbarPatient(p)}
            currentFilter={currentFilter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenIntakeModal={() => setIsIntakeOpen(true)}
            onLoadSamplePatients={handleLoadSamplePatients}
            onClearQueue={handleClearQueue}
            isLoadingSamples={isLoadingSamples}
          />
        )}

        {activeTab === 'audit' && <AuditLogViewer />}

        {activeTab === 'simulation' && (
          <SurgeSimulationPanel
            isSurgeMode={isSurgeMode}
            onToggleSurge={handleToggleSurge}
            onQueueUpdated={fetchData}
          />
        )}
      </main>

      {/* Clinical Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-xs text-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-800">
            <span className="font-bold text-slate-900">PatientTriage.ai</span>
            <span>•</span>
            <span className="font-medium text-slate-700">Emergency Clinical Decision Support</span>
          </div>
          <div className="text-xs text-slate-700 font-semibold flex items-center space-x-2">
            <span>ABDM Level-2</span>
            <span>•</span>
            <span>DISHA Act 2024</span>
            <span>•</span>
            <span>HIPAA 45 CFR § 164.312</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PatientIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onPatientAdmitted={handlePatientAdmitted}
        onLoadSamplePatients={handleLoadSamplePatients}
      />

      <PatientDetailModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        onOpenOverride={(p) => setOverridePatient(p)}
        onOpenVitalsRecheck={(p) => setVitalsRecheckPatient(p)}
        onOpenSbar={(p) => setSbarPatient(p)}
      />

      <ClinicianOverrideModal
        patient={overridePatient}
        isOpen={Boolean(overridePatient)}
        onClose={() => setOverridePatient(null)}
        onOverrideSuccess={() => fetchData()}
      />

      <VitalsRecheckModal
        patient={vitalsRecheckPatient}
        isOpen={Boolean(vitalsRecheckPatient)}
        onClose={() => setVitalsRecheckPatient(null)}
        onVitalsUpdated={() => fetchData()}
      />

      <DoctorHandoverModal
        patient={sbarPatient}
        isOpen={Boolean(sbarPatient)}
        onClose={() => setSbarPatient(null)}
      />
    </div>
  );
}
