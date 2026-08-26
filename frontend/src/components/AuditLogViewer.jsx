import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  FileCheck,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = selectedEvent !== 'ALL' ? { eventType: selectedEvent } : {};
      const res = await api.getAuditLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEvent]);

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'CLINICIAN_OVERRIDE':
        return {
          bg: 'bg-purple-950 text-purple-300 border-purple-800',
          label: 'Clinician Override'
        };
      case 'VITAL_REASSESSMENT_ALERT':
        return {
          bg: 'bg-rose-950 text-rose-300 border-rose-800',
          label: 'Deterioration Alert'
        };
      case 'AI_TRIAGE_RECOMMENDED':
        return {
          bg: 'bg-sky-950 text-sky-300 border-sky-800',
          label: 'AI Recommendation'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: eventType
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-950/60">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              ABDM & DISHA Regulatory Audit Trail
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              TAMPER-EVIDENT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all automated recommendations, clinician overrides, and electronic signatures.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Audit Events</option>
            <option value="CLINICIAN_OVERRIDE">Clinician Overrides Only</option>
            <option value="AI_TRIAGE_RECOMMENDED">AI Recommendations Only</option>
            <option value="VITAL_REASSESSMENT_ALERT">Deterioration Alerts Only</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compliance Frameworks Pill */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <Lock className="h-3.5 w-3.5 text-sky-400" />
          <span>Compliant Standards: <strong>ABDM Level-2</strong> • <strong>DISHA Act 2024</strong> • <strong>HIPAA 45 CFR § 164.312</strong> • <strong>GDPR Art. 22</strong></span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Statutory Retention: 7 Years</span>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">Timestamp & Log ID</th>
              <th className="py-3 px-3">Event Type</th>
              <th className="py-3 px-3">Hashed Patient Token</th>
              <th className="py-3 px-3">AI Recommendation</th>
              <th className="py-3 px-3">Clinician Action & Signature</th>
              <th className="py-3 px-3">Clinical Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                  No audit events found for the selected filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const badge = getEventBadge(log.eventType);
                const isOverride = log.clinicianAction?.isOverridden;

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* 1. Timestamp */}
                    <td className="py-3 px-3 text-slate-300">
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">{log.id}</div>
                    </td>

                    {/* 2. Event Type */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* 3. Patient Hash */}
                    <td className="py-3 px-3">
                      <div className="text-sky-300 font-semibold">{log.patientHash}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{log.patientId}</div>
                    </td>

                    {/* 4. AI Recommendation */}
                    <td className="py-3 px-3 font-sans">
                      <div className="text-slate-200 font-semibold">
                        ESI Level {log.aiRecommendation?.esiLevel || '--'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Conf: {log.aiRecommendation?.confidenceScore}% • Uncert: {log.aiRecommendation?.uncertaintyPercentage}%
                      </div>
                      {log.aiRecommendation?.wasSafetyEscalated && (
                        <div className="text-[10px] text-amber-400 font-semibold">
                          [Safety Escalated]
                        </div>
                      )}
                    </td>

                    {/* 5. Clinician Action & Signature */}
                    <td className="py-3 px-3 font-sans">
                      {isOverride ? (
                        <div>
                          <div className="text-purple-300 font-semibold flex items-center space-x-1">
                            <span>ESI {log.clinicianAction.originalESI} → ESI {log.clinicianAction.overriddenESI}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.clinicianAction.clinicianId}
                          </div>
                          <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
                            {log.clinicianAction.digitalSignature}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-emerald-400 font-semibold">Accepted AI Triage</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.clinicianAction?.clinicianId}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 6. Clinical Justification */}
                    <td className="py-3 px-3 font-sans max-w-xs text-slate-300 text-[11px] leading-relaxed">
                      {log.clinicianAction?.clinicalJustification || log.aiRecommendation?.severityLabel || 'Standard clinical baseline protocol'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
