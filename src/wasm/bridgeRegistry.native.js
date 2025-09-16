// Simple registry for the native WebView bridge
let bridge = null;
let resolvers = [];

export function setBridge(instance) {
  bridge = instance;
  const cbs = resolvers;
  resolvers = [];
  cbs.forEach((fn) => fn());
}

export function getBridge() {
  return bridge;
}

export function waitForReady(timeoutMs = 15000) {
  if (bridge && typeof bridge.isReady === 'function' && bridge.isReady()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WASM bridge init timed out')), timeoutMs);
    resolvers.push(() => {
      clearTimeout(t);
      resolve();
    });
  });
}
