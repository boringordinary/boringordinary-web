# @boringordinary/text-scramble Package Extraction

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract audiochan's text-scramble primitives into `@boringordinary/text-scramble`, then consume the package from both audiochan and web.

**Architecture:** Extract the core scramble algorithm into a `useTextScramble` hook. The existing `TextScramble` component becomes a thin wrapper around this hook. This enables both DOM rendering (audiochan) and headless use cases like `document.title` (web). `MotionTextScramble` and `CSSTextScramble` are ported as-is.

**Tech Stack:** React, motion/react, TypeScript, Bun, Turborepo

---

## Repos involved

| Repo | Path | Role |
|------|------|------|
| boringordinary | `/Users/fang/GithubProjects/boringordinary` | Package home (monorepo) |
| audiochan | `/Users/fang/GithubProjects/audiochan` | Current owner, becomes consumer |
| web | `/Users/fang/GithubProjects/web` | Consumer (title scramble) |

## Package API

```ts
// @boringordinary/text-scramble
export { useTextScramble } from "./use-text-scramble";        // headless hook → returns scrambled string
export { TextScramble, type TextScrambleProps } from "./text-scramble";  // motion component (wraps hook)
export { MotionTextScramble } from "./motion-text-scramble";  // memo'd motion component
export { CSSTextScramble } from "./css-text-scramble";        // CSS keyframe variant
```

---

### Task 1: Scaffold the package in boringordinary

**Files:**
- Create: `packages/text-scramble/package.json`
- Create: `packages/text-scramble/tsconfig.json`
- Create: `packages/text-scramble/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@boringordinary/text-scramble",
  "version": "0.1.0",
  "description": "RAF-based text scramble animations for React. Headless hook + ready-made components.",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target browser --external react --external motion && bun run build:types",
    "build:types": "tsc --emitDeclarationOnly --declaration --outDir dist",
    "prepublishOnly": "bun run build"
  },
  "peerDependencies": {
    "react": ">=18",
    "motion": ">=11"
  },
  "peerDependenciesMeta": {
    "motion": {
      "optional": true
    }
  },
  "devDependencies": {
    "react": "^19.2.4",
    "motion": "^12.36.0",
    "@types/react": "^19.2.14",
    "typescript": "^5.9.3"
  },
  "license": "MIT"
}
```

Note: `motion` is optional because `useTextScramble` and `CSSTextScramble` don't need it.

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Create src/index.ts barrel**

```ts
export { useTextScramble, type UseTextScrambleOptions } from "./use-text-scramble";
export { TextScramble, type TextScrambleProps } from "./text-scramble";
export { MotionTextScramble } from "./motion-text-scramble";
export { CSSTextScramble } from "./css-text-scramble";
```

---

### Task 2: Create `useTextScramble` hook

**Files:**
- Create: `packages/text-scramble/src/use-text-scramble.ts`

Extract the core RAF scramble loop from audiochan's `TextScramble` component into a standalone hook that returns the current display string. No DOM rendering, no motion dependency.

**Source reference:** `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/text-scramble.tsx`

The hook signature:

```ts
export interface UseTextScrambleOptions {
  duration?: number;           // seconds, default 0.8
  characterSet?: string;       // default "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  characterPool?: readonly string[];  // overrides characterSet if provided
  swapIntervalMs?: number;     // minimum ms between random swaps, 0 = every frame
  maxLength?: number;          // clamp visible characters
  trigger?: boolean | number;  // controls when animation runs
  onComplete?: () => void;
}

export function useTextScramble(text: string, options?: UseTextScrambleOptions): string
```

Implementation: port the `useEffect`/RAF logic from `TextScramble` exactly, but instead of rendering, return `displayText` from `useState`.

---

### Task 3: Port `TextScramble` component

**Files:**
- Create: `packages/text-scramble/src/text-scramble.tsx`

Refactor to use `useTextScramble` hook internally. The component becomes a thin wrapper: call the hook, render the result in a motion element.

Must preserve the exact same props interface (`TextScrambleProps`) and behavior:
- `as` prop for element type
- `children` as string input
- `className`, `role`, and spread `MotionProps`
- All scramble options forwarded to hook

