/**
 * React Hook that identifies which properties triggered a re-render
 * Usage:
 *  useWhyUpdate(props);
 *
 *  useWhyUpdate(props, { state1, state2 })
 *
 *  useWhyUpdate({ prop1, prop 2}, { state1, state2 }, obj3, obj4)
 *
 * todo:
 *  - Move constants to a config object
 */
// @ts-check
import { useRef, useEffect } from 'react';

/**
 * @typedef {Object} RefType
 * @prop {number} time Timestamp of the last update or render
 * @prop {number} count Recent update count
 * @prop {typeof setTimeout} [warn] Timeout ID for a high update count warning
 * @prop {Array.<Object>} args Properties to track for changes
 */

const HIGH_RENDER_COUNT = 2;
const WARN_COUNT = 1;
const RESET_COUNT_INTERVAL = 1000;
const SHOW_UNKNOWN_PROP_WARNING = true;

function findChanges(prev, next) {
  // Find the keys that have changed since last render
  const changed = Object.entries(next)
    .map(([key, val]) => (prev[key] !== val ? key : false))
    .filter(Boolean);

  // Are there any? Should we use singular or plural?
  const count = changed.length;

  if (!count) {
    // There was a re-render but we're not tracking it
    console.warn(
      `An unknown data item has triggered a re-render. Chances are you're not providing it to %creact-whyupdate`,
      'font-face: monospace; font-size: 0.65rem; font-style: italic;'
    );
    return;
  }

  // List all properties that have changed in this run
  console.log(
    `Key${count > 1 ? 's' : ''} %c ${changed.join(', ')} %c ${count > 1 ? 'have' : 'has'} changed`,
    'background: #FF5C5D; color: #F5F5F5; padding: 3px;',
    'color: "inherit", background: "inherit"'
  );
}

function useWhyUpdate(...args) {
  if (process.env.NODE_ENV !== 'production') {
    // Initialize ref for the initial render
    const ref = useRef({ time: Date.now(), count: 1, args, warn: undefined });

    // Previous props will be in ref.current.args
    const prev = ref.current.args;

    // compare previous and next only if previous exist
    if (prev && Array.isArray(args)) {
      // compare previous argument to the next one. Make sure indices are matched
      if (ref.current.count >= WARN_COUNT) {
        args.forEach((next, idx) => findChanges(prev[idx], next));
      }

      // if it's been a while since the last re-render then it's a good time to reset update count
      if (Date.now() - ref.current.time > RESET_COUNT_INTERVAL) {
        ref.current.count = 1;
      }

      // If the component has re-rendered too many times then we should display the hint
      // Make sure the hint is shown only once, hence the timeout (and clearTimeout)
      if (ref.current.count > HIGH_RENDER_COUNT) {
        const { count } = ref.current;
        clearTimeout(ref.current.warn);
        ref.current.warn = setTimeout(
          () =>
            console.log(
              `Re-rendering ${count} times in short succession. Looks like an opportunity for improvement.`
            ),
          1000
        );
      }
    }

    // Save data for the next update check
    useEffect(() => {
      ref.current = {
        time: Date.now(),
        count: (ref.current.count += 1),
        args,
        warn: ref.current.warn,
      };
    });

    return ref.current;
  }
}

export default useWhyUpdate;
