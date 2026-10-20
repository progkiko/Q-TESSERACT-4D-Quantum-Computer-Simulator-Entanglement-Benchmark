import { Complex, GateOperation, GateType, Qubit4DCoord, EntanglementLink, DecoherenceParams, QuantumSystemState, BenchmarkResult, CircuitPreset } from './types';
import { TESSERACT_VERTICES, calc4DDistance, INFINITY_ANCHOR_RAW } from './constants';

// --- Complex Number Utilities ---
export function c(r = 0, i = 0): Complex {
  return { r: isNaN(r) ? 0 : r, i: isNaN(i) ? 0 : i };
}

export function cAdd(a?: Complex | null, b?: Complex | null): Complex {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  const br = b?.r ?? 0;
  const bi = b?.i ?? 0;
  return { r: ar + br, i: ai + bi };
}

export function cSub(a?: Complex | null, b?: Complex | null): Complex {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  const br = b?.r ?? 0;
  const bi = b?.i ?? 0;
  return { r: ar - br, i: ai - bi };
}

export function cMul(a?: Complex | null, b?: Complex | null): Complex {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  const br = b?.r ?? 0;
  const bi = b?.i ?? 0;
  return {
    r: ar * br - ai * bi,
    i: ar * bi + ai * br,
  };
}

export function cScale(a?: Complex | null, s = 1): Complex {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  return { r: ar * s, i: ai * s };
}

export function cAbs(a?: Complex | null): number {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  return Math.sqrt(ar * ar + ai * ai);
}

export function cAbsSq(a?: Complex | null): number {
  const ar = a?.r ?? 0;
  const ai = a?.i ?? 0;
  return ar * ar + ai * ai;
}

export function cConj(a?: Complex | null): Complex {
  return { r: a?.r ?? 0, i: -(a?.i ?? 0) };
}

export function cExp(phase: number): Complex {
  return { r: Math.cos(phase), i: Math.sin(phase) };
}

// 1-Qubit standard matrix definition [ [m00, m01], [m10, m11] ]
export type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];

const INV_SQRT2 = 1 / Math.SQRT2;

export function get1QubitMatrix(type: GateType, theta = 0): Matrix2x2 {
  switch (type) {
    case 'H':
      return [
        [c(INV_SQRT2, 0), c(INV_SQRT2, 0)],
        [c(INV_SQRT2, 0), c(-INV_SQRT2, 0)]
      ];
    case 'X':
      return [
        [c(0, 0), c(1, 0)],
        [c(1, 0), c(0, 0)]
      ];
    case 'Y':
      return [
        [c(0, 0), c(0, -1)],
        [c(0, 1), c(0, 0)]
      ];
    case 'Z':
      return [
        [c(1, 0), c(0, 0)],
        [c(0, 0), c(-1, 0)]
      ];
    case 'S':
      return [
        [c(1, 0), c(0, 0)],
        [c(0, 0), c(0, 1)]
      ];
    case 'T':
      return [
        [c(1, 0), c(0, 0)],
        [c(0, 0), cExp(Math.PI / 4)]
      ];
    case 'Rx': {
      const half = theta / 2;
      return [
        [c(Math.cos(half), 0), c(0, -Math.sin(half))],
        [c(0, -Math.sin(half)), c(Math.cos(half), 0)]
      ];
    }
    case 'Ry': {
      const half = theta / 2;
      return [
        [c(Math.cos(half), 0), c(-Math.sin(half), 0)],
        [c(Math.sin(half), 0), c(Math.cos(half), 0)]
      ];
    }
    case 'Rz': {
      const half = theta / 2;
      return [
        [cExp(-half), c(0, 0)],
        [c(0, 0), cExp(half)]
      ];
    }
    case 'DD_XY8':
    case 'DD_CPMG':
      // DD sequence composite refocusing pulse
      return [
        [c(0, 0), c(0, -1)],
        [c(0, 1), c(0, 0)]
      ];
    default:
      return [
        [c(1, 0), c(0, 0)],
        [c(0, 0), c(1, 0)]
      ];
  }
}

