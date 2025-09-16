package main

import (
	"encoding/json"
	"fmt"
	"fulcrum-wasm/internal/analyzer"
)

func main() {
	text := "I need to update my code to handle errors properly. First, I should identify all the places where errors can occur. Then I need to implement proper error handling. After that, I must test the error cases. Can you help me create a comprehensive error handling strategy? Finally, we should document the error handling approach."
	
	sentences := []string{
		"I need to update my code to handle errors properly.",
		"First, I should identify all the places where errors can occur.",
		"Then I need to implement proper error handling.",
		"After that, I must test the error cases.",
		"Can you help me create a comprehensive error handling strategy?",
		"Finally, we should document the error handling approach.",
	}
	
	// Analyze ideas first
	ideas := analyzer.AnalyzeIdeas(text)
	
	// Extract task graph
	taskGraph := analyzer.ExtractTaskGraph(text, sentences, ideas.SemanticClusters.Value)
	
	// Print results
	jsonData, err := json.MarshalIndent(taskGraph, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling: %v\n", err)
		return
	}
	
	fmt.Printf("TaskGraph Results:\n%s\n", string(jsonData))
	fmt.Printf("\nSummary:\n")
	fmt.Printf("Total Tasks: %d\n", taskGraph.TotalTasks)
	fmt.Printf("Root Tasks: %v\n", taskGraph.RootTasks)
	fmt.Printf("Leaf Tasks: %v\n", taskGraph.LeafTasks)
	fmt.Printf("Graph Complexity: %.2f\n", taskGraph.GraphComplexity)
}