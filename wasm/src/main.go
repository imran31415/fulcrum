package main

import (
	"encoding/json"
	"fmt"
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
		// Initialize performance tracking
		requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
		perf := analyzer.NewPerformanceMetrics(requestID)
		
		var wg sync.WaitGroup
		wg.Add(4) // Added idea analysis

		var comp analyzer.ComplexityMetrics
		var tok analyzer.TokenData
		var pre analyzer.PreprocessingData
		var ideas analyzer.IdeaAnalysisMetrics
		
		// Track individual operation durations
		var complexityDur, tokenDur, preprocessDur, ideaDur time.Duration

		go func() {
			defer wg.Done()
			timer := analyzer.NewTimer("complexity_analysis")
			comp = analyzer.AnalyzeComplexity(text)
			complexityDur = timer.Stop()
		}()
		
		go func() {
			defer wg.Done()
			timer := analyzer.NewTimer("tokenization")
			tok = analyzer.TokenizeText(text)
			tokenDur = timer.Stop()
		}()
		
		go func() {
			defer wg.Done()
			timer := analyzer.NewTimer("preprocessing")
			pre = analyzer.PreprocessText(text)
			preprocessDur = timer.Stop()
		}()
		
		go func() {
			defer wg.Done()
			timer := analyzer.NewTimer("idea_analysis")
			ideas = analyzer.AnalyzeIdeas(text)
			ideaDur = timer.Stop()
		}()

		wg.Wait()
		
		// Generate insights from all metrics (after all analysis is complete)
		insightTimer := analyzer.NewTimer("insight_generation")
		insights := analyzer.TransformToInsights(comp, ideas, tok, pre)
		insightDur := insightTimer.Stop()
		
		// Finalize performance metrics
		perf.Finalize(complexityDur, tokenDur, preprocessDur)
		perf.AddSubOperation("idea_analysis", ideaDur)
		perf.AddSubOperation("insight_generation", insightDur)
		
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
		}
		
		// Measure JSON marshaling time
		b, err := json.Marshal(combined)
		marshalDur := marshalTimer.Stop()
		
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
		return map[string]interface{}{
			"success": true,
			"data":    fmt.Sprintf("%d", len(words)),
		}
	default:
		return map[string]interface{}{
			"success": false,
			"error":   fmt.Sprintf("Unknown operation: %s", operation),
		}
	}
}

func main() {
	// Keep the main goroutine alive
	done := make(chan struct{})

	// Register the Fulcrum API
	js.Global().Set("processText", js.FuncOf(processText))

	// Signal that WASM module is ready
	js.Global().Set("wasmReady", js.ValueOf(true))

	fmt.Println("Fulcrum WASM module loaded successfully")
	<-done
}
