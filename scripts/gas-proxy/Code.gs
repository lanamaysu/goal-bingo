/**
 * Gemini proxy (Apps Script) - Example
 *
 * Instructions:
 * 1) Create a new Google Apps Script project (separate from your public sheet project).
 * 2) Paste this file into the project.
 * 3) In the Apps Script editor, open Project Settings -> Script properties and add:
 *      GEMINI_API_KEY = <your_gemini_key>
 * 4) Set `ALLOWED_ORIGINS` below to the origins you expect to call from (e.g. your site, localhost).
 * 5) Deploy as a Web App. Keep the project separate from any publicly-exposed sheet project.
 *
 * Note: Replace the GEMINI API URL below with the real endpoint and adjust payload mapping.
 */

// Read the real API key from Script Properties (not stored in source)
const KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

// Edit this to match the origins (scheme + host) you want to allow. Empty array = no origin checking.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  // 'https://your-production-domain.example'
];

function doPost(e) {
  try {
    // Try to determine origin header (may be present as 'Origin')
    const origin = (e && e.headers && (e.headers.Origin || e.headers.origin)) || '';

    // Optional origin check - helps reduce anonymous cross-site use
    if (ALLOWED_ORIGINS.length > 0 && origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return respond({ error: 'forbidden', reason: 'origin_not_allowed' });
    }

    // Parse JSON body
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};

    // Simple rate limiting (script cache) — tune thresholds as needed
    const cache = CacheService.getScriptCache();
    const cacheKey = 'rl-' + (origin || 'anon');
    const count = parseInt(cache.get(cacheKey) || '0', 10);
    if (count > 200) {
      return respond({ error: 'rate_limited' });
    }
    cache.put(cacheKey, String(count + 1), 60); // 60s window

    // Build request to Gemini API
    // TODO: Replace with actual Gemini endpoint and adapt payload mapping
    const apiUrl = 'https://api.gemini.example/your-endpoint';
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + KEY,
      },
      payload: JSON.stringify(body),
      muteHttpExceptions: true,
    };

    const resp = UrlFetchApp.fetch(apiUrl, options);
    const text = resp.getContentText();
    // Pass through the API response body
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return respond({ error: String(err) });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
