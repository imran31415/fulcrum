package analyzer

import (
	"math"
	"regexp"
	"strings"
	"unicode"
)

type ComplexityMetrics struct {
	FleschKincaidGradeLevel    float64            `json:"flesch_kincaid_grade_level"`
	FleschReadingEase          float64            `json:"flesch_reading_ease"`
	AutomatedReadabilityIndex  float64            `json:"automated_readability_index"`
	ColemanLiauIndex           float64            `json:"coleman_liau_index"`
	GunningFogIndex            float64            `json:"gunning_fog_index"`
	SMOGIndex                  float64            `json:"smog_index"`
	LexicalDiversity           float64            `json:"lexical_diversity"`
	SentenceComplexityAverage  float64            `json:"sentence_complexity_average"`
	WordComplexityDistribution map[string]int     `json:"word_complexity_distribution"`
	SyllableStats              SyllableStatistics `json:"syllable_stats"`
	SentenceStats              SentenceStatistics `json:"sentence_stats"`
	WordStats                  WordStatistics     `json:"word_stats"`
}

type SyllableStatistics struct {
	TotalSyllables    int     `json:"total_syllables"`
	AverageSyllables  float64 `json:"average_syllables_per_word"`
	SyllableVariance  float64 `json:"syllable_variance"`
	MaxSyllablesWord  string  `json:"max_syllables_word"`
	MaxSyllableCount  int     `json:"max_syllable_count"`
}

type SentenceStatistics struct {
	TotalSentences      int     `json:"total_sentences"`
	AverageWordsPerSent float64 `json:"average_words_per_sentence"`
	SentenceLengthVar   float64 `json:"sentence_length_variance"`
	LongestSentence     string  `json:"longest_sentence"`
	ShortestSentence    string  `json:"shortest_sentence"`
	ComplexSentences    int     `json:"complex_sentences"`
	CompoundSentences   int     `json:"compound_sentences"`
}

type WordStatistics struct {
	TotalWords         int     `json:"total_words"`
	UniqueWords        int     `json:"unique_words"`
	AverageWordLength  float64 `json:"average_word_length"`
	WordLengthVariance float64 `json:"word_length_variance"`
	LongestWord        string  `json:"longest_word"`
	ShortestWord       string  `json:"shortest_word"`
	RareWords          int     `json:"rare_words"`
	CommonWords        int     `json:"common_words"`
}

