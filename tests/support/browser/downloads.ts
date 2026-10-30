import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { expect, type Download, type Page } from '@playwright/test';

export type DeliveredFile = {
  filename: string;
  bytes: Buffer;
};

/**
 * Runs `trigger` (for example a button click), waits for the browser download it
 * causes, and checks the file name pattern and that the file is not empty.
 */
export async function expectDeliveredFile(
  page: Page,
  trigger: () => Promise<void>,
  filenamePattern: RegExp,
): Promise<DeliveredFile> {
  const downloadPromise = page.waitForEvent('download');
  await trigger();
  const download: Download = await downloadPromise;

  const filename = download.suggestedFilename();
  expect(filename).toMatch(filenamePattern);

  const savedPath = await download.path();
  const bytes = await readFile(savedPath);
  expect(bytes.length).toBeGreaterThan(0);
  return { filename, bytes };
}

/** Opens ZIP bytes and checks that every required entry path exists. */
export async function expectZipEntries(
  zipBytes: Buffer,
  requiredEntryPaths: string[],
): Promise<JSZip> {
  const zip = await JSZip.loadAsync(zipBytes);
  const actualPaths = Object.keys(zip.files);
  for (const requiredPath of requiredEntryPaths) {
    expect(actualPaths, `ZIP entry ${requiredPath}`).toContain(requiredPath);
  }
  return zip;
}

/** Reads one ZIP entry and parses it as JSON. */
export async function readZipJson<T = unknown>(
  zip: JSZip,
  entryPath: string,
): Promise<T> {
  const entry = zip.file(entryPath);
  if (!entry) throw new Error(`ZIP has no entry ${entryPath}.`);
  return JSON.parse(await entry.async('string')) as T;
}
