import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface UseTextScrambleOptions {
  duration?: number;
  characterSet?: string;
  characterPool?: readonly string[];
  swapIntervalMs?: number;
  maxLength?: number;
  trigger?: boolean | number;
  onComplete?: () => void;
}

const defaultChars = "BoringOrdinary";

export function useTextScramble(
  text: string,
  options: UseTextScrambleOptions = {},
): string {
  const {
    duration = 0.8,
    characterSet = defaultChars,
    characterPool,
    swapIntervalMs,
    maxLength,
    trigger = true,
    onComplete,
  } = options;

  const [displayText, setDisplayText] = useState(text);
  const animationRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const pool = useMemo<readonly string[]>(
    () =>
      characterPool && characterPool.length > 0
        ? characterPool
        : Array.from(characterSet),
    [characterPool, characterSet],
  );
  const poolRef = useRef(pool);

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  const charArrayRef = useRef<string[]>([]);
  const randomIndicesRef = useRef<number[]>([]);
  const resultBufferRef = useRef<string[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameSkipThreshold = 16;
  const lastSwapTimeRef = useRef<number>(0);

  const precomputeRandomIndices = useCallback(
    (length: number) => {
      const indices = new Array(length);
      const charSetLength = pool.length;
      for (let i = 0; i < length; i++) {
        indices[i] = Math.floor(Math.random() * charSetLength);
      }
      return indices;
    },
    [pool.length],
  );

  useLayoutEffect(() => {
    const fullArray = Array.from(text);
    const lengthBound = Math.min(
      fullArray.length,
      maxLength ?? fullArray.length,
    );
    if (resultBufferRef.current.length !== lengthBound) {
      resultBufferRef.current = new Array(lengthBound);
    }
  }, [text, maxLength]);

  useEffect(() => {
    if (!trigger || animationRef.current) return;

    animationRef.current = true;
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;
    const totalDuration = duration * 1000;
    const fullArray = Array.from(text);
    const textLength = Math.min(fullArray.length, maxLength ?? fullArray.length);
    const textArray = fullArray.slice(0, textLength);

    charArrayRef.current = textArray;
    randomIndicesRef.current = precomputeRandomIndices(textLength * 20);
    let randomIndexCounter = 0;

    if (resultBufferRef.current.length !== textLength) {
      resultBufferRef.current = new Array(textLength);
    }

    const animate = (currentTime: number) => {
      if (currentTime - lastFrameTimeRef.current < frameSkipThreshold) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      const startTime = startTimeRef.current ?? currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const revealedCount = Math.floor(progress * textLength);

      const shouldSwap =
        (swapIntervalMs ?? 0) <= 0 ||
        currentTime - lastSwapTimeRef.current >= (swapIntervalMs ?? 0);

      const result = resultBufferRef.current;

      for (let i = 0; i < textLength; i++) {
        if (charArrayRef.current[i] === " ") {
          result[i] = " ";
        } else if (i < revealedCount) {
          result[i] = charArrayRef.current[i];
        } else {
          if (shouldSwap || result[i] === undefined) {
            result[i] =
              poolRef.current[
                randomIndicesRef.current[
                  randomIndexCounter++ % randomIndicesRef.current.length
                ]
              ];
          }
        }
      }

      if (shouldSwap && (swapIntervalMs ?? 0) > 0) {
        lastSwapTimeRef.current = currentTime;
      }

      setDisplayText(result.join(""));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
        animationRef.current = false;
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      animationRef.current = false;
    };
  }, [
    trigger,
    text,
    duration,
    onComplete,
    precomputeRandomIndices,
    maxLength,
    swapIntervalMs,
  ]);

  return displayText;
}
