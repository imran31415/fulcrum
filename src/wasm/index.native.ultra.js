// Ultra-optimized native WASM interface for React Native
import { waitForReady, getBridge, getBridgeStatus, enableBridgeDebugLogging } from './bridgeRegistry.ultra';

// Performance tracking
const perf = {
  initStartTime: 0,
  initEndTime: 0,
  processCallCount: 0,
  totalProcessTime: 0,
  averageProcessTime: 0
};

let isInitialized = false;
let lastError = null;

export async function initWasm(enableDebug = false) {
  if (isInitialized) {
    console.log('⚡ WASM already initialized (fast path)');
    return;
  }
  
  perf.initStartTime = performance.now();
  console.log('🚀 Initializing ultra-optimized native WASM...');
  
  if (enableDebug) {
    enableBridgeDebugLogging();
  }
  
  try {
    // Ultra-aggressive wait with detailed error reporting
    await waitForReady(25000); // Extended timeout for native
    
    perf.initEndTime = performance.now();
    const initTime = perf.initEndTime - perf.initStartTime;
    
    isInitialized = true;
    lastError = null;
    
    console.log(`🎉 Native WASM initialized in ${initTime.toFixed(2)}ms`);
    
    // Validate bridge is actually callable
    const bridge = getBridge();
    if (!bridge || typeof bridge.call !== 'function') {
      throw new Error('Bridge is not callable after initialization');
    }
    
    console.log('✅ Bridge validation passed');
    
  } catch (error) {
    lastError = error;
    isInitialized = false;
    
    console.error('❌ Native WASM initialization failed:', error);
    
    // Enhanced error reporting
    const bridgeStatus = getBridgeStatus();
    console.error('🔍 Bridge status at failure:', bridgeStatus);
    
    // Add actionable error details
    if (!bridgeStatus.hasBridge) {
      console.error('💡 Solution: Ensure setBridge() is called before initWasm()');
    } else if (!bridgeStatus.bridgeIsReadyFunction) {
      console.error('💡 Solution: Bridge missing isReady() function');
    } else if (bridgeStatus.bridgeIsReadyValue === false) {
      console.error('💡 Solution: Bridge isReady() returns false - check WebView initialization');
    }
    
    throw error;
  }
}

export async function processText(operation, text) {
  const processStart = performance.now();
  
  try {
    // Ensure initialization
    if (!isInitialized) {
      console.log('🔄 Auto-initializing WASM for processText...');
      await initWasm();
    }
    
    // Get bridge with validation
    const bridge = getBridge();
    if (!bridge || typeof bridge.call !== 'function') {
      throw new Error('WASM bridge not available or not callable');
    }
    
    // Enhanced call with error handling
    let result;
    try {
      result = await bridge.call(operation, text);
    } catch (bridgeError) {
      console.error('❌ Bridge call failed:', bridgeError);
      
      // Try to recover by re-initializing
      console.log('🔧 Attempting recovery...');
      isInitialized = false;
      await initWasm();
      
      const newBridge = getBridge();
      if (!newBridge || typeof newBridge.call !== 'function') {
        throw new Error('Bridge recovery failed - bridge still not callable');
      }
      
      result = await newBridge.call(operation, text);
      console.log('✅ Recovery successful');
    }
    
    // Performance tracking
    const processTime = performance.now() - processStart;
    perf.processCallCount++;
    perf.totalProcessTime += processTime;
    perf.averageProcessTime = perf.totalProcessTime / perf.processCallCount;
    
    if (processTime > 1000) { // Log slow calls
      console.warn(`⚠️  Slow processText call: ${processTime.toFixed(2)}ms for operation "${operation}"`);
    }
    
    return result;
    
  } catch (error) {
    const processTime = performance.now() - processStart;
    lastError = error;
    
    console.error(`❌ processText failed after ${processTime.toFixed(2)}ms:`, error);
    console.error('🔍 Operation:', operation);
    console.error('🔍 Text length:', text?.length || 'null');
    
    // Enhanced error context
    const bridgeStatus = getBridgeStatus();
    console.error('🔍 Bridge status:', {
      hasBridge: bridgeStatus.hasBridge,
      isReady: bridgeStatus.isReady,
      bridgeType: bridgeStatus.bridgeType
    });
    
    throw error;
  }
}

// Diagnostic and utility functions
export function getWasmStatus() {
  const bridgeStatus = getBridgeStatus();
  
  return {
    isInitialized,
    lastError: lastError?.message,
    performance: {
      ...perf,
      averageProcessTime: perf.averageProcessTime.toFixed(2) + 'ms',
      totalCalls: perf.processCallCount
    },
    bridge: bridgeStatus,
    recommendations: generateRecommendations(bridgeStatus)
  };
}

function generateRecommendations(bridgeStatus) {
  const recommendations = [];
  
  if (!bridgeStatus.hasBridge) {
    recommendations.push('Call setBridge() to register the bridge instance');
  }
  
  if (!bridgeStatus.isReady && bridgeStatus.hasBridge) {
    recommendations.push('Check WebView initialization and WASM loading');
  }
  
  if (perf.averageProcessTime > 1000) {
    recommendations.push('Consider optimizing text processing operations');
  }
  
  if (lastError) {
    recommendations.push('Check console logs for detailed error information');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System operating normally');
  }
  
  return recommendations;
}

export function resetWasm() {
  console.log('🔄 Force resetting native WASM...');
  isInitialized = false;
  lastError = null;
  
  // Reset performance counters
  Object.keys(perf).forEach(key => {
    perf[key] = 0;
  });
}

// Health check function
export async function healthCheck() {
  console.log('🏥 Running WASM health check...');
  
  try {
    const startTime = performance.now();
    
    // Test initialization
    await initWasm();
    
    // Test basic operation
    const testResult = await processText('test', 'hello world');
    
    const healthTime = performance.now() - startTime;
    
    console.log(`✅ Health check passed in ${healthTime.toFixed(2)}ms`);
    return {
      healthy: true,
      checkTime: healthTime,
      testResult,
      status: getWasmStatus()
    };
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return {
      healthy: false,
      error: error.message,
      status: getWasmStatus()
    };
  }
}

// Auto-retry wrapper for critical operations
export async function processTextWithRetry(operation, text, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for operation "${operation}"`);
        
        // Reset and re-initialize on retry
        resetWasm();
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
      }
      
      return await processText(operation, text);
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries + 1} attempts failed for operation "${operation}"`);
        break;
      }
    }
  }
  
  throw lastError;
}

// Export bridge status for external monitoring
export { getBridgeStatus, enableBridgeDebugLogging };