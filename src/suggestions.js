let nextCallback = 0;

// Google's callback endpoint works from static hosting without a CORS proxy.
export default function suggestions(query, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const callback = `relatedMapSuggestions${nextCallback++}`;
    const script = document.createElement("script");
    let settled = false;
    let timeout;
    const cleanup = () => {
      settled = true;
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
      signal?.removeEventListener("abort", abort);
    };
    const fail = () => {
      if (settled) return;
      cleanup();
      reject(new Error("Suggestions are unavailable. Please try again."));
    };
    const abort = () => {
      if (settled) return;
      cleanup();
      reject(new DOMException("Request cancelled", "AbortError"));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    timeout = setTimeout(fail, 10000);
    window[callback] = (data) => {
      if (settled) return;
      cleanup();
      if (
        !Array.isArray(data) ||
        !Array.isArray(data[1]) ||
        !data[1].every((term) => typeof term === "string")
      ) {
        reject(new Error("Invalid suggestions. Please try again."));
        return;
      }
      resolve(data);
    };
    script.onerror = fail;
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${encodeURIComponent(query)}&callback=${callback}`;
    document.head.appendChild(script);
  });
}
