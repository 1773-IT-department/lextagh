"use client";

/**
 * The interactive 3D Hooch® boxes (three.js through @react-three/fiber), loaded only when a FoodStage asks for them.
 *
 * Each box is a real carton shape wearing Lexta's own Hooch pack artwork (front and spine, straightened from Lexta's
 * Hooch banner; see apps/hooch/CONTENT-NEEDED.md: replace with the print files when Lexta sends them). Card stock with
 * a soft varnish, warm studio light and a soft contact shadow. The boxes drop in, then turn gently; drag to spin a box
 * all the way round; tap it and it gives a happy shake while real Hooch flakes pop out of the top ("crunch").
 */
import { ContactShadows, Environment, Lightformer, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Flavour, SceneConfig } from "./scene-config";

export type SceneProps = {
  config: SceneConfig;
  running: boolean;
  /** Called once the first frame is drawn (the stage then fades the canvas in over the poster). */
  onReady?: () => void;
  /** Called when the boxes have landed (used for the poster screenshots). */
  onSettled?: () => void;
  /** Called on a tap that hit a box, with the point in the canvas (for the "Crunch!" burst). */
  onCrunch?: (x: number, y: number) => void;
  /** Turns gently and follows the pointer and the scroll. Off for the poster renders. */
  idle?: boolean;
  /** Start with the boxes already standing (poster renders). */
  still?: boolean;
};

/** Pack artwork and carton colours, per cereal. */
const PACK: Record<Flavour, { front: string; side: string; top: string; name: string }> = {
  classic: { front: "/images/hooch/box/corn-front.webp", side: "/images/hooch/box/corn-side.webp", top: "#f4cf22", name: "Hooch® Cornflakes" },
  frosted: { front: "/images/hooch/box/frosted-front.webp", side: "/images/hooch/box/frosted-side.webp", top: "#1f57c2", name: "Hooch® Frosted Flakes" },
};
const FLAKES = ["/images/hooch/bits/flake-sharp.webp", "/images/hooch/bits/flake-1.webp", "/images/hooch/bits/flake-2.webp", "/images/hooch/bits/flake-5.webp"];

/** Carton size (the real front is about 0.56 as wide as it is tall). */
const H = 1.7;
const W = H * 0.56;
const D = H * 0.2;
const easeOutBack = (t: number) => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

type Pop = { mesh: THREE.Mesh; vel: THREE.Vector3; spin: THREE.Vector3; life: number };

