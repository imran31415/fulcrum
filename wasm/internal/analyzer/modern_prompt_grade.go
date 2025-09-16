package analyzer

import (
	"math"
	"strings"
)

// ModernPromptGrade represents a context-aware prompt evaluation system
// Based on real-world prompt engineering best practices from Cursor, Claude, and other AI tools
type ModernPromptGrade struct {
	Classification    PromptClassification `json:"classification"`
	OverallGrade      ModernOverallGrade   `json:"overall_grade"`
	Dimensions        ModernDimensions     `json:"dimensions"`
	Suggestions       []ModernSuggestion   `json:"suggestions"`
	Strengths         []string             `json:"strengths"`
	ImprovementAreas  []string             `json:"improvement_areas"`
	QualityIndicators QualityIndicators    `json:"quality_indicators"`
}

// ModernOverallGrade with more realistic scoring
type ModernOverallGrade struct {
	Score      float64 `json:"score"`       // 0-100
	Grade      string  `json:"grade"`       // A+ to F
	GradeColor string  `json:"grade_color"` 
	Label      string  `json:"label"`       // Excellent, Good, etc.
	Summary    string  `json:"summary"`     // Context-aware summary
	Percentile int     `json:"percentile"`  // Realistic percentile
}

// ModernDimensions - context-aware evaluation criteria
type ModernDimensions struct {
	Clarity           ModernDimension `json:"clarity"`
	Specificity       ModernDimension `json:"specificity"`  
	Completeness      ModernDimension `json:"completeness"`
	Actionability     ModernDimension `json:"actionability"`
	ContextProvision  ModernDimension `json:"context_provision"`
	StructureQuality  ModernDimension `json:"structure_quality"`
}

// ModernDimension with context-aware scoring
type ModernDimension struct {
	Score       float64                `json:"score"`       // 0-100
	Grade       string                 `json:"grade"`       
	Label       string                 `json:"label"`       
	Description string                 `json:"description"` 
	Factors     []ModernFactor         `json:"factors"`     
	Context     DimensionContext       `json:"context"`     // Context-specific info
}

// DimensionContext provides prompt-type specific context
type DimensionContext struct {
	PromptTypeRelevance float64 `json:"prompt_type_relevance"` // How important this dimension is for this prompt type
	ExpectedRange       struct {
		Min float64 `json:"min"`
		Max float64 `json:"max"`
	} `json:"expected_range"`
	TypeSpecificTips []string `json:"type_specific_tips"`
}

// ModernFactor with better weighting
type ModernFactor struct {
	Name            string  `json:"name"`
	Value           float64 `json:"value"`
	Weight          float64 `json:"weight"`
	Contribution    float64 `json:"contribution"`
	IsPositive      bool    `json:"is_positive"`      // Whether higher is better
	ContextRelevant bool    `json:"context_relevant"` // Whether relevant for this prompt type
}

// ModernSuggestion - practical, context-aware suggestions
type ModernSuggestion struct {
	Category         string   `json:"category"`          // e.g., "Structure", "Specificity"
	Priority         string   `json:"priority"`          // "critical", "high", "medium", "low"
	Title            string   `json:"title"`             // Short, actionable title
	Description      string   `json:"description"`       // Detailed explanation
	Example          string   `json:"example,omitempty"` // Before/after example
	ImpactScore      float64  `json:"impact_score"`      // Expected improvement (0-10)
	PromptTypes      []string `json:"prompt_types"`      // Which prompt types this applies to
	ApplicabilityScore float64 `json:"applicability_score"` // How applicable to this specific prompt (0-1)
}

// QualityIndicators - measurable quality signals
type QualityIndicators struct {
	HasClearGoal        bool    `json:"has_clear_goal"`
	HasSpecificContext  bool    `json:"has_specific_context"`
	HasActionableSteps  bool    `json:"has_actionable_steps"`
	HasConstraints      bool    `json:"has_constraints"`
	HasExamples         bool    `json:"has_examples"`
	TechnicalDepth      float64 `json:"technical_depth"`      // 0-1
	StructuralQuality   float64 `json:"structural_quality"`   // 0-1
	ClarityScore        float64 `json:"clarity_score"`        // 0-1
}

// ModernPromptGrader - the main grading engine
type ModernPromptGrader struct {
	classifier   *PromptClassifier
	dimensionWeights map[PromptType]DimensionWeights
}

