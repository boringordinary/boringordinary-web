# Impossible Object Homepage Background

## Overview

Replace the current concentric illusion canvas background with a Three.js rendered impossible object scene inspired by M.C. Escher and Roger Penrose. Central Penrose triangle with particles flowing along its impossible surface, surrounded by floating impossible architectural fragments. Ethereal glowing aesthetic on dark void.

## Core Composition

- Central **Penrose triangle** rendered in Three.js via `@react-three/fiber`
- Built from three rectangular beams that appear to connect in an impossible loop
- Orthographic camera locked at the "magic angle" (~35.264deg elevation, 45deg azimuth) where the illusion holds
- Beams are **translucent with glowing edges** — frosted glass with bright edge-lit contours
- Face opacity 0.05-0.1 with fresnel effect; edges emit soft bloom
- Color palette: cool white / ice-blue, subtle violet shift at base

## Particle Flow

- 60-80 small glowing spheres flow continuously along the triangle's top surface
- Path defined as cubic Bezier curves tracing all three beams in a continuous loop
- Path is mathematically continuous despite the geometry gap — sells the impossibility
- Particles are `InstancedMesh` at staggered offsets along the path
- Each particle has emissive glow + trailing fade
- Full cycle: ~15 seconds

## Surrounding Architecture

- 3-5 smaller impossible shapes (Penrose staircase segments, impossible columns)
- Placed at varying Z-depths with lower opacity
- Slowly rotating on their own axes (0.5-1deg/s)
- Creates depth without competing with central piece

## 3D Implementation

- **Camera**: Orthographic, locked at magic angle, no orbit controls
- **Penrose trick**: Three separate beams positioned so the gap is invisible from camera angle
- **Beam geometry**: `BoxGeometry` with custom `ShaderMaterial` (fresnel transparency)
- **Edge glow**: `EdgesGeometry` with emissive `LineBasicMaterial` (intensity ~2.0)
- **Bloom**: `EffectComposer` + `UnrealBloomPass` for glow effect
- **Particles**: `InstancedMesh` following predefined Bezier path

## Visual Effects

- No scene lights — everything self-illuminated via emissive materials
- Fresnel rim brightening on beam faces (edges facing away from camera glow more)
- Particles are additive-blended with high emissive values
- Central triangle has slow "breathing" pulse on edge glow (~8s period)
- Faint background grid/dot matrix for depth

## Interactivity

- **Particle pull**: Mouse position creates subtle gravitational pull on nearby particles
- **Parallax**: Surrounding architectural fragments shift based on mouse position
- **Glow intensify**: Mouse proximity to central triangle boosts glow
- **B+O text**: HTML overlay centered, `pointer-events-none`, above canvas

## Accessibility

- Respect `prefers-reduced-motion`: render single static frame
- Canvas is decorative — no ARIA role needed beyond the text overlay

## Tech Stack

- `@react-three/fiber` for React-Three.js integration
- `three` for geometry, materials, shaders
- Postprocessing via `@react-three/postprocessing` or Three.js `EffectComposer`
- Existing Tailwind for layout
