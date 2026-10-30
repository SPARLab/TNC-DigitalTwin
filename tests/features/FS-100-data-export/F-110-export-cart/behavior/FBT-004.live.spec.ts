import { expect, test } from '../../../../support/browser/response-cache/index.ts';
import { expectDeliveredFile, expectZipEntries, readZipJson } from '../../../../support/browser/downloads.ts';
import {
  openCatalogAndPinLayerInCollapsedCategories,
  openExportCart,
} from '../../../../support/browser/export-cart.ts';

type Manifest = {
  layers: Array<{ layerId: string; selectedFormatLabels: string[] }>;
};

/**
 * Methodology: Opens the running app on the catalog page, expands the categories that hold
 * "iNaturalist Observations", pins it by its catalog layer id (inaturalist-obs), opens the
 * export cart, keeps the CSV format that is ticked by default, and clicks Export ZIP. The
 * app, the layer catalog fetched from live services, the clicks, and the browser download
 * are real; Playwright captures the download and the test reads the saved file back with
 * JSZip. Esri map responses come through the response cache. The test checks the download
 * file name, that the ZIP opens, that the manifest lists the iNaturalist layer with the CSV
 * format, and that the ZIP holds at least one file ending in .csv whose text has a header
 * row and at least one data row. It does not check CSV column values, observation values,
 * GeoJSON, or other data sources, and it ignores the cart's pending result count and size
 * estimate. Layers are picked by id, never by list position. Expected to fail until UCS-306
 * is resolved: today the package lists CSV in its manifest but contains no CSV file.
 */
test('Exporting an iNaturalist layer with CSV selected downloads a ZIP that contains a CSV file of observations.', async ({
  page,
}) => {
  await openCatalogAndPinLayerInCollapsedCategories(page, 'inaturalist-obs');
  await openExportCart(page);

  const zipFile = await expectDeliveredFile(
    page,
    () => page.locator('#export-builder-export-zip-button').click(),
    /^v2-export-package-\d{8}-\d{6}\.zip$/,
  );

  const zip = await expectZipEntries(zipFile.bytes, ['export-manifest.json']);
  const manifest = await readZipJson<Manifest>(zip, 'export-manifest.json');
  const layer = manifest.layers.find((item) => item.layerId === 'inaturalist-obs');
  expect(layer?.selectedFormatLabels).toEqual(['CSV']);

  // The assertions below are the behavior under test: the promised CSV file exists and has rows.
  const csvEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.csv'),
  );
  expect(
    csvEntries.map((entry) => entry.name),
    `CSV entries in ZIP (all entries: ${Object.keys(zip.files).join(', ')})`,
  ).not.toHaveLength(0);

  const csvLines = (await csvEntries[0].async('string'))
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  expect(csvLines.length, 'CSV needs a header row plus at least one observation row').toBeGreaterThanOrEqual(2);
});
