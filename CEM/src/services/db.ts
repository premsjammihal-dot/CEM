import { useSyncExternalStore } from "react";
import type { DbShape } from "./types";
import { buildSeed } from "./seed";

/**
 * Local persistence engine that stands in for Supabase during development/demo.
 * Every domain service (auth.ts, events.ts, ...) reads/writes exclusively
 * through this module's `db()` / `mutateDb()` primitives, so swapping the
 * backend for Supabase only requires changing the service implementations —
 * component and type signatures stay identical. See supabase.ts.
 */

const KEY = "campusphere.db.v3";

let cache: DbShape | null = null;
let version = 0;
const listeners = new Set<() => void>();

function load(): DbShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbShape;
      if (parsed && Array.isArray(parsed.events) && parsed.settings) return parsed;
    }
  } catch {
    // corrupted storage -> reseed below
  }
  const seeded = buildSeed();
  persist(seeded);
  return seeded;
}

function persist(d: DbShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // storage quota exceeded — keep in-memory copy
  }
}

/** Read the current database snapshot (synchronous, cached). */
export function db(): DbShape {
  if (!cache) cache = load();
  return cache;
}

/** Apply a mutation transactionally, persist, and notify subscribers. */
export function mutateDb(fn: (d: DbShape) => void): void {
  const d = db();
  fn(d);
  persist(d);
  version++;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getVersion(): number {
  return version;
}

/** React hook: rerenders the caller whenever any table changes. */
export function useDbTick(): number {
  return useSyncExternalStore(subscribe, getVersion);
}

/** Wipe local state and reseed demo data (used in Admin → Settings). */
export function resetDemo(): void {
  cache = buildSeed();
  persist(cache);
  version++;
  listeners.forEach((l) => l());
}

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * NON-SECURE demo hash (djb2). Production uses Supabase Auth; passwords are
 * never stored in tables. See services/supabase.ts for the migration path.
 */
export function demoHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (((h << 5) + h + str.charCodeAt(i)) >>> 0);
  return h.toString(16);
}

export function qrCodeFor(eventId: string): string {
  const short = eventId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CS-${short}-${rand}`;
}
