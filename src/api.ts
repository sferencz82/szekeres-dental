const baseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE_URL) ||
  (typeof globalThis !== 'undefined' && (globalThis as any)?.process?.env?.REACT_APP_API_BASE_URL) ||
  'http://localhost:4000';

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\//, '');
  return `${normalizedBase}/${normalizedPath}`;
};

export async function postJson<TBody, TResponse = unknown>(
  path: string,
  body: TBody,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'A kérés nem sikerült.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as unknown as TResponse;
}
