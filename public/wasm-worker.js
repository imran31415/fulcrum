// Web Worker for WASM processing
// This runs in a separate thread to prevent UI blocking

let wasmInstance = null;
let goInstance = null;

// Import the wasm_exec.js runtime
importScripts('/wasm_exec.js');

// Initialize WASM
async function initWasm(wasmBytes) {
  try {
    if (!self.Go) {
      throw new Error('Go WASM runtime not loaded');
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
      throw new Error('WASM module failed to initialize');
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
        // Initialize WASM with provided bytes
        const result = await initWasm(data.wasmBytes);
        self.postMessage({ type: 'ready', success: result });
        break;
        
      case 'process':
        // Process text using WASM
        if (!self.processText) {
          throw new Error('WASM not initialized');
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