// DimensionWeights - different weights for different prompt types
type DimensionWeights struct {
	Clarity          float64
	Specificity      float64
	Completeness     float64
	Actionability    float64
	ContextProvision float64
	StructureQuality float64
}

// NewModernPromptGrader creates a grader calibrated for real-world prompt quality
func NewModernPromptGrader() *ModernPromptGrader {
	return &ModernPromptGrader{
		classifier: NewPromptClassifier(),
		dimensionWeights: map[PromptType]DimensionWeights{
			TechnicalSpec: {
				Clarity:          0.20, // Very important for tech specs
				Specificity:      0.25, // Critical - must be specific
				Completeness:     0.20, // Must have all requirements
				Actionability:    0.15, // Should be implementable
				ContextProvision: 0.15, // Need technical context
				StructureQuality: 0.05, // Less important than content
			},
			CodeGeneration: {
				Clarity:          0.15,
				Specificity:      0.30, // Extremely important for code
				Completeness:     0.20, // Need all requirements
				Actionability:    0.25, // Must be implementable
				ContextProvision: 0.05, // Code is often self-contained
				StructureQuality: 0.05,
			},
			CreativeTask: {
				Clarity:          0.25, // Creative brief must be clear
				Specificity:      0.15, // Can be more open-ended
				Completeness:     0.15, // Some ambiguity is okay
				Actionability:    0.20, // Should inspire action
				ContextProvision: 0.15, // Context helps creativity
				StructureQuality: 0.10, // Structure helps organize ideas
			},
			DataAnalysis: {
				Clarity:          0.20,
				Specificity:      0.25, // Data analysis needs precision
				Completeness:     0.20, // Need all data context
				Actionability:    0.15, // Should be analyzable
				ContextProvision: 0.15, // Data context is critical
				StructureQuality: 0.05,
			},
			Writing: {
				Clarity:          0.25, // Writing must be clear
				Specificity:      0.15, // Can be more flexible
				Completeness:     0.15, // Some details can emerge
				Actionability:    0.15, // Should be writable
				ContextProvision: 0.15, // Context helps writing
				StructureQuality: 0.15, // Structure important for writing
			},
			ProblemSolving: {
				Clarity:          0.25, // Problem must be clear
				Specificity:      0.20, // Problem details matter
				Completeness:     0.20, // Need full problem context
				Actionability:    0.25, // Must be solvable
				ContextProvision: 0.05, // Problems often self-contained
				StructureQuality: 0.05,
			},
			Learning: {
				Clarity:          0.30, // Learning requests must be clear
				Specificity:      0.20, // Need specific learning goals
				Completeness:     0.15, // Can build incrementally
				Actionability:    0.15, // Should be teachable
				ContextProvision: 0.15, // Context helps learning
				StructureQuality: 0.05,
			},
			General: {
				Clarity:          0.25, // Balanced approach
				Specificity:      0.20,
				Completeness:     0.15,
				Actionability:    0.20,
				ContextProvision: 0.10,
				StructureQuality: 0.10,
			},
		},
	}
}

// GradePrompt - main grading function with realistic scoring
func (grader *ModernPromptGrader) GradePrompt(
	text string,
	complexity ComplexityMetrics,
	tokens TokenData,
	preprocessing PreprocessingData,
	ideas IdeaAnalysisMetrics,
	taskGraph TaskGraph,
) *ModernPromptGrade {
	
	// 1. Classify the prompt type
	classification := grader.classifier.ClassifyPrompt(text)
	
	// 2. Calculate quality indicators
	indicators := grader.calculateQualityIndicators(text, tokens, ideas, taskGraph)
	
	// 3. Calculate context-aware dimensions
	dimensions := grader.calculateModernDimensions(text, classification.PrimaryType, complexity, tokens, ideas, taskGraph, indicators)
	
	// 4. Calculate overall grade with realistic scoring
	overallGrade := grader.realisticOverallGrade(dimensions, classification.PrimaryType)
	
	// 5. Generate practical suggestions
	suggestions := grader.practicalSuggestions(dimensions, classification.PrimaryType, text, indicators)
	
	// 6. Identify strengths and improvement areas
	strengths, improvementAreas := grader.strengthsAndImprovements(dimensions, classification.PrimaryType)
	
	return &ModernPromptGrade{
		Classification:    classification,
		OverallGrade:      overallGrade,
		Dimensions:        dimensions,
		Suggestions:       suggestions,
		Strengths:         strengths,
		ImprovementAreas:  improvementAreas,
		QualityIndicators: indicators,
	}
}

