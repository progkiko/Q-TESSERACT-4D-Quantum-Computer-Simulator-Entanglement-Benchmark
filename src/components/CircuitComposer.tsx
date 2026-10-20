import React, { useState, useMemo } from 'react';
import { GateOperation, GateType, CircuitPreset, DecoherenceParams } from '../quantum/types';
import { CIRCUIT_PRESETS } from '../quantum/quantumEngine';
import { TESSERACT_VERTICES, calc4DDistance } from '../quantum/constants';
import { optimizeCircuitForT2, OptimizationMetricComparison } from '../quantum/t2Optimizer';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Cpu, 
  Sparkles, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Wand2, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  X,
  Clock,
  Download,
  BarChart3,
  Activity,
  ArrowUpRight,
  RotateCw,
  Info
} from 'lucide-react';

interface CircuitComposerProps {
  numQubits: number;
  setNumQubits: (n: number) => void;
  gates: GateOperation[];
  setGates: React.Dispatch<React.SetStateAction<GateOperation[]>>;
  onRunSimulation: () => void;
  activePresetId: string;
  onSelectPreset: (preset: CircuitPreset) => void;
  params?: DecoherenceParams;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'IDLE_DEPHASING' | 'GATE_CANCELLATION' | 'DEPTH_COMPRESSION' | 'CROSSTALK_4D';
  title: string;
  description: string;
  targetQubit: number;
  timeStep: number;
  gainPercent: number;
  apply: (currentGates: GateOperation[]) => GateOperation[];
}

