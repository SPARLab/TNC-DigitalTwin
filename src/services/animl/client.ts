export async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  signal?: AbortSignal,
): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    try {
      const response = await fetch(url, { signal });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Fetch attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}