// realisticOverallGrade computes the overall grade from dimensions and prompt type
func (grader *ModernPromptGrader) realisticOverallGrade(dim ModernDimensions, pt PromptType) ModernOverallGrade {
	w := grader.dimensionWeights[pt]
	weighted := dim.Clarity.Score*w.Clarity +
		dim.Specificity.Score*w.Specificity +
		dim.Completeness.Score*w.Completeness +
		dim.Actionability.Score*w.Actionability +
		dim.ContextProvision.Score*w.ContextProvision +
		dim.StructureQuality.Score*w.StructureQuality

	// Normalize to 0-100 if weights don't sum to 1 (defensive)
	totalW := w.Clarity + w.Specificity + w.Completeness + w.Actionability + w.ContextProvision + w.StructureQuality
	if totalW > 0 && math.Abs(totalW-1.0) > 0.0001 {
		weighted = weighted / totalW
	}

	score := math.Round(weighted*100) / 100
	grade := grader.scoreToRealisticGrade(score)
	label := grader.getQualityLabel(score)
	// Simple percentile mapping
	percentile := int(math.Min(99, math.Max(1, score)))
	
	summary := ""
	switch label {
	case "Excellent":
		summary = "High-quality prompt with strong clarity and relevance"
	case "Good":
		summary = "Good prompt; minor refinements could make it excellent"
	case "Adequate":
		summary = "Workable prompt with room for improvement"
	case "Needs Improvement":
		summary = "Several areas need attention to be effective"
	default:
		summary = "Prompt quality is low; consider restructuring"
	}

	return ModernOverallGrade{
		Score:      score,
		Grade:      grade,
		GradeColor: getGradeColor(grade),
		Label:      label,
		Summary:    summary,
		Percentile: percentile,
	}
}

// practicalSuggestions generates context-aware suggestions (lightweight initial set)
func (grader *ModernPromptGrader) practicalSuggestions(dim ModernDimensions, pt PromptType, text string, ind QualityIndicators) []ModernSuggestion {
	suggestions := []ModernSuggestion{}
	add := func(cat, prio, title, desc, ex string, impact float64) {
		suggestions = append(suggestions, ModernSuggestion{
			Category:    cat,
			Priority:    prio,
			Title:       title,
			Description: desc,
			Example:     ex,
			ImpactScore: impact,
			PromptTypes: []string{string(pt)},
			ApplicabilityScore: 0.9,
		})
	}
	
	if dim.Specificity.Score < 70 {
		add("Specificity", "high", "Be more specific about inputs/outputs", "Specify exact inputs, outputs, formats, or constraints so the response is unambiguous.", "E.g., 'Return JSON with fields: id, name, status'", 7.5)
	}
	if dim.Completeness.Score < 70 {
		add("Completeness", "high", "Fill missing requirements", "List all key requirements and edge cases the solution should handle.", "E.g., 'Handle retries on 5xx with backoff'", 7.0)
	}
	if pt == TechnicalSpec && dim.ContextProvision.Score < 70 {
		add("Context", "medium", "Provide technical context and constraints", "Add stack, environment, limits, SLAs, and security expectations.", "E.g., 'Node.js 20, AWS Lambda, 200ms p95'", 6.0)
	}
	if dim.Actionability.Score < 65 {
		add("Actionability", "medium", "Add step-by-step deliverables", "Include clear deliverables or steps so the agent can execute easily.", "E.g., '1) Schema, 2) CRUD endpoints, 3) tests'", 6.5)
	}
	return suggestions
}

// strengthsAndImprovements derives brief strengths and improvement areas
func (grader *ModernPromptGrader) strengthsAndImprovements(dim ModernDimensions, pt PromptType) ([]string, []string) {
	strengths := []string{}
	improve := []string{}
	check := func(name string, score float64) {
		if score >= 80 {
			strengths = append(strengths, name)
		} else if score < 65 {
			improve = append(improve, name)
		}
	}
	check("Clarity", dim.Clarity.Score)
	check("Specificity", dim.Specificity.Score)
	check("Completeness", dim.Completeness.Score)
	check("Actionability", dim.Actionability.Score)
	check("Context", dim.ContextProvision.Score)
	check("Structure", dim.StructureQuality.Score)
	return strengths, improve
}

