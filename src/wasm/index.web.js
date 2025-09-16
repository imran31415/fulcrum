// Minimal WebAssembly loader for the web. Clean and explicit, no hidden fallbacks.
// Relies on Go's wasm_exec.js runtime and a base64-encoded WASM payload.

import './wasm_exec.js';
import { wasmBase64 } from './wasmData';

let initPromise = null;
let goInstance = null;
let isRunning = false;

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
    try {
      // Clean up any previous instance
      if (goInstance && isRunning) {
        console.log('Cleaning up previous WASM instance...');
        if (typeof globalThis.cleanupWasm === 'function') {
          globalThis.cleanupWasm();
        }
        goInstance = null;
        isRunning = false;
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (typeof globalThis.Go !== 'function') {
        throw new Error('Go WASM runtime (wasm_exec.js) not loaded. Build step may be missing.');
      }
      
      goInstance = new globalThis.Go();
      const bytes = base64ToUint8Array(wasmBase64);
      const { instance } = await WebAssembly.instantiate(bytes, goInstance.importObject);
      
      // Start the Go runtime in a way that handles errors
      const runPromise = goInstance.run(instance);
      isRunning = true;
      
      // Handle if the Go program exits unexpectedly
      runPromise.then(
        () => {
          console.warn('Go WASM program exited');
          isRunning = false;
        },
        (error) => {
          console.error('Go WASM program crashed:', error);
          isRunning = false;
        }
      );
      
      await waitForReady();
      
      if (typeof globalThis.processText !== 'function') {
        throw new Error('processText not exported by WASM module');
      }
    } catch (error) {
      initPromise = null; // Allow retry on error
      goInstance = null;
      isRunning = false;
      throw error;
    }
  })();
  
  return initPromise;
}

export async function processText(operation, text) {
  // Check if WASM is still running
  if (!isRunning) {
    console.log('WASM not running, reinitializing...');
    initPromise = null;
    await initWasm();
  }
  
  const fn = globalThis.processText;
  if (typeof fn !== 'function') {
    throw new Error('processText not available');
  }
  
  try {
    return fn(operation, text);
  } catch (error) {
    console.error('Error calling processText:', error);
    // If the error indicates the Go program has exited, reset and retry once
    if (error.message && error.message.includes('Go program has already exited')) {
      console.log('Go program exited, attempting to reinitialize...');
      initPromise = null;
      isRunning = false;
      goInstance = null;
      await initWasm();
      // Try once more
      return globalThis.processText(operation, text);
    }
    throw error;
  }
}
