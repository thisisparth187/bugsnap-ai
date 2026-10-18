# BugSnap AI

BugSnap AI turns a screenshot of a broken interface into an editable, GitHub-ready bug report. Its differentiator is evidence-aware reporting: visible evidence, facts supplied by the user, missing information, and unverified hypotheses stay separate so a useful issue never quietly becomes a made-up diagnosis.

## Screenshots

Add product screenshots here when available:

<!-- ![BugSnap AI workspace](./docs/screenshots/workspace.png) -->

## Features

- Drag-and-drop or file-picker upload for PNG, JPEG, and WebP screenshots.
- Client and server validation, 8 MB limit, in-memory processing, and no screenshot storage.
- Gemma 4 multimodal analysis through Google's official `@google/genai` SDK.
- Editable issue title, summary, observed and expected behavior, environment, and reproduction steps.
- Explicit visible-evidence, missing-information, and unverified-hypothesis panels.
- Copy Markdown, download a descriptive `.md` file, retry recoverable failures, and start another report without a refresh.
- Responsive neo-brutalist interface with an optional dark theme.

## Architecture and request flow

```text
React + Vite client
        │ multipart/form-data (screenshot + description)
        ▼
Express + Multer API
        │ validate MIME, image signature, size, description
        ▼
@google/genai → Gemma 4 hosted model
        │ JSON response
        ▼
Zod schema validation → client editor → Markdown output
```

The API key is read only by the server. The screenshot is kept in memory for the duration of the request and is not written to disk or retained after the request completes.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Gemini API key from Google AI Studio for live generation

## Install and run

```bash
npm install
Copy-Item .env.example .env
# Edit .env and set GEMINI_API_KEY
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is `http://localhost:8787/api/health`.

For a production build:

```bash
npm run build
npm start
```

## Environment configuration

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | For live generation | Server-only Gemini API credential. |
| `GEMMA_MODEL` | No | Defaults to `gemma-4-26b-a4b-it`; the documented Gemma 4 alternative is `gemma-4-31b-it`. |
| `PORT` | No | API port, default `8787`. |
| `CLIENT_ORIGIN` | No | CORS origin, default `http://localhost:5173`. |
| `VITE_REPOSITORY_URL` | No | Optional repository URL shown in the top navigation. |

If `GEMINI_API_KEY` is absent, both servers still start. The UI will show the backend's configuration message after a generation attempt; it never falls back to a fake report or another provider.

## API

### `GET /api/health`

Returns `{ "status": "ok", "configured": true|false }`.

### `POST /api/bug-reports/generate`

Send `multipart/form-data` with:

- `screenshot`: one PNG, JPEG, or WebP image, maximum 8 MB.
- `description`: required user-provided context, maximum 5,000 characters.

Success returns:

```json
{
  "report": {
    "title": "...",
    "summary": "...",
    "observedBehavior": "...",
    "expectedBehavior": "...",
    "reproductionSteps": [],
    "environment": "...",
    "visibleEvidence": [],
    "missingInformation": [],
    "hypotheses": [],
    "severitySuggestion": "unknown"
  },
  "model": "gemma-4-26b-a4b-it"
}
```

Errors use `{ "error": { "code": "...", "message": "..." } }`. Provider errors, timeouts, malformed JSON, and schema violations do not expose stack traces or secrets.

## Test and build

```bash
npm test
npm run build
```

The automated suite covers the Zod report schema, fenced/malformed model JSON, empty descriptions, unsupported images, mocked successful generation, missing API keys, and Markdown generation. Live model generation is not exercised without your credential; provider behavior remains an external integration to verify with a real key.

## Privacy and security

- `GEMINI_API_KEY` is never sent to the browser or included in a client bundle.
- Client checks are mirrored by server checks; MIME type, file signature, file size, and description length are validated.
- Filenames are not trusted, and uploaded bytes are never saved to permanent storage.
- Image text is treated as untrusted prompt content, and the system instruction tells Gemma not to follow it.
- The server logs only a normalized provider failure code, never image contents or user descriptions.
- This MVP has no authentication, rate limiting, malware scanning, or persistent issue history. Add those controls before exposing it to untrusted public traffic.

## Known limitations

- A live Gemini API key and model availability are required for real reports.
- The app does not submit directly to GitHub; it produces Markdown ready for a GitHub Issue.
- Report editing currently covers the main issue fields and reproduction steps; evidence lists are intentionally read-only to preserve provenance.
- The hosted API and model have their own usage limits, terms, and data-handling policies; review those before production use.

## Attribution and licenses

BugSnap AI's source is MIT licensed. Google documents the Gemma 4 hosted models at [Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), including `gemma-4-26b-a4b-it`, `gemma-4-31b-it`, image understanding, and the Gemini API key requirement. Gemma 4 is subject to Google's separate [Gemma 4 license](https://ai.google.dev/gemma/apache_2) and applicable terms/policies; Google's documentation and code samples have their own attribution and license notices. Dependencies retain their respective licenses and are not relicensed by this repository.

## Hackathon fit

BugSnap AI is a strong fit for the live Hacktoberfest Open-Source AI Challenge Week 3 window (October 19–25, 2026) and the optional Best Use of Gemma category because Gemma is central to the product workflow. Confirm the current challenge page and submission requirements before submitting; do not claim eligibility from this README alone.
