/**
 * The shapes of the food scenes, built in code: crumpled corn flakes, a two-tone Hooch bowl, a tall glass, banana slices
 * and strawberries. One unit is about the bowl's radius (a 15 cm bowl, so a flake is about 2.5 to 3 cm across).
 */
import * as THREE from "three";
import { rng } from "./rng";

/**
 * One crumpled flake: a square grid mapped onto a disc with a wobbly, irregular edge, then curled and buckled.
 * Vertex colours darken the rim, like a toasted edge.
 */
export function flakeGeometry(seed: number): THREE.BufferGeometry {
  const r = rng(seed);
  const g = new THREE.PlaneGeometry(1, 1, 14, 14);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
  const aspect = 0.72 + r() * 0.25;
  const k1 = 0.22 + r() * 0.4, k2 = -0.12 + r() * 0.34;
  for (let i = 0; i < pos.count; i++) {
    // Concentric square to disc mapping (keeps the grid even).
    const a = pos.getX(i) * 2, b = pos.getY(i) * 2;
    let rad = 0, th = 0;
    if (a === 0 && b === 0) { rad = 0; th = 0; }
    else if (Math.abs(a) > Math.abs(b)) { rad = a; th = (Math.PI / 4) * (b / a); }
    else { rad = b; th = Math.PI / 2 - (Math.PI / 4) * (a / b); }
    const edge = 1 + 0.12 * Math.sin(3 * th + ph[0]) + 0.06 * Math.sin(5 * th + ph[1]) + 0.025 * Math.sin(9 * th + ph[2]) + 0.012 * Math.sin(14 * th + ph[3]);
    const x = rad * edge * Math.cos(th);
    const y = rad * edge * Math.sin(th) * aspect;
    const z = k1 * x * x + k2 * y * y + 0.035 * Math.sin(4 * x + ph[0]) * Math.cos(3.5 * y + ph[1]) + 0.012 * Math.sin(11 * x * y + ph[2]);
    pos.setXYZ(i, x * 0.17, y * 0.17, z * 0.17);
    const toast = 1 - 0.2 * Math.pow(Math.min(1, Math.abs(rad)), 3);
    colors[i * 3] = toast; colors[i * 3 + 1] = toast * 0.97; colors[i * 3 + 2] = toast * 0.93;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** The inside of the bowl as (radius, height) pairs, bottom to rim. */
export const BOWL_INNER: [number, number][] = [
  [0, -0.4], [0.3, -0.395], [0.55, -0.36], [0.74, -0.27], [0.88, -0.13], [0.97, 0.04], [1.02, 0.2], [1.04, 0.27],
];
/** The outside, rim to foot. */
const BOWL_OUTER: [number, number][] = [
  [1.04, 0.27], [1.075, 0.29], [1.1, 0.27], [1.09, 0.16], [1.03, -0.04], [0.92, -0.24], [0.76, -0.4], [0.58, -0.5],
  [0.52, -0.52], [0.53, -0.6], [0.5, -0.62], [0, -0.62],
];

/** The bowl's inner radius at a height (for the milk surface and where flakes rest). */
export function bowlRadiusAt(y: number): number {
  for (let i = 1; i < BOWL_INNER.length; i++) {
    const [r0, y0] = BOWL_INNER[i - 1], [r1, y1] = BOWL_INNER[i];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0 || 1)) * (r1 - r0);
  }
  return BOWL_INNER[BOWL_INNER.length - 1][0];
}

/** The inner floor height at a radius. */
export function bowlFloorAt(rad: number): number {
  for (let i = 1; i < BOWL_INNER.length; i++) {
    const [r0, y0] = BOWL_INNER[i - 1], [r1, y1] = BOWL_INNER[i];
    if (rad <= r1) return y0 + ((rad - r0) / (r1 - r0 || 1)) * (y1 - y0);
  }
  return BOWL_INNER[BOWL_INNER.length - 1][1];
}

const lathe = (pts: [number, number][], segments = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);

export function bowlGeometries() {
  // LatheGeometry works out smooth normals itself, seam included (recomputing them would show the seam).
  const inner = lathe([...BOWL_INNER].reverse().map(([x, y]) => [x, y] as [number, number]));
  const outer = lathe(BOWL_OUTER);
  return { inner, outer };
}

/** A tall, slightly flared glass, open at the top: radius 0.62 at the base to 0.72 at the rim, 2.1 tall. */
export const GLASS = { bottom: -1.05, top: 1.05, rBottom: 0.6, rTop: 0.7 };
export const glassRadiusAt = (y: number) => GLASS.rBottom + ((y - GLASS.bottom) / (GLASS.top - GLASS.bottom)) * (GLASS.rTop - GLASS.rBottom);

export function glassGeometry() {
  const t = 0.035;
  const pts: [number, number][] = [
    [0, GLASS.bottom - 0.12], [GLASS.rBottom + t, GLASS.bottom - 0.12], [GLASS.rBottom + t, GLASS.bottom - 0.02], [GLASS.rTop + t, GLASS.top],
    [GLASS.rTop + t * 0.4, GLASS.top + 0.02], [GLASS.rTop, GLASS.top], [GLASS.rBottom, GLASS.bottom + 0.02], [0, GLASS.bottom + 0.02],
  ];
  return lathe(pts, 96);
}

/** A banana slice: a short, slightly soft-edged disc. Group 0 is the peel side, 1 and 2 the cut faces. */
export function bananaGeometry() {
  const g = new THREE.CylinderGeometry(0.15, 0.15, 0.055, 40, 1);
  return g;
}

/** A whole strawberry: a rounded cone, wide at the shoulders, with a soft point. Leaves sit on top (y = 0.13). */
export function strawberryGeometry() {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    // From the tip (t=0) to the top (t=1).
    const y = -0.14 + t * 0.28;
    const rad = 0.13 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62) * (1 - 0.18 * Math.pow(t, 6));
    pts.push([Math.max(0.0001, rad * (t > 0.96 ? 0.85 : 1)), y]);
  }
  pts.push([0, 0.14]);
  return lathe(pts, 40);
}

/** The green calyx: a flat six-pointed star, gently cupped. */
export function leavesGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rad = i % 2 === 0 ? 0.11 : 0.035;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, pos.getY(i) - 0.9 * (x * x + z * z) * 0.9);
  }
  g.computeVertexNormals();
  return g;
}