// calculateQualityIndicators - measurable quality signals
func (grader *ModernPromptGrader) calculateQualityIndicators(text string, tokens TokenData, ideas IdeaAnalysisMetrics, taskGraph TaskGraph) QualityIndicators {
	lowText := strings.ToLower(text)
	
	// Check for clear goals
	goalWords := []string{"goal", "objective", "need", "want", "should", "must", "create", "build", "implement", "analyze", "write"}
	hasGoal := false
	for _, word := range goalWords {
		if strings.Contains(lowText, word) {
			hasGoal = true
			break
		}
	}
	
	// Check for specific context
	contextWords := []string{"because", "for", "using", "with", "in the context of", "requirements", "constraints"}
	hasContext := false
	for _, word := range contextWords {
		if strings.Contains(lowText, word) {
			hasContext = true
			break
		}
	}
	
	// Check for actionable steps
	hasSteps := taskGraph.TotalTasks > 0 || 
		strings.Contains(lowText, "first") ||
		strings.Contains(lowText, "then") ||
		strings.Contains(lowText, "next") ||
		strings.Contains(lowText, "step")
	
	// Check for constraints
	constraintWords := []string{"within", "using only", "without", "must not", "should not", "limit", "constraint", "requirement"}
	hasConstraints := false
	for _, word := range constraintWords {
		if strings.Contains(lowText, word) {
			hasConstraints = true
			break
		}
	}
	
	// Check for examples
	exampleWords := []string{"example", "like", "such as", "for instance", "e.g.", "for example"}
	hasExamples := false
	for _, word := range exampleWords {
		if strings.Contains(lowText, word) {
			hasExamples = true
			break
		}
	}
	
	// Technical depth (0-1)
	techWords := []string{"api", "database", "system", "architecture", "function", "class", "method", "algorithm"}
	techCount := 0
	for _, word := range techWords {
		if strings.Contains(lowText, word) {
			techCount++
		}
	}
	technicalDepth := math.Min(1.0, float64(techCount)/5.0)
	
	// Structural quality based on organization
	structuralQuality := 0.5 // Base score
	if ideas.IdeaProgression.Value == "linear" {
		structuralQuality += 0.3
	}
	if ideas.ConceptualCoherence.Value > 0.7 {
		structuralQuality += 0.2
	}
	structuralQuality = math.Min(1.0, structuralQuality)
	
	// Clarity score based on complexity metrics
	clarityScore := 0.8 // Start optimistic
	// Note: Use available proxies if some metrics are not present in this context
	// In the full pipeline, complexity metrics will be provided
	clarityScore = math.Max(0.0, math.Min(1.0, clarityScore))
	
	return QualityIndicators{
		HasClearGoal:       hasGoal,
		HasSpecificContext: hasContext,
		HasActionableSteps: hasSteps,
		HasConstraints:     hasConstraints,
		HasExamples:        hasExamples,
		TechnicalDepth:     technicalDepth,
		StructuralQuality:  structuralQuality,
		ClarityScore:       clarityScore,
	}
}

// calculateModernDimensions with context-aware, realistic scoring
func (grader *ModernPromptGrader) calculateModernDimensions(
	text string, 
	promptType PromptType, 
	complexity ComplexityMetrics, 
	tokens TokenData, 
	ideas IdeaAnalysisMetrics, 
	taskGraph TaskGraph,
	indicators QualityIndicators,
) ModernDimensions {
	
	return ModernDimensions{
		Clarity:          grader.calculateClarity(text, complexity, indicators, promptType),
		Specificity:      grader.modernSpecificity(text, tokens, ideas, indicators, promptType),
		Completeness:     grader.modernCompleteness(text, taskGraph, ideas, indicators, promptType),
		Actionability:    grader.modernActionability(text, taskGraph, tokens, indicators, promptType),
		ContextProvision: grader.modernContextProvision(text, ideas, tokens, indicators, promptType),
		StructureQuality: grader.calculateStructureQuality(ideas, complexity, indicators, promptType),
	}
}

