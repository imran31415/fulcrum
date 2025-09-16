package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"fulcrum-wasm/internal/analyzer"
)

func main() {
	text := "I need to fix the bug in the login system. Can you help me identify the issue? First, we should check the authentication flow. Then test with different user types. Finally, document the solution."
	
	fmt.Println("=== Testing with exact text ===")
	fmt.Printf("Input text: %s\n\n", text)
	
	// Analyze ideas first
	fmt.Println("1. Analyzing ideas...")
	ideas := analyzer.AnalyzeIdeas(text)
	fmt.Printf("   - Found %d idea clusters\n", len(ideas.SemanticClusters.Value))
	
	// Show sentences from clusters
	fmt.Println("\n2. Sentences from idea clusters:")
	var sentences []string
	for i, cluster := range ideas.SemanticClusters.Value {
		fmt.Printf("   Cluster %d:\n", i+1)
		for _, sent := range cluster.Sentences {
			fmt.Printf("     - %s\n", sent)
			sentences = append(sentences, sent)
		}
	}
	
	fmt.Printf("\n   Total sentences collected: %d\n", len(sentences))
	
	// Extract task graph
	fmt.Println("\n3. Extracting TaskGraph...")
	taskGraph := analyzer.ExtractTaskGraph(text, sentences, ideas.SemanticClusters.Value)
	
	fmt.Printf("   - Total tasks found: %d\n", taskGraph.TotalTasks)
	fmt.Printf("   - Relationships: %d\n", len(taskGraph.Relationships))
	
	if taskGraph.TotalTasks == 0 {
		fmt.Println("\n⚠️  NO TASKS FOUND!")
		fmt.Println("\nDebugging: Let's check what's happening in task extraction...")
		
		// Let's manually check each sentence
		testSentences := []string{
			"I need to fix the bug in the login system.",
			"Can you help me identify the issue?",
			"First, we should check the authentication flow.",
			"Then test with different user types.",
			"Finally, document the solution.",
		}
		
		fmt.Println("\nTesting individual sentences:")
		for i, sent := range testSentences {
			fmt.Printf("\n   Sentence %d: %s\n", i+1, sent)
			
			// Check for task indicators
			lower := strings.ToLower(sent)
			hasNeedTo := strings.Contains(lower, "need to")
			hasShould := strings.Contains(lower, "should")
			hasCanYou := strings.Contains(lower, "can you")
			hasThen := strings.Contains(lower, "then")
			hasFinally := strings.Contains(lower, "finally")
			
			fmt.Printf("     - Has 'need to': %v\n", hasNeedTo)
			fmt.Printf("     - Has 'should': %v\n", hasShould)  
			fmt.Printf("     - Has 'can you': %v\n", hasCanYou)
			fmt.Printf("     - Has 'then': %v\n", hasThen)
			fmt.Printf("     - Has 'finally': %v\n", hasFinally)
		}
	} else {
		fmt.Println("\n4. Tasks found:")
		for i, task := range taskGraph.Tasks {
			fmt.Printf("\n   Task %d (ID: %s):\n", i+1, task.ID)
			fmt.Printf("     Title: %s\n", task.Title)
			fmt.Printf("     Type: %s\n", task.Type)
			fmt.Printf("     Priority: %s\n", task.Priority)
			fmt.Printf("     Confidence: %.2f\n", task.Confidence)
			fmt.Printf("     Action Verbs: %v\n", task.ActionVerbs)
		}
	}
	
	// Output full JSON for inspection
	fmt.Println("\n5. Full TaskGraph JSON:")
	jsonData, _ := json.MarshalIndent(taskGraph, "", "  ")
	fmt.Println(string(jsonData))
}
