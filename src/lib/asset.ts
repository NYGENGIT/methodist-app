// Absolute, base-path-aware asset URLs that work from ANY route depth
// ('/' or '/tracker/') and on any deployment (domain root or a GitHub Pages
// project sub-path). NEXT_PUBLIC_BASE_PATH is injected at build time by the
// deploy workflow (empty for a user/org root site).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export function asset(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}
