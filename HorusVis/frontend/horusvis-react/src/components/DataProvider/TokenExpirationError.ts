export class TokenExpirationError extends Error {
  isTokenExpirationError = true;
  constructor(message: string) {
    super(message);
  }
}
