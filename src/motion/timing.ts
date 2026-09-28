/** Timing options every motion helper takes. */
export interface MotionTiming {
  /** A duration token name (`--mb-motion-duration-<name>`), or milliseconds. */
  duration?: 'fast' | 'medium' | 'slow' | number;
  /** An easing token name (`--mb-motion-easing-<name>`), or any CSS easing. */
  easing?: 'standard' | 'enter' | 'exit' | 'spring' | (string & Record<never, never>);
  /** Milliseconds before the first animation starts. Defaults to 0. */
  delay?: number;
  /** Aborting it stops the helper and applies its end state. */
  signal?: AbortSignal;
}

export type DurationName = 'fast' | 'medium' | 'slow';
export type EasingName = 'standard' | 'enter' | 'exit' | 'spring';

/** Timing ready for `element.animate()`. */
export interface ResolvedTiming {
  duration: number;
  easing: string;
  delay: number;
}

// The tokens.css values, for pages that do not load it.
const durations: Record<DurationName, number> = { fast: 120, medium: 200, slow: 300 };
const easings: Record<EasingName, string> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 1, 1)',
  spring:
    'linear(0, 0.058 5%, 0.193 10%, 0.358 15%, 0.523 20%, 0.671 25%, 0.793 30%, 0.886 35%, 0.953 40%, 0.997 45%, 1.023 50%, 1.036 55%, 1.04 60%, 1.038 65%, 1.032 70%, 1.026 75%, 1.019 80%, 1.013 85%, 1.008 90%, 1.005 95%, 1)',
};

const isDurationName = (value: string): value is DurationName => Object.hasOwn(durations, value);
const isEasingName = (value: string): value is EasingName => Object.hasOwn(easings, value);
const nonNegative = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

/** Milliseconds in a CSS time such as `200ms` or `0.3s`; 0 for anything else. */
export function parseDuration(value: string): number {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim());
  if (match === null) return 0;
  return Number.parseFloat(match[1]) * (match[2] === 's' ? 1000 : 1);
}

/** Whether the user asks for reduced motion. */
export function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Resolves `timing` for `element`: token names from its computed style, the
 * built-in defaults when a token is unset, and all zeros under reduced motion.
 */
export function resolveTiming(
  element: Element,
  timing: MotionTiming,
  fallback: { duration: DurationName; easing: EasingName },
): ResolvedTiming {
  if (reducedMotion()) return { duration: 0, easing: 'linear', delay: 0 };
  const style = getComputedStyle(element);
  const duration = timing.duration ?? fallback.duration;
  const easing = timing.easing ?? fallback.easing;
  return {
    duration: typeof duration === 'number' ? nonNegative(duration) : durationToken(style, duration),
    easing: easingToken(style, easing),
    delay: nonNegative(timing.delay ?? 0),
  };
}

function durationToken(style: CSSStyleDeclaration, name: string): number {
  if (!isDurationName(name)) return 0;
  const raw = style.getPropertyValue(`--mb-motion-duration-${name}`).trim();
  return raw === '' ? durations[name] : parseDuration(raw);
}

function easingToken(style: CSSStyleDeclaration, value: string): string {
  const easing = isEasingName(value)
    ? style.getPropertyValue(`--mb-motion-easing-${value}`).trim() || easings[value]
    : value;
  return CSS.supports('animation-timing-function', easing) ? easing : 'ease-out';
}

/** `targets` as a new array without duplicates; later changes to a live collection do not affect it. */
export function targetsOf(targets: Element | Iterable<Element>): Element[] {
  return targets instanceof Element ? [targets] : [...new Set(targets)];
}

/**
 * Resolves when every animation has finished or been cancelled. Aborting
 * `signal` finishes the ones still running, which applies their end state.
 */
export function settled(animations: Animation[], signal: AbortSignal | undefined): Promise<void> {
  if (animations.length === 0) return Promise.resolve();
  const finish = (): void => {
    for (const animation of animations) {
      if (animation.playState !== 'idle' && animation.playState !== 'finished') animation.finish();
    }
  };
  signal?.addEventListener('abort', finish, { once: true });
  // `finished` rejects when an animation is cancelled; that still counts as settled.
  return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
    signal?.removeEventListener('abort', finish);
  });
}
