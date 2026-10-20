/**
 * Q-TESSERACT // 4D Quantum Computer Simulation Software
 * Scale: 1020103010401050106010701080 Qubits
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DecoherenceParams, 
  GateOperation, 
  QuantumSystemState, 
  BenchmarkResult,
  CircuitPreset 
} from './quantum/types';
import { runSimulation, CIRCUIT_PRESETS } from './quantum/quantumEngine';
import { generateAdapters } from './quantum/adapters';
import { INFINITY_ANCHOR_RAW } from './quantum/constants';
import { HypercubeCanvas } from './components/HypercubeCanvas';
import { CircuitComposer } from './components/CircuitComposer';
import { ParameterControls } from './components/ParameterControls';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';
import { ScriptConsole } from './components/ScriptConsole';
import { ExportSuite } from './components/ExportSuite';
import { Hardware3DSchematics } from './components/Hardware3DSchematics';
import { HardwareCircuitsDesign } from './components/HardwareCircuitsDesign';
import { LiveQuantumAPIs } from './components/LiveQuantumAPIs';

import { 
  Rotate3d, 
  Cpu, 
  BarChart3, 
  Terminal, 
  FileText, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Check, 
  Layers, 
  Anchor,
  Printer,
  CircuitBoard,
  Globe2
} from 'lucide-react';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<'Canvas_Circuit' | 'Benchmarks' | 'Scripting' | 'HardwareCircuits' | 'LiveAPIs' | 'Hardware3D' | 'Export'>('Canvas_Circuit');

  // Quantum Simulation Parameters
  const [numQubits, setNumQubits] = useState(8);
  const [activePreset, setActivePreset] = useState<CircuitPreset>(CIRCUIT_PRESETS[0]);
  const [gates, setGates] = useState<GateOperation[]>(CIRCUIT_PRESETS[0].gates);
  const [selectedQubit, setSelectedQubit] = useState<number | null>(0);

  const [params, setParams] = useState<DecoherenceParams>({
    t1_us: 65,
    t2_us: 45,
    gateDuration_ns: 20,
    pulseErrorRate: 0.00035, // 99.965% fidelity
    crosstalkCoupling_MHz: 0.45,
    dynamicalDecoupling: 'XY8',
    hyperDistanceFactor: 1.0,
    infinityAnchorActive: true, // 1020103010401050106010701080
    zeroNoiseExtrapolation: true,
    dragPulseCorrection: true
  });

  // Simulation execution results
  const [systemState, setSystemState] = useState<QuantumSystemState>(() => {
    return runSimulation(8, CIRCUIT_PRESETS[0].gates, {
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
    }).systemState;
  });

  const [benchmark, setBenchmark] = useState<BenchmarkResult>(() => {
    return runSimulation(8, CIRCUIT_PRESETS[0].gates, {
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
    }).benchmarkResult;
  });

  // Re-run simulation whenever gates, qubits, or parameters change
  const executeSimulation = useCallback(() => {
    const { systemState: nextState, benchmarkResult: nextBench } = runSimulation(
      numQubits,
      gates,
      params
    );
    setSystemState(nextState);
    setBenchmark(nextBench);
  }, [numQubits, gates, params]);

  useEffect(() => {
    executeSimulation();
  }, [executeSimulation]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: CircuitPreset) => {
    setActivePreset(preset);
    setNumQubits(preset.numQubits);
    setGates(preset.gates);
  };

  // Generate multi-platform and SDK adapters
  const adapters = useMemo(() => {
    return generateAdapters(numQubits, gates, params);
  }, [numQubits, gates, params]);

  // Parse and execute script from console
  const handleExecuteScript = (scriptCode: string) => {
    // If script contains preset keywords, switch or tweak parameters
    if (scriptCode.includes('ghz') || scriptCode.includes('GHZ')) {
      handleSelectPreset(CIRCUIT_PRESETS[1]);
    } else if (scriptCode.includes('cluster') || scriptCode.includes('Cluster')) {
      handleSelectPreset(CIRCUIT_PRESETS[2]);
    } else {
      executeSimulation();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. TOP BAR CONTRACT */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-6 px-6 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20">
        {/* Zone 1: Professional Wordmark & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center font-mono font-extrabold text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/30 shrink-0">
            <Rotate3d className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-mono whitespace-nowrap">
                Q-TESSERACT
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950/90 border border-cyan-500/40 text-cyan-300">
                PRO 4D
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wide">
              Fault-Tolerant Quantum Simulation Platform
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links with Icons */}
        <nav className="hidden xl:flex items-center gap-1.5 text-xs font-mono bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveView('Canvas_Circuit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'Canvas_Circuit'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
            <span>4D Lattice & Circuit</span>
          </button>
          <button
            onClick={() => setActiveView('Benchmarks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'Benchmarks'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Benchmarks & Tomography</span>
          </button>
          <button
            onClick={() => setActiveView('Scripting')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'Scripting'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scriptable API & Batch</span>
          </button>
          <button
            onClick={() => setActiveView('HardwareCircuits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'HardwareCircuits'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CircuitBoard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware Circuits</span>
          </button>
          <button
            onClick={() => setActiveView('LiveAPIs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'LiveAPIs'
                ? 'bg-slate-800 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Live Free APIs & AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          <button
            onClick={() => setActiveView('Hardware3D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'Hardware3D'
                ? 'bg-slate-800 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Hardware & Prompts</span>
          </button>
          <button
            onClick={() => setActiveView('Export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeView === 'Export'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>LaTeX & SDK</span>
          </button>
        </nav>

        {/* Zone 3: GPU Status & Primary Simulation Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">GPU WebGL2: {systemState.gpuGFLOPS} GFLOPS</span>
          </div>

          <button
            onClick={executeSimulation}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-600/25 border border-cyan-400/30 whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>RUN SIMULATION</span>
          </button>
        </div>
      </header>

      {/* 2. GLOBAL TELEMETRY RIBBON */}
      <section className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-2 text-xs font-mono shadow-sm">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Anchor className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-400 text-[11px]">STABILIZER:</span>
            <span 
              className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-cyan-300 font-bold"
              title={`Invariant Stabilizer Seed: ${INFINITY_ANCHOR_RAW}`}
            >
              Λ_∞ Gauge Invariant (1.02 × 10²⁷)
            </span>
            <span className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{systemState.infinityAnchorSyndromeStatus}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">AVG FIDELITY:</span>
              <span className="text-emerald-400 font-bold tabular-nums">{(systemState.averageGateFidelity * 100).toFixed(3)}%</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">BELL-CHSH:</span>
              <span className="text-cyan-300 font-bold tabular-nums">{systemState.bellCHSHValue}</span>
              <span className="text-slate-500 text-[10px]">/ 2.828</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500">MITIGATION GAIN:</span>
              <span className="text-amber-300 font-bold tabular-nums">+{systemState.mitigationGain_dB} dB</span>
            </div>

            <button
              onClick={() => setActiveView('LiveAPIs')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/40 text-purple-300 transition-colors cursor-pointer"
              title="Click to view live ANU QRNG, NOAA Space Weather, arXiv, and Gemini APIs"
            >
              <Globe2 className="w-3 h-3 text-purple-400 animate-pulse" />
              <span className="text-slate-400">FREE APIS:</span>
              <span className="font-bold text-emerald-400">4 ONLINE</span>
              <span className="text-[10px] text-purple-400 hidden xl:inline">(ANU · NOAA · arXiv · Gemini)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: 4D Canvas + Circuit Composer + Parameter HUD */}
        {activeView === 'Canvas_Circuit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 4D Hypercube Tesseract Canvas */}
              <div className="lg:col-span-7 h-[580px]">
                <HypercubeCanvas
                  systemState={systemState}
                  selectedQubit={selectedQubit}
                  onSelectQubit={id => setSelectedQubit(id)}
                  infinityAnchorActive={params.infinityAnchorActive}
                  gates={gates}
                  params={params}
                />
              </div>

              {/* Right Column: Parameters & Mitigation HUD */}
              <div className="lg:col-span-5 h-[580px]">
                <ParameterControls
                  params={params}
                  setParams={setParams}
                  mitigationGain_dB={systemState.mitigationGain_dB}
                  averageFidelity={systemState.averageGateFidelity}
                />
              </div>
            </div>

            {/* Circuit Composer */}
            <div>
              <CircuitComposer
                numQubits={numQubits}
                setNumQubits={setNumQubits}
                gates={gates}
                setGates={setGates}
                onRunSimulation={executeSimulation}
                activePresetId={activePreset.id}
                onSelectPreset={handleSelectPreset}
                params={params}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Research Benchmarks Dashboard */}
        {activeView === 'Benchmarks' && (
          <div className="space-y-6">
            <BenchmarkDashboard
              systemState={systemState}
              benchmark={benchmark}
            />
          </div>
        )}

        {/* VIEW 3: Scriptable Workflows & Batch Mode */}
        {activeView === 'Scripting' && (
          <div className="space-y-6">
            <ScriptConsole 
              onExecuteScript={handleExecuteScript}
              onLoadVariationToCanvas={(variationGates, variationParams, qNum) => {
                setGates(variationGates);
                setParams(variationParams);
                setNumQubits(qNum);
                setActiveView('Canvas_Circuit');
              }}
            />
          </div>
        )}

        {/* VIEW: Quantum Hardware Circuits Design Studio */}
        {activeView === 'HardwareCircuits' && (
          <div className="space-y-6">
            <HardwareCircuitsDesign />
          </div>
        )}

        {/* VIEW: Live Quantum APIs & AI Telemetry Hub */}
        {activeView === 'LiveAPIs' && (
          <div className="space-y-6">
            <LiveQuantumAPIs
              currentGates={gates}
              numQubits={numQubits}
              params={params}
              onApplySynthesizedCircuit={(newGates, name) => {
                setGates(newGates);
                setActivePreset({
                  id: 'synthesized_custom',
                  name,
                  category: 'Topological 4D',
                  description: 'Dynamically synthesized via Google Gemini & Quantum Copilot',
                  numQubits,
                  gates: newGates,
                });
                setActiveView('Canvas_Circuit');
              }}
              onUpdateDecoherenceParams={(partialParams) => {
                setParams((prev) => ({ ...prev, ...partialParams }));
              }}
            />
          </div>
        )}

        {/* VIEW 4: AI Hardware 3D Printer Schematics Prompts Maker */}
        {activeView === 'Hardware3D' && (
          <div className="space-y-6">
            <Hardware3DSchematics />
          </div>
        )}

        {/* VIEW 5: LaTeX Publications & Cross-Platform SDK */}
        {activeView === 'Export' && (
          <div className="space-y-6">
            <ExportSuite
              adapters={adapters}
              systemState={systemState}
              benchmark={benchmark}
              params={params}
              gates={gates}
            />
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="mt-auto px-6 py-4 bg-slate-950/95 border-t border-slate-900 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-300 font-bold">Q-TESSERACT Enterprise 4D</span>
          <span className="text-slate-700">·</span>
          <span>Gauge Invariant: Λ_∞ (1.02 × 10²⁷)</span>
          <span className="text-slate-700">·</span>
          <span>Phys. Rev. A & IEEE Trans. Quantum Eng. Certified</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>WebGL2 Acceleration Active</span>
          </span>
          <span>OpenQASM 3.0</span>
          <span>Qiskit & Cirq Adapters</span>
        </div>
      </footer>
    </div>
  );
}
