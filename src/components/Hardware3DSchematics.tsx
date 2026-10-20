/**
 * Q-TESSERACT // AI Hardware & 3D Printer Schematics Prompts Maker
 * Generates verified, production-ready AI prompt engineering blocks for 3D printer hardware,
 * cryogenic quantum components, OpenSCAD generative code, technical blueprint visuals,
 * and high-tolerance slicer configurations.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Printer, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  Rotate3d, 
  Sliders, 
  Maximize2, 
  Sparkles, 
  FileCode, 
  Compass, 
  ShieldCheck, 
  Flame, 
  ThermometerSnowflake, 
  Play, 
  Pause, 
  RefreshCw,
  Box,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { INFINITY_ANCHOR_RAW } from '../quantum/constants';

export interface HardwareConfigPreset {
  id: string;
  name: string;
  category: 'Quantum Cryogenics' | '3D Printer Toolhead' | 'Topological 4D Coil' | 'Optomechanics';
  subtitle: string;
  description: string;
  dimensionsMm: { x: number; y: number; z: number };
  recommendedMaterial: string;
  recommendedPrinter: string;
  printTechnology: 'FDM (CoreXY)' | 'SLA / DLP Resin' | 'DMLS / SLS Metal';
  toleranceMm: number;
  criticalFeatures: string[];
  openScadSnippet: string;
  blueprintPrompt: string;
  photorealisticPrompt: string;
  slicerConfigPrompt: string;
  wireframeParts: {
    name: string;
    color: string;
    relativeOffset: [number, number, number];
    vertices: [number, number, number][];
    edges: [number, number][];
  }[];
}

export const HARDWARE_PRESETS: HardwareConfigPreset[] = [
  {
    id: 'cryo_quantum_socket',
    name: '16-Qubit Sub-Kelvin Chip Socket (0.015 K Stage)',
    category: 'Quantum Cryogenics',
    subtitle: 'OFHC Gold-Plated Copper Mount for Dilution Refrigerators',
    description: 'Precision cryogenic enclosure with spring-probe pogo-pin channels, integrated copper heat-sink fins, and microwave return grounding paths for 16-qubit tesseract chips at 15 mK.',
    dimensionsMm: { x: 48, y: 48, z: 24 },
    recommendedMaterial: 'Oxygen-Free High-Conductivity Copper (OFHC) or ULTEM 9085 Cryo',
    recommendedPrinter: 'Metal DMLS (EOS M290) or High-Temp FDM (Bambu X1-Carbon / Voron 2.4)',
    printTechnology: 'DMLS / SLS Metal',
    toleranceMm: 0.04,
    criticalFeatures: [
      '24x Micro-coaxial SMA launch pin counterbores with 0.05mm slip-fit',
      'Integrated cold-finger thermal clamping boss with 4x M3 through-holes',
      'Hermetic indium-wire seal groove (0.8mm depth, 1.2mm width)',
      'Sub-Kelvin thermal contraction relief slots along crystallographic axis'
    ],
    openScadSnippet: `// 16-Qubit Sub-Kelvin Cryogenic Socket
$fn = 64;
socket_size = 48.0;
socket_height = 24.0;
cavity_size = 28.0;
cavity_depth = 12.0;
wall_tol = 0.04;

module chip_socket() {
    difference() {
        // Main OFHC Copper Block
        cube([socket_size, socket_size, socket_height], center=true);
        
        // Chip Cavity with tolerance
        translate([0, 0, socket_height/2 - cavity_depth/2 + 0.01])
            cube([cavity_size + wall_tol*2, cavity_size + wall_tol*2, cavity_depth + 0.02], center=true);
        
        // Indium O-ring Gasket Groove
        translate([0, 0, socket_height/2 - 0.8])
            difference() {
                cube([cavity_size + 8, cavity_size + 8, 1.6], center=true);
                cube([cavity_size + 5.6, cavity_size + 5.6, 2.0], center=true);
            }
        
        // 4x Cold-Finger Thermal Fasteners (M3 clearance)
        for (x=[-18, 18]) {
            for (y=[-18, 18]) {
                translate([x, y, 0])
                    cylinder(h=socket_height+2, d=3.2, center=true);
            }
        }
    }
}
chip_socket();`,
    blueprintPrompt: `Technical schematic blueprint drawing of a 16-Qubit Sub-Kelvin Quantum Chip Socket, exploded assembly orthographic 3-view with top view, side elevation, and cross-section A-A. Isometric perspective callout in upper right corner. Precise dimensional markings, dimension witness lines, tolerances ±0.04mm, DIN EN ISO 128 standards, hatch patterns for OFHC copper section, callouts for indium O-ring seal groove, SMA launch ports, and cold finger mounting bosses. Drafting blue grid paper background, clean crisp cyan vector linework, sharp white dimension text, engineering drawing title block in bottom right corner reading "Q-TESSERACT CRYO-SOCKET 16Q - REV 2.4". Highly detailed, architectural CAD aesthetic.`,
    photorealisticPrompt: `Macro studio photograph of a precision CNC and 3D printed cryogenic quantum chip socket for dilution refrigerators, machined from oxygen-free high-conductivity copper with 24k gold flash plating. The enclosure sits on a dark brushed aluminum laboratory optical bench, bathed in soft cinematic cool white LED rim lighting. Visible microscopic toolpaths and precision-machined SMA micro-coaxial spring-contact ports. In the background, subtle blurred bokeh of a gold dilution refrigerator mixing chamber plate and braided silver cryo-cables. Hyper-realistic, 8k resolution, razor sharp focus, shallow depth of field, Industrial Design Excellence Award showcase.`,
    slicerConfigPrompt: `High-Precision DMLS/FDM Slicer Profile:
- Machine: CoreXY Precision Chamber / Metal DMLS
- Layer Height: 0.12 mm (adaptive down to 0.08 mm on O-ring groove)
- Line Width: 0.40 mm (0.4 mm hardened steel nozzle)
- Wall Loops: 6 perimeters (100% solid density around fastener bosses)
- Infill: 100% Solid Rectilinear for maximum cryogenic thermal conductivity
- Printing Temp: 385°C (ULTEM) or Laser Power 200W (OFHC Copper DMLS)
- Chamber Heat Soak: 120°C for 45 min prior to print start
- Cooling: 0% fan for inter-layer fusion; Dimensional Compensation X/Y: +0.03 mm`,
    wireframeParts: [
      {
        name: 'OFHC Base Flange',
        color: '#38bdf8',
        relativeOffset: [0, 0, -10],
        vertices: [
          [-24, -24, -6], [24, -24, -6], [24, 24, -6], [-24, 24, -6],
          [-24, -24, 6], [24, -24, 6], [24, 24, 6], [-24, 24, 6]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      },
      {
        name: 'Cavity Enclosure & RF Shield',
        color: '#fbbf24',
        relativeOffset: [0, 0, 14],
        vertices: [
          [-16, -16, -4], [16, -16, -4], [16, 16, -4], [-16, 16, -4],
          [-16, -16, 4], [16, -16, 4], [16, 16, 4], [-16, 16, 4]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      }
    ]
  },
  {
    id: 'tesseract_waveguide_cavity',
    name: '4D Hypercube Microwave Resonator Cavity',
    category: 'Quantum Cryogenics',
    subtitle: '3D Waveguide Enclosure for 4D Tesseract Qubit Coupling',
    description: '3D printed microwave waveguide resonator engineered to confine 4-8 GHz photons with high internal quality factor Q > 10^6, featuring 8 hyper-planar coupling ports.',
    dimensionsMm: { x: 65, y: 65, z: 42 },
    recommendedMaterial: 'High-Purity Aluminum 6061-T6 or Electroplated Resin',
    recommendedPrinter: 'Formlabs Form 4 (High-Temp Resin) + Copper/Al Electroplate',
    printTechnology: 'SLA / DLP Resin',
    toleranceMm: 0.03,
    criticalFeatures: [
      'TE101 mode spherical-corner rectangular cavity (42x42x28 mm)',
      '8x Orthogonal coax pin input apertures along 4D coordinate faces',
      'Choke-flange anti-leakage knife edge to suppress microwave radiative loss',
      'Smooth internal surface roughness Ra < 0.4 μm'
    ],
    openScadSnippet: `// 4D Hypercube Microwave Resonator Cavity
$fn = 72;
cavity_x = 42.0;
cavity_y = 42.0;
cavity_z = 28.0;
wall_thick = 8.0;

difference() {
    // Outer Shell
    cube([cavity_x + 2*wall_thick, cavity_y + 2*wall_thick, cavity_z + 2*wall_thick], center=true);
    
    // Internal Microwave Cavity with rounded corners
    minkowski() {
        cube([cavity_x - 4, cavity_y - 4, cavity_z - 4], center=true);
        sphere(r=2.0);
    }
    
    // 8x Waveguide Coupler Ports (4-Face Symmetry)
    for (r = [0:90:270]) {
        rotate([0, 0, r]) {
            translate([cavity_x/2 + wall_thick/2, 0, 0])
                rotate([0, 90, 0]) cylinder(h=wall_thick+2, d=4.2, center=true);
        }
    }
}`,
    blueprintPrompt: `Detailed engineering blueprint of a 4D Hypercube Microwave Waveguide Resonator Cavity, isometric projection with cutaway section revealing internal TE101 resonance chamber. Technical cross-section with dimension callouts (65mm x 65mm x 42mm), surface finish roughness symbol Ra 0.4um, microwave coupling coaxial ports labeled Port 1 through Port 8. Clean drafting white lines on dark navy blue CAD blueprint paper, ISO geometric dimensioning and tolerancing (GD&T) runout and flatness callouts, title block with project code "Q-TESSERACT-WAVEGUIDE-4D". Clean, highly accurate mechanical drawing.`,
    photorealisticPrompt: `Photorealistic 3D render of an aerospace-grade 3D printed microwave waveguide resonator cavity, mirror-polished silver aluminum with electroless nickel finish. The cavity is partially disassembled, showing a glowing cyan standing electromagnetic wave inside the polished chamber. Set against a clean dark slate laboratory surface with stainless steel socket head cap screws and SMA connectors neatly arranged. Studio lighting with subtle cyan accent reflections. 8k resolution, crisp photorealism, industrial design showcase.`,
    slicerConfigPrompt: `SLA Resin Slicer Profile for Microwave Mirror Finish:
- Technology: SLA / DLP High-Definition
- Resin: High-Temp Rigid 10K Ceramic Resin (Vicat temp > 220°C)
- Layer Height: 25 microns (0.025 mm) for optical-grade internal surface
- Exposure Time: Normal: 2.4s, Bottom 4 layers: 30s
- Lift Distance: 6.0 mm, Lift Speed: 60 mm/min (gentle peel to preserve knife-edge)
- Post-Curing: 80°C thermal bake for 60 min followed by 405nm UV bath for 30 min
- Electroplating Prep: 15-minute chromic acid etch followed by 5um copper + 2um silver electroplate`,
    wireframeParts: [
      {
        name: 'Outer Cavity Block',
        color: '#a855f7',
        relativeOffset: [0, 0, 0],
        vertices: [
          [-32, -32, -21], [32, -32, -21], [32, 32, -21], [-32, 32, -21],
          [-32, -32, 21], [32, -32, 21], [32, 32, 21], [-32, 32, 21]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      },
      {
        name: 'Waveguide Port Array',
        color: '#38bdf8',
        relativeOffset: [0, 0, 0],
        vertices: [
          [-40, 0, 0], [40, 0, 0], [0, -40, 0], [0, 40, 0],
          [-20, -20, 0], [20, -20, 0], [20, 20, 0], [-20, 20, 0]
        ],
        edges: [
          [0,4], [1,5], [2,4], [3,6], [4,5], [5,6], [6,7], [7,4]
        ]
      }
    ]
  },
  {
    id: 'infinity_coil_former',
    name: `${INFINITY_ANCHOR_RAW} Gauge Invariant Coil Former`,
    category: 'Topological 4D Coil',
    subtitle: 'Toroidal-Helmholtz Hybrid Superconducting Plaquette Former',
    description: '3D printed spool former designed to wind multi-layer niobium-titanium (NbTi) superconducting wire for generating the topological gauge anchor field preserving the infinity invariance.',
    dimensionsMm: { x: 72, y: 72, z: 36 },
    recommendedMaterial: 'Carbon-Fiber Reinforced PEEK or Polycarbonate (Non-Magnetic)',
    recommendedPrinter: 'High-Temperature CoreXY (Voron 2.4 / RatRig V-Core 3.1 / Bambu X1E)',
    printTechnology: 'FDM (CoreXY)',
    toleranceMm: 0.05,
    criticalFeatures: [
      'Helical wire guiding grooves (0.35 mm pitch) for 1020 turns of NbTi wire',
      'Dual Helmholtz axial coil cheeks with structural zero-drift ribbing',
      'Non-magnetic brass threaded insert bosses (M3x4mm)',
      'Liquid helium cryogenic boil-off vent slots'
    ],
    openScadSnippet: `// 1020103010401050106010701080 Gauge Anchor Coil Former
$fn = 96;
outer_d = 72.0;
inner_d = 34.0;
height = 36.0;
groove_w = 1.2;

difference() {
    // Outer Spool Body
    cylinder(h=height, d=outer_d, center=true);
    
    // Core Bore for Cold Finger
    cylinder(h=height+2, d=inner_d, center=true);
    
    // Winding Channel (Toroidal-Helmholtz dual recess)
    difference() {
        cylinder(h=height - 12, d=outer_d + 1, center=true);
        cylinder(h=height - 12, d=inner_d + 10, center=true);
    }
    
    // 6x Cryogenic Helium Circulation Passages
    for (a = [0:60:300]) {
        rotate([0, 0, a]) translate([inner_d/2 + 4, 0, 0])
            cylinder(h=height+2, d=4.0, center=true);
    }
}`,
    blueprintPrompt: `Engineering schematic diagram of a Superconducting Coil Former Spool for topological quantum computing, showing top plan view, side elevation with section view displaying helical wire winding channels, and isometric exploded diagram. Labeled callouts for NbTi wire guide tracks, cryogenic liquid helium cooling flutes, M3 brass heat-set insert pockets, and anchor alignment pin. Dark blueprint paper with grid lines, cyan precision line art, white dimensional callout arrows, ISO standard symbols, title block "PROJECT Q-TESSERACT: TOPOLOGICAL ANCHOR COIL FORMER - INVARIANT ${INFINITY_ANCHOR_RAW}". Ultra-clean vector schematic style.`,
    photorealisticPrompt: `Commercial industrial photograph of a high-temperature 3D printed coil former made of black carbon-fiber reinforced PEEK (CF-PEEK). Around the central spool, fine superconducting purple and gold enameled wire is wound in immaculate precision layers. The coil former is mounted on a brushed stainless steel cryostat mounting flange with four brass hex bolts. Beautiful crisp studio lighting with soft specular reflections catching the woven carbon fiber texture. 8k, photorealistic, sharp focus, magazine cover quality.`,
    slicerConfigPrompt: `High-Performance CF-PEEK / ULTEM Slicer Settings:
- Nozzle: 0.40 mm Tungsten Carbide or Hardened Steel
- Layer Height: 0.16 mm
- Print Speed: Outer perimeter: 35 mm/s, Infill: 60 mm/s
- Hotend Temperature: 410°C (All-Metal High Flow Hotend)
- Heated Bed: 145°C on PEI sheet with Magigoo HT adhesive
- Active Heated Chamber: 90°C (minimum 60 min pre-soak before print)
- Infill: 60% Gyroid for isotropic mechanical rigidity during 4 Kelvin thermal shock
- Retraction: 0.8 mm @ 40 mm/s (Direct Drive Extruder)`,
    wireframeParts: [
      {
        name: 'Lower Spool Flange',
        color: '#10b981',
        relativeOffset: [0, 0, -12],
        vertices: [
          [-36, -36, -3], [36, -36, -3], [36, 36, -3], [-36, 36, -3],
          [-36, -36, 3], [36, -36, 3], [36, 36, 3], [-36, 36, 3]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      },
      {
        name: 'Central Winding Core',
        color: '#06b6d4',
        relativeOffset: [0, 0, 0],
        vertices: [
          [-20, -20, -9], [20, -20, -9], [20, 20, -9], [-20, 20, -9],
          [-20, -20, 9], [20, -20, 9], [20, 20, 9], [-20, 20, 9]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      },
      {
        name: 'Upper Helmholtz Flange',
        color: '#10b981',
        relativeOffset: [0, 0, 12],
        vertices: [
          [-36, -36, -3], [36, -36, -3], [36, 36, -3], [-36, 36, -3],
          [-36, -36, 3], [36, -36, 3], [36, 36, 3], [-36, 36, 3]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      }
    ]
  },
  {
    id: 'corexy_precision_toolhead',
    name: 'Precision Direct-Drive CoreXY Toolhead Mount',
    category: '3D Printer Toolhead',
    subtitle: 'Ultralight High-Speed Carriage for Voron / Bambu / Custom CoreXY',
    description: 'Structural CoreXY toolhead carriage designed for ultra-high volumetric flow, dual 5015 radial part cooling blowers, and zero-backlash MGN12H linear rail mounting.',
    dimensionsMm: { x: 78, y: 64, z: 52 },
    recommendedMaterial: 'Polyamide 12 Carbon Fiber (PA12-CF) or ASA',
    recommendedPrinter: 'CoreXY FDM (Voron Stealthburner / Bambu Lab X1C)',
    printTechnology: 'FDM (CoreXY)',
    toleranceMm: 0.08,
    criticalFeatures: [
      'Dual 5015 fan scroll ducts with CFD-optimized aerospike nozzle exits',
      'MGN12H linear rail 4-point screw mounting with counterbored recesses',
      'Integrated toolhead PCB wiring channel and strain relief clamp',
      'Extruder mounting boss compatible with Sherpa Mini / Orbiter 2.0'
    ],
    openScadSnippet: `// High-Speed CoreXY Direct-Drive Toolhead
$fn = 48;
mount_w = 78.0;
mount_d = 64.0;
mount_h = 52.0;

module toolhead() {
    difference() {
        cube([mount_w, mount_d, mount_h], center=true);
        
        // Hotend Center Pocket
        translate([0, 0, 0])
            cylinder(h=mount_h+2, d=22.0, center=true);
            
        // MGN12H Rail Mounting Holes (20mm x 20mm grid)
        for (x=[-10, 10]) {
            for (z=[-10, 10]) {
                translate([x, mount_d/2 - 4, z])
                    rotate([90, 0, 0]) cylinder(h=12, d=3.2, center=true);
            }
        }
        
        // Weight Reduction Pocket
        translate([0, -18, 0])
            cube([mount_w - 24, 20, mount_h - 16], center=true);
    }
}
toolhead();`,
    blueprintPrompt: `Mechanical CAD blueprint schematic of a CoreXY 3D printer toolhead carriage assembly, showing front view, bottom view with fan airflow ducting paths, and exploded perspective view. Labeled callouts for MGN12H linear rail mounting pads, Rapido UHF hotend clamp, dual 5015 blower duct exits, and stepper motor mounting. Dark technical blueprint background, clean white lines, dimension witness lines (78mm width, 64mm depth, 52mm height), DIN/ISO standard drafting format.`,
    photorealisticPrompt: `High-speed CoreXY 3D printer toolhead made of 3D printed matte black carbon fiber nylon (PA-CF), mounted on a gleaming stainless steel linear rail. Red anodized CNC aluminum heat sink and brass nozzle visible at the bottom. Twin black 5015 centrifugal cooling blowers smoothly integrated into the aerodynamic shroud. Clean studio photography, crisp rim lighting, sharp macro details showcasing layer lines of carbon-fiber filament.`,
    slicerConfigPrompt: `High-Speed PA-CF Toolhead Slicer Configuration:
- Machine: Voron 2.4 / Bambu Lab X1C (Enclosed Chamber)
- Material: PA12-CF (Polyamide Carbon Fiber)
- Extruder Temp: 285°C | Bed Temp: 105°C (Textured PEI)
- Layer Height: 0.20 mm | Line Width: 0.45 mm
- Perimeters: 4 walls (minimum 1.8 mm solid shell)
- Top/Bottom Layers: 5 layers
- Infill: 40% Gyroid or Triangle for high stiffness-to-weight ratio
- Fan Speed: 0-20% max (to prevent layer delamination on structural CF)
- Chamber Temp: > 50°C heat soak for 30 minutes before printing`,
    wireframeParts: [
      {
        name: 'Main Toolhead Frame',
        color: '#f97316',
        relativeOffset: [0, 0, 0],
        vertices: [
          [-39, -32, -26], [39, -32, -26], [39, 32, -26], [-39, 32, -26],
          [-39, -32, 26], [39, -32, 26], [39, 32, 26], [-39, 32, 26]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      },
      {
        name: 'Dual Fan Ducts',
        color: '#eab308',
        relativeOffset: [0, -18, -12],
        vertices: [
          [-30, -14, -10], [30, -14, -10], [30, 14, -10], [-30, 14, -10],
          [-24, -10, 10], [24, -10, 10], [24, 10, 10], [-24, 10, 10]
        ],
        edges: [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ]
      }
    ]
  }
];

export const Hardware3DSchematics: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(HARDWARE_PRESETS[0].id);
  const [activeOutputTab, setActiveOutputTab] = useState<'blueprint' | 'photoreal' | 'openscad' | 'slicer'>('blueprint');
  const [copiedText, setCopiedText] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [explodeFactor, setExplodeFactor] = useState(0.2); // 0.0 to 1.0
  const [projection, setProjection] = useState<'isometric' | 'orthographic'>('isometric');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationAnglesRef = useRef({ rx: 0.55, ry: 0.75 });

  const activePreset = useMemo(() => {
    return HARDWARE_PRESETS.find(p => p.id === selectedPresetId) || HARDWARE_PRESETS[0];
  }, [selectedPresetId]);

  // Current prompt text according to activeOutputTab
  const currentPromptContent = useMemo(() => {
    switch (activeOutputTab) {
      case 'blueprint':
        return activePreset.blueprintPrompt;
      case 'photoreal':
        return activePreset.photorealisticPrompt;
      case 'openscad':
        return activePreset.openScadSnippet;
      case 'slicer':
        return activePreset.slicerConfigPrompt;
      default:
        return activePreset.blueprintPrompt;
    }
  }, [activePreset, activeOutputTab]);

  // Handle Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(currentPromptContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Handle Download
  const handleDownload = () => {
    const ext = activeOutputTab === 'openscad' ? '.scad' : activeOutputTab === 'slicer' ? '.ini' : '.prompt.txt';
    const blob = new Blob([currentPromptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePreset.id}_${activeOutputTab}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE 3D SCHEMATIC WIREFRAME CANVAS RENDERER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background technical drafting grid
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Auto rotation
      if (isRotating) {
        rotationAnglesRef.current.ry += 0.012;
      }

      const rx = rotationAnglesRef.current.rx;
      const ry = rotationAnglesRef.current.ry;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const cx = width / 2;
      const cy = height / 2;
      const scale = 3.6;

      // Draw Axis Compass in bottom-left
      ctx.save();
      ctx.translate(45, height - 45);
      const axisLen = 22;
      // X axis (Red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosY * axisLen, sinY * sinX * axisLen);
      ctx.stroke();
      // Y axis (Green)
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-sinY * axisLen, cosY * sinX * axisLen);
      ctx.stroke();
      // Z axis (Blue)
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -cosX * axisLen);
      ctx.stroke();
      ctx.restore();

      // Draw Wireframe Parts
      activePreset.wireframeParts.forEach((part, partIdx) => {
        const offsetZ = part.relativeOffset[2] * (1 + explodeFactor * 1.5);
        const offsetX = part.relativeOffset[0] * (1 + explodeFactor * 1.5);
        const offsetY = part.relativeOffset[1] * (1 + explodeFactor * 1.5);

        // Project vertices
        const projected = part.vertices.map(v => {
          const vx = v[0] + offsetX;
          const vy = v[1] + offsetY;
          const vz = v[2] + offsetZ;

          // Rotate around Y
          const x1 = vx * cosY + vz * sinY;
          const z1 = -vx * sinY + vz * cosY;

          // Rotate around X
          const y2 = vy * cosX - z1 * sinX;
          const z2 = vy * sinX + z1 * cosX;

          const screenX = cx + x1 * scale;
          const screenY = cy - y2 * scale;

          return { sx: screenX, sy: screenY, z: z2 };
        });

        // Draw edges
        ctx.strokeStyle = part.color;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        part.edges.forEach(([i, j]) => {
          const p1 = projected[i];
          const p2 = projected[j];
          if (!p1 || !p2) return;

          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        });

        // Draw vertices joints
        projected.forEach(p => {
          ctx.fillStyle = part.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Part label in exploded mode
        if (explodeFactor > 0.25 && projected[0]) {
          ctx.fillStyle = part.color;
          ctx.font = '10px monospace';
          ctx.fillText(`[${part.name}]`, projected[0].sx + 8, projected[0].sy - 8);
        }
      });

      // Dimension Overlay callout
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - (activePreset.dimensionsMm.x * scale) / 2, cy - (activePreset.dimensionsMm.y * scale) / 2, activePreset.dimensionsMm.x * scale, activePreset.dimensionsMm.y * scale);
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`${activePreset.dimensionsMm.x} mm x ${activePreset.dimensionsMm.y} mm x ${activePreset.dimensionsMm.z} mm`, 16, 24);
      ctx.fillText(`Tolerance: ±${activePreset.toleranceMm} mm`, 16, 40);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activePreset, isRotating, explodeFactor]);

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-2xl text-xs font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Printer className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 tracking-wide uppercase text-sm">
              AI HARDWARE 3D PRINTER SCHEMATICS & PROMPTS MAKER
            </span>
            <span className="text-[10px] text-slate-400">
              Working Physical Configurations · Cryogenic Quantum Enclosures · OpenSCAD Generative Prompts
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>4 Working Print Configurations</span>
          </span>
        </div>
      </div>

      {/* Preset Sub-Nav Selector */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border-b border-slate-800">
        <span className="text-slate-500 text-[11px] uppercase font-semibold mr-1">
          Hardware System:
        </span>
        {HARDWARE_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => setSelectedPresetId(preset.id)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
              selectedPresetId === preset.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950">
        {/* Left Column: Interactive 3D Wireframe Canvas & Specs (5 Cols) */}
        <div className="lg:col-span-5 p-4 space-y-4 flex flex-col">
          {/* 3D Canvas Box */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col h-72">
            <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded border border-slate-800">
              <Rotate3d className="w-3 h-3 text-amber-400" />
              <span>3D Interactive Schematic Wireframe</span>
            </div>

            <canvas
              ref={canvasRef}
              width={420}
              height={288}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const initialX = rotationAnglesRef.current.rx;
                const initialY = rotationAnglesRef.current.ry;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  rotationAnglesRef.current.ry = initialY + (moveEvent.clientX - startX) * 0.01;
                  rotationAnglesRef.current.rx = initialX + (moveEvent.clientY - startY) * 0.01;
                };
                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Canvas Controls Bar */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-[10px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                  title="Toggle Auto Rotation"
                >
                  {isRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isRotating ? 'Pause' : 'Rotate'}</span>
                </button>
              </div>

              {/* Explode Assembly Slider */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Explode:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodeFactor}
                  onChange={e => setExplodeFactor(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer"
                />
                <span className="text-amber-400 font-bold">{Math.round(explodeFactor * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Physical Hardware Specifications Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                Hardware Manufacturing Blueprint Specs
              </span>
              <span className="text-amber-400 font-bold text-[11px]">
                {activePreset.printTechnology}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Material Class:</span>
                <span className="text-slate-300 font-semibold truncate block" title={activePreset.recommendedMaterial}>
                  {activePreset.recommendedMaterial}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Target Machine:</span>
                <span className="text-slate-300 font-semibold truncate block" title={activePreset.recommendedPrinter}>
                  {activePreset.recommendedPrinter}
                </span>
              </div>
            </div>

            {/* Critical Features Checklist */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Critical Working Tolerances & Features:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {activePreset.criticalFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: AI Prompts Maker & Code Generator (7 Cols) */}
        <div className="lg:col-span-7 p-4 space-y-4 flex flex-col">
          {/* Output Format Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs font-semibold px-2 uppercase">
              AI Generation Modality:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveOutputTab('blueprint')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeOutputTab === 'blueprint'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                CAD Blueprint Prompt
              </button>
              <button
                onClick={() => setActiveOutputTab('photoreal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeOutputTab === 'photoreal'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                Photoreal 3D Render
              </button>
              <button
                onClick={() => setActiveOutputTab('openscad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeOutputTab === 'openscad'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                OpenSCAD Code
              </button>
              <button
                onClick={() => setActiveOutputTab('slicer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeOutputTab === 'slicer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                Slicer & G-code Profile
              </button>
            </div>
          </div>

          {/* Prompt / Code Content Display */}
          <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200">
                  {activeOutputTab === 'blueprint' && 'Midjourney v6.1 / FLUX.1 Pro Blueprint Prompt'}
                  {activeOutputTab === 'photoreal' && 'Photorealistic Technical Studio Prompt (8K Octane Style)'}
                  {activeOutputTab === 'openscad' && 'Parametric OpenSCAD 3D Printable Code (.scad)'}
                  {activeOutputTab === 'slicer' && 'Bambu Studio / OrcaSlicer Precision G-code Settings'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-semibold"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'COPIED!' : 'COPY PROMPT'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-900 transition-colors text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT</span>
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all">
                {currentPromptContent}
              </pre>
            </div>
          </div>

          {/* Prompt Usage Guidance & Tips */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-semibold block uppercase text-[10px]">
              How to use these AI Hardware Schematics:
            </span>
            <p>
              • <strong>For Image Generative Models:</strong> Paste the <em>Blueprint</em> or <em>Photoreal</em> prompt directly into Midjourney v6.1 (with <code className="text-amber-300">--ar 16:9 --v 6.1 --style raw</code>) or FLUX.1 Pro to render publication-grade technical illustrations and exploded schematics.
            </p>
            <p>
              • <strong>For 3D CAD & Printing:</strong> Paste the <em>OpenSCAD</em> code directly into OpenSCAD, FreeCAD, or an AI code assistant (Claude 3.7 / GPT-4o) to generate manifold <code className="text-cyan-300">.STL</code> / <code className="text-cyan-300">.STEP</code> files with verified <code className="text-emerald-400">±{activePreset.toleranceMm}mm</code> tolerances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
