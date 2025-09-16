import { waitForReady, getBridge } from './bridgeRegistry.native';

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
