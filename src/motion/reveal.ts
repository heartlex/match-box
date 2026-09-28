import { resolveTiming, targetsOf, type MotionTiming } from './timing.ts';

/** Options for {@link reveal}. */
export interface RevealOptions extends MotionTiming {
  /** The entry animation. Defaults to a fade up by `0.5rem`. */
  keyframes?: Keyframe[] | PropertyIndexedKeyframes;
  /** Milliseconds between targets that enter the viewport together. Defaults to 40. */
  interval?: number;
  /** The `IntersectionObserver` threshold. Defaults to 0.1. */
  threshold?: number | number[];
  /** The `IntersectionObserver` root margin. Defaults to `'0px'`. */
  rootMargin?: string;
}

const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(0.5rem)' },
  { opacity: 1, transform: 'none' },
];

// For each waiting target, how to cancel the reveal that holds it, so a later reveal replaces it.
const holders = new WeakMap<Element, () => void>();

const byDocumentOrder = (a: Element, b: Element): number =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/**
 * Animates each target the first time it enters the viewport. Until then the
 * target shows the first keyframe; no inline style is written. Targets above
 * the viewport show at once, and focus moving into a waiting target reveals it.
 * Returns `stop()`, which stops observing and shows every waiting target.
 */
export function reveal(targets: Element | Iterable<Element>, options: RevealOptions = {}): () => void {
  const { keyframes = fadeUp, interval = 40, threshold = 0.1, rootMargin = '0px', signal } = options;
  const waiting = new Map<Element, { animation: Animation; delay: number }>();

  const release = (element: Element): Animation | undefined => {
    const held = waiting.get(element);
    if (held === undefined) return undefined;
    waiting.delete(element);
    holders.delete(element);
    observer.unobserve(element);
    element.removeEventListener('focusin', onFocusIn);
    return held.animation;
  };

  const onFocusIn = (event: Event): void => {
    release(event.currentTarget as Element)?.finish();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((entry) => entry.isIntersecting && waiting.has(entry.target))
        .map((entry) => entry.target)
        .sort(byDocumentOrder);
      entering.forEach((element, index) => {
        const delay = waiting.get(element)?.delay ?? 0;
        const animation = release(element);
        animation?.effect?.updateTiming({ delay: delay + index * interval });
        animation?.play();
      });
    },
    { threshold, rootMargin },
  );

  const stop = (): void => {
    for (const element of [...waiting.keys()]) release(element)?.cancel();
    observer.disconnect();
    signal?.removeEventListener('abort', stop);
  };

  if (signal?.aborted) return stop;
  for (const element of targetsOf(targets)) {
    holders.get(element)?.();
    const { duration, easing, delay } = resolveTiming(element, options, { duration: 'medium', easing: 'enter' });
    // A zero-size rect (display: none) has bottom 0, so it waits rather than counting as scrolled past.
    if (duration === 0 || element.getBoundingClientRect().bottom < 0) continue;
    const animation = element.animate(keyframes, { duration, easing, delay, fill: 'backwards' });
    animation.pause();
    waiting.set(element, { animation, delay });
    holders.set(element, () => release(element)?.cancel());
    element.addEventListener('focusin', onFocusIn);
    observer.observe(element);
  }
  signal?.addEventListener('abort', stop, { once: true });
  return stop;
}