// calculateClarity - realistic clarity assessment
func (grader *ModernPromptGrader) calculateClarity(text string, complexity ComplexityMetrics, indicators QualityIndicators, promptType PromptType) ModernDimension {
	factors := []ModernFactor{}
	
	// Reading ease (adjusted for context)
	readingEase := complexity.FleschReadingEase.Value
	if promptType == TechnicalSpec || promptType == CodeGeneration {
		// Technical prompts can be more complex and still be clear
		readingEase = math.Max(30, readingEase) // Don't penalize technical language as much
	}
	readingScore := math.Min(100, readingEase)
	factors = append(factors, ModernFactor{
		Name: "Reading Ease",
		Value: readingScore,
		Weight: 0.3,
		Contribution: readingScore * 0.3,
		IsPositive: true,
		ContextRelevant: true,
	})
	
	// Sentence length (more forgiving)
	avgSentLength := complexity.SentenceStats.AverageWordsPerSent.Value
	sentLengthScore := 90.0 // Start optimistic
	if avgSentLength > 30 { // More lenient threshold
		sentLengthScore = math.Max(60, 90-(avgSentLength-30)*2)
	}
	factors = append(factors, ModernFactor{
		Name: "Sentence Length",
		Value: sentLengthScore,
		Weight: 0.25,
		Contribution: sentLengthScore * 0.25,
		IsPositive: true,
		ContextRelevant: true,
	})
	
	// Clear goal indicator
	goalScore := 60.0
	if indicators.HasClearGoal {
		goalScore = 90.0
	}
	factors = append(factors, ModernFactor{
		Name: "Clear Goal",
		Value: goalScore,
		Weight: 0.25,
		Contribution: goalScore * 0.25,
		IsPositive: true,
		ContextRelevant: true,
	})
	
	// Overall clarity from indicators
	clarityIndicatorScore := indicators.ClarityScore * 100
	factors = append(factors, ModernFactor{
		Name: "Overall Clarity",
		Value: clarityIndicatorScore,
		Weight: 0.2,
		Contribution: clarityIndicatorScore * 0.2,
		IsPositive: true,
		ContextRelevant: true,
	})
	
	// Calculate final score
	totalScore := 0.0
	for _, factor := range factors {
		totalScore += factor.Contribution
	}
	
	// Ensure minimum score for reasonable prompts
	finalScore := math.Max(40, totalScore)
	
	return ModernDimension{
		Score:       math.Round(finalScore*100) / 100,
		Grade:       grader.scoreToRealisticGrade(finalScore),
		Label:       grader.getQualityLabel(finalScore),
		Description: grader.getClarityDescription(finalScore, promptType),
		Factors:     factors,
		Context:     grader.getDimensionContext("clarity", promptType),
	}
}

// Additional dimension calculations now use real metrics.

func clamp(v, min, max float64) float64 {
	if v < min { return min }
	if v > max { return max }
	return v
}

func safeDiv(a, b float64) float64 {
	if b == 0 { return 0 }
	return a / b
}

func (grader *ModernPromptGrader) modernSpecificity(text string, tokens TokenData, ideas IdeaAnalysisMetrics, indicators QualityIndicators, pt PromptType) ModernDimension {
	words := float64(tokens.TokenCounts.Words)

	// Components
	pronouns := float64(len(tokens.PartOfSpeech.Pronouns))
	pronounRatio := safeDiv(pronouns, words)
	pronounScore := clamp(100.0 - pronounRatio*500.0, 30.0, 100.0) // penalize heavy pronoun usage

	neCount := float64(len(tokens.SemanticFeatures.NamedEntities))
	namedScore := clamp(neCount*15.0, 0.0, 100.0) // reward named entities

	numRatio := safeDiv(float64(tokens.TokenCounts.Numbers), words)
	numericScore := clamp(numRatio*400.0, 0.0, 100.0) // reward numeric specificity

	nouns := float64(len(tokens.PartOfSpeech.Nouns))
	nounRatio := safeDiv(nouns, words)
	concreteScore := clamp(nounRatio*120.0, 20.0, 100.0) // nouns indicate concreteness

	qa := ideas.QuestionAnalysis.Value
	qScore := 70.0
	if qa.TotalQuestions > 0 {
		qScore = clamp(safeDiv(float64(len(qa.Actionable)), float64(qa.TotalQuestions))*100.0, 30.0, 100.0)
	}

	factors := []ModernFactor{
		{Name: "Low Pronoun Usage", Value: pronounScore, Weight: 0.30, Contribution: pronounScore * 0.30, IsPositive: true, ContextRelevant: true},
		{Name: "Named Entities", Value: namedScore, Weight: 0.25, Contribution: namedScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "Numeric Specificity", Value: numericScore, Weight: 0.15, Contribution: numericScore * 0.15, IsPositive: true, ContextRelevant: true},
		{Name: "Concrete Nouns", Value: concreteScore, Weight: 0.15, Contribution: concreteScore * 0.15, IsPositive: true, ContextRelevant: true},
		{Name: "Question Clarity", Value: qScore, Weight: 0.15, Contribution: qScore * 0.15, IsPositive: true, ContextRelevant: true},
	}

	total := 0.0
	for _, f := range factors { total += f.Contribution }
	score := math.Round(total*100) / 100

	return ModernDimension{
		Score:       score,
		Grade:       grader.scoreToRealisticGrade(score),
		Label:       grader.getQualityLabel(score),
		Description: "Measures concreteness via entities, numbers, nouns, and low pronoun use",
		Factors:     factors,
		Context:     grader.getDimensionContext("specificity", pt),
	}
}