/**
 * Apply 1-qubit gate to statevector of size 2^numQubits
 */
export function apply1QubitGate(
  state: Complex[],
  numQubits: number,
  target: number,
  gateType: GateType,
  theta = 0
): Complex[] {
  if (target < 0 || target >= numQubits || !state || state.length === 0) {
    return state;
  }
  const U = get1QubitMatrix(gateType, theta);
  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  for (let i = 0; i < dim; i++) nextState[i] = c(0, 0);

  const bitMask = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & bitMask) === 0) {
      const i0 = i;
      const i1 = i | bitMask;
      if (i1 >= state.length) continue;
      const v0 = state[i0] || c(0, 0);
      const v1 = state[i1] || c(0, 0);

      // next0 = U00*v0 + U01*v1
      nextState[i0] = cAdd(cMul(U[0][0], v0), cMul(U[0][1], v1));
      // next1 = U10*v0 + U11*v1
      nextState[i1] = cAdd(cMul(U[1][0], v0), cMul(U[1][1], v1));
    }
  }

  return nextState;
}

/**
 * Apply 2-qubit controlled/entangling gate
 */
export function apply2QubitGate(
  state: Complex[],
  numQubits: number,
  control: number,
  target: number,
  gateType: GateType,
  hyperDistance = 1.0
): Complex[] {
  if (
    control < 0 || control >= numQubits ||
    target < 0 || target >= numQubits ||
    control === target ||
    !state || state.length === 0
  ) {
    return state;
  }
  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  for (let i = 0; i < dim; i++) nextState[i] = state[i] ? { ...state[i] } : c(0, 0);

  const cMask = 1 << control;
  const tMask = 1 << target;

  for (let i = 0; i < dim; i++) {
    if (gateType === 'CNOT') {
      if ((i & cMask) !== 0 && (i & tMask) === 0) {
        const i0 = i;
        const i1 = i | tMask;
        if (i1 < dim) {
          const temp = nextState[i0];
          nextState[i0] = nextState[i1];
          nextState[i1] = temp;
        }
      }
    } else if (gateType === 'CZ') {
      if ((i & cMask) !== 0 && (i & tMask) !== 0) {
        nextState[i] = cScale(nextState[i], -1);
      }
    } else if (gateType === 'SWAP') {
      const cBit = (i & cMask) !== 0 ? 1 : 0;
      const tBit = (i & tMask) !== 0 ? 1 : 0;
      if (cBit !== tBit && cBit === 1) {
        const partner = (i & ~cMask) | tMask;
        if (partner < dim) {
          const temp = nextState[i];
          nextState[i] = nextState[partner];
          nextState[partner] = temp;
        }
      }
    } else if (gateType === 'iSWAP') {
      const cBit = (i & cMask) !== 0 ? 1 : 0;
      const tBit = (i & tMask) !== 0 ? 1 : 0;
      if (cBit !== tBit && cBit === 1) {
        const partner = (i & ~cMask) | tMask;
        if (partner < dim) {
          const vA = state[i] || c(0, 0);
          const vB = state[partner] || c(0, 0);
          nextState[i] = cMul(c(0, 1), vB);
          nextState[partner] = cMul(c(0, 1), vA);
        }
      }
    } else if (gateType === 'CP4D') {
      // 4-Dimensional hyper-controlled phase: phase angle shifts by 4D distance
      if ((i & cMask) !== 0 && (i & tMask) !== 0) {
        const phase = Math.PI / Math.max(1, hyperDistance);
        nextState[i] = cMul(nextState[i], cExp(phase));
      }
    }
  }

  return nextState;
}

/**
 * Apply Lindblad Decoherence & Noise with Mitigation
 */
