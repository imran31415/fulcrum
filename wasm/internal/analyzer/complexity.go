package analyzer

import (
	"math"
	"regexp"
	"strings"
	"unicode"
)

type ComplexityMetrics struct {
	FleschKincaidGradeLevel    EnhancedFloatMetric          `json:"flesch_kincaid_grade_level"`
	FleschReadingEase          EnhancedFloatMetric          `json:"flesch_reading_ease"`
	AutomatedReadabilityIndex  EnhancedFloatMetric          `json:"automated_readability_index"`
	ColemanLiauIndex           EnhancedFloatMetric          `json:"coleman_liau_index"`
	GunningFogIndex            EnhancedFloatMetric          `json:"gunning_fog_index"`
	SMOGIndex                  EnhancedFloatMetric          `json:"smog_index"`
	LexicalDiversity           EnhancedFloatMetric          `json:"lexical_diversity"`
	SentenceComplexityAverage  EnhancedFloatMetric          `json:"sentence_complexity_average"`
	WordComplexityDistribution EnhancedMapMetric            `json:"word_complexity_distribution"`
	SyllableStats              EnhancedSyllableStatistics   `json:"syllable_stats"`
	SentenceStats              EnhancedSentenceStatistics   `json:"sentence_stats"`
	WordStats                  EnhancedWordStatistics       `json:"word_stats"`
}

type EnhancedSyllableStatistics struct {
	TotalSyllables    EnhancedIntMetric    `json:"total_syllables"`
	AverageSyllables  EnhancedFloatMetric  `json:"average_syllables_per_word"`
	SyllableVariance  EnhancedFloatMetric  `json:"syllable_variance"`
	MaxSyllablesWord  EnhancedStringMetric `json:"max_syllables_word"`
	MaxSyllableCount  EnhancedIntMetric    `json:"max_syllable_count"`
}

type EnhancedSentenceStatistics struct {
	TotalSentences      EnhancedIntMetric    `json:"total_sentences"`
	AverageWordsPerSent EnhancedFloatMetric  `json:"average_words_per_sentence"`
	SentenceLengthVar   EnhancedFloatMetric  `json:"sentence_length_variance"`
	LongestSentence     EnhancedStringMetric `json:"longest_sentence"`
	ShortestSentence    EnhancedStringMetric `json:"shortest_sentence"`
	ComplexSentences    EnhancedIntMetric    `json:"complex_sentences"`
	CompoundSentences   EnhancedIntMetric    `json:"compound_sentences"`
}

type EnhancedWordStatistics struct {
	TotalWords         EnhancedIntMetric    `json:"total_words"`
	UniqueWords        EnhancedIntMetric    `json:"unique_words"`
	AverageWordLength  EnhancedFloatMetric  `json:"average_word_length"`
	WordLengthVariance EnhancedFloatMetric  `json:"word_length_variance"`
	LongestWord        EnhancedStringMetric `json:"longest_word"`
	ShortestWord       EnhancedStringMetric `json:"shortest_word"`
	RareWords          EnhancedIntMetric    `json:"rare_words"`
	CommonWords        EnhancedIntMetric    `json:"common_words"`
}

