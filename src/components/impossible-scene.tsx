import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ArchitectureFragments } from "./architecture-fragments";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type MouseRef = React.RefObject<{ x: number; y: number }>;

/*
 * Penrose triangle geometry.
 *
 * Three L-shaped beams whose free endpoints visually overlap from the
 * orthographic camera at [5,5,5]. The beams are related by 120-degree
 * rotation around the [1,1,1] axis (the camera direction), which cyclically
 * permutes the X, Y, Z world axes. Each beam has two box-geometry arms
 * joined at an elbow; the arms lie along different world axes.
 *
 * Mathematical derivation:
 *   Beam offsets d0, d1, d2 are chosen so that the projection of each
 *   beam's "H tip" (free end of arm 1) coincides with the projection of
 *   the next beam's "V tip" (free end of arm 2). The offsets differ only
 *   along the camera direction [1,1,1], which is invisible in orthographic
 *   projection, creating the impossible cyclic depth ordering.
 */

const BEAM_LENGTH = 3.5;
const BEAM_SIZE = 0.55;

/*
 * Each beam is offset by a cyclic permutation of (-S, 0, S) where S = L/3.
 * Arm 1 centre = offset + (L/2) along its axis.
 * Arm 2 centre = offset + L along arm-1 axis + (L/2) along arm-2 axis.
 */
const S = BEAM_LENGTH / 3;
const H = BEAM_LENGTH / 2;

/* ------------------------------------------------------------------ */
/*  Fresnel glow ShaderMaterial factory                                */
/* ------------------------------------------------------------------ */

const fresnelVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fresnelFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uFresnelPower;
  uniform float uOpacity;
  uniform float uRimOpacity;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uFresnelPower);
    float breath = 0.85 + 0.15 * sin(uTime * 0.785);
    float alpha = mix(uOpacity, uRimOpacity, fresnel) * breath;
    gl_FragColor = vec4(uColor * breath, alpha);
  }
