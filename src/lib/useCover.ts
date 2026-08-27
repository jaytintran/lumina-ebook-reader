import { useEffect, useState } from "react";
import { readObjectUrl } from "@/db/opfs";

// Global in-memory cache for cover object URLs to avoid disk I/O thrashing during scrolling
const coverCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

export function invalidateCoverCache(coverKey?: string) {
  if (coverKey) {
    const old = coverCache.get(coverKey);
    if (old) URL.revokeObjectURL(old);
    coverCache.delete(coverKey);
  } else {
    for (const url of coverCache.values()) {
      URL.revokeObjectURL(url);
    }
    coverCache.clear();
  }
}

/** Load a cover from OPFS with instant synchronous cache retrieval. */
export function useCover(coverKey?: string): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!coverKey) return null;
    return coverCache.get(coverKey) ?? null;
  });

  useEffect(() => {
    if (!coverKey) {
      setUrl(null);
      return;
    }

    const cached = coverCache.get(coverKey);
    if (cached) {
      setUrl(cached);
      return;
    }

    let alive = true;

    let promise = inFlightRequests.get(coverKey);
    if (!promise) {
      promise = readObjectUrl(coverKey).then((u) => {
        inFlightRequests.delete(coverKey);
        if (u) {
          coverCache.set(coverKey, u);
        }
        return u;
      });
      inFlightRequests.set(coverKey, promise);
    }

    promise.then((u) => {
      if (alive) {
        setUrl(u);
      }
    });

    return () => {
      alive = false;
    };
  }, [coverKey]);

  return url;
}
