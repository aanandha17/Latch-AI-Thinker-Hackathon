type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** All page reads and tools share one cookie handshake, including React's development effect replay. */
export function createFollowupClient(fetcher: Fetcher, endpoint = "/api/followups") {
  let session: Promise<void> | undefined;
  const initialize = () =>
    (session ??= (async () => {
      const response = await fetcher(`${endpoint}?session=1`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Unable to start the approval session. Reload the page.",
        );
      await response.json();
    })().catch((error) => {
      session = undefined;
      throw error;
    }));
  return async function request<T>(path: string, body?: unknown): Promise<T> {
    await initialize();
    const response = await fetcher(
      `${endpoint}${path}`,
      body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { cache: "no-store" },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || `Request failed: HTTP ${response.status}`,
      );
    return result;
  };
}
export const requestFollowups = createFollowupClient((url, init) =>
  fetch(url, init),
);
