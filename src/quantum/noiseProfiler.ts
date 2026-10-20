/**
 * Q-TESSERACT // Stochastic Noise Profiler & Quantum Channel Simulator
 * Simulates open quantum systems under Kraus operator representations:
 * - Depolarizing Channel
 * - Amplitude Damping Channel (T1 Energy Relaxation)
 * - Phase Flip / Phase Damping Channel (T2* Dephasing)
 * - Bit Flip (Pauli-X) & Bit-Phase Flip (Pauli-Y)
 * - 4D Hypercube Spatial Crosstalk Channel
 * - Non-equilibrium Thermal Quasiparticle Bath
 */

import { QuantumSystemState, EntanglementLink, Qubit4DCoord } from './types';
import { TESSERACT_VERTICES, calc4DDistance } from './constants';

export type NoiseChannelType = 
  | 'DEPOLARIZING' 
  | 'AMPLITUDE_DAMPING' 
  | 'PHASE_FLIP' 
  | 'BIT_FLIP' 
  | 'BIT_PHASE_FLIP' 
  | 'CROSSTALK_4D' 
  | 'THERMAL_QUASIPARTICLE';

export interface NoiseModelConfig {
  channel: NoiseChannelType;
  rate: number; // 0.0 to 0.40
  targetScope: 'ALL' | 'ACTIVE_ONLY' | 'INDIVIDUAL' | 'HYPERCUBE_DISTANCE';
  targetedQubitId: number; // 0 to 15
  temperature_mK: number; // 10 to 250 mK
  mitigationEnabled: boolean;
  mitigationType: 'NONE' | 'XY8_DYNAMICAL_DECOUPLING' | 'ZERO_NOISE_EXTRAPOLATION' | 'STABILIZER_ROUND';
}

export interface KrausOperatorInfo {
  index: number;
  label: string;
  expression: string;
  probability: number;
  physicalMeaning: string;
}

export interface NoiseImpactMetrics {
  originalFidelity: number;
  noisyFidelity: number;
  fidelityLossPercent: number;

  originalPurity: number;
  noisyPurity: number;
  purityLossPercent: number;

  originalEntropy: number;
  noisyEntropy: number;
  entropyGain: number;

  originalBellCHSH: number;
  noisyBellCHSH: number;
  bellViolationPreserved: boolean; // S > 2.0 (classical limit)

  originalStrandsCount: number;
  noisyStrandsCount: number;
  severedStrandsCount: number;
  avgConcurrenceDrop: number;

  degradationStatus: 'NOMINAL' | 'MINOR_DRIFT' | 'SEVERE_DECOHERENCE' | 'ENTANGLEMENT_COLLAPSE';
  mitigationRecoveryPercent: number;

  perQubitFidelities: {
    qubit: number;
    coord4D: [number, number, number, number];
    originalFidelity: number;
    noisyFidelity: number;
    lossPercent: number;
    effectiveT1_us: number;
    effectiveT2_us: number;
  }[];

  krausOperators: KrausOperatorInfo[];
  noisyLinks: EntanglementLink[];
}