func (grader *ModernPromptGrader) modernCompleteness(text string, taskGraph TaskGraph, ideas IdeaAnalysisMetrics, indicators QualityIndicators, pt PromptType) ModernDimension {
	// Components
	factDensity := ideas.FactualContent.Value.FactDensity // facts per sentence
	factsScore := clamp(factDensity*120.0, 20.0, 100.0)

	concepts := float64(len(ideas.KeyConcepts.Value))
	conceptScore := clamp(concepts*5.0, 30.0, 100.0)

	tasksScore := 50.0
	if taskGraph.TotalTasks > 0 { tasksScore = clamp(float64(taskGraph.TotalTasks)*12.0, 50.0, 100.0) }
	if len(taskGraph.CriticalPath) > 0 { tasksScore = math.Max(tasksScore, 85.0) }

	// We'll also use indicators.HasConstraints / HasExamples
	constraintsScore := 60.0
	if indicators.HasConstraints { constraintsScore += 20.0 }
	if indicators.HasExamples { constraintsScore += 10.0 }
	constraintsScore = clamp(constraintsScore, 40.0, 95.0)

	factors := []ModernFactor{
		{Name: "Factual Coverage", Value: factsScore, Weight: 0.30, Contribution: factsScore * 0.30, IsPositive: true, ContextRelevant: true},
		{Name: "Concept Coverage", Value: conceptScore, Weight: 0.20, Contribution: conceptScore * 0.20, IsPositive: true, ContextRelevant: true},
		{Name: "Tasks & Dependencies", Value: tasksScore, Weight: 0.25, Contribution: tasksScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "Constraints/Examples", Value: constraintsScore, Weight: 0.25, Contribution: constraintsScore * 0.25, IsPositive: true, ContextRelevant: true},
	}
	total := 0.0
	for _, f := range factors { total += f.Contribution }
	score := math.Round(total*100) / 100

	return ModernDimension{Score: score, Grade: grader.scoreToRealisticGrade(score), Label: grader.getQualityLabel(score), Description: "Checks for facts, concepts, tasks, constraints/examples", Factors: factors, Context: grader.getDimensionContext("completeness", pt)}
}

