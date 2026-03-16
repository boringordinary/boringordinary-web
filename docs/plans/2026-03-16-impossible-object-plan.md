# Impossible Object Homepage Background — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current concentric illusion canvas with a Three.js Penrose triangle scene — glowing impossible geometry with particles flowing along the impossible loop, surrounded by floating architectural fragments.

**Architecture:** Single React component (`ImpossibleScene`) using `@react-three/fiber` Canvas with orthographic camera locked at the isometric "magic angle." Three separate beam meshes positioned to appear connected from that angle. Custom shaders for fresnel glow. Postprocessing bloom via Three.js EffectComposer. Particle system using InstancedMesh on a Bezier path loop.

**Tech Stack:** `@react-three/fiber` (already installed), `three` (already installed — includes EffectComposer, UnrealBloomPass, RenderPass, OutputPass in examples/jsm). Tailwind for layout. No new dependencies needed.

---

### Task 1: Scaffold the R3F Scene Component

**Files:**
- Create: `src/components/impossible-scene.tsx`
- Modify: `src/routes/index.tsx`

**Step 1: Create the base component with R3F Canvas and orthographic camera**

Create `src/components/impossible-scene.tsx`:

```tsx
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Scene() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#4488ff" wireframe />
      </mesh>
    </group>
  );
}

export function ImpossibleScene() {
  return (
    <div className="h-dvh w-full overflow-hidden bg-[#06060a] relative">
      <Canvas
        orthographic
        camera={{
          zoom: 80,
          position: [5, 5, 5],
          near: -100,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#06060a" }}
      >
        <Scene />
      </Canvas>
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <span
          className="text-7xl tracking-tight text-white select-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            WebkitTextStroke: "1.5px black",
            paintOrder: "stroke fill",
          }}
        >
          B+O
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Wire it into the route**

Modify `src/routes/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ImpossibleScene } from "../components/impossible-scene";

export const Route = createFileRoute("/")({
  component: () => <ImpossibleScene />,
});
```

**Step 3: Verify it renders**

Run: `npm run dev`
Expected: Blue wireframe cube on dark background with "B+O" overlay centered. R3F canvas fills viewport.

**Step 4: Commit**

```bash
git add src/components/impossible-scene.tsx src/routes/index.tsx
git commit -m "feat: scaffold R3F scene with orthographic camera"
```

---

### Task 2: Build the Penrose Triangle Geometry

**Files:**
- Modify: `src/components/impossible-scene.tsx`

The Penrose triangle illusion works by placing three L-shaped beams so they _appear_ to connect from the camera's orthographic viewpoint, but actually have gaps in 3D space.

**Step 1: Create the three beam geometry**

Each beam is an L-shape (two joined rectangular prisms). The three beams are rotated 120 degrees apart. The key constants:

- Beam length: 4 units
- Beam cross-section: 0.6 x 0.6
- Camera position: `[5, 5, 5]` (isometric magic angle — equal components means 35.264 deg elevation)

Replace the `Scene` function with the Penrose triangle beams. Each beam is a group of two BoxGeometry meshes forming an L-shape. The three L-shapes are positioned and rotated so their ends visually overlap from the camera angle.

```tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const BEAM_LENGTH = 3.5;
const BEAM_SIZE = 0.55;

/** Single L-shaped beam: one horizontal bar + one vertical bar meeting at a corner */
function Beam({ rotation }: { rotation: number }) {
  const group = useRef<THREE.Group>(null);

  // Rotate the entire L-shape around Y axis
  const euler = useMemo(
    () => new THREE.Euler(0, (rotation * Math.PI) / 180, 0),
    [rotation]
  );

  // Position offsets to form the L
  // Bar A goes along +X, Bar B goes along +Y from the end of A
  const halfLen = BEAM_LENGTH / 2;
  const halfSize = BEAM_SIZE / 2;

  return (
    <group ref={group} rotation={euler}>
      {/* Horizontal bar */}
      <mesh position={[halfLen, 0, -halfLen + halfSize]}>
        <boxGeometry args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
      {/* Vertical bar going up */}
      <mesh position={[BEAM_LENGTH - halfSize, halfLen, -halfLen + halfSize]}>
        <boxGeometry args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
    </group>
  );
}