---

### Task 4: Port `MotionTextScramble` component

**Files:**
- Create: `packages/text-scramble/src/motion-text-scramble.tsx`

Copy from `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/motion-text-scramble.tsx` as-is. This component has its own internal animation logic (different from `TextScramble`) so it stays self-contained.

---

### Task 5: Port `CSSTextScramble` component

**Files:**
- Create: `packages/text-scramble/src/css-text-scramble.tsx`

Copy from `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/css-text-scramble.tsx` as-is.

---

### Task 6: Build and verify the package

**Step 1: Install deps**

```bash
cd /Users/fang/GithubProjects/boringordinary && bun install
```

**Step 2: Build**

```bash
cd /Users/fang/GithubProjects/boringordinary && bun run build
```

**Step 3: Verify dist output exists**

```bash
ls packages/text-scramble/dist/
```

Expected: `index.js`, `index.d.ts`, plus per-module `.js` and `.d.ts` files.

---

### Task 7: Update audiochan to consume the package

**Files:**
- Modify: `/Users/fang/GithubProjects/audiochan/apps/web/package.json` — add `@boringordinary/text-scramble` dependency
- Modify: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/logo.tsx:18` — change import
- Modify: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/ascii.tsx:15` — change import
- Modify: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/index.ts:71` — change re-export
- Delete: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/text-scramble.tsx`
- Delete: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/motion-text-scramble.tsx`
- Delete: `/Users/fang/GithubProjects/audiochan/apps/web/src/features/shared/components/primitives/css-text-scramble.tsx`

**Step 1: Add dependency**

In `apps/web/package.json`, add to dependencies:
```json
"@boringordinary/text-scramble": "file:../../../../boringordinary/packages/text-scramble"
```

Use `file:` protocol for local dev. Switch to npm version before publishing.

**Step 2: Update imports**

`logo.tsx` line 18:
```ts
// before
import { TextScramble } from "./text-scramble";
// after
import { TextScramble } from "@boringordinary/text-scramble";
```

`ascii.tsx` line 15:
```ts
// before
import { TextScramble } from "./text-scramble";
// after
import { TextScramble } from "@boringordinary/text-scramble";
```

`shared/index.ts` line 71:
```ts
// before
export * from "./components/primitives/text-scramble";
// after
export { TextScramble, type TextScrambleProps } from "@boringordinary/text-scramble";
```

**Step 3: Delete old files**

```bash
rm apps/web/src/features/shared/components/primitives/text-scramble.tsx
rm apps/web/src/features/shared/components/primitives/motion-text-scramble.tsx
rm apps/web/src/features/shared/components/primitives/css-text-scramble.tsx
```

**Step 4: Install and typecheck**

```bash
cd /Users/fang/GithubProjects/audiochan && bun install && bun run typecheck
```

---

### Task 8: Update web to consume the package

**Files:**
- Modify: `/Users/fang/GithubProjects/web/package.json` — add dependency
- Modify: `/Users/fang/GithubProjects/web/src/routes/__root.tsx` — use `useTextScramble` hook

**Step 1: Add dependency**

```json
"@boringordinary/text-scramble": "file:../../boringordinary/packages/text-scramble"
```

**Step 2: Rewrite `__root.tsx`**

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTextScramble } from "@boringordinary/text-scramble";

function useScrambleTitle() {
  const title = useTextScramble("Boring+Ordinary", {
    characterPool: ["+", "-", "•", "~", "!", "=", "*", "#"],
    duration: 0.8,
  });
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function RootComponent() {
  useScrambleTitle();
  return <Outlet />;
}

export const Route = createRootRoute({
  component: RootComponent,
});
```

**Step 3: Install and typecheck**

```bash
cd /Users/fang/GithubProjects/web && bun install && bun run build
```

---

### Task 9: Final verification

**Step 1: Build all three projects**

```bash
cd /Users/fang/GithubProjects/boringordinary && bun run build
cd /Users/fang/GithubProjects/web && bun run build
cd /Users/fang/GithubProjects/audiochan && bun run typecheck
```

**Step 2: Update boringordinary CLAUDE.md**

Add `text-scramble` to the packages table and subtree docs.
