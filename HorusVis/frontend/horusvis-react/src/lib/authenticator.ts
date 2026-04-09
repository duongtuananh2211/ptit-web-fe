export class TokenExpirationError extends Error {
  isTokenExpirationError = true;
  constructor(message: string) {
    super(message);
  }
}

export class Authenticator extends EventTarget {
  private getToken: () => string;

  /**
   * @param getToken - A function that returns the current access token.
   *   Defaults to reading `authToken` from `localStorage`.
   */
  constructor(getToken: () => string = () => localStorage.getItem('authToken') ?? '') {
    super();
    this.getToken = getToken;
  }

  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const token = this.getToken();

    if (isTokenExpired(token)) {
      this.dispatchEvent(new CustomEvent('tokenExpired'));
      throw new TokenExpirationError('Token expired');
    }

    init = { ...init };
    init.mode = 'cors';
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };

    const resp = await fetch(url, init);

    if (resp.status === 401) {
      if (isTokenExpired(this.getToken())) {
        this.dispatchEvent(
          new CustomEvent('authError', { detail: await resp.clone().json().catch(() => null) }),
        );
      } else {
        // Token is still valid – retry once after a short delay.
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryResp = await fetch(url, init);
        if (retryResp.status === 401) {
          this.dispatchEvent(
            new CustomEvent('authError', {
              detail: await retryResp.clone().json().catch(() => null),
            }),
          );
        }
        return retryResp;
      }
    }

    return resp;
  }
}

export function isTokenExpired(token: string): boolean {
  const data = parseAuthToken(token);
  if (data) {
    const diffSeconds = data.exp - Date.now() / 1000;
    return diffSeconds <= 2;
  }
  return true;
}

function parseAuthToken(token: string): { exp: number } | null {
  const parts = token?.split('.') ?? [];
  if (parts.length >= 2) {
    try {
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
  return null;
}
