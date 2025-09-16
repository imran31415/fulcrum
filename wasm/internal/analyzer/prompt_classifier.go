package analyzer

import (
	"regexp"
	"strings"
)

// PromptType represents different categories of prompts with specific evaluation criteria
type PromptType string

const (
	TechnicalSpec  PromptType = "technical_spec"
	CreativeTask   PromptType = "creative_task"
	CodeGeneration PromptType = "code_generation"
	DataAnalysis   PromptType = "data_analysis"
	Writing        PromptType = "writing"
	ProblemSolving PromptType = "problem_solving"
	Learning       PromptType = "learning"
	General        PromptType = "general"
)

// PromptClassification contains the detected prompt type and confidence
type PromptClassification struct {
	PrimaryType   PromptType `json:"primary_type"`
	SecondaryType PromptType `json:"secondary_type,omitempty"`
	Confidence    float64    `json:"confidence"`
	Reasoning     string     `json:"reasoning"`
	Keywords      []string   `json:"keywords"`
}

// PromptClassifier analyzes prompts to determine their type and context
type PromptClassifier struct {
	patterns map[PromptType][]ClassificationPattern
}

// ClassificationPattern defines keywords and rules for identifying prompt types
type ClassificationPattern struct {
	Keywords    []string
	Phrases     []string
	RegexList   []string
	Weight      float64
	Description string
}

// containsWord checks if a word appears as a whole token (case-insensitive)
func containsWord(text, word string) bool {
	if word == "" { return false }
	pattern := `(?i)\b` + regexp.QuoteMeta(word) + `\b`
	matched, _ := regexp.MatchString(pattern, text)
	return matched
}

// NewPromptClassifier creates a classifier with predefined patterns based on real-world usage
func NewPromptClassifier() *PromptClassifier {
	return &PromptClassifier{
		patterns: map[PromptType][]ClassificationPattern{
			TechnicalSpec: {
				{
					Keywords:    []string{"API", "endpoint", "schema", "database", "specification", "architecture"},
					Phrases:     []string{"technical requirements", "system design", "data structure", "API design", "database schema", "architecture pattern"},
					RegexList:   []string{`(?i)\b(implement|build|create|design)\s+(a|an|the)?\s*(API|system|database|service|architecture)`},
					Weight:      1.0,
					Description: "Technical specification indicators",
				},
				{
					Keywords:    []string{"webhook", "authentication", "OAuth", "JWT", "REST", "GraphQL", "microservices", "deployment", "infrastructure"},
					Phrases:     []string{"security requirements", "integration points", "deployment strategy"},
					Weight:      0.7,
					Description: "Advanced technical concepts",
				},
			},
			CodeGeneration: {
				{
					Keywords:    []string{"function", "class", "method", "algorithm", "code", "program", "script", "implementation", "refactor", "debug", "component", "interface", "props", "tests", "unit tests"},
					Phrases:     []string{"write a function", "create a class", "implement the", "code that", "programming logic", "React component", "TypeScript interfaces", "CSS modules", "React Testing Library", "props interface"},
					RegexList:   []string{`(?i)\b(write|create|implement|code|program|develop)\s+(a|an|the)?\s*(function|class|method|script|program|component)`},
					Weight:      1.1,
					Description: "Code generation requests",
				},
				{
					Keywords:    []string{"Python", "JavaScript", "React", "Node.js", "Java", "C++", "TypeScript", "SQL", "Golang"},
					Phrases:     []string{"programming language", "code example", "syntax error"},
					Weight:      0.8,
					Description: "Programming language references",
				},
			},
			CreativeTask: {
				{
					Keywords:    []string{"creative", "brainstorm", "ideas", "concept", "story", "narrative", "content", "marketing", "brand", "logo", "palette", "typography", "style", "mood", "identity"},
					Phrases:     []string{"creative ideas", "brainstorming session", "design concepts", "story outline", "content strategy", "brand style guide"},
					RegexList:   []string{`(?i)\b(brainstorm|generate|create|design)\s+(ideas|concepts|content|stories|logo|identity)`},
					Weight:      1.0,
					Description: "Creative and ideation tasks",
				},
			},
			DataAnalysis: {
				{
					Keywords:    []string{"analyze", "data", "metrics", "statistics", "trends", "insights", "report", "visualization", "dashboard"},
					Phrases:     []string{"data analysis", "statistical analysis", "trend analysis", "performance metrics"},
					RegexList:   []string{`(?i)\b(analyze|examine|review)\s+(data|metrics|performance|trends)`},
					Weight:      1.0,
					Description: "Data analysis and metrics",
				},
			},
			Writing: {
				{
					Keywords:    []string{"write", "essay", "article", "blog", "documentation", "copy", "text", "content", "draft", "edit"},
					Phrases:     []string{"write an", "create content", "draft a", "editing guidelines"},
					RegexList:   []string{`(?i)\b(write|draft|compose|create)\s+(an?|the)?\s*(article|essay|blog|document|content)`},
					Weight:      1.0,
					Description: "Writing and content creation",
				},
			},
			ProblemSolving: {
				{
					Keywords:    []string{"solve", "problem", "issue", "challenge", "troubleshoot", "debug", "fix", "resolve", "optimize"},
					Phrases:     []string{"solve the problem", "troubleshoot the issue", "find a solution", "resolve the"},
					RegexList:   []string{`(?i)\b(solve|fix|resolve|troubleshoot|debug)\s+(the|this)?\s*(problem|issue|bug|error)`},
					Weight:      1.0,
					Description: "Problem-solving requests",
				},
			},
			Learning: {
				{
					Keywords:    []string{"learn", "explain", "understand", "tutorial", "guide", "teach", "lesson", "concept", "how", "why", "curriculum", "step-by-step", "learning objectives"},
					Phrases:     []string{"explain how", "help me understand", "teach me", "learning about", "step-by-step tutorials", "4-week curriculum", "learning objectives"},
					RegexList:   []string{`(?i)\b(explain|teach|help me understand|how does|why does|what is)`},
					Weight:      1.2,
					Description: "Educational and learning requests",
				},
			},
		},
	}
}

