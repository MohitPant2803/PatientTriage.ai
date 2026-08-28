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
      <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 flex items-center justify-center shadow-2xs">
            <Zap className="h-5 w-5 stroke-[2.3]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-950">Emergency Department Surge & Deterioration Simulator</h2>
            <p className="text-xs text-slate-700 font-medium">
              Test dynamic hospital queue re-allocation, mass casualty surges, and waiting room deterioration alerts live.
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3.5 rounded-lg bg-sky-100 border border-sky-300 text-xs text-sky-950 flex items-center space-x-2 font-bold shadow-2xs">
            <Activity className="h-4 w-4 text-sky-700 flex-shrink-0 stroke-[2.2]" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Surge Mode Load Balancer */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className={`h-5 w-5 stroke-[2.2] ${isSurgeMode ? 'text-amber-700' : 'text-slate-700'}`} />
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">
                Mass Inflow Surge Control
              </h3>
            </div>
            <span
              className={`text-xs font-mono font-black px-2.5 py-1 rounded-md border ${
                isSurgeMode
                  ? 'bg-amber-100 text-amber-950 border-amber-400'
                  : 'bg-white text-slate-900 border-slate-300'
              }`}
            >
              {isSurgeMode ? '3x SURGE LOAD' : '1x BASELINE LOAD'}
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            During mass casualty incidents or seasonal epidemics, hospital inflow triples. The system automatically activates fast-track diversion for ESI Level 4/5 minor complaints and preserves emergency resuscitation slots.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onToggleSurge(!isSurgeMode)}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 ${
                isSurgeMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-950 border border-slate-300 shadow-2xs'
              }`}
            >
              <Flame className="h-4 w-4 stroke-[2.2]" />
              <span>{isSurgeMode ? 'Deactivate Surge Protocol' : 'Simulate 3x Emergency Surge'}</span>
            </button>
          </div>
        </div>

        {/* 2. Dynamic Waiting Room Deterioration Simulation */}
        <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-sky-700 stroke-[2.2]" />
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">
                Wait-Time Deterioration Clock
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-700 font-bold">Continuous Triage</span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            Fast-forward time in the waiting queue to test how the system tracks safe ESI wait limits (ESI 2: 10m, ESI 3: 30m) and raises real-time deterioration alerts when SLAs are breached.
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => handleAdvanceTime(15)}
              disabled={advancing}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-sky-50 text-slate-950 hover:text-sky-950 border border-slate-300 text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
            >
              +15 Minutes
            </button>
            <button
              onClick={() => handleAdvanceTime(30)}
              disabled={advancing}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-amber-50 text-slate-950 hover:text-amber-950 border border-slate-300 text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
            >
              +30 Minutes
            </button>
            <button
              onClick={() => handleAdvanceTime(60)}
              disabled={advancing}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-rose-50 text-slate-950 hover:text-rose-950 border border-slate-300 text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
            >
              +60 Minutes
            </button>
          </div>
        </div>
      </div>

      {/* Reset & Benchmark Section */}
      <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
            Reset Benchmark Patient Dataset
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-medium">
            Restores all 20 clinical test cases (Pediatric, Geriatric, Zero-History, Atypical ACS, Stroke, Polytrauma) to fresh state.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-950 border border-slate-300 text-xs font-bold flex items-center space-x-2 transition-colors disabled:opacity-50 whitespace-nowrap shadow-2xs"
        >
          <RotateCcw className={`h-4 w-4 stroke-[2.2] ${resetting ? 'animate-spin' : ''}`} />
          <span>Reset 20 Benchmark Cases</span>
        </button>
      </div>
    </div>
  );
}
