import { expect, test } from '../../../../support/browser/response-cache/index.ts';
import { expectDeliveredFile } from '../../../../support/browser/downloads.ts';
import { openCatalogAndPinLayer, openExportCart } from '../../../../support/browser/export-cart.ts';

function decodeBase64UrlJson(encoded: string): { layers: Array<{ layerId: string }> } {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

/**
 * Methodology: Opens the running app on the catalog page, pins "Santa Barbara County
 * Boundary" by its catalog layer id (dataset-151), opens the export cart, and clicks
 * Generate Links. The app, the layer catalog fetched from live services, the clicks, and
 * the browser download are real; Playwright captures the download and the test reads the
 * saved text file. Esri map responses come through the response cache. The test checks the
 * download file name, that the text names both pinned layers (the default-pinned "Dangermond
 * Preserve Simple Boundary" and the newly pinned "Santa Barbara County Boundary"), and that
 * the "Global export link" URL carries a v2ExportBundle query parameter whose decoded
 * payload lists layer id dataset-151. It does not check that opening a share link restores
 * anything (an open product decision: no code reads v2ExportBundle). Layers are picked by
 * id, never by list position, and the test does not assume an empty cart.
 */
test('Generating links from the export cart downloads a text file with a link for each pinned layer.', async ({
  page,
}) => {
  await openCatalogAndPinLayer(page, 'dataset-151');
  await openExportCart(page);

  const linksFile = await expectDeliveredFile(
    page,
    () => page.locator('#export-builder-generate-links-button').click(),
    /^v2-export-links-\d{8}-\d{6}\.txt$/,
  );

  const text = linksFile.bytes.toString('utf8');
  expect(text).toContain('Dangermond Preserve Simple Boundary');
  expect(text).toContain('Santa Barbara County Boundary');

  const globalLine = text.split('\n').find((line) => line.startsWith('Global export link: '));
  expect(globalLine).toBeDefined();
  const globalUrl = new URL(globalLine!.replace('Global export link: ', '').trim());
  const bundle = globalUrl.searchParams.get('v2ExportBundle');
  expect(bundle).not.toBeNull();
  const payload = decodeBase64UrlJson(bundle!);
  expect(payload.layers.map((layer) => layer.layerId)).toContain('dataset-151');
});
