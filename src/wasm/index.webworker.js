// Web Worker-based WASM wrapper
// Runs WASM in a separate thread to prevent UI blocking

import { createWorker } from './worker.inline';
import { wasmBase64 } from './wasmData';
import { wasmExecCode } from './wasmExecEmbedded';

class WasmWorkerManager {
  constructor() {
    this.worker = null;
    this.initPromise = null;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.isInitialized = false;
  }

  // Convert base64 to Uint8Array
  base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Load wasm_exec.js content
  async loadWasmExec() {
    // Return the embedded wasm_exec.js code
    return wasmExecCode;
  }

  // Send message to worker and wait for response
  sendMessage(type, payload) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      
      // Store the promise callbacks
      this.pendingMessages.set(id, { resolve, reject });
      
      // Set a timeout
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error(`Worker timeout for message ${id}`));
      }, 30000); // 30 second timeout
      
      // Update callbacks to clear timeout
      const originalResolve = this.pendingMessages.get(id).resolve;
      const originalReject = this.pendingMessages.get(id).reject;
      
      this.pendingMessages.get(id).resolve = (value) => {
        clearTimeout(timeout);
        this.pendingMessages.delete(id);
        originalResolve(value);
      };
      
      this.pendingMessages.get(id).reject = (error) => {
        clearTimeout(timeout);
        this.pendingMessages.delete(id);
        originalReject(error);
      };
      
      // Send the message
      this.worker.postMessage({ type, id, payload });
    });
  }

  // Initialize the worker and WASM
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('Initializing Web Worker for WASM...');
        
        // Create the worker
        this.worker = createWorker();
        
        // Set up message handler
        this.worker.addEventListener('message', (e) => {
          const { type, id, payload } = e.data;
          
          if (type === 'ready') {
            // Initialization complete
            const pending = this.pendingMessages.get(id);
            if (pending) {
              pending.resolve(true);
            }
          } else if (type === 'result') {
            // Processing complete
            const pending = this.pendingMessages.get(id);
            if (pending) {
              pending.resolve(payload);
            }
          } else if (type === 'error') {
            // Error occurred
            const pending = this.pendingMessages.get(id);
            if (pending) {
              pending.reject(new Error(payload.message || 'Worker error'));
            }
          }
        });
        
        // Set up error handler
        this.worker.addEventListener('error', (error) => {
          console.error('Worker error:', error);
          // Reject all pending messages
          for (const [id, pending] of this.pendingMessages) {
            pending.reject(error);
          }
          this.pendingMessages.clear();
        });
        
        // Load wasm_exec.js
        const wasmExecJs = await this.loadWasmExec();
        
        // Convert WASM base64 to bytes
        const wasmBytes = this.base64ToUint8Array(wasmBase64);
        
        // Initialize WASM in worker
        await this.sendMessage('init', {
          wasmBytes,
          wasmExecJs
        });
        
        this.isInitialized = true;
        console.log('Web Worker WASM initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize Web Worker:', error);
        this.cleanup();
        throw error;
      }
    })();

    return this.initPromise;
  }

  // Process text using the worker
  async process(operation, text) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    return this.sendMessage('process', {
      operation,
      text
    });
  }

  // Clean up resources
  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initPromise = null;
    this.isInitialized = false;
    this.pendingMessages.clear();
  }
}

// Create a singleton instance
let workerManager = null;

// Check if Web Workers are supported
function supportsWebWorkers() {
  return typeof Worker !== 'undefined' && 
         typeof Blob !== 'undefined' &&
         typeof URL !== 'undefined' &&
         typeof URL.createObjectURL === 'function';
}

// Public API
export async function initWasm() {
  if (!supportsWebWorkers()) {
    throw new Error('Web Workers are not supported in this environment');
  }
  
  if (!workerManager) {
    workerManager = new WasmWorkerManager();
  }
  
  return workerManager.init();
}

export async function processText(operation, text) {
  if (!workerManager) {
    await initWasm();
  }
  
  return workerManager.process(operation, text);
}

export function cleanupWasm() {
  if (workerManager) {
    workerManager.cleanup();
    workerManager = null;
  }
}