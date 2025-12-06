# Gemini proxy (Apps Script) — Example

This folder contains a minimal Google Apps Script example to act as a proxy for calling a Gemini API (or other AI endpoint). The proxy stores the sensitive API key in Script Properties and forwards requests from the frontend, so your frontend does not need to embed the long-lived key.

Important: Create this Apps Script project separately from your public Google Sheet project. Do NOT store the Gemini key in the same project that you made public for the sheet.

## Files

- `Code.gs` — example proxy implementation. It:
  - reads `GEMINI_API_KEY` from Script Properties
  - optionally validates `Origin` against `ALLOWED_ORIGINS`
  - performs simple rate limiting using `CacheService`
  - forwards the request to the Gemini API and returns the response

## Setup & Deploy

1. Open https://script.google.com/ and create a new project.
2. Replace the default code with the contents of `Code.gs`.
3. In the Apps Script editor: Open _Project Settings_ -> _Script properties_ and add a new property:
   - `GEMINI_API_KEY` = <your_gemini_api_key>

4. Edit `ALLOWED_ORIGINS` in `Code.gs` to include your frontend origins (e.g. `http://localhost:5173`, `https://yourdomain.example`). This helps reduce cross-site anonymous abuse.

5. Deploy > New deployment → Select _Web app_.
   - _Execute as_: `Me` (recommended)
   - _Who has access_: Choose based on your needs. If you want anonymous fetch from any browser, you may select `Anyone`, but this increases risk; prefer requiring users to sign in if possible.

6. After deploying, you'll get a Web App URL like:

```
https://script.google.com/macros/s/AKfycbxxxxxxx/exec
```

The string after `/s/` and before `/exec` is the deployment id. Your frontend can reconstruct the full URL if you store just the deployment id.

## Frontend example

If you used the repo's `utils/urlSecurity.ts` helpers, store the deployment id using `storeDeploymentId()` and reconstruct the URL with `reconstructGasUrl(id)`.

Example fetch from your frontend:

```ts
import { reconstructGasUrl } from '../utils/urlSecurity';

async function callGeminiViaGAS(deploymentId: string, payload: any) {
  const url = reconstructGasUrl(deploymentId);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
```

Notes:

- If you choose to restrict `Who has access` to Google accounts, you'll need to add client-side Google Sign-In and include an ID token that the Apps Script verifies before forwarding.
- Monitor usage and set alerts; if traffic spikes unexpectedly, rotate the Gemini key immediately.

## Security recommendations

- Keep this project separate from your public sheet project.
- Prefer `Execute as: Me` with restricted access and require sign-in when possible.
- Use `ALLOWED_ORIGINS` to reduce anonymous abuse, and implement additional server-side checks if needed.
- Use Scripts Properties (or a secret manager) — do not hardcode the key into `Code.gs`.
- Monitor and set quota limits, and enable alerts in the provider console if available.
