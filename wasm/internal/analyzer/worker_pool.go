package analyzer

import (
	"sync"
)

// WorkerPool manages a limited number of goroutines for concurrent processing
type WorkerPool struct {
	maxWorkers int
	tasks      chan func()
	wg         sync.WaitGroup
}

// NewWorkerPool creates a new worker pool with the specified number of workers
func NewWorkerPool(maxWorkers int) *WorkerPool {
	if maxWorkers <= 0 {
		maxWorkers = 2 // Conservative default for WASM
	}
	
	pool := &WorkerPool{
		maxWorkers: maxWorkers,
		tasks:      make(chan func(), maxWorkers*2),
	}
	
	// Start worker goroutines
	for i := 0; i < maxWorkers; i++ {
		go pool.worker()
	}
	
	return pool
}

// worker processes tasks from the queue
func (p *WorkerPool) worker() {
	for task := range p.tasks {
		task()
		p.wg.Done()
	}
}

// Submit adds a task to the worker pool
func (p *WorkerPool) Submit(task func()) {
	p.wg.Add(1)
	p.tasks <- task
}

// Wait waits for all submitted tasks to complete
func (p *WorkerPool) Wait() {
	p.wg.Wait()
}

// Close shuts down the worker pool
func (p *WorkerPool) Close() {
	close(p.tasks)
}