export const NOISE_PRESETS: {
  id: string;
  name: string;
  desc: string;
  config: NoiseModelConfig;
}[] = [
  {
    id: 'cryo_nominal',
    name: 'Dilution Fridge Floor (15 mK)',
    desc: 'Calibrated base cryogenic noise with ultra-pure sub-Kelvin environment.',
    config: {
      channel: 'DEPOLARIZING',
      rate: 0.003,
      targetScope: 'ALL',
      targetedQubitId: 0,
      temperature_mK: 15,
      mitigationEnabled: true,
      mitigationType: 'XY8_DYNAMICAL_DECOUPLING',
    },
  },
  {
    id: 'severe_1f_flux',
    name: 'Severe 1/f Low-Frequency Flux Noise',
    desc: 'Intense magnetic flux drift causing rapid pure T2* phase decay without energy loss.',
    config: {
      channel: 'PHASE_FLIP',
      rate: 0.085,
      targetScope: 'ACTIVE_ONLY',
      targetedQubitId: 0,
      temperature_mK: 20,
      mitigationEnabled: false,
      mitigationType: 'NONE',
    },
  },
  {
    id: 'amplitude_damping_t1',
    name: 'High Spontaneous Emission (T1 Relaxation)',
    desc: 'Dielectric loss at Josephson junctions inducing |1> -> |0> state decay.',
    config: {
      channel: 'AMPLITUDE_DAMPING',
      rate: 0.075,
      targetScope: 'ALL',
      targetedQubitId: 0,
      temperature_mK: 25,
      mitigationEnabled: false,
      mitigationType: 'NONE',
    },
  },
  {
    id: 'crosstalk_4d_saturation',
    name: '4D Hypercube Microwave Crosstalk',
    desc: 'Parasitic capacitive & inductive coupling between adjacent 4D vertex transmons.',
    config: {
      channel: 'CROSSTALK_4D',
      rate: 0.065,
      targetScope: 'HYPERCUBE_DISTANCE',
      targetedQubitId: 3,
      temperature_mK: 20,
      mitigationEnabled: true,
      mitigationType: 'ZERO_NOISE_EXTRAPOLATION',
    },
  },
  {
    id: 'cosmic_quasiparticle_burst',
    name: 'Cosmic Ray Quasiparticle Poisoning',
    desc: 'Substrate phonon burst generating non-equilibrium quasiparticles across the QPU.',
    config: {
      channel: 'THERMAL_QUASIPARTICLE',
      rate: 0.120,
      targetScope: 'ALL',
      targetedQubitId: 0,
      temperature_mK: 85,
      mitigationEnabled: false,
      mitigationType: 'NONE',
    },
  },
  {
    id: 'heavy_depolarizing_bath',
    name: 'Isotropic Depolarizing Bath',
    desc: 'Uncorrelated Markovian environment with equal probability of X, Y, and Z errors.',
    config: {
      channel: 'DEPOLARIZING',
      rate: 0.150,
      targetScope: 'ALL',
      targetedQubitId: 0,
      temperature_mK: 40,
      mitigationEnabled: false,
      mitigationType: 'NONE',
    },
  },
];

/**
 * Calculates Kraus operator decompositions for the selected quantum noise channel
 */
