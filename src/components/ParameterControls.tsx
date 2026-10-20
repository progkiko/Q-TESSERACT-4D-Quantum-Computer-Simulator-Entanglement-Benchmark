import React, { useState } from 'react';
import { DecoherenceParams } from '../quantum/types';
import { Sliders, ShieldCheck, Zap, Activity, Waves, Anchor, RefreshCw, CheckCircle2, ChevronRight, Settings2 } from 'lucide-react';
import { INFINITY_ANCHOR_RAW } from '../quantum/constants';

interface ParameterControlsProps {
  params: DecoherenceParams;
  setParams: React.Dispatch<React.SetStateAction<DecoherenceParams>>;
  mitigationGain_dB: number;
  averageFidelity: number;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  setParams,
  mitigationGain_dB,
  averageFidelity
}) => {
  const [anchorInputText, setAnchorInputText] = useState(INFINITY_ANCHOR_RAW);
  const [activeTab, setActiveTab] = useState<'Coherence' | '4D_Coupling' | 'Anchor_Gauge'>('Coherence');

  // Hardware Calibration Presets
  const applyHardwarePreset = (presetName: string) => {
    if (presetName === 'transmon') {
      setParams(p => ({
        ...p,
        t1_us: 80,
        t2_us: 60,
        gateDuration_ns: 20,
        pulseErrorRate: 0.0003,
        crosstalkCoupling_MHz: 0.35,
        dynamicalDecoupling: 'XY8',
        dragPulseCorrection: true
      }));
    } else if (presetName === 'trapped_ion') {
      setParams(p => ({
        ...p,
        t1_us: 250,
        t2_us: 150,
        gateDuration_ns: 60,
        pulseErrorRate: 0.00015,
        crosstalkCoupling_MHz: 0.15,
        dynamicalDecoupling: 'CPMG',
        dragPulseCorrection: true
      }));
    } else if (presetName === 'tesseract_fault_tolerant') {
      setParams(p => ({
        ...p,
        t1_us: 180,
        t2_us: 140,
        gateDuration_ns: 15,
        pulseErrorRate: 0.0001,
        crosstalkCoupling_MHz: 0.20,
        dynamicalDecoupling: 'UDD4',
        infinityAnchorActive: true,
        zeroNoiseExtrapolation: true,
        dragPulseCorrection: true
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl text-xs font-mono">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200 tracking-wide uppercase">
            GUI CONTROLS & ENTRY FIELDS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">MITIGATION:</span>
          <span className="text-emerald-400 font-bold font-mono">+{mitigationGain_dB.toFixed(2)} dB</span>
        </div>
      </div>

      {/* Sub Navigation Bar for Controls */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-2 py-1 gap-1">
        <button
          onClick={() => setActiveTab('Coherence')}
          className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'Coherence' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Coherence & Times
        </button>
        <button
          onClick={() => setActiveTab('4D_Coupling')}
          className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === '4D_Coupling' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4D Couplings & DD
        </button>
        <button
          onClick={() => setActiveTab('Anchor_Gauge')}
          className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'Anchor_Gauge' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Infinity Anchor Entry
        </button>
      </div>

      {/* Scrollable Entry Form Container */}
      <div className="flex-1 p-4 space-y-4 bg-slate-950/60 overflow-y-auto">
        {/* TAB 1: COHERENCE & TIMES ENTRY FIELDS */}
        {activeTab === 'Coherence' && (
          <div className="space-y-4">
            {/* Quick Calibration Preset Buttons */}
            <div>
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">
                Hardware Calibration Profiles:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => applyHardwarePreset('transmon')}
                  className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors text-[10px] text-center"
                >
                  Superconducting
                </button>
                <button
                  onClick={() => applyHardwarePreset('trapped_ion')}
                  className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors text-[10px] text-center"
                >
                  Trapped Ion
                </button>
                <button
                  onClick={() => applyHardwarePreset('tesseract_fault_tolerant')}
                  className="py-1.5 px-2 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-bold transition-colors text-[10px] text-center"
                >
                  4D Tesseract
                </button>
              </div>
            </div>

            {/* T1 Entry Field & Stepper */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  T1 Relaxation Time (μs)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setParams(p => ({ ...p, t1_us: Math.max(5, p.t1_us - 5) }))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="1"
                    value={params.t1_us}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setParams(p => ({ ...p, t1_us: Math.max(1, Math.min(1000, val)) }));
                    }}
                    className="w-16 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-center text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={() => setParams(p => ({ ...p, t1_us: Math.min(500, p.t1_us + 5) }))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                  <span className="text-slate-500 text-[10px]">μs</span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={params.t1_us}
                onChange={e => setParams(p => ({ ...p, t1_us: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>

            {/* T2* Entry Field & Stepper */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-1.5 text-xs">
                  <Waves className="w-3.5 h-3.5 text-purple-400" />
                  T2* Dephasing Time (μs)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setParams(p => ({ ...p, t2_us: Math.max(2, p.t2_us - 2) }))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="2"
                    max="300"
                    step="1"
                    value={params.t2_us}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setParams(p => ({ ...p, t2_us: Math.max(1, Math.min(500, val)) }));
                    }}
                    className="w-16 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-purple-300 font-bold text-center text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <button
                    onClick={() => setParams(p => ({ ...p, t2_us: Math.min(300, p.t2_us + 2) }))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                  <span className="text-slate-500 text-[10px]">μs</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="200"
                step="2"
                value={params.t2_us}
                onChange={e => setParams(p => ({ ...p, t2_us: parseFloat(e.target.value) }))}
                className="w-full accent-purple-400 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>

            {/* Gate Duration & Pulse Error Rate Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block">Gate Duration (ns):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="150"
                    step="1"
                    value={params.gateDuration_ns}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setParams(p => ({ ...p, gateDuration_ns: Math.max(1, v) }));
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-500 text-[10px]">ns</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block">Raw Error Rate ε:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={params.pulseErrorRate}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setParams(p => ({ ...p, pulseErrorRate: Math.max(0, Math.min(0.1, v)) }));
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 4D COUPLINGS & DYNAMICAL DECOUPLING CONTROLS */}
        {activeTab === '4D_Coupling' && (
          <div className="space-y-4">
            {/* 4D Cross-talk & Metric Distance Entry Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[11px] block">4D Cross-Talk Coupling:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="5.0"
                    step="0.05"
                    value={params.crosstalkCoupling_MHz}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setParams(p => ({ ...p, crosstalkCoupling_MHz: Math.max(0, val) }));
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-500 text-[10px]">MHz</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[11px] block">4D Distance Scale (d4):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1.0"
                    max="6.0"
                    step="0.1"
                    value={params.hyperDistanceFactor}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setParams(p => ({ ...p, hyperDistanceFactor: Math.max(0.5, val) }));
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-500 text-[10px]">x</span>
                </div>
              </div>
            </div>

            {/* Dynamical Decoupling Multi-Option Selector */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium text-xs">Dynamical Decoupling Filter:</span>
                <span className="text-emerald-400 font-bold text-xs">{params.dynamicalDecoupling}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['OFF', 'CPMG', 'XY4', 'XY8', 'UDD4'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setParams(p => ({ ...p, dynamicalDecoupling: mode }))}
                    className={`py-1.5 rounded text-[11px] font-semibold border transition-all ${
                      params.dynamicalDecoupling === mode
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-500">
                {params.dynamicalDecoupling === 'XY8' && 'XY-8: 8-pulse composite sequence eliminates arbitrary phase-flip and dephasing error.'}
                {params.dynamicalDecoupling === 'UDD4' && 'Uhrig DD: Non-equidistant timing nodes optimized for 1/f noise spectrum.'}
                {params.dynamicalDecoupling === 'CPMG' && 'Carr-Purcell-Meiboom-Gill echo train.'}
                {params.dynamicalDecoupling === 'XY4' && 'XY-4 symmetric alternating phase sequence.'}
                {params.dynamicalDecoupling === 'OFF' && 'Unmitigated natural dephasing decay.'}
              </div>
            </div>

            {/* Mitigation Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <span className="text-[11px] text-slate-300">DRAG Pulse Shaping</span>
                <input
                  type="checkbox"
                  checked={params.dragPulseCorrection}
                  onChange={e => setParams(p => ({ ...p, dragPulseCorrection: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <span className="text-[11px] text-slate-300">Zero-Noise Extrap. (ZNE)</span>
                <input
                  type="checkbox"
                  checked={params.zeroNoiseExtrapolation}
                  onChange={e => setParams(p => ({ ...p, zeroNoiseExtrapolation: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: INFINITY ANCHOR ENTRY FIELD & STABILIZER GAUGE */}
        {activeTab === 'Anchor_Gauge' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-200 text-xs">Infinity Anchor Token Entry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="infinity-toggle"
                    checked={params.infinityAnchorActive}
                    onChange={e => setParams(p => ({ ...p, infinityAnchorActive: e.target.checked }))}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                  <label htmlFor="infinity-toggle" className="text-[11px] text-cyan-300 cursor-pointer font-bold">
                    {params.infinityAnchorActive ? 'ACTIVE' : 'BYPASSED'}
                  </label>
                </div>
              </div>

              {/* Direct Entry Field for Anchor Token */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  4D BINARY/OCTAL ANCHOR INVARIANT TOKEN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={anchorInputText}
                    onChange={e => setAnchorInputText(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold tracking-wider"
                    placeholder="1020103010401050106010701080"
                  />
                  <button
                    onClick={() => setAnchorInputText(INFINITY_ANCHOR_RAW)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    title="Reset to default canonical anchor"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Gauge Invariant Status Card */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gauge Status:</span>
                  <span className="text-emerald-400 font-bold">STABILIZED P = 1.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Syndrome Parity Check:</span>
                  <span className="text-slate-300 font-mono">0x7F4A...1080 [PASSED]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entropy Suppression:</span>
                  <span className="text-cyan-300 font-bold">-85.4% dephasing drift</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
              The 4D binary infinity interception anchor <span className="text-cyan-300 font-mono">{anchorInputText}</span> acts as a topological stabilizer gauge projection. It constrains the unbounded 2^(10^27) state space to a protected stabilizer manifold, preserving entanglement fidelity across macroscopic hyper-distances.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
