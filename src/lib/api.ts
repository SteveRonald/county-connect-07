const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();

// Use a relative default base so the app works from subfolders (e.g. /county-connect-07).
const apiBase = (envBase && envBase.length > 0 ? envBase : "api").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${apiBase}/${normalizedPath}`;
}