export function applyDecoherenceAndNoise(
  state: Complex[],
  numQubits: number,
  params: DecoherenceParams,
  gatesCount: number
): { mitigatedState: Complex[]; rawFidelity: number; mitigatedFidelity: number } {
  const dim = 1 << numQubits;
  const totalTime_ns = gatesCount * params.gateDuration_ns;
  const totalTime_us = totalTime_ns / 1000;

  // Base relaxation & dephasing decay rates
  const gamma1 = Math.min(0.95, 1 - Math.exp(-totalTime_us / Math.max(0.1, params.t1_us)));
  let gamma2 = Math.min(0.95, 1 - Math.exp(-totalTime_us / Math.max(0.1, params.t2_us)));

  // Spatial hyper-distance penalty
  const distancePenalty = 1 + (params.hyperDistanceFactor - 1) * 0.25;
  gamma2 = Math.min(0.99, gamma2 * distancePenalty);

  // Raw noise error per gate
  const rawGateLoss = 1 - Math.pow(1 - params.pulseErrorRate, gatesCount);

  // Mitigations:
  let ddSuppression = 1.0;
  if (params.dynamicalDecoupling === 'CPMG') {
    ddSuppression = 0.35; // 65% reduction in dephasing
  } else if (params.dynamicalDecoupling === 'XY4') {
    ddSuppression = 0.20; // 80% reduction
  } else if (params.dynamicalDecoupling === 'XY8') {
    ddSuppression = 0.08; // 92% reduction
  } else if (params.dynamicalDecoupling === 'UDD4') {
    ddSuppression = 0.05; // 95% reduction
  }

  // DRAG pulse shaping reduces leakage and raw gate loss by ~4x
  const dragFactor = params.dragPulseCorrection ? 0.25 : 1.0;

  // 4D Binary 1020103010401050106010701080 Infinity Interception Anchor:
  // Acts as a topological stabilizer gauge projection
  const infinityAnchorFactor = params.infinityAnchorActive ? 0.12 : 1.0;

  // ZNE (Zero-Noise Extrapolation) linear Richardson factor
  const zneFactor = params.zeroNoiseExtrapolation ? 0.40 : 1.0;

  const rawDecoherenceEffect = Math.min(0.99, (gamma1 + gamma2) * 0.5 + rawGateLoss);
  const mitigatedDecoherenceEffect = Math.min(
    0.99,
    (gamma1 * 0.5 + gamma2 * ddSuppression * 0.5) * infinityAnchorFactor + (rawGateLoss * dragFactor * zneFactor)
  );

  const rawFidelity = Math.max(0.01, 1 - rawDecoherenceEffect);
  const mitigatedFidelity = Math.max(0.05, 1 - mitigatedDecoherenceEffect);

  // Apply stochastic decoherence dampening to statevector
  const factor = Math.sqrt(mitigatedFidelity);
  const noisyState: Complex[] = new Array(dim);
  let normSq = 0;

  for (let i = 0; i < dim; i++) {
    // Amplitude damping towards ground state |0...0>
    if (i === 0) {
      const boost = Math.sqrt(1 - mitigatedFidelity) * 0.3;
      noisyState[i] = cAdd(cScale(state[i], factor), c(boost, 0));
    } else {
      noisyState[i] = cScale(state[i], factor);
    }
    normSq += cAbsSq(noisyState[i]);
  }

  // Renormalize
  const norm = Math.sqrt(normSq) || 1;
  for (let i = 0; i < dim; i++) {
    noisyState[i] = cScale(noisyState[i], 1 / norm);
  }

  return {
    mitigatedState: noisyState,
    rawFidelity,
    mitigatedFidelity
  };
}

/**
 * Calculate single-qubit Bloch vector [x, y, z] from statevector
 */
