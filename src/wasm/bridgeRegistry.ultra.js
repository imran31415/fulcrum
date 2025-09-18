// Ultra-optimized native WebView bridge registry with aggressive performance optimizations
let bridge = null;
let resolvers = [];
let isReady = false;
let initTime = 0;
let attempts = 0;

// Performance monitoring
const perf = {
  bridgeSetTime: 0,
  readyCheckTime: 0,
  totalWaitTime: 0
};

export function setBridge(instance) {
  perf.bridgeSetTime = performance.now();
  console.log('🔗 Setting native WASM bridge...');
  
  bridge = instance;
  
  // Immediate readiness check
  if (bridge && typeof bridge.isReady === 'function' && bridge.isReady()) {
    isReady = true;
    console.log('✅ Bridge ready immediately');
  }
  
  // Notify all waiting resolvers
  const cbs = resolvers;
  resolvers = [];
  console.log(`📢 Notifying ${cbs.length} waiting resolvers...`);
  
  cbs.forEach((fn, index) => {
    try {
      fn();
    } catch (error) {
      console.error(`❌ Error in resolver ${index}:`, error);
    }
  });
  
  console.log(`🔗 Bridge set in ${(performance.now() - perf.bridgeSetTime).toFixed(2)}ms`);
}

export function getBridge() {
  return bridge;
}

export function waitForReady(timeoutMs = 20000) { // Increased default timeout
  const startTime = performance.now();
  attempts++;
  
  // Fast path - if already ready
  if (bridge && isReady) {
    console.log('⚡ Bridge ready (fast path)');
    return Promise.resolve();
  }
  
  // Quick check if bridge is ready now
  if (bridge && typeof bridge.isReady === 'function' && bridge.isReady()) {
    isReady = true;
    console.log('⚡ Bridge ready (immediate check)');
    return Promise.resolve();
  }
  
  console.log(`⏳ Waiting for native bridge readiness (attempt ${attempts}, timeout: ${timeoutMs}ms)...`);
  
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      
      const waitTime = performance.now() - startTime;
      const error = new Error(`WASM bridge init timed out after ${waitTime.toFixed(2)}ms (${attempts} attempts)`);
      error.details = {
        hasBridge: !!bridge,
        isReady: isReady,
        bridgeType: bridge?.constructor?.name,
        bridgeIsReadyFunction: typeof bridge?.isReady === 'function',
        bridgeIsReadyValue: bridge?.isReady?.(),
        attempts,
        timeout: timeoutMs,
        waitTime: waitTime.toFixed(2) + 'ms'
      };
      
      console.error('❌ Bridge timeout details:', error.details);
      reject(error);
    }, timeoutMs);
    
    // Success resolver
    const successResolver = () => {
      if (resolved) return;
      resolved = true;
      
      clearTimeout(timeoutId);
      isReady = true;
      perf.totalWaitTime = performance.now() - startTime;
      
      console.log(`✅ Native bridge ready in ${perf.totalWaitTime.toFixed(2)}ms (attempt ${attempts})`);
      resolve();
    };
    
    // Add to resolvers list
    resolvers.push(successResolver);
    
    // Aggressive polling for bridge readiness
    let pollAttempts = 0;
    let pollDelay = 1; // Start with 1ms
    
    const poll = () => {
      if (resolved) return;
      pollAttempts++;
      
      try {
        // Check multiple conditions
        if (bridge && 
            typeof bridge.isReady === 'function' && 
            bridge.isReady()) {
          
          console.log(`🎯 Bridge became ready via polling (${pollAttempts} polls)`);
          successResolver();
          return;
        }
        
        // Also check if bridge has any ready indicators
        if (bridge && (
            bridge._ready === true ||
            bridge.ready === true ||
            bridge.initialized === true ||
            bridge.status === 'ready'
        )) {
          console.log(`🎯 Bridge became ready via status check (${pollAttempts} polls)`);
          successResolver();
          return;
        }
        
      } catch (error) {
        console.warn(`⚠️  Error during bridge poll ${pollAttempts}:`, error);
      }
      
      // Continue polling with exponential backoff (capped at 100ms)
      if (!resolved && pollAttempts < 200) { // Cap polling attempts
        pollDelay = Math.min(pollDelay * 1.05, 100);
        setTimeout(poll, pollDelay);
      }
    };
    
    // Start polling immediately
    poll();
    
    // Also set up a periodic check every 250ms as backup
    const backupCheckInterval = setInterval(() => {
      if (resolved) {
        clearInterval(backupCheckInterval);
        return;
      }
      
      try {
        if (bridge && 
            typeof bridge.isReady === 'function' && 
            bridge.isReady()) {
          console.log('✅ Bridge ready via backup check');
          successResolver();
          clearInterval(backupCheckInterval);
        }
      } catch (error) {
        console.warn('⚠️  Error in backup check:', error);
      }
    }, 250);
  });
}

// Diagnostic function
export function getBridgeStatus() {
  return {
    hasBridge: !!bridge,
    isReady,
    bridgeType: bridge?.constructor?.name || 'unknown',
    bridgeIsReadyFunction: typeof bridge?.isReady === 'function',
    bridgeIsReadyValue: bridge?.isReady?.(),
    pendingResolvers: resolvers.length,
    attempts,
    performance: perf,
    bridgeKeys: bridge ? Object.keys(bridge) : [],
    bridgeReadyProperties: bridge ? {
      _ready: bridge._ready,
      ready: bridge.ready,
      initialized: bridge.initialized,
      status: bridge.status
    } : null
  };
}

// Force reset function for debugging
export function resetBridgeRegistry() {
  console.log('🔄 Force resetting bridge registry...');
  bridge = null;
  isReady = false;
  resolvers = [];
  attempts = 0;
  
  Object.keys(perf).forEach(key => {
    perf[key] = 0;
  });
}

// Enhanced logging for debugging
export function enableBridgeDebugLogging() {
  console.log('🐛 Bridge debug logging enabled');
  
  // Log bridge state changes
  if (bridge) {
    console.log('Current bridge status:', getBridgeStatus());
  }
  
  // Set up interval logging
  const debugInterval = setInterval(() => {
    if (!bridge) {
      console.log('🔍 Debug: No bridge set yet...');
    } else {
      const status = getBridgeStatus();
      if (!status.isReady) {
        console.log('🔍 Debug: Bridge not ready yet...', {
          hasBridge: status.hasBridge,
          isReadyFunction: status.bridgeIsReadyFunction,
          isReadyValue: status.bridgeIsReadyValue,
          pendingResolvers: status.pendingResolvers
        });
      } else {
        clearInterval(debugInterval);
        console.log('🔍 Debug: Bridge is ready, stopping debug logging');
      }
    }
  }, 1000);
  
  // Auto-stop debug logging after 30 seconds
  setTimeout(() => {
    clearInterval(debugInterval);
    console.log('🔍 Debug: Auto-stopping bridge debug logging after 30s');
  }, 30000);
}