function PenroseTriangle() {
  return (
    <group>
      <Beam rotation={0} />
      <Beam rotation={120} />
      <Beam rotation={240} />
    </group>
  );
}
```

**Step 2: Adjust beam positions until the illusion works**

This is the critical step. From the isometric camera angle `[5,5,5]`, the three L-shaped beams must appear to form a closed triangle. The exact offsets need fine-tuning — view in browser and adjust position values until the corners visually connect.

The mathematical approach: in isometric projection, the three beams need their endpoints to project to the same 2D screen coordinates. Start with the L-shapes at 120-degree intervals and nudge positions until the illusion holds.

Run: `npm run dev`
Expected: Three L-shapes that form a closed Penrose triangle when viewed from the isometric camera. The wireframe makes gaps obvious for debugging.

**Step 3: Commit**

```bash
git add src/components/impossible-scene.tsx
git commit -m "feat: build Penrose triangle from three L-shaped beams"
```

---

### Task 3: Fresnel Glow Shader Material

**Files:**
- Create: `src/components/impossible-scene/fresnel-material.tsx`
- Modify: `src/components/impossible-scene.tsx`

**Step 1: Create the custom fresnel shader material**

The beams need: near-transparent faces with fresnel rim glow (edges facing away from camera glow brighter). This is a custom ShaderMaterial.

Create `src/components/impossible-scene/fresnel-material.tsx`:

```tsx
import { shaderMaterial } from "@react-three/drei";
// NOTE: if @react-three/drei is not installed, implement as raw THREE.ShaderMaterial instead

import * as THREE from "three";

// If drei is unavailable, use this raw approach:
export function createFresnelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#88ccff") },
      uFresnelPower: { value: 2.0 },
      uOpacity: { value: 0.08 },
      uRimOpacity: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uFresnelPower;
      uniform float uOpacity;
      uniform float uRimOpacity;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, uFresnelPower);

        // Breathing pulse
        float pulse = 0.85 + 0.15 * sin(uTime * 0.785); // ~8s period

        float alpha = mix(uOpacity, uRimOpacity, fresnel) * pulse;
        vec3 color = uColor * (1.0 + fresnel * 0.5);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
```

**Step 2: Apply the fresnel material to beams, add edge glow lines**

Update the `Beam` component to use the fresnel material on faces and add `EdgesGeometry` with emissive line material for the bright edges.

```tsx
function Beam({ rotation }: { rotation: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mat2Ref = useRef<THREE.ShaderMaterial>(null);

  const euler = useMemo(
    () => new THREE.Euler(0, (rotation * Math.PI) / 180, 0),
    [rotation]
  );

  // Create materials once
  const [faceMat1, faceMat2] = useMemo(() => {
    return [createFresnelMaterial(), createFresnelMaterial()];
  }, []);

  // Update time uniform each frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    faceMat1.uniforms.uTime.value = t;
    faceMat2.uniforms.uTime.value = t;
  });

  const halfLen = BEAM_LENGTH / 2;
  const halfSize = BEAM_SIZE / 2;

  // Edge geometry for glow lines
  const edgeGeo1 = useMemo(() => {
    const box = new THREE.BoxGeometry(BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE);
    return new THREE.EdgesGeometry(box);
  }, []);

  const edgeGeo2 = useMemo(() => {
    const box = new THREE.BoxGeometry(BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE);
    return new THREE.EdgesGeometry(box);
  }, []);

  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#88ccff"),
        transparent: true,
        opacity: 0.7,
      }),
    []
  );

  return (
    <group ref={groupRef} rotation={euler}>
      {/* Horizontal bar */}
      <mesh position={[halfLen, 0, -halfLen + halfSize]} material={faceMat1}>
        <boxGeometry args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]} />
      </mesh>
      <lineSegments
        position={[halfLen, 0, -halfLen + halfSize]}
        geometry={edgeGeo1}
        material={edgeMat}
      />

      {/* Vertical bar */}
      <mesh
        position={[BEAM_LENGTH - halfSize, halfLen, -halfLen + halfSize]}
        material={faceMat2}
      >
        <boxGeometry args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]} />
      </mesh>
      <lineSegments
        position={[BEAM_LENGTH - halfSize, halfLen, -halfLen + halfSize]}
        geometry={edgeGeo2}
        material={edgeMat}
      />
    </group>
  );
}
```

**Step 3: Verify the glow aesthetic**

Run: `npm run dev`
Expected: Translucent beams with bright edges, additive blending creating a frosted glass glow effect. The triangle should have an ethereal, luminous quality against the dark background.

**Step 4: Commit**

```bash
git add src/components/impossible-scene/fresnel-material.tsx src/components/impossible-scene.tsx
git commit -m "feat: add fresnel glow shader to Penrose triangle beams"
```

---

### Task 4: Bloom Postprocessing

**Files:**
- Modify: `src/components/impossible-scene.tsx`

**Step 1: Add postprocessing with UnrealBloomPass**

Three.js includes EffectComposer, RenderPass, UnrealBloomPass, and OutputPass in `three/examples/jsm/postprocessing/`. We need to set these up in a custom render loop since we're not using `@react-three/postprocessing`.

Add a `PostProcessing` component that creates the EffectComposer with bloom:

```tsx
import { useThree, useFrame } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

