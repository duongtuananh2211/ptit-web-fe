import { TokenExpirationError } from "./TokenExpirationError";

export class Authenticator extends EventTarget {
  private token: string;

  constructor(token: string) {
    super();
    this.token = token;
  }

  async fetch(url: RequestInfo, init?: RequestInit) {
    if (isTokenExpired(this.token)) {
      this.dispatchEvent(new CustomEvent("tokenExpired"));
      throw new TokenExpirationError("Token expired");
    }

    init = init || {};
    init.mode = "cors";
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${this.token}`
    };

    const resp = await fetch(url, init);
    if (resp.status === 401) {
      if (isTokenExpired(this.token)) {
        this.dispatchEvent(new CustomEvent("authError", { detail: await resp.clone().json() }));
      } else {
        // Token is not expired, but we received a 401 error. This could be due to a temporary issue.
        // In this case, we can retry the request once to see if it succeeds.
        const maxRetries = 1;

        // Add a small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * maxRetries));

        // Create a new request with the same parameters
        const retryResp = await fetch(url, init);

        if (retryResp.status === 401) {
          this.dispatchEvent(
            new CustomEvent("authError", {
              detail: await retryResp.clone().json()
            })
          );
        }

        return retryResp;
      }
    }

    return resp;
  }
}

export function isTokenExpired(token: string) {
  const data = parseAuthToken(token);
  if (data) {
    const diffSeconds = data.exp - new Date().getTime() / 1000;
    return diffSeconds <= 2;
  }

  return true;
}

function parseAuthToken(token: string) {
  const [, payload] = token?.split(".") || [];
  if (payload) {
    return JSON.parse(atob(payload));
  }
}
