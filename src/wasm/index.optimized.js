// Optimized WASM loader using pre-decoded binary data
import './wasm_exec.js';
import { wasmBytes } from './wasmData.js';

let initPromise = null;
let goInstance = null;
let isRunning = false;

function waitForReady(timeoutMs = 5000) {
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
      if (goInstance && isRunning) {
        console.log('Cleaning up previous WASM instance...');
        goInstance = null;
        isRunning = false;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (typeof globalThis.Go !== 'function') {
        throw new Error('Go WASM runtime not loaded');
      }
      
      console.log('Loading WASM from pre-decoded binary...');
      goInstance = new globalThis.Go();
      
      // Use the pre-decoded bytes directly - no base64 processing!
      const { instance } = await WebAssembly.instantiate(wasmBytes, goInstance.importObject);
      
      const runPromise = goInstance.run(instance);
      isRunning = true;
      
      runPromise.then(
        () => { console.warn('Go WASM program exited'); isRunning = false; },
        (error) => { console.error('Go WASM program crashed:', error); isRunning = false; }
      );
      
      await waitForReady();
      
      if (typeof globalThis.processText !== 'function') {
        throw new Error('processText not exported by WASM module');
      }
      
      console.log('WASM initialized successfully with optimized binary loading');
    } catch (error) {
      initPromise = null;
      goInstance = null;
      isRunning = false;
      throw error;
    }
  })();
  
  return initPromise;
}

export async function processText(operation, text) {
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
    if (error.message && error.message.includes('Go program has already exited')) {
      console.log('Go program exited, attempting to reinitialize...');
      initPromise = null;
      isRunning = false;
      goInstance = null;
      await initWasm();
      return globalThis.processText(operation, text);
    }
    throw error;
  }
}
