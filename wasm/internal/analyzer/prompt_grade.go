package analyzer

import (
	"math"
	"regexp"
	"strings"
	"unicode"
)

// PromptGrade represents comprehensive grading of prompt quality
type PromptGrade struct {
	Understandability   GradeDimension   `json:"understandability"`
	Specificity         GradeDimension   `json:"specificity"`
	TaskComplexity      GradeDimension   `json:"task_complexity"`
	Clarity             GradeDimension   `json:"clarity"`
	Actionability       GradeDimension   `json:"actionability"`
	StructureQuality    GradeDimension   `json:"structure_quality"`
	ContextSufficiency  GradeDimension   `json:"context_sufficiency"`
	ScopeManagement     GradeDimension   `json:"scope_management"`
	OverallGrade        OverallGrade     `json:"overall_grade"`
	Suggestions         []Suggestion     `json:"suggestions"`
	Strengths           []string         `json:"strengths"`
	WeakAreas           []string         `json:"weak_areas"`
}

// GradeDimension represents a single grading dimension
type GradeDimension struct {
	Score       float64  `json:"score"`        // 0-100
	Grade       string   `json:"grade"`        // Letter grade
	Label       string   `json:"label"`        // Quality label
	Description string   `json:"description"`  // Brief explanation
	Factors     []Factor `json:"factors"`      // Contributing factors
}

// Factor represents a contributing factor to a grade dimension
type Factor struct {
	Name        string  `json:"name"`
	Value       float64 `json:"value"`
	Weight      float64 `json:"weight"`
	Contribution float64 `json:"contribution"`
}

// OverallGrade represents the composite grade
type OverallGrade struct {
	Score       float64 `json:"score"`       // 0-100
	Grade       string  `json:"grade"`       // Letter grade (A+, A, B+, etc.)
	GradeColor  string  `json:"grade_color"` // Color for UI display
	Summary     string  `json:"summary"`     // Overall assessment
	Percentile  int     `json:"percentile"`  // Compared to typical prompts
}

// Suggestion represents an improvement suggestion
type Suggestion struct {
	Dimension   string `json:"dimension"`
	Priority    string `json:"priority"`    // "high", "medium", "low"
	Message     string `json:"message"`
	Impact      string `json:"impact"`      // Expected improvement
	Example     string `json:"example,omitempty"`
}

// CalculatePromptGrade analyzes all metrics and generates a comprehensive grade
func CalculatePromptGrade(
	complexity ComplexityMetrics,
	tokens TokenData,
	preprocessing PreprocessingData,
	ideas IdeaAnalysisMetrics,
	taskGraph TaskGraph,
	text string,
) *PromptGrade {
	grade := &PromptGrade{}
	
	// Calculate each dimension
	grade.Understandability = calculateUnderstandability(complexity, tokens)
	grade.Specificity = calculateSpecificity(text, tokens, ideas)
	grade.TaskComplexity = calculateTaskComplexity(taskGraph, ideas)
	grade.Clarity = calculateClarity(complexity, ideas, preprocessing)
	grade.Actionability = calculateActionability(taskGraph, tokens)
	grade.StructureQuality = calculateStructureQuality(ideas, complexity)
	grade.ContextSufficiency = calculateContextSufficiency(ideas, tokens)
	grade.ScopeManagement = calculateScopeManagement(taskGraph, ideas, tokens)
	
	// Calculate overall grade
	grade.OverallGrade = calculateOverallGrade(grade)
	
	// Generate suggestions based on scores
	grade.Suggestions = generateSuggestions(grade)
	
	// Identify strengths and weak areas
	grade.Strengths, grade.WeakAreas = identifyStrengthsAndWeaknesses(grade)
	
	return grade
}

// calculateUnderstandability evaluates how easy the prompt is to understand
func calculateUnderstandability(complexity ComplexityMetrics, tokens TokenData) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Flesch Reading Ease (30% weight) - normalized to 0-100
	fleschScore := complexity.FleschReadingEase.Value
	normalizedFlesch := math.Max(0, math.Min(100, fleschScore))
	factors = append(factors, Factor{
		Name:         "Reading Ease",
		Value:        normalizedFlesch,
		Weight:       0.30,
		Contribution: normalizedFlesch * 0.30,
	})
	totalScore += normalizedFlesch * 0.30
	
	// Average sentence length (20% weight) - inverse scoring
	avgSentLength := complexity.SentenceStats.AverageWordsPerSent.Value
	sentLengthScore := 100.0
	if avgSentLength > 20 {
		sentLengthScore = math.Max(0, 100-(avgSentLength-20)*3)
	}
	factors = append(factors, Factor{
		Name:         "Sentence Length",
		Value:        sentLengthScore,
		Weight:       0.20,
		Contribution: sentLengthScore * 0.20,
	})
	totalScore += sentLengthScore * 0.20
	
	// Sentence complexity (20% weight) - inverse scoring
	sentComplexity := complexity.SentenceComplexityAverage.Value
	complexityScore := math.Max(0, 100-sentComplexity*10)
	factors = append(factors, Factor{
		Name:         "Sentence Complexity",
		Value:        complexityScore,
		Weight:       0.20,
		Contribution: complexityScore * 0.20,
	})
	totalScore += complexityScore * 0.20
	
	// Lexical diversity (15% weight)
	lexicalDiv := complexity.LexicalDiversity.Value
	lexicalScore := lexicalDiv * 100
	if lexicalDiv > 0.7 {
		lexicalScore = 70 + (lexicalDiv-0.7)*100 // Penalize excessive diversity
	}
	factors = append(factors, Factor{
		Name:         "Lexical Diversity",
		Value:        lexicalScore,
		Weight:       0.15,
		Contribution: lexicalScore * 0.15,
	})
	totalScore += lexicalScore * 0.15
	
	// Word complexity distribution (15% weight)
	wordDist := complexity.WordComplexityDistribution.Value
	simpleRatio := 0.0
	total := wordDist["total"]
	simple := wordDist["simple"]
	if total > 0 {
		simpleRatio = float64(simple) / float64(total)
	}
	wordComplexityScore := simpleRatio * 100
	factors = append(factors, Factor{
		Name:         "Simple Words Ratio",
		Value:        wordComplexityScore,
		Weight:       0.15,
		Contribution: wordComplexityScore * 0.15,
	})
	totalScore += wordComplexityScore * 0.15
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getUnderstandabilityDescription(totalScore),
		Factors:     factors,
	}
}

