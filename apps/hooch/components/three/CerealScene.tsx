"use client";

/**
 * The interactive 3D cereal scenes (three.js through @react-three/fiber), loaded only when a FoodStage asks for them.
 *
 * What happens: golden flakes tumble into a Hooch red bowl (or a tall yoghurt glass), land with a little bounce, set off
 * ripples and droplets in glossy milk, then fruit drops on top. Frosted flakes glint with sugar sparkles. The bowl turns
 * slowly, follows the pointer a little and turns as the page scrolls. Tapping the food makes the flakes nearby jump with
 * a burst of crumbs ("crunch"). Warm studio light from an in-code environment (no HDR download), soft shadows.
 * Everything is seeded, so a scene always settles the same way (the posters are screenshots of the settled scenes).
 */
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  bananaGeometry, bowlFloorAt, bowlGeometries, bowlRadiusAt, flakeGeometry, GLASS, glassGeometry, glassRadiusAt, leavesGeometry,
  strawberryGeometry,
} from "./geometry";
import { rng } from "./rng";
import type { SceneConfig, Topping } from "./scene-config";
import { bananaFace, flakeBump, flakeMap, strawberrySkin } from "./textures";

export type SceneProps = {
  config: SceneConfig;
  running: boolean;
  /** Called once the first frame is drawn (the stage then fades the canvas in over the poster). */
  onReady?: () => void;
  /** Called when everything has landed (used for the poster screenshots). */
  onSettled?: () => void;
  /** Called on a tap that hit the food, with the point in the canvas (for the "Crunch!" burst). */
  onCrunch?: (x: number, y: number) => void;
  /** Turns slowly and follows the pointer and the scroll. Off for the poster renders. */
  idle?: boolean;
  /** Start with everything already landed (the poster renders: software rendering is too slow to watch it fall). */
  still?: boolean;
};

const GRAVITY = 9.5;
const VARIANTS = 6;
const UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const easeOutBack = (t: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/** One thing that falls in: where it ends, where it starts, when, and its "pop" state after a tap. */
type Item = {
  target: THREE.Vector3;
  targetQ: THREE.Quaternion;
  start: THREE.Vector3;
  startQ: THREE.Quaternion;
  delay: number;
  fall: number;
  scale: number;
  landed: boolean;
  splash: boolean;
  off: THREE.Vector3;
  vel: THREE.Vector3;
  spin: number;
  spinAxis: THREE.Vector3;
  spinAngle: number;
};

function makeItem(target: THREE.Vector3, targetQ: THREE.Quaternion, delay: number, r: () => number, pour: boolean, scale = 1, splash = false): Item {
  const start = pour
    ? new THREE.Vector3(-0.35 + (r() - 0.5) * 0.25, 3.4 + r() * 0.6, 0.15 + (r() - 0.5) * 0.25)
    : new THREE.Vector3(target.x + (r() - 0.5) * 0.5, target.y + 2.2 + r() * 1.2, target.z + (r() - 0.5) * 0.5);
  const startQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
  const fall = Math.sqrt((2 * Math.max(0.3, start.y - target.y)) / GRAVITY);
  return {
    target, targetQ, start, startQ, delay, fall, scale, landed: false, splash,
    off: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0, spinAxis: new THREE.Vector3(0, 0, 1), spinAngle: 0,
  };
}

/** A flake lying roughly flat, turned and tilted at random. */
function flakeQ(r: () => number, tilt = 0.5) {
  const base = new THREE.Quaternion().setFromAxisAngle(X_AXIS, -Math.PI / 2);
  const t = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * tilt * 2, 0, (r() - 0.5) * tilt * 2));
  const y = new THREE.Quaternion().setFromAxisAngle(UP, r() * Math.PI * 2);
  return y.multiply(t).multiply(base);
}

type Layout = { flakes: Item[]; toppings: { kind: Topping; item: Item }[]; milkY: number | null; heapTop: number; settleAt: number };

