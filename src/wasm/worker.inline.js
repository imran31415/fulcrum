// Inline Web Worker for WASM processing
// This worker is created as a Blob to avoid CORS issues

export const createWorker = () => {
  const workerCode = `
    // Worker-side code
    let wasmModule = null;
    let goInstance = null;
    let isReady = false;

    // Message handler
    self.addEventListener('message', async (e) => {
      const { type, id, payload } = e.data;
      
      try {
        switch (type) {
          case 'init':
            await initializeWasm(payload);
            self.postMessage({ type: 'ready', id });
            break;
            
          case 'process':
            if (!isReady) {
              throw new Error('WASM not initialized');
            }
            const result = await processInWorker(payload);
            self.postMessage({ type: 'result', id, payload: result });
            break;
            
          default:
            throw new Error('Unknown message type: ' + type);
        }
      } catch (error) {
        self.postMessage({ 
          type: 'error', 
          id, 
          payload: { 
            message: error.message,
            stack: error.stack 
          }
        });
      }
    });

    async function initializeWasm(payload) {
      const { wasmBytes, wasmExecJs } = payload;
      
      // Load the Go runtime
      if (wasmExecJs) {
        // Create a function from the wasm_exec.js code
        const initFunc = new Function(wasmExecJs);
        initFunc.call(self);
      }
      
      if (!self.Go) {
        throw new Error('Go runtime not available in worker');
      }
      
      // Initialize Go instance
      goInstance = new self.Go();
      
      // Instantiate WASM module
      const { instance } = await WebAssembly.instantiate(wasmBytes, goInstance.importObject);
      wasmModule = instance;
      
      // Run the Go program
      goInstance.run(instance);
      
      // Wait for WASM to be ready
      let attempts = 0;
      while (!self.wasmReady && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      if (!self.wasmReady || !self.processText) {
        throw new Error('WASM module failed to initialize properly');
      }
      
      isReady = true;
    }

    async function processInWorker(payload) {
      const { operation, text } = payload;
      
      // Call the WASM function
      const result = self.processText(operation, text);
      
      return result;
    }
  `;

  // Create blob and worker
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  // Clean up blob URL after worker is created
  URL.revokeObjectURL(workerUrl);

  return worker;
};