// calculateSpecificity evaluates how specific and unambiguous the prompt is
func calculateSpecificity(text string, tokens TokenData, ideas IdeaAnalysisMetrics) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	words := strings.Fields(strings.ToLower(text))
	
	// Pronoun ratio (25% weight)
	pronounCount := countPronouns(words)
	pronounRatio := float64(pronounCount) / float64(len(words))
	pronounScore := math.Max(0, 100-pronounRatio*500) // Penalize high pronoun usage
	factors = append(factors, Factor{
		Name:         "Pronoun Usage",
		Value:        pronounScore,
		Weight:       0.25,
		Contribution: pronounScore * 0.25,
	})
	totalScore += pronounScore * 0.25
	
	// Named entity density (20% weight)
	// Using capitalized words as proxy for named entities
	namedEntities := countCapitalizedWords(text)
	entityDensity := float64(namedEntities) / float64(len(words))
	entityScore := math.Min(100, entityDensity*1000) // Reward entity presence
	factors = append(factors, Factor{
		Name:         "Named Entities",
		Value:        entityScore,
		Weight:       0.20,
		Contribution: entityScore * 0.20,
	})
	totalScore += entityScore * 0.20
	
	// Concrete vs abstract ratio (20% weight)
	abstractCount := countAbstractWords(words)
	abstractRatio := float64(abstractCount) / float64(len(words))
	concreteScore := math.Max(0, 100-abstractRatio*300)
	factors = append(factors, Factor{
		Name:         "Concrete Language",
		Value:        concreteScore,
		Weight:       0.20,
		Contribution: concreteScore * 0.20,
	})
	totalScore += concreteScore * 0.20
	
	// Question clarity (15% weight)
	questionScore := 70.0 // Default moderate score
	if ideas.QuestionAnalysis.Value.TotalQuestions > 0 {
		actionableQuestions := len(ideas.QuestionAnalysis.Value.Actionable)
		if ideas.QuestionAnalysis.Value.TotalQuestions > 0 {
			questionScore = float64(actionableQuestions) / float64(ideas.QuestionAnalysis.Value.TotalQuestions) * 100
		}
	}
	factors = append(factors, Factor{
		Name:         "Question Clarity",
		Value:        questionScore,
		Weight:       0.15,
		Contribution: questionScore * 0.15,
	})
	totalScore += questionScore * 0.15
	
	// Numeric content (10% weight)
	numericCount := countNumericContent(text)
	numericScore := math.Min(100, float64(numericCount)*20)
	factors = append(factors, Factor{
		Name:         "Numeric Specificity",
		Value:        numericScore,
		Weight:       0.10,
		Contribution: numericScore * 0.10,
	})
	totalScore += numericScore * 0.10
	
	// Temporal markers (10% weight)
	temporalCount := countTemporalMarkers(words)
	temporalScore := math.Min(100, float64(temporalCount)*25)
	factors = append(factors, Factor{
		Name:         "Temporal Markers",
		Value:        temporalScore,
		Weight:       0.10,
		Contribution: temporalScore * 0.10,
	})
	totalScore += temporalScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getSpecificityDescription(totalScore),
		Factors:     factors,
	}
}