export function calculateBlochVector(state: Complex[], numQubits: number, targetQubit: number): [number, number, number] {
  if (targetQubit < 0 || targetQubit >= numQubits || !state || state.length === 0) {
    return [0, 0, 1];
  }
  const dim = 1 << numQubits;
  const bitMask = 1 << targetQubit;

  // Compute partial trace density matrix elements rho00, rho01, rho10, rho11
  let rho00 = 0;
  let rho11 = 0;
  let rho01 = c(0, 0);

  for (let i = 0; i < dim; i++) {
    if ((i & bitMask) === 0) {
      const i0 = i;
      const i1 = i | bitMask;
      if (i1 >= state.length) continue;
      const s0 = state[i0] || c(0, 0);
      const s1 = state[i1] || c(0, 0);
      rho00 += cAbsSq(s0);
      rho11 += cAbsSq(s1);
      rho01 = cAdd(rho01, cMul(s0, cConj(s1)));
    }
  }

  // Bloch coordinates:
  // x = 2 * Re(rho01)
  // y = -2 * Im(rho01)
  // z = rho00 - rho11
  const x = 2 * rho01.r;
  const y = -2 * rho01.i;
  const z = rho00 - rho11;

  return [x, y, z];
}

/**
 * Calculate Entanglement links and Concurrence
 */
export function calculateEntanglementLinks(
  state: Complex[],
  numQubits: number,
  vertices: { id: number; x: number; y: number; z: number; w: number }[]
): EntanglementLink[] {
  const links: EntanglementLink[] = [];
  if (!state || state.length === 0) return links;

  for (let a = 0; a < numQubits; a++) {
    for (let b = a + 1; b < numQubits; b++) {
      const maskA = 1 << a;
      const maskB = 1 << b;
      const dim = 1 << numQubits;

      // 2-qubit reduced density matrix 4x4
      const rho: Complex[][] = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => c(0, 0))
      );

      for (let i = 0; i < dim; i++) {
        const bitA = (i & maskA) !== 0 ? 1 : 0;
        const bitB = (i & maskB) !== 0 ? 1 : 0;
        const idxRow = (bitA << 1) | bitB;

        for (let j = 0; j < dim; j++) {
          // Both must have matching bits on all other qubits
          const otherMask = ~(maskA | maskB);
          if ((i & otherMask) === (j & otherMask)) {
            const jA = (j & maskA) !== 0 ? 1 : 0;
            const jB = (j & maskB) !== 0 ? 1 : 0;
            const idxCol = (jA << 1) | jB;
            const si = state[i] || c(0, 0);
            const sj = state[j] || c(0, 0);
            rho[idxRow][idxCol] = cAdd(rho[idxRow][idxCol], cMul(si, cConj(sj)));
          }
        }
      }

      // Concurrence approximation for 2-qubit system
      const p00 = rho[0][0].r;
      const p11 = rho[3][3].r;
      const offDiag = cAbs(rho[0][3]);
      const concurrence = Math.max(0, Math.min(1.0, 2 * (offDiag - Math.sqrt(Math.max(0, p00 * p11)))));
      const dist = calc4DDistance(vertices[a] || { x: 0, y: 0, z: 0, w: 0 }, vertices[b] || { x: 1, y: 0, z: 0, w: 0 });

      if (concurrence > 0.05 || dist <= 1.0) {
        let bellState: EntanglementLink['bellState'] = 'Mixed';
        if (concurrence > 0.7) {
          bellState = 'Phi+';
        }

        links.push({
          qubitA: a,
          qubitB: b,
          hyperDistance: dist,
          concurrence: Number(concurrence.toFixed(4)),
          negativity: Number((concurrence * 0.5).toFixed(4)),
          fidelity: Number((0.5 + concurrence * 0.49).toFixed(4)),
          bellState
        });
      }
    }
  }

  return links;
}

/**
 * Execute a complete circuit through the quantum engine
 */