const GATE_PALETTE: { type: GateType; label: string; desc: string; is2Qubit?: boolean; color: string }[] = [
  { type: 'H', label: 'H', desc: 'Hadamard Superposition', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { type: 'X', label: 'X', desc: 'Pauli-X Bit Flip', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { type: 'Y', label: 'Y', desc: 'Pauli-Y Phase-Bit Flip', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { type: 'Z', label: 'Z', desc: 'Pauli-Z Phase Flip', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { type: 'S', label: 'S', desc: 'Phase Gate (pi/2)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { type: 'T', label: 'T', desc: 'T Gate (pi/4)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { type: 'Rx', label: 'Rx(θ)', desc: 'Rotation around X-axis', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  { type: 'Ry', label: 'Ry(θ)', desc: 'Rotation around Y-axis', color: 'bg-pink-600/20 text-pink-300 border-pink-600/40' },
  { type: 'Rz', label: 'Rz(θ)', desc: 'Rotation around Z-axis', color: 'bg-pink-700/20 text-pink-300 border-pink-700/40' },
  { type: 'CNOT', label: 'CX', desc: 'Controlled-NOT 2-Qubit', is2Qubit: true, color: 'bg-blue-600/30 text-blue-300 border-blue-500/50' },
  { type: 'CZ', label: 'CZ', desc: 'Controlled-Z Entangler', is2Qubit: true, color: 'bg-violet-600/30 text-violet-300 border-violet-500/50' },
  { type: 'SWAP', label: 'SWAP', desc: 'Swap State', is2Qubit: true, color: 'bg-teal-600/30 text-teal-300 border-teal-500/50' },
  { type: 'iSWAP', label: 'iSWAP', desc: 'iSWAP Entangling Coupler', is2Qubit: true, color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' },
  { type: 'CP4D', label: 'CP_4D', desc: '4D Hyper-Controlled Phase', is2Qubit: true, color: 'bg-amber-400/20 text-amber-300 border-amber-400/50' },
  { type: 'DD_XY8', label: 'DD', desc: 'XY-8 Dynamical Decoupling', color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40' },
  { type: 'M', label: 'M', desc: 'Z-basis Measurement', color: 'bg-slate-700/40 text-slate-200 border-slate-600' }
];

export const CircuitComposer: React.FC<CircuitComposerProps> = ({
  numQubits,
  setNumQubits,
  gates,
  setGates,
  onRunSimulation,
  activePresetId,
  onSelectPreset,
  params = {
    t1_us: 65,
    t2_us: 45,
    gateDuration_ns: 20,
    pulseErrorRate: 0.00035,
    crosstalkCoupling_MHz: 0.45,
    dynamicalDecoupling: 'XY8',
    hyperDistanceFactor: 1.0,
    infinityAnchorActive: true,
    zeroNoiseExtrapolation: true,
    dragPulseCorrection: true
  }
}) => {
  const [selectedGateType, setSelectedGateType] = useState<GateType>('H');
  const [controlQubitInput, setControlQubitInput] = useState<number>(0);
  const [targetQubitInput, setTargetQubitInput] = useState<number>(0);
  const [timeStepInput, setTimeStepInput] = useState<number>(0);
  const [rotationThetaInput, setRotationThetaInput] = useState<string>('1.5708'); // pi/2
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const maxSteps = 12;

  // --- AUTO-FIX TOGGLE & OPTIMIZATION ENGINE STATE ---
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [showAutoFixPanel, setShowAutoFixPanel] = useState(true);
  const [appliedOptimizationNotice, setAppliedOptimizationNotice] = useState<string | null>(null);

  // --- DEDICATED T2 DECOHERENCE OPTIMIZER & BEFORE/AFTER COMPARISON STATE ---
  const [t2ComparisonData, setT2ComparisonData] = useState<OptimizationMetricComparison | null>(null);
  const [showT2Modal, setShowT2Modal] = useState<boolean>(false);
  const [isOptimizingT2, setIsOptimizingT2] = useState<boolean>(false);

  // Handler to run automated T2 dephasing optimization and generate comparison metrics
  const handleRunT2Optimization = () => {
    if (gates.length === 0) return;
    setIsOptimizingT2(true);
    setTimeout(() => {
      try {
        const comparison = optimizeCircuitForT2(numQubits, gates, params);
        setT2ComparisonData(comparison);
        setShowT2Modal(true);
      } catch (err) {
        console.error("T2 Optimization error:", err);
      } finally {
        setIsOptimizingT2(false);
      }
    }, 120);
  };

  // Handler to commit optimized gate sequence to circuit and trigger simulation
  const handleApplyT2Optimization = () => {
    if (!t2ComparisonData) return;
    setGates(t2ComparisonData.optimizedGates);
    setShowT2Modal(false);
    setAppliedOptimizationNotice(
      `T2 Optimization Applied: +${t2ComparisonData.deltas.fidelityGainPercent.toFixed(2)}% Fidelity, -${t2ComparisonData.deltas.t2DephasingReductionPercent.toFixed(0)}% T2* Dephasing loss`
    );
    setTimeout(() => {
      onRunSimulation();
    }, 100);
    setTimeout(() => {
      setAppliedOptimizationNotice(null);
    }, 4500);
  };

  // ---------------------------------------------------------------------------
  // AUTO-FIX SUGGESTION ANALYSIS (DECOHERENCE PARAMETER-AWARE)
  // ---------------------------------------------------------------------------
  const optimizationSuggestions = useMemo<OptimizationSuggestion[]>(() => {
    if (!autoFixEnabled || gates.length === 0) return [];

    const suggestions: OptimizationSuggestion[] = [];

    // 1. RULE A: Involutory Gate Cancellation (H·H = I, X·X = I, Z·Z = I, CX·CX = I)
    for (let q = 0; q < numQubits; q++) {
      const qGates = gates
        .filter(g => g.targetQubit === q && !g.controlQubit)
        .sort((a, b) => a.timeStep - b.timeStep);

      for (let i = 0; i < qGates.length - 1; i++) {
        const g1 = qGates[i];
        const g2 = qGates[i + 1];

        // If same involutory gate with no intervening gates on this qubit
        if (g1.type === g2.type && ['H', 'X', 'Y', 'Z'].includes(g1.type)) {
          const intermediateGates = gates.filter(
            g => (g.targetQubit === q || g.controlQubit === q) && g.timeStep > g1.timeStep && g.timeStep < g2.timeStep
          );

          if (intermediateGates.length === 0) {
            suggestions.push({
              id: `cancel_${g1.id}_${g2.id}`,
              category: 'GATE_CANCELLATION',
              title: `Cancel Redundant ${g1.type} · ${g2.type} Pair on Q${q}`,
              description: `Back-to-back ${g1.type} gates satisfy ${g1.type}² = I. Eliminating both removes 2x gate pulse error (${(params.pulseErrorRate * 200).toFixed(2)}%) and shortens circuit duration.`,
              targetQubit: q,
              timeStep: g1.timeStep,
              gainPercent: 0.18,
              apply: (currentGates) => currentGates.filter(g => g.id !== g1.id && g.id !== g2.id)
            });
          }
        }
      }
    }

    // 2. RULE B: Idle Dephasing Suppression (XY-8 Insertion based on T2* dephasing)
    // When a qubit is idle between operations for >= 2 steps, insert DD pulse
    const maxCircuitStep = Math.max(...gates.map(g => g.timeStep), 0);

    for (let q = 0; q < numQubits; q++) {
      const qubitGates = gates
        .filter(g => g.targetQubit === q || g.controlQubit === q)
        .sort((a, b) => a.timeStep - b.timeStep);

      if (qubitGates.length > 0) {
        // Check gap between first gate and last gate
        for (let i = 0; i < qubitGates.length - 1; i++) {
          const g1 = qubitGates[i];
          const g2 = qubitGates[i + 1];
          const gap = g2.timeStep - g1.timeStep;

          if (gap >= 2) {
            const idleStep = Math.floor((g1.timeStep + g2.timeStep) / 2);
            const slotOccupied = gates.some(g => (g.targetQubit === q || g.controlQubit === q) && g.timeStep === idleStep);

            if (!slotOccupied && idleStep < maxSteps) {
              const dephasingExposureUs = (gap * params.gateDuration_ns) / 1000;
              const estGain = Math.min(0.35, Number((0.15 + (dephasingExposureUs / Math.max(1, params.t2_us)) * 10).toFixed(2)));

              suggestions.push({
                id: `dd_idle_q${q}_t${idleStep}`,
                category: 'IDLE_DEPHASING',
                title: `Insert XY-8 Decoupling Pulse on Q${q} (Step ${idleStep})`,
                description: `Q${q} remains idle for ${gap} time steps. Under current dephasing (T2* = ${params.t2_us}μs), inserting an XY-8 composite pulse cancels low-frequency bath dephasing.`,
                targetQubit: q,
                timeStep: idleStep,
                gainPercent: estGain,
                apply: (currentGates) => [
                  ...currentGates,
                  {
                    id: `gate_dd_autofix_${Date.now()}_q${q}`,
                    type: 'DD_XY8',
                    targetQubit: q,
                    timeStep: idleStep,
                    fidelity: 0.9999
                  }
                ]
              });
            }
          }
        }

        // Check if qubit is idle at later steps while circuit continues
        const lastQubitGate = qubitGates[qubitGates.length - 1];
        if (maxCircuitStep - lastQubitGate.timeStep >= 2 && lastQubitGate.timeStep + 1 < maxSteps) {
          const idleStep = lastQubitGate.timeStep + 1;
          const slotOccupied = gates.some(g => (g.targetQubit === q || g.controlQubit === q) && g.timeStep === idleStep);

          if (!slotOccupied) {
            suggestions.push({
              id: `dd_idle_tail_q${q}_t${idleStep}`,
              category: 'IDLE_DEPHASING',
              title: `Shield Q${q} with XY-8 Pulse (Step ${idleStep})`,
              description: `Protects Q${q} from phase relaxation while other qubits complete multi-step gate synthesis (T2* = ${params.t2_us}μs).`,
              targetQubit: q,
              timeStep: idleStep,
              gainPercent: 0.16,
              apply: (currentGates) => [
                ...currentGates,
                {
                  id: `gate_dd_autofix_${Date.now()}_q${q}`,
                  type: 'DD_XY8',
                  targetQubit: q,
                  timeStep: idleStep,
                  fidelity: 0.9999
                }
              ]
            });
          }
        }
      }
    }

    // 3. RULE C: 4D Cross-Talk Mitigation & Hyper-Coupler Conversion
    // If a 2-qubit CNOT spans across d_4 >= 1.414 and crosstalk is high (> 0.35 MHz)
    if (params.crosstalkCoupling_MHz >= 0.35) {
      gates.forEach(g => {
        if (g.type === 'CNOT' && g.controlQubit !== undefined) {
          const vCtrl = TESSERACT_VERTICES[g.controlQubit];
          const vTgt = TESSERACT_VERTICES[g.targetQubit];

          if (vCtrl && vTgt) {
            const dist = calc4DDistance(vCtrl, vTgt);
            if (dist >= 1.414) {
              suggestions.push({
                id: `crosstalk_cnot_to_cp4d_${g.id}`,
                category: 'CROSSTALK_4D',
                title: `Convert CNOT(Q${g.controlQubit} &rarr; Q${g.targetQubit}) to 4D Hyper-Coupler (CP4D)`,
                description: `This entangling gate spans large 4D distance (d₄ = ${dist.toFixed(2)}). Under ${params.crosstalkCoupling_MHz} MHz cross-talk, the CP4D hyper-coupler offers metric phase compensation with +0.24% fidelity.`,
                targetQubit: g.targetQubit,
                timeStep: g.timeStep,
                gainPercent: 0.24,
                apply: (currentGates) => currentGates.map(item => item.id === g.id ? { ...item, type: 'CP4D' } : item)
              });
            }
          }
        }
      });
    }

    // 4. RULE D: Depth Compression (Scheduling parallel gates into vacant preceding steps)
    gates.forEach(g => {
      if (g.timeStep > 0) {
        const prevStep = g.timeStep - 1;
        const targetBusyPrev = gates.some(item => (item.targetQubit === g.targetQubit || item.controlQubit === g.targetQubit) && item.timeStep === prevStep);
        const ctrlBusyPrev = g.controlQubit !== undefined && gates.some(item => (item.targetQubit === g.controlQubit || item.controlQubit === g.controlQubit) && item.timeStep === prevStep);

        if (!targetBusyPrev && !ctrlBusyPrev) {
          // Can be shifted left
          suggestions.push({
            id: `pack_left_${g.id}`,
            category: 'DEPTH_COMPRESSION',
            title: `Parallelize ${g.type} on Q${g.targetQubit}: Shift from Step ${g.timeStep} &rarr; ${prevStep}`,
            description: `Slots on Step ${prevStep} are vacant. Shifting this operation forward compresses total circuit execution by ${params.gateDuration_ns}ns, minimizing T1 thermal decay.`,
            targetQubit: g.targetQubit,
            timeStep: g.timeStep,
            gainPercent: 0.08,
            apply: (currentGates) => currentGates.map(item => item.id === g.id ? { ...item, timeStep: prevStep } : item)
          });
        }
      }
    });

    // Remove duplicates and limit to top actionable suggestions
    const unique = suggestions.filter((s, idx, arr) => arr.findIndex(t => t.id === s.id) === idx);
    return unique.slice(0, 6);
  }, [gates, numQubits, params, autoFixEnabled]);

  // Aggregate Estimated Fidelity Gain
  const totalEstimatedGain = useMemo(() => {
    return optimizationSuggestions.reduce((sum, s) => sum + s.gainPercent, 0);
  }, [optimizationSuggestions]);

  // Apply a Single Optimization Suggestion
  const handleApplySingleFix = (suggestion: OptimizationSuggestion) => {
    const updated = suggestion.apply(gates);
    setGates(updated);
    setAppliedOptimizationNotice(`Applied: ${suggestion.title} (+${suggestion.gainPercent.toFixed(2)}% Fidelity)`);
    setTimeout(() => {
      onRunSimulation();
    }, 100);
    setTimeout(() => {
      setAppliedOptimizationNotice(null);
    }, 3500);
  };

  // Apply ALL Optimization Suggestions at once
  const handleApplyAllFixes = () => {
    if (optimizationSuggestions.length === 0) return;

    let updated = [...gates];
    optimizationSuggestions.forEach(s => {
      updated = s.apply(updated);
    });

    setGates(updated);
    setAppliedOptimizationNotice(`Auto-Fix Complete: Applied ${optimizationSuggestions.length} optimizations (+${totalEstimatedGain.toFixed(2)}% Fidelity Gain)!`);
    setTimeout(() => {
      onRunSimulation();
    }, 100);
    setTimeout(() => {
      setAppliedOptimizationNotice(null);
    }, 4000);
  };

  // Slot click
  const handleSlotClick = (qubitIdx: number, stepIdx: number) => {
    const existingIdx = gates.findIndex(g => g.targetQubit === qubitIdx && g.timeStep === stepIdx);

    if (existingIdx >= 0) {
      setGates(prev => prev.filter((_, idx) => idx !== existingIdx));
    } else {
      const is2Qubit = ['CNOT', 'CZ', 'SWAP', 'iSWAP', 'CP4D'].includes(selectedGateType);
      const newGate: GateOperation = {
        id: `gate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: selectedGateType,
        targetQubit: qubitIdx,
        controlQubit: is2Qubit ? (controlQubitInput === qubitIdx ? (qubitIdx > 0 ? qubitIdx - 1 : qubitIdx + 1) : controlQubitInput) : undefined,
        theta: ['Rx', 'Ry', 'Rz'].includes(selectedGateType) ? (parseFloat(rotationThetaInput) || Math.PI / 2) : undefined,
        timeStep: stepIdx,
        fidelity: 0.9997
      };
      setGates(prev => [...prev, newGate]);
    }
  };

  // Manual Gate Insertion from Entry Form
  const handleInsertManualGate = () => {
    const is2Qubit = ['CNOT', 'CZ', 'SWAP', 'iSWAP', 'CP4D'].includes(selectedGateType);
    const target = Math.max(0, Math.min(numQubits - 1, targetQubitInput));
    let ctrl = is2Qubit ? Math.max(0, Math.min(numQubits - 1, controlQubitInput)) : undefined;
    if (ctrl === target && is2Qubit) {
      ctrl = target > 0 ? target - 1 : target + 1;
    }

    const step = Math.max(0, Math.min(maxSteps - 1, timeStepInput));
    const theta = ['Rx', 'Ry', 'Rz'].includes(selectedGateType) ? (parseFloat(rotationThetaInput) || Math.PI / 2) : undefined;

    setGates(prev => [
      ...prev.filter(g => !(g.targetQubit === target && g.timeStep === step)),
      {
        id: `gate_manual_${Date.now()}`,
        type: selectedGateType,
        targetQubit: target,
        controlQubit: ctrl,
        theta,
        timeStep: step,
        fidelity: 0.9997
      }
    ]);
  };

  const clearCircuit = () => {
    setGates([]);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Circuit Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
              QUANTUM CIRCUIT COMPOSER
            </h3>
          </div>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400 font-mono">
            {gates.length} Gates · {numQubits} Qubits Active
          </span>
        </div>

        {/* Preset Selector & Auto-Fix Toggle & Quick Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AUTO-FIX TOGGLE BUTTON */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setAutoFixEnabled(!autoFixEnabled);
                if (!autoFixEnabled) setShowAutoFixPanel(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                autoFixEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically analyze and suggest gate sequence optimizations"
            >
              <Wand2 className={`w-3.5 h-3.5 ${autoFixEnabled ? 'animate-pulse text-amber-300' : ''}`} />
              <span>AUTO-FIX: {autoFixEnabled ? 'ON' : 'OFF'}</span>
              {autoFixEnabled && optimizationSuggestions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-slate-950 font-extrabold">
                  {optimizationSuggestions.length}
                </span>
              )}
            </button>

            {autoFixEnabled && (
              <button
                onClick={() => setShowAutoFixPanel(!showAutoFixPanel)}
                className="px-1.5 py-1 text-slate-400 hover:text-white text-[11px]"
                title="Toggle suggestions panel"
              >
                {showAutoFixPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* DEDICATED T2 DECOHERENCE OPTIMIZER ACTION BUTTON */}
          <button
            onClick={handleRunT2Optimization}
            disabled={isOptimizingT2 || gates.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-emerald-600/30 via-cyan-600/30 to-amber-600/30 hover:from-emerald-500/40 hover:to-amber-500/40 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50 transition-all disabled:opacity-40"
            title="Automatically optimize gate sequence for lowest T2* decoherence and preview before/after metrics"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isOptimizingT2 ? 'animate-spin' : ''}`} />
            <span>{isOptimizingT2 ? 'OPTIMIZING...' : '⚡ OPTIMIZE FOR T₂'}</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">PROTOCOL:</span>
          <select
            value={activePresetId}
            onChange={e => {
              const preset = CIRCUIT_PRESETS.find(p => p.id === e.target.value);
              if (preset) onSelectPreset(preset);
            }}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {CIRCUIT_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Toggle Manual Entry Panel */}
          <button
            onClick={() => setShowManualEntryForm(!showManualEntryForm)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
              showManualEntryForm 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>ENTRY FORM</span>
            {showManualEntryForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Quick Actions */}
          <button
            onClick={clearCircuit}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear all circuit gates"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRunSimulation}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-medium transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN SIM</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION TOAST BANNER */}
      {appliedOptimizationNotice && (
        <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/50 flex items-center justify-between text-xs font-mono text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{appliedOptimizationNotice}</span>
          </div>
          <button onClick={() => setAppliedOptimizationNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTO-FIX INTELLIGENT OPTIMIZATION SUGGESTIONS PANEL                       */}
      {/* ========================================================================= */}
      {autoFixEnabled && showAutoFixPanel && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 uppercase">
                  DECOHERENCE-AWARE AUTO-FIX ENGINE
                </span>
                <span className="text-[10px] text-slate-400">
                  (Based on T₁={params.t1_us}μs, T₂*={params.t2_us}μs, Cross-talk={params.crosstalkCoupling_MHz}MHz)
                </span>
              </div>
            </div>

            {optimizationSuggestions.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-slate-300">
                  Total Est. Gain:{' '}
                  <strong className="text-emerald-400 font-bold">+{totalEstimatedGain.toFixed(2)}% Fidelity</strong>
                </div>
                <button
                  onClick={handleApplyAllFixes}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>APPLY ALL OPTIMIZATIONS ({optimizationSuggestions.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Suggestions List */}
          {optimizationSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {optimizationSuggestions.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        s.category === 'IDLE_DEPHASING'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : s.category === 'GATE_CANCELLATION'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : s.category === 'CROSSTALK_4D'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {s.category.replace('_', ' ')}
                      </span>

                      <span className="text-emerald-400 font-bold text-[10px]">
                        +{s.gainPercent.toFixed(2)}% F
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1" title={s.title}>
                      {s.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {s.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Slot: Q{s.targetQubit} · Step {s.timeStep}
                    </span>
                    <button
                      onClick={() => handleApplySingleFix(s)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors text-[10px] font-bold"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply Fix</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Circuit sequence is currently optimal for {params.t2_us}μs dephasing and {params.gateDuration_ns}ns pulse duration! No redundant gates or unshielded idle intervals detected.
              </span>
            </div>
          )}
        </div>
      )}

      {/* DEDICATED MANUAL GATE CONFIGURATION & ENTRY FIELDS FORM */}
      {showManualEntryForm && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Type:</span>
            <select
              value={selectedGateType}
              onChange={e => setSelectedGateType(e.target.value as GateType)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-bold"
            >
              {GATE_PALETTE.map(g => (
                <option key={g.type} value={g.type}>
                  {g.label} ({g.desc})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Target:</span>
            <input
              type="number"
              min="0"
              max={numQubits - 1}
              value={targetQubitInput}
              onChange={e => setTargetQubitInput(parseInt(e.target.value) || 0)}
              className="w-12 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-center font-bold"
            />
          </div>

          {['CNOT', 'CZ', 'SWAP', 'iSWAP', 'CP4D'].includes(selectedGateType) && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Control:</span>
              <input
                type="number"
                min="0"
                max={numQubits - 1}
                value={controlQubitInput}
                onChange={e => setControlQubitInput(parseInt(e.target.value) || 0)}
                className="w-12 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-center font-bold"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Step t:</span>
            <input
              type="number"
              min="0"
              max={maxSteps - 1}
              value={timeStepInput}
              onChange={e => setTimeStepInput(parseInt(e.target.value) || 0)}
              className="w-12 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-center font-bold"
            />
          </div>

          {['Rx', 'Ry', 'Rz'].includes(selectedGateType) && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">θ (rad):</span>
              <input
                type="text"
                value={rotationThetaInput}
                onChange={e => setRotationThetaInput(e.target.value)}
                className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-pink-300 text-center font-mono font-bold"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRotationThetaInput('0.7854')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                  title="pi/4"
                >
                  π/4
                </button>
                <button
                  type="button"
                  onClick={() => setRotationThetaInput('1.5708')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                  title="pi/2"
                >
                  π/2
                </button>
                <button
                  type="button"
                  onClick={() => setRotationThetaInput('3.1416')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                  title="pi"
                >
                  π
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleInsertManualGate}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>INSERT GATE</span>
          </button>
        </div>
      )}

      {/* Gate Palette Quick Strip */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-950/80 border-b border-slate-800 text-xs">
        <span className="text-slate-500 font-mono text-[11px] mr-1 uppercase">Click-To-Place:</span>
        {GATE_PALETTE.map(gate => {
          const isSelected = selectedGateType === gate.type;
          return (
            <button
              key={gate.type}
              onClick={() => setSelectedGateType(gate.type)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                isSelected
                  ? 'ring-2 ring-cyan-400 scale-105 ' + gate.color
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={gate.desc}
            >
              {gate.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">QUBITS:</span>
          <button
            onClick={() => setNumQubits(Math.max(2, numQubits - 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center"
            title="Decrease active qubits"
          >
            -
          </button>
          <input
            type="number"
            min="2"
            max="16"
            value={numQubits}
            onChange={e => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) setNumQubits(Math.max(2, Math.min(16, val)));
            }}
            className="w-10 text-center font-bold text-cyan-400 bg-slate-900 border border-slate-700 rounded py-0.5 text-xs font-mono"
          />
          <button
            onClick={() => setNumQubits(Math.min(16, numQubits + 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center"
            title="Increase active qubits"
          >
            +
          </button>
        </div>
      </div>

      {/* Interactive Circuit Grid */}
      <div className="p-4 overflow-x-auto bg-slate-950/60 min-h-[220px]">
        <div className="min-w-[620px] flex flex-col gap-3">
          {Array.from({ length: numQubits }).map((_, qIdx) => (
            <div key={qIdx} className="flex items-center gap-3">
              {/* Qubit Rail Header */}
              <div className="w-16 flex items-center justify-between font-mono text-xs text-slate-400 shrink-0">
                <span className="font-bold text-slate-200">q[{qIdx}]</span>
                <span className="text-[10px] text-slate-500">|0⟩</span>
              </div>

              {/* Grid Line with Wire */}
              <div className="relative flex-1 flex items-center gap-2">
                <div className="absolute inset-x-0 h-[1.5px] bg-slate-700/80 z-0"></div>

                {/* Time Step Slots */}
                {Array.from({ length: maxSteps }).map((__, stepIdx) => {
                  const gateAtSlot = gates.find(g => g.targetQubit === qIdx && g.timeStep === stepIdx);
                  const isControlAtSlot = gates.find(g => g.controlQubit === qIdx && g.timeStep === stepIdx);
                  
                  // Has optimization suggestion on this slot?
                  const suggestionAtSlot = autoFixEnabled && optimizationSuggestions.find(
                    s => s.targetQubit === qIdx && s.timeStep === stepIdx
                  );

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => handleSlotClick(qIdx, stepIdx)}
                      className="relative z-10 w-9 h-9 rounded flex items-center justify-center transition-all group"
                      title={
                        suggestionAtSlot
                          ? `Auto-Fix Suggestion: ${suggestionAtSlot.title}`
                          : gateAtSlot
                          ? `${gateAtSlot.type} on q${qIdx} (Step ${stepIdx}) - Click to remove`
                          : `Step ${stepIdx} - Click to place ${selectedGateType}`
                      }
                    >
                      {/* Suggestion Glow Ring */}
                      {suggestionAtSlot && !gateAtSlot && (
                        <div className="absolute inset-0 rounded border-2 border-emerald-400/80 bg-emerald-500/10 animate-pulse flex items-center justify-center pointer-events-none">
                          <Wand2 className="w-3 h-3 text-emerald-300" />
                        </div>
                      )}

                      {gateAtSlot ? (
                        <div
                          className={`w-8 h-8 rounded border text-xs font-mono font-bold flex items-center justify-center shadow-md ${
                            suggestionAtSlot
                              ? 'ring-2 ring-amber-400 animate-pulse '
                              : ''
                          }${
                            gateAtSlot.type === 'H'
                              ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                              : gateAtSlot.type === 'X'
                              ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                              : gateAtSlot.type === 'CNOT'
                              ? 'bg-blue-600/40 text-blue-200 border-blue-400'
                              : gateAtSlot.type === 'CP4D'
                              ? 'bg-amber-400/30 text-amber-200 border-amber-400'
                              : gateAtSlot.type === 'DD_XY8'
                              ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                              : 'bg-purple-600/30 text-purple-200 border-purple-400'
                          }`}
                        >
                          {gateAtSlot.type === 'DD_XY8' ? 'DD' : gateAtSlot.type === 'CP4D' ? 'CP' : gateAtSlot.type}
                        </div>
                      ) : isControlAtSlot ? (
                        <div className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-slate-900 shadow" />
                      ) : (
                        <div className="w-8 h-8 rounded border border-dashed border-slate-800 group-hover:border-slate-600 group-hover:bg-slate-800/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Description Banner */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Benchmark Protocol: {CIRCUIT_PRESETS.find(p => p.id === activePresetId)?.description}</span>
        </div>
        <span className="text-slate-500 hidden md:inline">Auto-Fix analyzes T1/T2* decoherence in real time</span>
      </div>

      {/* ========================================================================= */}
      {/* T2 DECOHERENCE OPTIMIZATION BEFORE / AFTER COMPARISON MODAL              */}
      {/* ========================================================================= */}
      {showT2Modal && t2ComparisonData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 font-mono text-xs space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      T₂* DECOHERENCE OPTIMIZATION BENCHMARK
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      +{t2ComparisonData.deltas.fidelityGainPercent.toFixed(2)}% Fidelity
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Targeted dephasing suppression under T₂* = {params.t2_us}μs, T₁ = {params.t1_us}μs, and pulse duration τ_g = {params.gateDuration_ns}ns.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowT2Modal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close without applying"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Banner KPI Grid: Before vs After with Deltas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Metric 1: Process Fidelity */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>PROCESS FIDELITY (F)</span>
                    <span className="text-emerald-400 font-bold">+{t2ComparisonData.deltas.fidelityGainPercent.toFixed(3)}%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">BEFORE:</span>
                      <span className="text-sm text-slate-400">{(t2ComparisonData.before.fidelity * 100).toFixed(2)}%</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">AFTER:</span>
                      <span className="text-base font-bold text-emerald-400">{(t2ComparisonData.after.fidelity * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${t2ComparisonData.after.fidelity * 100}%` }} />
                </div>
              </div>

              {/* Metric 2: Pure T2* Dephasing Error */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>T₂* DEPHASING LOSS</span>
                    <span className="text-purple-400 font-bold">-{t2ComparisonData.deltas.t2DephasingReductionPercent.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">BEFORE:</span>
                      <span className="text-sm text-slate-400">{(t2ComparisonData.before.t2DephasingError * 100).toFixed(2)}%</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">AFTER:</span>
                      <span className="text-base font-bold text-purple-300">{(t2ComparisonData.after.t2DephasingError * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, t2ComparisonData.after.t2DephasingError * 500)}%` }} />
                </div>
              </div>

              {/* Metric 3: Circuit Latency & Duration */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>CIRCUIT LATENCY</span>
                    <span className="text-cyan-400 font-bold">-{t2ComparisonData.deltas.durationSavedNs} ns</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">BEFORE:</span>
                      <span className="text-sm text-slate-400">{t2ComparisonData.before.circuitDurationNs} ns</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">AFTER:</span>
                      <span className="text-base font-bold text-cyan-300">{t2ComparisonData.after.circuitDurationNs} ns</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Depth: {t2ComparisonData.before.circuitDepth} steps ➔ {t2ComparisonData.after.circuitDepth} steps
                </div>
              </div>

              {/* Metric 4: Bell-CHSH Quantum Violation */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>BELL-CHSH VIOLATION (S)</span>
                    <span className="text-amber-400 font-bold">+{t2ComparisonData.deltas.bellViolationGain.toFixed(3)}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">BEFORE:</span>
                      <span className="text-sm text-slate-400">{t2ComparisonData.before.bellCHSH.toFixed(3)}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">AFTER:</span>
                      <span className="text-base font-bold text-amber-300">{t2ComparisonData.after.bellCHSH.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Quantum Limit: 2.8284 (Tsirelson Bound)
                </div>
              </div>
            </div>

            {/* Applied Transformation Passes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>APPLIED T₂* DECOHERENCE OPTIMIZATION PASSES ({t2ComparisonData.appliedOptimizations.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {t2ComparisonData.appliedOptimizations.map((pass, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">{pass.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        {pass.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{pass.description}</p>
                    <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                      Physical Impact: {pass.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Qubit Dephasing Comparison Table */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">PER-QUBIT DEPHASING RATE COMPARISON</span>
                <span className="text-[10px] text-slate-400">T₂* Pure Dephasing Error ε_ϕ(t)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {t2ComparisonData.before.qubitErrors.slice(0, numQubits).map((qe, idx) => {
                  const afterQe = t2ComparisonData.after.qubitErrors[idx];
                  const reduction = qe.t2Error > 0 ? ((qe.t2Error - (afterQe?.t2Error || 0)) / qe.t2Error * 100) : 0;
                  return (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-center">
                      <div className="font-bold text-slate-300">Q{qe.qubit}</div>
                      <div className="text-slate-500 line-through">{(qe.t2Error * 100).toFixed(1)}%</div>
                      <div className="text-emerald-400 font-bold">{((afterQe?.t2Error || 0) * 100).toFixed(1)}%</div>
                      <div className="text-[9px] text-cyan-400">-{reduction.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Original circuit can be restored at any time via Preset selector.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const jsonStr = JSON.stringify(t2ComparisonData, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `t2_optimization_benchmark_${Date.now()}.json`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>

                <button
                  onClick={() => setShowT2Modal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Discard
                </button>

                <button
                  onClick={handleApplyT2Optimization}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>APPLY & KEEP OPTIMIZED CIRCUIT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
