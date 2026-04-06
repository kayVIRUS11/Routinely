"use client";

import { useState, useEffect, DependencyList } from "react";

/**
 * React wrapper around Dexie's liveQuery for reactive DB reads.
 * Re-runs `querier` whenever the underlying Dexie tables change.
 *
 * @example
 * const tasks = useLiveQuery(() => db.tasks.filter(t => !t.is_deleted).toArray(), []);
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: DependencyList = [],
  defaultValue?: T,
): T | undefined {
  const [result, setResult] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Dynamically import Dexie liveQuery to avoid SSR issues
        const { liveQuery } = await import("dexie");
        const observable = liveQuery(querier);
        const subscription = observable.subscribe({
          next: (val) => {
            if (!cancelled) setResult(val);
          },
          error: (err) => {
            if (process.env.NODE_ENV === "development") {
              console.error("[useLiveQuery] liveQuery subscription error:", err);
            }
          },
        });
        return () => subscription.unsubscribe();
      } catch {
        // liveQuery not available — fall back to a one-time query
        try {
          const val = await querier();
          if (!cancelled) setResult(val);
        } catch {
          // ignore
        }
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;
    void run().then((fn) => { cleanup = fn; });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
