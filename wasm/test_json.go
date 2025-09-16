package main

import (
	"encoding/json"
	"fmt"
	"fulcrum-wasm/internal/analyzer"
)

type TestResult struct {
	TaskGraph analyzer.TaskGraph `json:"task_graph"`
	Test      string             `json:"test"`
}

func main() {
	text := "I need to fix the bug in the login system."
	
	// Simple test
	ideas := analyzer.AnalyzeIdeas(text)
	
	var sentences []string
	for _, cluster := range ideas.SemanticClusters.Value {
		sentences = append(sentences, cluster.Sentences...)
	}
	
	if len(sentences) == 0 {
		sentences = []string{"I need to fix the bug in the login system."}
	}
	
	taskGraph := analyzer.ExtractTaskGraph(text, sentences, ideas.SemanticClusters.Value)
	
	result := TestResult{
		TaskGraph: taskGraph,
		Test:      "hello",
	}
	
	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	fmt.Println("JSON Output:")
	fmt.Println(string(jsonData))
	
	// Check if task_graph key exists
	var check map[string]interface{}
	json.Unmarshal(jsonData, &check)
	
	if _, exists := check["task_graph"]; exists {
		fmt.Println("\n✅ task_graph key EXISTS in JSON")
	} else {
		fmt.Println("\n❌ task_graph key MISSING from JSON")
	}
}