func AnalyzeComplexity(text string) ComplexityMetrics {
	sentences := extractSentences(text)
	words := extractWords(text)
	syllables := calculateTotalSyllables(words)

	metrics := ComplexityMetrics{
		SyllableStats: calculateEnhancedSyllableStats(words),
		SentenceStats: calculateEnhancedSentenceStats(sentences, words),
		WordStats:     calculateEnhancedWordStats(words),
	}

	numSentences := float64(len(sentences))
	numWords := float64(len(words))
	numSyllables := float64(syllables)

	if numSentences > 0 && numWords > 0 {
		avgWordsPerSentence := numWords / numSentences
		avgSyllablesPerWord := numSyllables / numWords

		fleschKincaid := 0.39*avgWordsPerSentence + 11.8*avgSyllablesPerWord - 15.59
		metrics.FleschKincaidGradeLevel = NewEnhancedFloatMetric(
			fleschKincaid,
			"0-18+ (US Grade Level)",
			"Indicates the U.S. school grade level required to understand the text. Lower scores indicate easier readability.",
			"Use to determine target audience education level. Aim for 6-8 for general audience, 12+ for academic content.",
		)

		fleschEase := 206.835 - 1.015*avgWordsPerSentence - 84.6*avgSyllablesPerWord
		metrics.FleschReadingEase = NewEnhancedFloatMetric(
			fleschEase,
			"0-100 (Higher = Easier)",
			"Measures text readability. 90-100: Very Easy, 80-89: Easy, 70-79: Fairly Easy, 60-69: Standard, 50-59: Fairly Difficult, 30-49: Difficult, 0-29: Very Difficult.",
			"Target 60-70 for general audience, 80+ for children, 30-50 for academic/technical content. Optimize by shortening sentences and using simpler words.",
		)

		characters := float64(countCharacters(text))
		ari := 4.71*(characters/numWords) + 0.5*(numWords/numSentences) - 21.43
		metrics.AutomatedReadabilityIndex = NewEnhancedFloatMetric(
			ari,
			"1-14+ (US Grade Level)",
			"Character-based readability index that correlates with grade level. More stable than syllable-based measures.",
			"Use for precise grade-level targeting. Particularly useful for technical writing where syllable counting may be unreliable.",
		)

		letters := float64(countLetters(text))
		colemanLiau := 0.0588*(letters/numWords*100) - 0.296*(numSentences/numWords*100) - 15.8
		metrics.ColemanLiauIndex = NewEnhancedFloatMetric(
			colemanLiau,
			"1-16+ (US Grade Level)",
			"Readability index based on characters per word and sentences per 100 words. Less affected by technical terms.",
			"Ideal for technical documentation where specialized vocabulary is necessary but sentence structure can be optimized.",
		)
	}

	complexWords := countComplexWords(words)
	if len(sentences) > 0 {
		gunningFog := 0.4 * (numWords/numSentences + 100*float64(complexWords)/numWords)
		metrics.GunningFogIndex = NewEnhancedFloatMetric(
			gunningFog,
			"6-17+ (Years of Education)",
			"Estimates years of formal education needed to understand text on first reading. Focuses on complex words (3+ syllables).",
			"Target 8-12 for business writing, 6-8 for general public. Reduce by breaking long sentences and replacing complex words.",
		)
	}

	polysyllabicWords := countPolysyllabicWords(words)
	if len(sentences) >= 30 {
		smog := 1.043 * math.Sqrt(float64(polysyllabicWords)*30/numSentences) + 3.1291
		metrics.SMOGIndex = NewEnhancedFloatMetric(
			smog,
			"7-18+ (Years of Education)",
			"Simple Measure of Gobbledygook - estimates years of education needed for 100% comprehension. Requires 30+ sentences for accuracy.",
			"Most accurate for longer texts. Use to ensure content matches audience education level. Healthcare materials often target SMOG 6-8.",
		)
	} else {
		metrics.SMOGIndex = NewEnhancedFloatMetric(
			0,
			"N/A (Requires 30+ sentences)",
			"SMOG index requires at least 30 sentences for accurate calculation.",
			"Increase text length to get meaningful SMOG measurement, or use other readability metrics for shorter texts.",
		)
	}

	uniqueWords := countUniqueWords(words)
	var lexicalDiv float64
	if len(words) > 0 {
		lexicalDiv = float64(uniqueWords) / numWords
	}
	metrics.LexicalDiversity = NewEnhancedFloatMetric(
		lexicalDiv,
		"0-1 (Higher = More Diverse)",
		"Ratio of unique words to total words. Higher values indicate richer vocabulary and less repetition.",
		"0.3-0.5 typical for general writing, 0.6+ indicates sophisticated vocabulary. Low scores may suggest repetitive writing or need for synonym variation.",
	)

	sentComplexity := calculateAverageSentenceComplexity(sentences)
	metrics.SentenceComplexityAverage = NewEnhancedFloatMetric(
		sentComplexity,
		"1-10+ (Higher = More Complex)",
		"Average structural complexity per sentence based on clauses, conjunctions, and punctuation patterns.",
		"1-2: Simple sentences, 3-4: Moderate complexity, 5+: Complex sentences. Balance complexity with readability goals.",
	)

	wordComplexDist := calculateWordComplexityDistribution(words)
	metrics.WordComplexityDistribution = NewEnhancedMapMetric(
		wordComplexDist,
		"Count by Category",
		"Distribution of words by syllable complexity: simple (1 syllable), moderate (2 syllables), complex (3+ syllables).",
		"Monitor complex word ratio. High complex word count may indicate need for simpler alternatives to improve readability.",
	)

	return metrics
}

