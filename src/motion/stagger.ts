import { resolveTiming, settled, targetsOf, type MotionTiming } from './timing.ts';

/** Options for {@link stagger}. */
export interface StaggerOptions extends MotionTiming {
  /** Milliseconds between the starts of consecutive targets. Defaults to 40. */
  interval?: number;
}

/**
 * Plays `keyframes` on each target in order, each starting `interval` ms after
 * the previous one. Later targets hold their first keyframe until they start.
 * Resolves when the last animation finishes.
 */
export async function stagger(
  targets: Element | Iterable<Element>,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: StaggerOptions = {},
): Promise<void> {
  const { interval = 40, signal } = options;
  if (signal?.aborted) return;
  const animations = targetsOf(targets).flatMap((element, index) => {
    const { duration, easing, delay } = resolveTiming(element, options, { duration: 'medium', easing: 'standard' });
    if (duration === 0) return [];
    return [element.animate(keyframes, { duration, easing, delay: delay + index * interval, fill: 'backwards' })];
  });
  await settled(animations, signal);
}
