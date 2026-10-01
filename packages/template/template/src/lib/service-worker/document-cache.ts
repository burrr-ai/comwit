/** Cache only complete, explicitly reusable HTML. Never consume the original response body. */
export async function cacheableDocument(response: Response): Promise<Response | null> {
  const cacheControl = response.headers.get('cache-control') ?? ''
  if (
    response.status !== 200 ||
    !/(?:^|,)\s*public\b/i.test(cacheControl) ||
    !/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '') ||
    /(?:^|,)\s*(?:private|no-store|no-cache|must-revalidate)\b/i.test(cacheControl) ||
    /(?:^|,)\s*max-age\s*=\s*"?0"?(?:\s*,|\s*$)/i.test(cacheControl)
  ) return null

  try {
    const html = await response.clone().text()
    return /<\/html\s*>/i.test(html) ? response : null
  } catch {
    return null
  }
}
