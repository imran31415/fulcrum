package analyzer

import (
	"fmt"
	"regexp"
	"strings"
)

// Task represents an actionable item extracted from text
type Task struct {
	ID               string            `json:"id"`
	Title            string            `json:"title"`
	Description      string            `json:"description"`
	Type             string            `json:"type"` // "action", "requirement", "goal", "need", "question"
	Status           string            `json:"status"` // "open", "in_progress", "completed", "blocked"
	Priority         string            `json:"priority"` // "high", "medium", "low"
	SourceText       string            `json:"source_text"`
	TextPosition     TextRange         `json:"text_position"`
	Keywords         []string          `json:"keywords"`
	RelatedTaskIDs   []string          `json:"related_task_ids"`
	DependsOn        []string          `json:"depends_on"`
	Blocks           []string          `json:"blocks"`
	Confidence       float64           `json:"confidence"`
	ActionVerbs      []string          `json:"action_verbs"`
	EstimatedEffort  string            `json:"estimated_effort"` // "small", "medium", "large"
}

// TextRange represents the position of text in the original input
type TextRange struct {
	StartChar    int    `json:"start_char"`
	EndChar      int    `json:"end_char"`
	StartLine    int    `json:"start_line"`
	EndLine      int    `json:"end_line"`
	SentenceNum  int    `json:"sentence_num"`
}

// TaskRelationship represents a connection between two tasks
type TaskRelationship struct {
	FromTaskID     string  `json:"from_task_id"`
	ToTaskID       string  `json:"to_task_id"`
	RelationType   string  `json:"relation_type"` // "depends_on", "blocks", "related", "subtask", "parallel"
	Strength       float64 `json:"strength"` // 0.0 to 1.0
	Reason         string  `json:"reason"`
}

// TaskGraph represents the complete graph of tasks and their relationships
type TaskGraph struct {
	Tasks          []Task             `json:"tasks"`
	Relationships  []TaskRelationship `json:"relationships"`
	RootTasks      []string           `json:"root_tasks"` // Tasks with no dependencies
	LeafTasks      []string           `json:"leaf_tasks"` // Tasks that nothing depends on
	CriticalPath   []string           `json:"critical_path"` // Longest dependency chain
	TotalTasks     int                `json:"total_tasks"`
	GraphComplexity float64           `json:"graph_complexity"`
}

// ExtractTaskGraph analyzes text and builds a task graph
func ExtractTaskGraph(text string, sentences []string, clusters []IdeaCluster) *TaskGraph {
	tasks := extractTasks(text, sentences, clusters)
	if tasks == nil {
		tasks = []Task{}
	}

	relationships := detectTaskRelationships(tasks)
	if relationships == nil {
		relationships = []TaskRelationship{}
	}
	
	graph := TaskGraph{
		Tasks:         tasks,
		Relationships: relationships,
		TotalTasks:    len(tasks),
	}
	
	// Identify root and leaf tasks
	graph.RootTasks = findRootTasks(tasks)
	graph.LeafTasks = findLeafTasks(tasks)
	
	// Calculate critical path
	graph.CriticalPath = findCriticalPath(tasks, relationships)
	
	// Calculate graph complexity
	graph.GraphComplexity = calculateGraphComplexity(tasks, relationships)
	
return &graph
}

// extractTasks identifies actionable items from the text
func extractTasks(text string, sentences []string, clusters []IdeaCluster) []Task {
	var tasks []Task
	taskID := 1
	
	// Limit number of sentences to process to prevent memory issues
	maxSentences := 100
	if len(sentences) > maxSentences {
		sentences = sentences[:maxSentences]
	}
	
	// Track character position
	charPos := 0
	textLen := len(text)
	
	for sentNum, sentence := range sentences {
		// Ensure we don't go out of bounds
		if charPos >= textLen {
			break
		}
		
		// Search for sentence with bounds checking
		sentStart := charPos
		if charPos < textLen {
			remainText := text[charPos:]
			idx := strings.Index(remainText, sentence)
			if idx != -1 {
				sentStart = charPos + idx
			}
		}
		
		// Ensure sentEnd doesn't exceed text length
		sentEnd := sentStart + len(sentence)
		if sentEnd > textLen {
			sentEnd = textLen
		}
		
		// Check if this sentence contains a task
		if task := extractTaskFromSentence(sentence, sentNum, sentStart, sentEnd); task != nil {
			task.ID = fmt.Sprintf("task_%d", taskID)
			
			// Enrich task with cluster information
			enrichTaskWithClusterInfo(task, clusters)
			
			tasks = append(tasks, *task)
			taskID++
			
			// Limit maximum tasks to prevent memory issues
			if len(tasks) >= 50 {
				break
			}
		}
		
		charPos = sentEnd
	}
	
	return tasks
}