/** Where every flake and every piece of fruit ends up, and when it falls. */
function layout(config: SceneConfig): Layout {
  const r = rng(config.flake === "frosted" ? 202 : 101);
  const pour = !!config.pour;
  const flakes: Item[] = [];
  const toppings: { kind: Topping; item: Item }[] = [];
  const spread = pour ? 2.4 : 1.1;
  let heapTop = 0.3;
  let milkY: number | null = null;

  if (config.vessel === "bowl") {
    const n = config.small ? 90 : pour ? 175 : 140;
    const heapH = config.small ? 0.2 : 0.3;
    if (config.milk) {
      milkY = 0.04;
      const rm = bowlRadiusAt(milkY) * 0.74;
      heapTop = milkY + heapH + 0.04;
      for (let i = 0; i < n; i++) {
        const rr = Math.sqrt(r()) * rm;
        const th = r() * Math.PI * 2;
        const mound = heapH * Math.pow(Math.max(0, 1 - (rr / (rm * 1.02)) ** 2), 0.8);
        const y = milkY + 0.015 + mound * (0.3 + 0.7 * Math.pow(r(), 0.6));
        flakes.push(makeItem(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), flakeQ(r), (i / n) * spread + r() * 0.12, r, pour, 0.9 + r() * 0.25, i % 5 === 0));
      }
    } else {
      const top = (rr: number) => (config.small ? 0.06 : 0.18) + heapH * Math.max(0, 1 - (rr / 0.95) ** 2);
      heapTop = top(0) + 0.03;
      let tries = 0;
      while (flakes.length < n && tries++ < 5000) {
        const rr = Math.sqrt(r()) * 0.95;
        const floor = bowlFloorAt(rr) + 0.04;
        const t = top(rr);
        if (t <= floor) continue;
        const y = floor + (t - floor) * Math.pow(r(), 0.45);
        if (rr > bowlRadiusAt(y) - 0.09) continue;
        const th = r() * Math.PI * 2;
        flakes.push(makeItem(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), flakeQ(r, 1.1), (flakes.length / n) * spread + r() * 0.12, r, pour, 0.9 + r() * 0.25));
      }
    }
    const surface = (rr: number) => {
      if (milkY !== null) {
        const rm = bowlRadiusAt(milkY) * 0.74;
        return milkY + 0.04 + heapH * Math.pow(Math.max(0, 1 - (rr / (rm * 1.02)) ** 2), 0.8);
      }
      return (config.small ? 0.06 : 0.18) + heapH * Math.max(0, 1 - (rr / 0.95) ** 2) + 0.02;
    };
    // Fruit on top, after the flakes.
    let t0 = spread + 0.35;
    const place = (kind: Topping, count: number, ring: number, phase: number) => {
      for (let i = 0; i < count; i++) {
        const th = phase + (i / count) * Math.PI * 2 * (count > 3 ? 0.9 : 0.7) + (r() - 0.5) * 0.3;
        const rr = ring + (r() - 0.5) * 0.12;
        const y = surface(rr);
        const slope = Math.atan(0.9 * rr) * 0.8;
        let q: THREE.Quaternion;
        if (kind === "banana") {
          // A slice lies on the heap, tilted with its slope (cut face up).
          q = new THREE.Quaternion().setFromAxisAngle(UP, -th).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, slope + (r() - 0.5) * 0.3)));
        } else {
          // A strawberry on its side, point outwards.
          q = new THREE.Quaternion().setFromAxisAngle(UP, -th).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + 0.25 + slope)));
        }
        toppings.push({ kind, item: makeItem(new THREE.Vector3(Math.cos(th) * rr, y + (kind === "banana" ? 0.02 : 0.08), Math.sin(th) * rr), q, t0, r, false, kind === "strawberry" ? 1.05 : 1) });
        t0 += 0.14;
      }
    };
    for (const kind of config.toppings) {
      const first = config.toppings[0] === kind;
      if (kind === "banana") place("banana", config.small ? 4 : first ? 7 : 4, first ? 0.32 : 0.55, first ? 0.2 : 2.4);
      if (kind === "strawberry") place("strawberry", config.small ? 3 : first ? 5 : 3, first ? 0.4 : 0.18, first ? 0.6 : 3.6);
    }
    heapTop = Math.max(heapTop, surface(0));
    return { flakes, toppings, milkY, heapTop, settleAt: t0 + 1.2 };
  }

  // The glass: yoghurt, a ring of strawberries, a band of flakes, yoghurt again, then a crown of flakes and fruit.
  const band = (y0: number, y1: number, count: number, delay0: number) => {
    for (let i = 0; i < count; i++) {
      const y = y0 + r() * (y1 - y0);
      const rr = Math.sqrt(r()) * (glassRadiusAt(y) - 0.09);
      const th = r() * Math.PI * 2;
      flakes.push(makeItem(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), flakeQ(r, 1.3), delay0 + (i / count) * 0.9, r, false, 0.85 + r() * 0.2));
    }
  };
  band(-0.12, 0.28, 70, 0.4);
  const crownBase = 0.62;
  for (let i = 0; i < 46; i++) {
    const rr = Math.sqrt(r()) * 0.58;
    const y = crownBase + 0.2 * Math.max(0, 1 - (rr / 0.6) ** 2) * (0.3 + 0.7 * r());
    const th = r() * Math.PI * 2;
    flakes.push(makeItem(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), flakeQ(r), 1.4 + (i / 46) * 0.8, r, false, 0.9 + r() * 0.2));
  }
  let t0 = 0.1;
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    const rr = glassRadiusAt(-0.24) - 0.17;
    const q = new THREE.Quaternion().setFromAxisAngle(UP, -th).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 - 0.1)));
    toppings.push({ kind: "strawberry", item: makeItem(new THREE.Vector3(Math.cos(th) * rr, -0.24, Math.sin(th) * rr), q, t0, r, false, 1.05) });
    t0 += 0.05;
  }
  t0 = 2.4;
  for (let i = 0; i < 3; i++) {
    const th = 0.7 + i * 2.1;
    const q = new THREE.Quaternion().setFromAxisAngle(UP, -th).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + 0.5)));
    toppings.push({ kind: "strawberry", item: makeItem(new THREE.Vector3(Math.cos(th) * 0.24, crownBase + 0.2, Math.sin(th) * 0.24), q, t0, r, false, 1.1) });
    t0 += 0.18;
  }
  heapTop = crownBase + 0.25;
  return { flakes, toppings, milkY: null, heapTop, settleAt: t0 + 1.2 };
}