func (grader *ModernPromptGrader) modernActionability(text string, taskGraph TaskGraph, tokens TokenData, indicators QualityIndicators, pt PromptType) ModernDimension {
	lower := strings.ToLower(text)
	// Components
	tasks := float64(taskGraph.TotalTasks)
	taskScore := 60.0
	if tasks > 0 { taskScore = clamp(tasks*12.0, 60.0, 95.0) }
	if len(taskGraph.CriticalPath) > 0 { taskScore = math.Max(taskScore, 85.0) }

	verbRatio := safeDiv(float64(len(tokens.PartOfSpeech.Verbs)), float64(tokens.TokenCounts.Words))
	verbScore := clamp(verbRatio*300.0, 40.0, 95.0)

	stepsScore := 60.0
	if strings.Contains(lower, "deliverable") || strings.Contains(lower, "deliver") || strings.Contains(lower, "output") || strings.Contains(lower, "steps") || strings.Contains(lower, "phase") {
		stepsScore = 85.0
	}
	if indicators.HasActionableSteps { stepsScore = math.Max(stepsScore, 90.0) }

	factors := []ModernFactor{
		{Name: "Tasks & Sequence", Value: taskScore, Weight: 0.35, Contribution: taskScore * 0.35, IsPositive: true, ContextRelevant: true},
		{Name: "Action Verb Density", Value: verbScore, Weight: 0.25, Contribution: verbScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "Steps/Deliverables Mentioned", Value: stepsScore, Weight: 0.25, Contribution: stepsScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "General Readiness", Value: 70.0, Weight: 0.15, Contribution: 70.0 * 0.15, IsPositive: true, ContextRelevant: true},
	}
	total := 0.0
	for _, f := range factors { total += f.Contribution }
	score := math.Round(total*100) / 100
	return ModernDimension{Score: score, Grade: grader.scoreToRealisticGrade(score), Label: grader.getQualityLabel(score), Description: "Looks for tasks, sequencing, verbs, and deliverables", Factors: factors, Context: grader.getDimensionContext("actionability", pt)}
}

func (grader *ModernPromptGrader) modernContextProvision(text string, ideas IdeaAnalysisMetrics, tokens TokenData, indicators QualityIndicators, pt PromptType) ModernDimension {
	lower := strings.ToLower(text)
	neCount := float64(len(tokens.SemanticFeatures.NamedEntities))
	namedScore := clamp(neCount*15.0, 0.0, 100.0)

	facts := float64(ideas.FactualContent.Value.TotalFacts)
	factsScore := clamp(facts*8.0, 20.0, 100.0)

	numRatio := safeDiv(float64(tokens.TokenCounts.Numbers), float64(tokens.TokenCounts.Words))
	numericScore := clamp(numRatio*400.0, 0.0, 100.0)

	domainScore := 60.0
	if strings.Contains(lower, "security") || strings.Contains(lower, "authentication") || strings.Contains(lower, "oauth") || strings.Contains(lower, "latency") || strings.Contains(lower, "throughput") || strings.Contains(lower, "budget") || strings.Contains(lower, "deadline") {
		domainScore = 85.0
	}
	if indicators.HasSpecificContext { domainScore = math.Max(domainScore, 90.0) }

	factors := []ModernFactor{
		{Name: "Named Entities", Value: namedScore, Weight: 0.25, Contribution: namedScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "Factual Context", Value: factsScore, Weight: 0.25, Contribution: factsScore * 0.25, IsPositive: true, ContextRelevant: true},
		{Name: "Quantitative Details", Value: numericScore, Weight: 0.15, Contribution: numericScore * 0.15, IsPositive: true, ContextRelevant: true},
		{Name: "Domain Constraints", Value: domainScore, Weight: 0.20, Contribution: domainScore * 0.20, IsPositive: true, ContextRelevant: true},
		{Name: "General Coherence", Value: ideas.ConceptualCoherence.Value*100.0, Weight: 0.15, Contribution: ideas.ConceptualCoherence.Value*100.0 * 0.15, IsPositive: true, ContextRelevant: true},
	}
	total := 0.0
	for _, f := range factors { total += f.Contribution }
	score := math.Round(total*100) / 100
	return ModernDimension{Score: score, Grade: grader.scoreToRealisticGrade(score), Label: grader.getQualityLabel(score), Description: "Context via entities, facts, numbers, domain constraints", Factors: factors, Context: grader.getDimensionContext("context", pt)}
}

