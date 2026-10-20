import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { QuantumSystemState, Qubit4DCoord, GateOperation, DecoherenceParams } from '../quantum/types';
import { TESSERACT_EDGES, TESSERACT_VERTICES, INFINITY_ANCHOR_RAW } from '../quantum/constants';
import { 
  Rotate3d, 
  Play, 
  Pause, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Shuffle, 
  Flame, 
  Activity, 
  Waves, 
  ShieldCheck, 
  ThermometerSnowflake,
  Sliders,
  Compass,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Sparkles,
  MousePointer,
  HelpCircle,
  Eye
} from 'lucide-react';

interface HypercubeCanvasProps {
  systemState: QuantumSystemState;
  selectedQubit: number | null;
  onSelectQubit: (id: number) => void;
  infinityAnchorActive: boolean;
  gates?: GateOperation[];
  params?: DecoherenceParams;
}

export interface QubitDecoherenceHeat {
  id: number;
  x: number;
  y: number;
  z: number;
  w: number;
  errorTotal: number;
  errorT1: number;
  errorT2: number;
  errorCrosstalk: number;
  errorGate: number;
  relativeIntensity: number; // 0.0 to 1.0 normalized
  colorRgba: (alpha: number) => string;
}

export const HypercubeCanvas: React.FC<HypercubeCanvasProps> = ({
  systemState,
  selectedQubit,
  onSelectQubit,
  infinityAnchorActive,
  gates = [],
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 6 4D Rotation Angles (in radians)
  const [angles, setAngles] = useState({
    xy: 0.25,
    xz: 0.35,
    xw: 0.45,
    yz: 0.15,
    yw: 0.20,
    zw: 0.30
  });

  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [zoom, setZoom] = useState(1.0);
  const [projectionMode, setProjectionMode] = useState<'Stereographic' | 'Orthographic'>('Stereographic');
  const [hoveredQubit, setHoveredQubit] = useState<number | null>(null);

  // Camera Presets & Scale Management
  const [activePreset, setActivePreset] = useState<string>('isometric');
  const [scaleMode, setScaleMode] = useState<'planck' | 'cryo' | 'topology'>('planck');
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showPlaneControls, setShowPlaneControls] = useState(true);
  const [planeCategoryTab, setPlaneCategoryTab] = useState<'all' | 'spatial' | 'hyper'>('all');

  // Interactive mouse drag
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // --- Entanglement Swapping Overlay State ---
  const [swappingOverlayEnabled, setSwappingOverlayEnabled] = useState(true);
  const [swappingPaused, setSwappingPaused] = useState(false);
  const [manualSwappingPhase, setManualSwappingPhase] = useState<number | null>(null); // null = auto loop
  const swappingCycleTimeRef = useRef(0);

  // --- Decoherence Heatmap Overlay State ---
  const [heatmapOverlayEnabled, setHeatmapOverlayEnabled] = useState(true);
  const [heatmapMetric, setHeatmapMetric] = useState<'total' | 't2_dephasing' | 'crosstalk'>('total');

  // Screen projected coordinates of vertices for hit testing & overlay
  const projectedPointsRef = useRef<{ id: number; sx: number; sy: number; sz: number; r: number }[]>([]);

  // ---------------------------------------------------------------------------
  // 1. DECOHERENCE HEATMAP CALCULATION ACROSS 4D COORDINATE SYSTEM
  // ---------------------------------------------------------------------------
  const decoherenceHeatMap = useMemo<Record<number, QubitDecoherenceHeat>>(() => {
    // Determine effective Dynamical Decoupling suppression factor
    let ddFactor = 1.0;
    if (params.dynamicalDecoupling === 'CPMG') ddFactor = 0.35;
    else if (params.dynamicalDecoupling === 'XY4') ddFactor = 0.20;
    else if (params.dynamicalDecoupling === 'XY8') ddFactor = 0.08;
    else if (params.dynamicalDecoupling === 'UDD4') ddFactor = 0.05;

    // Infinity Interception Anchor gauge stabilization factor
    const anchorMitigation = params.infinityAnchorActive ? 0.15 : 1.0;

    // DRAG pulse shaping factor
    const dragFactor = params.dragPulseCorrection ? 0.25 : 1.0;

    // Calculate per-qubit error metrics
    const rawHeats: {
      id: number;
      x: number;
      y: number;
      z: number;
      w: number;
      errorTotal: number;
      errorT1: number;
      errorT2: number;
      errorCrosstalk: number;
      errorGate: number;
    }[] = [];

    let minMetric = Infinity;
    let maxMetric = -Infinity;

    for (let i = 0; i < 16; i++) {
      const v = TESSERACT_VERTICES[i] || { x: (i & 1) ? 1 : 0, y: (i & 2) ? 1 : 0, z: (i & 4) ? 1 : 0, w: (i & 8) ? 1 : 0 };
      
      // Effective local coherence times with physical variation
      const localT1 = params.t1_us * (1 - 0.05 * (i % 3));
      const localT2 = params.t2_us * (1 - 0.06 * (i % 2));

      // Gate count on this qubit
      const gateCount = gates.filter(g => g.targetQubit === i || g.controlQubit === i).length;
      const tElapsedUs = Math.max(1, gateCount) * params.gateDuration_ns / 1000;

      // 1. Thermal relaxation error
      const errorT1 = 1 - Math.exp(-tElapsedUs / Math.max(0.1, localT1));

      // 2. Phase dephasing error with DD mitigation
      const errorT2 = 1 - Math.exp(-(tElapsedUs * ddFactor) / Math.max(0.1, localT2));

      // 3. 4D Cross-talk error: increases with W coordinate (4th dimension separation)
      const errorCrosstalk = params.crosstalkCoupling_MHz * 0.015 * (1 + v.w * params.hyperDistanceFactor * 0.75);

      // 4. Gate pulse noise
      const errorGate = (1 - Math.pow(1 - params.pulseErrorRate, Math.max(1, gateCount))) * dragFactor;

      // Combined total predicted error accumulation
      const errorTotal = Math.min(0.99, (errorT1 * 0.5 + errorT2 * 0.5 + errorCrosstalk) * anchorMitigation + errorGate);

      let targetVal = errorTotal;
      if (heatmapMetric === 't2_dephasing') targetVal = errorT2 * anchorMitigation;
      else if (heatmapMetric === 'crosstalk') targetVal = errorCrosstalk * anchorMitigation;

      if (targetVal < minMetric) minMetric = targetVal;
      if (targetVal > maxMetric) maxMetric = targetVal;

      rawHeats.push({
        id: i,
        x: v.x,
        y: v.y,
        z: v.z,
        w: v.w,
        errorTotal,
        errorT1,
        errorT2,
        errorCrosstalk,
        errorGate
      });
    }

    const range = Math.max(1e-5, maxMetric - minMetric);

    const map: Record<number, QubitDecoherenceHeat> = {};
    for (const h of rawHeats) {
      let targetVal = h.errorTotal;
      if (heatmapMetric === 't2_dephasing') targetVal = h.errorT2 * anchorMitigation;
      else if (heatmapMetric === 'crosstalk') targetVal = h.errorCrosstalk * anchorMitigation;

      const normalized = Math.max(0, Math.min(1.0, (targetVal - minMetric) / range));

      // Thermal color mapping: Cyan (0.0) -> Emerald (0.3) -> Amber (0.65) -> Crimson (1.0)
      const colorRgba = (alpha: number) => {
        if (normalized < 0.3) {
          // Cool Cyan to Emerald
          const t = normalized / 0.3;
          const r = Math.round(6 + (16 - 6) * t);
          const g = Math.round(182 + (185 - 182) * t);
          const b = Math.round(212 + (129 - 212) * t);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else if (normalized < 0.7) {
          // Emerald to Amber
          const t = (normalized - 0.3) / 0.4;
          const r = Math.round(16 + (245 - 16) * t);
          const g = Math.round(185 + (158 - 185) * t);
          const b = Math.round(129 + (11 - 129) * t);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else {
          // Amber to Crimson/Rose
          const t = (normalized - 0.7) / 0.3;
          const r = Math.round(245 + (239 - 245) * t);
          const g = Math.round(158 + (68 - 158) * t);
          const b = Math.round(11 + (68 - 11) * t);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      };

      map[h.id] = {
        ...h,
        relativeIntensity: normalized,
        colorRgba
      };
    }

    return map;
  }, [params, gates, heatmapMetric]);

  // Overall heatmap statistics
  const heatmapStats = useMemo(() => {
    const list = Object.values(decoherenceHeatMap);
    if (!list.length) return { min: 0, max: 0, mean: 0, maxNode: 0, minNode: 0 };

    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let maxNode = 0;
    let minNode = 0;

    for (const h of list) {
      const val = heatmapMetric === 'total' ? h.errorTotal : heatmapMetric === 't2_dephasing' ? h.errorT2 : h.errorCrosstalk;
      sum += val;
      if (val > max) {
        max = val;
        maxNode = h.id;
      }
      if (val < min) {
        min = val;
        minNode = h.id;
      }
    }

    return {
      min,
      max,
      mean: sum / list.length,
      maxNode,
      minNode
    };
  }, [decoherenceHeatMap, heatmapMetric]);

  // Detect which active gates in the circuit trigger / participate in entanglement swapping
  const swappingGateInfo = useMemo(() => {
    const swapGates = gates.filter(g => 
      g.type === 'SWAP' || 
      g.type === 'iSWAP' || 
      g.type === 'CP4D' || 
      g.type === 'CZ' ||
      (g.type === 'CNOT' && g.controlQubit !== undefined)
    );

    let qA = 0;
    let qB = 1;
    let qC = Math.min(systemState.numActiveQubits - 2, 7);
    let qD = Math.min(systemState.numActiveQubits - 1, 15);

    const cp4dGate = gates.find(g => g.type === 'CP4D');
    if (cp4dGate && cp4dGate.controlQubit !== undefined) {
      qB = cp4dGate.controlQubit;
      qC = cp4dGate.targetQubit;
      qA = 0;
      qD = Math.max(qC + 1, systemState.numActiveQubits - 1);
    }

    const hasSwappingGates = gates.some(g => ['SWAP', 'iSWAP', 'CP4D', 'CZ'].includes(g.type)) || gates.length >= 4;

    return {
      hasSwappingGates,
      activeGates: swapGates,
      nodes: { qA, qB, qC, qD }
    };
  }, [gates, systemState.numActiveQubits]);

  // 4D Rotation matrix application
  const rotate4D = useCallback((x: number, y: number, z: number, w: number, a: typeof angles) => {
    // 1. Rotate in XY plane
    let cos = Math.cos(a.xy), sin = Math.sin(a.xy);
    let x1 = x * cos - y * sin;
    let y1 = x * sin + y * cos;
    let z1 = z;
    let w1 = w;

    // 2. Rotate in XZ plane
    cos = Math.cos(a.xz); sin = Math.sin(a.xz);
    let x2 = x1 * cos - z1 * sin;
    let y2 = y1;
    let z2 = x1 * sin + z1 * cos;
    let w2 = w1;

    // 3. Rotate in XW plane
    cos = Math.cos(a.xw); sin = Math.sin(a.xw);
    let x3 = x2 * cos - w2 * sin;
    let y3 = y2;
    let z3 = z2;
    let w3 = x2 * sin + w2 * cos;

    // 4. Rotate in YZ plane
    cos = Math.cos(a.yz); sin = Math.sin(a.yz);
    let x4 = x3;
    let y4 = y3 * cos - z3 * sin;
    let z4 = y3 * sin + z3 * cos;
    let w4 = w3;

    // 5. Rotate in YW plane
    cos = Math.cos(a.yw); sin = Math.sin(a.yw);
    let x5 = x4;
    let y5 = y4 * cos - w4 * sin;
    let z5 = z4;
    let w5 = y4 * sin + w4 * cos;

    // 6. Rotate in ZW plane
    cos = Math.cos(a.zw); sin = Math.sin(a.zw);
    let x6 = x5;
    let y6 = y5;
    let z6 = z5 * cos - w5 * sin;
    let w6 = z5 * sin + w5 * cos;

    return [x6, y6, z6, w6];
  }, []);

  // Main render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Background subtle 4D metric grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140 * zoom, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 240 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Transform all 16 vertices of the Tesseract
      const transformed: { id: number; sx: number; sy: number; sz: number; w4: number; qubit?: Qubit4DCoord }[] = [];

      const distance4DCamera = 2.4;
      const scale = 160 * zoom;

      for (let i = 0; i < 16; i++) {
        const rawX = (i & 1) ? 1 : -1;
        const rawY = (i & 2) ? 1 : -1;
        const rawZ = (i & 4) ? 1 : -1;
        const rawW = (i & 8) ? 1 : -1;

        const [rx, ry, rz, rw] = rotate4D(rawX, rawY, rawZ, rawW, angles);

        let sx: number, sy: number;
        if (projectionMode === 'Stereographic') {
          const wFactor = 1 / (distance4DCamera - rw * 0.45);
          const px = rx * wFactor;
          const py = ry * wFactor;
          const pz = rz * wFactor;

          const zFactor = 1 / (2.8 - pz * 0.4);
          sx = centerX + px * zFactor * scale;
          sy = centerY + py * zFactor * scale;
        } else {
          sx = centerX + rx * (scale * 0.65);
          sy = centerY + ry * (scale * 0.65);
        }

        const q = systemState.qubits.find(qu => qu.id === i);
        transformed.push({
          id: i,
          sx,
          sy,
          sz: rz,
          w4: rw,
          qubit: q
        });
      }

      projectedPointsRef.current = transformed.map(t => ({
        id: t.id,
        sx: t.sx,
        sy: t.sy,
        sz: t.sz,
        r: 12 * zoom
      }));

      // -----------------------------------------------------------------------
      // 2. RENDER DECOHERENCE HEATMAP OVERLAY (BACKGROUND GLOW & CONTOURS)
      // -----------------------------------------------------------------------
      if (heatmapOverlayEnabled) {
        ctx.save();
        const pulse = (Math.sin(Date.now() * 0.0025) + 1) * 0.5;

        // Draw volumetric heat halos behind vertices
        for (const node of transformed) {
          const heat = decoherenceHeatMap[node.id];
          if (!heat) continue;

          const intensity = heat.relativeIntensity;
          const heatRadius = (32 + intensity * 38) * zoom;

          const gradient = ctx.createRadialGradient(node.sx, node.sy, 2, node.sx, node.sy, heatRadius);
          gradient.addColorStop(0, heat.colorRgba(0.35 + intensity * 0.25));
          gradient.addColorStop(0.5, heat.colorRgba(0.15 + intensity * 0.12));
          gradient.addColorStop(1, heat.colorRgba(0.0));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, heatRadius, 0, Math.PI * 2);
          ctx.fill();

          // Equipotential contour ripple for hotter nodes (> 0.65 intensity)
          if (intensity > 0.65) {
            const rippleR = heatRadius * (0.8 + pulse * 0.35);
            ctx.strokeStyle = heat.colorRgba(0.35 * (1 - pulse));
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, rippleR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 3. Draw Central Infinity Interception Anchor Singularity if active
      if (infinityAnchorActive) {
        ctx.save();
        const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
        const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 70 * zoom + pulse * 20);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 90 * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Rotating anchor ring
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 52 * zoom, Date.now() * 0.001, Date.now() * 0.001 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 4. Draw Tesseract Edges (32 edges) with Heatmap Gradient Conduit option
      ctx.lineWidth = 1.2;
      for (const [v1, v2] of TESSERACT_EDGES) {
        const p1 = transformed[v1];
        const p2 = transformed[v2];
        if (!p1 || !p2) continue;

        const avgZ = (p1.sz + p2.sz) / 4 + 0.5;
        const alpha = Math.max(0.12, Math.min(0.65, avgZ * 0.4 + 0.2));
        const isWEdge = (v1 ^ v2) === 8;

        if (heatmapOverlayEnabled) {
          // Heat conduction coloring along edges
          const heat1 = decoherenceHeatMap[v1];
          const heat2 = decoherenceHeatMap[v2];
          const avgIntensity = ((heat1?.relativeIntensity ?? 0.5) + (heat2?.relativeIntensity ?? 0.5)) / 2;

          if (avgIntensity > 0.6) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 1.4})`;
          } else if (avgIntensity > 0.3) {
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 1.2})`;
          } else {
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.9})`;
          }
        } else {
          if (isWEdge) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 1.2})`;
          } else {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          }
        }

        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      // 5. Draw Standard Entanglement Links
      for (const link of systemState.entanglementLinks) {
        const p1 = transformed[link.qubitA];
        const p2 = transformed[link.qubitB];
        if (!p1 || !p2) continue;

        const pulse = (Math.sin(Date.now() * 0.005 + link.qubitA) + 1) * 0.5;
        ctx.save();
        ctx.lineWidth = Math.max(2, link.concurrence * 4.5);
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + link.concurrence * 0.5 + pulse * 0.15})`;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12 * link.concurrence;

        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Entanglement Swapping Visual Animation Overlay
      if (swappingOverlayEnabled && swappingGateInfo.hasSwappingGates) {
        const { qA, qB, qC, qD } = swappingGateInfo.nodes;
        const nodeA = transformed[qA];
        const nodeB = transformed[qB];
        const nodeC = transformed[qC];
        const nodeD = transformed[qD];

        if (nodeA && nodeB && nodeC && nodeD) {
          let currentPhase: number;
          if (manualSwappingPhase !== null) {
            currentPhase = manualSwappingPhase;
          } else {
            if (!swappingPaused) {
              swappingCycleTimeRef.current += 0.004;
            }
            currentPhase = (swappingCycleTimeRef.current % 1.0);
          }

          ctx.save();

          // Stage 1: Initial local EPR pairs (A-B) and (C-D)
          if (currentPhase < 0.70) {
            const pairAlpha = currentPhase < 0.35 ? 0.9 : Math.max(0.2, 1.0 - (currentPhase - 0.35) * 2.2);

            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(56, 189, 248, ${pairAlpha})`;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(nodeA.sx, nodeA.sy);
            ctx.lineTo(nodeB.sx, nodeB.sy);
            ctx.stroke();

            ctx.strokeStyle = `rgba(168, 85, 247, ${pairAlpha})`;
            ctx.shadowColor = '#a855f7';
            ctx.beginPath();
            ctx.moveTo(nodeC.sx, nodeC.sy);
            ctx.lineTo(nodeD.sx, nodeD.sy);
            ctx.stroke();
            ctx.setLineDash([]);

            const beadProgress = (currentPhase * 3) % 1.0;
            const bead1X = nodeA.sx + (nodeB.sx - nodeA.sx) * beadProgress;
            const bead1Y = nodeA.sy + (nodeB.sy - nodeA.sy) * beadProgress;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(bead1X, bead1Y, 4.5, 0, Math.PI * 2);
            ctx.fill();

            const bead2X = nodeD.sx + (nodeC.sx - nodeD.sx) * beadProgress;
            const bead2Y = nodeD.sy + (nodeC.sy - nodeD.sy) * beadProgress;
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(bead2X, bead2Y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Stage 2: Bell State Measurement (BSM) Nexus
          if (currentPhase >= 0.25 && currentPhase <= 0.85) {
            const bsmPhase = (currentPhase - 0.25) / 0.60;
            const bsmCenterX = (nodeB.sx + nodeC.sx) / 2;
            const bsmCenterY = (nodeB.sy + nodeC.sy) / 2;

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = `rgba(251, 191, 36, ${Math.sin(bsmPhase * Math.PI) * 0.95})`;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.moveTo(nodeB.sx, nodeB.sy);
            ctx.lineTo(nodeC.sx, nodeC.sy);
            ctx.stroke();

            const rippleCount = 3;
            for (let r = 0; r < rippleCount; r++) {
              const rPhase = ((bsmPhase * 2.5 + r / rippleCount) % 1.0);
              const radius = 8 + rPhase * 42 * zoom;
              const alpha = Math.max(0, (1 - rPhase) * Math.sin(bsmPhase * Math.PI) * 0.8);

              ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.arc(bsmCenterX, bsmCenterY, radius, 0, Math.PI * 2);
              ctx.stroke();
            }

            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fde68a';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ BSM NEXUS', bsmCenterX, bsmCenterY - 14);
          }

          // Stage 3: SWAPPED Non-Local Hyper-Arc
          if (currentPhase >= 0.50) {
            const swapPhase = (currentPhase - 0.50) / 0.50;
            const swapAlpha = Math.min(1.0, swapPhase * 2.5);

            ctx.lineWidth = 4;
            ctx.strokeStyle = `rgba(52, 211, 153, ${swapAlpha * 0.95})`;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 24 * swapAlpha;

            const midX = (nodeA.sx + nodeD.sx) / 2;
            const midY = (nodeA.sy + nodeD.sy) / 2 - 38 * zoom;

            ctx.beginPath();
            ctx.moveTo(nodeA.sx, nodeA.sy);
            ctx.quadraticCurveTo(midX, midY, nodeD.sx, nodeD.sy);
            ctx.stroke();

            ctx.lineWidth = 1.8;
            ctx.strokeStyle = `rgba(255, 255, 255, ${swapAlpha * 0.8})`;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(nodeA.sx, nodeA.sy);
            ctx.quadraticCurveTo(midX, midY - 6, nodeD.sx, nodeD.sy);
            ctx.stroke();
            ctx.setLineDash([]);

            const pulseT = ((currentPhase * 2) % 1.0);
            const arcX = (1 - pulseT) * (1 - pulseT) * nodeA.sx + 2 * (1 - pulseT) * pulseT * midX + pulseT * pulseT * nodeD.sx;
            const arcY = (1 - pulseT) * (1 - pulseT) * nodeA.sy + 2 * (1 - pulseT) * pulseT * midY + pulseT * pulseT * nodeD.sy;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 5.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#34d399';
            ctx.textAlign = 'center';
            ctx.fillText(`SWAPPED 4D LINK: q${qA} ⟷ q${qD}`, midX, midY - 12);
          }

          ctx.restore();
        }
      }

      // 7. Draw Qubit Nodes (Sort back to front by sz)
      const sortedNodes = [...transformed].sort((a, b) => a.sz - b.sz);

      for (const node of sortedNodes) {
        const isHovered = hoveredQubit === node.id;
        const isSelected = selectedQubit === node.id;
        const isActive = node.id < systemState.numActiveQubits;

        const isSwappingNode = swappingOverlayEnabled && (
          node.id === swappingGateInfo.nodes.qA ||
          node.id === swappingGateInfo.nodes.qB ||
          node.id === swappingGateInfo.nodes.qC ||
          node.id === swappingGateInfo.nodes.qD
        );

        const baseRadius = (isActive ? 11 : 7) * zoom;
        const nodeRadius = isHovered || isSelected || isSwappingNode ? baseRadius * 1.35 : baseRadius;

        // Qubit color determined by Bloch phase & state, modulated by heatmap if enabled
        const phase = node.qubit?.statePhase || 0;
        let nodeFillColor = '#334155';

        if (heatmapOverlayEnabled) {
          const heat = decoherenceHeatMap[node.id];
          nodeFillColor = heat ? heat.colorRgba(0.88) : '#38bdf8';
        } else {
          const rColor = Math.round(120 + 100 * Math.cos(phase));
          const gColor = Math.round(180 + 75 * Math.sin(phase));
          const bColor = 248;
          nodeFillColor = isSwappingNode ? '#059669' : isActive ? `rgb(${rColor}, ${gColor}, ${bColor})` : '#334155';
        }

        // Halo glow
        if (isSelected || isHovered || isSwappingNode) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, nodeRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = isSelected 
            ? 'rgba(56, 189, 248, 0.35)' 
            : isSwappingNode 
            ? 'rgba(52, 211, 153, 0.30)' 
            : 'rgba(168, 85, 247, 0.25)';
          ctx.fill();
          ctx.restore();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = nodeFillColor;
        ctx.fill();

        ctx.lineWidth = isSelected ? 2.5 : isSwappingNode ? 2.0 : 1.2;
        ctx.strokeStyle = isSelected ? '#ffffff' : isSwappingNode ? '#34d399' : isActive ? '#38bdf8' : '#1e293b';
        ctx.stroke();

        // Node ID label
        ctx.font = `${Math.max(9, Math.round(10 * zoom))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`q${node.id}`, node.sx, node.sy);

        // Sub-label with error percentage if heatmap enabled, otherwise 4D binary
        if (heatmapOverlayEnabled) {
          const heat = decoherenceHeatMap[node.id];
          const errVal = heat ? (heatmapMetric === 'total' ? heat.errorTotal : heatmapMetric === 't2_dephasing' ? heat.errorT2 : heat.errorCrosstalk) * 100 : 0;
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.fillStyle = heat ? heat.colorRgba(1.0) : '#f87171';
          ctx.fillText(`${errVal.toFixed(2)}%`, node.sx, node.sy + nodeRadius + 10);
        } else if (isSwappingNode && swappingOverlayEnabled) {
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#6ee7b7';
          let role = '';
          if (node.id === swappingGateInfo.nodes.qA) role = 'SRC-A';
          else if (node.id === swappingGateInfo.nodes.qB) role = 'BSM-B';
          else if (node.id === swappingGateInfo.nodes.qC) role = 'BSM-C';
          else if (node.id === swappingGateInfo.nodes.qD) role = 'END-D';
          ctx.fillText(role, node.sx, node.sy - nodeRadius - 8);
        } else if (isHovered || isSelected || zoom > 1.2) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#94a3b8';
          const binaryLabel = `${(node.id & 1) ? 1 : 0}${(node.id & 2) ? 1 : 0}${(node.id & 4) ? 1 : 0}${(node.id & 8) ? 1 : 0}`;
          ctx.fillText(`(${binaryLabel})`, node.sx, node.sy + nodeRadius + 11);
        }
      }

      // Auto rotation increment
      if (autoRotate) {
        setAngles(prev => ({
          xy: prev.xy + 0.003 * rotationSpeed,
          xz: prev.xz + 0.002 * rotationSpeed,
          xw: prev.xw + 0.004 * rotationSpeed,
          yz: prev.yz + 0.001 * rotationSpeed,
          yw: prev.yw + 0.0025 * rotationSpeed,
          zw: prev.zw + 0.0035 * rotationSpeed
        }));
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    angles, 
    autoRotate, 
    rotationSpeed, 
    zoom, 
    projectionMode, 
    hoveredQubit, 
    selectedQubit, 
    systemState, 
    infinityAnchorActive, 
    rotate4D,
    swappingOverlayEnabled,
    swappingPaused,
    manualSwappingPhase,
    swappingGateInfo,
    heatmapOverlayEnabled,
    heatmapMetric,
    decoherenceHeatMap
  ]);

  // Camera perspective presets
  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    setAutoRotate(false);
    if (presetId === 'isometric') {
      setAngles({ xy: 0.35, xz: 0.45, xw: 0.40, yz: 0.20, yw: 0.25, zw: 0.30 });
      setZoom(1.0);
    } else if (presetId === 'nested') {
      // Classic Schlegel tesseract projection: inner cube suspended in outer cube
      setAngles({ xy: 0.05, xz: 0.05, xw: 0.785, yz: 0.0, yw: 0.0, zw: 0.0 });
      setZoom(1.1);
    } else if (presetId === 'clifford') {
      // Clifford Torus / chiral symmetry
      setAngles({ xy: 0.785, xz: 0.0, xw: 0.785, yz: 0.0, yw: 0.785, zw: 0.0 });
      setZoom(1.0);
    } else if (presetId === 'orthogonal') {
      // 3D face along W axis
      setAngles({ xy: 0.0, xz: 0.0, xw: 0.0, yz: 0.0, yw: 0.0, zw: 0.0 });
      setZoom(0.95);
    } else if (presetId === 'diagonal') {
      // 4D principal diagonal
      setAngles({ xy: 0.61, xz: 0.52, xw: 0.73, yz: 0.42, yw: 0.35, zw: 0.65 });
      setZoom(1.05);
    }
  };

  // Canvas Mouse and Drag Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    let found: number | null = null;
    for (const p of projectedPointsRef.current) {
      const dist = Math.hypot(p.sx - mouseX, p.sy - mouseY);
      if (dist <= p.r * 1.5) {
        found = p.id;
        break;
      }
    }
    setHoveredQubit(found);

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 2) {
        hasMovedRef.current = true;
        if (e.shiftKey) {
          // Hyper-plane rotation
          setAngles(prev => ({
            ...prev,
            xw: (prev.xw + dx * 0.008) % (Math.PI * 2),
            yw: (prev.yw + dy * 0.008) % (Math.PI * 2),
          }));
        } else {
          // Spatial 3D rotation
          setAngles(prev => ({
            ...prev,
            xy: (prev.xy + dx * 0.008) % (Math.PI * 2),
            xz: (prev.xz + dy * 0.008) % (Math.PI * 2),
          }));
        }
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(0.6, Math.min(2.4, z - e.deltaY * 0.0015)));
  };

  const handleCanvasClick = () => {
    if (!hasMovedRef.current && hoveredQubit !== null) {
      onSelectQubit(hoveredQubit);
    }
  };

  const resetRotation = () => {
    applyPreset('isometric');
    setAutoRotate(true);
  };

  const currentPhaseVal = manualSwappingPhase ?? ((swappingCycleTimeRef.current % 1.0) || 0.1);
  const currentStageText = currentPhaseVal < 0.33
    ? '1. Initial EPR Generation (qA-qB & qC-qD)'
    : currentPhaseVal < 0.66
    ? '2. Bell State Measurement (qB ⊗ qC)'
    : '3. Swapped Non-Local Teleportation (qA ⟷ qD)';

  // Find entangled partners for selected qubit
  const selectedQubitPartners = useMemo(() => {
    if (selectedQubit === null) return [];
    return systemState.entanglementLinks
      .filter(l => l.qubitA === selectedQubit || l.qubitB === selectedQubit)
      .map(l => ({
        partner: l.qubitA === selectedQubit ? l.qubitB : l.qubitA,
        concurrence: l.concurrence,
      }));
  }, [selectedQubit, systemState.entanglementLinks]);

  // Rotational planes definition
  const planeConfigs = [
    { id: 'xy', name: 'XY Plane', label: 'Yaw (Spatial X-Y)', category: 'spatial', color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { id: 'xz', name: 'XZ Plane', label: 'Pitch (Spatial X-Z)', category: 'spatial', color: 'text-sky-400', border: 'border-sky-500/30' },
    { id: 'yz', name: 'YZ Plane', label: 'Roll (Spatial Y-Z)', category: 'spatial', color: 'text-teal-400', border: 'border-teal-500/30' },
    { id: 'xw', name: 'XW Plane', label: 'Hyper-Yaw (4D X-W)', category: 'hyper', color: 'text-violet-400', border: 'border-violet-500/30' },
    { id: 'yw', name: 'YW Plane', label: 'Hyper-Pitch (4D Y-W)', category: 'hyper', color: 'text-purple-400', border: 'border-purple-500/30' },
    { id: 'zw', name: 'ZW Plane', label: 'Hyper-Roll (4D Z-W)', category: 'hyper', color: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  ] as const;

  const filteredPlanes = planeConfigs.filter(p => {
    if (planeCategoryTab === 'all') return true;
    return p.category === planeCategoryTab;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      {/* 1. User-Friendly Visualizer Header */}
      <div className="flex flex-col border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-2">
          {/* Title & Human-Friendly Badges */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Rotate3d className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-wider text-xs">4D TESSERACT HYPER-LATTICE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-medium">
                  16-Qubit Cell
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  32 Couplings
                </span>
              </div>
              
              {/* Human-Friendly Metric & Scale Readout */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <button
                  onClick={() => setShowScaleModal(!showScaleModal)}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono text-[10px] bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                  title="View and configure 4D invariant scale and coordinate metric"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>
                    {scaleMode === 'planck' ? 'Planck Scale (Λ_∞ Invariant)' : scaleMode === 'cryo' ? 'Cryogenic Micro-Scale (50 μm)' : 'Topology Cell ({0,1}⁴)'}
                  </span>
                  <Info className="w-2.5 h-2.5 text-slate-400" />
                </button>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 text-[10px] font-mono">
                  {infinityAnchorActive ? 'Shielded via Gauge Invariant' : 'Free Drift'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions & Overlays Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Decoherence Heatmap Overlay Toggle */}
            <button
              onClick={() => setHeatmapOverlayEnabled(!heatmapOverlayEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] border transition-all ${
                heatmapOverlayEnabled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-semibold shadow-sm shadow-rose-900/30'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle visual decoherence heatmap mapping predicted error accumulation across 4D coordinates"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Heatmap</span>
              <span className={`w-1.5 h-1.5 rounded-full ${heatmapOverlayEnabled ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>

            {/* Entanglement Swapping Overlay Toggle Button */}
            <button
              onClick={() => setSwappingOverlayEnabled(!swappingOverlayEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] border transition-all ${
                swappingOverlayEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold shadow-sm shadow-emerald-900/30'
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle animated Entanglement Swapping overlay on the 4D hypercube"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Swapping</span>
              <span className={`w-1.5 h-1.5 rounded-full ${swappingOverlayEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>

            {/* Projection Mode Toggle */}
            <button
              onClick={() => setProjectionMode(m => m === 'Stereographic' ? 'Orthographic' : 'Stereographic')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 font-mono transition-colors text-[11px] border border-slate-700"
              title="Switch between Stereographic 4D Perspective and Orthographic Parallel Projection"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{projectionMode}</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Auto Rotate Play/Pause */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border transition-all ${
                autoRotate 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-900/30' 
                  : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={autoRotate ? "Pause 4D auto-rotation" : "Resume 4D auto-rotation"}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Zoom Controls */}
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.min(2.4, z + 0.15))}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Reset View */}
            <button
              onClick={resetRotation}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="Reset 4D rotation and zoom to default Isometric view"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle 6-DOF controls drawer */}
            <button
              onClick={() => setShowPlaneControls(!showPlaneControls)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-mono text-[11px] border transition-colors ${
                showPlaneControls
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle 4D rotational plane angle adjustment panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planes</span>
              {showPlaneControls ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 2. Quick 1-Click Perspective Presets Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/70 border-t border-slate-800/60 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              Presets:
            </span>

            {[
              { id: 'isometric', label: 'Isometric 4D', desc: 'Balanced 16-node view' },
              { id: 'nested', label: 'Nested Tesseract', desc: 'Schlegel inner/outer cube' },
              { id: 'clifford', label: 'Clifford Symmetry', desc: 'Dual chiral rotation' },
              { id: 'orthogonal', label: '3D Face', desc: 'Projection along W axis' },
              { id: 'diagonal', label: 'Hyper-Diagonal', desc: 'Diagonal cross-section' },
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  activePreset === preset.id && !autoRotate
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span>🖱️ Drag to rotate</span>
            <span>·</span>
            <span>Shift+Drag for 4D</span>
            <span>·</span>
            <span>Scroll to zoom</span>
          </div>
        </div>
      </div>

      {/* Scale Information Modal / Popover */}
      {showScaleModal && (
        <div className="p-3 bg-slate-950 border-b border-cyan-500/30 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>4D Coordinate Metric & Stabilizer Scale</span>
            </div>
            <button
              onClick={() => setShowScaleModal(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 font-mono text-[11px]">
            <button
              onClick={() => setScaleMode('planck')}
              className={`p-2 rounded-lg border text-left transition-all ${
                scaleMode === 'planck'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs text-white">Planck Scale (Λ_∞)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Stabilizer seed: <span className="text-cyan-300 font-mono">{INFINITY_ANCHOR_RAW}</span> (~1.02 × 10²⁷)
              </div>
            </button>

            <button
              onClick={() => setScaleMode('cryo')}
              className={`p-2 rounded-lg border text-left transition-all ${
                scaleMode === 'cryo'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs text-white">Cryogenic Chip Scale</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Physical microwave pitch: 50 μm transmon cavity separation.
              </div>
            </button>

            <button
              onClick={() => setScaleMode('topology')}
              className={`p-2 rounded-lg border text-left transition-all ${
                scaleMode === 'topology'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-xs text-white">Topology Cell ({'{0,1}⁴'})</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Pure boolean hypercube metric with unit Hamming distance.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="relative flex-1 min-h-[380px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={520}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* Floating In-Canvas Guidance Pill */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none text-[11px] font-mono z-10">
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span><strong className="text-emerald-400">{systemState.entanglementLinks.length}</strong> Entangled Pairs</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 shadow-md">
            Bell CHSH S: <span className="text-cyan-400 font-semibold">{systemState.bellCHSHValue}</span> / 2.8284
          </div>
        </div>

        {/* DECOHERENCE HEATMAP HUD & COLOR SCALE LEGEND (BOTTOM-LEFT) */}
        {heatmapOverlayEnabled && (
          <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md border border-rose-500/40 rounded-xl p-3 text-xs font-mono shadow-2xl w-80 z-20">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Flame className="w-4 h-4" />
                <span>DECOHERENCE HEATMAP</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                4D ERROR INTENSITY
              </span>
            </div>

            {/* Metric Mode Selector */}
            <div className="flex items-center gap-1 mb-2 bg-slate-950 p-1 rounded border border-slate-800 text-[10px]">
              <button
                onClick={() => setHeatmapMetric('total')}
                className={`flex-1 py-1 rounded transition-colors ${heatmapMetric === 'total' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Total Error
              </button>
              <button
                onClick={() => setHeatmapMetric('t2_dephasing')}
                className={`flex-1 py-1 rounded transition-colors ${heatmapMetric === 't2_dephasing' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                T2* Dephasing
              </button>
              <button
                onClick={() => setHeatmapMetric('crosstalk')}
                className={`flex-1 py-1 rounded transition-colors ${heatmapMetric === 'crosstalk' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                4D Cross-talk χ
              </button>
            </div>

            {/* Chromatic Gradient Scale Bar */}
            <div className="space-y-1 mb-2.5">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner" />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-cyan-300">{(heatmapStats.min * 100).toFixed(2)}% (Min)</span>
                <span className="text-amber-300">{(heatmapStats.mean * 100).toFixed(2)}% (Mean)</span>
                <span className="text-rose-400 font-bold">{(heatmapStats.max * 100).toFixed(2)}% (Peak)</span>
              </div>
            </div>

            {/* Key Telemetry Readouts */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950 p-2 rounded border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Peak Hotspot:</span>
                <span className="text-rose-400 font-bold">
                  q{heatmapStats.maxNode} [{TESSERACT_VERTICES[heatmapStats.maxNode]?.x}{TESSERACT_VERTICES[heatmapStats.maxNode]?.y}{TESSERACT_VERTICES[heatmapStats.maxNode]?.z}{TESSERACT_VERTICES[heatmapStats.maxNode]?.w}]
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Lowest Drift:</span>
                <span className="text-cyan-300 font-bold">
                  q{heatmapStats.minNode} [{TESSERACT_VERTICES[heatmapStats.minNode]?.x}{TESSERACT_VERTICES[heatmapStats.minNode]?.y}{TESSERACT_VERTICES[heatmapStats.minNode]?.z}{TESSERACT_VERTICES[heatmapStats.minNode]?.w}]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ENTANGLEMENT SWAPPING OVERLAY HUD (TOP-RIGHT) */}
        {swappingOverlayEnabled && swappingGateInfo.hasSwappingGates && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-3 text-xs font-mono shadow-2xl w-72 z-20">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Shuffle className="w-4 h-4" />
                <span>SWAPPING PROTOCOL</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                ACTIVE
              </span>
            </div>

            {/* Protocol Phase Stepper */}
            <div className="space-y-1.5 mb-2.5">
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Phase Progress:</span>
                <span className="text-cyan-300">{currentStageText.split('.')[0]}</span>
              </div>
              <div className="text-[10px] text-slate-200 font-semibold truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                {currentStageText}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 transition-all duration-100"
                  style={{ width: `${currentPhaseVal * 100}%` }}
                />
              </div>
            </div>

            {/* Swapping Controls */}
            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setManualSwappingPhase(0.15)}
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${currentPhaseVal < 0.33 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  title="Stage 1: Initial Bell Pairs"
                >
                  P1
                </button>
                <button
                  onClick={() => setManualSwappingPhase(0.50)}
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${currentPhaseVal >= 0.33 && currentPhaseVal < 0.66 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  title="Stage 2: Joint Bell State Measurement (BSM)"
                >
                  P2
                </button>
                <button
                  onClick={() => setManualSwappingPhase(0.85)}
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${currentPhaseVal >= 0.66 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  title="Stage 3: Swapped Non-Local Hyper-Arc"
                >
                  P3
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setManualSwappingPhase(null);
                    setSwappingPaused(!swappingPaused);
                  }}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={swappingPaused ? "Play swapping cycle" : "Pause swapping cycle"}
                >
                  {swappingPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setManualSwappingPhase(null)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px]"
                  title="Resume continuous automatic swapping loop"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Qubit Interactive Inspector Card */}
        {selectedQubit !== null ? (
          <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3.5 text-xs font-mono shadow-2xl w-72 z-20">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <span className="text-cyan-300 font-bold text-sm">Qubit #{selectedQubit}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  [{TESSERACT_VERTICES[selectedQubit]?.x}, {TESSERACT_VERTICES[selectedQubit]?.y}, {TESSERACT_VERTICES[selectedQubit]?.z}, {TESSERACT_VERTICES[selectedQubit]?.w}]
                </span>
                <button
                  onClick={() => onSelectQubit(-1)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Close Inspector"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Bloch Vector:</span>
                <span className="text-cyan-300 font-mono">
                  [{systemState.qubits[selectedQubit]?.blochVector[0].toFixed(2)}, {systemState.qubits[selectedQubit]?.blochVector[1].toFixed(2)}, {systemState.qubits[selectedQubit]?.blochVector[2].toFixed(2)}]
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">T1 Relaxation:</span>
                <span>{systemState.qubits[selectedQubit]?.t1_us.toFixed(1)} μs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">T2* Dephasing:</span>
                <span>{systemState.qubits[selectedQubit]?.t2_us.toFixed(1)} μs</span>
              </div>

              {decoherenceHeatMap[selectedQubit] && (
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-rose-400">Decoherence Rate:</span>
                  <span className="text-rose-300 font-bold">
                    {(decoherenceHeatMap[selectedQubit].errorTotal * 100).toFixed(2)}%
                  </span>
                </div>
              )}

              {/* Entangled Partners section */}
              <div className="pt-1.5 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-400 mb-1">Entangled Links:</div>
                {selectedQubitPartners.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedQubitPartners.map(p => (
                      <button
                        key={p.partner}
                        onClick={() => onSelectQubit(p.partner)}
                        className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] hover:bg-emerald-900 transition-colors flex items-center gap-1"
                        title={`Click to inspect entangled partner Qubit #${p.partner}`}
                      >
                        <span>⇄ Qubit #{p.partner}</span>
                        <span className="text-[9px] text-emerald-400 opacity-75">({(p.concurrence * 100).toFixed(0)}%)</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No active Bell pairs</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Friendly empty-state helper chip */
          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 pointer-events-none hidden sm:block">
            💡 Click any qubit vertex to inspect Bloch vector & parameters
          </div>
        )}
      </div>

      {/* 3. Redesigned User-Friendly 4D Rotational Plane Section */}
      {showPlaneControls && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 mb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">4D ROTATION DEGREES OF FREEDOM</span>
              
              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
                <button
                  onClick={() => setPlaneCategoryTab('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${planeCategoryTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All (6)
                </button>
                <button
                  onClick={() => setPlaneCategoryTab('spatial')}
                  className={`px-2 py-0.5 rounded transition-colors ${planeCategoryTab === 'spatial' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  3D Spatial (3)
                </button>
                <button
                  onClick={() => setPlaneCategoryTab('hyper')}
                  className={`px-2 py-0.5 rounded transition-colors ${planeCategoryTab === 'hyper' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  4D Hyper (3)
                </button>
              </div>
            </div>

            {/* Speed selection */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">AUTO-SPEED:</span>
              {[0.5, 1.0, 2.0].map(s => (
                <button
                  key={s}
                  onClick={() => setRotationSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    rotationSpeed === s 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {filteredPlanes.map(p => {
              const plane = p.id;
              const deg = Math.round(((angles[plane] % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
              return (
                <div key={plane} className="flex flex-col gap-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold ${p.color}`}>{p.name}</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={deg}
                        onChange={e => {
                          const d = parseInt(e.target.value);
                          if (!isNaN(d)) {
                            const rad = (d % 360) * (Math.PI / 180);
                            setAngles(prev => ({ ...prev, [plane]: rad }));
                          }
                        }}
                        className="w-10 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-center font-mono text-[10px] focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-slate-500">°</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 truncate" title={p.label}>
                    {p.label}
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.02"
                    value={angles[plane]}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setAngles(prev => ({ ...prev, [plane]: val }));
                    }}
                    className="w-full accent-cyan-400 h-1 cursor-pointer"
                  />

                  {/* Clean snap degree buttons */}
                  <div className="flex items-center justify-between gap-1 text-[8px] text-slate-400 pt-0.5">
                    <button
                      onClick={() => setAngles(prev => ({ ...prev, [plane]: 0 }))}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      0°
                    </button>
                    <button
                      onClick={() => setAngles(prev => ({ ...prev, [plane]: Math.PI / 2 }))}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      90°
                    </button>
                    <button
                      onClick={() => setAngles(prev => ({ ...prev, [plane]: Math.PI }))}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      180°
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
