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
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: 'Clinician Override'
        };
      case 'VITAL_REASSESSMENT_ALERT':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Deterioration Alert'
        };
      case 'AI_TRIAGE_RECOMMENDED':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          label: 'AI Recommendation'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: eventType
        };
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700 stroke-[2.2]" />
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              ABDM & DISHA Regulatory Audit Trail
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
              TAMPER-EVIDENT
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium mt-0.5">
            Immutable log of all automated recommendations, clinician overrides, and electronic signatures.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-950 focus:border-sky-600 focus:outline-none shadow-2xs font-bold"
          >
            <option value="ALL">All Audit Events</option>
            <option value="CLINICIAN_OVERRIDE">Clinician Overrides Only</option>
            <option value="AI_TRIAGE_RECOMMENDED">AI Recommendations Only</option>
            <option value="VITAL_REASSESSMENT_ALERT">Deterioration Alerts Only</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-300 transition-colors shadow-2xs"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`h-4 w-4 stroke-[2.2] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compliance Frameworks Pill */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-800">
        <div className="flex items-center space-x-2">
          <Lock className="h-3.5 w-3.5 text-sky-700" />
          <span>Compliant Standards: <strong className="text-slate-950 font-bold">ABDM Level-2</strong> • <strong className="text-slate-950 font-bold">DISHA Act 2024</strong> • <strong className="text-slate-950 font-bold">HIPAA 45 CFR § 164.312</strong> • <strong className="text-slate-950 font-bold">GDPR Art. 22</strong></span>
        </div>
        <span className="text-xs font-mono text-slate-700 font-bold">Statutory Retention: 7 Years</span>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs bg-white">
          <thead>
            <tr className="border-b border-slate-300 bg-white text-xs font-bold text-slate-900 uppercase tracking-wider">
              <th className="py-3.5 px-4">Timestamp & Log ID</th>
              <th className="py-3.5 px-4">Event Type</th>
              <th className="py-3.5 px-4">Hashed Patient Token</th>
              <th className="py-3.5 px-4">AI Recommendation</th>
              <th className="py-3.5 px-4">Clinician Action & Signature</th>
              <th className="py-3.5 px-4">Clinical Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                  No audit events found for the selected filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const badge = getEventBadge(log.eventType);
                const isOverride = log.clinicianAction?.isOverridden;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Timestamp */}
                    <td className="py-3 px-3 text-slate-700">
                      <div className="font-semibold tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.id}</div>
                    </td>

                    {/* 2. Event Type */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* 3. Patient Hash */}
                    <td className="py-3 px-3">
                      <div className="text-sky-800 font-semibold">{log.patientHash}</div>
                      <div className="text-[11px] text-slate-500 font-sans">{log.patientId}</div>
                    </td>

                    {/* 4. AI Recommendation */}
                    <td className="py-3 px-3 font-sans">
                      <div className="text-slate-900 font-semibold">
                        ESI Level {log.aiRecommendation?.esiLevel || '--'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Conf: {log.aiRecommendation?.confidenceScore}% • Uncert: {log.aiRecommendation?.uncertaintyPercentage}%
                      </div>
                      {log.aiRecommendation?.wasSafetyEscalated && (
                        <div className="text-[10.5px] text-amber-800 font-semibold">
                          [Safety Escalated]
                        </div>
                      )}
                    </td>

                    {/* 5. Clinician Action & Signature */}
                    <td className="py-3 px-3 font-sans">
                      {isOverride ? (
                        <div>
                          <div className="text-purple-800 font-semibold flex items-center space-x-1">
                            <span>ESI {log.clinicianAction.originalESI} → ESI {log.clinicianAction.overriddenESI}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono">
                            {log.clinicianAction.clinicianId}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-semibold">
                            {log.clinicianAction.digitalSignature}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-emerald-800 font-semibold">Accepted AI Triage</div>
                          <div className="text-[11px] text-slate-600 font-mono">
                            {log.clinicianAction?.clinicianId}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 6. Clinical Justification */}
                    <td className="py-3 px-3 font-sans max-w-xs text-slate-700 text-xs leading-relaxed">
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
