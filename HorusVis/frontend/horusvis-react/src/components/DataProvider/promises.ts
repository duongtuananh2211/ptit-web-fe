export function ignoreAborted<T>(promise: Promise<T>, controller: AbortController): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    promise
      .then((result) => resolve(result))
      .catch((error) => {
        if (!controller.signal.aborted && !error.isTokenExpirationError) {
          console.error("Uncanceled error", controller.signal, error.isTokenExpirationError);
          reject(error);
        }
      });
  });
}
