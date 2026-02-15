export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let parsedBody = null;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        parsedBody?.error ||
        parsedBody?.message ||
        `HTTP ${response.status} ${response.statusText}`.trim();

      const requestError = new Error(errorMessage);
      requestError.status = response.status;
      requestError.body = parsedBody;
      throw requestError;
    }

    return parsedBody;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getErrorMessage(error, fallback = 'Unexpected error') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return fallback;
}