// extractTaskFromSentence analyzes a single sentence for task indicators
func extractTaskFromSentence(sentence string, sentNum, startChar, endChar int) *Task {
	lower := strings.ToLower(sentence)
	
	// Action indicators
	actionPatterns := []string{
		"need to", "have to", "must", "should", "will", "going to",
		"want to", "trying to", "plan to", "intend to",
		"update", "create", "fix", "implement", "build", "develop",
		"analyze", "design", "test", "deploy", "configure",
		"help me", "help with", "assist", "support",
	}
	
	// Requirement indicators
	requirementPatterns := []string{
		"require", "necessary", "essential", "critical",
		"ensure", "make sure", "verify", "validate",
		"if there are", "when there are", "in case of",
	}
	
	// Question indicators (that are actionable)
	questionPatterns := []string{
		"how to", "how can", "how do",
		"can you", "could you", "would you",
		"what is the best way",
	}
	
	taskType := ""
	confidence := 0.0
	actionVerbs := []string{}
	priority := "medium"
	
	// Check for action patterns
	for _, pattern := range actionPatterns {
		if strings.Contains(lower, pattern) {
			taskType = "action"
			confidence += 0.3
			actionVerbs = append(actionVerbs, pattern)
			
			// Urgent indicators increase priority
			if strings.Contains(lower, "urgent") || strings.Contains(lower, "asap") || 
			   strings.Contains(lower, "immediately") || strings.Contains(lower, "critical") {
				priority = "high"
			}
		}
	}
	
	// Check for requirements
	for _, pattern := range requirementPatterns {
		if strings.Contains(lower, pattern) {
			if taskType == "" {
				taskType = "requirement"
			}
			confidence += 0.2
		}
	}
	
	// Check for actionable questions
	for _, pattern := range questionPatterns {
		if strings.Contains(lower, pattern) {
			if taskType == "" {
				taskType = "question"
			}
			confidence += 0.2
		}
	}
	
	// Check for goals
	if strings.Contains(lower, "goal") || strings.Contains(lower, "objective") || 
	   strings.Contains(lower, "aim") || strings.Contains(lower, "purpose") {
		if taskType == "" {
			taskType = "goal"
		}
		confidence += 0.1
	}
	
	// If no task indicators found, return nil
	if taskType == "" || confidence < 0.2 {
		return nil
	}
	
	// Extract title and description
	title := extractTaskTitle(sentence)
	description := sentence
	
	// Extract keywords
	keywords := extractKeywords(sentence)
	
	// Estimate effort based on action verbs and complexity
	effort := estimateEffort(sentence, actionVerbs)
	
	return &Task{
		Title:       title,
		Description: description,
		Type:        taskType,
		Status:      "open",
		Priority:    priority,
		SourceText:  sentence,
		TextPosition: TextRange{
			StartChar:   startChar,
			EndChar:     endChar,
			SentenceNum: sentNum,
		},
		Keywords:        keywords,
		Confidence:      confidence,
		ActionVerbs:     actionVerbs,
		EstimatedEffort: effort,
	}
}

// extractTaskTitle creates a concise title from the sentence
func extractTaskTitle(sentence string) string {
	// Remove common prefixes
	title := sentence
	prefixes := []string{
		"I need to ", "I have to ", "I must ", "I should ",
		"We need to ", "We have to ", "We must ", "We should ",
		"You need to ", "You have to ", "You must ", "You should ",
		"Need to ", "Have to ", "Must ", "Should ",
		"Please ", "Can you ", "Could you ", "Would you ",
	}
	
	lower := strings.ToLower(title)
	for _, prefix := range prefixes {
		if strings.HasPrefix(lower, strings.ToLower(prefix)) {
			title = title[len(prefix):]
			break
		}
	}
	
	// Capitalize first letter
	if len(title) > 0 {
		title = strings.ToUpper(string(title[0])) + title[1:]
	}
	
	// Limit length
	if len(title) > 100 {
		title = title[:97] + "..."
	}
	
	return title
}

// extractKeywords extracts important words from the sentence
func extractKeywords(sentence string) []string {
	// Remove common words and extract significant terms
	words := strings.Fields(strings.ToLower(sentence))
	keywords := []string{}
	
	significantWords := map[string]bool{
		"update": true, "create": true, "delete": true, "modify": true,
		"fix": true, "bug": true, "error": true, "issue": true,
		"implement": true, "feature": true, "function": true, "method": true,
		"code": true, "script": true, "program": true, "application": true,
		"database": true, "api": true, "server": true, "client": true,
		"test": true, "deploy": true, "build": true, "compile": true,
		"return": true, "list": true, "array": true, "object": true,
		"file": true, "directory": true, "path": true, "url": true,
	}
	
	for _, word := range words {
		// Clean the word
		word = regexp.MustCompile(`[^\w]`).ReplaceAllString(word, "")
		
		if significantWords[word] || (len(word) > 4 && !isStopWord(word)) {
			keywords = append(keywords, word)
		}
	}
	
	return keywords
}