func (grader *ModernPromptGrader) calculateStructureQuality(ideas IdeaAnalysisMetrics, complexity ComplexityMetrics, indicators QualityIndicators, pt PromptType) ModernDimension {
	coherence := ideas.ConceptualCoherence.Value * 100.0
	// Topic transitions optimal range 2-5
	trans := float64(ideas.TopicTransitions.Value)
	transScore := 85.0
	if trans < 2 { transScore = 70.0 }
	if trans > 5 { transScore = clamp(100.0 - (trans-5.0)*10.0, 40.0, 85.0) }

	progression := strings.ToLower(ideas.IdeaProgression.Value)
	progScore := 70.0
	if progression == "linear" { progScore = 90.0 } else if progression == "branching" { progScore = 80.0 } else if progression == "circular" { progScore = 60.0 }

	varVar := complexity.SentenceStats.SentenceLengthVar.Value
	varScore := clamp(100.0 - varVar*2.0, 40.0, 95.0)

	factors := []ModernFactor{
		{Name: "Coherence", Value: coherence, Weight: 0.40, Contribution: coherence * 0.40, IsPositive: true, ContextRelevant: true},
		{Name: "Transitions", Value: transScore, Weight: 0.20, Contribution: transScore * 0.20, IsPositive: true, ContextRelevant: true},
		{Name: "Idea Progression", Value: progScore, Weight: 0.20, Contribution: progScore * 0.20, IsPositive: true, ContextRelevant: true},
		{Name: "Sentence Variance", Value: varScore, Weight: 0.20, Contribution: varScore * 0.20, IsPositive: true, ContextRelevant: true},
	}
	total := 0.0
	for _, f := range factors { total += f.Contribution }
	score := math.Round(total*100) / 100
	return ModernDimension{Score: score, Grade: grader.scoreToRealisticGrade(score), Label: grader.getQualityLabel(score), Description: "Structure via coherence, transitions, progression, variance", Factors: factors, Context: grader.getDimensionContext("structure", pt)}
}

// scoreToRealisticGrade - more generous grade boundaries  
func (grader *ModernPromptGrader) scoreToRealisticGrade(score float64) string {
	if score >= 90 {
		return "A+"
	} else if score >= 85 {
		return "A"
	} else if score >= 80 {
		return "A-"
	} else if score >= 75 {
		return "B+"
	} else if score >= 70 {
		return "B"
	} else if score >= 65 {
		return "B-"
	} else if score >= 60 {
		return "C+"
	} else if score >= 55 {
		return "C"
	} else if score >= 50 {
		return "C-"
	} else if score >= 45 {
		return "D+"
	} else if score >= 40 {
		return "D"
	}
	return "F"
}

func (grader *ModernPromptGrader) getQualityLabel(score float64) string {
	if score >= 85 {
		return "Excellent"
	} else if score >= 75 {
		return "Good"  
	} else if score >= 65 {
		return "Adequate"
	} else if score >= 55 {
		return "Needs Improvement"
	}
	return "Poor"
}

func (grader *ModernPromptGrader) getClarityDescription(score float64, promptType PromptType) string {
	if score >= 85 {
		return "Very clear and easy to understand"
	} else if score >= 75 {
		return "Clear with good structure"
	} else if score >= 65 {
		return "Generally clear with minor issues"
	} else if score >= 55 {
		return "Somewhat unclear, needs refinement"
	}
	return "Unclear and difficult to follow"
}

func (grader *ModernPromptGrader) getDimensionContext(dimension string, promptType PromptType) DimensionContext {
	// Context-specific relevance and tips
	relevanceMap := map[PromptType]float64{
		TechnicalSpec:  0.9,
		CodeGeneration: 0.8,
		CreativeTask:   0.9,
		DataAnalysis:   0.8,
		Writing:        0.9,
		ProblemSolving: 0.95,
		Learning:       0.95,
		General:        0.8,
	}
	
	return DimensionContext{
		PromptTypeRelevance: relevanceMap[promptType],
		ExpectedRange: struct {
			Min float64 `json:"min"`
			Max float64 `json:"max"`
		}{
			Min: 60.0,
			Max: 95.0,
		},
		TypeSpecificTips: grader.getContextSpecificTips(dimension, promptType),
	}
}

func (grader *ModernPromptGrader) getContextSpecificTips(dimension string, promptType PromptType) []string {
	tips := map[PromptType]map[string][]string{
		TechnicalSpec: {
			"clarity": {"Use specific technical terms", "Break down complex requirements", "Include clear acceptance criteria"},
		},
		CodeGeneration: {
			"clarity": {"Specify programming language", "Include expected inputs/outputs", "Mention any constraints or libraries"},
		},
		// Add more as needed...
	}
	
	if typeTips, exists := tips[promptType]; exists {
		if dimensionTips, exists := typeTips[dimension]; exists {
			return dimensionTips
		}
	}
	
	return []string{"Focus on clear communication", "Be specific about requirements", "Provide necessary context"}
}