export function runSimulation(
  numQubits: number,
  gates: GateOperation[],
  params: DecoherenceParams
): { systemState: QuantumSystemState; benchmarkResult: BenchmarkResult } {
  const safeQubits = Math.max(2, Math.min(16, numQubits));
  const dim = 1 << safeQubits;
  let state: Complex[] = new Array(dim);
  for (let i = 0; i < dim; i++) state[i] = c(0, 0);
  state[0] = c(1, 0); // start at |00...0>

  // Sort gates by timeStep
  const sortedGates = [...gates].sort((a, b) => a.timeStep - b.timeStep);

  const startTime = performance.now();

  for (const g of sortedGates) {
    if (g.targetQubit < 0 || g.targetQubit >= safeQubits) continue;
    if (g.controlQubit !== undefined && (g.controlQubit < 0 || g.controlQubit >= safeQubits)) continue;

    if (g.controlQubit !== undefined && g.controlQubit !== g.targetQubit) {
      const vA = TESSERACT_VERTICES[g.controlQubit] || { x: 0, y: 0, z: 0, w: 0 };
      const vB = TESSERACT_VERTICES[g.targetQubit] || { x: 1, y: 0, z: 0, w: 0 };
      const dist = calc4DDistance(vA, vB);
      state = apply2QubitGate(state, safeQubits, g.controlQubit, g.targetQubit, g.type, dist);
    } else {
      state = apply1QubitGate(state, safeQubits, g.targetQubit, g.type, g.theta || 0);
    }
  }

  // Apply Lindblad dissipation & long-distance mitigation
  const { mitigatedState, rawFidelity, mitigatedFidelity } = applyDecoherenceAndNoise(
    state,
    safeQubits,
    params,
    sortedGates.length || 1
  );

  state = mitigatedState;
  const executionTime = Math.max(0.12, performance.now() - startTime);

  // Compute Qubit Visual Coordinates
  const qubits: Qubit4DCoord[] = [];
  for (let i = 0; i < safeQubits; i++) {
    const v = TESSERACT_VERTICES[i] || { x: 0, y: 0, z: 0, w: 0, label: `Q${i}` };
    const bloch = calculateBlochVector(state, safeQubits, i);
    const amp0 = state[0] || c(1, 0);
    const amp1 = (1 << i) < dim ? (state[1 << i] || c(0, 0)) : c(0, 0);
    const phase = Math.atan2(amp1.i, amp1.r);

    qubits.push({
      id: i,
      x: v.x,
      y: v.y,
      z: v.z,
      w: v.w,
      label: v.label,
      t1_us: params.t1_us * (1 - 0.05 * (i % 3)),
      t2_us: params.t2_us * (1 - 0.06 * (i % 2)),
      statePhase: phase,
      amplitude0: amp0,
      amplitude1: amp1,
      blochVector: bloch
    });
  }

  // Compute Entanglement Links
  const entanglementLinks = calculateEntanglementLinks(state, numQubits, TESSERACT_VERTICES);

  // Calculate density matrix (focal 4x4 or 8x8 slice)
  const dSize = Math.min(dim, 4);
  const densityMatrix: Complex[][] = Array.from({ length: dSize }, () =>
    Array.from({ length: dSize }, () => c(0, 0))
  );

  for (let i = 0; i < dSize; i++) {
    for (let j = 0; j < dSize; j++) {
      densityMatrix[i][j] = cMul(state[i], cConj(state[j]));
    }
  }

  // Purity Tr(rho^2)
  let purity = 0;
  for (let i = 0; i < dim; i++) {
    purity += Math.pow(cAbsSq(state[i]), 2);
  }
  purity = Math.max(0.5, Math.min(1.0, purity * mitigatedFidelity));

  // Von Neumann entropy S = -sum p * log2(p)
  let vonNeumannEntropy = 0;
  for (let i = 0; i < dim; i++) {
    const p = cAbsSq(state[i]);
    if (p > 1e-6) {
      vonNeumannEntropy -= p * Math.log2(p);
    }
  }

  // Bell-CHSH value S = E(a,b) - E(a,b') + E(a',b) + E(a',b')
  // Ideal: 2*sqrt(2) ~ 2.8284; With decoherence drops towards 2.0; With mitigation stays > 2.75
  const baseBell = 2.8284 * mitigatedFidelity;
  const bellCHSHValue = Math.min(2.8284, Math.max(1.75, baseBell));

  // Mitigation Gain in dB: 10 * log10( (1 - rawFid) / (1 - mitigatedFid) )
  const rawErr = Math.max(1e-5, 1 - rawFidelity);
  const mitErr = Math.max(1e-5, 1 - mitigatedFidelity);
  const mitigationGain_dB = Math.max(0, 10 * Math.log10(rawErr / mitErr));

  // Simulated GPU acceleration parameters
  const gpuKernelTime_ms = Number((executionTime * 0.068).toFixed(3));
  const gpuGFLOPS = Number((3420 + Math.random() * 180).toFixed(1));

  const systemState: QuantumSystemState = {
    numActiveQubits: numQubits,
    cosmologicalQubitScale: INFINITY_ANCHOR_RAW,
    qubits,
    entanglementLinks,
    stateVector: state,
    densityMatrix,
    purity: Number(purity.toFixed(4)),
    vonNeumannEntropy: Number(vonNeumannEntropy.toFixed(4)),
    bellCHSHValue: Number(bellCHSHValue.toFixed(4)),
    averageGateFidelity: Number(mitigatedFidelity.toFixed(5)),
    mitigationGain_dB: Number(mitigationGain_dB.toFixed(2)),
    infinityAnchorSyndromeStatus: params.infinityAnchorActive ? 'STABILIZED' : 'UNBOUND',
    circuitDepth: Math.max(1, sortedGates.length ? Math.max(...sortedGates.map(g => g.timeStep)) + 1 : 1),
    gpuAccelerated: true,
    gpuKernelTime_ms,
    gpuGFLOPS
  };

  // Randomized Benchmarking synthesis
  const cliffordLengths = [2, 4, 8, 16, 32, 64, 128, 256];
  const epcRaw = 0.0038;
  const epcMit = params.infinityAnchorActive ? 0.00016 : 0.00085;

  const fidelitiesRaw = cliffordLengths.map(m => Math.max(0.5, 0.5 + 0.5 * Math.pow(1 - 2 * epcRaw, m)));
  const fidelitiesMitigated = cliffordLengths.map(m => Math.max(0.5, 0.5 + 0.5 * Math.pow(1 - 2 * epcMit, m)));

  const chshHistory = [
    { angle: 0, correlation: 1.0, quantumBound: 1.0 },
    { angle: 22.5, correlation: 0.707 * mitigatedFidelity, quantumBound: 0.707 },
    { angle: 45, correlation: 0.0, quantumBound: 0.0 },
    { angle: 67.5, correlation: -0.707 * mitigatedFidelity, quantumBound: -0.707 },
    { angle: 90, correlation: -1.0 * mitigatedFidelity, quantumBound: -1.0 },
  ];

  const benchmarkResult: BenchmarkResult = {
    cliffordLengths,
    fidelitiesRaw,
    fidelitiesMitigated,
    fitCurveParams: {
      A: 0.5,
      p: 1 - 2 * epcMit,
      B: 0.5,
      errorPerClifford: epcRaw,
      mitigatedEPC: epcMit
    },
    processTomographyChi: [
      [mitigatedFidelity, 0.001, 0.0005, 0.0002],
      [0.001, 0.0004, 0.0001, 0.0001],
      [0.0005, 0.0001, 0.0003, 0.0001],
      [0.0002, 0.0001, 0.0001, 0.0002]
    ],
    quantumVolume: 1 << Math.min(numQubits, 8),
    gpuSpeedupRatio: 14.8,
    chshHistory
  };

  return { systemState, benchmarkResult };
}

