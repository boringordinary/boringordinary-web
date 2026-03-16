import { Canvas } from "@react-three/fiber";

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

function PenroseTriangle() {
  return (
    <group>
      {/* Beam 0 — arm 1 along +X, arm 2 along +Y, offset (-S, 0, S) */}
      <mesh position={[-S + H, 0, S]}>
        <boxGeometry args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
      <mesh position={[-S + BEAM_LENGTH, H, S]}>
        <boxGeometry args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>

      {/* Beam 1 — arm 1 along +Y, arm 2 along +Z, offset (S, -S, 0) */}
      <mesh position={[S, -S + H, 0]}>
        <boxGeometry args={[BEAM_SIZE, BEAM_LENGTH, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
      <mesh position={[S, -S + BEAM_LENGTH, H]}>
        <boxGeometry args={[BEAM_SIZE, BEAM_SIZE, BEAM_LENGTH]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>

      {/* Beam 2 — arm 1 along +Z, arm 2 along +X, offset (0, S, -S) */}
      <mesh position={[0, S, -S + H]}>
        <boxGeometry args={[BEAM_SIZE, BEAM_SIZE, BEAM_LENGTH]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
      <mesh position={[H, S, -S + BEAM_LENGTH]}>
        <boxGeometry args={[BEAM_LENGTH, BEAM_SIZE, BEAM_SIZE]} />
        <meshBasicMaterial color="#aaddff" wireframe />
      </mesh>
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
