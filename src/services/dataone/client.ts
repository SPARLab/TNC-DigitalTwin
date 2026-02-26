import type { DataOneArcGISResponse } from '../../types/dataone';

export async function fetchJson(
  url: string,
  operation: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`${operation}: ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${operation}: malformed JSON response`);
  }
}

export async function fetchArcGisResponse(
  url: string,
  operation: string,
  signal?: AbortSignal,
): Promise<DataOneArcGISResponse> {
  return fetchJson(url, operation, signal) as Promise<DataOneArcGISResponse>;
}
