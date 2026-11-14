/**
 * Procedural textures for the food, painted on a canvas in the browser: no image files to download. Each is built once
 * per page and shared by every scene (cached by key).
 */
import * as THREE from "three";
import { rng } from "./rng";

const cache = new Map<string, THREE.Texture>();

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
}

function done(key: string, c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/** A toasted corn flake: golden base, darker toasted blotches and blisters, lighter crisp ridges. */
export function flakeMap(frosted: boolean): THREE.Texture {
  const key = `flake-${frosted}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(256);
  const r = rng(frosted ? 7 : 3);
  const base = g.createRadialGradient(128, 118, 10, 128, 128, 150);
  if (frosted) {
    base.addColorStop(0, "#ffdd8a");
    base.addColorStop(0.6, "#f6bd55");
    base.addColorStop(1, "#e19a35");
  } else {
    base.addColorStop(0, "#ffd677");
    base.addColorStop(0.55, "#f3b445");
    base.addColorStop(1, "#dc922c");
  }
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  // Toasted blotches.
  for (let i = 0; i < 46; i++) {
    const x = r() * 256, y = r() * 256, rad = 6 + r() * 26;
    const b = g.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, `rgba(${frosted ? "190,118,44" : "184,104,30"},${0.1 + r() * 0.2})`);
    b.addColorStop(1, "rgba(150,78,16,0)");
    g.fillStyle = b;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // Crisp light ridges.
  for (let i = 0; i < 70; i++) {
    const x = r() * 256, y = r() * 256, rad = 2 + r() * 9;
    const b = g.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, "rgba(255,240,186,.6)");
    b.addColorStop(1, "rgba(255,236,170,0)");
    g.fillStyle = b;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // Tiny toasted blisters.
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(140,70,14,${0.06 + r() * 0.16})`;
    g.beginPath(); g.arc(r() * 256, r() * 256, 0.6 + r() * 1.8, 0, Math.PI * 2); g.fill();
  }
  if (frosted) {
    // The sugar frost: a white haze and bright sugar crystals.
    for (let i = 0; i < 40; i++) {
      const x = r() * 256, y = r() * 256, rad = 8 + r() * 30;
      const b = g.createRadialGradient(x, y, 0, x, y, rad);
      b.addColorStop(0, "rgba(255,252,244,.32)");
      b.addColorStop(1, "rgba(255,252,244,0)");
      g.fillStyle = b;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`;
      const s = 0.8 + r() * 2;
      g.fillRect(r() * 256, r() * 256, s, s);
    }
  }
  return done(key, c);
}

/** A bump map for the flakes: blistered, uneven toasted surface. */
export function flakeBump(): THREE.Texture {
  const hit = cache.get("flake-bump");
  if (hit) return hit;
  const [c, g] = canvas(256);
  const r = rng(11);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = r() * 256, y = r() * 256, rad = 2 + r() * 12;
    const light = r() > 0.5;
    const b = g.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, light ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.45)");
    b.addColorStop(1, "rgba(128,128,128,0)");
    g.fillStyle = b;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  return done("flake-bump", c, false);
}

/** The cut face of a banana slice: cream flesh, a paler core and a ring of tiny seeds. */
export function bananaFace(): THREE.Texture {
  const hit = cache.get("banana");
  if (hit) return hit;
  const [c, g] = canvas(256);
  const r = rng(5);
  g.fillStyle = "#f2dc8c";
  g.fillRect(0, 0, 256, 256);
  const flesh = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  flesh.addColorStop(0, "#fff1b8");
  flesh.addColorStop(0.35, "#fbe39a");
  flesh.addColorStop(0.85, "#f4d478");
  flesh.addColorStop(1, "#e2bb55");
  g.fillStyle = flesh;
  g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  // The three-part core.
  g.strokeStyle = "rgba(214,184,110,.55)";
  g.lineWidth = 3;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.3;
    g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 38, 128 + Math.sin(a) * 38); g.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = 14 + r() * 20;
    g.fillStyle = `rgba(92,58,24,${0.5 + r() * 0.4})`;
    g.beginPath(); g.ellipse(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 1.6, 2.6, a, 0, Math.PI * 2); g.fill();
  }
  return done("banana", c);
}

/** Strawberry skin: glossy red with tiny golden seeds in rows. */
export function strawberrySkin(): THREE.Texture {
  const hit = cache.get("strawberry");
  if (hit) return hit;
  const [c, g] = canvas(256);
  const r = rng(9);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#c8102e");
  grad.addColorStop(0.7, "#e0213a");
  grad.addColorStop(1, "#b80d25");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 16; col++) {
      const x = (col + (row % 2) * 0.5) * 16 + r() * 3, y = row * 18 + 8 + r() * 3;
      g.fillStyle = "rgba(120,10,25,.55)";
      g.beginPath(); g.ellipse(x, y + 1, 3.2, 4.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f2c94c";
      g.beginPath(); g.ellipse(x, y, 1.4, 2.4, 0, 0, Math.PI * 2); g.fill();
    }
  }
  const t = done("strawberry", c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A soft round sprite for milk droplets and crumbs' sparkle. */
export function sparkleSprite(): THREE.Texture {
  const hit = cache.get("sparkle");
  if (hit) return hit;
  const [c, g] = canvas(64);
  const b = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  b.addColorStop(0, "rgba(255,255,255,1)");
  b.addColorStop(0.25, "rgba(255,250,230,.8)");
  b.addColorStop(1, "rgba(255,250,230,0)");
  g.fillStyle = b;
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(255,255,255,.9)";
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke();
  return done("sparkle", c);
}
