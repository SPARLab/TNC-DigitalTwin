import { expect, type Page } from '@playwright/test';

/** The catalog list loads from live services; pin buttons appear several seconds after page load. */
const CATALOG_LOAD_TIMEOUT_MS = 20_000;

/** Opens the catalog page and pins one layer by its catalog layer id (never by list position). */
export async function openCatalogAndPinLayer(page: Page, layerId: string): Promise<void> {
  await page.goto('/catalog');
  const pinButton = page.locator(`#layer-pin-${layerId}`);
  await pinButton.waitFor({ state: 'attached', timeout: CATALOG_LOAD_TIMEOUT_MS });
  // The sidebar re-renders for a moment after the list loads. A click that lands during
  // that re-render does nothing, so retry the click until the unpin button appears.
  await expect(async () => {
    if ((await page.locator(`#layer-unpin-${layerId}`).count()) === 0) {
      await pinButton.click();
    }
    await expect(page.locator(`#layer-unpin-${layerId}`)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: CATALOG_LOAD_TIMEOUT_MS });
}

/** Opens the export cart modal from the header button. */
export async function openExportCart(page: Page): Promise<void> {
  await page.locator('#export-cart-button').click();
  await expect(page.locator('#export-builder-modal')).toBeVisible();
}

/**
 * Opens the catalog page and pins a layer that sits inside collapsed categories. The pin
 * button is in the page from the start but hidden and covered until every category above
 * it is expanded, so this expands those categories with their own toggle buttons first.
 */
export async function openCatalogAndPinLayerInCollapsedCategories(
  page: Page,
  layerId: string,
): Promise<void> {
  await page.goto('/catalog');
  const pinButton = page.locator(`#layer-pin-${layerId}`);
  await pinButton.waitFor({ state: 'attached', timeout: CATALOG_LOAD_TIMEOUT_MS });

  // Each ancestor `category-children-<id>` pairs with a `category-toggle-<id>` button.
  const categoryIds = await pinButton.evaluate((button) => {
    const ids: string[] = [];
    for (let node = button.parentElement; node; node = node.parentElement) {
      if (node.id.startsWith('category-children-')) {
        ids.unshift(node.id.replace('category-children-', ''));
      }
    }
    return ids;
  });
  for (const categoryId of categoryIds) {
    const toggle = page.locator(`#category-toggle-${categoryId}`);
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
  }

  await pinButton.click();
  await expect(page.locator(`#layer-unpin-${layerId}`)).toBeVisible();
}