func extractSentences(text string) []string {
	re := regexp.MustCompile(`[.!?]+\s+`)
	sentences := re.Split(text, -1)

	var cleanSentences []string
	for _, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if len(sentence) > 0 {
			cleanSentences = append(cleanSentences, sentence)
		}
	}
	return cleanSentences
}

func extractWords(text string) []string {
	re := regexp.MustCompile(`\b[a-zA-Z]+\b`)
	words := re.FindAllString(text, -1)

	var cleanWords []string
	for _, word := range words {
		cleanWords = append(cleanWords, strings.ToLower(word))
	}
	return cleanWords
}

func countSyllables(word string) int {
	word = strings.ToLower(word)
	syllables := 0
	prevVowel := false

	for _, char := range word {
		isVowel := strings.ContainsRune("aeiou", char)
		if isVowel && !prevVowel {
			syllables++
		}
		prevVowel = isVowel
	}

	if strings.HasSuffix(word, "e") && syllables > 1 {
		syllables--
	}

	if syllables == 0 {
		syllables = 1
	}

	return syllables
}

func calculateTotalSyllables(words []string) int {
	total := 0
	for _, word := range words {
		total += countSyllables(word)
	}
	return total
}

func countCharacters(text string) int {
	count := 0
	for _, char := range text {
		if unicode.IsLetter(char) || unicode.IsDigit(char) {
			count++
		}
	}
	return count
}

func countLetters(text string) int {
	count := 0
	for _, char := range text {
		if unicode.IsLetter(char) {
			count++
		}
	}
	return count
}

func countComplexWords(words []string) int {
	count := 0
	for _, word := range words {
		if countSyllables(word) >= 3 {
			count++
		}
	}
	return count
}

func countPolysyllabicWords(words []string) int {
	count := 0
	for _, word := range words {
		if countSyllables(word) > 2 {
			count++
		}
	}
	return count
}

// countUniqueWords returns the number of unique, lowercased words
func countUniqueWords(words []string) int {
	seen := make(map[string]struct{})
	for _, w := range words {
		lw := strings.ToLower(w)
		seen[lw] = struct{}{}
	}
	return len(seen)
}

// calculateAverageSentenceComplexity computes a lightweight complexity score per sentence
// based on clause separators and conjunction indicators.
func calculateAverageSentenceComplexity(sentences []string) float64 {
	if len(sentences) == 0 {
		return 0
	}
	indicators := []string{",", ";", ":", " and ", " or ", " because ", " although ", " however "}
	total := 0
	for _, s := range sentences {
		score := 1 // minimum complexity per sentence
		ls := " " + strings.ToLower(s) + " "
		for _, ind := range indicators {
			if strings.Contains(ls, ind) {
				score++
			}
		}
		total += score
	}
	return float64(total) / float64(len(sentences))
}

// calculateWordComplexityDistribution buckets words by syllable count.
func calculateWordComplexityDistribution(words []string) map[string]int {
	m := map[string]int{"simple": 0, "moderate": 0, "complex": 0}
	for _, w := range words {
		syl := countSyllables(w)
		switch {
		case syl <= 1:
			m["simple"]++
		case syl == 2:
			m["moderate"]++
		default:
			m["complex"]++
		}
	}
	return m
}