/** Writes one item's matrix for the time since the scene started; returns true once it has landed. */
const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpM = new THREE.Matrix4();
function itemMatrix(it: Item, t: number, out: THREE.Matrix4, extraScale = 1) {
  const local = t - it.delay;
  if (local <= 0) {
    out.makeScale(0, 0, 0);
    return false;
  }
  let landed = false;
  if (local < it.fall) {
    const p = local / it.fall;
    tmpP.lerpVectors(it.start, it.target, p);
    tmpP.y = it.start.y - 0.5 * GRAVITY * local * local;
    tmpQ.slerpQuaternions(it.startQ, it.targetQ, Math.min(1, p * 1.15));
  } else {
    const after = local - it.fall;
    landed = true;
    tmpP.copy(it.target);
    tmpP.y += 0.045 * Math.exp(-7 * after) * Math.abs(Math.sin(after * 17));
    tmpQ.slerpQuaternions(it.startQ, it.targetQ, Math.min(1, easeOutBack(Math.min(1, 0.87 + after * 2))));
  }
  tmpP.add(it.off);
  if (it.spinAngle !== 0) {
    tmpQ2.setFromAxisAngle(it.spinAxis, it.spinAngle);
    tmpQ.premultiply(tmpQ2);
  }
  const s = it.scale * extraScale;
  tmpS.set(s, s, s);
  out.compose(tmpP, tmpQ, tmpS);
  return landed;
}

/** The pop after a tap: a little hop with spin, then gravity brings it back to rest. */
function stepPop(it: Item, dt: number) {
  if (it.vel.lengthSq() === 0 && it.off.lengthSq() === 0 && it.spin === 0 && it.spinAngle === 0) return;
  it.vel.y -= GRAVITY * dt;
  it.off.addScaledVector(it.vel, dt);
  it.spinAngle += it.spin * dt;
  if (it.off.y <= 0 && it.vel.y < 0) {
    it.off.y = 0;
    it.vel.set(0, 0, 0);
    it.spin = 0;
  }
  // Ease back over the target and unwind the spin once resting.
  if (it.vel.lengthSq() === 0) {
    it.off.x *= 0.82; it.off.z *= 0.82;
    it.spinAngle *= 0.8;
    if (Math.abs(it.off.x) + Math.abs(it.off.z) < 1e-3) { it.off.x = 0; it.off.z = 0; }
    if (Math.abs(it.spinAngle) < 1e-3) it.spinAngle = 0;
  } else {
    it.off.x *= 0.995; it.off.z *= 0.995;
  }
}