// calculateTaskComplexity evaluates the complexity of tasks in the prompt
func calculateTaskComplexity(taskGraph TaskGraph, ideas IdeaAnalysisMetrics) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Total number of tasks (25% weight)
	taskCount := float64(taskGraph.TotalTasks)
	taskCountScore := 100.0
	if taskCount <= 2 {
		taskCountScore = 20
	} else if taskCount <= 5 {
		taskCountScore = 40
	} else if taskCount <= 10 {
		taskCountScore = 60
	} else if taskCount <= 15 {
		taskCountScore = 80
	} else {
		taskCountScore = 100
	}
	factors = append(factors, Factor{
		Name:         "Task Count",
		Value:        taskCountScore,
		Weight:       0.25,
		Contribution: taskCountScore * 0.25,
	})
	totalScore += taskCountScore * 0.25
	
	// Dependency depth (25% weight)
	depthScore := 20.0
	if len(taskGraph.CriticalPath) > 0 {
		depth := float64(len(taskGraph.CriticalPath))
		if depth <= 2 {
			depthScore = 20
		} else if depth <= 4 {
			depthScore = 50
		} else if depth <= 6 {
			depthScore = 75
		} else {
			depthScore = 100
		}
	}
	factors = append(factors, Factor{
		Name:         "Dependency Depth",
		Value:        depthScore,
		Weight:       0.25,
		Contribution: depthScore * 0.25,
	})
	totalScore += depthScore * 0.25
	
	// Graph complexity (20% weight)
	graphComplexityScore := math.Min(100, taskGraph.GraphComplexity*20)
	factors = append(factors, Factor{
		Name:         "Graph Complexity",
		Value:        graphComplexityScore,
		Weight:       0.20,
		Contribution: graphComplexityScore * 0.20,
	})
	totalScore += graphComplexityScore * 0.20
	
	// Parallel vs sequential ratio (15% weight)
	parallelScore := 50.0 // Default balanced score
	if taskGraph.TotalTasks > 0 {
		parallelTasks := len(taskGraph.RootTasks)
		parallelRatio := float64(parallelTasks) / float64(taskGraph.TotalTasks)
		parallelScore = parallelRatio * 100
	}
	factors = append(factors, Factor{
		Name:         "Parallel Tasks",
		Value:        parallelScore,
		Weight:       0.15,
		Contribution: parallelScore * 0.15,
	})
	totalScore += parallelScore * 0.15
	
	// Task type diversity (15% weight)
	taskTypes := make(map[string]bool)
	for _, task := range taskGraph.Tasks {
		taskTypes[task.Type] = true
	}
	diversityScore := math.Min(100, float64(len(taskTypes))*25)
	factors = append(factors, Factor{
		Name:         "Task Type Diversity",
		Value:        diversityScore,
		Weight:       0.15,
		Contribution: diversityScore * 0.15,
	})
	totalScore += diversityScore * 0.15
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       "", // No letter grade for complexity
		Label:       getComplexityLabel(totalScore),
		Description: getTaskComplexityDescription(totalScore),
		Factors:     factors,
	}
}

// calculateClarity evaluates how clearly the prompt expresses its intent
func calculateClarity(complexity ComplexityMetrics, ideas IdeaAnalysisMetrics, preprocessing PreprocessingData) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Sentence structure consistency (25% weight)
	sentenceVariance := complexity.SentenceStats.SentenceLengthVar.Value
	consistencyScore := math.Max(0, 100-sentenceVariance*2)
	factors = append(factors, Factor{
		Name:         "Structure Consistency",
		Value:        consistencyScore,
		Weight:       0.25,
		Contribution: consistencyScore * 0.25,
	})
	totalScore += consistencyScore * 0.25
	
	// Ambiguous word usage (20% weight)
	// We'll use a simple heuristic based on word diversity
	ambiguityScore := 80.0 // Default score
	if complexity.LexicalDiversity.Value > 0.8 {
		ambiguityScore = 60.0 // Too diverse might indicate ambiguity
	} else if complexity.LexicalDiversity.Value < 0.3 {
		ambiguityScore = 90.0 // Simple, clear vocabulary
	}
	factors = append(factors, Factor{
		Name:         "Language Clarity",
		Value:        ambiguityScore,
		Weight:       0.20,
		Contribution: ambiguityScore * 0.20,
	})
	totalScore += ambiguityScore * 0.20
	
	// Logical flow (20% weight)
	transitionScore := 100.0
	if ideas.TopicTransitions.Value > 5 {
		transitionScore = math.Max(40, 100-float64(ideas.TopicTransitions.Value-5)*10)
	}
	factors = append(factors, Factor{
		Name:         "Logical Flow",
		Value:        transitionScore,
		Weight:       0.20,
		Contribution: transitionScore * 0.20,
	})
	totalScore += transitionScore * 0.20
	
	// Contradiction detection (15% weight)
	// Simple heuristic: more consistency = less contradiction
	contradictionScore := ideas.ThematicConsistency.Value * 100
	factors = append(factors, Factor{
		Name:         "No Contradictions",
		Value:        contradictionScore,
		Weight:       0.15,
		Contribution: contradictionScore * 0.15,
	})
	totalScore += contradictionScore * 0.15
	
	// Modal verb consistency (10% weight)
	modalScore := 85.0 // Default good score
	factors = append(factors, Factor{
		Name:         "Modal Consistency",
		Value:        modalScore,
		Weight:       0.10,
		Contribution: modalScore * 0.10,
	})
	totalScore += modalScore * 0.10
	
	// Punctuation clarity (10% weight)
	punctuationScore := 90.0 // Default good score
	factors = append(factors, Factor{
		Name:         "Punctuation Clarity",
		Value:        punctuationScore,
		Weight:       0.10,
		Contribution: punctuationScore * 0.10,
	})
	totalScore += punctuationScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getClarityDescription(totalScore),
		Factors:     factors,
	}
}

