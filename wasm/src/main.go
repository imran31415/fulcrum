package main

import (
	"encoding/json"
	"fmt"
	"runtime"
	"strings"
	"sync"
	"syscall/js"
	"time"

	"fulcrum-wasm/internal/analyzer"
)

type CombinedResult struct {
	Complexity    analyzer.ComplexityMetrics   `json:"complexity_metrics"`
	Tokens        analyzer.TokenData           `json:"tokens"`
	Preprocessing analyzer.PreprocessingData   `json:"preprocessing"`
	Performance   analyzer.PerformanceMetrics  `json:"performance_metrics"`
	Ideas         analyzer.IdeaAnalysisMetrics `json:"idea_analysis"`
	Insights      analyzer.InsightAnalysis     `json:"insights"`
	TaskGraph     analyzer.TaskGraph           `json:"task_graph"`
	PromptGrade   analyzer.PromptGrade         `json:"prompt_grade"`
	TestField     string                       `json:"test_field"`
}

// processText performs text operations and analysis
func processText(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{
			"success": false,
			"error":   "processText expects exactly two arguments: operation and text",
		}
	}

	operation := args[0].String()
	text := args[1].String()

	switch operation {
	case "analyze":
		// Add panic recovery to prevent crashes
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("Recovered from panic: %v\n", r)
			}
		}()
		
		// Force garbage collection before heavy analysis
		runtime.GC()
		
		// Initialize performance tracking
		requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
		perf := analyzer.NewPerformanceMetrics(requestID)
		
		// Create worker pool with limited goroutines (2 for WASM environment)
		pool := analyzer.NewWorkerPool(2)
		defer pool.Close()
		
		var comp analyzer.ComplexityMetrics
		var tok analyzer.TokenData
		var pre analyzer.PreprocessingData
		var ideas analyzer.IdeaAnalysisMetrics
		
		// Track individual operation durations
		var complexityDur, tokenDur, preprocessDur, ideaDur time.Duration
		var mu sync.Mutex // Protect concurrent writes

		// Submit tasks to worker pool instead of creating unlimited goroutines
		pool.Submit(func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("Complexity analysis panic: %v\n", r)
				}
			}()
			timer := analyzer.NewTimer("complexity_analysis")
			result := analyzer.AnalyzeComplexity(text)
			dur := timer.Stop()
			mu.Lock()
			comp = result
			complexityDur = dur
			mu.Unlock()
		})
		
		pool.Submit(func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("Tokenization panic: %v\n", r)
				}
			}()
			timer := analyzer.NewTimer("tokenization")
			result := analyzer.TokenizeText(text)
			dur := timer.Stop()
			mu.Lock()
			tok = result
			tokenDur = dur
			mu.Unlock()
		})
		
		pool.Submit(func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("Preprocessing panic: %v\n", r)
				}
			}()
			timer := analyzer.NewTimer("preprocessing")
			result := analyzer.PreprocessText(text)
			dur := timer.Stop()
			mu.Lock()
			pre = result
			preprocessDur = dur
			mu.Unlock()
		})
		
		pool.Submit(func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("Idea analysis panic: %v\n", r)
				}
			}()
			timer := analyzer.NewTimer("idea_analysis")
			result := analyzer.AnalyzeIdeas(text)
			dur := timer.Stop()
			mu.Lock()
			ideas = result
			ideaDur = dur
			mu.Unlock()
		})

		// Wait for all tasks to complete
		pool.Wait()
		
		// Force GC after parallel processing
		runtime.GC()
		
		// Extract task graph from ideas
		taskGraphTimer := analyzer.NewTimer("task_graph_extraction")
		// Extract sentences from existing idea clusters
		var sentences []string
		// Limit debug output for large texts
		if len(ideas.SemanticClusters.Value) < 30 {
			fmt.Printf("DEBUG: Number of idea clusters: %d\n", len(ideas.SemanticClusters.Value))
		}
		for i, cluster := range ideas.SemanticClusters.Value {
			// Only log first few clusters to prevent log spam
			if i < 5 {
				fmt.Printf("DEBUG: Cluster %d has %d sentences\n", i, len(cluster.Sentences))
			}
			sentences = append(sentences, cluster.Sentences...)
		}
		fmt.Printf("DEBUG: Total sentences collected: %d\n", len(sentences))
		
		// If no sentences from clusters, use a simple split as fallback
		if len(sentences) == 0 {
			fmt.Println("DEBUG: No sentences from clusters, using simple split")
			// Simple sentence split
			sentences = strings.Split(text, ". ")
			for i := range sentences {
				sentences[i] = strings.TrimSpace(sentences[i])
			}
			fmt.Printf("DEBUG: Simple split got %d sentences\n", len(sentences))
		}
		
		taskGraph := analyzer.ExtractTaskGraph(text, sentences, ideas.SemanticClusters.Value)
		taskGraphDur := taskGraphTimer.Stop()
		
		// Debug logging
		fmt.Printf("DEBUG: TaskGraph parsed - Total tasks: %d\n", taskGraph.TotalTasks)
		if taskGraph.TotalTasks > 0 {
			fmt.Printf("DEBUG: First task: %s\n", taskGraph.Tasks[0].Title)
		}
		
		// Ensure arrays are not nil for JSON marshaling
		if taskGraph.Tasks == nil {
			taskGraph.Tasks = []analyzer.Task{}
		}
		if taskGraph.Relationships == nil {
			taskGraph.Relationships = []analyzer.TaskRelationship{}
		}
		if taskGraph.RootTasks == nil {
			taskGraph.RootTasks = []string{}
		}
		if taskGraph.LeafTasks == nil {
			taskGraph.LeafTasks = []string{}
		}
		if taskGraph.CriticalPath == nil {
			taskGraph.CriticalPath = []string{}
		}
		
		// Generate insights from all metrics (after all analysis is complete)
		insightTimer := analyzer.NewTimer("insight_generation")
		insights := analyzer.TransformToInsights(comp, ideas, tok, pre)
		insightDur := insightTimer.Stop()
		
		// Calculate prompt grade
		gradeTimer := analyzer.NewTimer("prompt_grade_calculation")
		promptGrade := analyzer.CalculatePromptGrade(comp, tok, pre, ideas, *taskGraph, text)
		gradeDur := gradeTimer.Stop()
		
		// Debug logging for prompt grade
		fmt.Printf("DEBUG: PromptGrade calculated - Overall score: %.2f, Grade: %s\n", 
			promptGrade.OverallGrade.Score, promptGrade.OverallGrade.Grade)
		
		// Finalize performance metrics
		perf.Finalize(complexityDur, tokenDur, preprocessDur)
		perf.AddSubOperation("idea_analysis", ideaDur)
		perf.AddSubOperation("task_graph_extraction", taskGraphDur)
		perf.AddSubOperation("insight_generation", insightDur)
		perf.AddSubOperation("prompt_grade_calculation", gradeDur)
		
		// Add any additional sub-operations timing if needed
		perf.AddSubOperation("json_marshaling", 0) // Will be updated below
		
		marshalTimer := analyzer.NewTimer("json_marshaling")
	combined := CombinedResult{
		Complexity:    comp,
		Tokens:        tok,
		Preprocessing: pre,
		Performance:   *perf,
		Ideas:         ideas,
		Insights:      insights,
		TaskGraph:     *taskGraph,
		PromptGrade:   *promptGrade,
		TestField:     "THIS IS A TEST",
	}
		
		// Measure JSON marshaling time
		b, err := json.Marshal(combined)
		marshalDur := marshalTimer.Stop()
		
		// DEBUG: Check if task_graph and prompt_grade are in the JSON
		if strings.Contains(string(b), "task_graph") {
			fmt.Println("✅ task_graph found in marshaled JSON")
		} else {
			fmt.Println("❌ task_graph NOT FOUND in marshaled JSON")
		}
		if strings.Contains(string(b), "prompt_grade") {
			fmt.Println("✅ prompt_grade found in marshaled JSON")
		} else {
			fmt.Println("❌ prompt_grade NOT FOUND in marshaled JSON")
		}
		
		// Update the marshaling timing in performance metrics
		perf.AddSubOperation("json_marshaling", marshalDur)
		
		if err != nil {
			return map[string]interface{}{
				"success": false,
				"error":   fmt.Sprintf("failed to marshal result: %v", err),
			}
		}
		return map[string]interface{}{
			"success": true,
			"data":    string(b),
		}

	case "uppercase":
		return map[string]interface{}{
			"success": true,
			"data":    strings.ToUpper(text),
		}
	case "lowercase":
		return map[string]interface{}{
			"success": true,
			"data":    strings.ToLower(text),
		}
	case "trim":
		return map[string]interface{}{
			"success": true,
			"data":    strings.TrimSpace(text),
		}
	case "wordcount":
		words := strings.Fields(text)
		wordCount := len(words)
		charCount := len(text)
		// Count sentences (simple approach)
		sentences := 0
		for _, r := range text {
			if r == '.' || r == '!' || r == '?' {
				sentences++
			}
		}
		if sentences == 0 && len(text) > 0 {
			sentences = 1
		}
		return map[string]interface{}{
			"success": true,
			"data":    fmt.Sprintf("%d words • %d characters • %d sentences", wordCount, charCount, sentences),
		}
	default:
		return map[string]interface{}{
			"success": false,
			"error":   fmt.Sprintf("Unknown operation: %s", operation),
		}
	}
}

// Global channel to prevent the program from exiting
var keepAlive = make(chan struct{})

func main() {
	// Set GOMAXPROCS to a reasonable value for WASM
	runtime.GOMAXPROCS(2)
	
	// Set up cleanup handler
	js.Global().Set("cleanupWasm", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		fmt.Println("Cleaning up WASM module...")
		close(keepAlive)
		return nil
	}))

	// Register the Fulcrum API with error recovery
	js.Global().Set("processText", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Wrap the actual function with panic recovery
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("Main processText recovered from panic: %v\n", r)
			}
		}()
		return processText(this, args)
	}))

	// Signal that WASM module is ready
	js.Global().Set("wasmReady", js.ValueOf(true))

	fmt.Println("Fulcrum WASM module loaded successfully")
	fmt.Printf("Runtime: GOMAXPROCS=%d, NumCPU=%d\n", runtime.GOMAXPROCS(0), runtime.NumCPU())
	
	// Keep the Go program running
	<-keepAlive
	fmt.Println("WASM module shutting down gracefully")
}
