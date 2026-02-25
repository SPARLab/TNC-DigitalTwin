interface ArcGISResponseError {
  message?: string;
  details?: unknown;
}

interface ArcGISJsonWithError {
  error?: ArcGISResponseError;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getArcGISErrorMessage(payload: unknown): string | null {
  if (!isObject(payload)) return null;
  const maybeError = (payload as ArcGISJsonWithError).error;
  if (!isObject(maybeError)) return null;

  const message = typeof maybeError.message === 'string' ? maybeError.message : 'Unknown ArcGIS error';
  const details = Array.isArray(maybeError.details)
    ? maybeError.details.filter((detail) => typeof detail === 'string').join(' ')
    : '';

  return details ? `${message} ${details}` : message;
}

export async function fetchArcGisJson(url: string, operation: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`${operation}: network failure (${message})`);
  }

  if (!response.ok) {
    throw new Error(`${operation}: HTTP ${response.status}`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`${operation}: malformed JSON response`);
  }

  if (!isObject(json)) {
    throw new Error(`${operation}: malformed response payload`);
  }

  const arcgisError = getArcGISErrorMessage(json);
  if (arcgisError) {
    throw new Error(`ArcGIS error: ${arcgisError}`);
  }

  return json;
}