// calculateActionability evaluates how actionable the prompt is
func calculateActionability(taskGraph TaskGraph, tokens TokenData) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Action verb density (25% weight)
	actionVerbCount := 0
	for _, task := range taskGraph.Tasks {
		actionVerbCount += len(task.ActionVerbs)
	}
	actionVerbScore := math.Min(100, float64(actionVerbCount)*15)
	factors = append(factors, Factor{
		Name:         "Action Verbs",
		Value:        actionVerbScore,
		Weight:       0.25,
		Contribution: actionVerbScore * 0.25,
	})
	totalScore += actionVerbScore * 0.25
	
	// Clear outcome specification (20% weight)
	outcomeScore := 60.0 // Default moderate score
	if taskGraph.TotalTasks > 0 {
		tasksWithClearOutcomes := 0
		for _, task := range taskGraph.Tasks {
			if task.Priority != "" && task.EstimatedEffort != "" {
				tasksWithClearOutcomes++
			}
		}
		outcomeScore = float64(tasksWithClearOutcomes) / float64(taskGraph.TotalTasks) * 100
	}
	factors = append(factors, Factor{
		Name:         "Clear Outcomes",
		Value:        outcomeScore,
		Weight:       0.20,
		Contribution: outcomeScore * 0.20,
	})
	totalScore += outcomeScore * 0.20
	
	// Measurable criteria (20% weight)
	measurableScore := 50.0 // Default score
	if taskGraph.TotalTasks > 0 {
		measurableScore = math.Min(100, float64(taskGraph.TotalTasks)*20)
	}
	factors = append(factors, Factor{
		Name:         "Measurable Criteria",
		Value:        measurableScore,
		Weight:       0.20,
		Contribution: measurableScore * 0.20,
	})
	totalScore += measurableScore * 0.20
	
	// Temporal sequencing (15% weight)
	sequencingScore := 70.0
	if len(taskGraph.CriticalPath) > 0 {
		sequencingScore = 90.0 // Clear sequence exists
	}
	factors = append(factors, Factor{
		Name:         "Temporal Sequencing",
		Value:        sequencingScore,
		Weight:       0.15,
		Contribution: sequencingScore * 0.15,
	})
	totalScore += sequencingScore * 0.15
	
	// Resource specification (10% weight)
	resourceScore := 60.0 // Default moderate score
	factors = append(factors, Factor{
		Name:         "Resource Clarity",
		Value:        resourceScore,
		Weight:       0.10,
		Contribution: resourceScore * 0.10,
	})
	totalScore += resourceScore * 0.10
	
	// Success criteria (10% weight)
	successScore := 65.0 // Default moderate score
	factors = append(factors, Factor{
		Name:         "Success Criteria",
		Value:        successScore,
		Weight:       0.10,
		Contribution: successScore * 0.10,
	})
	totalScore += successScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getActionabilityDescription(totalScore),
		Factors:     factors,
	}
}

// calculateStructureQuality evaluates the organizational quality
func calculateStructureQuality(ideas IdeaAnalysisMetrics, complexity ComplexityMetrics) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Logical progression (25% weight)
	progressionScore := 70.0
	if ideas.IdeaProgression.Value == "linear" {
		progressionScore = 90.0
	} else if ideas.IdeaProgression.Value == "branching" {
		progressionScore = 75.0
	} else if ideas.IdeaProgression.Value == "circular" {
		progressionScore = 50.0
	}
	factors = append(factors, Factor{
		Name:         "Logical Progression",
		Value:        progressionScore,
		Weight:       0.25,
		Contribution: progressionScore * 0.25,
	})
	totalScore += progressionScore * 0.25
	
	// Topic coherence (20% weight)
	coherenceScore := ideas.ConceptualCoherence.Value * 100
	factors = append(factors, Factor{
		Name:         "Topic Coherence",
		Value:        coherenceScore,
		Weight:       0.20,
		Contribution: coherenceScore * 0.20,
	})
	totalScore += coherenceScore * 0.20
	
	// Organization (20% weight)
	organizationScore := 75.0 // Default good score
	if len(ideas.SemanticClusters.Value) > 0 {
		avgCoherence := 0.0
		for _, cluster := range ideas.SemanticClusters.Value {
			avgCoherence += cluster.Coherence
		}
		avgCoherence /= float64(len(ideas.SemanticClusters.Value))
		organizationScore = avgCoherence * 100
	}
	factors = append(factors, Factor{
		Name:         "Organization",
		Value:        organizationScore,
		Weight:       0.20,
		Contribution: organizationScore * 0.20,
	})
	totalScore += organizationScore * 0.20
	
	// Transition usage (15% weight)
	transitionScore := math.Max(0, 100-float64(ideas.TopicTransitions.Value)*15)
	if ideas.TopicTransitions.Value >= 2 && ideas.TopicTransitions.Value <= 5 {
		transitionScore = 85.0 // Optimal range
	}
	factors = append(factors, Factor{
		Name:         "Smooth Transitions",
		Value:        transitionScore,
		Weight:       0.15,
		Contribution: transitionScore * 0.15,
	})
	totalScore += transitionScore * 0.15
	
	// Conclusion presence (10% weight)
	conclusionScore := 70.0 // Default moderate score
	factors = append(factors, Factor{
		Name:         "Conclusion Clarity",
		Value:        conclusionScore,
		Weight:       0.10,
		Contribution: conclusionScore * 0.10,
	})
	totalScore += conclusionScore * 0.10
	
	// Introduction clarity (10% weight)
	introScore := 70.0 // Default moderate score
	factors = append(factors, Factor{
		Name:         "Introduction Clarity",
		Value:        introScore,
		Weight:       0.10,
		Contribution: introScore * 0.10,
	})
	totalScore += introScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getStructureDescription(totalScore),
		Factors:     factors,
	}
}

