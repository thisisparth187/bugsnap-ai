import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

// Workspace scripts execute from `server/`, while the documented .env lives at
// the repository root. Resolve it from this file so dev and built starts agree.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const port = Number(process.env.PORT || 8787);
createApp().listen(port, () => console.log(`BugSnap API listening on http://localhost:${port}`));
