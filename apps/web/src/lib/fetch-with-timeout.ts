export function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutParam?: number | { timeout?: number }
): Promise<Response> {
  let ms = 5000;
  if (typeof timeoutParam === "number") {
    ms = timeoutParam;
  } else if (timeoutParam?.timeout) {
    ms = timeoutParam.timeout;
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
}