// calculateContextSufficiency evaluates if enough context is provided
func calculateContextSufficiency(ideas IdeaAnalysisMetrics, tokens TokenData) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Background information (25% weight)
	backgroundScore := 60.0 // Default moderate score
	if ideas.FactualContent.Value.TotalFacts > 3 {
		backgroundScore = math.Min(100, float64(ideas.FactualContent.Value.TotalFacts)*10)
	}
	factors = append(factors, Factor{
		Name:         "Background Info",
		Value:        backgroundScore,
		Weight:       0.25,
		Contribution: backgroundScore * 0.25,
	})
	totalScore += backgroundScore * 0.25
	
	// Assumption explicitness (20% weight)
	assumptionScore := 70.0 // Default score
	factors = append(factors, Factor{
		Name:         "Explicit Assumptions",
		Value:        assumptionScore,
		Weight:       0.20,
		Contribution: assumptionScore * 0.20,
	})
	totalScore += assumptionScore * 0.20
	
	// Domain terminology (20% weight)
	termScore := 75.0 // Default score
	factors = append(factors, Factor{
		Name:         "Domain Terminology",
		Value:        termScore,
		Weight:       0.20,
		Contribution: termScore * 0.20,
	})
	totalScore += termScore * 0.20
	
	// Reference completeness (15% weight)
	referenceScore := 70.0 // Default score
	factors = append(factors, Factor{
		Name:         "Complete References",
		Value:        referenceScore,
		Weight:       0.15,
		Contribution: referenceScore * 0.15,
	})
	totalScore += referenceScore * 0.15
	
	// Constraint specification (10% weight)
	constraintScore := 65.0 // Default score
	factors = append(factors, Factor{
		Name:         "Constraints Specified",
		Value:        constraintScore,
		Weight:       0.10,
		Contribution: constraintScore * 0.10,
	})
	totalScore += constraintScore * 0.10
	
	// Goal clarity (10% weight)
	goalScore := 75.0 // Default score
	factors = append(factors, Factor{
		Name:         "Clear Goals",
		Value:        goalScore,
		Weight:       0.10,
		Contribution: goalScore * 0.10,
	})
	totalScore += goalScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getContextDescription(totalScore),
		Factors:     factors,
	}
}

// calculateScopeManagement evaluates if the prompt scope is appropriate
func calculateScopeManagement(taskGraph TaskGraph, ideas IdeaAnalysisMetrics, tokens TokenData) GradeDimension {
	factors := []Factor{}
	totalScore := 0.0
	
	// Task count vs length ratio (25% weight)
	wordsPerTask := 100.0
	if taskGraph.TotalTasks > 0 {
		wordsPerTask = float64(tokens.TokenCounts.Words) / float64(taskGraph.TotalTasks)
	}
	ratioScore := 50.0
	if wordsPerTask >= 20 && wordsPerTask <= 100 {
		ratioScore = 90.0 // Optimal range
	} else if wordsPerTask < 10 {
		ratioScore = 30.0 // Too brief
	} else if wordsPerTask > 200 {
		ratioScore = 40.0 // Too verbose
	}
	factors = append(factors, Factor{
		Name:         "Task-Length Ratio",
		Value:        ratioScore,
		Weight:       0.25,
		Contribution: ratioScore * 0.25,
	})
	totalScore += ratioScore * 0.25
	
	// Conceptual breadth (20% weight)
	breadthScore := (1.0 - ideas.ConceptualBreadth.Value) * 100 // Inverse - too broad is bad
	factors = append(factors, Factor{
		Name:         "Focused Scope",
		Value:        breadthScore,
		Weight:       0.20,
		Contribution: breadthScore * 0.20,
	})
	totalScore += breadthScore * 0.20
	
	// Detail depth consistency (20% weight)
	depthScore := 75.0 // Default score
	if ideas.IdeaComplexity.Value >= 3 && ideas.IdeaComplexity.Value <= 6 {
		depthScore = 90.0 // Optimal complexity range
	} else if ideas.IdeaComplexity.Value > 8 {
		depthScore = 50.0 // Too complex
	}
	factors = append(factors, Factor{
		Name:         "Detail Consistency",
		Value:        depthScore,
		Weight:       0.20,
		Contribution: depthScore * 0.20,
	})
	totalScore += depthScore * 0.20
	
	// Focus maintenance (15% weight)
	focusScore := ideas.ThematicConsistency.Value * 100
	factors = append(factors, Factor{
		Name:         "Focus Maintenance",
		Value:        focusScore,
		Weight:       0.15,
		Contribution: focusScore * 0.15,
	})
	totalScore += focusScore * 0.15
	
	// Scope creep indicators (10% weight)
	creepScore := 80.0
	if ideas.TopicTransitions.Value > 7 {
		creepScore = 40.0 // Too many topic changes
	}
	factors = append(factors, Factor{
		Name:         "No Scope Creep",
		Value:        creepScore,
		Weight:       0.10,
		Contribution: creepScore * 0.10,
	})
	totalScore += creepScore * 0.10
	
	// Priority specification (10% weight)
	priorityScore := 60.0
	if taskGraph.TotalTasks > 0 {
		highPriorityCount := 0
		for _, task := range taskGraph.Tasks {
			if task.Priority == "high" {
				highPriorityCount++
			}
		}
		if highPriorityCount > 0 && highPriorityCount <= taskGraph.TotalTasks/3 {
			priorityScore = 85.0 // Good prioritization
		}
	}
	factors = append(factors, Factor{
		Name:         "Clear Priorities",
		Value:        priorityScore,
		Weight:       0.10,
		Contribution: priorityScore * 0.10,
	})
	totalScore += priorityScore * 0.10
	
	return GradeDimension{
		Score:       math.Round(totalScore*100) / 100,
		Grade:       scoreToGrade(totalScore),
		Label:       getQualityLabel(totalScore),
		Description: getScopeDescription(totalScore),
		Factors:     factors,
	}
}

