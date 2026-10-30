/**
 * Reusable browser utility for consuming Server-Sent Events (SSE) via Fetch & ReadableStream.
 */
export async function* consumeSSE(url, options = {}) {
  const token = localStorage.getItem('concord_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    const msg = errBody?.error?.message || `HTTP ${response.status}: Stream request failed`;
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (const rawEvent of events) {
        if (!rawEvent.trim()) continue;
        const lines = rawEvent.split('\n');
        let eventType = 'message';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (dataStr) {
          try {
            const parsedData = JSON.parse(dataStr);
            yield { event: eventType, data: parsedData };
          } catch {
            yield { event: eventType, data: dataStr };
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // Stream cleanly aborted by user; end generator without bubbling error
      return;
    }
    throw err;
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}
