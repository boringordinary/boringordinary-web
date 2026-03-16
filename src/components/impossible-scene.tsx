import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

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

function Scene() {
  return (
    <group>
      <PenroseTriangle />
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