// Helper functions

func scoreToGrade(score float64) string {
	if score >= 95 {
		return "A+"
	} else if score >= 90 {
		return "A"
	} else if score >= 87 {
		return "A-"
	} else if score >= 84 {
		return "B+"
	} else if score >= 80 {
		return "B"
	} else if score >= 77 {
		return "B-"
	} else if score >= 74 {
		return "C+"
	} else if score >= 70 {
		return "C"
	} else if score >= 67 {
		return "C-"
	} else if score >= 64 {
		return "D+"
	} else if score >= 60 {
		return "D"
	} else if score >= 57 {
		return "D-"
	}
	return "F"
}

func getGradeColor(grade string) string {
	switch grade[0] {
	case 'A':
		return "#4CAF50" // Green
	case 'B':
		return "#8BC34A" // Light green
	case 'C':
		return "#FFC107" // Yellow
	case 'D':
		return "#FF9800" // Orange
	case 'F':
		return "#F44336" // Red
	default:
		return "#9E9E9E" // Grey
	}
}

func getQualityLabel(score float64) string {
	if score >= 90 {
		return "Excellent"
	} else if score >= 80 {
		return "Good"
	} else if score >= 70 {
		return "Fair"
	} else if score >= 60 {
		return "Poor"
	}
	return "Very Poor"
}

func getComplexityLabel(score float64) string {
	if score >= 80 {
		return "More Complex"
	} else if score >= 60 {
		return "Moderately Complex"
	} else if score >= 40 {
		return "Balanced"
	} else if score >= 20 {
		return "Less Complex"
	}
	return "Minimal Complexity"
}

// Description generators
func getUnderstandabilityDescription(score float64) string {
	if score >= 90 {
		return "Crystal clear and easy to understand"
	} else if score >= 75 {
		return "Clear with minor complexity"
	} else if score >= 60 {
		return "Some areas need simplification"
	} else if score >= 40 {
		return "Difficult to understand, needs revision"
	}
	return "Very difficult to understand, major revision needed"
}

func getSpecificityDescription(score float64) string {
	if score >= 90 {
		return "Highly specific and unambiguous"
	} else if score >= 75 {
		return "Mostly specific with minor ambiguity"
	} else if score >= 60 {
		return "Some vague areas need clarification"
	} else if score >= 40 {
		return "Too vague, needs more specificity"
	}
	return "Extremely vague and ambiguous"
}

func getTaskComplexityDescription(score float64) string {
	if score >= 80 {
		return "Highly complex with many interdependent tasks"
	} else if score >= 60 {
		return "Complex with multiple dependencies"
	} else if score >= 40 {
		return "Moderate complexity with some dependencies"
	} else if score >= 20 {
		return "Simple with few tasks"
	}
	return "Very simple with minimal tasks"
}

func getClarityDescription(score float64) string {
	if score >= 90 {
		return "Exceptionally clear intent and structure"
	} else if score >= 75 {
		return "Clear with good logical flow"
	} else if score >= 60 {
		return "Mostly clear with some confusion"
	} else if score >= 40 {
		return "Unclear in several areas"
	}
	return "Very unclear and confusing"
}

func getActionabilityDescription(score float64) string {
	if score >= 90 {
		return "Highly actionable with clear steps"
	} else if score >= 75 {
		return "Actionable with good direction"
	} else if score >= 60 {
		return "Somewhat actionable but needs clarity"
	} else if score >= 40 {
		return "Limited actionability"
	}
	return "Not actionable, needs complete restructuring"
}

