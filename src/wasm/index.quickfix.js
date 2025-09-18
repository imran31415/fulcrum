// Quick fix for current chunked base64 WASM loading
// This optimizes your existing chunked array approach
import './wasm_exec.js';
import { wasmBase64 } from './wasmData.js';

let initPromise = null;
let goInstance = null;
let isRunning = false;

// Optimized base64 to Uint8Array conversion
function fastBase64ToUint8Array(base64String) {
  // Use built-in atob for speed
  const binaryString = globalThis.atob(base64String);
  const len = binaryString.length;
  
  // Pre-allocate array
  const bytes = new Uint8Array(len);
  
  // Use faster loop
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

// Async base64 processing to prevent blocking
async function processBase64Async(base64String) {
  const CHUNK_SIZE = 100000; // Process 100KB chunks at a time
  
  if (base64String.length <= CHUNK_SIZE) {
    // Small enough to process synchronously
    return fastBase64ToUint8Array(base64String);
  }
  
  // Process in chunks with yields
  console.log('Processing large WASM data in chunks...');
  const binaryString = globalThis.atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  let offset = 0;
  while (offset < len) {
    const chunkEnd = Math.min(offset + CHUNK_SIZE, len);
    
    // Process chunk
    for (let i = offset; i < chunkEnd; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    offset = chunkEnd;
    
    // Yield to prevent blocking if more to process
    if (offset < len) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return bytes;
}

function waitForReady(timeoutMs = 8000) {
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
      
      console.log('Loading WASM with optimized chunked processing...');
      goInstance = new globalThis.Go();
      
      // Get the base64 string - this will be joined from your chunks
      const base64String = typeof wasmBase64 === 'string' ? wasmBase64 : wasmBase64;
      
      // Convert with async processing to prevent blocking
      const bytes = await processBase64Async(base64String);
      
      console.log(`WASM binary loaded: ${bytes.length} bytes`);
      
      const { instance } = await WebAssembly.instantiate(bytes, goInstance.importObject);
      
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
      
      console.log('WASM initialized successfully with chunked optimization');
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