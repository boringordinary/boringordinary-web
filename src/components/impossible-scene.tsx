import { Canvas } from "@react-three/fiber";

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
