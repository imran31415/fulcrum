package analyzer

import (
	"math"
	"regexp"
	"sort"
	"strings"
)

// IdeaAnalysisMetrics represents the analysis of unique ideas/thoughts in text
type IdeaAnalysisMetrics struct {
	UniqueIdeas           EnhancedIntMetric               `json:"unique_ideas"`
	IdeaDensity          EnhancedFloatMetric             `json:"idea_density"`
	ConceptualCoherence  EnhancedFloatMetric             `json:"conceptual_coherence"`
	TopicTransitions     EnhancedIntMetric               `json:"topic_transitions"`
	SemanticClusters     EnhancedIdeaClusterMetric       `json:"semantic_clusters"`
	IdeaComplexity       EnhancedFloatMetric             `json:"idea_complexity"`
	ConceptualBreadth    EnhancedFloatMetric             `json:"conceptual_breadth"`
	ThematicConsistency  EnhancedFloatMetric             `json:"thematic_consistency"`
	IdeaProgression      EnhancedStringMetric            `json:"idea_progression"`
	KeyConcepts          EnhancedConceptListMetric       `json:"key_concepts"`
	ThoughtTypeDistribution EnhancedThoughtDistribution  `json:"thought_type_distribution"`
	QuestionAnalysis     EnhancedQuestionAnalysis        `json:"question_analysis"`
	FactualContent       EnhancedFactualContent          `json:"factual_content"`
}

// EnhancedIdeaClusterMetric for representing clustered ideas
type EnhancedIdeaClusterMetric struct {
	Value               []IdeaCluster `json:"value"`
	Scale               string        `json:"scale"`
	HelpText            string        `json:"help_text"`
	PracticalApplication string        `json:"practical_application"`
}

// EnhancedConceptListMetric for representing key concepts
type EnhancedConceptListMetric struct {
	Value               []KeyConcept `json:"value"`
	Scale               string       `json:"scale"`
	HelpText            string       `json:"help_text"`
	PracticalApplication string       `json:"practical_application"`
}

// IdeaCluster represents a group of related sentences/ideas
type IdeaCluster struct {
	ID               int                `json:"id"`
	MainTopic        string             `json:"main_topic"`
	ThoughtType      string             `json:"thought_type"` // "idea", "fact", "question", "opinion", "instruction", "description", "argument", "example"
	TypeConfidence   float64            `json:"type_confidence"`
	Sentences        []string           `json:"sentences"`
	SentenceTypes    []SentenceType     `json:"sentence_types"` // Type classification for each sentence
	KeyWords         []string           `json:"key_words"`
	Coherence        float64            `json:"coherence"`
	Complexity       float64            `json:"complexity"`
	PositionInText   string             `json:"position_in_text"`
	RelatedClusters  []int              `json:"related_clusters,omitempty"`
	Evidence         []string           `json:"evidence,omitempty"` // Supporting evidence for facts
	CertaintyLevel   string             `json:"certainty_level,omitempty"` // For opinions/arguments: "certain", "probable", "possible", "speculative"
	Actionable       bool               `json:"actionable"` // For instructions/questions
}

// SentenceType represents the classification of an individual sentence
type SentenceType struct {
	Sentence        string   `json:"sentence"`
	Type            string   `json:"type"`
	SubType         string   `json:"sub_type,omitempty"`
	Confidence      float64  `json:"confidence"`
	Indicators      []string `json:"indicators"` // Words/patterns that led to classification
}

// EnhancedThoughtDistribution shows the distribution of thought types
type EnhancedThoughtDistribution struct {
	Value               ThoughtDistribution `json:"value"`
	Scale               string              `json:"scale"`
	HelpText            string              `json:"help_text"`
	PracticalApplication string              `json:"practical_application"`
}

type ThoughtDistribution struct {
	Facts        int     `json:"facts"`
	Questions    int     `json:"questions"`
	Opinions     int     `json:"opinions"`
	Instructions int     `json:"instructions"`
	Examples     int     `json:"examples"`
	Arguments    int     `json:"arguments"`
	Descriptions int     `json:"descriptions"`
	Ideas        int     `json:"ideas"`
	DominantType string  `json:"dominant_type"`
	Balance      float64 `json:"balance"` // 0-1, how evenly distributed
}

// EnhancedQuestionAnalysis provides insights about questions in the text
type EnhancedQuestionAnalysis struct {
	Value               QuestionAnalysis `json:"value"`
	Scale               string           `json:"scale"`
	HelpText            string           `json:"help_text"`
	PracticalApplication string           `json:"practical_application"`
}

type QuestionAnalysis struct {
	TotalQuestions   int               `json:"total_questions"`
	QuestionTypes    map[string]int    `json:"question_types"`
	Unanswered       []string          `json:"unanswered"`
	Rhetorical       []string          `json:"rhetorical"`
	Actionable       []string          `json:"actionable"`
}