func calculateEnhancedSyllableStats(words []string) EnhancedSyllableStatistics {
	total := 0
	var counts []int
	maxCount := 0
	maxWord := ""
	for _, w := range words {
		c := countSyllables(w)
		counts = append(counts, c)
		total += c
		if c > maxCount {
			maxCount = c
			maxWord = w
		}
	}
	avg := 0.0
	if len(words) > 0 {
		avg = float64(total) / float64(len(words))
	}
	// simple variance
	var sumSq float64
	for _, c := range counts {
		d := float64(c) - avg
		sumSq += d * d
	}
	variance := 0.0
	if len(counts) > 0 {
		variance = sumSq / float64(len(counts))
	}

	return EnhancedSyllableStatistics{
		TotalSyllables: NewEnhancedIntMetric(
			total,
			"0-∞ (Count)",
			"Total number of syllables across all words in the text. Used in readability calculations.",
			"Higher syllable counts generally indicate more complex words. Monitor in relation to word count for readability assessment.",
		),
		AverageSyllables: NewEnhancedFloatMetric(
			avg,
			"1.0-5.0+ (Syllables per Word)",
			"Average syllables per word. English averages around 1.3-1.5 syllables per word.",
			"Lower values (1.0-1.5) suggest simpler vocabulary, higher values (2.0+) indicate complex vocabulary. Optimize for target audience.",
		),
		SyllableVariance: NewEnhancedFloatMetric(
			variance,
			"0-10+ (Variance)",
			"Variance in syllable count across words. Higher variance indicates mixed complexity.",
			"High variance suggests inconsistent word complexity. Low variance indicates consistent vocabulary difficulty level.",
		),
		MaxSyllablesWord: NewEnhancedStringMetric(
			maxWord,
			"Word (String)",
			"The word with the most syllables in the text. Identifies the most phonetically complex word.",
			"Review for potential simplification. Consider if specialized terms are necessary or if simpler alternatives exist.",
		),
		MaxSyllableCount: NewEnhancedIntMetric(
			maxCount,
			"1-15+ (Syllables)",
			"Maximum syllable count of any single word. Indicates peak word complexity.",
			"Words with 4+ syllables significantly impact readability. Consider context and audience when using complex terms.",
		),
	}
}

func calculateEnhancedSentenceStats(sentences, words []string) EnhancedSentenceStatistics {
	avg := 0.0
	if len(sentences) > 0 {
		avg = float64(len(words)) / float64(len(sentences))
	}

	// Find longest and shortest sentences
	longestSent := ""
	shortestSent := ""
	maxWords := 0
	minWords := 1000000 // arbitrarily large number

	for _, sent := range sentences {
		wordCount := len(strings.Fields(sent))
		if wordCount > maxWords {
			maxWords = wordCount
			longestSent = sent
		}
		if wordCount < minWords {
			minWords = wordCount
			shortestSent = sent
		}
	}

	// Count complex and compound sentences (simplified heuristics)
	complexCount := 0
	compoundCount := 0
	for _, sent := range sentences {
		lowerSent := strings.ToLower(sent)
		if strings.Contains(lowerSent, "because") || strings.Contains(lowerSent, "although") || strings.Contains(lowerSent, "since") || strings.Contains(lowerSent, "while") {
			complexCount++
		}
		if strings.Contains(lowerSent, "and") || strings.Contains(lowerSent, "but") || strings.Contains(lowerSent, "or") {
			compoundCount++
		}
	}

	return EnhancedSentenceStatistics{
		TotalSentences: NewEnhancedIntMetric(
			len(sentences),
			"0-∞ (Count)",
			"Total number of sentences in the text. Basic structural measure.",
			"More sentences with fewer words each typically improves readability. Consider breaking long paragraphs.",
		),
		AverageWordsPerSent: NewEnhancedFloatMetric(
			avg,
			"5-50+ (Words per Sentence)",
			"Average words per sentence. Shorter sentences generally improve readability.",
			"Aim for 15-20 words for general audience, 10-15 for simple text, 20+ acceptable for academic writing. Vary length for flow.",
		),
		SentenceLengthVar: NewEnhancedFloatMetric(
			0.0, // Not calculated in this simplified version
			"0-∞ (Variance)",
			"Variance in sentence length. Higher variance indicates varied sentence structure.",
			"Moderate variance creates better reading rhythm. Too much variance may be jarring, too little may be monotonous.",
		),
		LongestSentence: NewEnhancedStringMetric(
			longestSent,
			"Sentence (String)",
			"The sentence with the most words. May indicate areas for potential simplification.",
			"Review for clarity and consider breaking into shorter sentences if it exceeds 25-30 words.",
		),
		ShortestSentence: NewEnhancedStringMetric(
			shortestSent,
			"Sentence (String)",
			"The sentence with the fewest words. Shows minimum sentence complexity.",
			"Very short sentences (1-3 words) can add emphasis but may seem choppy if overused.",
		),
		ComplexSentences: NewEnhancedIntMetric(
			complexCount,
			"0-∞ (Count)",
			"Sentences with subordinate clauses (containing words like 'because', 'although', 'since', 'while').",
			"Complex sentences add sophistication but may reduce readability. Balance with simpler structures.",
		),
		CompoundSentences: NewEnhancedIntMetric(
			compoundCount,
			"0-∞ (Count)",
			"Sentences with multiple independent clauses joined by conjunctions (and, but, or).",
			"Compound sentences can improve flow but may be harder to follow. Consider breaking some into separate sentences.",
		),
	}
}

