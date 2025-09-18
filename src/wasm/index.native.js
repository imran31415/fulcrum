import { waitForReady, getBridge, enableBridgeDebugLogging } from './bridgeRegistry.ultra';

export async function initWasm() {
  await waitForReady();
}

export async function processText(operation, text) {
  await initWasm();
  const bridge = getBridge();
  if (!bridge || typeof bridge.call !== 'function') {
    throw new Error('WASM bridge not available');
  }
  return bridge.call(operation, text);
}

// Enable debug logging for troubleshooting
export function enableWasmDebugLogging() {
  enableBridgeDebugLogging();
}