`;

function createFresnelMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Color("#88ccff") },
      uFresnelPower: { value: 2.0 },
      uOpacity: { value: 0.08 },
      uRimOpacity: { value: 0.6 },
    },
    vertexShader: fresnelVertexShader,
    fragmentShader: fresnelFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ------------------------------------------------------------------ */
/*  GlowBeam — a single box with fresnel faces + bright edge lines     */
/* ------------------------------------------------------------------ */

interface GlowBeamProps {
  position: [number, number, number];
  args: [number, number, number];
  material: THREE.ShaderMaterial;
}

function GlowBeam({ position, args, material }: GlowBeamProps) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(...args);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [args]);

  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#88ccff",
        transparent: true,
        opacity: 0.5,
      }),
    [],
  );

  return (
    <>
      <mesh position={position} material={material}>
        <boxGeometry args={args} />
      </mesh>
      <lineSegments position={position} geometry={edgesGeo} material={edgeMat} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  PenroseTriangle                                                    */
/* ------------------------------------------------------------------ */

function PenroseTriangle({ mouseRef }: { mouseRef: MouseRef }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const fresnelMat = useMemo(() => createFresnelMaterial(), []);
  matRef.current = fresnelMat;

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();

      // Glow intensification: boost rim opacity when mouse is near center
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dist = Math.sqrt(mx * mx + my * my); // 0 at center, ~1.4 at corners
      const boost = Math.max(0, 1 - dist) * 0.3; // 0–0.3 boost near center
      matRef.current.uniforms.uRimOpacity.value = 0.6 + boost;
    }
  });

  /*
   * Each arm is extended by BEAM_SIZE at the elbow end so the two arms
   * of each beam overlap at the corner, eliminating the visible seam.
   * The extension is along the arm's own axis toward the elbow.
   *
   * Arm 1 (horizontal): extended length = BEAM_LENGTH + BEAM_SIZE/2
   *   centre shifts +BEAM_SIZE/4 toward the elbow end
   * Arm 2 (vertical): extended length = BEAM_LENGTH + BEAM_SIZE/2
   *   centre shifts -BEAM_SIZE/4 toward the elbow end
   */
  const EXT = BEAM_SIZE / 2;
  const ARM = BEAM_LENGTH + EXT;
  const SHIFT1 = EXT / 2; // shift arm1 centre toward elbow
  const SHIFT2 = -EXT / 2; // shift arm2 centre toward elbow (lower)

  return (
    <group>
      {/* Beam 0 — arm 1 along +X, arm 2 along +Y, offset (-S, 0, S) */}
      <GlowBeam
        position={[-S + H + SHIFT1, 0, S]}
        args={[ARM, BEAM_SIZE, BEAM_SIZE]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[-S + BEAM_LENGTH, H + SHIFT2, S]}
        args={[BEAM_SIZE, ARM, BEAM_SIZE]}
        material={fresnelMat}
      />

      {/* Beam 1 — arm 1 along +Y, arm 2 along +Z, offset (S, -S, 0) */}
      <GlowBeam
        position={[S, -S + H + SHIFT1, 0]}
        args={[BEAM_SIZE, ARM, BEAM_SIZE]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[S, -S + BEAM_LENGTH, H + SHIFT2]}
        args={[BEAM_SIZE, BEAM_SIZE, ARM]}
        material={fresnelMat}
      />

      {/* Beam 2 — arm 1 along +Z, arm 2 along +X, offset (0, S, -S) */}
      <GlowBeam
        position={[0, S, -S + H + SHIFT1]}
        args={[BEAM_SIZE, BEAM_SIZE, ARM]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[H + SHIFT2, S, -S + BEAM_LENGTH]}
        args={[ARM, BEAM_SIZE, BEAM_SIZE]}
        material={fresnelMat}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  ParticleFlow — glowing spheres flowing along the Penrose path      */
/* ------------------------------------------------------------------ */

const PARTICLE_COUNT = 70;
const CYCLE_DURATION = 15; // seconds for full loop

function ParticleFlow({ mouseRef }: { mouseRef: MouseRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  /*
   * Build a closed CatmullRom path tracing the top surface of all beams.
   *
   * Camera at [5,5,5] → view direction [1,1,1]/√3
   * Screen-up ≈ [-1,2,-1]/√6 (component of world-up [0,1,0] ⊥ view dir)
   *
   * Top-surface offsets per arm axis (project screen-up ⊥ arm axis):
   *   Arm along X → offset BEAM_SIZE/2 * [0, 2/√5, -1/√5]
   *   Arm along Y → offset BEAM_SIZE/2 * [-1/√2, 0, -1/√2]
   *   Arm along Z → offset BEAM_SIZE/2 * [-1/√5, 2/√5, 0]
   */
  const curve = useMemo(() => {
    const hs = BEAM_SIZE / 2;
    const L = BEAM_LENGTH;

    // Top-surface offset vectors (normalised screen-up projected ⊥ each axis)
    const topX = new THREE.Vector3(0, (2 / Math.sqrt(5)) * hs, (-1 / Math.sqrt(5)) * hs);
    const topY = new THREE.Vector3((-1 / Math.sqrt(2)) * hs, 0, (-1 / Math.sqrt(2)) * hs);
    const topZ = new THREE.Vector3((-1 / Math.sqrt(5)) * hs, (2 / Math.sqrt(5)) * hs, 0);

    // Beam 0: offset (-S, 0, S), arm1 along +X, arm2 along +Y
    const b0a1Start = new THREE.Vector3(-S, 0, S).add(topX);
    const b0elbow = new THREE.Vector3(-S + L, 0, S).add(topX.clone().add(topY).multiplyScalar(0.5));
    const b0a2End = new THREE.Vector3(-S + L, L, S).add(topY);

    // Beam 1: offset (S, -S, 0), arm1 along +Y, arm2 along +Z
    const b1a1Start = new THREE.Vector3(S, -S, 0).add(topY);
    const b1elbow = new THREE.Vector3(S, -S + L, 0).add(topY.clone().add(topZ).multiplyScalar(0.5));
    const b1a2End = new THREE.Vector3(S, -S + L, L).add(topZ);

    // Beam 2: offset (0, S, -S), arm1 along +Z, arm2 along +X
    const b2a1Start = new THREE.Vector3(0, S, -S).add(topZ);
    const b2elbow = new THREE.Vector3(0, S, -S + L).add(topZ.clone().add(topX).multiplyScalar(0.5));
    const b2a2End = new THREE.Vector3(L, S, -S + L).add(topX);

    // The path: arm1→elbow→arm2 for each beam, then jump to next beam
    // CatmullRom with closed=true smoothly wraps the last→first connection
    return new THREE.CatmullRomCurve3(
      [
        b0a1Start,
        b0elbow,
        b0a2End,
        b1a1Start,
        b1elbow,
        b1a2End,
        b2a1Start,
        b2elbow,
        b2a2End,
      ],
      true, // closed
      "catmullrom",
      0.5,
    );
  }, []);

  const particleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#aaeeff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.06, 8, 6), []);

  // Reusable vectors for mouse ray unprojection (allocated once)
  const mouseWorld = useMemo(() => ({
    near: new THREE.Vector3(),
    far: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    toParticle: new THREE.Vector3(),
    pull: new THREE.Vector3(),
  }), []);

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    const baseProgress = (elapsed / CYCLE_DURATION) % 1;

    // Unproject mouse NDC into a world-space ray
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    mouseWorld.near.set(mx, my, -1).unproject(camera);
    mouseWorld.far.set(mx, my, 1).unproject(camera);
    mouseWorld.dir.subVectors(mouseWorld.far, mouseWorld.near).normalize();

    const PULL_RADIUS = 2.0;
    const PULL_STRENGTH = 0.3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (baseProgress + i / PARTICLE_COUNT) % 1;
      const point = curve.getPointAt(t);

      // Compute closest point on mouse ray to this particle
      mouseWorld.toParticle.subVectors(point, mouseWorld.near);
      const proj = mouseWorld.toParticle.dot(mouseWorld.dir);
      // Closest point on ray: near + dir * proj
      // Vector from closest point to particle:
      mouseWorld.pull
        .copy(mouseWorld.dir)
        .multiplyScalar(proj)
        .add(mouseWorld.near)
        .sub(point); // pull vector: from particle toward ray

      const dist = mouseWorld.pull.length();
      if (dist < PULL_RADIUS && dist > 0.001) {
        // Quadratic falloff: strength * (1 - dist/radius)^2
        const falloff = (1 - dist / PULL_RADIUS);
        const strength = PULL_STRENGTH * falloff * falloff;
        mouseWorld.pull.normalize().multiplyScalar(strength);
        point.add(mouseWorld.pull);
      }

      dummy.position.copy(point);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[sphereGeo, particleMat, PARTICLE_COUNT]}
      frustumCulled={false}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Bloom postprocessing                                               */
/* ------------------------------------------------------------------ */

function PostProcessing() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const dpr = gl.getPixelRatio();
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(size.width * dpr, size.height * dpr),
        0.6, // strength (reduced — was 1.2, washing out center/logo)
        0.4, // radius
        0.35, // threshold (raised — only brightest elements bloom)
      ),
    );
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
    composerRef.current?.render();
  }, 1);

  return null;
}

/* ------------------------------------------------------------------ */
/*  BackgroundGrid — faint dot grid for depth                          */
/* ------------------------------------------------------------------ */

function BackgroundGrid() {
  const pointsRef = useRef<THREE.Points>(null);

  // Create a grid of dots on a plane behind the scene
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const gridSize = 20; // -10 to +10
    const spacing = 0.8;
    const count = Math.floor(gridSize / spacing);

    for (let i = -count; i <= count; i++) {
      for (let j = -count; j <= count; j++) {
        // Place dots on a plane perpendicular to camera direction [1,1,1]
        // Use two vectors perpendicular to [1,1,1]:
        // v1 = [1, -1, 0] / sqrt(2)
        // v2 = [1, 1, -2] / sqrt(6)
        const u = i * spacing;
        const v = j * spacing;
        const x = u / Math.sqrt(2) + v / Math.sqrt(6);
        const y = -u / Math.sqrt(2) + v / Math.sqrt(6);
        const z = -2 * v / Math.sqrt(6);
        // Offset behind the scene along [1,1,1]
        const offset = -8;
        positions.push(
          x + offset / Math.sqrt(3),
          y + offset / Math.sqrt(3),
          z + offset / Math.sqrt(3),
        );
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#88ccff",
        size: 0.03,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // Subtle opacity pulse
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    material.opacity = 0.1 + 0.05 * Math.sin(t * 0.5);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function Scene({ mouseRef }: { mouseRef: MouseRef }) {
  return (
    <group>
      <BackgroundGrid />
      <PenroseTriangle mouseRef={mouseRef} />
      <ParticleFlow mouseRef={mouseRef} />
      <ArchitectureFragments mouseRef={mouseRef} />
      <PostProcessing />
    </group>
  );
}

export function ImpossibleScene() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
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
  }, [reducedMotion]);

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#06060a] relative">
      <Canvas
        frameloop={reducedMotion ? "demand" : "always"}
        orthographic
        camera={{
          zoom: 80,
          position: [5, 5, 5],
          near: -100,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
        style={{ background: "#06060a" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#06060a");
        }}
      >
        <Scene mouseRef={mouseRef} />
      </Canvas>
      {/* Radial vignette — darkens center slightly so the logo stays legible */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(6,6,10,0.55) 0%, rgba(6,6,10,0) 100%)",
        }}
      />
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <span
          className="text-7xl tracking-tight text-white select-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            WebkitTextStroke: "2px rgba(6,6,10,0.9)",
            paintOrder: "stroke fill",
            textShadow: "0 0 20px rgba(6,6,10,0.8), 0 0 40px rgba(6,6,10,0.5)",
          }}
        >
          B+O
        </span>
      </div>
    </div>
  );
}
