import axios from 'axios';
import type { UrduContentBundle } from '../types';
import type { UrduPassage } from '../data/urduPassageTypes';
import { setAdminUrduPassages } from '../data/urduPassages';
import {
  setAdminUrduPracticeContent,
  type AdminUrduPracticeContent,
  type ManagedUrduPracticeCategory,
} from '../data/urduPracticeContent';

/**
 * Pulls the admin-published Urdu content (test passages + practice items) from
 * the public `/urdu-content` endpoint and folds it into the client-side content
 * registries. Deliberately independent of the shared `api` client:
 *
 * - It must be reachable for guests, so no auth is needed.
 * - It is a progressive enhancement (bundled content is the floor), so it uses
 *   a short timeout and NEVER retries — a slow/unreachable API must never delay
 *   or break the typing surface. On any failure the bundled content is used
 *   unchanged.
 */

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const contentClient = axios.create({
  baseURL,
  timeout: 4000,
  headers: { 'Content-Type': 'application/json' },
});

const MANAGED_CATEGORIES = new Set<ManagedUrduPracticeCategory>([
  'characters',
  'combinations',
  'words',
  'sentences',
  'paragraphs',
]);

let inflight: Promise<boolean> | null = null;
let loadedOnce = false;

/** Validate the response envelope; the SPA fallback can return HTML, not JSON. */
function readBundle(payload: unknown): UrduContentBundle | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = (payload as { data?: unknown }).data;
  if (!candidate || typeof candidate !== 'object') return null;
  const { testPassages, practiceItems } = candidate as {
    testPassages?: unknown;
    practiceItems?: unknown;
  };
  if (!Array.isArray(testPassages) || !Array.isArray(practiceItems)) return null;
  return { testPassages, practiceItems } as UrduContentBundle;
}

async function loadAndRegister(): Promise<boolean> {
  try {
    const { data } = await contentClient.get('/urdu-content');
    const bundle = readBundle(data);
    if (!bundle) return false;

    const passages: UrduPassage[] = bundle.testPassages
      .filter(
        (p) =>
          p && typeof p._id === 'string' && typeof p.content === 'string' && p.content.trim().length > 0,
      )
      .map((p) => ({
        id: `admin-test:${p._id}`,
        difficulty: p.difficulty,
        duration: p.duration,
        text: p.content,
      }));

    const practice: AdminUrduPracticeContent[] = bundle.practiceItems
      .filter(
        (i) =>
          i &&
          typeof i._id === 'string' &&
          typeof i.text === 'string' &&
          MANAGED_CATEGORIES.has(i.category),
      )
      .map((i) => ({
        category: i.category,
        difficulty: i.difficulty,
        id: `admin-practice:${i._id}`,
        text: i.text,
      }));

    const changedPassages = setAdminUrduPassages(passages);
    const changedPractice = setAdminUrduPracticeContent(practice);
    return changedPassages || changedPractice;
  } catch {
    return false;
  }
}

/**
 * Fetch + register published Urdu content once per page load. Resolves to the
 * boolean "did the registry change" so callers can rebuild an idle session.
 * `force` re-fetches (used when an admin-surface or Urdu setup/session page
 * mounts) so freshly published content shows up without a full reload.
 */
export function ensureUrduContentLoaded(force = false): Promise<boolean> {
  if (inflight) return inflight;
  if (loadedOnce && !force) return Promise.resolve(false);
  inflight = loadAndRegister().finally(() => {
    loadedOnce = true;
    inflight = null;
  });
  return inflight;
}
