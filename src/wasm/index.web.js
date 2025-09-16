// Minimal WebAssembly loader for the web. Clean and explicit, no hidden fallbacks.
// Relies on Go's wasm_exec.js runtime and a base64-encoded WASM payload.

import './wasm_exec.js';
import { wasmBase64 } from './wasmData';

let initPromise = null;

function base64ToUint8Array(base64) {
  const binary = globalThis.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function waitForReady(timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (globalThis.wasmReady === true) return resolve();
      if (Date.now() - start > timeoutMs)
        return reject(new Error('WASM initialization timed out'));
      setTimeout(check, 10);
    };
    check();
  });
}

export async function initWasm() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof globalThis.Go !== 'function') {
      throw new Error('Go WASM runtime (wasm_exec.js) not loaded. Build step may be missing.');
    }
    const go = new globalThis.Go();
    const bytes = base64ToUint8Array(wasmBase64);
    const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
    // Start the Go runtime; it will not resolve until program exit.
    // We wait for a readiness signal from the module instead.
    go.run(instance);
    await waitForReady();
    if (typeof globalThis.processText !== 'function') {
      throw new Error('processText not exported by WASM module');
    }
  })();
  return initPromise;
}

export async function processText(operation, text) {
  await initWasm();
  const fn = globalThis.processText;
  if (typeof fn !== 'function') {
    throw new Error('processText not available');
  }
  return fn(operation, text);
}