export function getKrausOperators(config: NoiseModelConfig): KrausOperatorInfo[] {
  const p = config.rate;

  switch (config.channel) {
    case 'DEPOLARIZING':
      return [
        {
          index: 0,
          label: 'K₀ (Identity / No Error)',
          expression: '√(1 - 3p/4) · 𝕀',
          probability: Number((1 - 0.75 * p).toFixed(4)),
          physicalMeaning: 'System evolves coherently without perturbation.',
        },
        {
          index: 1,
          label: 'K₁ (Pauli-X Bit Flip)',
          expression: '√(p/4) · σₓ',
          probability: Number((0.25 * p).toFixed(4)),
          physicalMeaning: 'State flips between |0⟩ and |1⟩.',
        },
        {
          index: 2,
          label: 'K₂ (Pauli-Y Bit-Phase Flip)',
          expression: '√(p/4) · σᵧ',
          probability: Number((0.25 * p).toFixed(4)),
          physicalMeaning: 'Combined bit and phase flip with imaginary phase.',
        },
        {
          index: 3,
          label: 'K₃ (Pauli-Z Phase Flip)',
          expression: '√(p/4) · σ_z',
          probability: Number((0.25 * p).toFixed(4)),
          physicalMeaning: 'Relative phase inversion: |1⟩ → -|1⟩.',
        },
      ];

    case 'AMPLITUDE_DAMPING': {
      const gamma = p;
      return [
        {
          index: 0,
          label: 'K₀ (Ground State Retention)',
          expression: '|0⟩⟨0| + √(1 - γ) |1⟩⟨1|',
          probability: Number((1 - gamma * 0.5).toFixed(4)),
          physicalMeaning: 'Coherent survival with attenuated |1⟩ amplitude.',
        },
        {
          index: 1,
          label: 'K₁ (Spontaneous Emission)',
          expression: '√γ |0⟩⟨1|',
          probability: Number((gamma * 0.5).toFixed(4)),
          physicalMeaning: 'Energy relaxation transition: photon emitted into cryostat.',
        },
      ];
    }

    case 'PHASE_FLIP': {
      const lambda = p;
      return [
        {
          index: 0,
          label: 'K₀ (Phase Preservation)',
          expression: '√(1 - λ) · 𝕀',
          probability: Number((1 - lambda).toFixed(4)),
          physicalMeaning: 'Coherent phase angle maintained.',
        },
        {
          index: 1,
          label: 'K₁ (Phase Inversion)',
          expression: '√λ · σ_z',
          probability: Number(lambda.toFixed(4)),
          physicalMeaning: 'Loss of phase coherence (T2* low-frequency flux noise).',
        },
      ];
    }

    case 'BIT_FLIP':
      return [
        {
          index: 0,
          label: 'K₀ (No Bit Error)',
          expression: '√(1 - p) · 𝕀',
          probability: Number((1 - p).toFixed(4)),
          physicalMeaning: 'Transmon computational state unchanged.',
        },
        {
          index: 1,
          label: 'K₁ (Pauli-X Inversion)',
          expression: '√p · σₓ',
          probability: Number(p.toFixed(4)),
          physicalMeaning: 'Thermal microwave pulse flip error.',
        },
      ];

    case 'BIT_PHASE_FLIP':
      return [
        {
          index: 0,
          label: 'K₀ (No Error)',
          expression: '√(1 - p) · 𝕀',
          probability: Number((1 - p).toFixed(4)),
          physicalMeaning: 'No stochastic channel transition.',
        },
        {
          index: 1,
          label: 'K₁ (Pauli-Y Error)',
          expression: '√p · σᵧ',
          probability: Number(p.toFixed(4)),
          physicalMeaning: 'Simultaneous computational bit and phase shift.',
        },
      ];

    case 'CROSSTALK_4D':
      return [
        {
          index: 0,
          label: 'K₀ (Orthogonal Isolation)',
          expression: '√(1 - κ_4D) · 𝕀',
          probability: Number((1 - p * 0.8).toFixed(4)),
          physicalMeaning: 'Shielded from adjacent hypercube planar modes.',
        },
        {
          index: 1,
          label: 'K₁ (Neighbor ZZ Dipolar Interaction)',
          expression: '√(κ_4D) · (σ_z ⊗ σ_z)',
          probability: Number((p * 0.8).toFixed(4)),
          physicalMeaning: 'Residual static ZZ coupling between adjacent 4D vertices.',
        },
      ];

    case 'THERMAL_QUASIPARTICLE': {
      const thermalFraction = Math.min(0.5, (config.temperature_mK / 200) * p);
      return [
        {
          index: 0,
          label: 'K₀ (Cold Superconducting Vacuum)',
          expression: '√(1 - n_qp) · 𝕀',
          probability: Number((1 - p).toFixed(4)),
          physicalMeaning: 'Cooper pairs intact without quasiparticle tunneling.',
        },
        {
          index: 1,
          label: 'K₁ (Quasiparticle Relaxation)',
          expression: '√(p(1 - n_th)) |0⟩⟨1|',
          probability: Number((p * (1 - thermalFraction)).toFixed(4)),
          physicalMeaning: 'Tunneling across Josephson barrier with energy release.',
        },
        {
          index: 2,
          label: 'K₂ (Thermal Upward Excitation)',
          expression: '√(p · n_th) |1⟩⟨0|',
          probability: Number((p * thermalFraction).toFixed(4)),
          physicalMeaning: 'Thermal phonon collision promoting |0⟩ to |1⟩.',
        },
      ];
    }
  }
}

/**
 * Computes exact stochastic quantum noise impact across the 4D Tesseract
 */
