import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ArchitectureFragments } from "./architecture-fragments";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

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
        opacity: 0.7,
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

function PenroseTriangle() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const fresnelMat = useMemo(() => createFresnelMaterial(), []);
  matRef.current = fresnelMat;

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      {/* Beam 0 — arm 1 along +X, arm 2 along +Y, offset (-S, 0, S) */}
      <GlowBeam
        position={[-S + H, 0, S]}
        args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[-S + BEAM_LENGTH, H, S]}
        args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]}
        material={fresnelMat}
      />

      {/* Beam 1 — arm 1 along +Y, arm 2 along +Z, offset (S, -S, 0) */}
      <GlowBeam
        position={[S, -S + H, 0]}
        args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[S, -S + BEAM_LENGTH, H]}
        args={[BEAM_SIZE, BEAM_SIZE, BEAM_LENGTH]}
        material={fresnelMat}
      />

      {/* Beam 2 — arm 1 along +Z, arm 2 along +X, offset (0, S, -S) */}
      <GlowBeam
        position={[0, S, -S + H]}
        args={[BEAM_SIZE, BEAM_SIZE, BEAM_LENGTH]}
        material={fresnelMat}
      />
      <GlowBeam
        position={[H, S, -S + BEAM_LENGTH]}
        args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]}
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

function ParticleFlow() {
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

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    const baseProgress = (elapsed / CYCLE_DURATION) % 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = (baseProgress + i / PARTICLE_COUNT) % 1;
      const point = curve.getPointAt(t);
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
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        1.2, // strength
        0.4, // radius
        0.2, // threshold
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

function Scene() {
  return (
    <group>
      <PenroseTriangle />
      <ParticleFlow />
      <ArchitectureFragments />
      <PostProcessing />
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
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
        style={{ background: "#06060a" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#06060a");
        }}
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