function PostProcessing() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      1.2,   // strength
      0.4,   // radius
      0.2    // threshold
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    composerRef.current = composer;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, size]);

  // Handle resize
  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  // Override default render with composer
  useFrame(() => {
    composerRef.current?.render();
  }, 1); // priority 1 = runs after default

  return null;
}
```

Add `<PostProcessing />` to the Scene and set `frameloop="always"` and disable automatic rendering on the Canvas:

```tsx
<Canvas
  orthographic
  camera={{ zoom: 80, position: [5, 5, 5], near: -100, far: 100 }}
  gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
  style={{ background: "#06060a" }}
  onCreated={({ gl }) => {
    gl.setClearColor("#06060a");
  }}
>
  <Scene />
</Canvas>
```

Inside Scene, disable R3F's default render loop since EffectComposer handles it:

```tsx
function Scene() {
  const { gl } = useThree();
  // Tell R3F we handle rendering ourselves
  useEffect(() => {
    gl.autoClear = false;
  }, [gl]);

  return (
    <group>
      <PenroseTriangle />
      <PostProcessing />
    </group>
  );
}
```

**Step 2: Verify bloom effect**

Run: `npm run dev`
Expected: The edge lines and fresnel rims now have a soft glow/bloom halo. The overall scene should feel luminous and ethereal.

**Step 3: Commit**

```bash
git add src/components/impossible-scene.tsx
git commit -m "feat: add UnrealBloomPass postprocessing for glow effect"
```

---

### Task 5: Particle Flow Along the Impossible Path

**Files:**
- Create: `src/components/impossible-scene/particle-flow.tsx`
- Modify: `src/components/impossible-scene.tsx`

**Step 1: Define the continuous Bezier path**

The particle path traces the top surface of all three beams in a continuous loop. Even though the 3D geometry has gaps, the path is mathematically continuous — this sells the impossibility.

Create `src/components/impossible-scene/particle-flow.tsx`:

```tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 70;
const CYCLE_DURATION = 15; // seconds for full loop
const PARTICLE_SIZE = 0.06;

/**
 * Build a CatmullRomCurve3 that traces the top surface of the Penrose triangle.
 * The path visits the top-outer edge of each beam's L-shape, forming a closed loop
 * that only makes sense from the magic camera angle.
 */