func getStructureDescription(score float64) string {
	if score >= 90 {
		return "Excellent organization and flow"
	} else if score >= 75 {
		return "Well-structured with good progression"
	} else if score >= 60 {
		return "Adequate structure with room for improvement"
	} else if score >= 40 {
		return "Poor structure affecting comprehension"
	}
	return "Very poor organization"
}

func getContextDescription(score float64) string {
	if score >= 90 {
		return "Complete context provided"
	} else if score >= 75 {
		return "Good context with minor gaps"
	} else if score >= 60 {
		return "Adequate context but needs more detail"
	} else if score >= 40 {
		return "Insufficient context provided"
	}
	return "Severely lacking context"
}

func getScopeDescription(score float64) string {
	if score >= 90 {
		return "Well-scoped and focused"
	} else if score >= 75 {
		return "Good scope with minor adjustments needed"
	} else if score >= 60 {
		return "Scope needs some refinement"
	} else if score >= 40 {
		return "Scope too broad or narrow"
	}
	return "Scope severely misaligned"
}

// Utility counting functions
func countPronouns(words []string) int {
	pronouns := map[string]bool{
		"it": true, "this": true, "that": true, "these": true, "those": true,
		"they": true, "them": true, "their": true, "theirs": true,
		"he": true, "she": true, "him": true, "her": true, "his": true, "hers": true,
	}
	count := 0
	for _, word := range words {
		if pronouns[word] {
			count++
		}
	}
	return count
}

func countAbstractWords(words []string) int {
	abstract := map[string]bool{
		"thing": true, "stuff": true, "concept": true, "idea": true,
		"notion": true, "aspect": true, "element": true, "factor": true,
		"component": true, "part": true, "piece": true, "item": true,
		"something": true, "anything": true, "everything": true,
	}
	count := 0
	for _, word := range words {
		if abstract[word] {
			count++
		}
	}
	return count
}

func countCapitalizedWords(text string) int {
	words := strings.Fields(text)
	count := 0
	for i, word := range words {
		if len(word) > 0 && i > 0 { // Skip first word of sentences
			if unicode.IsUpper(rune(word[0])) {
				count++
			}
		}
	}
	return count
}

func countNumericContent(text string) int {
	re := regexp.MustCompile(`\d+`)
	matches := re.FindAllString(text, -1)
	return len(matches)
}

func countTemporalMarkers(words []string) int {
	temporal := map[string]bool{
		"first": true, "then": true, "next": true, "after": true,
		"before": true, "finally": true, "subsequently": true,
		"meanwhile": true, "during": true, "while": true,
		"afterwards": true, "previously": true, "later": true,
		"now": true, "today": true, "tomorrow": true, "yesterday": true,
	}
	count := 0
	for _, word := range words {
		if temporal[word] {
			count++
		}
	}
	return count
}

// calculateOverallGrade computes the composite grade
func calculateOverallGrade(grade *PromptGrade) OverallGrade {
	// Weighted average as per design doc
	overallScore := grade.Understandability.Score*0.20 +
		grade.Specificity.Score*0.15 +
		grade.TaskComplexity.Score*0.15 +
		grade.Clarity.Score*0.15 +
		grade.Actionability.Score*0.15 +
		grade.StructureQuality.Score*0.10 +
		grade.ContextSufficiency.Score*0.05 +
		grade.ScopeManagement.Score*0.05
	
	letterGrade := scoreToGrade(overallScore)
	
	// Determine percentile (simple heuristic)
	percentile := int(overallScore)
	if percentile > 95 {
		percentile = 99
	} else if percentile > 90 {
		percentile = 95
	} else if percentile > 80 {
		percentile = 85
	} else if percentile > 70 {
		percentile = 70
	} else if percentile > 60 {
		percentile = 50
	} else {
		percentile = int(overallScore * 0.8)
	}
	
	// Generate summary
	summary := ""
	if overallScore >= 90 {
		summary = "Exceptional prompt quality - clear, specific, and well-structured"
	} else if overallScore >= 80 {
		summary = "Good prompt with minor areas for improvement"
	} else if overallScore >= 70 {
		summary = "Average prompt - several areas need attention"
	} else if overallScore >= 60 {
		summary = "Below average prompt - significant improvements needed"
	} else {
		summary = "Poor prompt quality - requires major revision"
	}
	
	return OverallGrade{
		Score:      math.Round(overallScore*100) / 100,
		Grade:      letterGrade,
		GradeColor: getGradeColor(letterGrade),
		Summary:    summary,
		Percentile: percentile,
	}
}

