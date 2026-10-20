/**
 * Q-TESSERACT // Stochastic Noise Profiler
 * Interactive quantum noise model injector and 4D Tesseract fidelity analysis tool.
 * Evaluates Depolarizing, Amplitude Damping (T1), Phase Flip (T2*), Bit Flip,
 * 4D Crosstalk, and Thermal Quasiparticle channels using Kraus representations.
 */

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Activity, 
  ShieldAlert, 
  Sliders, 
  RefreshCw, 
  Zap, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Radio, 
  Download, 
  Copy, 
  Check, 
  Info,
  Waves,
  TrendingDown,
  Cpu,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { QuantumSystemState, EntanglementLink } from '../quantum/types';
import { 
  NoiseModelConfig, 
  NoiseChannelType, 
  NoiseImpactMetrics, 
  NOISE_PRESETS, 
  profileStochasticNoise 
} from '../quantum/noiseProfiler';

interface StochasticNoiseProfilerProps {
  systemState: QuantumSystemState;
  onApplyNoiseToWeb?: (metrics: NoiseImpactMetrics | null) => void;
  isAppliedToWeb?: boolean;
}

export const StochasticNoiseProfiler: React.FC<StochasticNoiseProfilerProps> = ({
  systemState,
  onApplyNoiseToWeb,
  isAppliedToWeb = false
}) => {
  // Current noise configuration state
  const [config, setConfig] = useState<NoiseModelConfig>({
    channel: 'DEPOLARIZING',
    rate: 0.045, // 4.5% error rate
    targetScope: 'ALL',
    targetedQubitId: 0,
    temperature_mK: 20,
    mitigationEnabled: true,
    mitigationType: 'XY8_DYNAMICAL_DECOUPLING',
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedInspectQubit, setSelectedInspectQubit] = useState<number | null>(0);

  // Compute live impact metrics whenever config or systemState changes
  const metrics: NoiseImpactMetrics = useMemo(() => {
    return profileStochasticNoise(systemState, config);
  }, [systemState, config]);

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    const preset = NOISE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setConfig({ ...preset.config });
  };

  // Toggle apply noise to 3D canvas
  const handleToggleApply = () => {
    if (!onApplyNoiseToWeb) return;
    if (isAppliedToWeb) {
      onApplyNoiseToWeb(null);
    } else {
      onApplyNoiseToWeb(metrics);
    }
  };

  // Export report to JSON
  const handleExportJSON = () => {
    const reportData = {
      title: 'Q-TESSERACT Stochastic Noise Benchmark Report',
      timestamp: new Date().toISOString(),
      config,
      metrics: {
        originalFidelity: metrics.originalFidelity,
        noisyFidelity: metrics.noisyFidelity,
        fidelityLossPercent: metrics.fidelityLossPercent,
        originalBellCHSH: metrics.originalBellCHSH,
        noisyBellCHSH: metrics.noisyBellCHSH,
        bellViolationPreserved: metrics.bellViolationPreserved,
        originalPurity: metrics.originalPurity,
        noisyPurity: metrics.noisyPurity,
        originalEntropy: metrics.originalEntropy,
        noisyEntropy: metrics.noisyEntropy,
        degradationStatus: metrics.degradationStatus,
        mitigationRecoveryPercent: metrics.mitigationRecoveryPercent,
        originalStrandsCount: metrics.originalStrandsCount,
        noisyStrandsCount: metrics.noisyStrandsCount,
        severedStrandsCount: metrics.severedStrandsCount,
      },
      krausOperators: metrics.krausOperators,
      perQubitFidelities: metrics.perQubitFidelities,
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noise_profile_${config.channel.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    const text = `Q-TESSERACT STOCHASTIC NOISE REPORT
Channel: ${config.channel} | Rate: ${(config.rate * 100).toFixed(2)}% | Temp: ${config.temperature_mK} mK
Fidelity: ${(metrics.originalFidelity * 100).toFixed(3)}% -> ${(metrics.noisyFidelity * 100).toFixed(3)}% (-${metrics.fidelityLossPercent}%)
Bell-CHSH: S = ${metrics.originalBellCHSH} -> S = ${metrics.noisyBellCHSH} (${metrics.bellViolationPreserved ? 'VIOLATION HELD' : 'COLLAPSED'})
Purity: ${metrics.originalPurity} -> ${metrics.noisyPurity} | Entropy: ${metrics.originalEntropy} -> ${metrics.noisyEntropy}
4D Strands: ${metrics.noisyStrandsCount}/${metrics.originalStrandsCount} (${metrics.severedStrandsCount} severed)`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Status color helpers
  const getStatusBadge = () => {
    switch (metrics.degradationStatus) {
      case 'NOMINAL':
        return {
          label: 'NOMINAL COHERENCE',
          color: 'bg-emerald-950 text-emerald-300 border-emerald-800/80',
          icon: CheckCircle2,
        };
      case 'MINOR_DRIFT':
        return {
          label: 'MINOR PHASE DRIFT',
          color: 'bg-cyan-950 text-cyan-300 border-cyan-800/80',
          icon: Activity,
        };
      case 'SEVERE_DECOHERENCE':
        return {
          label: 'SEVERE DECOHERENCE',
          color: 'bg-amber-950 text-amber-300 border-amber-800/80',
          icon: AlertTriangle,
        };
      case 'ENTANGLEMENT_COLLAPSE':
        return {
          label: 'ENTANGLEMENT COLLAPSE',
          color: 'bg-rose-950 text-rose-300 border-rose-800/80',
          icon: ShieldAlert,
        };
    }
  };

  const StatusIcon = getStatusBadge().icon;

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono tracking-widest uppercase mb-1">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Open Quantum System Simulation · Kraus Noise Channels</span>
              <span className={`px-2 py-0.5 rounded text-[10px] border font-mono font-bold ${getStatusBadge().color}`}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {getStatusBadge().label}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Stochastic Noise Profiler
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inject Kraus quantum channels into the 16-vertex 4D Tesseract lattice. 
              Observe real-time degradation of process fidelity, Bell-CHSH violation (S), 
              state purity Tr(ρ²), and hypercube entanglement strands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleApply}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                isAppliedToWeb
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAppliedToWeb ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>{isAppliedToWeb ? 'Noise Injected into 3D Web (Active)' : 'Inject into 3D Entanglement Web'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Download full benchmark JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Copy summary to clipboard"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block mb-2">
            Quick Physical Noise Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {NOISE_PRESETS.map((p) => {
              const isSelected = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Gate Fidelity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase font-mono text-[10px] tracking-wider">Average Gate Fidelity</span>
              <span className="text-rose-400 font-mono font-bold">-{metrics.fidelityLossPercent}%</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {(metrics.noisyFidelity * 100).toFixed(2)}%
              </span>
              <span className="text-xs text-slate-500 line-through font-mono">
                {(metrics.originalFidelity * 100).toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, metrics.noisyFidelity * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
            <span>Mitigation Gain:</span>
            <span className="text-emerald-400 font-mono">+{metrics.mitigationRecoveryPercent}% recovered</span>
          </div>
        </div>

        {/* Metric 2: Bell-CHSH S Witness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase font-mono text-[10px] tracking-wider">Bell-CHSH Witness (S)</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                metrics.bellViolationPreserved ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {metrics.bellViolationPreserved ? 'S > 2.0 (QUANTUM)' : 'S ≤ 2.0 (CLASSICAL)'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${metrics.bellViolationPreserved ? 'text-cyan-300' : 'text-rose-400'}`}>
                {metrics.noisyBellCHSH}
              </span>
              <span className="text-xs text-slate-500 line-through font-mono">
                {metrics.originalBellCHSH}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 2.8284</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800 relative">
              {/* Classical Limit Tick Mark at S=2.0 (approx 70.7% of Tsirelson bound) */}
              <div className="absolute left-[70.7%] top-0 bottom-0 w-0.5 bg-amber-400 z-10" title="Classical Limit S = 2.0" />
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.bellViolationPreserved ? 'bg-cyan-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (metrics.noisyBellCHSH / 2.8284) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
            <span>Non-Local Violation:</span>
            <span className={metrics.bellViolationPreserved ? 'text-emerald-400' : 'text-rose-400'}>
              {metrics.bellViolationPreserved ? 'Preserved' : 'Collapsed into Classical Local Hidden Variable'}
            </span>
          </div>
        </div>

        {/* Metric 3: State Purity & Entropy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase font-mono text-[10px] tracking-wider">State Purity Tr(ρ²)</span>
              <span className="text-amber-400 font-mono text-[10px]">ΔS = +{metrics.entropyGain}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {metrics.noisyPurity}
              </span>
              <span className="text-xs text-slate-500 line-through font-mono">
                {metrics.originalPurity}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, metrics.noisyPurity * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
            <span>von Neumann Entropy:</span>
            <span className="text-amber-300 font-mono">{metrics.noisyEntropy} bits</span>
          </div>
        </div>

        {/* Metric 4: 4D Entanglement Strands */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase font-mono text-[10px] tracking-wider">Active 4D Strands</span>
              {metrics.severedStrandsCount > 0 && (
                <span className="text-rose-400 font-mono font-bold text-[10px]">
                  {metrics.severedStrandsCount} Severed
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {metrics.noisyStrandsCount}
              </span>
              <span className="text-xs text-slate-500 line-through font-mono">
                {metrics.originalStrandsCount}
              </span>
              <span className="text-xs text-slate-400">Strands Surviving</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, (metrics.noisyStrandsCount / Math.max(1, metrics.originalStrandsCount)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 flex justify-between">
            <span>Mean Concurrence Loss:</span>
            <span className="text-rose-400 font-mono">-{(metrics.avgConcurrenceDrop).toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Controls (Left) & Mathematical Kraus Operators + 4D Grid (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Noise Channel Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Quantum Noise Channel Injector</span>
            </h3>
            <button
              onClick={() => {
                setConfig({
                  channel: 'DEPOLARIZING',
                  rate: 0.045,
                  targetScope: 'ALL',
                  targetedQubitId: 0,
                  temperature_mK: 20,
                  mitigationEnabled: true,
                  mitigationType: 'XY8_DYNAMICAL_DECOUPLING',
                });
                setActivePresetId(null);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Channel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Select Noise Channel:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { type: 'DEPOLARIZING' as NoiseChannelType, label: 'Depolarizing', desc: 'Isotropic Pauli X/Y/Z errors' },
                { type: 'AMPLITUDE_DAMPING' as NoiseChannelType, label: 'Amplitude Damping', desc: 'T1 transmon energy decay' },
                { type: 'PHASE_FLIP' as NoiseChannelType, label: 'Phase Flip (T2*)', desc: 'Pure 1/f dephasing flux noise' },
                { type: 'BIT_FLIP' as NoiseChannelType, label: 'Bit Flip (X)', desc: 'Pauli-X computational flip' },
                { type: 'CROSSTALK_4D' as NoiseChannelType, label: '4D Spatial Crosstalk', desc: 'Inter-vertex parasitic ZZ' },
                { type: 'THERMAL_QUASIPARTICLE' as NoiseChannelType, label: 'Quasiparticles', desc: 'Phonon bursts & Cooper breaking' },
              ].map((ch) => (
                <button
                  key={ch.type}
                  onClick={() => {
                    setConfig(prev => ({ ...prev, channel: ch.type }));
                    setActivePresetId(null);
                  }}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    config.channel === ch.type
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-xs font-bold">{ch.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{ch.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Noise Rate Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Channel Error Rate (p / γ / λ):
              </span>
              <span className="font-mono text-rose-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {(config.rate * 100).toFixed(2)}% ({config.rate.toFixed(4)})
              </span>
            </div>
            <input
              type="range"
              min="0.000"
              max="0.300"
              step="0.002"
              value={config.rate}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, rate: parseFloat(e.target.value) }));
                setActivePresetId(null);
              }}
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.0% (Coherent Ideal)</span>
              <span>15.0% (Threshold)</span>
              <span>30.0% (Breakdown)</span>
            </div>
          </div>

          {/* Cryostat Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Cryostat Temperature:</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {config.temperature_mK} mK
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={config.temperature_mK}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, temperature_mK: parseInt(e.target.value) }));
                setActivePresetId(null);
              }}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10 mK (Base)</span>
              <span>50 mK (Nominal)</span>
              <span>200 mK (Severe Thermal)</span>
            </div>
          </div>

          {/* Target Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Target Scope on 4D Lattice:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'ALL', label: 'All 16 Qubits (Global Bath)' },
                { id: 'ACTIVE_ONLY', label: 'Active Qubits Only' },
                { id: 'HYPERCUBE_DISTANCE', label: '4D Distance Weighted' },
                { id: 'INDIVIDUAL', label: 'Target Single Qubit' },
              ].map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => setConfig(prev => ({ ...prev, targetScope: scope.id as any }))}
                  className={`p-2 rounded-lg text-left transition-colors border ${
                    config.targetScope === scope.id
                      ? 'bg-slate-800 border-cyan-500/50 text-cyan-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            {config.targetScope === 'INDIVIDUAL' && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Qubit:</span>
                <select
                  value={config.targetedQubitId}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetedQubitId: parseInt(e.target.value) }))}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <option key={i} value={i}>Qubit {i}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dynamical Decoupling & ZNE Mitigation Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Quantum Error Mitigation:</span>
              </label>
              <input
                type="checkbox"
                checked={config.mitigationEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, mitigationEnabled: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {config.mitigationEnabled && (
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {[
                  { id: 'XY8_DYNAMICAL_DECOUPLING', label: 'XY-8 Floquet Dynamical Decoupling', benefit: 'Suppresses 1/f dephasing' },
                  { id: 'ZERO_NOISE_EXTRAPOLATION', label: 'Zero-Noise Extrapolation (ZNE)', benefit: 'Scales pulse stretch error to zero' },
                  { id: 'STABILIZER_ROUND', label: '4D Stabilizer Syndrome Projection', benefit: 'Projective subspace parity reset' },
                ].map((mit) => (
                  <button
                    key={mit.id}
                    onClick={() => setConfig(prev => ({ ...prev, mitigationType: mit.id as any }))}
                    className={`p-2 rounded text-left text-xs transition-colors border flex items-center justify-between ${
                      config.mitigationType === mit.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{mit.label}</span>
                    <span className="text-[10px] text-slate-500">{mit.benefit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Kraus Operators (Top) & 4D Lattice Per-Qubit Degradation Heatmap (Bottom) (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Panel 1: Kraus Operator Decompositions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Kraus Operator Representation ε(ρ) = ∑ Kᵢ ρ Kᵢ†</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trace-preserving quantum channel representation satisfying ∑ Kᵢ† Kᵢ = 𝕀
                </p>
              </div>

              <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                ∑ Pᵢ = 1.0000
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {metrics.krausOperators.map((k) => (
                <div
                  key={k.index}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1.5 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{k.label}</span>
                    <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                      {(k.probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded font-mono text-xs text-cyan-300 border border-slate-800">
                    {k.expression}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {k.physicalMeaning}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: 4D Tesseract 16-Vertex Heatmap Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>4D Tesseract Vertex Degradation Heatmap (16 Transmons)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a qubit vertex to inspect local T1, T2*, and fidelity loss under active noise
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-400" /> &gt;95%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-amber-400" /> 80-95%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-500" /> &lt;80%
                </span>
              </div>
            </div>

            {/* 16-Qubit Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {metrics.perQubitFidelities.map((q) => {
                const isSelected = selectedInspectQubit === q.qubit;
                const isTargeted = config.targetedQubitId === q.qubit;
                const fidPct = q.noisyFidelity * 100;
                
                let colorClass = 'border-emerald-500/30 text-emerald-300 bg-emerald-950/20';
                if (fidPct < 80) colorClass = 'border-rose-500/40 text-rose-300 bg-rose-950/25';
                else if (fidPct < 92) colorClass = 'border-amber-500/40 text-amber-300 bg-amber-950/25';

                return (
                  <button
                    key={q.qubit}
                    onClick={() => setSelectedInspectQubit(q.qubit)}
                    className={`p-2 rounded-lg border text-left transition-all ${colorClass} ${
                      isSelected ? 'ring-2 ring-cyan-400 scale-[1.03]' : 'hover:scale-[1.01]'
                    } ${isTargeted ? 'ring-1 ring-rose-400' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>Q{q.qubit}</span>
                      <span className="text-[9px] font-mono opacity-60">
                        w={q.coord4D[3]}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-semibold mt-1">
                      {fidPct.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      -{q.lossPercent.toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Qubit Inspector Details */}
            {selectedInspectQubit !== null && (
              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                    Q{selectedInspectQubit}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Qubit {selectedInspectQubit} 4D Coordinates:</span>
                      <code className="text-cyan-300 font-mono text-[11px]">
                        ({metrics.perQubitFidelities[selectedInspectQubit]?.coord4D.join(', ')})
                      </code>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Effective Coherence: T1 = {metrics.perQubitFidelities[selectedInspectQubit]?.effectiveT1_us} µs · 
                      T2* = {metrics.perQubitFidelities[selectedInspectQubit]?.effectiveT2_us} µs
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        targetScope: 'INDIVIDUAL',
                        targetedQubitId: selectedInspectQubit
                      }));
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-colors"
                  >
                    Target Noise Here
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