// ClassifyPrompt analyzes a prompt and determines its primary type
func (pc *PromptClassifier) ClassifyPrompt(text string) PromptClassification {
	text = strings.ToLower(text)
	scores := make(map[PromptType]float64)
	allKeywords := make(map[string]bool)
	
	// Calculate scores for each prompt type
	for promptType, patterns := range pc.patterns {
		totalScore := 0.0
		
		for _, pattern := range patterns {
			patternScore := 0.0
			
			// Check keywords (as whole words)
			for _, keyword := range pattern.Keywords {
				if containsWord(text, keyword) {
					patternScore += 1.0
					allKeywords[keyword] = true
				}
			}
			
			// Check phrases (substring ok)
			for _, phrase := range pattern.Phrases {
				if strings.Contains(text, strings.ToLower(phrase)) {
					patternScore += 2.0 // Phrases are more significant
					allKeywords[phrase] = true
				}
			}
			
			// Check regex patterns
			for _, regexPattern := range pattern.RegexList {
				if matched, _ := regexp.MatchString(regexPattern, text); matched {
					patternScore += 3.0 // Regex matches are most significant
				}
			}
			
			totalScore += patternScore * pattern.Weight
		}
		
		scores[promptType] = totalScore
	}
	
	// Find primary and secondary types
	var primaryType, secondaryType PromptType
	var primaryScore, secondaryScore float64
	
	for promptType, score := range scores {
		if score > primaryScore {
			secondaryType = primaryType
			secondaryScore = primaryScore
			primaryType = promptType
			primaryScore = score
		} else if score > secondaryScore {
			secondaryType = promptType
			secondaryScore = score
		}
	}
	
	// Default to general if no clear classification
	if primaryScore == 0 {
		primaryType = General
		primaryScore = 1.0
	}
	
	// Calculate confidence based on score separation
	confidence := 0.5 // Base confidence
	if primaryScore > 0 {
		if secondaryScore == 0 {
			confidence = 0.9
		} else {
			confidence = 0.5 + (primaryScore-secondaryScore)/(primaryScore+secondaryScore)*0.4
		}
	}
	
	// Convert keywords map to slice
	keywordsList := make([]string, 0, len(allKeywords))
	for keyword := range allKeywords {
		keywordsList = append(keywordsList, keyword)
	}
	
	// Generate reasoning
	reasoning := pc.generateReasoning(primaryType, primaryScore, keywordsList)
	
	return PromptClassification{
		PrimaryType:   primaryType,
		SecondaryType: secondaryType,
		Confidence:    confidence,
		Reasoning:     reasoning,
		Keywords:      keywordsList,
	}
}

// generateReasoning creates human-readable explanation for the classification
func (pc *PromptClassifier) generateReasoning(promptType PromptType, score float64, keywords []string) string {
	baseReasons := map[PromptType]string{
		TechnicalSpec:  "Contains technical specifications, system requirements, and architectural elements",
		CodeGeneration: "Requests code implementation, programming solutions, or software development",
		CreativeTask:   "Involves creative ideation, brainstorming, or content generation",
		DataAnalysis:   "Focuses on data analysis, metrics evaluation, or statistical insights",
		Writing:        "Involves writing, documentation, or content creation tasks",
		ProblemSolving: "Addresses problem-solving, troubleshooting, or issue resolution",
		Learning:       "Educational request seeking explanation or understanding",
		General:        "General-purpose prompt without specific domain focus",
	}
	
	reason := baseReasons[promptType]
	if len(keywords) > 0 {
		reason += " (detected keywords: " + strings.Join(keywords[:minInt(3, len(keywords))], ", ") + ")"
	}
	
	return reason
}

// minInt helper function
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetPromptTypeDisplayName returns user-friendly name for prompt type
func GetPromptTypeDisplayName(pt PromptType) string {
	names := map[PromptType]string{
		TechnicalSpec:  "Technical Specification",
		CodeGeneration: "Code Generation",
		CreativeTask:   "Creative Task",
		DataAnalysis:   "Data Analysis",
		Writing:        "Writing & Documentation",
		ProblemSolving: "Problem Solving",
		Learning:       "Learning & Education",
		General:        "General Purpose",
	}
	return names[pt]
}

// GetPromptTypeIcon returns emoji icon for prompt type
func GetPromptTypeIcon(pt PromptType) string {
	icons := map[PromptType]string{
		TechnicalSpec:  "🔧",
		CodeGeneration: "💻",
		CreativeTask:   "🎨",
		DataAnalysis:   "📊",
		Writing:        "✍️",
		ProblemSolving: "🧩",
		Learning:       "🎓",
		General:        "📝",
	}
	return icons[pt]
}