import { resolveTiming, settled, targetsOf, type MotionTiming } from './timing.ts';

/** Options for {@link flip}. */
export interface FlipOptions extends MotionTiming {
  /** Animate size changes by scaling. With `false`, only position animates. Defaults to true. */
  scale?: boolean;
}

/** The parts of a `DOMRect` that `flip` compares. */
export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Differences below these are layout rounding, not movement.
const minOffset = 0.5;
const minScale = 0.001;

/** Keyframes that move an element from `last` back to `first`, or null when nothing changed. */
export function flipKeyframes(first: RectLike, last: RectLike, scale: boolean): Keyframe[] | null {
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const sized = scale && first.width > 0 && first.height > 0 && last.width > 0 && last.height > 0;
  const sx = sized ? first.width / last.width : 1;
  const sy = sized ? first.height / last.height : 1;
  const moved = Math.abs(dx) >= minOffset || Math.abs(dy) >= minOffset;
  const resized = Math.abs(sx - 1) >= minScale || Math.abs(sy - 1) >= minScale;
  if (!moved && !resized) return null;
  const translate = `translate(${moved ? dx : 0}px, ${moved ? dy : 0}px)`;
  const transform = resized ? `${translate} scale(${sx}, ${sy})` : translate;
  return [
    { transformOrigin: '0 0', transform },
    { transformOrigin: '0 0', transform: 'none' },
  ];
}

// Disconnected and display: none elements have no boxes.
const rendered = (element: Element): boolean => element.getClientRects().length > 0;

// The flip animation running on each element, so a new flip can start from where it is.
const running = new WeakMap<Element, Animation>();

/**
 * Runs `change`, then animates each target from where it was to where it is.
 * Targets are taken when `flip` is called: elements that `change` adds are not
 * animated, and targets it removes, or that are not rendered before or after
 * it (`display: none`, `hidden`), are skipped. Resolves when every animation
 * finishes; rejects only if `change` throws.
 */
export async function flip(
  targets: Element | Iterable<Element>,
  change: () => void | Promise<void>,
  options: FlipOptions = {},
): Promise<void> {
  const { scale = true, signal } = options;
  const elements = targetsOf(targets);
  // Measured before cancelling, so the rects include any running flip. An element
  // that is not rendered has no place to start from: its rect is the viewport origin.
  const first = new Map(elements.filter(rendered).map((element) => [element, element.getBoundingClientRect()]));
  for (const element of elements) running.get(element)?.cancel();
  await change();
  if (signal?.aborted) return;
  const animations: Animation[] = [];
  for (const [element, rect] of first) {
    if (!rendered(element)) continue;
    const { duration, easing, delay } = resolveTiming(element, options, { duration: 'medium', easing: 'standard' });
    if (duration === 0) continue;
    const keyframes = flipKeyframes(rect, element.getBoundingClientRect(), scale);
    if (keyframes === null) continue;
    const animation = element.animate(keyframes, { duration, easing, delay });
    running.set(element, animation);
    void animation.finished
      .catch(() => undefined)
      .then(() => {
        if (running.get(element) === animation) running.delete(element);
      });
    animations.push(animation);
  }
  await settled(animations, signal);
}
