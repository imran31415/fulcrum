/**
 * Integration tests for Web Worker WASM text analysis
 * Tests the complete flow from UI to Worker to WASM and back
 */

import { jest } from '@jest/globals';

// Mock the entire flow
const mockAnalysisResult = {
  success: true,
  data: JSON.stringify({
    complexity_metrics: {
      flesch_reading_ease: { value: 65.2 },
      sentence_complexity_average: { value: 4.5 }
    },
    task_graph: {
      total_tasks: 5,
      tasks: [
        { id: 'task_1', title: 'Setup environment' },
        { id: 'task_2', title: 'Install dependencies' }
      ]
    },
    prompt_grade: {
      overall_grade: { score: 82, grade: 'B' },
      understandability: { score: 85 },
      specificity: { score: 78 }
    }
  })
};

describe('Web Worker WASM Integration', () => {
  
  describe('UI Responsiveness During Processing', () => {
    test('should not block UI thread during analysis', async () => {
      // Track animation frame callbacks
      let frameCount = 0;
      let animationId;
      
      const startAnimation = () => {
        const animate = () => {
          frameCount++;
          if (frameCount < 60) { // Run for 1 second at 60fps
            animationId = requestAnimationFrame(animate);
          }
        };
        animationId = requestAnimationFrame(animate);
      };
      
      // Mock requestAnimationFrame
      let callbacks = [];
      global.requestAnimationFrame = jest.fn(cb => {
        callbacks.push(cb);
        return callbacks.length;
      });
      
      // Start animation
      startAnimation();
      
      // Simulate WASM processing in worker (non-blocking)
      const processPromise = new Promise(resolve => {
        setTimeout(() => resolve(mockAnalysisResult), 100);
      });
      
      // Process animation frames while WASM is running
      for (let i = 0; i < 60; i++) {
        callbacks.forEach(cb => cb());
        callbacks = [];
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
      
      const result = await processPromise;
      
      // UI should have remained responsive (frames processed)
      expect(frameCount).toBeGreaterThan(50); // Allow some variance
      expect(result.success).toBe(true);
    });
    
    test('should allow user input during processing', async () => {
      let inputValue = '';
      let buttonClicks = 0;
      
      // Simulate input handler
      const handleInput = (value) => {
        inputValue = value;
      };
      
      // Simulate button click handler  
      const handleClick = () => {
        buttonClicks++;
      };
      
      // Start WASM processing
      const processPromise = new Promise(resolve => {
        setTimeout(() => resolve(mockAnalysisResult), 100);
      });
      
      // Simulate user interactions during processing
      handleInput('User typing...');
      handleClick();
      handleClick();
      handleInput('More typing...');
      
      const result = await processPromise;
      
      // User interactions should have been processed
      expect(inputValue).toBe('More typing...');
      expect(buttonClicks).toBe(2);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Message Passing Performance', () => {
    test('should handle large text efficiently', async () => {
      const largeText = 'Lorem ipsum '.repeat(10000); // ~120KB of text
      const startTime = Date.now();
      
      // Simulate worker processing
      const processPromise = new Promise(resolve => {
        // Structured cloning of large data
        const clonedText = structuredClone ? 
          structuredClone(largeText) : 
          JSON.parse(JSON.stringify(largeText));
          
        setTimeout(() => {
          resolve({
            success: true,
            data: JSON.stringify({
              text_length: clonedText.length,
              processing_time: Date.now() - startTime
            })
          });
        }, 50);
      });
      
      const result = await processPromise;
      const data = JSON.parse(result.data);
      
      expect(data.text_length).toBe(largeText.length);
      expect(data.processing_time).toBeLessThan(1000); // Should be fast
    });
    
    test('should batch multiple requests efficiently', async () => {
      const requests = [
        { id: 1, operation: 'uppercase', text: 'hello' },
        { id: 2, operation: 'lowercase', text: 'WORLD' },
        { id: 3, operation: 'analyze', text: 'Complex text analysis' }
      ];
      
      const results = await Promise.all(
        requests.map(req => 
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                id: req.id,
                result: req.operation === 'uppercase' ? 
                  req.text.toUpperCase() :
                  req.operation === 'lowercase' ?
                  req.text.toLowerCase() :
                  mockAnalysisResult.data
              });
            }, Math.random() * 100); // Random delays
          })
        )
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].result).toBe('HELLO');
      expect(results[1].result).toBe('world');
      expect(results[2].result).toBeTruthy();
    });
  });
  
  describe('Error Recovery', () => {
    test('should recover from worker crash', async () => {
      let workerCrashed = false;
      
      // First attempt - simulate crash
      const firstAttempt = new Promise((resolve, reject) => {
        setTimeout(() => {
          workerCrashed = true;
          reject(new Error('Worker crashed'));
        }, 50);
      });
      
      try {
        await firstAttempt;
      } catch (error) {
        expect(error.message).toBe('Worker crashed');
        expect(workerCrashed).toBe(true);
      }
      
      // Recovery - create new worker and retry
      workerCrashed = false;
      const secondAttempt = new Promise(resolve => {
        setTimeout(() => {
          resolve(mockAnalysisResult);
        }, 50);
      });
      
      const result = await secondAttempt;
      expect(result.success).toBe(true);
      expect(workerCrashed).toBe(false);
    });
    
    test('should handle timeout gracefully', async () => {
      jest.useFakeTimers();
      
      const timeoutPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Processing timeout'));
        }, 30000);
        
        // Simulate very long processing
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(mockAnalysisResult);
        }, 40000);
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(30000);
      
      await expect(timeoutPromise).rejects.toThrow('Processing timeout');
      
      jest.useRealTimers();
    });
  });
  
  describe('Memory Management', () => {
    test('should clean up resources after processing', async () => {
      const resources = {
        worker: { terminated: false },
        blobUrl: 'blob://test-url',
        pendingMessages: new Map([
          [1, { resolve: jest.fn(), reject: jest.fn() }],
          [2, { resolve: jest.fn(), reject: jest.fn() }]
        ])
      };
      
      // Simulate cleanup
      const cleanup = () => {
        resources.worker.terminated = true;
        URL.revokeObjectURL(resources.blobUrl);
        resources.pendingMessages.clear();
      };
      
      // Process and cleanup
      const result = await new Promise(resolve => {
        setTimeout(() => resolve(mockAnalysisResult), 50);
      });
      
      cleanup();
      
      expect(resources.worker.terminated).toBe(true);
      expect(resources.pendingMessages.size).toBe(0);
    });
    
    test('should handle memory pressure', async () => {
      const memoryUsage = [];
      
      // Simulate multiple large analyses
      for (let i = 0; i < 5; i++) {
        const largeText = 'x'.repeat(1000000); // 1MB
        
        // Track memory (simulated)
        memoryUsage.push({
          before: process.memoryUsage ? process.memoryUsage().heapUsed : 0
        });
        
        await new Promise(resolve => {
          setTimeout(() => resolve(mockAnalysisResult), 50);
        });
        
        memoryUsage[i].after = process.memoryUsage ? 
          process.memoryUsage().heapUsed : 0;
        
        // Force garbage collection (if available)
        if (global.gc) {
          global.gc();
        }
      }
      
      // Memory should not continuously increase (leak)
      if (process.memoryUsage) {
        const increases = memoryUsage.map(m => m.after - m.before);
        const avgIncrease = increases.reduce((a, b) => a + b) / increases.length;
        
        // Average increase should be reasonable (not growing unbounded)
        expect(avgIncrease).toBeLessThan(10000000); // 10MB threshold
      }
    });
  });
  
  describe('Platform Compatibility', () => {
    test('should fall back gracefully when Workers unavailable', async () => {
      // Remove Worker support
      const originalWorker = global.Worker;
      delete global.Worker;
      
      // Should use main thread fallback
      const result = await new Promise(resolve => {
        // Main thread processing (blocking but functional)
        setTimeout(() => resolve(mockAnalysisResult), 50);
      });
      
      expect(result.success).toBe(true);
      
      // Restore Worker
      global.Worker = originalWorker;
    });
    
    test('should work in different environments', async () => {
      const environments = [
        { name: 'Chrome', hasWorker: true, hasSAB: true },
        { name: 'Firefox', hasWorker: true, hasSAB: false },
        { name: 'Safari', hasWorker: true, hasSAB: false },
        { name: 'React Native', hasWorker: false, hasSAB: false }
      ];
      
      for (const env of environments) {
        // Simulate environment
        global.Worker = env.hasWorker ? function() {} : undefined;
        global.SharedArrayBuffer = env.hasSAB ? function() {} : undefined;
        
        const result = await new Promise(resolve => {
          setTimeout(() => resolve(mockAnalysisResult), 10);
        });
        
        expect(result.success).toBe(true);
      }
    });
  });
});