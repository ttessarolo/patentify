/**
 * Helper server-side per ottenere l'utente dalla sessione Neon Auth.
 *
 * Segue il pattern raccomandato da TanStack Start e Better Auth:
 * - TanStack Start: usare getRequest() e inoltrare gli headers alla API auth
 * - Better Auth: "Call getSession on the server passing request headers"
 *
 * Con Neon Auth (managed) validiamo la sessione chiamando l'API Neon Auth
 * con gli header della request in arrivo (Cookie, ecc.).
 * L'API Better Auth espone GET /get-session che, con cookie validi, restituisce { session, user }.
 */

/** URL Neon Auth: server usa NEON_AUTH_URL, fallback su VITE_ per compatibilità */
const NEON_AUTH_URL =
  (typeof process !== 'undefined' && process.env?.NEON_AUTH_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_NEON_AUTH_URL) ||
  '';

/** Risposta get-session di Better Auth / Neon Auth */
interface GetSessionResponse {
  session?: { userId: string };
  user?: { id: string };
}

/**
 * Ottiene lo user_id della sessione corrente chiamando l'API Neon Auth con gli header della request.
 * Usa la Request corrente (es. da getRequest() in una server function) per inoltrare Cookie e altri header.
 *
 * @param request - Request object della richiesta corrente (da getRequest() in @tanstack/react-start/server)
 * @returns user_id se sessione valida, null altrimenti
 */
export async function getUserIdFromRequest(
  request: Request | null
): Promise<string | null> {
  if (!NEON_AUTH_URL) {
    return null;
  }
  if (!request?.headers) {
    return null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader?.trim()) {
    return null;
  }

  const baseUrl = NEON_AUTH_URL.replace(/\/$/, '');
  const getSessionUrl = `${baseUrl}/get-session`;

  try {
    const res = await fetch(getSessionUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as GetSessionResponse;
    const userId = data?.user?.id ?? data?.session?.userId ?? null;
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}
