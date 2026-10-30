import { expect, test as base, type BrowserContext, type Route } from '@playwright/test';
import { entryPaths, readSavedResponse, saveResponse } from './disk-store.ts';
import { esriResponseSource } from './esri.ts';
import type { ResponseCacheSource } from './response-cache-source.ts';

/**
 * Response cache for live browser tests. It saves and replays responses from the live
 * services that map tests depend on, so repeat runs skip slow round trips and rate
 * limits:
 *
 * - Esri imagery, terrain, and metadata (`esri.ts`).
 *
 * Add another live service as its own source module in this folder.
 *
 * A response missing from the cache is fetched live and saved, so a new request never
 * fails a test. Only GET requests are cached. Each source decides which statuses are
 * saved; HTTP 429 and 5xx never are. `npm run test:refresh-map-cache` deletes the saved
 * responses and runs every live browser test to download them again.
 *
 * Live specs import `test` and `expect` from this module (lint-enforced).
 */
const RESPONSE_CACHE_SOURCES: readonly ResponseCacheSource[] = [esriResponseSource];

function responseHeaders(contentType: string | null): Record<string, string> {
  return {
    ...(contentType ? { 'content-type': contentType } : {}),
    'access-control-allow-origin': '*',
  };
}

/** Maps a failed live fetch to the browser error the live-outage checks already recognize. */
function abortReason(error: unknown): 'namenotresolved' | 'connectionreset' {
  return /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(String(error)) ? 'namenotresolved' : 'connectionreset';
}

async function serveCachedRequest(route: Route, source: ResponseCacheSource): Promise<void> {
  const request = route.request();
  if (request.method() !== 'GET') return route.fallback();
  const url = new URL(request.url());
  const keyUrl = source.keyUrl(url);
  const paths = entryPaths(source.directory(), keyUrl);

  const saved = await readSavedResponse(paths);
  if (saved) {
    await route.fulfill({
      status: saved.meta.status,
      headers: responseHeaders(saved.meta.contentType),
      body: saved.body,
    });
    return;
  }

  try {
    const response = await route.fetch();
    const body = await response.body();
    const contentType = response.headers()['content-type'] ?? null;
    if (source.isSavable(response.status(), contentType, body)) {
      await saveResponse(paths, keyUrl, response.status(), contentType, body);
    }
    await route.fulfill({ status: response.status(), headers: responseHeaders(contentType), body });
  } catch (error) {
    await route.abort(abortReason(error)).catch(() => undefined);
  }
}

function originOf(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined;
  try {
    return new URL(baseURL).origin;
  } catch {
    return undefined;
  }
}

/**
 * Routes a browser context's Esri requests through the response cache. The `test` fixture
 * does this for the default context; call it yourself on any extra context a test opens
 * with `browser.newContext()`.
 */
export async function installResponseCache(
  context: BrowserContext,
  baseURL: string | undefined,
): Promise<void> {
  const pageOrigin = originOf(baseURL);
  for (const source of RESPONSE_CACHE_SOURCES) {
    await context.route(
      (url) => source.matches(url, pageOrigin),
      (route) => serveCachedRequest(route, source),
    );
  }
}

export const test = base.extend<{ liveResponseCache: void }>({
  liveResponseCache: [
    async ({ context, baseURL }, use) => {
      await installResponseCache(context, baseURL);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export type { CDPSession, Page, TestInfo } from '@playwright/test';