// estimateEffort estimates the task complexity
func estimateEffort(sentence string, actionVerbs []string) string {
	lower := strings.ToLower(sentence)
	
	// Large effort indicators
	if strings.Contains(lower, "redesign") || strings.Contains(lower, "refactor") ||
	   strings.Contains(lower, "migrate") || strings.Contains(lower, "overhaul") ||
	   strings.Contains(lower, "complete rewrite") || strings.Contains(lower, "entire") {
		return "large"
	}
	
	// Small effort indicators
	if strings.Contains(lower, "fix") || strings.Contains(lower, "tweak") ||
	   strings.Contains(lower, "adjust") || strings.Contains(lower, "minor") ||
	   strings.Contains(lower, "small") || strings.Contains(lower, "quick") {
		return "small"
	}
	
	// Complex action verbs suggest medium to large effort
	complexVerbs := 0
	for _, verb := range actionVerbs {
		if strings.Contains(verb, "implement") || strings.Contains(verb, "design") ||
		   strings.Contains(verb, "develop") || strings.Contains(verb, "build") {
			complexVerbs++
		}
	}
	
	if complexVerbs > 1 {
		return "large"
	}
	
	return "medium"
}

// enrichTaskWithClusterInfo adds information from idea clusters to tasks
func enrichTaskWithClusterInfo(task *Task, clusters []IdeaCluster) {
	for _, cluster := range clusters {
		for _, sentence := range cluster.Sentences {
			if strings.Contains(task.SourceText, sentence) || strings.Contains(sentence, task.SourceText) {
				// Add cluster keywords to task
				for _, keyword := range cluster.KeyWords {
					if !contains(task.Keywords, keyword) {
						task.Keywords = append(task.Keywords, keyword)
					}
				}
				break
			}
		}
	}
}

// detectTaskRelationships finds connections between tasks
func detectTaskRelationships(tasks []Task) []TaskRelationship {
	var relationships []TaskRelationship
	
	for i := 0; i < len(tasks); i++ {
		for j := i + 1; j < len(tasks); j++ {
			if rel := findRelationship(&tasks[i], &tasks[j]); rel != nil {
				relationships = append(relationships, *rel)
				
				// Update task references
				if rel.RelationType == "depends_on" {
					tasks[j].DependsOn = append(tasks[j].DependsOn, tasks[i].ID)
					tasks[i].Blocks = append(tasks[i].Blocks, tasks[j].ID)
				} else if rel.RelationType == "blocks" {
					tasks[i].DependsOn = append(tasks[i].DependsOn, tasks[j].ID)
					tasks[j].Blocks = append(tasks[j].Blocks, tasks[i].ID)
				} else {
					tasks[i].RelatedTaskIDs = append(tasks[i].RelatedTaskIDs, tasks[j].ID)
					tasks[j].RelatedTaskIDs = append(tasks[j].RelatedTaskIDs, tasks[i].ID)
				}
			}
		}
	}
	
	return relationships
}

// findRelationship determines if two tasks are related
func findRelationship(task1, task2 *Task) *TaskRelationship {
	// Calculate keyword similarity
	similarity := calculateKeywordSimilarity(task1.Keywords, task2.Keywords)
	
	// Check for explicit dependencies
	if containsDependencyIndicator(task1.SourceText, task2.SourceText) {
		return &TaskRelationship{
			FromTaskID:   task1.ID,
			ToTaskID:     task2.ID,
			RelationType: "depends_on",
			Strength:     0.8 + similarity*0.2,
			Reason:       "Sequential dependency detected",
		}
	}
	
	// Check for temporal ordering (task1 before task2)
	if task1.TextPosition.SentenceNum < task2.TextPosition.SentenceNum {
		lower1 := strings.ToLower(task1.SourceText)
		lower2 := strings.ToLower(task2.SourceText)
		
		// "First... then..." pattern
		if (strings.Contains(lower1, "first") && strings.Contains(lower2, "then")) ||
		   (strings.Contains(lower1, "before") && strings.Contains(lower2, "after")) {
			return &TaskRelationship{
				FromTaskID:   task1.ID,
				ToTaskID:     task2.ID,
				RelationType: "depends_on",
				Strength:     0.7,
				Reason:       "Temporal ordering",
			}
		}
	}
	
	// Check for high similarity (related tasks)
	if similarity > 0.5 {
		return &TaskRelationship{
			FromTaskID:   task1.ID,
			ToTaskID:     task2.ID,
			RelationType: "related",
			Strength:     similarity,
			Reason:       "High keyword similarity",
		}
	}
	
	// Check for subtask relationship
	if isSubtask(task1, task2) {
		return &TaskRelationship{
			FromTaskID:   task2.ID, // Parent
			ToTaskID:     task1.ID, // Subtask
			RelationType: "subtask",
			Strength:     0.6,
			Reason:       "Subtask relationship",
		}
	}
	
	// No significant relationship
	return nil
}

