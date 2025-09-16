package main

import (
	"encoding/json"
	"syscall/js"
	"fulcrum-wasm/internal/analyzer"
)

type SimpleResult struct {
	Message   string             `json:"message"`
	TaskGraph analyzer.TaskGraph `json:"task_graph"`
}

func testTaskGraph(this js.Value, args []js.Value) interface{} {
	// Create a simple task graph
	taskGraph := analyzer.TaskGraph{
		Tasks: []analyzer.Task{
			{
				ID:    "test_1",
				Title: "Test Task",
				Type:  "action",
			},
		},
		Relationships: []analyzer.TaskRelationship{},
		RootTasks:     []string{"test_1"},
		LeafTasks:     []string{"test_1"},
		TotalTasks:    1,
	}
	
	result := SimpleResult{
		Message:   "Test TaskGraph",
		TaskGraph: taskGraph,
	}
	
	b, _ := json.Marshal(result)
	
	return map[string]interface{}{
		"success": true,
		"data":    string(b),
	}
}

func main() {
	done := make(chan struct{})
	js.Global().Set("testTaskGraph", js.FuncOf(testTaskGraph))
	js.Global().Set("wasmTestReady", js.ValueOf(true))
	<-done
}