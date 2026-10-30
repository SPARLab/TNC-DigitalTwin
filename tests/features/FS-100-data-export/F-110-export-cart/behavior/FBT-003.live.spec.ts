import { expect, test } from '../../../../support/browser/response-cache/index.ts';
import {
  expectDeliveredFile,
  expectZipEntries,
  readZipJson,
} from '../../../../support/browser/downloads.ts';
import { openCatalogAndPinLayer, openExportCart } from '../../../../support/browser/export-cart.ts';

type Manifest = { layers: Array<{ layerId: string }> };

/**
 * Methodology: Opens the running app on the catalog page, pins "Santa Barbara County
 * Boundary" (dataset-151) next to the default-pinned "Dangermond Preserve Simple Boundary"
 * (dataset-115), then unpins dataset-115 with its Unpin button in the layer list, opens the
 * export cart, and clicks Export ZIP. The app, the layer catalog fetched from live services,
 * the clicks, and the browser download are real; Playwright captures the download and the
 * test reads the saved file back with JSZip. Esri map responses come through the response
 * cache. The test checks that the manifest lists only dataset-151 and that the ZIP holds
 * exactly one layer folder. It does not check that the package contains actual layer data
 * (an open product decision: today the ZIP holds only metadata) or any file contents beyond
 * the manifest. Layers are picked by id, never by list position.
 */
test('Unpinning a layer removes it from the exported package.', async ({ page }) => {
  await openCatalogAndPinLayer(page, 'dataset-151');

  await page.locator('#layer-unpin-dataset-115').click();
  await expect(page.locator('#layer-pin-dataset-115')).toBeAttached();

  await openExportCart(page);
  const zipFile = await expectDeliveredFile(
    page,
    () => page.locator('#export-builder-export-zip-button').click(),
    /^v2-export-package-\d{8}-\d{6}\.zip$/,
  );

  const zip = await expectZipEntries(zipFile.bytes, ['export-manifest.json']);
  const manifest = await readZipJson<Manifest>(zip, 'export-manifest.json');
  expect(manifest.layers.map((layer) => layer.layerId)).toEqual(['dataset-151']);

  // Count folders that hold files; the bare "layers/" directory entry is not a layer folder.
  const layerFolders = new Set(
    Object.values(zip.files)
      .filter((entry) => !entry.dir && entry.name.startsWith('layers/'))
      .map((entry) => entry.name.split('/')[1]),
  );
  expect(layerFolders.size).toBe(1);
});