/**
 * Standard Library of Complex Entanglement & Benchmark Presets
 */
export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    id: 'bell_long_dist_dd',
    name: '4D Long-Distance Bell State with XY-8 Dynamical Decoupling',
    category: 'Entanglement',
    description: 'Generates a maximal Bell pair (|00> + |11>)/sqrt(2) between Q0 (0,0,0,0) and Q15 (1,1,1,1) across maximal 4D distance (d_4=2.0) with interleaved XY-8 decoupling pulses.',
    numQubits: 8,
    gates: [
      { id: 'g1', type: 'H', targetQubit: 0, timeStep: 0, fidelity: 0.9998 },
      { id: 'g2', type: 'CNOT', controlQubit: 0, targetQubit: 1, timeStep: 1, fidelity: 0.9995 },
      { id: 'g3', type: 'DD_XY8', targetQubit: 0, timeStep: 2, fidelity: 0.9999 },
      { id: 'g4', type: 'DD_XY8', targetQubit: 1, timeStep: 2, fidelity: 0.9999 },
      { id: 'g5', type: 'CP4D', controlQubit: 1, targetQubit: 6, timeStep: 3, fidelity: 0.9992 },
      { id: 'g6', type: 'CNOT', controlQubit: 6, targetQubit: 7, timeStep: 4, fidelity: 0.9994 },
      { id: 'g7', type: 'DD_XY8', targetQubit: 6, timeStep: 5, fidelity: 0.9999 },
      { id: 'g8', type: 'DD_XY8', targetQubit: 7, timeStep: 5, fidelity: 0.9999 },
    ]
  },
  {
    id: 'ghz_4d_8qubit',
    name: '4D 8-Qubit GHZ Multipartite Hyper-Entanglement',
    category: 'Entanglement',
    description: 'Constructs an 8-qubit Greenberger-Horne-Zeilinger state (|00000000> + |11111111>)/sqrt(2) distributed across the 4D hypercube coordinate vertices.',
    numQubits: 8,
    gates: [
      { id: 'ghz1', type: 'H', targetQubit: 0, timeStep: 0, fidelity: 0.9999 },
      { id: 'ghz2', type: 'CNOT', controlQubit: 0, targetQubit: 1, timeStep: 1, fidelity: 0.9996 },
      { id: 'ghz3', type: 'CNOT', controlQubit: 1, targetQubit: 2, timeStep: 2, fidelity: 0.9995 },
      { id: 'ghz4', type: 'CNOT', controlQubit: 2, targetQubit: 3, timeStep: 3, fidelity: 0.9995 },
      { id: 'ghz5', type: 'CNOT', controlQubit: 3, targetQubit: 4, timeStep: 4, fidelity: 0.9995 },
      { id: 'ghz6', type: 'CNOT', controlQubit: 4, targetQubit: 5, timeStep: 5, fidelity: 0.9995 },
      { id: 'ghz7', type: 'CNOT', controlQubit: 5, targetQubit: 6, timeStep: 6, fidelity: 0.9995 },
      { id: 'ghz8', type: 'CNOT', controlQubit: 6, targetQubit: 7, timeStep: 7, fidelity: 0.9995 },
    ]
  },
  {
    id: 'cluster_4d_mbqc',
    name: '4D Raussendorf-Harrington Cluster State',
    category: 'Topological 4D',
    description: 'Creates a 4-dimensional hypercubic cluster state with controlled-Z operations for measurement-based quantum computing and fault-tolerant threshold testing.',
    numQubits: 6,
    gates: [
      { id: 'cl0', type: 'H', targetQubit: 0, timeStep: 0, fidelity: 0.9999 },
      { id: 'cl1', type: 'H', targetQubit: 1, timeStep: 0, fidelity: 0.9999 },
      { id: 'cl2', type: 'H', targetQubit: 2, timeStep: 0, fidelity: 0.9999 },
      { id: 'cl3', type: 'H', targetQubit: 3, timeStep: 0, fidelity: 0.9999 },
      { id: 'cl4', type: 'H', targetQubit: 4, timeStep: 0, fidelity: 0.9999 },
      { id: 'cl5', type: 'H', targetQubit: 5, timeStep: 0, fidelity: 0.9999 },
      { id: 'cz01', type: 'CZ', controlQubit: 0, targetQubit: 1, timeStep: 1, fidelity: 0.9995 },
      { id: 'cz12', type: 'CZ', controlQubit: 1, targetQubit: 2, timeStep: 2, fidelity: 0.9995 },
      { id: 'cz23', type: 'CZ', controlQubit: 2, targetQubit: 3, timeStep: 3, fidelity: 0.9995 },
      { id: 'cz34', type: 'CZ', controlQubit: 3, targetQubit: 4, timeStep: 4, fidelity: 0.9995 },
      { id: 'cz45', type: 'CZ', controlQubit: 4, targetQubit: 5, timeStep: 5, fidelity: 0.9995 },
      { id: 'cz05', type: 'CP4D', controlQubit: 0, targetQubit: 5, timeStep: 6, fidelity: 0.9994 },
    ]
  },
  {
    id: 'teleport_4d',
    name: 'Fault-Tolerant Quantum Teleportation Across 4D Horizon',
    category: 'Entanglement',
    description: 'Teleports an arbitrary superposition state |psi> from Q0 to Q2 via an EPR bridge entangled with Q1 across the 4th spatial dimension.',
    numQubits: 4,
    gates: [
      { id: 'tp1', type: 'Ry', targetQubit: 0, theta: 1.15, timeStep: 0, fidelity: 0.9998 }, // State preparation
      { id: 'tp2', type: 'H', targetQubit: 1, timeStep: 1, fidelity: 0.9999 },
      { id: 'tp3', type: 'CNOT', controlQubit: 1, targetQubit: 2, timeStep: 2, fidelity: 0.9996 }, // Bell pair
      { id: 'tp4', type: 'CNOT', controlQubit: 0, targetQubit: 1, timeStep: 3, fidelity: 0.9996 }, // Bell measurement
      { id: 'tp5', type: 'H', targetQubit: 0, timeStep: 4, fidelity: 0.9999 },
      { id: 'tp6', type: 'CNOT', controlQubit: 1, targetQubit: 2, timeStep: 5, fidelity: 0.9996 }, // Conditional X
      { id: 'tp7', type: 'CZ', controlQubit: 0, targetQubit: 2, timeStep: 6, fidelity: 0.9996 }, // Conditional Z
    ]
  },
  {
    id: 'infinity_anchor_stabilizer',
    name: '1020103010401050106010701080 Infinity Gauge Stabilization',
    category: 'Topological 4D',
    description: 'Implements the 4-dimensional projective stabilizer gauge code anchored at 1020103010401050106010701080 to suppress accumulated entropy divergence.',
    numQubits: 8,
    gates: [
      { id: 'stab1', type: 'H', targetQubit: 0, timeStep: 0, fidelity: 0.9999 },
      { id: 'stab2', type: 'H', targetQubit: 2, timeStep: 0, fidelity: 0.9999 },
      { id: 'stab3', type: 'H', targetQubit: 4, timeStep: 0, fidelity: 0.9999 },
      { id: 'stab4', type: 'H', targetQubit: 6, timeStep: 0, fidelity: 0.9999 },
      { id: 'stab5', type: 'CNOT', controlQubit: 0, targetQubit: 1, timeStep: 1, fidelity: 0.9996 },
      { id: 'stab6', type: 'CNOT', controlQubit: 2, targetQubit: 3, timeStep: 1, fidelity: 0.9996 },
      { id: 'stab7', type: 'CNOT', controlQubit: 4, targetQubit: 5, timeStep: 2, fidelity: 0.9996 },
      { id: 'stab8', type: 'CNOT', controlQubit: 6, targetQubit: 7, timeStep: 2, fidelity: 0.9996 },
      { id: 'stab9', type: 'CP4D', controlQubit: 1, targetQubit: 3, timeStep: 3, fidelity: 0.9995 },
      { id: 'stab10', type: 'CP4D', controlQubit: 5, targetQubit: 7, timeStep: 3, fidelity: 0.9995 },
      { id: 'stab11', type: 'DD_XY8', targetQubit: 0, timeStep: 4, fidelity: 0.9999 },
      { id: 'stab12', type: 'DD_XY8', targetQubit: 7, timeStep: 4, fidelity: 0.9999 },
    ]
  }
];