function Box({ flavour, position, baseYaw, delay, idle, still, onCrunch, onLanded, index }: {
  flavour: Flavour; position: [number, number, number]; baseYaw: number; delay: number; idle: boolean; still: boolean;
  onCrunch?: (x: number, y: number) => void; onLanded: () => void; index: number;
}) {
  const p = PACK[flavour];
  const [front, side, ...flakeTex] = useTexture([p.front, p.side, ...FLAKES]);
  const { gl, size, camera, scene } = useThree();
  const group = useRef<THREE.Group>(null);
  const state = useRef({ t: still ? 10 : 0, landed: false, yaw: 0, vyaw: 0, drag: false, lastX: 0, moved: 0, shake: 0, pointerX: 0 });
  const pops = useRef<Pop[]>([]);

  const materials = useMemo(() => {
    for (const t of [front, side]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
    const card = (map?: THREE.Texture, color?: string) => new THREE.MeshPhysicalMaterial({
      map, color: color ?? "#ffffff", roughness: 0.46, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.42, sheen: 0.1,
    });
    const top = card(undefined, p.top);
    // BoxGeometry faces: +x (right), -x (left), +y (top), -y (bottom), +z (front), -z (back).
    return [card(side), card(side), top, top, card(front), card(front)];
  }, [front, side, p.top]);

  const flakeMats = useMemo(() => flakeTex.map((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, roughness: 0.6 });
  }), [flakeTex]);
  const flakeGeo = useMemo(() => new THREE.PlaneGeometry(0.2, 0.2), []);

  useEffect(() => () => {
    document.body.style.cursor = "";
    for (const pop of pops.current) scene.remove(pop.mesh);
  }, [scene]);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const s = state.current;
    s.t += dt;
    // Drop in with a little bounce.
    const k = Math.max(0, Math.min(1, (s.t - delay) / 0.9));
    g.position.y = position[1] + (1 - easeOutBack(k)) * 1.4;
    g.scale.setScalar(0.85 + 0.15 * easeOutBack(k));
    if (!s.landed && k >= 1) { s.landed = true; onLanded(); }
    // Spin: dragging sets it, then it eases back to the gentle idle sway.
    if (!s.drag) {
      s.yaw += s.vyaw * dt;
      s.vyaw *= Math.pow(0.04, dt);
      const sway = idle ? Math.sin(s.t * 0.6 + index * 1.7) * 0.32 + s.pointerX * 0.18 : 0;
      // Settle to the nearest view of the front.
      const turns = Math.round(s.yaw / (Math.PI * 2)) * Math.PI * 2;
      if (Math.abs(s.vyaw) < 0.4) s.yaw += (turns - s.yaw) * Math.min(1, dt * 1.6);
      g.rotation.y = baseYaw + s.yaw + sway;
    } else {
      g.rotation.y = baseYaw + s.yaw;
    }
    // A happy shake after a tap.
    if (s.shake > 0) {
      s.shake = Math.max(0, s.shake - dt);
      const a = s.shake * 0.5;
      g.rotation.z = Math.sin(s.shake * 38) * 0.09 * a;
      g.position.x = position[0] + Math.sin(s.shake * 31) * 0.03 * a;
    } else {
      g.rotation.z = idle ? Math.sin(s.t * 0.9 + index) * 0.015 : 0;
      g.position.x = position[0];
    }
    if (idle) g.position.y += Math.sin(s.t * 1.3 + index * 2) * 0.025;
    // Flakes popping out of the top.
    for (let i = pops.current.length - 1; i >= 0; i--) {
      const pop = pops.current[i];
      pop.life -= dt;
      pop.vel.y -= 5.2 * dt;
      pop.mesh.position.addScaledVector(pop.vel, dt);
      pop.mesh.rotation.x += pop.spin.x * dt;
      pop.mesh.rotation.y += pop.spin.y * dt;
      pop.mesh.rotation.z += pop.spin.z * dt;
      const m = pop.mesh.material as THREE.MeshStandardMaterial;
      m.opacity = Math.min(1, pop.life * 2);
      if (pop.life <= 0) { scene.remove(pop.mesh); pops.current.splice(i, 1); }
    }
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = state.current;
      s.pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      if (!s.drag) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.moved += Math.abs(dx);
      s.yaw += dx * 0.012;
      s.vyaw = dx * 0.6;
    };
    const onUp = () => { state.current.drag = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const s = state.current;
    s.drag = true;
    s.lastX = e.nativeEvent.clientX;
    s.moved = 0;
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (state.current.moved > 6) return;
    state.current.shake = 1;
    const g = group.current;
    if (!g) return;
    // Real flakes jump out of the top of the box.
    const topWorld = new THREE.Vector3(0, H / 2, 0).applyMatrix4(g.matrixWorld);
    for (let i = 0; i < 14; i++) {
      const mat = flakeMats[i % flakeMats.length].clone();
      const mesh = new THREE.Mesh(flakeGeo, mat);
      mesh.position.copy(topWorld).add(new THREE.Vector3((Math.random() - 0.5) * W * 0.7, 0.02, (Math.random() - 0.5) * D));
      mesh.scale.setScalar(0.7 + Math.random() * 0.7);
      scene.add(mesh);
      pops.current.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.6, 2.2 + Math.random() * 1.6, 0.4 + Math.random() * 0.8),
        spin: new THREE.Vector3(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4),
        life: 1.4 + Math.random() * 0.5,
      });
    }
    const v = topWorld.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    onCrunch?.(((v.x + 1) / 2) * (rect.width || size.width), ((1 - v.y) / 2) * (rect.height || size.height));
  };

  return (
    <group ref={group} position={position} rotation-y={baseYaw}>
      <mesh
        material={materials}
        castShadow
        onPointerDown={down}
        onClick={click}
        onPointerOver={() => { document.body.style.cursor = "grab"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}
      >
        <boxGeometry args={[W, H, D, 1, 1, 1]} />
      </mesh>
    </group>
  );
}

function Packs({ config, onReady, onSettled, onCrunch, idle = true, still = false }: Omit<SceneProps, "running">) {
  const two = config.packs.length > 1;
  const landed = useRef(0);
  const ready = useRef(false);
  useFrame(() => { if (!ready.current) { ready.current = true; onReady?.(); } });
  const onLanded = () => { landed.current += 1; if (landed.current === config.packs.length) onSettled?.(); };
  return (
    <>
      {config.packs.map((f, i) => (
        <Box
          key={f + i}
          index={i}
          flavour={f}
          position={two ? [i === 0 ? -0.58 : 0.58, 0, i === 0 ? -0.15 : 0.12] : [0, 0, 0]}
          baseYaw={two ? (i === 0 ? 0.32 : -0.3) : -0.38}
          delay={still ? -5 : 0.15 + i * 0.22}
          idle={idle}
          still={still}
          onCrunch={onCrunch}
          onLanded={onLanded}
        />
      ))}
    </>
  );
}

/** The canvas: camera, warm studio light, soft shadow and the boxes. */
export default function BoxScene({ config, running, onReady, onSettled, onCrunch, idle = true, still = false }: SceneProps) {
  const two = config.packs.length > 1;
  return (
    <Canvas
      shadows
      frameloop={running ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0.35, two ? 4.9 : 4.1], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: still, powerPreference: "high-performance" }}
      onCreated={({ camera: cam, gl }) => {
        cam.lookAt(0, -0.05, 0);
        // Neutral tone mapping keeps the pack colours true to Lexta's artwork.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#fff6e4", "#d9a35a", 0.6]} />
      <directionalLight position={[-2.4, 3.6, 3.2]} intensity={2.2} color="#fff0d8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[3, 1.4, -2]} intensity={1.4} color="#ffd9a0" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff5e6" position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[-4, 1.5, 3]} rotation-y={Math.PI / 3} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe2b0" position={[4.5, 1, 1]} rotation-y={-Math.PI / 2} scale={[5, 4, 1]} />
      </Environment>
      <Packs config={config} onReady={onReady} onSettled={onSettled} onCrunch={onCrunch} idle={idle} still={still} />
      <ContactShadows position={[0, -H / 2 - 0.01, 0]} opacity={0.5} scale={two ? 5 : 3.6} blur={2.4} far={1.4} color="#5a2c08" resolution={256} frames={Infinity} />
    </Canvas>
  );
}
