// Enhanced WASM wrapper with Web Worker support
// This version uses a Web Worker to prevent UI blocking

import './wasm_exec.js';
import { wasmBase64 } from './wasmData';

let worker = null;
let initPromise = null;
let requestCounter = 0;
const pendingRequests = new Map();

function base64ToUint8Array(base64) {
  const binary = globalThis.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Check if Web Workers are available
function hasWorkerSupport() {
  return typeof Worker !== 'undefined' && 
         typeof window !== 'undefined' &&
         window.location.protocol !== 'file:';
}

// Create worker code as a string
const workerCode = `
  let goInstance = null;
  let wasmInstance = null;
  
  // Initialize WASM in worker
  async function initWasm(wasmBytes) {
    try {
      if (!self.Go) {
        throw new Error('Go WASM runtime not loaded in worker');
      }
      
      goInstance = new self.Go();
      const { instance } = await WebAssembly.instantiate(wasmBytes, goInstance.importObject);
      wasmInstance = instance;
      
      // Run the Go program
      goInstance.run(instance);
      
      // Wait for WASM to be ready
      let attempts = 0;
      while (!self.wasmReady && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!self.wasmReady) {
        throw new Error('WASM module failed to initialize in worker');
      }
      
      return true;
    } catch (error) {
      console.error('Worker WASM init error:', error);
      throw error;
    }
  }
  
  // Handle messages from main thread
  self.addEventListener('message', async (event) => {
    const { type, data } = event.data;
    
    try {
      switch (type) {
        case 'init':
          // Load wasm_exec.js runtime
          if (data.wasmExecCode) {
            eval(data.wasmExecCode);
          }
          // Initialize WASM with provided bytes
          const result = await initWasm(data.wasmBytes);
          self.postMessage({ type: 'ready', success: result });
          break;
          
        case 'process':
          // Process text using WASM
          if (!self.processText) {
            throw new Error('WASM not initialized in worker');
          }
          
          const output = self.processText(data.operation, data.text);
          self.postMessage({ 
            type: 'result', 
            data: output,
            requestId: data.requestId 
          });
          break;
          
        default:
          self.postMessage({ 
            type: 'error', 
            error: 'Unknown message type' 
          });
      }
    } catch (error) {
      self.postMessage({ 
        type: 'error', 
        error: error.toString(),
        requestId: event.data.data?.requestId 
      });
    }
  });
`;

// Initialize Web Worker
async function initWorker() {
  return new Promise((resolve, reject) => {
    try {
      // Create worker from Blob URL
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      
      // Handle worker messages
      worker.addEventListener('message', (event) => {
        const { type, data, requestId, error } = event.data;
        
        switch (type) {
          case 'ready':
            resolve(true);
            break;
            
          case 'result':
            // Resolve pending request
            const request = pendingRequests.get(requestId);
            if (request) {
              request.resolve(data);
              pendingRequests.delete(requestId);
            }
            break;
            
          case 'error':
            if (requestId) {
              const request = pendingRequests.get(requestId);
              if (request) {
                request.reject(new Error(error));
                pendingRequests.delete(requestId);
              }
            } else {
              console.error('Worker error:', error);
            }
            break;
        }
      });
      
      // Handle worker errors
      worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
        reject(error);
      });
      
      // Get wasm_exec.js code
      let wasmExecCode = '';
      try {
        // Try to fetch wasm_exec.js as text
        const response = await fetch('/wasm_exec.js');
        if (response.ok) {
          wasmExecCode = await response.text();
        }
      } catch (e) {
        console.warn('Could not fetch wasm_exec.js, will use fallback');
        // Import it directly as a fallback
        wasmExecCode = require('raw-loader!./wasm_exec.js').default || '';
      }
      
      // Send WASM bytes and runtime to worker
      const wasmBytes = base64ToUint8Array(wasmBase64);
      worker.postMessage({
        type: 'init',
        data: { 
          wasmBytes,
          wasmExecCode 
        }
      });
      
    } catch (error) {
      console.error('Failed to create worker:', error);
      reject(error);
    }
  });
}

// Fallback to main thread WASM (original implementation)
async function initMainThreadWasm() {
  if (typeof globalThis.Go !== 'function') {
    throw new Error('Go WASM runtime not loaded');
  }
  
  const go = new globalThis.Go();
  const bytes = base64ToUint8Array(wasmBase64);
  const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
  
  // Start Go runtime
  const runPromise = go.run(instance);
  
  // Wait for ready signal
  let attempts = 0;
  while (!globalThis.wasmReady && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!globalThis.wasmReady) {
    throw new Error('WASM module failed to initialize');
  }
  
  if (typeof globalThis.processText !== 'function') {
    throw new Error('processText not exported by WASM module');
  }
  
  return true;
}

// Initialize WASM (with worker if available)
export async function initWasm() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      if (hasWorkerSupport()) {
        console.log('Initializing WASM with Web Worker support...');
        await initWorker();
        console.log('WASM Worker initialized successfully');
      } else {
        console.log('Web Workers not available, using main thread WASM...');
        await initMainThreadWasm();
        console.log('Main thread WASM initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
      // Reset on error to allow retry
      initPromise = null;
      worker = null;
      throw error;
    }
  })();
  
  return initPromise;
}

// Process text using worker or main thread
export async function processText(operation, text) {
  await initWasm();
  
  if (worker) {
    // Use worker for processing
    return new Promise((resolve, reject) => {
      const requestId = `req_${++requestCounter}`;
      
      // Store pending request
      pendingRequests.set(requestId, { resolve, reject });
      
      // Set timeout for request
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('Processing timeout'));
      }, 30000); // 30 second timeout
      
      // Send processing request to worker
      worker.postMessage({
        type: 'process',
        data: {
          operation,
          text,
          requestId
        }
      });
      
      // Clear timeout on response
      const originalResolve = pendingRequests.get(requestId).resolve;
      pendingRequests.get(requestId).resolve = (data) => {
        clearTimeout(timeout);
        originalResolve(data);
      };
    });
  } else {
    // Fallback to main thread processing
    const fn = globalThis.processText;
    if (typeof fn !== 'function') {
      throw new Error('processText not available');
    }
    
    // Use setTimeout to at least allow one frame of UI update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    return fn(operation, text);
  }
}

// Clean up worker
export function cleanupWasm() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  initPromise = null;
  pendingRequests.clear();
}