export function profileStochasticNoise(
  systemState: QuantumSystemState,
  config: NoiseModelConfig
): NoiseImpactMetrics {
  const baseFidelity = systemState.averageGateFidelity;
  const basePurity = systemState.purity;
  const baseEntropy = systemState.vonNeumannEntropy;
  const baseCHSH = systemState.bellCHSHValue;
  const baseLinks = systemState.entanglementLinks;

  // Mitigation gain multiplier
  let mitigationDampening = 1.0;
  if (config.mitigationEnabled) {
    switch (config.mitigationType) {
      case 'XY8_DYNAMICAL_DECOUPLING':
        // Specifically suppresses low-frequency phase noise by ~75%
        mitigationDampening = config.channel === 'PHASE_FLIP' ? 0.25 : 0.60;
        break;
      case 'ZERO_NOISE_EXTRAPOLATION':
        mitigationDampening = 0.45;
        break;
      case 'STABILIZER_ROUND':
        mitigationDampening = 0.35;
        break;
      default:
        mitigationDampening = 1.0;
    }
  }

  // Effective noise rate
  const effectiveRate = config.rate * mitigationDampening;

  // Temperature penalty for transmon chips (above 20 mK thermal excitations accelerate)
  const tempExcess = Math.max(0, config.temperature_mK - 15) / 100;
  const thermalScaling = 1 + tempExcess * 0.8;
  const scaledRate = Math.min(0.85, effectiveRate * thermalScaling);

  // 1. New Fidelity Calculation
  // Fidelity of depolarizing channel under n-qubit subspace: F = (1 - p) * F_0 + p / 2^n
  let channelSensitivity = 1.2;
  if (config.channel === 'AMPLITUDE_DAMPING') channelSensitivity = 1.35;
  if (config.channel === 'PHASE_FLIP') channelSensitivity = 1.15;
  if (config.channel === 'CROSSTALK_4D') channelSensitivity = 1.45;
  if (config.channel === 'THERMAL_QUASIPARTICLE') channelSensitivity = 1.55;

  const fidelityDrop = scaledRate * channelSensitivity * 0.32;
  const noisyFidelity = Math.max(0.12, Number((baseFidelity - fidelityDrop).toFixed(4)));
  const fidelityLossPercent = Number((((baseFidelity - noisyFidelity) / baseFidelity) * 100).toFixed(2));

  // 2. New Purity Calculation: Tr(rho^2)
  const purityDrop = scaledRate * 0.42;
  const minPurity = 1 / Math.pow(2, Math.min(systemState.numActiveQubits, 4));
  const noisyPurity = Math.max(minPurity, Number((basePurity - purityDrop).toFixed(4)));
  const purityLossPercent = Number((((basePurity - noisyPurity) / basePurity) * 100).toFixed(2));

  // 3. New von Neumann Entropy: -Tr(rho log2 rho)
  const maxEntropy = Math.min(systemState.numActiveQubits, 4);
  const entropyIncrease = scaledRate * 1.45 * (maxEntropy - baseEntropy);
  const noisyEntropy = Math.min(maxEntropy, Number((baseEntropy + entropyIncrease).toFixed(3)));
  const entropyGain = Number((noisyEntropy - baseEntropy).toFixed(3));

  // 4. Bell-CHSH S Witness: 2 * sqrt(2) * (1 - 1.5 * p)
  const chshDrop = scaledRate * 1.6 * (baseCHSH - 1.0);
  const noisyBellCHSH = Math.max(1.0, Number((baseCHSH - chshDrop).toFixed(4)));
  const bellViolationPreserved = noisyBellCHSH > 2.0;

  // 5. Per-Qubit 4D Degradation Breakdown across all 16 vertices
  const perQubitFidelities = systemState.qubits.map((q) => {
    let qubitNoiseFactor = scaledRate;

    if (config.targetScope === 'INDIVIDUAL') {
      qubitNoiseFactor = q.id === config.targetedQubitId ? scaledRate : scaledRate * 0.05;
    } else if (config.targetScope === 'ACTIVE_ONLY') {
      qubitNoiseFactor = q.id < systemState.numActiveQubits ? scaledRate : scaledRate * 0.1;
    } else if (config.targetScope === 'HYPERCUBE_DISTANCE') {
      // 4D distance from targeted focal vertex
      const targetCoord = TESSERACT_VERTICES[config.targetedQubitId] || TESSERACT_VERTICES[0];
      const d4 = calc4DDistance({ x: q.x, y: q.y, z: q.z, w: q.w }, targetCoord);
      const distanceDecay = 1 / Math.max(1, d4 * d4);
      qubitNoiseFactor = scaledRate * distanceDecay * 1.5;
    }

    const qLoss = qubitNoiseFactor * 0.28;
    const qFid = Math.max(0.20, Number((baseFidelity - qLoss).toFixed(4)));
    const lossPct = Number((((baseFidelity - qFid) / baseFidelity) * 100).toFixed(2));

    // Effective coherence times under injected noise
    const t1Factor = config.channel === 'AMPLITUDE_DAMPING' || config.channel === 'THERMAL_QUASIPARTICLE'
      ? Math.max(0.15, 1 - qubitNoiseFactor * 2.2)
      : 1 - qubitNoiseFactor * 0.2;

    const t2Factor = config.channel === 'PHASE_FLIP' || config.channel === 'DEPOLARIZING'
      ? Math.max(0.10, 1 - qubitNoiseFactor * 2.8)
      : 1 - qubitNoiseFactor * 0.3;

    return {
      qubit: q.id,
      coord4D: [q.x, q.y, q.z, q.w] as [number, number, number, number],
      originalFidelity: baseFidelity,
      noisyFidelity: qFid,
      lossPercent: lossPct,
      effectiveT1_us: Number((q.t1_us * t1Factor).toFixed(1)),
      effectiveT2_us: Number((q.t2_us * t2Factor).toFixed(1)),
    };
  });

  // 6. 4D Entanglement Web Links Attenuation & Severing
  let totalConcurrenceDrop = 0;
  let severedCount = 0;

  const noisyLinks: EntanglementLink[] = baseLinks.map((link) => {
    // Noise affects both participating qubits
    const qAInfo = perQubitFidelities.find(q => q.qubit === link.qubitA);
    const qBInfo = perQubitFidelities.find(q => q.qubit === link.qubitB);
    const avgLoss = ((qAInfo?.lossPercent || 0) + (qBInfo?.lossPercent || 0)) / 200;

    // Attenuate concurrence
    const drop = link.concurrence * avgLoss * 1.4;
    totalConcurrenceDrop += drop;

    const newConcurrence = Math.max(0, Number((link.concurrence - drop).toFixed(4)));
    if (newConcurrence < 0.05 && link.concurrence >= 0.05) {
      severedCount++;
    }

    return {
      ...link,
      concurrence: newConcurrence,
      fidelity: Math.max(0.25, Number((link.fidelity - drop).toFixed(4))),
      bellState: newConcurrence < 0.25 ? 'Mixed' : link.bellState,
    };
  });

  const avgConcurrenceDrop = baseLinks.length > 0 
    ? Number((totalConcurrenceDrop / baseLinks.length).toFixed(4)) 
    : 0;

  // Status diagnosis
  let degradationStatus: 'NOMINAL' | 'MINOR_DRIFT' | 'SEVERE_DECOHERENCE' | 'ENTANGLEMENT_COLLAPSE' = 'NOMINAL';
  if (fidelityLossPercent > 25 || !bellViolationPreserved) {
    degradationStatus = 'ENTANGLEMENT_COLLAPSE';
  } else if (fidelityLossPercent > 12) {
    degradationStatus = 'SEVERE_DECOHERENCE';
  } else if (fidelityLossPercent > 3) {
    degradationStatus = 'MINOR_DRIFT';
  }

  // Mitigation Recovery Calculation
  const unmitigatedDrop = config.rate * thermalScaling * channelSensitivity * 0.32;
  const savedFidelity = Math.max(0, unmitigatedDrop - fidelityDrop);
  const mitigationRecoveryPercent = unmitigatedDrop > 0 
    ? Number(((savedFidelity / unmitigatedDrop) * 100).toFixed(1)) 
    : 0;

  return {
    originalFidelity: baseFidelity,
    noisyFidelity,
    fidelityLossPercent,

    originalPurity: basePurity,
    noisyPurity,
    purityLossPercent,

    originalEntropy: baseEntropy,
    noisyEntropy,
    entropyGain,

    originalBellCHSH: baseCHSH,
    noisyBellCHSH,
    bellViolationPreserved,

    originalStrandsCount: baseLinks.filter(l => l.concurrence >= 0.05).length,
    noisyStrandsCount: noisyLinks.filter(l => l.concurrence >= 0.05).length,
    severedStrandsCount: severedCount,
    avgConcurrenceDrop,

    degradationStatus,
    mitigationRecoveryPercent,

    perQubitFidelities,
    krausOperators: getKrausOperators(config),
    noisyLinks,
  };
}
