/**
 * Lightweight global data-event bus using the browser's native CustomEvent.
 *
 * Usage:
 *   // Fire after a mutation:
 *   dataEvents.emit('pr:changed');
 *
 *   // React hook — re-fetches whenever the event fires:
 *   useDataEvent('pr:changed', fetchStats);
 */

export const dataEvents = {
  emit: (eventName) => {
    window.dispatchEvent(new CustomEvent(`chakra:${eventName}`));
  },
};

/**
 * React hook that calls `callback` whenever `eventName` is emitted.
 * Safe: automatically removes the listener on unmount.
 */
import { useEffect } from 'react';

export function useDataEvent(eventName, callback) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(`chakra:${eventName}`, handler);
    return () => window.removeEventListener(`chakra:${eventName}`, handler);
  }, [eventName, callback]);
}
