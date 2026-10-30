import { expect, installResponseCache, test } from '../../../../support/browser/response-cache/index.ts';
import { expectDeliveredFile } from '../../../../support/browser/downloads.ts';
import { openCatalogAndPinLayer, openExportCart } from '../../../../support/browser/export-cart.ts';

/**
 * Methodology: Opens the running app on the catalog page, pins "Santa Barbara County
 * Boundary" by its catalog layer id (dataset-151), opens the export cart, and clicks
 * Generate Links. The app, the layer catalog fetched from live services, the clicks, and
 * the browser download are real; Playwright captures the download and the test reads the
 * saved text file. The test takes the "Global export link" URL from it and opens that URL
 * in a brand-new browser context, a clean session with no pinned layers, storage, or
 * cookies carried over. Esri map responses come through the response cache in both
 * sessions. The test checks that the fresh session shows dataset-151 as pinned (its Unpin
 * button is present). It does not check that the shared view or filters are restored, or
 * that the cart opens. Layers are picked by id, never by list position. Expected to fail
 * until UCS-307 is resolved: today the link opens a session with only the default-pinned
 * layer.
 */
test('Opening a link from "Generate Links" in a new browser session shows the same layer pinned.', async ({
  page,
  browser,
  baseURL,
}) => {
  await openCatalogAndPinLayer(page, 'dataset-151');
  await openExportCart(page);

  const linksFile = await expectDeliveredFile(
    page,
    () => page.locator('#export-builder-generate-links-button').click(),
    /^v2-export-links-\d{8}-\d{6}\.txt$/,
  );
  const globalLine = linksFile.bytes
    .toString('utf8')
    .split('\n')
    .find((line) => line.startsWith('Global export link: '));
  expect(globalLine, 'links file has a "Global export link" line').toBeDefined();
  const globalUrl = globalLine!.replace('Global export link: ', '').trim();

  // `browser.newContext()` does not inherit the `use` options or the cache routing that the
  // default context gets, so set the viewport and install the response cache here.
  const freshSession = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    await installResponseCache(freshSession, baseURL);
    const freshPage = await freshSession.newPage();
    await freshPage.goto(globalUrl);
    await freshPage
      .locator('#layer-pin-dataset-151, #layer-unpin-dataset-151')
      .first()
      .waitFor({ state: 'attached', timeout: 20_000 });

    // The catalog has finished loading, so a pinned layer is already showing its Unpin
    // button. A short grace period covers a late restore and keeps a failing run inside
    // the 20 s duration budget.
    await expect(freshPage.locator('#layer-unpin-dataset-151')).toBeAttached({ timeout: 2_000 });
  } finally {
    await freshSession.close();
  }
});
