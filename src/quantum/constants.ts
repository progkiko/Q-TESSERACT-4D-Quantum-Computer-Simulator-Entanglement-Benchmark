/**
 * Quantum Simulation Constants & Infinity Interception Anchor Invariants
 */

export const INFINITY_ANCHOR_RAW = "1020103010401050106010701080";
export const INFINITY_ANCHOR_BIGINT = BigInt("1020103010401050106010701080");

// Convert to 4D binary projection representation
export const INFINITY_ANCHOR_BINARY = INFINITY_ANCHOR_BIGINT.toString(2);

// Hex representation for stabilizer syndrome checking
export const INFINITY_ANCHOR_HEX = INFINITY_ANCHOR_BIGINT.toString(16).toUpperCase();

// 16 vertices of the 4D Tesseract [x, y, z, w] where x,y,z,w in {0, 1}
export const TESSERACT_VERTICES: { id: number; x: number; y: number; z: number; w: number; label: string }[] = [
  { id: 0,  x: 0, y: 0, z: 0, w: 0, label: "Q0000" },
  { id: 1,  x: 1, y: 0, z: 0, w: 0, label: "Q1000" },
  { id: 2,  x: 0, y: 1, z: 0, w: 0, label: "Q0100" },
  { id: 3,  x: 1, y: 1, z: 0, w: 0, label: "Q1100" },
  { id: 4,  x: 0, y: 0, z: 1, w: 0, label: "Q0010" },
  { id: 5,  x: 1, y: 0, z: 1, w: 0, label: "Q1010" },
  { id: 6,  x: 0, y: 1, z: 1, w: 0, label: "Q0110" },
  { id: 7,  x: 1, y: 1, z: 1, w: 0, label: "Q1110" },
  { id: 8,  x: 0, y: 0, z: 0, w: 1, label: "Q0001" },
  { id: 9,  x: 1, y: 0, z: 0, w: 1, label: "Q1001" },
  { id: 10, x: 0, y: 1, z: 0, w: 1, label: "Q0101" },
  { id: 11, x: 1, y: 1, z: 0, w: 1, label: "Q1101" },
  { id: 12, x: 0, y: 0, z: 1, w: 1, label: "Q0011" },
  { id: 13, x: 1, y: 0, z: 1, w: 1, label: "Q1011" },
  { id: 14, x: 0, y: 1, z: 1, w: 1, label: "Q0111" },
  { id: 15, x: 1, y: 1, z: 1, w: 1, label: "Q1111" },
];

// 32 edges of the 4D Tesseract (pairs differing by 1 bit in 4D coordinate)
export const TESSERACT_EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let bit = 0; bit < 4; bit++) {
    const neighbor = i ^ (1 << bit);
    if (i < neighbor) {
      TESSERACT_EDGES.push([i, neighbor]);
    }
  }
}

// 4D Euclidean metric distance between two vertices
export function calc4DDistance(a: { x: number; y: number; z: number; w: number }, b: { x: number; y: number; z: number; w: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const dw = a.w - b.w;
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
