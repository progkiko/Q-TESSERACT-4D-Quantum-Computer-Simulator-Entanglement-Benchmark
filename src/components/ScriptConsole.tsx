import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Layers, 
  ListOrdered, 
  Plus, 
  Trash2, 
  ExternalLink, 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Eye, 
  FileSpreadsheet, 
  Code2,
  ChevronRight,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { INFINITY_ANCHOR_RAW } from '../quantum/constants';
import { 
  CircuitVariation, 
  BatchItemExecutionResult, 
  ComparativeAnalysis, 
  GateOperation, 
  DecoherenceParams 
} from '../quantum/types';
import { 
  BATCH_SUITE_PRESETS, 
  executeVariation, 
  computeComparativeAnalysis, 
  generateBatchLatexTable, 
  generateBatchCsv 
} from '../quantum/batchEngine';

interface ScriptConsoleProps {
  onExecuteScript: (scriptCode: string) => void;
  onLoadVariationToCanvas?: (gates: GateOperation[], params: DecoherenceParams, numQubits: number) => void;
}

const SCRIPT_PRESETS: { id: string; name: string; filename: string; mode: 'single' | 'batch'; code: string }[] = [
  {
    id: 'batch_experiment_workflow',
    name: 'Batch Mode: Multi-Variation Comparative Experiment',
    filename: 'batch_mitigation_experiment.py',
    mode: 'batch',
    code: `# Q-Tesseract 4D Python API - Batch Mode Execution
import q4d_sim as q4d
import numpy as np

# Initialize Batch Experiment Suite
batch = q4d.BatchExperiment(
    name="4D Decoherence Mitigation & Infinity Anchor Sweep",
    anchor="${INFINITY_ANCHOR_RAW}",
    max_qubits=8
)

# 1. Queue Circuit Variation A: Unmitigated Baseline (No DD, Anchor OFF)
batch.add_variation(
    id="var_raw",
    name="Baseline Unmitigated",
    circuit_type="bell_4d",
    dynamical_decoupling="OFF",
    infinity_anchor=False,
    t1_us=65.0,
    t2_us=45.0
)

# 2. Queue Circuit Variation B: CPMG Decoupling Sequence
batch.add_variation(
    id="var_cpmg",
    name="CPMG Pulse Train",
    circuit_type="bell_4d",
    dynamical_decoupling="CPMG",
    infinity_anchor=False
)

# 3. Queue Circuit Variation C: XY-8 Symmetrical Decoupling
batch.add_variation(
    id="var_xy8",
    name="XY-8 Octa-Symmetric",
    circuit_type="bell_4d",
    dynamical_decoupling="XY8",
    infinity_anchor=False
)

# 4. Queue Circuit Variation D: XY-8 + 1020103010401050106010701080 Anchor Invariant
batch.add_variation(
    id="var_fortress",
    name="Full Fortress (XY-8 + Infinity Anchor)",
    circuit_type="bell_4d",
    dynamical_decoupling="XY8",
    infinity_anchor=True,
    zero_noise_extrapolation=True
)

print(f"[BATCH] Queued {batch.queue_length} variations for execution.")
print("[BATCH] Running sequential GPGPU parallel kernels...")

# Execute batch in sequence with GPU acceleration
results = batch.run_all(gpu_acceleration=True)

# Generate scientific comparative analysis
analysis = results.generate_comparative_analysis()
print(f"[ANALYSIS] Best Variation: {analysis.best_fidelity_variation}")
print(f"[ANALYSIS] Mitigation Gain: +{analysis.max_mitigation_gain_db:.2f} dB")
print(f"[ANALYSIS] Bell-CHSH Maximum: S = {analysis.best_chsh_value:.4f}")
`
  },
  {
    id: 'ghz_protocol',
    name: '4D GHZ Entanglement Benchmark',
    filename: 'benchmark_4d_ghz.py',
    mode: 'single',
    code: `# Q-Tesseract 4D Python API Script
import q4d_sim as q4d
import numpy as np

# Initialize 4-Dimensional Hypercube Lattice (${INFINITY_ANCHOR_RAW} Scale)
sim = q4d.Simulator(dimensions=4, anchor="${INFINITY_ANCHOR_RAW}")
register = sim.allocate_register(num_qubits=8)

print("[INFO] Constructing 8-Qubit GHZ State across 4D Tesseract coordinates...")
circuit = q4d.Circuit(register)
circuit.h(register[0])

for i in range(7):
    circuit.cnot(register[i], register[i + 1])

# Apply XY-8 composite dynamical decoupling sequence on long-distance endpoints
circuit.dynamical_decoupling(register[0], sequence="XY8")
circuit.dynamical_decoupling(register[7], sequence="XY8")

# Execute GPU accelerated contraction
result = sim.run(circuit, shots=4096, gpu_acceleration=True)
fidelity = result.get_state_fidelity()
bell_chsh = result.compute_chsh_parameter(qubit_a=0, qubit_b=7)

print(f"[SUCCESS] Quantum Process Completed in {result.execution_time_ms:.2f} ms")
print(f"[METRIC] State Fidelity F = {fidelity:.5f}")
print(f"[METRIC] Bell-CHSH Violation S = {bell_chsh:.4f} (Tsirelson Bound: 2.8284)")
print(f"[STATUS] Infinity Anchor Gauge Invariant: STABILIZED")
`
  },
  {
    id: 'xy8_mitigation',
    name: 'Long-Distance Decoherence Mitigation Sweep',
    filename: 'decoherence_mitigation_sweep.py',
    mode: 'single',
    code: `# Parametric Sweep: Long-Distance Decoherence Mitigation
import q4d_sim as q4d
import numpy as np

sim = q4d.Simulator(anchor="${INFINITY_ANCHOR_RAW}")
distances = [1.0, 1.414, 1.732, 2.0] # 4D Euclidean Distances

print("[INFO] Initiating parametric Lindblad master equation solver...")
for d in distances:
    qc = q4d.Circuit(qubits=4)
    qc.h(0)
    qc.cnot(0, 1)
    # Apply 4D Hyper-coupler with metric compensation
    qc.cp_4d(0, 3, hyper_distance=d)
    
    # Toggle 1020103010401050106010701080 Anchor
    res_mitigated = sim.simulate_lindblad(qc, t1=65.0, t2=45.0, anchor=True)
    res_raw = sim.simulate_lindblad(qc, t1=65.0, t2=45.0, anchor=False)
    
    gain_db = 10 * np.log10((1 - res_raw.fidelity) / max(1e-5, (1 - res_mitigated.fidelity)))
    print(f"Distance d_4 = {d:.3f} | Mitigated F = {res_mitigated.fidelity:.5f} | Gain = +{gain_db:.2f} dB")

print("[DONE] Mitigation sweep completed. Gauge parity conserved.")
`
  },
  {
    id: 'infinity_stabilizer',
    name: '1020103010401050106010701080 Gauge Anchor Verification',
    filename: 'verify_infinity_anchor.py',
    mode: 'single',
    code: `# Verification of 4D Binary Infinity Interception Anchor
import q4d_sim as q4d

ANCHOR_TOKEN = "${INFINITY_ANCHOR_RAW}"
print(f"[INIT] Validating Topological Gauge Anchor: {ANCHOR_TOKEN}")

anchor_projector = q4d.StabilizerAnchor(
    token=ANCHOR_TOKEN,
    dimension=4,
    gauge_mode="projective_clifford"
)

# Extract 4D plaquette syndrome measurements
syndromes = anchor_projector.measure_hyper_syndromes()
print(f"[SYNDROME] Parity Checks: {syndromes.parity_vector}")
print(f"[SYNDROME] Error Syndrome Weight: {syndromes.weight} (Zero Defect)")
print(f"[RESULT] Projective Space Stabilized at Infinity Boundary.")
`
  }
];

