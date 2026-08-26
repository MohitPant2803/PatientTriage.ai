import React, { useState } from 'react';
import {
  Flame,
  Clock,
  RotateCcw,
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function SurgeSimulationPanel({
  isSurgeMode,
  onToggleSurge,
  onQueueUpdated
}) {
  const [advancing, setAdvancing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAdvanceTime = async (minutes) => {
    setAdvancing(true);
    setMessage(null);
    try {
      const res = await api.advanceTime(minutes);
      if (res.success) {
        setMessage(`Queue time fast-forwarded by ${minutes} minutes. Dynamic deterioration checks triggered.`);
        onQueueUpdated();
      }
    } catch (err) {
      console.error('Failed to advance time:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage(null);
    try {
      const res = await api.resetStore();
      if (res.success) {
        setMessage('Emergency queue successfully reset to initial 20 benchmark clinical patients.');
        onQueueUpdated();
      }
    } catch (err) {
      console.error('Failed to reset store:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Emergency Department Surge & Deterioration Simulator</h2>
            <p className="text-xs text-slate-400">
              Test dynamic hospital queue re-allocation, mass casualty surges, and waiting room deterioration alerts live.
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-3 p-3 rounded bg-sky-950/60 border border-sky-800 text-xs text-sky-200 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-sky-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Surge Mode Load Balancer */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className={`h-5 w-5 ${isSurgeMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Mass Volume Surge Control
              </h3>
            </div>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isSurgeMode
                  ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isSurgeMode ? '3x SURGE LOAD' : '1x BASELINE LOAD'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            During mass casualty incidents or seasonal epidemics, hospital inflow triples. The system automatically activates fast-track diversion for ESI Level 4/5 minor complaints and preserves emergency resuscitation slots.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onToggleSurge(!isSurgeMode)}
              className={`w-full py-2.5 px-4 rounded-md text-xs font-bold transition-all shadow flex items-center justify-center space-x-2 ${
                isSurgeMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>{isSurgeMode ? 'Deactivate Surge Protocol' : 'Simulate 3x Emergency Surge'}</span>
            </button>
          </div>
        </div>

        {/* 2. Dynamic Waiting Room Deterioration Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Wait-Time Deterioration Clock
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Continuous Triage</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Fast-forward time in the waiting queue to test how the system tracks safe ESI wait limits (ESI 2: 10m, ESI 3: 30m) and raises real-time deterioration alerts when SLAs are breached.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleAdvanceTime(15)}
              disabled={advancing}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-sky-900/60 text-slate-200 hover:text-sky-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              +15 Minutes
            </button>
            <button
              onClick={() => handleAdvanceTime(30)}
              disabled={advancing}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-amber-900/60 text-slate-200 hover:text-amber-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              +30 Minutes
            </button>
            <button
              onClick={() => handleAdvanceTime(60)}
              disabled={advancing}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              +60 Minutes
            </button>
          </div>
        </div>
      </div>

      {/* Reset & Benchmark Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Reset Benchmark Patient Dataset
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Restores all 20 clinical test cases (Pediatric, Geriatric, Zero-History, Atypical ACS, Stroke, Polytrauma) to fresh state.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>Reset 20 Benchmark Cases</span>
        </button>
      </div>
    </div>
  );
}