function createFlowPath(): THREE.CatmullRomCurve3 {
  // These points trace the top surface of each beam's L-shape
  // Beam positions must match the geometry in the parent component
  // Points are ordered: along beam 1 top → corner → up beam 1 vertical →
  //   across to beam 2 top → corner → up beam 2 vertical →
  //   across to beam 3 top → corner → up beam 3 vertical → loop back

  const BEAM_LENGTH = 3.5;
  const HALF = BEAM_LENGTH / 2;
  const SIZE = 0.55;
  const HALF_SIZE = SIZE / 2;
  const TOP = HALF_SIZE; // Y offset for top surface

  // Generate points for one beam arm, then rotate for the other two
  function armPoints(rotY: number): THREE.Vector3[] {
    const points = [
      // Start of horizontal bar (outer top edge)
      new THREE.Vector3(0, TOP, -HALF + HALF_SIZE),
      // End of horizontal bar
      new THREE.Vector3(BEAM_LENGTH, TOP, -HALF + HALF_SIZE),
      // Corner transition to vertical
      new THREE.Vector3(BEAM_LENGTH - HALF_SIZE, TOP, -HALF + HALF_SIZE),
      // Going up the vertical bar
      new THREE.Vector3(BEAM_LENGTH - HALF_SIZE, BEAM_LENGTH, -HALF + HALF_SIZE),
    ];

    // Rotate all points around Y axis
    const matrix = new THREE.Matrix4().makeRotationY(
      (rotY * Math.PI) / 180
    );
    return points.map((p) => p.clone().applyMatrix4(matrix));
  }

  // Three arms at 120-degree intervals
  const allPoints = [
    ...armPoints(0),
    ...armPoints(120),
    ...armPoints(240),
  ];

  return new THREE.CatmullRomCurve3(allPoints, true); // closed = true
}

export function ParticleFlow() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const path = useMemo(() => createFlowPath(), []);

  // Stagger particles evenly along the path
  const offsets = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i] = i / PARTICLE_COUNT;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const progress = (t / CYCLE_DURATION) % 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = (offsets[i] + progress) % 1;
      const point = path.getPointAt(p);

      dummy.position.copy(point);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[PARTICLE_SIZE, 8, 8]} />
      <meshBasicMaterial
        color="#aaeeff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
```

**Step 2: Import and add to Scene**

In `impossible-scene.tsx`, add `<ParticleFlow />` inside the `<group>` alongside `<PenroseTriangle />`.

**Step 3: Fine-tune the path points**

The `armPoints` function above uses approximate coordinates. After rendering, adjust the path control points so particles visually flow along the top surface of the beams. The path must be smooth and the particles should appear to seamlessly transition between beams at the "impossible" corners.

Run: `npm run dev`
Expected: ~70 small glowing spheres flowing steadily along the top of the Penrose triangle in a continuous loop. The flow should feel smooth and hypnotic.

**Step 4: Commit**

```bash
git add src/components/impossible-scene/particle-flow.tsx src/components/impossible-scene.tsx
git commit -m "feat: add particle flow along impossible triangle path"
```

---

### Task 6: Surrounding Impossible Architecture Fragments

**Files:**
- Create: `src/components/impossible-scene/architecture-fragments.tsx`
- Modify: `src/components/impossible-scene.tsx`

**Step 1: Create floating impossible architectural fragments**

These are smaller, simpler impossible shapes placed around the central triangle at various depths. They use the same fresnel material but at lower opacity. Each fragment slowly rotates.

Create `src/components/impossible-scene/architecture-fragments.tsx`:

```tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFresnelMaterial } from "./fresnel-material";

interface FragmentConfig {
  position: [number, number, number];
  scale: number;
  rotationSpeed: [number, number, number]; // deg/s per axis
  type: "mini-penrose" | "staircase" | "impossible-column";
}

const FRAGMENTS: FragmentConfig[] = [
  {
    position: [-6, 3, -4],
    scale: 0.35,
    rotationSpeed: [0.3, 0.5, 0.1],
    type: "mini-penrose",
  },
  {
    position: [7, -2, -3],
    scale: 0.25,
    rotationSpeed: [0.2, -0.4, 0.3],
    type: "staircase",
  },
  {
    position: [-4, -4, -6],
    scale: 0.3,
    rotationSpeed: [-0.1, 0.6, -0.2],
    type: "impossible-column",
  },
  {
    position: [5, 5, -5],
    scale: 0.2,
    rotationSpeed: [0.4, 0.2, -0.5],
    type: "mini-penrose",
  },
];

