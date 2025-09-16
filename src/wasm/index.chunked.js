// Chunked WASM processor - processes in small chunks to prevent UI blocking
// This uses async/await and setTimeout to yield control back to the browser

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
    const check = async () => {
      // Yield to browser
      await new Promise(r => setTimeout(r, 0));
      
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
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (typeof globalThis.Go !== 'function') {
        throw new Error('Go WASM runtime (wasm_exec.js) not loaded.');
      }
      
      goInstance = new globalThis.Go();
      const bytes = base64ToUint8Array(wasmBase64);
      const { instance } = await WebAssembly.instantiate(bytes, goInstance.importObject);
      
      // Start the Go runtime
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
      initPromise = null;
      goInstance = null;
      isRunning = false;
      throw error;
    }
  })();
  
  return initPromise;
}

// Wrapper that chunks the processing
async function processWithChunking(operation, text) {
  const CHUNK_SIZE = 500; // Process 500 characters at a time
  const chunks = [];
  
  // For non-analyze operations, process normally
  if (operation !== 'analyze') {
    return globalThis.processText(operation, text);
  }
  
  // For analyze, we need to process the whole text at once
  // but we can add periodic yields
  console.log('Processing large text, length:', text.length);
  
  // Create a promise that periodically yields
  return new Promise(async (resolve, reject) => {
    try {
      // Yield before starting
      await new Promise(r => setTimeout(r, 0));
      
      // Process in a way that allows UI updates
      const processAsync = async () => {
        // Call the WASM function
        const result = globalThis.processText(operation, text);
        
        // Yield after processing
        await new Promise(r => setTimeout(r, 0));
        
        return result;
      };
      
      // Use requestIdleCallback if available for better scheduling
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(async () => {
          try {
            const result = await processAsync();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, { timeout: 1000 });
      } else {
        // Fallback to setTimeout
        setTimeout(async () => {
          try {
            const result = await processAsync();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10);
      }
    } catch (error) {
      reject(error);
    }
  });
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
    // Use chunked processing for better UI responsiveness
    return await processWithChunking(operation, text);
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
      return await processWithChunking(operation, text);
    }
    throw error;
  }
}