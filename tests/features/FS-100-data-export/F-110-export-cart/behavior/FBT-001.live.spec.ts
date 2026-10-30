import { expect, test } from '../../../../support/browser/response-cache/index.ts';
import {
  expectDeliveredFile,
  expectZipEntries,
  readZipJson,
} from '../../../../support/browser/downloads.ts';
import { openCatalogAndPinLayer, openExportCart } from '../../../../support/browser/export-cart.ts';

type Manifest = {
  layers: Array<{
    layerName: string;
    layerId: string;
    selectedFormatLabels: string[];
    selectedViews: Array<{ viewName: string }>;
  }>;
};

/**
 * Methodology: Opens the running app on the catalog page, pins "Santa Barbara County
 * Boundary" by its catalog layer id (dataset-151), opens the export cart, and clicks
 * Export ZIP. The app, the layer catalog fetched from live services, the clicks, and the
 * browser download are real; Playwright captures the download and the test reads the saved
 * file back with JSZip. Esri map responses come through the response cache. The test checks
 * the download file name, that the ZIP opens, that the manifest names the layer, its layer
 * id, the Metadata format, and the Active View, and that the layer folder holds its layer
 * selection and Active View selection files. It does not check that the package contains
 * actual layer data (an open product decision: today the ZIP holds only metadata), and it
 * checks no file contents beyond the manifest and selection files. Layers are picked by
 * id, never by list position, and the test does not assume an empty cart.
 */
test('Exporting a pinned layer from the export cart downloads a ZIP package that names that layer, its view, and the chosen format.', async ({
  page,
}) => {
  await openCatalogAndPinLayer(page, 'dataset-151');
  await openExportCart(page);

  const zipFile = await expectDeliveredFile(
    page,
    () => page.locator('#export-builder-export-zip-button').click(),
    /^v2-export-package-\d{8}-\d{6}\.zip$/,
  );

  const zip = await expectZipEntries(zipFile.bytes, [
    'export-manifest.json',
  ]);
  const manifest = await readZipJson<Manifest>(zip, 'export-manifest.json');
  const layer = manifest.layers.find((item) => item.layerId === 'dataset-151');
  expect(layer?.layerName).toBe('Santa Barbara County Boundary');
  expect(layer?.selectedFormatLabels).toEqual(['Metadata']);
  expect(layer?.selectedViews.map((view) => view.viewName)).toEqual(['Active View']);

  // The layer's folder name ends in the pinned layer's own uuid, so find it by the
  // selection file's layerId instead of guessing the folder name.
  const selectionPaths = Object.keys(zip.files).filter((path) =>
    path.endsWith('/layer-selection.json'),
  );
  const matchingFolders: string[] = [];
  for (const selectionPath of selectionPaths) {
    const selection = await readZipJson<{ layerId: string }>(zip, selectionPath);
    if (selection.layerId === 'dataset-151') {
      matchingFolders.push(selectionPath.replace(/\/layer-selection\.json$/, ''));
    }
  }
  expect(matchingFolders).toHaveLength(1);
  await expectZipEntries(zipFile.bytes, [
    `${matchingFolders[0]}/layer-selection.json`,
    `${matchingFolders[0]}/views/01-active-view/selection.json`,
  ]);
});
