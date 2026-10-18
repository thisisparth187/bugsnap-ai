const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '');

/** Use same-origin requests by default; a public API origin is opt-in for split deployments. */
export function apiUrl(path: string) {
  return `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
}