function Fragment({ config }: { config: FragmentConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    const mat = createFresnelMaterial();
    mat.uniforms.uOpacity.value = 0.04;
    mat.uniforms.uRimOpacity.value = 0.3;
    return mat;
  }, []);

  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#88ccff"),
        transparent: true,
        opacity: 0.35,
      }),
    []
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.getElapsedTime();
    const [rx, ry, rz] = config.rotationSpeed;
    const deg2rad = Math.PI / 180;
    group.rotation.x = t * rx * deg2rad;
    group.rotation.y = t * ry * deg2rad;
    group.rotation.z = t * rz * deg2rad;

    material.uniforms.uTime.value = t;
  });

  // Simple impossible shapes built from boxes
  // Mini-penrose: 3 small L-shapes at 120deg
  // Staircase: 4 ascending boxes that loop back
  // Impossible-column: two boxes with contradictory overlap

  return (
    <group
      ref={groupRef}
      position={config.position}
      scale={config.scale}
    >
      {config.type === "mini-penrose" && <MiniPenrose material={material} edgeMat={edgeMat} />}
      {config.type === "staircase" && <Staircase material={material} edgeMat={edgeMat} />}
      {config.type === "impossible-column" && <ImpossibleColumn material={material} edgeMat={edgeMat} />}
    </group>
  );
}

function MiniPenrose({ material, edgeMat }: { material: THREE.ShaderMaterial; edgeMat: THREE.LineBasicMaterial }) {
  // Simplified Penrose — 3 bars at 120deg that overlap impossibly
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 0.5, 0.5)), []);
  return (
    <group>
      {[0, 120, 240].map((rot) => (
        <group key={rot} rotation={[0, (rot * Math.PI) / 180, 0]}>
          <mesh position={[1.5, 0, 0]} material={material}>
            <boxGeometry args={[3, 0.5, 0.5]} />
          </mesh>
          <lineSegments position={[1.5, 0, 0]} geometry={edgeGeo} material={edgeMat} />
        </group>
      ))}
    </group>
  );
}

function Staircase({ material, edgeMat }: { material: THREE.ShaderMaterial; edgeMat: THREE.LineBasicMaterial }) {
  // 4 ascending steps that impossibly loop back to start
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 0.3, 1)), []);
  const steps = [
    [0, 0, 0],
    [1.3, 0.5, 0],
    [2.6, 1.0, 0],
    [1.3, 1.5, 0], // impossible: goes back but higher
  ] as [number, number, number][];

  return (
    <group>
      {steps.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh material={material}>
            <boxGeometry args={[1.2, 0.3, 1]} />
          </mesh>
          <lineSegments geometry={edgeGeo} material={edgeMat} />
        </group>
      ))}
    </group>
  );
}

function ImpossibleColumn({ material, edgeMat }: { material: THREE.ShaderMaterial; edgeMat: THREE.LineBasicMaterial }) {
  // Two intersecting columns with contradictory front/back
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.4, 3, 0.4)), []);
  return (
    <group>
      <group position={[-0.5, 0, 0]}>
        <mesh material={material}>
          <boxGeometry args={[0.4, 3, 0.4]} />
        </mesh>
        <lineSegments geometry={edgeGeo} material={edgeMat} />
      </group>
      <group position={[0.5, 0, 0]}>
        <mesh material={material}>
          <boxGeometry args={[0.4, 3, 0.4]} />
        </mesh>
        <lineSegments geometry={edgeGeo} material={edgeMat} />
      </group>
      {/* Cross-bar that contradicts depth */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry args={[1.4, 0.3, 0.4]} />
      </mesh>
    </group>
  );
}

