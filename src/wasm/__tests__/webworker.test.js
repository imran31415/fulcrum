/**
 * Unit tests for Web Worker WASM implementation
 * Tests the non-blocking architecture and message passing
 */

import { jest } from '@jest/globals';
import { WasmWorkerManager } from '../index.webworker';
import { createWorker } from '../worker.inline';

// Mock Worker API
class MockWorker {
  constructor(url) {
    this.url = url;
    this.listeners = {
      message: [],
      error: []
    };
    this.terminated = false;
    MockWorker.instances.push(this);
  }

  addEventListener(type, handler) {
    if (this.listeners[type]) {
      this.listeners[type].push(handler);
    }
  }

  postMessage(data) {
    if (this.terminated) {
      throw new Error('Worker has been terminated');
    }
    
    // Simulate async message handling
    setTimeout(() => {
      this.onmessage?.(data);
    }, 10);
  }

  terminate() {
    this.terminated = true;
  }

  // Test helper to simulate worker responses
  simulateMessage(data) {
    this.listeners.message.forEach(handler => {
      handler({ data });
    });
  }

  simulateError(error) {
    this.listeners.error.forEach(handler => {
      handler(error);
    });
  }

  static instances = [];
  static reset() {
    MockWorker.instances = [];
  }
}

// Setup mocks
beforeEach(() => {
  global.Worker = MockWorker;
  global.Blob = jest.fn((content, options) => ({ content, options }));
  global.URL = {
    createObjectURL: jest.fn(blob => `blob://mock-url-${Date.now()}`),
    revokeObjectURL: jest.fn()
  };
  global.atob = jest.fn(str => str); // Mock base64 decode
  MockWorker.reset();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('WasmWorkerManager', () => {
  let manager;

  beforeEach(() => {
    manager = new WasmWorkerManager();
  });

  afterEach(() => {
    manager?.cleanup();
  });

  describe('Initialization', () => {
    test('should create worker on first init', async () => {
      const initPromise = manager.init();
      
      // Simulate successful initialization
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);

      await initPromise;

      expect(MockWorker.instances).toHaveLength(1);
      expect(manager.isInitialized).toBe(true);
    });

    test('should reuse existing init promise', async () => {
      const promise1 = manager.init();
      const promise2 = manager.init();
      
      expect(promise1).toBe(promise2);
      
      // Complete initialization
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);

      await Promise.all([promise1, promise2]);
      expect(MockWorker.instances).toHaveLength(1);
    });

    test('should handle initialization errors', async () => {
      const initPromise = manager.init();
      
      // Simulate error during initialization
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ 
          type: 'error', 
          id: 1, 
          payload: { message: 'WASM init failed' }
        });
      }, 20);

      await expect(initPromise).rejects.toThrow('WASM init failed');
      expect(manager.isInitialized).toBe(false);
    });
  });

  describe('Message Processing', () => {
    beforeEach(async () => {
      // Initialize manager
      const initPromise = manager.init();
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);
      await initPromise;
    });

    test('should process text successfully', async () => {
      const processPromise = manager.process('analyze', 'test text');
      
      // Simulate successful processing
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({
          type: 'result',
          id: 2,
          payload: { success: true, data: 'analysis results' }
        });
      }, 20);

      const result = await processPromise;
      expect(result).toEqual({ success: true, data: 'analysis results' });
    });

    test('should handle processing errors', async () => {
      const processPromise = manager.process('analyze', 'test text');
      
      // Simulate processing error
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({
          type: 'error',
          id: 2,
          payload: { message: 'Processing failed' }
        });
      }, 20);

      await expect(processPromise).rejects.toThrow('Processing failed');
    });

    test('should handle concurrent requests', async () => {
      const promise1 = manager.process('uppercase', 'text1');
      const promise2 = manager.process('lowercase', 'text2');
      const promise3 = manager.process('analyze', 'text3');
      
      // Simulate responses in different order
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({
          type: 'result',
          id: 3,
          payload: 'TEXT2'
        });
        worker.simulateMessage({
          type: 'result',
          id: 2,
          payload: 'TEXT1'
        });
        worker.simulateMessage({
          type: 'result',
          id: 4,
          payload: { analyzed: true }
        });
      }, 20);

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3
      ]);

      expect(result1).toBe('TEXT1');
      expect(result2).toBe('TEXT2');
      expect(result3).toEqual({ analyzed: true });
    });

    test('should timeout long-running requests', async () => {
      jest.useFakeTimers();
      
      const processPromise = manager.process('analyze', 'huge text');
      
      // Advance time past timeout (30 seconds)
      jest.advanceTimersByTime(31000);
      
      await expect(processPromise).rejects.toThrow(/timeout/i);
      
      jest.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    test('should terminate worker on cleanup', async () => {
      // Initialize
      const initPromise = manager.init();
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);
      await initPromise;

      const worker = MockWorker.instances[0];
      expect(worker.terminated).toBe(false);

      manager.cleanup();

      expect(worker.terminated).toBe(true);
      expect(manager.isInitialized).toBe(false);
      expect(manager.worker).toBeNull();
    });

    test('should reject pending messages on cleanup', async () => {
      // Initialize
      const initPromise = manager.init();
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);
      await initPromise;

      // Start a process that won't complete
      const processPromise = manager.process('analyze', 'text');
      
      // Clean up immediately
      manager.cleanup();

      // Process should be rejected
      await expect(processPromise).rejects.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle worker crashes gracefully', async () => {
      // Initialize
      const initPromise = manager.init();
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateMessage({ type: 'ready', id: 1 });
      }, 20);
      await initPromise;

      // Start multiple processes
      const promise1 = manager.process('analyze', 'text1');
      const promise2 = manager.process('analyze', 'text2');

      // Simulate worker crash
      setTimeout(() => {
        const worker = MockWorker.instances[0];
        worker.simulateError(new Error('Worker crashed'));
      }, 20);

      // All pending processes should be rejected
      await expect(promise1).rejects.toThrow('Worker crashed');
      await expect(promise2).rejects.toThrow('Worker crashed');
    });
  });
});

describe('createWorker', () => {
  test('should create worker from blob URL', () => {
    const worker = createWorker();
    
    expect(global.Blob).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('Worker-side code')]),
      { type: 'application/javascript' }
    );
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(worker).toBeInstanceOf(MockWorker);
  });

  test('should clean up blob URL after creation', () => {
    createWorker();
    
    // URL.revokeObjectURL should be called to free memory
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe('Platform Detection', () => {
  test('should detect Web Worker support correctly', () => {
    // Test with Worker available
    global.Worker = MockWorker;
    global.Blob = jest.fn();
    global.URL = { createObjectURL: jest.fn() };
    
    const supportsWorkers = () => {
      return typeof Worker !== 'undefined' && 
             typeof Blob !== 'undefined' &&
             typeof URL !== 'undefined' &&
             typeof URL.createObjectURL === 'function';
    };
    
    expect(supportsWorkers()).toBe(true);
    
    // Test without Worker
    delete global.Worker;
    expect(supportsWorkers()).toBe(false);
    
    // Test without Blob
    global.Worker = MockWorker;
    delete global.Blob;
    expect(supportsWorkers()).toBe(false);
    
    // Test without URL.createObjectURL
    global.Blob = jest.fn();
    global.URL = {};
    expect(supportsWorkers()).toBe(false);
  });
});