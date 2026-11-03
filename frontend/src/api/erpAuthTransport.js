import axios from 'axios';

// ERP_API_AUTH_TRANSPORT_V1
// Only the configured ERP backend and recognized same-origin API paths
// can receive the authenticated session token.
let sessionToken = null;

const API_PREFIXES = [
  '/api/',
  '/auth/',
  '/finance/',
  '/hrm/',
  '/procurement/',
  '/inventory/',
  '/production/',
  '/quality',
  '/sales/',
  '/maintenance/',
  '/compliance',
  '/crm',
  '/rmd',
  '/ai-analytics',
  '/products',
  '/field-officers',
  '/users/',
];

const apiBase = (
  import.meta.env.VITE_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : window.location.origin)
).replace(/\/+$/, '');

function isBackendRequest(inputUrl) {
  if (typeof window === 'undefined') return false;

  let target;
  let backend;

  try {
    target = new URL(inputUrl, window.location.origin);
    backend = new URL(apiBase);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(target.protocol)) return false;

  const pathAllowed = API_PREFIXES.some(
    (prefix) =>
      target.pathname === prefix.replace(/\/$/, '') ||
      target.pathname.startsWith(prefix)
  );

  if (!pathAllowed) return false;

  // Explicitly configured backend origin is trusted.
  if (target.origin === backend.origin) {
    // Prevent sending an ERP token to local loopback from a
    // remote, publicly hosted frontend.
    const loopback = ['localhost', '127.0.0.1', '::1'];
    if (
      loopback.includes(target.hostname) &&
      !loopback.includes(window.location.hostname)
    ) {
      return false;
    }
    return true;
  }

  // Vite proxies relative ERP API paths in development.
  return target.origin === window.location.origin;
}

export function setErpSessionToken(token) {
  sessionToken = typeof token === 'string' && token
    ? token
    : null;
}

axios.interceptors.request.use((config) => {
  if (
    sessionToken &&
    isBackendRequest(
      new URL(
        config.url || '',
        config.baseURL || window.location.origin
      ).href
    )
  ) {
    if (!config.headers?.has?.('Authorization') &&
        !config.headers?.Authorization) {
      config.headers.set('Authorization', `Bearer ${sessionToken}`);
    }
  }

  return config;
});

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);

    if (!sessionToken || !isBackendRequest(url)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (headers.has('Authorization')) {
      return originalFetch(input, init);
    }

    headers.set('Authorization', `Bearer ${sessionToken}`);

    if (input instanceof Request) {
      return originalFetch(new Request(input, { ...init, headers }));
    }

    return originalFetch(input, { ...init, headers });
  };
}