// generateSuggestions creates actionable improvement suggestions
func generateSuggestions(grade *PromptGrade) []Suggestion {
	suggestions := []Suggestion{}
	
	// Understandability suggestions
	if grade.Understandability.Score < 60 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Understandability",
			Priority:  "high",
			Message:   "Simplify sentences - aim for 15-20 words per sentence",
			Impact:    "Improve readability by 20-30 points",
			Example:   "Break: 'The complex system that we need to implement...' Into: 'We need to implement a system. The system will...'",
		})
		if grade.Understandability.Score < 40 {
			suggestions = append(suggestions, Suggestion{
				Dimension: "Understandability",
				Priority:  "high",
				Message:   "Replace complex words with simpler alternatives",
				Impact:    "Make prompt accessible to wider audience",
			})
		}
	}
	
	// Specificity suggestions
	if grade.Specificity.Score < 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Specificity",
			Priority:  "high",
			Message:   "Replace pronouns (it, this, that) with specific nouns",
			Impact:    "Reduce ambiguity by 15-25%",
			Example:   "Change: 'Update it to handle this' To: 'Update the authentication system to handle OAuth tokens'",
		})
	}
	if grade.Specificity.Score < 50 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Specificity",
			Priority:  "high",
			Message:   "Add concrete examples to abstract concepts",
			Impact:    "Improve clarity significantly",
		})
	}
	
	// Task complexity suggestions
	if grade.TaskComplexity.Score > 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Task Complexity",
			Priority:  "medium",
			Message:   "Consider breaking this into multiple smaller prompts",
			Impact:    "Reduce cognitive load and improve success rate",
		})
		if grade.TaskComplexity.Score > 80 {
			suggestions = append(suggestions, Suggestion{
				Dimension: "Task Complexity",
				Priority:  "high",
				Message:   "Reduce task dependencies by making some tasks independent",
				Impact:    "Simplify execution path",
			})
		}
	}
	
	// Clarity suggestions
	if grade.Clarity.Score < 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Clarity",
			Priority:  "medium",
			Message:   "Ensure consistent verb tenses throughout",
			Impact:    "Improve logical flow",
		})
	}
	
	// Actionability suggestions
	if grade.Actionability.Score < 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Actionability",
			Priority:  "high",
			Message:   "Add more action verbs (create, analyze, implement, build)",
			Impact:    "Make prompt more executable",
			Example:   "Instead of: 'The system should have authentication' Use: 'Implement OAuth authentication in the system'",
		})
	}
	
	// Structure suggestions
	if grade.StructureQuality.Score < 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Structure",
			Priority:  "medium",
			Message:   "Add transition words (first, then, next, finally) between sections",
			Impact:    "Improve readability and flow",
		})
	}
	
	// Context suggestions
	if grade.ContextSufficiency.Score < 70 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Context",
			Priority:  "low",
			Message:   "Provide more background information and define technical terms",
			Impact:    "Ensure complete understanding",
		})
	}
	
	// Scope suggestions
	if grade.ScopeManagement.Score < 60 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Scope",
			Priority:  "medium",
			Message:   "Narrow focus to core objectives",
			Impact:    "Improve prompt effectiveness",
		})
	} else if grade.ScopeManagement.Score > 80 && grade.TaskComplexity.Score < 30 {
		suggestions = append(suggestions, Suggestion{
			Dimension: "Scope",
			Priority:  "low",
			Message:   "Consider adding more detail to broad tasks",
			Impact:    "Provide better guidance",
		})
	}
	
	// Sort suggestions by priority
	// High priority first, then medium, then low
	priorityOrder := map[string]int{"high": 0, "medium": 1, "low": 2}
	for i := 0; i < len(suggestions); i++ {
		for j := i + 1; j < len(suggestions); j++ {
			if priorityOrder[suggestions[i].Priority] > priorityOrder[suggestions[j].Priority] {
				suggestions[i], suggestions[j] = suggestions[j], suggestions[i]
			}
		}
	}
	
	// Limit to top 5 suggestions
	if len(suggestions) > 5 {
		suggestions = suggestions[:5]
	}
	
	return suggestions
}

// identifyStrengthsAndWeaknesses analyzes the grades to find strong and weak areas
func identifyStrengthsAndWeaknesses(grade *PromptGrade) ([]string, []string) {
	strengths := []string{}
	weakAreas := []string{}
	
	// Check each dimension
	dimensions := []struct {
		name  string
		score float64
		label string
	}{
		{"Understandability", grade.Understandability.Score, grade.Understandability.Label},
		{"Specificity", grade.Specificity.Score, grade.Specificity.Label},
		{"Task Complexity", grade.TaskComplexity.Score, getComplexityStrengthLabel(grade.TaskComplexity.Score)},
		{"Clarity", grade.Clarity.Score, grade.Clarity.Label},
		{"Actionability", grade.Actionability.Score, grade.Actionability.Label},
		{"Structure", grade.StructureQuality.Score, grade.StructureQuality.Label},
		{"Context", grade.ContextSufficiency.Score, grade.ContextSufficiency.Label},
		{"Scope", grade.ScopeManagement.Score, grade.ScopeManagement.Label},
	}
	
	for _, dim := range dimensions {
		if dim.score >= 85 {
			strengths = append(strengths, dim.name+": "+dim.label)
		} else if dim.score < 60 {
			weakAreas = append(weakAreas, dim.name+": "+dim.label)
		}
	}
	
	// Add default messages if empty
	if len(strengths) == 0 {
		strengths = append(strengths, "No exceptional strengths identified")
	}
	if len(weakAreas) == 0 {
		weakAreas = append(weakAreas, "No critical weaknesses identified")
	}
	
	return strengths, weakAreas
}

func getComplexityStrengthLabel(score float64) string {
	if score >= 40 && score <= 60 {
		return "Well-balanced complexity"
	} else if score < 40 {
		return "Appropriately simple"
	}
	return "Handles complex requirements"
}