// EnhancedFactualContent provides analysis of factual content
type EnhancedFactualContent struct {
	Value               FactualContent `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

type FactualContent struct {
	TotalFacts       int            `json:"total_facts"`
	FactTypes        map[string]int `json:"fact_types"`
	VerifiableFacts  []string       `json:"verifiable_facts"`
	StatisticalFacts []string       `json:"statistical_facts"`
	FactDensity      float64        `json:"fact_density"` // Facts per sentence
}

// KeyConcept represents an important concept in the text
type KeyConcept struct {
	Concept     string    `json:"concept"`
	Frequency   int       `json:"frequency"`
	Importance  float64   `json:"importance"`
	Context     []string  `json:"context"`
	Sentences   []string  `json:"sentences"`
	Position    []int     `json:"position"`
}

// AnalyzeIdeas performs comprehensive idea extraction and analysis
func AnalyzeIdeas(text string) IdeaAnalysisMetrics {
	sentences := extractSentences(text)
	words := extractWords(text)
	
	// Core idea analysis
	clusters := extractIdeaClusters(sentences)
	concepts := extractKeyConcepts(sentences, words)
	transitions := countTopicTransitions(sentences)
	
	// Calculate derived metrics
	ideaDensity := calculateIdeaDensity(clusters, len(sentences))
	coherence := calculateConceptualCoherence(clusters)
	complexity := calculateIdeaComplexity(clusters, concepts)
	breadth := calculateConceptualBreadth(concepts, words)
	consistency := calculateThematicConsistency(clusters)
	progression := analyzeIdeaProgression(clusters)
	
	// Analyze thought type distribution
	thoughtDist := analyzeThoughtTypeDistribution(clusters)
	questionAnalysis := analyzeQuestions(clusters)
	factualContent := analyzeFactualContent(clusters, len(sentences))
	
	return IdeaAnalysisMetrics{
		UniqueIdeas: NewEnhancedIntMetric(
			len(clusters),
			"0-∞ (Count)",
			"Number of distinct conceptual clusters or unique ideas identified in the text.",
			"Higher counts suggest rich, diverse content. Very low counts may indicate repetitive or focused writing.",
		),
		IdeaDensity: NewEnhancedFloatMetric(
			ideaDensity,
			"0-10+ (Ideas per sentence)",
			"Average number of unique ideas per sentence, indicating conceptual richness.",
			"0.5-1.0 is typical; >1.5 suggests dense, complex ideas; <0.3 may indicate sparse conceptual content.",
		),
		ConceptualCoherence: NewEnhancedFloatMetric(
			coherence,
			"0-1 (Higher = More Coherent)",
			"How well ideas connect and flow together throughout the text.",
			"0.7+ indicates well-structured thinking; <0.5 suggests fragmented or disconnected ideas.",
		),
		TopicTransitions: NewEnhancedIntMetric(
			transitions,
			"0-∞ (Count)",
			"Number of major topic shifts or transitions between different ideas.",
			"Moderate transitions (2-5) suggest good flow; too many may indicate scattered thinking.",
		),
		SemanticClusters: NewEnhancedIdeaClusterMetric(
			clusters,
			"Grouped Ideas",
			"Clustered groups of related sentences and concepts, each representing a unique idea.",
			"Review clusters to understand main themes and ensure balanced development of ideas.",
		),
		IdeaComplexity: NewEnhancedFloatMetric(
			complexity,
			"1-10+ (Higher = More Complex)",
			"Average complexity of individual ideas based on vocabulary and conceptual depth.",
			"3-6 is moderate complexity; >7 may challenge readers; <2 suggests simple ideas.",
		),
		ConceptualBreadth: NewEnhancedFloatMetric(
			breadth,
			"0-1 (Higher = Broader)",
			"Diversity of conceptual domains covered in the text.",
			"0.6+ suggests broad coverage; <0.3 indicates narrow focus; balance depends on purpose.",
		),
		ThematicConsistency: NewEnhancedFloatMetric(
			consistency,
			"0-1 (Higher = More Consistent)",
			"How consistently the text maintains thematic focus across ideas.",
			"0.7+ indicates strong thematic unity; <0.5 suggests unfocused or scattered content.",
		),
		IdeaProgression: NewEnhancedStringMetric(
			progression,
			"Progression Pattern",
			"How ideas develop and build upon each other throughout the text.",
			"Linear progression builds arguments systematically; circular revisits themes; scattered needs organization.",
		),
		KeyConcepts: NewEnhancedConceptListMetric(
			concepts,
			"Ranked Concepts",
			"Most important concepts identified in the text, ranked by significance.",
			"Use to understand main themes and ensure key ideas are well-developed.",
		),
		ThoughtTypeDistribution: EnhancedThoughtDistribution{
			Value:               thoughtDist,
			Scale:               "Count by Type",
			HelpText:            "Distribution of different thought types (facts, opinions, questions, etc.) in the text.",
			PracticalApplication: "Understand content composition for better prompt engineering and content optimization.",
		},
		QuestionAnalysis: EnhancedQuestionAnalysis{
			Value:               questionAnalysis,
			Scale:               "Question Metrics",
			HelpText:            "Detailed analysis of questions including types, actionability, and rhetorical nature.",
			PracticalApplication: "Identify unanswered questions for follow-up or understand inquiry patterns in the text.",
		},
		FactualContent: EnhancedFactualContent{
			Value:               factualContent,
			Scale:               "Fact Metrics",
			HelpText:            "Analysis of factual claims including verifiable facts and statistical content.",
			PracticalApplication: "Verify fact density and identify claims that may need citation or verification.",
		},
	}
}

// extractIdeaClusters groups sentences into conceptual clusters
func extractIdeaClusters(sentences []string) []IdeaCluster {
	if len(sentences) == 0 {
		return []IdeaCluster{}
	}
	
	// Limit analysis for very long texts to prevent memory issues
	maxSentences := 100
	if len(sentences) > maxSentences {
		// Sample sentences evenly throughout the text
		step := len(sentences) / maxSentences
		sampledSentences := []string{}
		for i := 0; i < len(sentences); i += step {
			if i < len(sentences) {
				sampledSentences = append(sampledSentences, sentences[i])
			}
		}
		sentences = sampledSentences
	}
	
	// Simple clustering based on keyword overlap and semantic similarity
	clusters := []IdeaCluster{}
	maxClusters := 20 // Limit maximum clusters to prevent memory issues
	
	// Extract key terms from each sentence
	sentenceTerms := make([][]string, len(sentences))
	for i, sentence := range sentences {
		sentenceTerms[i] = extractSignificantTerms(sentence)
	}
	
	// Group sentences with similar terms
	used := make([]bool, len(sentences))
	clusterID := 0
	
	for i, sentence := range sentences {
		if used[i] || clusterID >= maxClusters {
			continue
		}
		
		cluster := IdeaCluster{
			ID:        clusterID,
			Sentences: []string{sentence},
			KeyWords:  sentenceTerms[i],
			PositionInText: getPositionLabel(i, len(sentences)),
		}
		
		used[i] = true
		
		// Find related sentences (with a limit to prevent too large clusters)
		maxClusterSize := 10
		for j := i + 1; j < len(sentences) && len(cluster.Sentences) < maxClusterSize; j++ {
			if used[j] {
				continue
			}
			
			// Lower threshold for longer texts to create fewer, larger clusters
			threshold := 0.2
			if len(sentences) > 50 {
				threshold = 0.15
			}
			
			similarity := calculateTermSimilarity(sentenceTerms[i], sentenceTerms[j])
			if similarity > threshold {
				cluster.Sentences = append(cluster.Sentences, sentences[j])
				cluster.KeyWords = mergeKeyWords(cluster.KeyWords, sentenceTerms[j])
				used[j] = true
			}
		}
		
		// Calculate cluster properties
		cluster.MainTopic = identifyMainTopic(cluster.KeyWords)
		cluster.Coherence = calculateClusterCoherence(cluster.Sentences)
		cluster.Complexity = calculateClusterComplexity(cluster.Sentences)
		
		// Classify the thought type of this cluster
		classifyClusterThoughtType(&cluster)
		
		clusters = append(clusters, cluster)
		clusterID++
	}
	
	return clusters
}

// extractKeyConcepts identifies the most important concepts in the text
func extractKeyConcepts(sentences []string, words []string) []KeyConcept {
	// Count word frequencies
	wordFreq := make(map[string]int)
	for _, word := range words {
		if len(word) > 3 && !isStopWord(word) { // Filter short words and stop words
			wordFreq[word]++
		}
	}
	
	// Calculate importance scores
	concepts := []KeyConcept{}
	for word, freq := range wordFreq {
		if freq < 2 { // Must appear at least twice
			continue
		}
		
		// Find sentences containing this concept
		sentenceMatches := []string{}
		positions := []int{}
		
		for i, sentence := range sentences {
			if strings.Contains(strings.ToLower(sentence), word) {
				sentenceMatches = append(sentenceMatches, sentence)
				positions = append(positions, i)
			}
		}
		
		// Calculate importance based on frequency and distribution
		importance := float64(freq) * math.Log(float64(len(sentenceMatches))+1)
		
		concepts = append(concepts, KeyConcept{
			Concept:    word,
			Frequency:  freq,
			Importance: importance,
			Context:    extractContext(word, sentences),
			Sentences:  sentenceMatches,
			Position:   positions,
		})
	}
	
	// Sort by importance and take top concepts
	sort.Slice(concepts, func(i, j int) bool {
		return concepts[i].Importance > concepts[j].Importance
	})
	
	maxConcepts := 10
	if len(concepts) > maxConcepts {
		concepts = concepts[:maxConcepts]
	}
	
	return concepts
}

// Helper functions

func extractSignificantTerms(sentence string) []string {
	words := strings.Fields(strings.ToLower(sentence))
	significant := []string{}
	
	for _, word := range words {
		// Clean word
		word = regexp.MustCompile(`[^\w]`).ReplaceAllString(word, "")
		
		// Filter significant terms (length > 3, not stop word)
		if len(word) > 3 && !isStopWord(word) {
			significant = append(significant, word)
		}
	}
	
	return significant
}

func calculateTermSimilarity(terms1, terms2 []string) float64 {
	if len(terms1) == 0 || len(terms2) == 0 {
		return 0
	}
	
	// Jaccard similarity
	intersection := 0
	termSet2 := make(map[string]bool)
	for _, term := range terms2 {
		termSet2[term] = true
	}
	
	for _, term := range terms1 {
		if termSet2[term] {
			intersection++
		}
	}
	
	union := len(terms1) + len(terms2) - intersection
	if union == 0 {
		return 0
	}
	
	return float64(intersection) / float64(union)
}

func mergeKeyWords(words1, words2 []string) []string {
	wordSet := make(map[string]bool)
	for _, word := range words1 {
		wordSet[word] = true
	}
	for _, word := range words2 {
		wordSet[word] = true
	}
	
	result := []string{}
	for word := range wordSet {
		result = append(result, word)
	}
	
	return result
}

func identifyMainTopic(keywords []string) string {
	if len(keywords) == 0 {
		return "General"
	}
	
	// Simple heuristic: use the first significant keyword as main topic
	// In a more sophisticated version, this would use semantic analysis
	return strings.Title(keywords[0])
}

func calculateClusterCoherence(sentences []string) float64 {
	if len(sentences) <= 1 {
		return 1.0
	}
	
	// Simple coherence measure based on shared terms
	totalSimilarity := 0.0
	comparisons := 0
	
	for i := 0; i < len(sentences); i++ {
		for j := i + 1; j < len(sentences); j++ {
			terms1 := extractSignificantTerms(sentences[i])
			terms2 := extractSignificantTerms(sentences[j])
			totalSimilarity += calculateTermSimilarity(terms1, terms2)
			comparisons++
		}
	}
	
	if comparisons == 0 {
		return 1.0
	}
	
	return totalSimilarity / float64(comparisons)
}

func calculateClusterComplexity(sentences []string) float64 {
	if len(sentences) == 0 {
		return 0
	}
	
	totalComplexity := 0.0
	for _, sentence := range sentences {
		words := strings.Fields(sentence)
		avgWordLength := 0.0
		for _, word := range words {
			avgWordLength += float64(len(word))
		}
		if len(words) > 0 {
			avgWordLength /= float64(len(words))
		}
		
		// Complexity based on sentence length and word length
		complexity := math.Log(float64(len(words))+1) * (avgWordLength / 5.0)
		totalComplexity += complexity
	}
	
	return totalComplexity / float64(len(sentences))
}

func getPositionLabel(index, total int) string {
	third := total / 3
	if index < third {
		return "Beginning"
	} else if index < 2*third {
		return "Middle"
	} else {
		return "End"
	}
}

func countTopicTransitions(sentences []string) int {
	if len(sentences) <= 1 {
		return 0
	}
	
	transitions := 0
	prevTerms := extractSignificantTerms(sentences[0])
	
	for i := 1; i < len(sentences); i++ {
		currentTerms := extractSignificantTerms(sentences[i])
		similarity := calculateTermSimilarity(prevTerms, currentTerms)
		
		if similarity < 0.2 { // Threshold for topic change
			transitions++
		}
		
		prevTerms = currentTerms
	}
	
	return transitions
}

func calculateIdeaDensity(clusters []IdeaCluster, sentenceCount int) float64 {
	if sentenceCount == 0 {
		return 0
	}
	return float64(len(clusters)) / float64(sentenceCount)
}

func calculateConceptualCoherence(clusters []IdeaCluster) float64 {
	if len(clusters) == 0 {
		return 0
	}
	
	totalCoherence := 0.0
	for _, cluster := range clusters {
		totalCoherence += cluster.Coherence
	}
	
	return totalCoherence / float64(len(clusters))
}

func calculateIdeaComplexity(clusters []IdeaCluster, concepts []KeyConcept) float64 {
	if len(clusters) == 0 {
		return 0
	}
	
	totalComplexity := 0.0
	for _, cluster := range clusters {
		totalComplexity += cluster.Complexity
	}
	
	avgClusterComplexity := totalComplexity / float64(len(clusters))
	
	// Factor in concept complexity
	conceptComplexity := 1.0
	if len(concepts) > 0 {
		avgImportance := 0.0
		for _, concept := range concepts {
			avgImportance += concept.Importance
		}
		conceptComplexity = avgImportance / float64(len(concepts)) / 10.0 // Normalize
	}
	
	return avgClusterComplexity * conceptComplexity
}

func calculateConceptualBreadth(concepts []KeyConcept, allWords []string) float64 {
	if len(allWords) == 0 {
		return 0
	}
	
	uniqueConceptWords := make(map[string]bool)
	for _, concept := range concepts {
		uniqueConceptWords[concept.Concept] = true
	}
	
	uniqueAllWords := make(map[string]bool)
	for _, word := range allWords {
		if len(word) > 3 && !isStopWord(word) {
			uniqueAllWords[word] = true
		}
	}
	
	if len(uniqueAllWords) == 0 {
		return 0
	}
	
	return float64(len(uniqueConceptWords)) / float64(len(uniqueAllWords))
}

func calculateThematicConsistency(clusters []IdeaCluster) float64 {
	if len(clusters) <= 1 {
		return 1.0
	}
	
	// Calculate keyword overlap between clusters
	totalOverlap := 0.0
	comparisons := 0
	
	for i := 0; i < len(clusters); i++ {
		for j := i + 1; j < len(clusters); j++ {
			overlap := calculateTermSimilarity(clusters[i].KeyWords, clusters[j].KeyWords)
			totalOverlap += overlap
			comparisons++
		}
	}
	
	if comparisons == 0 {
		return 1.0
	}
	
	return totalOverlap / float64(comparisons)
}

func analyzeIdeaProgression(clusters []IdeaCluster) string {
	if len(clusters) <= 1 {
		return "Single idea"
	}
	
	// Analyze how ideas connect across the text
	// This is a simplified heuristic
	
	beginningClusters := 0
	middleClusters := 0
	endClusters := 0
	
	for _, cluster := range clusters {
		switch cluster.PositionInText {
		case "Beginning":
			beginningClusters++
		case "Middle":
			middleClusters++
		case "End":
			endClusters++
		}
	}
	
	if beginningClusters > 0 && middleClusters > 0 && endClusters > 0 {
		return "Linear development"
	} else if beginningClusters > 1 && endClusters > 1 {
		return "Circular progression"
	} else {
		return "Concentrated development"
	}
}

func extractContext(word string, sentences []string) []string {
	contexts := []string{}
	for _, sentence := range sentences {
		if strings.Contains(strings.ToLower(sentence), word) && len(contexts) < 3 {
			// Extract surrounding context
			words := strings.Fields(sentence)
			for i, w := range words {
				if strings.ToLower(w) == word {
					start := max(0, i-2)
					end := min(len(words), i+3)
					context := strings.Join(words[start:end], " ")
					contexts = append(contexts, context)
					break
				}
			}
		}
	}
	return contexts
}

// isStopWord is already defined in tokenizer.go

// Thought Type Classification Functions

// classifySentenceType determines the type of a single sentence
func classifySentenceType(sentence string) SentenceType {
	lowerSent := strings.ToLower(sentence)
	sentType := SentenceType{
		Sentence:   sentence,
		Indicators: []string{},
	}

	// Question detection - check for question marks anywhere or question patterns
	if strings.Contains(sentence, "?") ||
		startsWithQuestion(lowerSent) ||
		containsQuestionPattern(lowerSent) {
		sentType.Type = "question"
		sentType.SubType = classifyQuestionType(lowerSent)
		sentType.Confidence = 0.95
		if strings.Contains(sentence, "?") {
			sentType.Indicators = append(sentType.Indicators, "question mark")
		}
		if startsWithQuestion(lowerSent) || containsQuestionPattern(lowerSent) {
			sentType.Indicators = append(sentType.Indicators, "interrogative")
		}
		return sentType
	}

	// Fact detection
	if factScore := calculateFactScore(sentence); factScore > 0.7 {
		sentType.Type = "fact"
		sentType.SubType = classifyFactType(sentence)
		sentType.Confidence = factScore
		sentType.Indicators = getFactIndicators(sentence)
		return sentType
	}

	// Opinion detection
	if opinionScore := calculateOpinionScore(sentence); opinionScore > 0.6 {
		sentType.Type = "opinion"
		sentType.SubType = classifyOpinionStrength(sentence)
		sentType.Confidence = opinionScore
		sentType.Indicators = getOpinionIndicators(sentence)
		return sentType
	}

	// Instruction detection
	if instructionScore := calculateInstructionScore(sentence); instructionScore > 0.7 {
		sentType.Type = "instruction"
		sentType.SubType = classifyInstructionType(sentence)
		sentType.Confidence = instructionScore
		sentType.Indicators = getInstructionIndicators(sentence)
		return sentType
	}

	// Example detection
	if exampleScore := calculateExampleScore(sentence); exampleScore > 0.6 {
		sentType.Type = "example"
		sentType.Confidence = exampleScore
		sentType.Indicators = getExampleIndicators(sentence)
		return sentType
	}

	// Argument detection
	if argumentScore := calculateArgumentScore(sentence); argumentScore > 0.5 {
		sentType.Type = "argument"
		sentType.SubType = classifyArgumentType(sentence)
		sentType.Confidence = argumentScore
		sentType.Indicators = getArgumentIndicators(sentence)
		return sentType
	}

	// Default to description/idea
	if containsDescriptiveElements(sentence) {
		sentType.Type = "description"
		sentType.Confidence = 0.6
		sentType.Indicators = []string{"descriptive language"}
	} else {
		sentType.Type = "idea"
		sentType.Confidence = 0.5
		sentType.Indicators = []string{"general statement"}
	}

	return sentType
}

// classifyClusterThoughtType determines the overall type of a cluster
func classifyClusterThoughtType(cluster *IdeaCluster) {
	typeCounts := make(map[string]int)
	totalConfidence := make(map[string]float64)
	sentenceTypes := []SentenceType{}

	// Classify each sentence and collect statistics
	for _, sentence := range cluster.Sentences {
		sentType := classifySentenceType(sentence)
		sentenceTypes = append(sentenceTypes, sentType)
		typeCounts[sentType.Type]++
		totalConfidence[sentType.Type] += sentType.Confidence
	}

	cluster.SentenceTypes = sentenceTypes

	// Determine dominant type
	dominantType := "idea"
	maxConfidence := 0.0

	for typeName, count := range typeCounts {
		avgConfidence := totalConfidence[typeName] / float64(count)
		weightedScore := float64(count) * avgConfidence
		
		if weightedScore > maxConfidence {
			maxConfidence = weightedScore
			dominantType = typeName
		}
	}

	cluster.ThoughtType = dominantType
	cluster.TypeConfidence = maxConfidence / float64(len(cluster.Sentences))

	// Set additional properties based on type
	switch dominantType {
	case "fact":
		cluster.Evidence = extractEvidence(cluster.Sentences)
		cluster.CertaintyLevel = "certain"
	case "opinion":
		cluster.CertaintyLevel = determineCertaintyLevel(cluster.Sentences)
	case "question":
		cluster.Actionable = true
	case "instruction":
		cluster.Actionable = true
	case "argument":
		cluster.CertaintyLevel = determineCertaintyLevel(cluster.Sentences)
	}
}

// Question classification helpers
func startsWithQuestion(sent string) bool {
	questionWords := []string{"what", "when", "where", "who", "why", "how", "which", "whose", "whom", "can", "could", "would", "should", "will", "do", "does", "did", "is", "are", "was", "were", "have", "has", "had"}
	words := strings.Fields(sent)
	if len(words) > 0 {
		firstWord := strings.ToLower(words[0])
		for _, qw := range questionWords {
			if firstWord == qw {
				return true
			}
		}
	}
	return false
}

// containsQuestionPattern checks for question patterns within the sentence
func containsQuestionPattern(sent string) bool {
	// Common question patterns that might appear mid-sentence
	questionPatterns := []string{
		"can you",
		"could you",
		"would you",
		"will you",
		"do you",
		"are you",
		"have you",
		"can i",
		"could i",
		"should i",
		"may i",
		"how do",
		"how can",
		"how to",
		"what is",
		"what are",
		"where is",
		"when is",
		"why is",
		"is it",
		"is there",
		"are there",
	}
	
	for _, pattern := range questionPatterns {
		if strings.Contains(sent, pattern) {
			return true
		}
	}
	
	return false
}

func classifyQuestionType(sent string) string {
	if strings.Contains(sent, "what") {
		return "what-question"
	} else if strings.Contains(sent, "why") {
		return "why-question"
	} else if strings.Contains(sent, "how") {
		return "how-question"
	} else if strings.Contains(sent, "when") {
		return "when-question"
	} else if strings.Contains(sent, "where") {
		return "where-question"
	} else if strings.Contains(sent, "who") || strings.Contains(sent, "whom") {
		return "who-question"
	}
	return "yes-no-question"
}

// Fact scoring and classification
func calculateFactScore(sent string) float64 {
	score := 0.0
	lower := strings.ToLower(sent)
	
	// Fact indicators
	factIndicators := []string{" is ", " are ", " was ", " were ", " has ", " have ", " had ", " contains ", " consists ", " comprises ", " includes ", " measured ", " calculated ", " determined ", " found ", " discovered ", " proven ", " demonstrated "}
	for _, indicator := range factIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.2
		}
	}
	
	// Numeric content suggests facts
	if regexp.MustCompile(`\d+`).MatchString(sent) {
		score += 0.3
	}
	
	// Dates suggest facts
	if regexp.MustCompile(`\b(19|20)\d{2}\b`).MatchString(sent) {
		score += 0.2
	}
	
	// Statistical terms
	statTerms := []string{"percent", "%", "average", "mean", "median", "ratio", "rate", "total", "sum"}
	for _, term := range statTerms {
		if strings.Contains(lower, term) {
			score += 0.2
			break
		}
	}
	
	return math.Min(score, 1.0)
}

func classifyFactType(sent string) string {
	lower := strings.ToLower(sent)
	if regexp.MustCompile(`\d+`).MatchString(sent) {
		if strings.Contains(lower, "percent") || strings.Contains(lower, "%") {
			return "statistical-fact"
		}
		return "numerical-fact"
	}
	if regexp.MustCompile(`\b(19|20)\d{2}\b`).MatchString(sent) {
		return "historical-fact"
	}
	if strings.Contains(lower, "located") || strings.Contains(lower, "found in") {
		return "geographical-fact"
	}
	if strings.Contains(lower, "defined as") || strings.Contains(lower, "is a") || strings.Contains(lower, "is an") {
		return "definitional-fact"
	}
	return "general-fact"
}

func getFactIndicators(sent string) []string {
	indicators := []string{}
	lower := strings.ToLower(sent)
	
	if regexp.MustCompile(`\d+`).MatchString(sent) {
		indicators = append(indicators, "numeric content")
	}
	if strings.Contains(lower, " is ") || strings.Contains(lower, " are ") {
		indicators = append(indicators, "declarative statement")
	}
	if regexp.MustCompile(`\b(19|20)\d{2}\b`).MatchString(sent) {
		indicators = append(indicators, "date reference")
	}
	
	return indicators
}

// Opinion scoring and classification
func calculateOpinionScore(sent string) float64 {
	score := 0.0
	lower := strings.ToLower(sent)
	
	// Opinion indicators
	opinionIndicators := []string{"believe", "think", "feel", "seems", "appears", "probably", "possibly", "perhaps", "maybe", "might", "could", "should", "ought", "better", "worse", "prefer", "opinion", "view", "perspective", "argue", "suggest", "recommend"}
	for _, indicator := range opinionIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.25
		}
	}
	
	// Subjective adjectives
	subjectiveAdj := []string{"good", "bad", "best", "worst", "excellent", "poor", "great", "terrible", "amazing", "awful", "beautiful", "ugly", "important", "crucial", "vital", "unnecessary"}
	for _, adj := range subjectiveAdj {
		if strings.Contains(lower, adj) {
			score += 0.15
		}
	}
	
	// First person suggests opinion
	if strings.Contains(lower, " i ") || strings.HasPrefix(lower, "i ") {
		score += 0.3
	}
	
	return math.Min(score, 1.0)
}

func getOpinionIndicators(sent string) []string {
	indicators := []string{}
	lower := strings.ToLower(sent)
	
	if strings.Contains(lower, "believe") || strings.Contains(lower, "think") {
		indicators = append(indicators, "belief statement")
	}
	if strings.Contains(lower, "should") || strings.Contains(lower, "ought") {
		indicators = append(indicators, "prescriptive language")
	}
	if strings.Contains(lower, " i ") || strings.HasPrefix(lower, "i ") {
		indicators = append(indicators, "first person")
	}
	
	return indicators
}

func classifyOpinionStrength(sent string) string {
	lower := strings.ToLower(sent)
	
	strongIndicators := []string{"definitely", "certainly", "absolutely", "clearly", "obviously", "undoubtedly"}
	for _, ind := range strongIndicators {
		if strings.Contains(lower, ind) {
			return "strong-opinion"
		}
	}
	
	weakIndicators := []string{"perhaps", "maybe", "possibly", "might", "could"}
	for _, ind := range weakIndicators {
		if strings.Contains(lower, ind) {
			return "tentative-opinion"
		}
	}
	
	return "moderate-opinion"
}

// Instruction scoring and classification
func calculateInstructionScore(sent string) float64 {
	score := 0.0
	lower := strings.ToLower(sent)
	words := strings.Fields(sent)
	
	// Imperative mood (starts with verb)
	if len(words) > 0 {
		firstWord := strings.ToLower(words[0])
		imperativeVerbs := []string{"use", "make", "create", "add", "remove", "delete", "insert", "update", "click", "select", "choose", "enter", "type", "press", "open", "close", "start", "stop", "begin", "end", "follow", "ensure", "verify", "check", "confirm"}
		for _, verb := range imperativeVerbs {
			if firstWord == verb {
				score += 0.5
				break
			}
		}
	}
	
	// Instruction indicators
	instructionIndicators := []string{"step", "first", "then", "next", "finally", "must", "need to", "have to", "required", "ensure", "make sure"}
	for _, indicator := range instructionIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.2
		}
	}
	
	// Numbered lists suggest instructions
	if regexp.MustCompile(`^\d+[\.\)]`).MatchString(sent) {
		score += 0.3
	}
	
	return math.Min(score, 1.0)
}

func classifyInstructionType(sent string) string {
	lower := strings.ToLower(sent)
	
	if strings.Contains(lower, "click") || strings.Contains(lower, "select") || strings.Contains(lower, "press") {
		return "ui-instruction"
	}
	if strings.Contains(lower, "install") || strings.Contains(lower, "configure") || strings.Contains(lower, "setup") {
		return "setup-instruction"
	}
	if regexp.MustCompile(`^\d+[\.\)]`).MatchString(sent) {
		return "numbered-step"
	}
	
	return "general-instruction"
}

func getInstructionIndicators(sent string) []string {
	indicators := []string{}
	lower := strings.ToLower(sent)
	words := strings.Fields(sent)
	
	if len(words) > 0 {
		firstWord := strings.ToLower(words[0])
		imperativeVerbs := []string{"use", "make", "create", "add", "click"}
		for _, verb := range imperativeVerbs {
			if firstWord == verb {
				indicators = append(indicators, "imperative verb")
				break
			}
		}
	}
	
	if strings.Contains(lower, "step") || regexp.MustCompile(`^\d+[\.\)]`).MatchString(sent) {
		indicators = append(indicators, "sequential marker")
	}
	
	return indicators
}

// Example detection
func calculateExampleScore(sent string) float64 {
	score := 0.0
	lower := strings.ToLower(sent)
	
	exampleIndicators := []string{"for example", "for instance", "such as", "like", "e.g.", "i.e.", "namely", "specifically", "including", "especially"}
	for _, indicator := range exampleIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.4
		}
	}
	
	// Parenthetical examples
	if strings.Contains(sent, "(") && strings.Contains(sent, ")") {
		score += 0.2
	}
	
	// Colon followed by list
	if strings.Contains(sent, ":") {
		score += 0.2
	}
	
	return math.Min(score, 1.0)
}

func getExampleIndicators(sent string) []string {
	indicators := []string{}
	lower := strings.ToLower(sent)
	
	if strings.Contains(lower, "for example") || strings.Contains(lower, "for instance") {
		indicators = append(indicators, "example phrase")
	}
	if strings.Contains(lower, "such as") || strings.Contains(lower, "like") {
		indicators = append(indicators, "comparison phrase")
	}
	if strings.Contains(sent, "(") && strings.Contains(sent, ")") {
		indicators = append(indicators, "parenthetical")
	}
	
	return indicators
}

// Argument detection
func calculateArgumentScore(sent string) float64 {
	score := 0.0
	lower := strings.ToLower(sent)
	
	// Causal indicators
	causalIndicators := []string{"because", "since", "therefore", "thus", "hence", "consequently", "as a result", "due to", "owing to", "leads to", "causes", "results in"}
	for _, indicator := range causalIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.3
		}
	}
	
	// Contrastive indicators
	contrastIndicators := []string{"however", "but", "although", "though", "whereas", "while", "on the other hand", "in contrast", "nevertheless", "nonetheless"}
	for _, indicator := range contrastIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.25
		}
	}
	
	// Evidence indicators
	evidenceIndicators := []string{"shows", "demonstrates", "proves", "indicates", "suggests", "implies", "reveals", "confirms"}
	for _, indicator := range evidenceIndicators {
		if strings.Contains(lower, indicator) {
			score += 0.2
		}
	}
	
	return math.Min(score, 1.0)
}

func classifyArgumentType(sent string) string {
	lower := strings.ToLower(sent)
	
	if strings.Contains(lower, "because") || strings.Contains(lower, "therefore") || strings.Contains(lower, "thus") {
		return "causal-argument"
	}
	if strings.Contains(lower, "however") || strings.Contains(lower, "but") || strings.Contains(lower, "although") {
		return "contrastive-argument"
	}
	if strings.Contains(lower, "shows") || strings.Contains(lower, "proves") || strings.Contains(lower, "demonstrates") {
		return "evidence-based-argument"
	}
	
	return "general-argument"
}

func getArgumentIndicators(sent string) []string {
	indicators := []string{}
	lower := strings.ToLower(sent)
	
	if strings.Contains(lower, "because") || strings.Contains(lower, "therefore") {
		indicators = append(indicators, "causal reasoning")
	}
	if strings.Contains(lower, "however") || strings.Contains(lower, "but") {
		indicators = append(indicators, "contrast")
	}
	if strings.Contains(lower, "evidence") || strings.Contains(lower, "proves") {
		indicators = append(indicators, "evidence claim")
	}
	
	return indicators
}

// Description detection
func containsDescriptiveElements(sent string) bool {
	lower := strings.ToLower(sent)
	
	// Descriptive patterns
	descriptivePatterns := []string{" is ", " are ", " was ", " were ", " has ", " have ", " contains ", " looks ", " appears ", " seems "}
	for _, pattern := range descriptivePatterns {
		if strings.Contains(lower, pattern) {
			return true
		}
	}
	
	// Adjectives suggest description
	adjectives := []string{"large", "small", "big", "tiny", "red", "blue", "green", "fast", "slow", "high", "low", "new", "old"}
	for _, adj := range adjectives {
		if strings.Contains(lower, adj) {
			return true
		}
	}
	
	return false
}

// Helper functions for cluster analysis
func extractEvidence(sentences []string) []string {
	evidence := []string{}
	for _, sent := range sentences {
		lower := strings.ToLower(sent)
		// Look for evidence patterns
		if strings.Contains(lower, "according to") ||
			strings.Contains(lower, "research shows") ||
			strings.Contains(lower, "studies indicate") ||
			strings.Contains(lower, "data reveals") ||
			regexp.MustCompile(`\(\d{4}\)`).MatchString(sent) { // Citation years
			evidence = append(evidence, sent)
		}
	}
	return evidence
}

func determineCertaintyLevel(sentences []string) string {
	certaintyScore := 0.0
	
	for _, sent := range sentences {
		lower := strings.ToLower(sent)
		
		// High certainty
		if strings.Contains(lower, "definitely") || strings.Contains(lower, "certainly") || strings.Contains(lower, "absolutely") {
			certaintyScore += 1.0
		}
		// Medium certainty
		if strings.Contains(lower, "probably") || strings.Contains(lower, "likely") {
			certaintyScore += 0.5
		}
		// Low certainty
		if strings.Contains(lower, "possibly") || strings.Contains(lower, "perhaps") || strings.Contains(lower, "maybe") {
			certaintyScore += 0.2
		}
	}
	
	avgCertainty := certaintyScore / float64(len(sentences))
	
	if avgCertainty > 0.7 {
		return "certain"
	} else if avgCertainty > 0.4 {
		return "probable"
	} else if avgCertainty > 0.2 {
		return "possible"
	}
	return "speculative"
}

// analyzeThoughtTypeDistribution analyzes the distribution of thought types
func analyzeThoughtTypeDistribution(clusters []IdeaCluster) ThoughtDistribution {
	dist := ThoughtDistribution{}
	
	// Count thought types
	for _, cluster := range clusters {
		switch cluster.ThoughtType {
		case "fact":
			dist.Facts++
		case "question":
			dist.Questions++
		case "opinion":
			dist.Opinions++
		case "instruction":
			dist.Instructions++
		case "example":
			dist.Examples++
		case "argument":
			dist.Arguments++
		case "description":
			dist.Descriptions++
		case "idea":
			dist.Ideas++
		}
	}
	
	// Find dominant type
	maxCount := 0
	dist.DominantType = "mixed"
	typeCounts := map[string]int{
		"facts": dist.Facts,
		"questions": dist.Questions,
		"opinions": dist.Opinions,
		"instructions": dist.Instructions,
		"examples": dist.Examples,
		"arguments": dist.Arguments,
		"descriptions": dist.Descriptions,
		"ideas": dist.Ideas,
	}
	
	for typeName, count := range typeCounts {
		if count > maxCount {
			maxCount = count
			dist.DominantType = typeName
		}
	}
	
	// Calculate balance (Shannon entropy normalized)
	total := float64(len(clusters))
	if total > 0 {
		entropy := 0.0
		for _, count := range typeCounts {
			if count > 0 {
				p := float64(count) / total
				entropy -= p * math.Log2(p)
			}
		}
		// Normalize to 0-1 (max entropy for 8 types is log2(8) = 3)
		dist.Balance = entropy / 3.0
	}
	
	return dist
}

// analyzeQuestions provides detailed analysis of questions
func analyzeQuestions(clusters []IdeaCluster) QuestionAnalysis {
	analysis := QuestionAnalysis{
		QuestionTypes: make(map[string]int),
		Unanswered:    []string{},
		Rhetorical:    []string{},
		Actionable:    []string{},
	}
	
	for _, cluster := range clusters {
		if cluster.ThoughtType == "question" || containsQuestions(cluster) {
			analysis.TotalQuestions++
			
			for _, sentType := range cluster.SentenceTypes {
				if sentType.Type == "question" {
					// Count question subtypes
					if sentType.SubType != "" {
						analysis.QuestionTypes[sentType.SubType]++
					}
					
					// Classify question category
					if isRhetorical(sentType.Sentence) {
						analysis.Rhetorical = append(analysis.Rhetorical, sentType.Sentence)
					} else if cluster.Actionable {
						analysis.Actionable = append(analysis.Actionable, sentType.Sentence)
					} else {
						analysis.Unanswered = append(analysis.Unanswered, sentType.Sentence)
					}
				}
			}
		}
	}
	
	return analysis
}

// analyzeFactualContent provides detailed analysis of facts
func analyzeFactualContent(clusters []IdeaCluster, totalSentences int) FactualContent {
	content := FactualContent{
		FactTypes:        make(map[string]int),
		VerifiableFacts:  []string{},
		StatisticalFacts: []string{},
	}
	
	for _, cluster := range clusters {
		if cluster.ThoughtType == "fact" || containsFacts(cluster) {
			content.TotalFacts++
			
			for _, sentType := range cluster.SentenceTypes {
				if sentType.Type == "fact" {
					// Count fact subtypes
					if sentType.SubType != "" {
						content.FactTypes[sentType.SubType]++
					}
					
					// Categorize facts
					if sentType.SubType == "statistical-fact" {
						content.StatisticalFacts = append(content.StatisticalFacts, sentType.Sentence)
					}
					if isVerifiableFact(sentType.Sentence) {
						content.VerifiableFacts = append(content.VerifiableFacts, sentType.Sentence)
					}
				}
			}
		}
	}
	
	if totalSentences > 0 {
		content.FactDensity = float64(content.TotalFacts) / float64(totalSentences)
	}
	
	return content
}

// Helper functions for thought type analysis
func containsQuestions(cluster IdeaCluster) bool {
	for _, sentType := range cluster.SentenceTypes {
		if sentType.Type == "question" {
			return true
		}
	}
	return false
}

func containsFacts(cluster IdeaCluster) bool {
	for _, sentType := range cluster.SentenceTypes {
		if sentType.Type == "fact" {
			return true
		}
	}
	return false
}

func isRhetorical(question string) bool {
	lower := strings.ToLower(question)
	// Simple heuristic for rhetorical questions
	return strings.Contains(lower, "isn't it obvious") ||
		strings.Contains(lower, "who knows") ||
		strings.Contains(lower, "why not") ||
		strings.Contains(lower, "don't you think")
}

func isVerifiableFact(sentence string) bool {
	lower := strings.ToLower(sentence)
	// Facts with sources or specific data are verifiable
	return regexp.MustCompile(`\d{4}`).MatchString(sentence) || // Years
		strings.Contains(lower, "according to") ||
		strings.Contains(lower, "research") ||
		strings.Contains(lower, "study") ||
		strings.Contains(lower, "data") ||
		regexp.MustCompile(`\d+\s*%`).MatchString(sentence) // Percentages
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// NewEnhancedIdeaClusterMetric creates a new enhanced idea cluster metric
func NewEnhancedIdeaClusterMetric(clusters []IdeaCluster, scale, helpText, practicalApp string) EnhancedIdeaClusterMetric {
	return EnhancedIdeaClusterMetric{
		Value:               clusters,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

// NewEnhancedConceptListMetric creates a new enhanced concept list metric
func NewEnhancedConceptListMetric(concepts []KeyConcept, scale, helpText, practicalApp string) EnhancedConceptListMetric {
	return EnhancedConceptListMetric{
		Value:               concepts,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}