const MAX_RIPPLES = 10;
const LEAF_OFFSET = new THREE.Matrix4().makeTranslation(0, 0.135, 0);
const LEAF_M = new THREE.Matrix4();
const DROPS = 54;
const CRUMBS = 36;

function Food({ config, onReady, onSettled, onCrunch, idle = true, still = false }: Omit<SceneProps, "running">) {
  const plan = useMemo(() => layout(config), [config]);
  const frosted = config.flake === "frosted";
  const root = useRef<THREE.Group>(null);
  const flakeMeshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const bananaMesh = useRef<THREE.InstancedMesh>(null);
  const berryMesh = useRef<THREE.InstancedMesh>(null);
  const leafMesh = useRef<THREE.InstancedMesh>(null);
  const milk = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.InstancedMesh>(null);
  const crumbs = useRef<THREE.InstancedMesh>(null);
  const clock = useRef({ t: still ? plan.settleAt + 1 : 0, ready: false, settled: false, frames: 0 });
  const ripples = useRef<{ x: number; z: number; t: number }[]>([]);
  const dropState = useRef(Array.from({ length: DROPS }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), alive: false })));
  const crumbState = useRef(Array.from({ length: CRUMBS }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), life: 0 })));
  const pointer = useRef({ x: 0, y: 0 });
  const { size, invalidate } = useThree();

  // Geometry and materials, built once per scene and freed when it unmounts.
  const assets = useMemo(() => {
    const flakeGeos = Array.from({ length: VARIANTS }, (_, i) => flakeGeometry(31 + i * 17 + (frosted ? 400 : 0)));
    const flakeMat = new THREE.MeshPhysicalMaterial({
      map: flakeMap(frosted), bumpMap: flakeBump(), bumpScale: frosted ? 0.5 : 0.8, vertexColors: true, side: THREE.DoubleSide,
      roughness: frosted ? 0.4 : 0.5, clearcoat: frosted ? 0.85 : 0.3, clearcoatRoughness: frosted ? 0.25 : 0.5,
      sheen: frosted ? 0.6 : 0.25, sheenColor: new THREE.Color(frosted ? "#fff6e0" : "#ffd27a"), sheenRoughness: 0.5,
    });
    // Thin, two-sided flakes: cast shadows from their front faces only, which avoids dark self-shadow streaks.
    flakeMat.shadowSide = THREE.FrontSide;
    // A warm glow from within, so the undersides of the flakes read as toasted gold, not dark brown.
    flakeMat.emissive = new THREE.Color(frosted ? "#8a5a1c" : "#8a4b0c");
    flakeMat.emissiveIntensity = 0.32;
    const crumbGeo = flakeGeometry(999);
    crumbGeo.scale(0.32, 0.32, 0.32);
    const bowl = bowlGeometries();
    const bowlIn = new THREE.MeshPhysicalMaterial({ color: "#fffaf1", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
    const bowlOut = new THREE.MeshPhysicalMaterial({ color: "#d81e26", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
    const milkGeo = new THREE.RingGeometry(0, bowlRadiusAt(0.04) - 0.005, 80, 22);
    milkGeo.rotateX(-Math.PI / 2);
    const milkMat = new THREE.MeshPhysicalMaterial({
      color: "#fffaf0", roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color("#ffffff"),
    });
    const dropGeo = new THREE.SphereGeometry(0.022, 10, 8);
    const banana = bananaGeometry();
    const face = new THREE.MeshPhysicalMaterial({ map: bananaFace(), roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: new THREE.Color("#fff3c4") });
    const peelSide = new THREE.MeshPhysicalMaterial({ color: "#ecd27a", roughness: 0.55 });
    const berry = strawberryGeometry();
    const berryMat = new THREE.MeshPhysicalMaterial({ map: strawberrySkin(), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
    const leaves = leavesGeometry();
    const leafMat = new THREE.MeshStandardMaterial({ color: "#3e8f2c", roughness: 0.55, side: THREE.DoubleSide });
    const glass = config.vessel === "glass" ? glassGeometry() : null;
    const glassMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.04, transmission: 1, thickness: 0.12, ior: 1.45, clearcoat: 1, transparent: true });
    const yoghurtMat = new THREE.MeshPhysicalMaterial({ color: "#fffdf7", roughness: 0.35, sheen: 0.8, sheenColor: new THREE.Color("#ffffff"), clearcoat: 0.4 });
    const yoghurt = (y0: number, y1: number) => {
      const g = new THREE.CylinderGeometry(glassRadiusAt(y1) - 0.01, glassRadiusAt(y0) - 0.01, y1 - y0, 64, 1);
      g.translate(0, (y0 + y1) / 2, 0);
      return g;
    };
    const yoghurtGeos = config.vessel === "glass" ? [yoghurt(GLASS.bottom + 0.02, -0.34), yoghurt(0.26, 0.64)] : [];
    return { flakeGeos, flakeMat, crumbGeo, bowl, bowlIn, bowlOut, milkGeo, milkMat, dropGeo, banana, face, peelSide, berry, berryMat, leaves, leafMat, glass, glassMat, yoghurtMat, yoghurtGeos };
  }, [config.vessel, frosted]);

  useEffect(() => () => {
    const a = assets;
    [...a.flakeGeos, a.crumbGeo, a.bowl.inner, a.bowl.outer, a.milkGeo, a.dropGeo, a.banana, a.berry, a.leaves, ...a.yoghurtGeos, ...(a.glass ? [a.glass] : [])].forEach((g) => g.dispose());
    [a.flakeMat, a.bowlIn, a.bowlOut, a.milkMat, a.face, a.peelSide, a.berryMat, a.leafMat, a.glassMat, a.yoghurtMat].forEach((m) => m.dispose());
  }, [assets]);

  const byVariant = useMemo(() => {
    const lists: Item[][] = Array.from({ length: VARIANTS }, () => []);
    plan.flakes.forEach((f, i) => lists[i % VARIANTS].push(f));
    return lists;
  }, [plan]);
  const bananas = useMemo(() => plan.toppings.filter((t) => t.kind === "banana").map((t) => t.item), [plan]);
  const berries = useMemo(() => plan.toppings.filter((t) => t.kind === "strawberry").map((t) => t.item), [plan]);

  const allItems = useMemo(() => [...plan.flakes, ...bananas, ...berries], [plan, bananas, berries]);

  const splashAt = (x: number, z: number, strength = 1) => {
    if (plan.milkY === null) return;
    const list = ripples.current;
    list.push({ x, z, t: clock.current.t });
    if (list.length > MAX_RIPPLES) list.shift();
    let made = 0;
    for (const d of dropState.current) {
      if (d.alive) continue;
      const a = Math.random() * Math.PI * 2;
      d.p.set(x, plan.milkY + 0.01, z);
      d.v.set(Math.cos(a) * 0.5 * strength, (1.1 + Math.random() * 0.9) * strength, Math.sin(a) * 0.5 * strength);
      d.alive = true;
      if (++made >= 3) break;
    }
  };

  const crunch = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!root.current) return;
    const p = root.current.worldToLocal(e.point.clone());
    for (const it of allItems) {
      const d = Math.hypot(it.target.x + it.off.x - p.x, it.target.z + it.off.z - p.z);
      if (d > 0.5) continue;
      const k = 1 - d / 0.5;
      it.vel.set((it.target.x - p.x) * 1.6 * k + (Math.random() - 0.5) * 0.4, 1.4 + 2.2 * k * Math.random() + 0.6 * k, (it.target.z - p.z) * 1.6 * k + (Math.random() - 0.5) * 0.4);
      it.spin = (Math.random() - 0.5) * 18 * k;
      it.spinAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    }
    let made = 0;
    for (const c of crumbState.current) {
      if (c.life > 0) continue;
      const a = Math.random() * Math.PI * 2;
      c.p.copy(p);
      c.v.set(Math.cos(a) * (0.6 + Math.random()), 1.6 + Math.random() * 1.8, Math.sin(a) * (0.6 + Math.random()));
      c.q.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      c.life = 1;
      if (++made >= 14) break;
    }
    splashAt(p.x, p.z, 1.3);
    const rect = (e.nativeEvent.target as HTMLElement | null)?.getBoundingClientRect();
    onCrunch?.(rect ? e.nativeEvent.clientX - rect.left : size.width / 2, rect ? e.nativeEvent.clientY - rect.top : size.height / 2);
    invalidate();
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const c = clock.current;
    c.t += dt;
    const t = c.t;

    // The whole scene: a slow turn, the scroll, and a lean towards the pointer.
    if (root.current) {
      if (idle) {
        pointer.current.x += (state.pointer.x - pointer.current.x) * 0.06;
        pointer.current.y += (state.pointer.y - pointer.current.y) * 0.06;
        const scroll = typeof window === "undefined" ? 0 : window.scrollY * 0.0016;
        root.current.rotation.y = t * 0.16 + scroll + pointer.current.x * 0.35;
        root.current.rotation.x = -pointer.current.y * 0.1;
      } else {
        root.current.rotation.set(0, 0.35, 0);
      }
    }

    // Flakes.
    let allLanded = true;
    byVariant.forEach((list, v) => {
      const mesh = flakeMeshes.current[v];
      if (!mesh) return;
      list.forEach((it, i) => {
        stepPop(it, dt);
        const landed = itemMatrix(it, t, tmpM);
        if (landed && !it.landed) {
          it.landed = true;
          if (it.splash && !still) splashAt(it.target.x, it.target.z, 0.8);
        }
        if (!landed) allLanded = false;
        mesh.setMatrixAt(i, tmpM);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });

    // Fruit: banana slices, strawberries and their leaves.
    const fruit = (mesh: THREE.InstancedMesh | null, list: Item[], leaves?: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      list.forEach((it, i) => {
        stepPop(it, dt);
        const landed = itemMatrix(it, t, tmpM);
        if (landed && !it.landed) { it.landed = true; if (!still) splashAt(it.target.x, it.target.z, 0.6); }
        if (!landed) allLanded = false;
        mesh.setMatrixAt(i, tmpM);
        if (leaves) leaves.setMatrixAt(i, LEAF_M.copy(tmpM).multiply(LEAF_OFFSET));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (leaves) leaves.instanceMatrix.needsUpdate = true;
    };
    fruit(bananaMesh.current, bananas);
    fruit(berryMesh.current, berries, leafMesh.current);

    // Milk: gentle swell plus rings spreading from where things landed.
    if (milk.current && plan.milkY !== null) {
      const pos = milk.current.geometry.attributes.position as THREE.BufferAttribute;
      const list = ripples.current;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        let y = 0.004 * Math.sin(x * 3 + t * 1.3) * Math.cos(z * 2.6 + t * 1.1);
        for (const rp of list) {
          const age = t - rp.t;
          if (age < 0 || age > 2.4) continue;
          const d = Math.hypot(x - rp.x, z - rp.z);
          const front = age * 0.75;
          if (d > front + 0.25) continue;
          y += 0.014 * Math.exp(-age * 2) * Math.sin((d - front) * 22) * Math.exp(-Math.abs(d - front) * 6);
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      milk.current.geometry.computeVertexNormals();
    }

    // Droplets.
    if (drops.current && plan.milkY !== null) {
      dropState.current.forEach((d, i) => {
        if (d.alive) {
          d.v.y -= GRAVITY * dt;
          d.p.addScaledVector(d.v, dt);
          if (d.p.y < plan.milkY! && d.v.y < 0) d.alive = false;
        }
        tmpM.compose(d.p, tmpQ.identity(), tmpS.setScalar(d.alive ? 1 : 0));
        drops.current!.setMatrixAt(i, tmpM);
      });
      drops.current.instanceMatrix.needsUpdate = true;
    }

    // Crumbs from a crunch.
    if (crumbs.current) {
      crumbState.current.forEach((cr, i) => {
        if (cr.life > 0) {
          cr.life -= dt * 1.1;
          cr.v.y -= GRAVITY * dt;
          cr.p.addScaledVector(cr.v, dt);
          tmpQ2.setFromAxisAngle(X_AXIS, dt * 9);
          cr.q.multiply(tmpQ2);
        }
        tmpM.compose(cr.p, cr.q, tmpS.setScalar(Math.max(0, cr.life)));
        crumbs.current!.setMatrixAt(i, tmpM);
      });
      crumbs.current.instanceMatrix.needsUpdate = true;
    }

    if (!c.ready) { c.ready = true; onReady?.(); }
    c.frames++;
    if (!c.settled && allLanded && t > plan.settleAt && (!still || c.frames > 3)) { c.settled = true; onSettled?.(); }
  });

  const shadow = size.width > 520;
  const glassScene = config.vessel === "glass";

  return (
    <group ref={root}>
      {glassScene ? (
        <>
          <mesh geometry={assets.glass!} material={assets.glassMat} castShadow={false} />
          {assets.yoghurtGeos.map((g, i) => <mesh key={i} geometry={g} material={assets.yoghurtMat} receiveShadow />)}
        </>
      ) : (
        <>
          <mesh geometry={assets.bowl.outer} material={assets.bowlOut} castShadow={shadow} receiveShadow />
          <mesh geometry={assets.bowl.inner} material={assets.bowlIn} receiveShadow />
          {plan.milkY !== null && <mesh ref={milk} geometry={assets.milkGeo} material={assets.milkMat} position={[0, plan.milkY, 0]} receiveShadow />}
        </>
      )}

      <group onPointerDown={crunch} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
        {byVariant.map((list, v) => (
          <instancedMesh
            key={v}
            ref={(m) => { flakeMeshes.current[v] = m; }}
            args={[assets.flakeGeos[v], assets.flakeMat, list.length]}
            castShadow={shadow}
            receiveShadow
            frustumCulled={false}
          />
        ))}
        {bananas.length > 0 && (
          <instancedMesh ref={bananaMesh} args={[assets.banana, [assets.peelSide, assets.face, assets.face], bananas.length]} castShadow={shadow} receiveShadow frustumCulled={false} />
        )}
        {berries.length > 0 && (
          <>
            <instancedMesh ref={berryMesh} args={[assets.berry, assets.berryMat, berries.length]} castShadow={shadow} receiveShadow frustumCulled={false} />
            <instancedMesh ref={leafMesh} args={[assets.leaves, assets.leafMat, berries.length]} castShadow={shadow} frustumCulled={false} />
          </>
        )}
      </group>

      {plan.milkY !== null && <instancedMesh ref={drops} args={[assets.dropGeo, assets.milkMat, DROPS]} frustumCulled={false} />}
      <instancedMesh ref={crumbs} args={[assets.crumbGeo, assets.flakeMat, CRUMBS]} frustumCulled={false} />

      {frosted && <Sparkles count={46} scale={[1.7, 0.45, 1.7]} position={[0, plan.heapTop - 0.12, 0]} size={3.2} speed={0.35} opacity={1} color="#fffbea" noise={0.4} />}
    </group>
  );
}

/** The canvas: camera, warm studio light, soft shadows and the food. */
export default function CerealScene({ config, running, onReady, onSettled, onCrunch, idle = true, still = false }: SceneProps) {
  const glass = config.vessel === "glass";
  const camera = glass
    ? { position: [0, 1.15, 4.6] as [number, number, number], fov: 33 }
    : { position: [0, 2.05, 3.8] as [number, number, number], fov: config.small ? 28 : 31 };
  return (
    <Canvas
      shadows
      frameloop={running ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ ...camera, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: still, powerPreference: "high-performance" }}
      onCreated={({ camera: cam, gl }) => {
        cam.lookAt(0, glass ? 0 : -0.08, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#fff3dc", "#e2a14a", 0.55]} />
      <directionalLight
        position={[-2.6, 4.2, 2.4]}
        intensity={2.6}
        color="#ffe6bd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={5}
        shadow-blurSamples={12}
        shadow-camera-left={-1.8}
        shadow-camera-right={1.8}
        shadow-camera-top={1.8}
        shadow-camera-bottom={-1.8}
      />
      <directionalLight position={[2.8, 1.6, -2.2]} intensity={1.3} color="#ffc98a" />
      <directionalLight position={[0.6, 0.8, 4]} intensity={0.9} color="#fff1d6" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff3dc" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffd79a" position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#ffe9c7" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[1.5, 3, 4]} scale={2} />
      </Environment>
      <Food config={config} onReady={onReady} onSettled={onSettled} onCrunch={onCrunch} idle={idle} still={still} />
      <ContactShadows position={[0, glass ? -1.18 : -0.63, 0]} opacity={0.42} scale={glass ? 3.2 : 4.2} blur={2.6} far={1.6} color="#6b3410" resolution={512} frames={1} />
    </Canvas>
  );
}
