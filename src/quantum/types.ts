/**
 * Types for 4-Dimensional Quantum Computer Simulation Software
 * Supporting Macroscopic Qubit Scale: 1020103010401050106010701080
 */

export interface Complex {
  r: number; // real part
  i: number; // imaginary part
}

export type GateType = 
  | 'H' 
  | 'X' 
  | 'Y' 
  | 'Z' 
  | 'S' 
  | 'T' 
  | 'Rx' 
  | 'Ry' 
  | 'Rz' 
  | 'CNOT' 
  | 'CZ' 
  | 'SWAP' 
  | 'iSWAP' 
  | 'CP4D' 
  | 'DD_XY8' 
  | 'DD_CPMG' 
  | 'M';

export interface GateOperation {
  id: string;
  type: GateType;
  targetQubit: number;
  controlQubit?: number;
  theta?: number; // rotation angle in radians for Rx, Ry, Rz
  phi?: number;
  timeStep: number;
  fidelity: number;
}

export interface Qubit4DCoord {
  id: number;
  x: number; // 0 or 1 in tesseract vertex
  y: number;
  z: number;
  w: number;
  label: string;
  t1_us: number; // T1 relaxation in microseconds
  t2_us: number; // T2 dephasing in microseconds
  statePhase: number;
  amplitude0: Complex;
  amplitude1: Complex;
  blochVector: [number, number, number]; // [x, y, z] on Bloch sphere
}

export interface EntanglementLink {
  qubitA: number;
  qubitB: number;
  hyperDistance: number; // 4D Euclidean distance sqrt(dx^2 + dy^2 + dz^2 + dw^2)
  concurrence: number; // 0.0 to 1.0
  negativity: number;
  fidelity: number;
  bellState: 'Phi+' | 'Phi-' | 'Psi+' | 'Psi-' | 'Mixed';
}

export interface DecoherenceParams {
  t1_us: number; // default ~65us
  t2_us: number; // default ~45us
  gateDuration_ns: number; // default ~20ns
  pulseErrorRate: number; // default 0.0004 (99.96% fidelity)
  crosstalkCoupling_MHz: number; // 4D neighbor cross-talk
  dynamicalDecoupling: 'OFF' | 'CPMG' | 'XY4' | 'XY8' | 'UDD4';
  hyperDistanceFactor: number; // scaling factor for spatial 4D separation
  infinityAnchorActive: boolean; // 4D Binary 1020103010401050106010701080 Infinity Interception Anchor
  zeroNoiseExtrapolation: boolean; // ZNE mitigation
  dragPulseCorrection: boolean; // DRAG pulse shaping
}

export interface QuantumSystemState {
  numActiveQubits: number; // 1 to 16 in focal register
  cosmologicalQubitScale: string; // "1020103010401050106010701080"
  qubits: Qubit4DCoord[];
  entanglementLinks: EntanglementLink[];
  stateVector: Complex[]; // 2^N state vector for focal active qubits
  densityMatrix: Complex[][]; // Reduced or full density matrix
  purity: number; // Tr(rho^2)
  vonNeumannEntropy: number; // -Tr(rho log2 rho)
  bellCHSHValue: number; // Bell-CHSH test S value (classical <= 2, Tsirelson bound <= 2*sqrt(2) ~ 2.828)
  averageGateFidelity: number;
  mitigationGain_dB: number;
  infinityAnchorSyndromeStatus: 'STABILIZED' | 'UNBOUND' | 'INTERCEPTING';
  circuitDepth: number;
  gpuAccelerated: boolean;
  gpuKernelTime_ms: number;
  gpuGFLOPS: number;
}

export interface BenchmarkResult {
  cliffordLengths: number[];
  fidelitiesRaw: number[];
  fidelitiesMitigated: number[];
  fitCurveParams: {
    A: number;
    p: number;
    B: number;
    errorPerClifford: number;
    mitigatedEPC: number;
  };
  processTomographyChi: number[][]; // Process matrix chi_ij
  quantumVolume: number;
  gpuSpeedupRatio: number;
  chshHistory: { angle: number; correlation: number; quantumBound: number }[];
}

export interface CircuitPreset {
  id: string;
  name: string;
  category: 'Entanglement' | 'Decoherence Mitigation' | 'Topological 4D' | 'Benchmarking';
  description: string;
  numQubits: number;
  gates: GateOperation[];
}

export interface CircuitVariation {
  id: string;
  name: string;
  description: string;
  numQubits: number;
  gates: GateOperation[];
  params: DecoherenceParams;
}

export interface BatchItemExecutionResult {
  variation: CircuitVariation;
  systemState: QuantumSystemState;
  benchmark: BenchmarkResult;
  executionTimeMs: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  error?: string;
}

export interface ComparativeAnalysis {
  timestamp: string;
  totalVariations: number;
  totalExecutionTimeMs: number;
  results: BatchItemExecutionResult[];
  rankings: {
    byFidelity: { id: string; name: string; value: number }[];
    byCHSH: { id: string; name: string; value: number }[];
    byPurity: { id: string; name: string; value: number }[];
    byEntropy: { id: string; name: string; value: number }[];
    byMitigationGain: { id: string; name: string; value: number }[];
  };
  summary: {
    bestFidelityVariation: string;
    bestCHSHVariation: string;
    maxMitigationGain_dB: number;
    averageFidelity: number;
    averageCHSH: number;
    keyInsights: string[];
  };
}

export interface BatchSuitePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  variations: CircuitVariation[];
}