export function ArchitectureFragments() {
  return (
    <group>
      {FRAGMENTS.map((config, i) => (
        <Fragment key={i} config={config} />
      ))}
    </group>
  );
}
```

**Step 2: Add to Scene and wire up mouse parallax**

In `impossible-scene.tsx`, add `<ArchitectureFragments />` to the Scene. Add a mouse listener that shifts fragment positions based on cursor position (parallax effect — fragments further from camera shift less).

**Step 3: Verify fragments render**

Run: `npm run dev`
Expected: 4 small glowing impossible shapes floating around the central Penrose triangle, slowly rotating. They should be dimmer and smaller than the main triangle.

**Step 4: Commit**

```bash
git add src/components/impossible-scene/architecture-fragments.tsx src/components/impossible-scene.tsx
git commit -m "feat: add floating impossible architecture fragments"
```

---

### Task 7: Mouse Interactivity

**Files:**
- Modify: `src/components/impossible-scene.tsx`
- Modify: `src/components/impossible-scene/particle-flow.tsx`
- Modify: `src/components/impossible-scene/architecture-fragments.tsx`

**Step 1: Track mouse position as normalized coordinates**

In the main `ImpossibleScene` component, track mouse position and pass it into the R3F scene via a ref or context. Normalize to [-1, 1] range.

```tsx
// In ImpossibleScene component
const mouseRef = useRef({ x: 0, y: 0 });

useEffect(() => {
  function onMove(e: MouseEvent) {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  function onLeave() {
    mouseRef.current.x = 0;
    mouseRef.current.y = 0;
  }
  window.addEventListener("mousemove", onMove);
  document.addEventListener("mouseleave", onLeave);
  return () => {
    window.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseleave", onLeave);
  };
}, []);
```

**Step 2: Particle gravitational pull**

In `particle-flow.tsx`, accept a mouse ref prop. During the useFrame loop, after computing each particle's path position, apply a small offset toward the mouse's projected world position. Particles within a certain radius get pulled slightly, then snap back.

**Step 3: Fragment parallax**

In `architecture-fragments.tsx`, accept a mouse ref prop. Each fragment's position shifts by `mouse * parallaxFactor * depth`. Deeper fragments move less.

**Step 4: Glow intensification**

In `impossible-scene.tsx`, compute distance from mouse to screen center. When mouse is near center (near the triangle), slightly increase bloom strength or the fresnel material's rim opacity.

**Step 5: Verify all interactions**

Run: `npm run dev`
Expected: Moving the mouse subtly pulls nearby particles, shifts background fragments in parallax, and brightens the central triangle when hovering near it.

**Step 6: Commit**

```bash
git add src/components/impossible-scene.tsx src/components/impossible-scene/particle-flow.tsx src/components/impossible-scene/architecture-fragments.tsx
git commit -m "feat: add mouse interactivity — particle pull, parallax, glow"
```

---

### Task 8: Reduced Motion & Background Grid

**Files:**
- Modify: `src/components/impossible-scene.tsx`

**Step 1: Add prefers-reduced-motion support**

Check `window.matchMedia("(prefers-reduced-motion: reduce)")`. If true, set `frameloop="demand"` on the Canvas and render a single frame. Disable all animation.

**Step 2: Add faint background dot grid**

Add a large plane behind the scene with a subtle dot pattern (can be a Points geometry with many small dots in a grid pattern, or a custom shader on a PlaneGeometry). Very low opacity, slight pulse animation.

**Step 3: Verify**

Run: `npm run dev`
Expected: Faint grid of dots visible behind the geometry, adding depth. With reduced motion enabled in OS settings, the scene renders static.

**Step 4: Commit**

```bash
git add src/components/impossible-scene.tsx
git commit -m "feat: add background dot grid and reduced-motion support"
```

---

### Task 9: Cleanup & Polish

**Files:**
- Modify: `src/components/impossible-scene.tsx`
- Delete: `src/components/concentric-illusion.tsx` (old component, no longer referenced)

**Step 1: Remove old concentric illusion component**

Delete `src/components/concentric-illusion.tsx` — it's no longer imported by any route.

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors.

**Step 3: Run build**

Run: `npm run build`
Expected: Clean build, no errors or warnings.

**Step 4: Final visual review**

Run: `npm run dev`
Check:
- Penrose triangle illusion holds from the camera angle
- Particles flow smoothly in the impossible loop
- Bloom glow looks ethereal, not blown out
- Fragments float and rotate in background
- Mouse interactions are subtle and responsive
- B+O text is readable and centered
- Performance is smooth (60fps on modern hardware)

**Step 5: Commit**

```bash
git rm src/components/concentric-illusion.tsx
git add -A
git commit -m "chore: remove old concentric illusion, polish impossible scene"
```
