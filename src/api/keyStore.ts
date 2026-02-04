// Session-only API key store (gatekeeper). Key is never in the build.

const STORAGE_KEY = 'openrouter-gateway-api-key';

export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? '';
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}
