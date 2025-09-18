// Ultra-optimized WASM loader with aggressive performance optimizations
import './wasm_exec.js';
import { wasmBytes } from './wasmData.js';

// Global state management
let initPromise = null;
let goInstance = null;
let wasmInstance = null;
let isRunning = false;
let isReady = false;

// Performance monitoring
const perf = {
  startTime: 0,
  loadTime: 0,
  initTime: 0,
  totalTime: 0
};

// Optimized ready check with exponential backoff
function waitForReady(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    let attempts = 0;
    let delay = 1; // Start with 1ms
    
    const check = () => {
      attempts++;
      
      // Check multiple conditions for readiness
      if (globalThis.wasmReady === true && 
          typeof globalThis.processText === 'function' && 
          isRunning && 
          !goInstance?.exited) {
        isReady = true;
        perf.initTime = performance.now() - startTime;
        console.log(`🚀 WASM ready in ${perf.initTime.toFixed(2)}ms (${attempts} attempts)`);
        return resolve();
      }
      
      // Check timeout
      if (performance.now() - startTime > timeoutMs) {
        const error = new Error(`WASM initialization timed out after ${timeoutMs}ms (${attempts} attempts)`);
        error.details = {
          wasmReady: globalThis.wasmReady,
          processTextAvailable: typeof globalThis.processText === 'function',
          isRunning,
          goExited: goInstance?.exited,
          attempts
        };
        return reject(error);
      }
      
      // Exponential backoff with cap at 50ms
      delay = Math.min(delay * 1.1, 50);
      setTimeout(check, delay);
    };
    
    // Start checking immediately
    check();
  });
}

// Optimized cleanup
function cleanup() {
  if (globalThis.cleanupWasm && typeof globalThis.cleanupWasm === 'function') {
    try {
      globalThis.cleanupWasm();
    } catch (e) {
      console.warn('Error during WASM cleanup:', e);
    }
  }
  
  goInstance = null;
  wasmInstance = null;
  isRunning = false;
  isReady = false;
  
  // Clear any Go-related globals
  if (globalThis.wasmReady) globalThis.wasmReady = false;
}

export async function initWasm() {
  if (initPromise) {
    console.log('🔄 WASM initialization already in progress...');
    return initPromise;
  }
  
  initPromise = (async () => {
    perf.startTime = performance.now();
    
    try {
      // Aggressive cleanup of previous instance
      if (goInstance || isRunning) {
        console.log('🧹 Aggressive cleanup of previous WASM instance...');
        cleanup();
        // Minimal wait - we don't need long delays with proper cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Validate runtime availability
      if (typeof globalThis.Go !== 'function') {
        throw new Error('Go WASM runtime (wasm_exec.js) not loaded');
      }
      
      // Validate WASM data
      if (!wasmBytes || wasmBytes.length === 0) {
        throw new Error('WASM binary data not available or empty');
      }
      
      console.log(`⚡ Loading optimized WASM binary (${wasmBytes.length} bytes)...`);
      
      // Create Go instance with optimized settings
      goInstance = new globalThis.Go();
      
      // Enhanced error handling for Go runtime
      const originalExit = goInstance.exit;
      goInstance.exit = (code) => {
        console.log(`Go WASM program exited with code: ${code}`);
        isRunning = false;
        isReady = false;
        if (code !== 0) {
          console.error('Go WASM program exited with error code:', code);
        }
        if (originalExit) originalExit(code);
      };
      
      // Use the pre-decoded binary directly - maximum performance
      perf.loadTime = performance.now();
      const { instance } = await WebAssembly.instantiate(wasmBytes, goInstance.importObject);
      perf.loadTime = performance.now() - perf.loadTime;
      
      wasmInstance = instance;
      console.log(`💨 WebAssembly instantiated in ${perf.loadTime.toFixed(2)}ms`);
      
      // Start Go runtime with enhanced monitoring
      const runPromise = goInstance.run(instance);
      isRunning = true;
      
      // Enhanced promise handling
      runPromise.then(
        () => {
          console.log('ℹ️  Go WASM program completed normally');
          isRunning = false;
          isReady = false;
        },
        (error) => {
          console.error('💥 Go WASM program crashed:', error);
          isRunning = false;
          isReady = false;
        }
      );
      
      // Wait for readiness with optimized checking
      console.log('⏳ Waiting for WASM to become ready...');
      await waitForReady(12000); // Increased timeout for safety
      
      // Final validation
      if (typeof globalThis.processText !== 'function') {
        throw new Error('processText function not exported by WASM module');
      }
      
      perf.totalTime = performance.now() - perf.startTime;
      console.log(`🎉 WASM initialized successfully in ${perf.totalTime.toFixed(2)}ms`);
      console.log('📊 Performance breakdown:', {
        load: `${perf.loadTime.toFixed(2)}ms`,
        init: `${perf.initTime.toFixed(2)}ms`,
        total: `${perf.totalTime.toFixed(2)}ms`
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ WASM initialization failed:', error);
      
      // Enhanced error reporting
      if (error.details) {
        console.error('🔍 Error details:', error.details);
      }
      
      // Reset state on error
      initPromise = null;
      cleanup();
      
      throw error;
    }
  })();
  
  return initPromise;
}

// Optimized processText with enhanced error handling and recovery
export async function processText(operation, text) {
  // Fast path for already initialized WASM
  if (isReady && isRunning && typeof globalThis.processText === 'function') {
    try {
      return globalThis.processText(operation, text);
    } catch (error) {
      console.warn('⚠️  Fast path failed, attempting recovery...', error);
      // Fall through to recovery logic
    }
  }
  
  // Ensure WASM is initialized
  if (!isReady || !isRunning) {
    console.log('🔄 WASM not ready, initializing...');
    initPromise = null; // Force re-initialization
    await initWasm();
  }
  
  // Get the function with validation
  const fn = globalThis.processText;
  if (typeof fn !== 'function') {
    throw new Error('processText function not available after initialization');
  }
  
  try {
    const result = fn(operation, text);
    return result;
  } catch (error) {
    console.error('💥 Error calling processText:', error);
    
    // Enhanced recovery logic
    if (error.message && (
        error.message.includes('Go program has already exited') ||
        error.message.includes('null function') ||
        error.message.includes('WebAssembly')
    )) {
      console.log('🔧 Attempting WASM recovery...');
      
      // Full reset and retry
      initPromise = null;
      cleanup();
      
      try {
        await initWasm();
        return globalThis.processText(operation, text);
      } catch (retryError) {
        console.error('💥 Recovery failed:', retryError);
        throw new Error(`WASM recovery failed: ${retryError.message}`);
      }
    }
    
    throw error;
  }
}

// Diagnostic functions for debugging
export function getWasmStatus() {
  return {
    isReady,
    isRunning,
    hasGoInstance: !!goInstance,
    hasWasmInstance: !!wasmInstance,
    goExited: goInstance?.exited,
    wasmReady: globalThis.wasmReady,
    processTextAvailable: typeof globalThis.processText === 'function',
    performance: perf
  };
}

export function resetWasm() {
  console.log('🔄 Force resetting WASM...');
  initPromise = null;
  cleanup();
}

// Auto-cleanup on page unload (for web environments)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanup();
  });
}