func AnalyzeComplexity(text string) ComplexityMetrics {
	sentences := extractSentences(text)
	words := extractWords(text)
	syllables := calculateTotalSyllables(words)

	metrics := ComplexityMetrics{
		SyllableStats: calculateSyllableStats(words),
		SentenceStats: calculateSentenceStats(sentences, words),
		WordStats:     calculateWordStats(words),
	}

	numSentences := float64(len(sentences))
	numWords := float64(len(words))
	numSyllables := float64(syllables)

	if numSentences > 0 && numWords > 0 {
		avgWordsPerSentence := numWords / numSentences
		avgSyllablesPerWord := numSyllables / numWords

		metrics.FleschKincaidGradeLevel = 0.39*avgWordsPerSentence + 11.8*avgSyllablesPerWord - 15.59
		metrics.FleschReadingEase = 206.835 - 1.015*avgWordsPerSentence - 84.6*avgSyllablesPerWord

		characters := float64(countCharacters(text))
		metrics.AutomatedReadabilityIndex = 4.71*(characters/numWords) + 0.5*(numWords/numSentences) - 21.43

		letters := float64(countLetters(text))
		metrics.ColemanLiauIndex = 0.0588*(letters/numWords*100) - 0.296*(numSentences/numWords*100) - 15.8
	}

	complexWords := countComplexWords(words)
	if len(sentences) > 0 {
		metrics.GunningFogIndex = 0.4 * (numWords/numSentences + 100*float64(complexWords)/numWords)
	}

	polysyllabicWords := countPolysyllabicWords(words)
	if len(sentences) >= 30 {
		metrics.SMOGIndex = 1.043 * math.Sqrt(float64(polysyllabicWords)*30/numSentences) + 3.1291
	}

	uniqueWords := countUniqueWords(words)
	if len(words) > 0 {
		metrics.LexicalDiversity = float64(uniqueWords) / numWords
	}

	metrics.SentenceComplexityAverage = calculateAverageSentenceComplexity(sentences)
	metrics.WordComplexityDistribution = calculateWordComplexityDistribution(words)

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

func countUniqueWords(words []string) int {
	unique := make(map[string]bool)
	for _, word := range words {
		unique[word] = true
	}
	return len(unique)
}

func calculateSyllableStats(words []string) SyllableStatistics {
	if len(words) == 0 {
		return SyllableStatistics{}
	}

	total := 0
	maxSyllables := 0
	maxWord := ""
	syllableCounts := make([]int, len(words))

	for i, word := range words {
		syllables := countSyllables(word)
		syllableCounts[i] = syllables
		total += syllables

		if syllables > maxSyllables {
			maxSyllables = syllables
			maxWord = word
		}
	}

	average := float64(total) / float64(len(words))

	variance := 0.0
	for _, count := range syllableCounts {
		diff := float64(count) - average
		variance += diff * diff
	}
	variance /= float64(len(words))

	return SyllableStatistics{
		TotalSyllables:   total,
		AverageSyllables: average,
		SyllableVariance: variance,
		MaxSyllablesWord: maxWord,
		MaxSyllableCount: maxSyllables,
	}
}

func calculateSentenceStats(sentences []string, words []string) SentenceStatistics {
	if len(sentences) == 0 {
		return SentenceStatistics{}
	}

	totalWords := len(words)
	avgWordsPerSent := float64(totalWords) / float64(len(sentences))

	longest := ""
	shortest := sentences[0]
	longestLen := 0
	shortestLen := len(shortest)

	complexSentences := 0
	compoundSentences := 0

	sentenceLengths := make([]int, len(sentences))

	for i, sentence := range sentences {
		sentenceWords := extractWords(sentence)
		length := len(sentenceWords)
		sentenceLengths[i] = length

		if length > longestLen {
			longestLen = length
			longest = sentence
		}
		if length < shortestLen {
			shortestLen = length
			shortest = sentence
		}

		if strings.Contains(sentence, ",") && length > 15 {
			complexSentences++
		}

		if strings.Contains(sentence, ",") || strings.Contains(sentence, ";") {
			compoundSentences++
		}
	}

	variance := 0.0
	for _, length := range sentenceLengths {
		diff := float64(length) - avgWordsPerSent
		variance += diff * diff
	}
	variance /= float64(len(sentences))

	return SentenceStatistics{
		TotalSentences:      len(sentences),
		AverageWordsPerSent: avgWordsPerSent,
		SentenceLengthVar:   variance,
		LongestSentence:     longest,
		ShortestSentence:    shortest,
		ComplexSentences:    complexSentences,
		CompoundSentences:   compoundSentences,
	}
}

func calculateWordStats(words []string) WordStatistics {
	if len(words) == 0 {
		return WordStatistics{}
	}

	uniqueMap := make(map[string]int)
	totalLength := 0
	longest := ""
	shortest := words[0]

	for _, word := range words {
		uniqueMap[word]++
		totalLength += len(word)

		if len(word) > len(longest) {
			longest = word
		}
		if len(word) < len(shortest) {
			shortest = word
		}
	}

	avgLength := float64(totalLength) / float64(len(words))

	variance := 0.0
	for _, word := range words {
		diff := float64(len(word)) - avgLength
		variance += diff * diff
	}
	variance /= float64(len(words))

	rareWords := 0
	commonWords := 0
	for _, count := range uniqueMap {
		if count == 1 {
			rareWords++
		} else if count >= 5 {
			commonWords++
		}
	}

	return WordStatistics{
		TotalWords:         len(words),
		UniqueWords:        len(uniqueMap),
		AverageWordLength:  avgLength,
		WordLengthVariance: variance,
		LongestWord:        longest,
		ShortestWord:       shortest,
		RareWords:          rareWords,
		CommonWords:        commonWords,
	}
}

func calculateAverageSentenceComplexity(sentences []string) float64 {
	if len(sentences) == 0 {
		return 0
	}

	totalComplexity := 0.0
	for _, sentence := range sentences {
		words := extractWords(sentence)
		syllables := calculateTotalSyllables(words)

		complexity := float64(len(words)) * 0.3
		complexity += float64(syllables) * 0.2

		if strings.Contains(sentence, ",") {
			complexity += 1.0
		}
		if strings.Contains(sentence, ";") {
			complexity += 1.5
		}

		totalComplexity += complexity
	}

	return totalComplexity / float64(len(sentences))
}

func calculateWordComplexityDistribution(words []string) map[string]int {
	distribution := map[string]int{
		"simple":    0,
		"moderate":  0,
		"complex":   0,
		"very_complex": 0,
	}

	for _, word := range words {
		length := len(word)
		syllables := countSyllables(word)

		if length <= 4 && syllables <= 1 {
			distribution["simple"]++
		} else if length <= 7 && syllables <= 2 {
			distribution["moderate"]++
		} else if length <= 10 && syllables <= 3 {
			distribution["complex"]++
		} else {
			distribution["very_complex"]++
		}
	}

	return distribution
}