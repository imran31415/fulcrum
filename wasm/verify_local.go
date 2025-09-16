package main

import (
	"encoding/json"
	"fmt"
	"fulcrum-wasm/internal/analyzer"
	"strings"
)

func main() {
	text := "I need to fix the bug in the login system. Can you help me identify the issue? First, we should check the authentication flow."
	
	// Exactly what main.go does
	ideas := analyzer.AnalyzeIdeas(text)
	
	var sentences []string
	fmt.Printf("Number of idea clusters: %d\n", len(ideas.SemanticClusters.Value))
	for i, cluster := range ideas.SemanticClusters.Value {
		fmt.Printf("Cluster %d has %d sentences\n", i, len(cluster.Sentences))
		sentences = append(sentences, cluster.Sentences...)
	}
	
	if len(sentences) == 0 {
		fmt.Println("Using fallback split")
		sentences = strings.Split(text, ". ")
		for i := range sentences {
			sentences[i] = strings.TrimSpace(sentences[i])
		}
	}
	
	fmt.Printf("Total sentences: %d\n", len(sentences))
	
	taskGraph := analyzer.ExtractTaskGraph(text, sentences, ideas.SemanticClusters.Value)
	
	fmt.Printf("\nTaskGraph.TotalTasks: %d\n", taskGraph.TotalTasks)
	fmt.Printf("TaskGraph.Tasks length: %d\n", len(taskGraph.Tasks))
	
	// Test JSON marshaling
	type TestStruct struct {
		TaskGraph analyzer.TaskGraph `json:"task_graph"`
	}
	
	test := TestStruct{TaskGraph: taskGraph}
	b, err := json.Marshal(test)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	// Check if task_graph appears in JSON
	jsonStr := string(b)
	if strings.Contains(jsonStr, "\"task_graph\"") {
		fmt.Println("✅ task_graph key found in JSON")
	} else {
		fmt.Println("❌ task_graph key NOT in JSON")
	}
	
	// Parse it back
	var check map[string]interface{}
	json.Unmarshal(b, &check)
	if tg, ok := check["task_graph"]; ok {
		fmt.Printf("✅ task_graph exists in parsed JSON: %T\n", tg)
	} else {
		fmt.Println("❌ task_graph missing from parsed JSON")
	}
}