// containsDependencyIndicator checks for dependency keywords
func containsDependencyIndicator(text1, text2 string) bool {
	lower1 := strings.ToLower(text1)
	lower2 := strings.ToLower(text2)
	
	// Check if text2 references completion of text1
	if strings.Contains(lower2, "after") || strings.Contains(lower2, "once") ||
	   strings.Contains(lower2, "when") || strings.Contains(lower2, "then") {
		// Simple heuristic: if they share keywords and text2 has dependency words
		shared := false
		words1 := strings.Fields(lower1)
		for _, word := range words1 {
			if len(word) > 4 && strings.Contains(lower2, word) {
				shared = true
				break
			}
		}
		return shared
	}
	
	return false
}

// calculateKeywordSimilarity calculates Jaccard similarity between keyword sets
func calculateKeywordSimilarity(keywords1, keywords2 []string) float64 {
	if len(keywords1) == 0 || len(keywords2) == 0 {
		return 0
	}
	
	set1 := make(map[string]bool)
	for _, k := range keywords1 {
		set1[k] = true
	}
	
	intersection := 0
	for _, k := range keywords2 {
		if set1[k] {
			intersection++
		}
	}
	
	union := len(keywords1) + len(keywords2) - intersection
	if union == 0 {
		return 0
	}
	
	return float64(intersection) / float64(union)
}

// isSubtask checks if task1 is a subtask of task2
func isSubtask(task1, task2 *Task) bool {
	// Simple heuristic: task1 is more specific than task2
	if len(task1.Keywords) > len(task2.Keywords) {
		// Check if task2's keywords are subset of task1's
		subset := true
		for _, k2 := range task2.Keywords {
			found := false
			for _, k1 := range task1.Keywords {
				if k1 == k2 {
					found = true
					break
				}
			}
			if !found {
				subset = false
				break
			}
		}
		return subset
	}
	return false
}

// findRootTasks identifies tasks with no dependencies
func findRootTasks(tasks []Task) []string {
	var roots []string
	for _, task := range tasks {
		if len(task.DependsOn) == 0 {
			roots = append(roots, task.ID)
		}
	}
	return roots
}

// findLeafTasks identifies tasks that nothing depends on
func findLeafTasks(tasks []Task) []string {
	var leaves []string
	for _, task := range tasks {
		if len(task.Blocks) == 0 {
			leaves = append(leaves, task.ID)
		}
	}
	return leaves
}

// findCriticalPath finds the longest dependency chain
func findCriticalPath(tasks []Task, relationships []TaskRelationship) []string {
	// Build adjacency list
	graph := make(map[string][]string)
	taskMap := make(map[string]*Task)
	
	for _, task := range tasks {
		taskMap[task.ID] = &task
		graph[task.ID] = task.Blocks
	}
	
	// Find longest path using DFS
	var longestPath []string
	visited := make(map[string]bool)
	
	var dfs func(taskID string, path []string)
	dfs = func(taskID string, path []string) {
		if len(path) > len(longestPath) {
			longestPath = make([]string, len(path))
			copy(longestPath, path)
		}
		
		for _, nextID := range graph[taskID] {
			if !visited[nextID] {
				visited[nextID] = true
				dfs(nextID, append(path, nextID))
				visited[nextID] = false
			}
		}
	}
	
	// Start DFS from each root task
	roots := findRootTasks(tasks)
	for _, root := range roots {
		visited[root] = true
		dfs(root, []string{root})
		visited[root] = false
	}
	
	return longestPath
}

// calculateGraphComplexity calculates the complexity of the task graph
func calculateGraphComplexity(tasks []Task, relationships []TaskRelationship) float64 {
	if len(tasks) == 0 {
		return 0
	}
	
	// Complexity based on number of relationships relative to tasks
	relationshipRatio := float64(len(relationships)) / float64(len(tasks))
	
	// Average dependencies per task
	totalDeps := 0
	for _, task := range tasks {
		totalDeps += len(task.DependsOn) + len(task.Blocks)
	}
	avgDeps := float64(totalDeps) / float64(len(tasks)*2)
	
	// Normalize to 0-1 scale
	complexity := (relationshipRatio + avgDeps) / 2
	if complexity > 1 {
		complexity = 1
	}
	
	return complexity
}

// Helper function
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}