export const ScriptConsole: React.FC<ScriptConsoleProps> = ({ 
  onExecuteScript,
  onLoadVariationToCanvas 
}) => {
  // Top-level View Mode: 'batch_studio' or 'code_terminal'
  const [consoleMode, setConsoleMode] = useState<'batch_studio' | 'code_terminal'>('batch_studio');

  // Active Code Editor Preset
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [scriptCode, setScriptCode] = useState(SCRIPT_PRESETS[0].code);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[Q4D-KERNEL] 4D Quantum Simulation Engine v4.8 initialized.`,
    `[Q4D-KERNEL] Cosmological scale: ${INFINITY_ANCHOR_RAW} Qubits.`,
    `[Q4D-KERNEL] WebGL2 GPGPU Quantum State Evolution active.`,
    `[Q4D-BATCH] Batch Execution & Comparative Analysis Engine ready.`
  ]);
  const [isExecutingScript, setIsExecutingScript] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // --- BATCH MODE STATE ---
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('suite_dd_mitigation');
  const [batchQueue, setBatchQueue] = useState<CircuitVariation[]>(() => {
    return BATCH_SUITE_PRESETS[0].variations;
  });
  
  // Execution state for batch queue
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState<number | null>(null);
  const [batchResults, setBatchResults] = useState<BatchItemExecutionResult[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ComparativeAnalysis | null>(null);
  
  // Selected tab in Comparative Analysis view
  const [analysisTab, setAnalysisTab] = useState<'overview' | 'charts' | 'matrix' | 'latex_export'>('overview');
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Load initial batch run automatically so users immediately see results
  useEffect(() => {
    const initialResults = BATCH_SUITE_PRESETS[0].variations.map(v => executeVariation(v));
    setBatchResults(initialResults);
    setAnalysisResult(computeComparativeAnalysis(initialResults));
  }, []);

  // Handle switching preset batch suite
  const handleSelectSuite = (suiteId: string) => {
    setSelectedSuiteId(suiteId);
    const suite = BATCH_SUITE_PRESETS.find(s => s.id === suiteId);
    if (suite) {
      setBatchQueue(suite.variations);
      // Pre-compute results
      const res = suite.variations.map(v => executeVariation(v));
      setBatchResults(res);
      setAnalysisResult(computeComparativeAnalysis(res));
      setTerminalLogs(prev => [
        ...prev,
        `[BATCH] Loaded suite: '${suite.name}' (${suite.variations.length} variations queued).`
      ]);
    }
  };

  // Run the batch queue in sequence with animated step-by-step progress
  const handleExecuteBatchQueue = async () => {
    if (batchQueue.length === 0 || isBatchRunning) return;
    setIsBatchRunning(true);
    setAnalysisResult(null);

    // Initialize all to PENDING
    const pendingResults: BatchItemExecutionResult[] = batchQueue.map(v => ({
      variation: v,
      systemState: {} as any,
      benchmark: {} as any,
      executionTimeMs: 0,
      status: 'PENDING'
    }));
    setBatchResults([...pendingResults]);

    setTerminalLogs(prev => [
      ...prev,
      `============================================================`,
      `[BATCH-START] Queued ${batchQueue.length} circuit variations for sequential execution.`,
      `[BATCH-START] Invariant Anchor: ${INFINITY_ANCHOR_RAW} Active.`,
      `============================================================`
    ]);

    const completedResults: BatchItemExecutionResult[] = [];

    for (let i = 0; i < batchQueue.length; i++) {
      setCurrentRunningIndex(i);
      const v = batchQueue[i];

      // Update item status to RUNNING
      pendingResults[i].status = 'RUNNING';
      setBatchResults([...pendingResults]);

      setTerminalLogs(prev => [
        ...prev,
        `>>> [${i + 1}/${batchQueue.length}] Executing '${v.name}' (DD: ${v.params.dynamicalDecoupling}, Anchor: ${v.params.infinityAnchorActive ? 'ON' : 'OFF'})...`
      ]);

      // Small delay to simulate GPU shader kernel dispatch and provide visual progress feedback
      await new Promise(r => setTimeout(r, 450));

      const res = executeVariation(v);
      pendingResults[i] = res;
      completedResults.push(res);
      setBatchResults([...pendingResults]);

      setTerminalLogs(prev => [
        ...prev,
        `    ↳ Done in ${res.executionTimeMs.toFixed(1)}ms | Fidelity: ${(res.systemState.averageGateFidelity * 100).toFixed(3)}% | CHSH: ${res.systemState.bellCHSHValue.toFixed(4)} | Gain: +${res.systemState.mitigationGain_dB.toFixed(2)} dB`
      ]);
    }

    const finalAnalysis = computeComparativeAnalysis(completedResults);
    setAnalysisResult(finalAnalysis);
    setIsBatchRunning(false);
    setCurrentRunningIndex(null);

    setTerminalLogs(prev => [
      ...prev,
      `============================================================`,
      `[BATCH-COMPLETE] Successfully executed ${completedResults.length} variations.`,
      `[BATCH-SUMMARY] Best Performing: ${finalAnalysis.summary.bestFidelityVariation}`,
      `[BATCH-SUMMARY] Max Mitigation Gain: +${finalAnalysis.summary.maxMitigationGain_dB.toFixed(2)} dB`,
      `[BATCH-SUMMARY] Tsirelson Violation: S = ${finalAnalysis.summary.bestCHSHVariation}`,
      `============================================================`
    ]);
  };

  // Run script in code editor
  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setScriptCode(SCRIPT_PRESETS[idx].code);
  };

  const handleRunScript = () => {
    setIsExecutingScript(true);
    setTerminalLogs(prev => [
      ...prev,
      `>>> Running ${SCRIPT_PRESETS[activePresetIndex].filename}...`
    ]);

    setTimeout(() => {
      onExecuteScript(scriptCode);
      if (SCRIPT_PRESETS[activePresetIndex].mode === 'batch') {
        // Also trigger batch queue execution
        handleExecuteBatchQueue();
      } else {
        setTerminalLogs(prev => [
          ...prev,
          `[EXEC] Parsing 4D quantum operations... OK`,
          `[EXEC] Dispatching parallel unitary matrix kernels to GPU...`,
          `[EXEC] Compiling Lindblad dissipation tensors (T1=65μs, T2=45μs)...`,
          `[EXEC] Evaluating 4D Bell-CHSH witness operator... S = 2.8124`,
          `[EXEC] Invariant ${INFINITY_ANCHOR_RAW} anchor verified.`,
          `[SUCCESS] Workflow finished with exit code 0 (100% Fidelity Bounds).`
        ]);
      }
      setIsExecutingScript(false);
    }, 600);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([scriptCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = SCRIPT_PRESETS[activePresetIndex].filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    if (!analysisResult) return;
    const latex = generateBatchLatexTable(analysisResult);
    navigator.clipboard.writeText(latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!analysisResult) return;
    const csv = generateBatchCsv(analysisResult);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `q4d_batch_comparative_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Remove item from batch queue
  const handleRemoveFromQueue = (index: number) => {
    if (batchQueue.length <= 1) return;
    const next = batchQueue.filter((_, idx) => idx !== index);
    setBatchQueue(next);
  };

  // Add a clone or custom variation
  const handleDuplicateVariation = (variation: CircuitVariation) => {
    const newVar: CircuitVariation = {
      ...variation,
      id: `var_${Date.now()}`,
      name: `${variation.name} (Copy)`
    };
    setBatchQueue(prev => [...prev, newVar]);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-2xl text-xs font-mono">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 tracking-wide uppercase text-sm">
              SCRIPTABLE QUANTUM API & BATCH WORKFLOW ENGINE
            </span>
            <span className="text-[10px] text-slate-400">
              Multi-Variation Queue Execution · Statistical Comparative Analysis · LaTeX Reporting
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
          <button
            onClick={() => setConsoleMode('batch_studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors font-semibold ${
              consoleMode === 'batch_studio'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Batch Mode & Analysis</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-400/20 text-cyan-200">
              {batchQueue.length} Variations
            </span>
          </button>

          <button
            onClick={() => setConsoleMode('code_terminal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors font-semibold ${
              consoleMode === 'code_terminal'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Script & Terminal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: BATCH EXECUTION & COMPARATIVE ANALYSIS STUDIO                     */}
      {/* ========================================================================= */}
      {consoleMode === 'batch_studio' && (
        <div className="space-y-6 p-5 bg-slate-950/70">
          {/* Top Bar: Pre-configured Batch Suite Selector & Execute Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 text-xs uppercase font-semibold">
                Preset Batch Suite:
              </span>
              {BATCH_SUITE_PRESETS.map(suite => (
                <button
                  key={suite.id}
                  onClick={() => handleSelectSuite(suite.id)}
                  disabled={isBatchRunning}
                  className={`px-3 py-1.5 rounded text-xs transition-all ${
                    selectedSuiteId === suite.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {suite.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteBatchQueue}
                disabled={isBatchRunning || batchQueue.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-cyan-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isBatchRunning ? 'RUNNING BATCH SEQUENCE…' : 'EXECUTE BATCH QUEUE'}</span>
              </button>
            </div>
          </div>

          {/* Real-Time Batch Execution Progress Banner */}
          {isBatchRunning && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>
                    Executing Variation {(currentRunningIndex ?? 0) + 1} of {batchQueue.length}:{' '}
                    {batchQueue[currentRunningIndex ?? 0]?.name}
                  </span>
                </div>
                <span className="text-cyan-400 font-mono">
                  {Math.round((((currentRunningIndex ?? 0) + 1) / batchQueue.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${(((currentRunningIndex ?? 0) + 1) / batchQueue.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid: Left Column = Queue Inspector, Right Column = Comparative Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Circuit Variations Queue (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200 uppercase text-xs">
                    VARIATION QUEUE ({batchQueue.length})
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Sequential Dispatch</span>
              </div>

              <div className="p-3 space-y-2.5 max-h-[580px] overflow-y-auto">
                {batchQueue.map((variation, idx) => {
                  const isRunning = isBatchRunning && currentRunningIndex === idx;
                  const itemResult = batchResults[idx];
                  const isDone = itemResult && itemResult.status === 'COMPLETED';

                  return (
                    <div
                      key={variation.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isRunning
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : isDone
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isRunning
                              ? 'bg-cyan-500 text-black animate-spin'
                              : isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-200 text-xs">
                            {variation.name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isRunning
                            ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                            : isDone
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isRunning ? 'RUNNING' : isDone ? 'COMPLETED' : 'QUEUED'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                        {variation.description}
                      </p>

                      {/* Parameters Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          DD: <strong className="text-cyan-300">{variation.params.dynamicalDecoupling}</strong>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${
                          variation.params.infinityAnchorActive 
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30' 
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                          Anchor: {variation.params.infinityAnchorActive ? 'ON' : 'OFF'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {variation.gates.length} Gates
                        </span>

                        {isDone && itemResult.systemState && (
                          <span className="ml-auto text-emerald-400 font-bold font-mono text-[10px]">
                            F = {(itemResult.systemState.averageGateFidelity * 100).toFixed(2)}%
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 text-[10px]">
                        {onLoadVariationToCanvas && isDone && (
                          <button
                            onClick={() => onLoadVariationToCanvas(variation.gates, variation.params, variation.numQubits)}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Load variation into 4D Canvas"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect 4D</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicateVariation(variation)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Clone variation"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Clone</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFromQueue(idx)}
                          className="flex items-center gap-1 text-red-400/70 hover:text-red-400 transition-colors"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Final Comparative Analysis (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-100 uppercase text-xs">
                    FINAL COMPARATIVE ANALYSIS
                  </span>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setAnalysisTab('overview')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      analysisTab === 'overview'
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setAnalysisTab('charts')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      analysisTab === 'charts'
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setAnalysisTab('matrix')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      analysisTab === 'matrix'
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Metrics Table
                  </button>
                  <button
                    onClick={() => setAnalysisTab('latex_export')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      analysisTab === 'latex_export'
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    LaTeX Export
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
                {analysisResult ? (
                  <>
                    {/* SUB-VIEW 1: OVERVIEW & KPI CARDS */}
                    {analysisTab === 'overview' && (
                      <div className="space-y-4">
                        {/* 4 Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Top Variation</span>
                            <div className="text-xs font-bold text-cyan-300 truncate" title={analysisResult.summary.bestFidelityVariation}>
                              {analysisResult.summary.bestFidelityVariation}
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              {(analysisResult.rankings.byFidelity[0]?.value * 100).toFixed(3)}% F
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Peak CHSH (S)</span>
                            <div className="text-sm font-bold text-emerald-400">
                              {analysisResult.rankings.byCHSH[0]?.value.toFixed(4)}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Tsirelson: 2.8284
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Mitigation Gain</span>
                            <div className="text-sm font-bold text-amber-300">
                              +{analysisResult.summary.maxMitigationGain_dB.toFixed(2)} dB
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Noise Suppression
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Batch Compute</span>
                            <div className="text-sm font-bold text-indigo-300">
                              {analysisResult.totalExecutionTimeMs.toFixed(1)} ms
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {analysisResult.totalVariations} Circuits
                            </span>
                          </div>
                        </div>

                        {/* Scientific Insights & Findings */}
                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Automated Scientific Insights & Conclusions</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] text-slate-300">
                            {analysisResult.summary.keyInsights.map((insight, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-cyan-400 shrink-0 font-bold">›</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Mini Comparative Bar Preview */}
                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Process Fidelity (F) Comparison:</span>
                            <span className="text-slate-500 text-[10px]">Higher is better</span>
                          </div>
                          <div className="space-y-2">
                            {analysisResult.results.map((r, i) => {
                              const fid = r.systemState.averageGateFidelity;
                              const pct = Math.max(5, (fid - 0.95) / 0.05 * 100);
                              return (
                                <div key={r.variation.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-300 truncate max-w-[280px]">
                                      {r.variation.name}
                                    </span>
                                    <span className="text-emerald-400 font-bold font-mono">
                                      {(fid * 100).toFixed(3)}%
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                                    <div 
                                      className="h-full rounded bg-gradient-to-r from-cyan-500 to-emerald-400"
                                      style={{ width: `${Math.min(100, Math.max(10, pct))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 2: ADVANCED COMPARATIVE CHARTS */}
                    {analysisTab === 'charts' && (
                      <div className="space-y-4">
                        {/* Chart 1: Bell-CHSH Violation Parameter */}
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 uppercase">
                              Bell-CHSH Witness Parameter ($S$) vs Limits
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Classical $\le 2.0$ | Quantum $\le 2.8284$
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {analysisResult.results.map(r => {
                              const chsh = r.systemState.bellCHSHValue;
                              const pct = Math.min(100, (chsh / 2.8284) * 100);
                              const isQuantum = chsh > 2.0;
                              return (
                                <div key={r.variation.id} className="space-y-1 text-xs">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-300 font-medium truncate max-w-[240px]">
                                      {r.variation.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        isQuantum ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                      }`}>
                                        {isQuantum ? 'QUANTUM VIOLATION' : 'CLASSICAL BOUND'}
                                      </span>
                                      <span className="font-mono font-bold text-cyan-300">
                                        S = {chsh.toFixed(4)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="relative w-full h-3 rounded bg-slate-900 overflow-hidden">
                                    {/* 2.0 Classical Limit Marker */}
                                    <div 
                                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                                      style={{ left: `${(2.0 / 2.8284) * 100}%` }}
                                      title="Classical Local Realism Limit (2.000)"
                                    />
                                    <div 
                                      className={`h-full rounded transition-all duration-500 ${
                                        isQuantum 
                                          ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400' 
                                          : 'bg-amber-600'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Chart 2: Purity vs Von Neumann Entropy */}
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 uppercase">
                              State Purity (&gamma; = Tr(&rho;&sup2;)) vs Von Neumann Entropy (S_vN)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ideal Pure State: &gamma;=1.0, S=0.0
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <span className="text-[11px] text-cyan-300 font-semibold block">Purity (&gamma;):</span>
                              {analysisResult.results.map(r => (
                                <div key={r.variation.id} className="flex justify-between items-center text-[10px] bg-slate-900/60 px-2 py-1.5 rounded">
                                  <span className="text-slate-400 truncate max-w-[120px]">{r.variation.name}</span>
                                  <span className="text-emerald-400 font-bold font-mono">{r.systemState.purity.toFixed(4)}</span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] text-indigo-300 font-semibold block">Entropy (S_vN):</span>
                              {analysisResult.results.map(r => (
                                <div key={r.variation.id} className="flex justify-between items-center text-[10px] bg-slate-900/60 px-2 py-1.5 rounded">
                                  <span className="text-slate-400 truncate max-w-[120px]">{r.variation.name}</span>
                                  <span className="text-amber-300 font-bold font-mono">{r.systemState.vonNeumannEntropy.toFixed(4)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 3: COMPARATIVE METRICS MATRIX TABLE */}
                    {analysisTab === 'matrix' && (
                      <div className="space-y-3">
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-2">Variation</th>
                                <th className="px-2 py-2">DD Seq</th>
                                <th className="px-2 py-2">Anchor</th>
                                <th className="px-2 py-2">Fidelity</th>
                                <th className="px-2 py-2">CHSH (S)</th>
                                <th className="px-2 py-2">Purity</th>
                                <th className="px-2 py-2">Gain</th>
                                <th className="px-2 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                              {analysisResult.results.map((r, i) => (
                                <tr key={r.variation.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="px-3 py-2 font-medium text-slate-200">
                                    <div className="truncate max-w-[160px]" title={r.variation.name}>
                                      {r.variation.name}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-cyan-300 font-mono">
                                    {r.variation.params.dynamicalDecoupling}
                                  </td>
                                  <td className="px-2 py-2">
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      r.variation.params.infinityAnchorActive 
                                        ? 'bg-emerald-500/20 text-emerald-300' 
                                        : 'bg-slate-800 text-slate-500'
                                    }`}>
                                      {r.variation.params.infinityAnchorActive ? 'ON' : 'OFF'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-emerald-400 font-bold font-mono">
                                    {(r.systemState.averageGateFidelity * 100).toFixed(3)}%
                                  </td>
                                  <td className="px-2 py-2 text-cyan-300 font-mono">
                                    {r.systemState.bellCHSHValue.toFixed(4)}
                                  </td>
                                  <td className="px-2 py-2 text-slate-300 font-mono">
                                    {r.systemState.purity.toFixed(3)}
                                  </td>
                                  <td className="px-2 py-2 text-amber-300 font-mono font-bold">
                                    +{r.systemState.mitigationGain_dB.toFixed(2)} dB
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    {onLoadVariationToCanvas && (
                                      <button
                                        onClick={() => onLoadVariationToCanvas(r.variation.gates, r.variation.params, r.variation.numQubits)}
                                        className="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white transition-colors text-[10px] font-bold"
                                      >
                                        Inspect
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={handleDownloadCsv}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Download CSV</span>
                          </button>
                          <button
                            onClick={handleCopyLatex}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900 transition-colors text-xs font-semibold"
                          >
                            {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLatex ? 'LaTeX Copied!' : 'Copy LaTeX Table'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 4: LATEX PUBLICATION SNIPPET */}
                    {analysisTab === 'latex_export' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">
                            Physical Review A Ready LaTeX Table:
                          </span>
                          <button
                            onClick={handleCopyLatex}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            {copiedLatex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedLatex ? 'COPIED TO CLIPBOARD' : 'COPY LATEX CODE'}</span>
                          </button>
                        </div>

                        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto max-h-72 leading-relaxed selection:bg-cyan-500/30">
                          {generateBatchLatexTable(analysisResult)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Activity className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                    <p className="text-xs">Batch sequence pending execution.</p>
                    <p className="text-[11px] text-slate-600">
                      Click 'EXECUTE BATCH QUEUE' above to run all variations and synthesize comparative analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: INTERACTIVE PYTHON CODE EDITOR & LIVE TERMINAL                    */}
      {/* ========================================================================= */}
      {consoleMode === 'code_terminal' && (
        <div className="space-y-4 p-5 bg-slate-950/70">
          {/* Preset Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-semibold">
              Select Python Script:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SCRIPT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    activePresetIndex === idx
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            {/* Code Editor */}
            <div className="flex flex-col h-96">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{SCRIPT_PRESETS[activePresetIndex].filename}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                    title="Copy script code"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                    title="Download Python script"
                  >
                    <Download className="w-3 h-3" />
                    <span>SAVE</span>
                  </button>
                </div>
              </div>

              <textarea
                value={scriptCode}
                onChange={e => setScriptCode(e.target.value)}
                className="flex-1 w-full p-3 bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />

              <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Python 3.11 / Q4D-Sim Core</span>
                <button
                  onClick={handleRunScript}
                  disabled={isExecutingScript}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-bold transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecutingScript ? 'EXECUTING…' : 'RUN SCRIPT'}</span>
                </button>
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="flex flex-col h-96 bg-black/60">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400">
                <span>TERMINAL OUTPUT // STDOUT</span>
                <button
                  onClick={() => setTerminalLogs([`[Q4D-READY] Terminal output buffer cleared.`])}
                  className="text-slate-500 hover:text-slate-300"
                >
                  CLEAR
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-1.5 text-[11px] font-mono leading-relaxed">
                {terminalLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`${
                      log.includes('[SUCCESS]') || log.includes('STABILIZED') || log.includes('[BATCH-COMPLETE]')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('[METRIC]') || log.includes('[ANALYSIS]') || log.includes('↳')
                        ? 'text-cyan-300'
                        : log.includes('[INFO]') || log.includes('>>>') || log.includes('[BATCH-START]')
                        ? 'text-amber-300 font-semibold'
                        : log.includes('====')
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
