package analyzer

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

// InsightAnalysis represents transformed insights from comprehensive metrics
type InsightAnalysis struct {
	Summary            EnhancedStringMetric       `json:"summary"`
	MainInsights       EnhancedInsightListMetric  `json:"main_insights"`
	IdeaBreakdown      EnhancedIdeaBreakdown      `json:"idea_breakdown"`
	WritingQuality     EnhancedWritingQuality     `json:"writing_quality"`
	Recommendations    EnhancedRecommendations    `json:"recommendations"`
	ContentProfile     EnhancedContentProfile     `json:"content_profile"`
}

// EnhancedInsightListMetric for insights
type EnhancedInsightListMetric struct {
	Value               []Insight `json:"value"`
	Scale               string    `json:"scale"`
	HelpText            string    `json:"help_text"`
	PracticalApplication string    `json:"practical_application"`
}

// EnhancedIdeaBreakdown for detailed idea analysis
type EnhancedIdeaBreakdown struct {
	Value               IdeaBreakdown `json:"value"`
	Scale               string        `json:"scale"`
	HelpText            string        `json:"help_text"`
	PracticalApplication string        `json:"practical_application"`
}

// EnhancedWritingQuality for writing quality
type EnhancedWritingQuality struct {
	Value               WritingQuality `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

// EnhancedRecommendations for improvement suggestions
type EnhancedRecommendations struct {
	Value               []Recommendation `json:"value"`
	Scale               string           `json:"scale"`
	HelpText            string           `json:"help_text"`
	PracticalApplication string           `json:"practical_application"`
}

// EnhancedContentProfile for content characterization
type EnhancedContentProfile struct {
	Value               ContentProfile `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

// Core insight structures

type Insight struct {
	Type        string   `json:"type"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Evidence    []string `json:"evidence"`
	Impact      string   `json:"impact"`
	Priority    int      `json:"priority"`
}

type IdeaBreakdown struct {
	TotalIdeas       int                     `json:"total_ideas"`
	PrimaryIdeas     []PrimaryIdea          `json:"primary_ideas"`
	IdeaConnections  []IdeaConnection       `json:"idea_connections"`
	IdeaDistribution map[string]int         `json:"idea_distribution"`
	UniquenessScore  float64                `json:"uniqueness_score"`
}

type PrimaryIdea struct {
	ID          int      `json:"id"`
	Summary     string   `json:"summary"`
	Coverage    float64  `json:"coverage"` // Percentage of text devoted to this idea
	Complexity  float64  `json:"complexity"`
	KeyPoints   []string `json:"key_points"`
	TextMapping []int    `json:"text_mapping"` // Sentence indices
}

type IdeaConnection struct {
	FromID     int     `json:"from_id"`
	ToID       int     `json:"to_id"`
	Strength   float64 `json:"strength"`
	Type       string  `json:"type"` // "builds-on", "contrasts", "supports", etc.
}

type WritingQuality struct {
	OverallScore    float64           `json:"overall_score"`
	Clarity         float64           `json:"clarity"`
	Coherence       float64           `json:"coherence"`
	Depth           float64           `json:"depth"`
	Originality     float64           `json:"originality"`
	Strengths       []string          `json:"strengths"`
	Weaknesses      []string          `json:"weaknesses"`
	QualityMarkers  map[string]bool   `json:"quality_markers"`
}

type Recommendation struct {
	Category    string `json:"category"`
	Suggestion  string `json:"suggestion"`
	Rationale   string `json:"rationale"`
	Priority    string `json:"priority"` // "high", "medium", "low"
	Difficulty  string `json:"difficulty"` // "easy", "moderate", "challenging"
}

type ContentProfile struct {
	Type           string            `json:"type"` // "argumentative", "descriptive", "narrative", "expository", "analytical"
	Purpose        string            `json:"purpose"`
	AudienceLevel  string            `json:"audience_level"`
	Tone           string            `json:"tone"`
	Style          string            `json:"style"`
	KeyThemes      []string          `json:"key_themes"`
	Characteristics map[string]string `json:"characteristics"`
}

// TransformToInsights takes all analysis metrics and generates actionable insights
func TransformToInsights(
	complexity ComplexityMetrics,
	ideas IdeaAnalysisMetrics,
	tokens TokenData,
	preprocessing PreprocessingData,
) InsightAnalysis {
	
	// Generate main insights based on all metrics
	mainInsights := generateMainInsights(complexity, ideas, tokens)
	
	// Break down ideas into digestible components
	ideaBreakdown := generateIdeaBreakdown(ideas)
	
	// Assess writing quality
	qualityAssessment := assessWritingQuality(complexity, ideas, tokens)
	
	// Generate recommendations
	recommendations := generateRecommendations(complexity, ideas, qualityAssessment)
	
	// Profile the content
	contentProfile := profileContent(complexity, ideas, tokens)
	
	// Create summary
	summary := generateSummary(ideaBreakdown, qualityAssessment, contentProfile)
	
	return InsightAnalysis{
		Summary: NewEnhancedStringMetric(
			summary,
			"Executive Summary",
			"High-level overview of the text analysis including key findings and characteristics.",
			"Use this summary to quickly understand the text's main attributes and quality indicators.",
		),
		MainInsights: EnhancedInsightListMetric{
			Value:               mainInsights,
			Scale:               "Prioritized Insights",
			HelpText:            "Key findings from the analysis, prioritized by importance and impact.",
			PracticalApplication: "Focus on high-priority insights for immediate improvements or understanding.",
		},
		IdeaBreakdown: EnhancedIdeaBreakdown{
			Value:               ideaBreakdown,
			Scale:               "Idea Analysis",
			HelpText:            "Detailed breakdown of unique ideas, their relationships, and coverage in the text.",
			PracticalApplication: "Use to understand thought structure and ensure balanced idea development.",
		},
		WritingQuality: EnhancedWritingQuality{
			Value:               qualityAssessment,
			Scale:               "Quality Metrics",
			HelpText:            "Comprehensive assessment of writing quality across multiple dimensions.",
			PracticalApplication: "Identify strengths to maintain and weaknesses to address in revisions.",
		},
		Recommendations: EnhancedRecommendations{
			Value:               recommendations,
			Scale:               "Improvement Suggestions",
			HelpText:            "Actionable recommendations for improving the text based on analysis findings.",
			PracticalApplication: "Prioritize high-impact, easy-to-implement changes for quick improvements.",
		},
		ContentProfile: EnhancedContentProfile{
			Value:               contentProfile,
			Scale:               "Content Characteristics",
			HelpText:            "Profile of the content type, purpose, and stylistic characteristics.",
			PracticalApplication: "Ensure content aligns with intended purpose and audience expectations.",
		},
	}
}

func generateMainInsights(complexity ComplexityMetrics, ideas IdeaAnalysisMetrics, tokens TokenData) []Insight {
	insights := []Insight{}
	
	// Readability insight
	fleschScore := complexity.FleschReadingEase.Value
	readabilityInsight := Insight{
		Type:  "readability",
		Title: "Readability Assessment",
	}
	
	if fleschScore < 30 {
		readabilityInsight.Description = "The text is very difficult to read, suitable for university graduates or specialists."
		readabilityInsight.Impact = "high"
		readabilityInsight.Priority = 1
	} else if fleschScore < 60 {
		readabilityInsight.Description = "The text has moderate to difficult readability, appropriate for college-level readers."
		readabilityInsight.Impact = "medium"
		readabilityInsight.Priority = 2
	} else {
		readabilityInsight.Description = "The text is easy to read, accessible to a general audience."
		readabilityInsight.Impact = "low"
		readabilityInsight.Priority = 3
	}
	
	readabilityInsight.Evidence = []string{
		fmt.Sprintf("Flesch Reading Ease: %.1f", fleschScore),
		fmt.Sprintf("Flesch-Kincaid Grade: %.1f", complexity.FleschKincaidGradeLevel.Value),
		fmt.Sprintf("Average words per sentence: %.1f", complexity.SentenceStats.AverageWordsPerSent.Value),
	}
	insights = append(insights, readabilityInsight)
	
	// Idea diversity insight
	ideaCount := ideas.UniqueIdeas.Value
	ideaDensity := ideas.IdeaDensity.Value
	ideaInsight := Insight{
		Type:  "idea_analysis",
		Title: "Conceptual Richness",
	}
	
	if ideaCount < 3 {
		ideaInsight.Description = "The text focuses on a very limited set of ideas, suggesting either focused argumentation or lack of depth."
		ideaInsight.Impact = "high"
		ideaInsight.Priority = 1
	} else if ideaCount > 10 {
		ideaInsight.Description = "The text covers many diverse ideas, which may challenge reader comprehension or indicate comprehensive coverage."
		ideaInsight.Impact = "medium"
		ideaInsight.Priority = 2
	} else {
		ideaInsight.Description = fmt.Sprintf("The text contains %d distinct ideas with good conceptual balance.", ideaCount)
		ideaInsight.Impact = "low"
		ideaInsight.Priority = 3
	}
	
	ideaInsight.Evidence = []string{
		fmt.Sprintf("Unique ideas identified: %d", ideaCount),
		fmt.Sprintf("Idea density: %.2f per sentence", ideaDensity),
		fmt.Sprintf("Conceptual coherence: %.2f", ideas.ConceptualCoherence.Value),
	}
	insights = append(insights, ideaInsight)
	
	// Vocabulary complexity insight
	lexicalDiversity := complexity.LexicalDiversity.Value
	vocabInsight := Insight{
		Type:  "vocabulary",
		Title: "Vocabulary Analysis",
	}
	
	if lexicalDiversity < 0.3 {
		vocabInsight.Description = "Very low vocabulary diversity suggests repetitive language use."
		vocabInsight.Impact = "high"
		vocabInsight.Priority = 1
	} else if lexicalDiversity > 0.7 {
		vocabInsight.Description = "Exceptionally high vocabulary diversity indicates sophisticated or technical language."
		vocabInsight.Impact = "medium"
		vocabInsight.Priority = 2
	} else {
		vocabInsight.Description = "Vocabulary diversity is well-balanced for clear communication."
		vocabInsight.Impact = "low"
		vocabInsight.Priority = 3
	}
	
	vocabInsight.Evidence = []string{
		fmt.Sprintf("Lexical diversity: %.2f", lexicalDiversity),
		fmt.Sprintf("Unique words: %d", complexity.WordStats.UniqueWords.Value),
		fmt.Sprintf("Average word length: %.1f characters", complexity.WordStats.AverageWordLength.Value),
	}
	insights = append(insights, vocabInsight)
	
	// Structure insight
	sentenceComplexity := complexity.SentenceComplexityAverage.Value
	structureInsight := Insight{
		Type:  "structure",
		Title: "Structural Complexity",
	}
	
	if sentenceComplexity > 5 {
		structureInsight.Description = "Highly complex sentence structures may impair readability."
		structureInsight.Impact = "high"
		structureInsight.Priority = 1
	} else if sentenceComplexity < 2 {
		structureInsight.Description = "Very simple sentence structures might seem choppy or elementary."
		structureInsight.Impact = "medium"
		structureInsight.Priority = 2
	} else {
		structureInsight.Description = "Sentence complexity is appropriate for clear communication."
		structureInsight.Impact = "low"
		structureInsight.Priority = 3
	}
	
	structureInsight.Evidence = []string{
		fmt.Sprintf("Average sentence complexity: %.1f", sentenceComplexity),
		fmt.Sprintf("Complex sentences: %d", complexity.SentenceStats.ComplexSentences.Value),
		fmt.Sprintf("Topic transitions: %d", ideas.TopicTransitions.Value),
	}
	insights = append(insights, structureInsight)
	
	// Sort by priority
	sort.Slice(insights, func(i, j int) bool {
		return insights[i].Priority < insights[j].Priority
	})
	
	return insights
}

func generateIdeaBreakdown(ideas IdeaAnalysisMetrics) IdeaBreakdown {
	breakdown := IdeaBreakdown{
		TotalIdeas:       ideas.UniqueIdeas.Value,
		PrimaryIdeas:     []PrimaryIdea{},
		IdeaConnections:  []IdeaConnection{},
		IdeaDistribution: make(map[string]int),
	}
	
	// Process semantic clusters into primary ideas
	for i, cluster := range ideas.SemanticClusters.Value {
		if i >= 5 { // Limit to top 5 primary ideas
			break
		}
		
		primaryIdea := PrimaryIdea{
			ID:         cluster.ID,
			Summary:    generateIdeaSummary(cluster),
			Coverage:   float64(len(cluster.Sentences)) / float64(ideas.UniqueIdeas.Value) * 100,
			Complexity: cluster.Complexity,
			KeyPoints:  extractKeyPoints(cluster),
		}
		
		// Map to text positions
		for j := range cluster.Sentences {
			primaryIdea.TextMapping = append(primaryIdea.TextMapping, j)
		}
		
		breakdown.PrimaryIdeas = append(breakdown.PrimaryIdeas, primaryIdea)
		
		// Track distribution
		breakdown.IdeaDistribution[cluster.PositionInText]++
	}
	
	// Identify connections between ideas
	for i, cluster1 := range ideas.SemanticClusters.Value {
		for j, cluster2 := range ideas.SemanticClusters.Value {
			if i >= j {
				continue
			}
			
			// Calculate connection strength based on keyword overlap
			strength := calculateIdeaConnectionStrength(cluster1, cluster2)
			if strength > 0.2 {
				connection := IdeaConnection{
					FromID:   cluster1.ID,
					ToID:     cluster2.ID,
					Strength: strength,
					Type:     determineConnectionType(cluster1, cluster2),
				}
				breakdown.IdeaConnections = append(breakdown.IdeaConnections, connection)
			}
		}
	}
	
	// Calculate uniqueness score
	breakdown.UniquenessScore = calculateUniquenessScore(ideas)
	
	return breakdown
}

func assessWritingQuality(complexity ComplexityMetrics, ideas IdeaAnalysisMetrics, tokens TokenData) WritingQuality {
	assessment := WritingQuality{
		Strengths:      []string{},
		Weaknesses:     []string{},
		QualityMarkers: make(map[string]bool),
	}
	
	// Calculate clarity score
	assessment.Clarity = calculateClarityScore(complexity)
	
	// Calculate coherence score
	assessment.Coherence = ideas.ConceptualCoherence.Value
	
	// Calculate depth score
	assessment.Depth = calculateDepthScore(ideas, complexity)
	
	// Calculate originality score
	assessment.Originality = calculateOriginalityScore(ideas, complexity)
	
	// Overall score (weighted average)
	assessment.OverallScore = (assessment.Clarity*0.3 + 
		assessment.Coherence*0.25 + 
		assessment.Depth*0.25 + 
		assessment.Originality*0.2)
	
	// Identify strengths
	if assessment.Clarity > 0.7 {
		assessment.Strengths = append(assessment.Strengths, "Clear and accessible writing")
		assessment.QualityMarkers["clear_writing"] = true
	}
	if assessment.Coherence > 0.7 {
		assessment.Strengths = append(assessment.Strengths, "Well-connected ideas with strong flow")
		assessment.QualityMarkers["coherent_structure"] = true
	}
	if assessment.Depth > 0.7 {
		assessment.Strengths = append(assessment.Strengths, "Thorough exploration of concepts")
		assessment.QualityMarkers["conceptual_depth"] = true
	}
	if complexity.LexicalDiversity.Value > 0.5 {
		assessment.Strengths = append(assessment.Strengths, "Rich vocabulary usage")
		assessment.QualityMarkers["varied_vocabulary"] = true
	}
	
	// Identify weaknesses
	if assessment.Clarity < 0.5 {
		assessment.Weaknesses = append(assessment.Weaknesses, "Unclear or overly complex writing")
	}
	if assessment.Coherence < 0.5 {
		assessment.Weaknesses = append(assessment.Weaknesses, "Disconnected ideas or poor flow")
	}
	if ideas.TopicTransitions.Value > 10 {
		assessment.Weaknesses = append(assessment.Weaknesses, "Too many topic shifts")
	}
	if complexity.SentenceStats.AverageWordsPerSent.Value > 25 {
		assessment.Weaknesses = append(assessment.Weaknesses, "Overly long sentences")
	}
	
	return assessment
}

func generateRecommendations(complexity ComplexityMetrics, ideas IdeaAnalysisMetrics, quality WritingQuality) []Recommendation {
	recommendations := []Recommendation{}
	
	// Readability recommendations
	if complexity.FleschReadingEase.Value < 30 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Readability",
			Suggestion: "Simplify sentence structures and use more common vocabulary",
			Rationale:  "Text is very difficult to read for most audiences",
			Priority:   "high",
			Difficulty: "moderate",
		})
	}
	
	// Idea organization recommendations
	if ideas.ConceptualCoherence.Value < 0.5 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Organization",
			Suggestion: "Improve transitions between ideas and group related concepts",
			Rationale:  "Ideas appear disconnected or poorly organized",
			Priority:   "high",
			Difficulty: "moderate",
		})
	}
	
	if ideas.TopicTransitions.Value > 10 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Focus",
			Suggestion: "Reduce topic shifts and maintain consistent themes",
			Rationale:  "Frequent topic changes may confuse readers",
			Priority:   "medium",
			Difficulty: "challenging",
		})
	}
	
	// Vocabulary recommendations
	if complexity.LexicalDiversity.Value < 0.3 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Vocabulary",
			Suggestion: "Use more varied vocabulary and reduce word repetition",
			Rationale:  "Limited vocabulary makes text monotonous",
			Priority:   "medium",
			Difficulty: "easy",
		})
	}
	
	// Sentence structure recommendations
	if complexity.SentenceStats.AverageWordsPerSent.Value > 25 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Structure",
			Suggestion: "Break long sentences into shorter, clearer ones",
			Rationale:  "Long sentences reduce comprehension",
			Priority:   "high",
			Difficulty: "easy",
		})
	}
	
	// Depth recommendations
	if quality.Depth < 0.5 && ideas.UniqueIdeas.Value < 5 {
		recommendations = append(recommendations, Recommendation{
			Category:   "Content",
			Suggestion: "Expand on existing ideas and introduce supporting concepts",
			Rationale:  "Content lacks depth and variety",
			Priority:   "medium",
			Difficulty: "challenging",
		})
	}
	
	// Sort by priority
	priorityOrder := map[string]int{"high": 1, "medium": 2, "low": 3}
	sort.Slice(recommendations, func(i, j int) bool {
		return priorityOrder[recommendations[i].Priority] < priorityOrder[recommendations[j].Priority]
	})
	
	return recommendations
}

func profileContent(complexity ComplexityMetrics, ideas IdeaAnalysisMetrics, tokens TokenData) ContentProfile {
	profile := ContentProfile{
		KeyThemes:       []string{},
		Characteristics: make(map[string]string),
	}
	
	// Determine content type based on metrics
	if ideas.IdeaProgression.Value == "Linear development" && ideas.ConceptualCoherence.Value > 0.6 {
		profile.Type = "argumentative"
	} else if ideas.UniqueIdeas.Value > 8 && ideas.ConceptualBreadth.Value > 0.6 {
		profile.Type = "expository"
	} else if complexity.SentenceComplexityAverage.Value > 4 {
		profile.Type = "analytical"
	} else {
		profile.Type = "descriptive"
	}
	
	// Determine purpose
	if complexity.FleschKincaidGradeLevel.Value > 12 {
		profile.Purpose = "Academic or professional communication"
	} else if complexity.FleschKincaidGradeLevel.Value > 8 {
		profile.Purpose = "General information or education"
	} else {
		profile.Purpose = "Broad audience communication"
	}
	
	// Determine audience level
	gradeLevel := complexity.FleschKincaidGradeLevel.Value
	if gradeLevel < 6 {
		profile.AudienceLevel = "Elementary"
	} else if gradeLevel < 9 {
		profile.AudienceLevel = "Middle school"
	} else if gradeLevel < 13 {
		profile.AudienceLevel = "High school"
	} else if gradeLevel < 16 {
		profile.AudienceLevel = "College"
	} else {
		profile.AudienceLevel = "Graduate/Professional"
	}
	
	// Determine tone
	if complexity.LexicalDiversity.Value > 0.6 && complexity.WordStats.AverageWordLength.Value > 5 {
		profile.Tone = "Formal"
	} else if complexity.SentenceStats.AverageWordsPerSent.Value < 15 {
		profile.Tone = "Conversational"
	} else {
		profile.Tone = "Neutral"
	}
	
	// Determine style
	if ideas.ThematicConsistency.Value > 0.7 {
		profile.Style = "Focused and consistent"
	} else if ideas.ConceptualBreadth.Value > 0.6 {
		profile.Style = "Comprehensive and varied"
	} else {
		profile.Style = "Mixed or developing"
	}
	
	// Extract key themes from concepts
	for i, concept := range ideas.KeyConcepts.Value {
		if i < 5 { // Top 5 themes
			profile.KeyThemes = append(profile.KeyThemes, strings.Title(concept.Concept))
		}
	}
	
	// Add characteristics
	profile.Characteristics["word_count"] = fmt.Sprintf("%d words", complexity.WordStats.TotalWords.Value)
	profile.Characteristics["sentence_count"] = fmt.Sprintf("%d sentences", complexity.SentenceStats.TotalSentences.Value)
	profile.Characteristics["reading_time"] = fmt.Sprintf("%.1f minutes", float64(complexity.WordStats.TotalWords.Value)/200.0)
	profile.Characteristics["complexity_level"] = determineComplexityLevel(complexity)
	
	return profile
}

// Helper functions

func generateSummary(breakdown IdeaBreakdown, quality WritingQuality, profile ContentProfile) string {
	summary := fmt.Sprintf(
		"This %s text contains %d unique ideas with an overall quality score of %.1f/1.0. "+
		"The content is suitable for %s readers and demonstrates %s. "+
		"Key strengths include: %s. "+
		"The text follows a %s pattern with %s tone.",
		profile.Type,
		breakdown.TotalIdeas,
		quality.OverallScore,
		strings.ToLower(profile.AudienceLevel),
		strings.ToLower(profile.Style),
		strings.Join(quality.Strengths[:min(2, len(quality.Strengths))], " and "),
		strings.ToLower(profile.Type),
		strings.ToLower(profile.Tone),
	)
	
	return summary
}

func generateIdeaSummary(cluster IdeaCluster) string {
	if len(cluster.KeyWords) > 0 {
		return fmt.Sprintf("%s: %s", cluster.MainTopic, strings.Join(cluster.KeyWords[:min(3, len(cluster.KeyWords))], ", "))
	}
	return cluster.MainTopic
}

func extractKeyPoints(cluster IdeaCluster) []string {
	points := []string{}
	for i, sentence := range cluster.Sentences {
		if i < 3 { // First 3 sentences as key points
			if len(sentence) > 100 {
				points = append(points, sentence[:100]+"...")
			} else {
				points = append(points, sentence)
			}
		}
	}
	return points
}

func calculateIdeaConnectionStrength(cluster1, cluster2 IdeaCluster) float64 {
	// Simple keyword overlap calculation
	overlap := 0
	for _, kw1 := range cluster1.KeyWords {
		for _, kw2 := range cluster2.KeyWords {
			if kw1 == kw2 {
				overlap++
			}
		}
	}
	
	if len(cluster1.KeyWords) == 0 || len(cluster2.KeyWords) == 0 {
		return 0
	}
	
	return float64(overlap) / float64(max(len(cluster1.KeyWords), len(cluster2.KeyWords)))
}

func determineConnectionType(cluster1, cluster2 IdeaCluster) string {
	// Simplified connection type determination
	if cluster1.PositionInText == "Beginning" && cluster2.PositionInText == "End" {
		return "develops-into"
	}
	if cluster1.Complexity < cluster2.Complexity {
		return "builds-on"
	}
	return "relates-to"
}

func calculateUniquenessScore(ideas IdeaAnalysisMetrics) float64 {
	// Combine various factors for uniqueness
	diversity := ideas.ConceptualBreadth.Value
	ideaCount := float64(ideas.UniqueIdeas.Value) / 20.0 // Normalize
	if ideaCount > 1 {
		ideaCount = 1
	}
	
	return (diversity + ideaCount) / 2
}

func calculateClarityScore(complexity ComplexityMetrics) float64 {
	// Inverse relationship with reading difficulty
	flesch := complexity.FleschReadingEase.Value
	clarity := flesch / 100.0
	
	// Adjust for sentence length
	if complexity.SentenceStats.AverageWordsPerSent.Value > 20 {
		clarity *= 0.8
	}
	
	return math.Min(1.0, math.Max(0.0, clarity))
}

func calculateDepthScore(ideas IdeaAnalysisMetrics, complexity ComplexityMetrics) float64 {
	// Combine idea complexity and conceptual breadth
	ideaComplexity := ideas.IdeaComplexity.Value / 10.0 // Normalize
	breadth := ideas.ConceptualBreadth.Value
	
	depth := (ideaComplexity + breadth) / 2
	
	// Bonus for thorough exploration
	if ideas.UniqueIdeas.Value > 5 && ideas.ConceptualCoherence.Value > 0.6 {
		depth *= 1.2
	}
	
	return math.Min(1.0, depth)
}

func calculateOriginalityScore(ideas IdeaAnalysisMetrics, complexity ComplexityMetrics) float64 {
	// Use lexical diversity and conceptual breadth as proxies
	lexicalDiv := complexity.LexicalDiversity.Value
	conceptualBreadth := ideas.ConceptualBreadth.Value
	
	originality := (lexicalDiv + conceptualBreadth) / 2
	
	// Bonus for unique vocabulary
	if complexity.WordStats.RareWords.Value > complexity.WordStats.CommonWords.Value/10 {
		originality *= 1.1
	}
	
	return math.Min(1.0, originality)
}

func determineComplexityLevel(complexity ComplexityMetrics) string {
	avg := (complexity.FleschKincaidGradeLevel.Value + 
		complexity.GunningFogIndex.Value + 
		complexity.ColemanLiauIndex.Value) / 3
	
	if avg < 6 {
		return "Very Simple"
	} else if avg < 9 {
		return "Simple"
	} else if avg < 13 {
		return "Moderate"
	} else if avg < 16 {
		return "Complex"
	} else {
		return "Very Complex"
	}
}