func calculateEnhancedWordStats(words []string) EnhancedWordStatistics {
	unique := make(map[string]struct{})
	longest := ""
	shortest := ""
	var sumLen int
	var lengths []int

	for _, w := range words {
		unique[w] = struct{}{}
		lengths = append(lengths, len(w))
		sumLen += len(w)
		if longest == "" || len(w) > len(longest) {
			longest = w
		}
		if shortest == "" || len(w) < len(shortest) {
			shortest = w
		}
	}

	avgLen := 0.0
	if len(words) > 0 {
		avgLen = float64(sumLen) / float64(len(words))
	}

	// Calculate word length variance
	var variance float64
	if len(lengths) > 0 {
		var sumSq float64
		for _, length := range lengths {
			diff := float64(length) - avgLen
			sumSq += diff * diff
		}
		variance = sumSq / float64(len(lengths))
	}

	// Count rare and common words (simplified - based on length as proxy)
	rareWords := 0
	commonWords := 0
	for _, w := range words {
		if len(w) >= 8 { // Words 8+ characters considered rare
			rareWords++
		} else if len(w) >= 3 && len(w) <= 6 { // Common word length range
			commonWords++
		}
	}

	return EnhancedWordStatistics{
		TotalWords: NewEnhancedIntMetric(
			len(words),
			"0-∞ (Count)",
			"Total number of words in the text. Primary measure of text length.",
			"Longer texts provide more context but require more reader attention. Optimize length for purpose and audience.",
		),
		UniqueWords: NewEnhancedIntMetric(
			len(unique),
			"0-∞ (Count)",
			"Number of unique/distinct words. Indicates vocabulary richness and diversity.",
			"Higher unique word counts suggest richer vocabulary. Very low counts may indicate repetitive writing.",
		),
		AverageWordLength: NewEnhancedFloatMetric(
			avgLen,
			"1-20+ (Characters per Word)",
			"Average character length of words. English average is around 4-5 characters.",
			"Shorter words (3-5 chars) improve readability. Longer averages (6+) suggest complex vocabulary or technical content.",
		),
		WordLengthVariance: NewEnhancedFloatMetric(
			variance,
			"0-∞ (Variance)",
			"Variance in word length. Higher values indicate mixed word complexity.",
			"Moderate variance creates good rhythm. High variance may suggest inconsistent difficulty level.",
		),
		LongestWord: NewEnhancedStringMetric(
			longest,
			"Word (String)",
			"The longest word in the text. May represent the most complex vocabulary item.",
			"Review long words for potential simplification or ensure they're necessary for accuracy and clarity.",
		),
		ShortestWord: NewEnhancedStringMetric(
			shortest,
			"Word (String)",
			"The shortest word in the text. Shows minimum word complexity.",
			"Very short words (1-2 chars) are typically function words or abbreviations. Ensure they're appropriate.",
		),
		RareWords: NewEnhancedIntMetric(
			rareWords,
			"0-∞ (Count)",
			"Estimated count of rare/uncommon words (8+ characters). May impact comprehension.",
			"High rare word counts may challenge readers. Consider simpler alternatives for general audiences.",
		),
		CommonWords: NewEnhancedIntMetric(
			commonWords,
			"0-∞ (Count)",
			"Estimated count of common words (3-6 characters). Foundation of readable text.",
			"Higher ratios of common words generally improve readability and comprehension.",
		),
	}
}
