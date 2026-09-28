import { resolveTiming, settled, type MotionTiming } from './timing.ts';

/** Options for {@link exit}. */
export interface ExitOptions extends MotionTiming {
  /** The exit animation. Defaults to a fade out and `0.25rem` down. */
  keyframes?: Keyframe[] | PropertyIndexedKeyframes;
  /** Remove the target when the animation ends. Defaults to true. */
  remove?: boolean;
}

const fadeDown: Keyframe[] = [
  { opacity: 1, transform: 'none' },
  { opacity: 0, transform: 'translateY(0.25rem)' },
];

const exiting = new WeakMap<Element, Promise<void>>();

/**
 * Animates `target` out, then removes it. While it exits, the target is inert
 * and holds its last frame. `exit` does not move focus: move it first if it is
 * inside the target. A second call while the target exits returns the same promise.
 */
export function exit(target: Element, options: ExitOptions = {}): Promise<void> {
  const current = exiting.get(target);
  if (current !== undefined) return current;
  const { keyframes = fadeDown, remove = true, signal } = options;
  const wasInert = target.hasAttribute('inert');
  target.setAttribute('inert', '');
  const { duration, easing, delay } = resolveTiming(target, options, { duration: 'fast', easing: 'exit' });
  const animation =
    duration === 0 || signal?.aborted || !target.isConnected
      ? undefined
      : target.animate(keyframes, { duration, easing, delay, fill: 'forwards' });
  const done = settled(animation ? [animation] : [], signal).then(() => {
    // Only a running exit is shared; a finished one never blocks the next.
    exiting.delete(target);
    if (!remove) return;
    target.remove();
    // Put back later (an undo), the element is as it was before the exit.
    animation?.cancel();
    if (!wasInert) target.removeAttribute('inert');
  });
  exiting.set(target, done);
  return done;
}
