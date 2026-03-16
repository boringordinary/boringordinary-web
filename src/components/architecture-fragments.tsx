import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MouseRef } from "./impossible-scene";

/* ------------------------------------------------------------------ */
/*  Fresnel material factory (self-contained, lower opacity variant)   */
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

function createFragmentMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Color("#88ccff") },
      uFresnelPower: { value: 2.0 },
      uOpacity: { value: 0.04 },
      uRimOpacity: { value: 0.3 },
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
/*  Fragment configurations                                            */
/* ------------------------------------------------------------------ */

interface FragmentConfig {
  position: [number, number, number];
  scale: number;
  rotationSpeed: [number, number, number];
  type: "mini-penrose" | "staircase" | "impossible-column";
}

const FRAGMENTS: FragmentConfig[] = [
  {
    position: [-6, 3, -4],
    scale: 0.35,
    rotationSpeed: [0.4, 0.5, 0.3],
    type: "mini-penrose",
  },
  {
    position: [7, -2, -3],
    scale: 0.25,
    rotationSpeed: [0.3, 0.4, 0.5],
    type: "staircase",
  },
  {
    position: [-4, -4, -6],
    scale: 0.3,
    rotationSpeed: [0.5, 0.3, 0.4],
    type: "impossible-column",
  },
  {
    position: [5, 5, -5],
    scale: 0.2,
    rotationSpeed: [0.35, 0.6, 0.45],
    type: "mini-penrose",
  },
];

/* ------------------------------------------------------------------ */
/*  Shared edge material                                               */
/* ------------------------------------------------------------------ */

const EDGE_MATERIAL = new THREE.LineBasicMaterial({
  color: "#88ccff",
  transparent: true,
  opacity: 0.35,
});

/* ------------------------------------------------------------------ */
/*  FragmentBox — single box with edges (analogous to GlowBeam)        */
/* ------------------------------------------------------------------ */

interface FragmentBoxProps {
  position: [number, number, number];
  args: [number, number, number];
  material: THREE.ShaderMaterial;
}

function FragmentBox({ position, args, material }: FragmentBoxProps) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(...args);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [args]);

  return (
    <>
      <mesh position={position} material={material}>
        <boxGeometry args={args} />
      </mesh>
      <lineSegments position={position} geometry={edgesGeo} material={EDGE_MATERIAL} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Shape implementations                                              */
/* ------------------------------------------------------------------ */

function MiniPenrose({ material }: { material: THREE.ShaderMaterial }) {
  // 3 elongated bars at 120-degree intervals around Y axis
  const barLength = 3;
  const barSize = 0.4;
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const angle = (i * 2 * Math.PI) / 3;
        const cx = Math.cos(angle) * barLength * 0.4;
        const cz = Math.sin(angle) * barLength * 0.4;
        const ry = -angle;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, ry, 0]}>
            <FragmentBox
              position={[0, 0, 0]}
              args={[barLength, barSize, barSize]}
              material={material}
            />
          </group>
        );
      })}
    </group>
  );
}

function Staircase({ material }: { material: THREE.ShaderMaterial }) {
  // 4 ascending step boxes that loop back impossibly
  const stepW = 1.2;
  const stepH = 0.4;
  const stepD = 0.6;
  return (
    <group>
      <FragmentBox position={[-1, -0.6, 0]} args={[stepW, stepH, stepD]} material={material} />
      <FragmentBox position={[0, -0.2, 0.5]} args={[stepW, stepH, stepD]} material={material} />
      <FragmentBox position={[1, 0.2, 0]} args={[stepW, stepH, stepD]} material={material} />
      <FragmentBox position={[0, 0.6, -0.5]} args={[stepW, stepH, stepD]} material={material} />
    </group>
  );
}

function ImpossibleColumn({ material }: { material: THREE.ShaderMaterial }) {
  // Two vertical columns with a contradictory crossbar
  const colH = 3;
  const colW = 0.35;
  return (
    <group>
      <FragmentBox position={[-0.8, 0, 0]} args={[colW, colH, colW]} material={material} />
      <FragmentBox position={[0.8, 0, 0]} args={[colW, colH, colW]} material={material} />
      <FragmentBox
        position={[0, 0.3, 0]}
        args={[2.0, colW, colW]}
        material={material}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Fragment — wraps a shape with position, scale, and rotation        */
/* ------------------------------------------------------------------ */

function Fragment({ config, mouseRef }: { config: FragmentConfig; mouseRef: MouseRef }) {
  const outerRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => createFragmentMaterial(), []);
  matRef.current = material;

  const speed = config.rotationSpeed;
  const basePos = config.position;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Update material time uniform
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
    }

    // Rotate the fragment
    if (groupRef.current) {
      groupRef.current.rotation.x = t * speed[0];
      groupRef.current.rotation.y = t * speed[1];
      groupRef.current.rotation.z = t * speed[2];
    }

    // Parallax: shift position based on mouse, scaled by fragment size
    if (outerRef.current) {
      const parallaxX = mouseRef.current.x * config.scale * 0.5;
      const parallaxY = mouseRef.current.y * config.scale * 0.5;
      outerRef.current.position.set(
        basePos[0] + parallaxX,
        basePos[1] + parallaxY,
        basePos[2],
      );
    }
  });

  const ShapeComponent =
    config.type === "mini-penrose"
      ? MiniPenrose
      : config.type === "staircase"
        ? Staircase
        : ImpossibleColumn;

  return (
    <group ref={outerRef} position={config.position} scale={config.scale}>
      <group ref={groupRef}>
        <ShapeComponent material={material} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  ArchitectureFragments — renders all floating fragments             */
/* ------------------------------------------------------------------ */

export function ArchitectureFragments({ mouseRef }: { mouseRef: MouseRef }) {
  return (
    <group>
      {FRAGMENTS.map((config, i) => (
        <Fragment key={i} config={config} mouseRef={mouseRef} />
      ))}
    </group>
  );
}
