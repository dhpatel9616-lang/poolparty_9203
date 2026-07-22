import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClient } from '@supabase/supabase-js';

const PFX = 'sb_';

const canUseCookies = (() => {
  let cache: boolean | null = null;
  return () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    if (cache !== null) return cache;
    const k = '__sb_test__';
    try {
      document.cookie = `${k}=1; Path=/; SameSite=None; Secure; Partitioned`;
      cache = document.cookie.includes(k);
      document.cookie = `${k}=; Path=/; Max-Age=0; SameSite=None; Secure`;
    } catch {
      cache = false;
    }
    return cache;
  };
})();

const fromCookies = () =>
  typeof document === 'undefined'
    ? []
    : document.cookie
        .split(';')
        .filter(Boolean)
        .map((c) => {
          const eqIndex = c.trim().indexOf('=');
          const name = eqIndex !== -1 ? c.trim().slice(0, eqIndex) : c.trim();
          const rest = eqIndex !== -1 ? c.trim().slice(eqIndex + 1) : '';
          return { name: name.trim(), value: decodeURIComponent(rest) };
        })
        .filter((c) => c.name);

const fromStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PFX))
      .map((k) => ({ name: k.slice(PFX.length), value: localStorage.getItem(k) || '' }));
  } catch {
    return [];
  }
};

const setCookie = (name: string, value: string, options?: any) => {
  if (typeof document === 'undefined') return;
  let s = `${name}=${encodeURIComponent(value)}; Path=${options?.path || '/'}; SameSite=None; Secure; Partitioned`;
  if (options?.maxAge) s += `; Max-Age=${options.maxAge}`;
  if (options?.domain) s += `; Domain=${options.domain}`;
  if (options?.expires) s += `; Expires=${new Date(options.expires).toUTCString()}`;
  document.cookie = s;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const host = window.location ? window.location.hostname : '';
  const domains = ['', host, host ? `.${host}` : ''].filter(Boolean);
  const variants = [
    'Path=/; SameSite=Lax',
    'Path=/; SameSite=None; Secure',
    'Path=/; SameSite=None; Secure; Partitioned',
  ];
  variants.forEach((attrs) => {
    document.cookie = `${name}=; Max-Age=0; ${attrs}`;
    domains.forEach((domain) => {
      document.cookie = `${name}=; Max-Age=0; Domain=${domain}; ${attrs}`;
    });
  });
};

const getToken = () =>
  (canUseCookies() ? fromCookies() : fromStorage()).find((c) => c.name.includes('auth-token'))?.value ?? null;

function patchFetch() {
  if (typeof window === 'undefined') return;
  if ((window as any).__sb_patched__) return;
  (window as any).__sb_patched__ = true;
  const orig = window.fetch.bind(window);
  (window as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getToken();
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;
    const origin = window.location ? window.location.origin : '';
    if (token && (url.startsWith('/') || (origin && url.startsWith(origin)))) {
      init = { ...(init || {}), headers: { ...(init?.headers || {}), 'x-sb-token': token } };
    }
    return orig(input, init);
  };
}

function safeInitPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const initPatch = () => patchFetch();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPatch);
  } else {
    initPatch();
  }
}

export function createClient() {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    safeInitPatch();
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          typeof document === 'undefined'
            ? []
            : canUseCookies()
            ? fromCookies()
            : fromStorage(),
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          if (canUseCookies()) {
            cookiesToSet.forEach(({ name, value, options }) =>
              value ? setCookie(name, value, options) : deleteCookie(name)
            );
          } else {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof window === 'undefined') return;
              try {
                value
                  ? localStorage.setItem(`${PFX}${name}`, value)
                  : localStorage.removeItem(`${PFX}${name}`);
              } catch {}
              if (value) setCookie(name, value, options);
            });
          }
        },
      },
    }
  );
}

export function createServerSideClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

// Service-role client for trusted, server-only code (e.g. API routes that must
// read/write tables with no public RLS policies, like OTP codes). NEVER import
// this from client components or anything bundled to the browser — the service
// role key bypasses RLS entirely.
export function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env (found in Supabase dashboard: Project Settings → API → service_role key). Do NOT prefix it with NEXT_PUBLIC_.'
    );
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}