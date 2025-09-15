package analyzer

import (
	"regexp"
	"sort"
	"strings"
	"unicode"
	"unicode/utf8"
)

type PreprocessingData struct {
	OriginalText        string              `json:"original_text"`
	CleanedText         string              `json:"cleaned_text"`
	NormalizedText      string              `json:"normalized_text"`
	LowercaseText       string              `json:"lowercase_text"`
	WithoutStopWords    string              `json:"without_stop_words"`
	StemmedText         string              `json:"stemmed_text"`
	LemmatizedText      string              `json:"lemmatized_text"`
	TextStatistics      TextStats           `json:"text_statistics"`
	LanguageDetection   LanguageInfo        `json:"language_detection"`
	EncodingInfo        EncodingAnalysis    `json:"encoding_info"`
	TextNormalization   NormalizationSteps  `json:"normalization_steps"`
	ExtractionResults   ExtractionData      `json:"extraction_results"`
	QualityMetrics      QualityAssessment   `json:"quality_metrics"`
	TransformationLog   []TransformStep     `json:"transformation_log"`
}

type TextStats struct {
	OriginalLength      int     `json:"original_length"`
	CleanedLength       int     `json:"cleaned_length"`
	CompressionRatio    float64 `json:"compression_ratio"`
	WhitespaceRatio     float64 `json:"whitespace_ratio"`
	PunctuationRatio    float64 `json:"punctuation_ratio"`
	DigitRatio          float64 `json:"digit_ratio"`
	UppercaseRatio      float64 `json:"uppercase_ratio"`
	SpecialCharRatio    float64 `json:"special_char_ratio"`
	UnicodeCharCount    int     `json:"unicode_char_count"`
	ASCIICharCount      int     `json:"ascii_char_count"`
	LineCount           int     `json:"line_count"`
	ParagraphCount      int     `json:"paragraph_count"`
}

type LanguageInfo struct {
	PrimaryLanguage     string             `json:"primary_language"`
	Confidence          float64            `json:"confidence"`
	AlternativeLanguages []LanguageCandidate `json:"alternative_languages"`
	Script              string             `json:"script"`
	Direction           string             `json:"direction"`
}

type LanguageCandidate struct {
	Language   string  `json:"language"`
	Confidence float64 `json:"confidence"`
}

type EncodingAnalysis struct {
	DetectedEncoding    string   `json:"detected_encoding"`
	IsValidUTF8         bool     `json:"is_valid_utf8"`
	HasBOM              bool     `json:"has_bom"`
	NonASCIIBytes       int      `json:"non_ascii_bytes"`
	EncodingProblems    []string `json:"encoding_problems"`
}

type NormalizationSteps struct {
	UnicodeNormalized   string `json:"unicode_normalized"`
	WhitespaceNormalized string `json:"whitespace_normalized"`
	CaseNormalized      string `json:"case_normalized"`
	PunctuationNormalized string `json:"punctuation_normalized"`
	NumbersNormalized   string `json:"numbers_normalized"`
	AccentsRemoved      string `json:"accents_removed"`
}

type ExtractionData struct {
	URLs            []string `json:"urls"`
	EmailAddresses  []string `json:"email_addresses"`
	PhoneNumbers    []string `json:"phone_numbers"`
	Dates           []string `json:"dates"`
	Times           []string `json:"times"`
	Numbers         []string `json:"numbers"`
	Abbreviations   []string `json:"abbreviations"`
	Acronyms        []string `json:"acronyms"`
	Hashtags        []string `json:"hashtags"`
	Mentions        []string `json:"mentions"`
	EmoticonsSmiley []string `json:"emoticons_smiley"`
	SpecialTokens   []string `json:"special_tokens"`
}

type QualityAssessment struct {
	ReadabilityScore    float64      `json:"readability_score"`
	CoherenceScore      float64      `json:"coherence_score"`
	CompletenessScore   float64      `json:"completeness_score"`
	QualityIssues       []QualityIssue `json:"quality_issues"`
	SpellingErrors      []SpellingError `json:"spelling_errors"`
	GrammarIssues       []GrammarIssue `json:"grammar_issues"`
	StyleSuggestions    []StyleSuggestion `json:"style_suggestions"`
}

type QualityIssue struct {
	Type        string `json:"type"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	Position    int    `json:"position"`
	Length      int    `json:"length"`
}

type SpellingError struct {
	Word        string   `json:"word"`
	Position    int      `json:"position"`
	Suggestions []string `json:"suggestions"`
}

type GrammarIssue struct {
	Text        string `json:"text"`
	Position    int    `json:"position"`
	Length      int    `json:"length"`
	Rule        string `json:"rule"`
	Description string `json:"description"`
	Suggestion  string `json:"suggestion"`
}

type StyleSuggestion struct {
	Text        string `json:"text"`
	Position    int    `json:"position"`
	Length      int    `json:"length"`
	Suggestion  string `json:"suggestion"`
	Reason      string `json:"reason"`
}

type TransformStep struct {
	Step        string `json:"step"`
	Before      string `json:"before"`
	After       string `json:"after"`
	Description string `json:"description"`
}

func PreprocessText(text string) PreprocessingData {
	var transformationLog []TransformStep

	originalText := text
	transformationLog = append(transformationLog, TransformStep{
		Step:        "original",
		Before:      "",
		After:       text,
		Description: "Original input text",
	})

	cleanedText := cleanText(text)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "cleaning",
		Before:      text,
		After:       cleanedText,
		Description: "Removed unwanted characters and normalized whitespace",
	})

	normalizedText := normalizeText(cleanedText)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "normalization",
		Before:      cleanedText,
		After:       normalizedText,
		Description: "Applied Unicode normalization and character standardization",
	})

	lowercaseText := strings.ToLower(normalizedText)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "lowercase",
		Before:      normalizedText,
		After:       lowercaseText,
		Description: "Converted to lowercase",
	})

	withoutStopWords := removeStopWords(lowercaseText)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "stop_words_removal",
		Before:      lowercaseText,
		After:       withoutStopWords,
		Description: "Removed common stop words",
	})

	stemmedText := stemText(withoutStopWords)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "stemming",
		Before:      withoutStopWords,
		After:       stemmedText,
		Description: "Applied word stemming",
	})

	lemmatizedText := lemmatizeText(withoutStopWords)
	transformationLog = append(transformationLog, TransformStep{
		Step:        "lemmatization",
		Before:      withoutStopWords,
		After:       lemmatizedText,
		Description: "Applied word lemmatization",
	})

	return PreprocessingData{
		OriginalText:        originalText,
		CleanedText:         cleanedText,
		NormalizedText:      normalizedText,
		LowercaseText:       lowercaseText,
		WithoutStopWords:    withoutStopWords,
		StemmedText:         stemmedText,
		LemmatizedText:      lemmatizedText,
		TextStatistics:      calculateTextStats(originalText, cleanedText),
		LanguageDetection:   detectLanguage(originalText),
		EncodingInfo:        analyzeEncoding(originalText),
		TextNormalization:   performNormalizationSteps(originalText),
		ExtractionResults:   extractInformation(originalText),
		QualityMetrics:      assessQuality(originalText),
		TransformationLog:   transformationLog,
	}
}

func cleanText(text string) string {
	text = regexp.MustCompile(`\r\n|\r|\n`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`[^\p{L}\p{N}\p{P}\p{S}\s]`).ReplaceAllString(text, "")
	text = strings.TrimSpace(text)
	return text
}

func normalizeText(text string) string {
	var result strings.Builder

	for _, char := range text {
		if unicode.IsSpace(char) {
			result.WriteRune(' ')
		} else if unicode.IsPrint(char) {
			result.WriteRune(char)
		}
	}

	normalized := result.String()
	normalized = regexp.MustCompile(`\s+`).ReplaceAllString(normalized, " ")
	normalized = strings.TrimSpace(normalized)

	return normalized
}

func removeStopWords(text string) string {
	words := strings.Fields(text)
	var filtered []string

	for _, word := range words {
		if !stopWords[strings.ToLower(word)] {
			filtered = append(filtered, word)
		}
	}

	return strings.Join(filtered, " ")
}

func stemText(text string) string {
	words := strings.Fields(text)
	var stemmed []string

	for _, word := range words {
		stemmed = append(stemmed, stemWord(word))
	}

	return strings.Join(stemmed, " ")
}

func stemWord(word string) string {
	word = strings.ToLower(word)

	if strings.HasSuffix(word, "ies") && len(word) > 3 {
		return word[:len(word)-3] + "y"
	}
	if strings.HasSuffix(word, "ied") && len(word) > 3 {
		return word[:len(word)-3] + "y"
	}
	if strings.HasSuffix(word, "ing") && len(word) > 3 {
		return word[:len(word)-3]
	}
	if strings.HasSuffix(word, "ed") && len(word) > 2 {
		return word[:len(word)-2]
	}
	if strings.HasSuffix(word, "er") && len(word) > 2 {
		return word[:len(word)-2]
	}
	if strings.HasSuffix(word, "est") && len(word) > 3 {
		return word[:len(word)-3]
	}
	if strings.HasSuffix(word, "s") && len(word) > 1 && !strings.HasSuffix(word, "ss") {
		return word[:len(word)-1]
	}

	return word
}

func lemmatizeText(text string) string {
	words := strings.Fields(text)
	var lemmatized []string

	for _, word := range words {
		lemmatized = append(lemmatized, getLemma(word))
	}

	return strings.Join(lemmatized, " ")
}

func calculateTextStats(original, cleaned string) TextStats {
	originalLen := len(original)
	cleanedLen := len(cleaned)

	var whitespace, punctuation, digits, uppercase, special, unicodeCount, ascii int

	for _, char := range original {
		if unicode.IsSpace(char) {
			whitespace++
		} else if unicode.IsPunct(char) {
			punctuation++
		} else if unicode.IsDigit(char) {
			digits++
		} else if unicode.IsUpper(char) {
			uppercase++
		} else if char > 127 {
			unicodeCount++
		} else if char < 128 {
			ascii++
		} else {
			special++
		}
	}

	lines := strings.Count(original, "\n") + 1
	paragraphs := len(regexp.MustCompile(`\n\s*\n`).Split(original, -1))

	var compressionRatio float64
	if originalLen > 0 {
		compressionRatio = float64(cleanedLen) / float64(originalLen)
	}

	return TextStats{
		OriginalLength:   originalLen,
		CleanedLength:    cleanedLen,
		CompressionRatio: compressionRatio,
		WhitespaceRatio:  float64(whitespace) / float64(originalLen),
		PunctuationRatio: float64(punctuation) / float64(originalLen),
		DigitRatio:       float64(digits) / float64(originalLen),
		UppercaseRatio:   float64(uppercase) / float64(originalLen),
		SpecialCharRatio: float64(special) / float64(originalLen),
		UnicodeCharCount: unicodeCount,
		ASCIICharCount:   ascii,
		LineCount:        lines,
		ParagraphCount:   paragraphs,
	}
}

func detectLanguage(text string) LanguageInfo {
	commonWords := map[string]string{
		"the":  "en",
		"and":  "en",
		"is":   "en",
		"a":    "en",
		"to":   "en",
		"la":   "es",
		"que":  "es",
		"el":   "es",
		"en":   "es",
		"le":   "fr",
		"et":   "fr",
		"à":    "fr",
		"un":   "fr",
		"der":  "de",
		"die":  "de",
		"und":  "de",
		"in":   "de",
		"den":  "de",
		"de":   "fr",
	}

	words := strings.Fields(strings.ToLower(text))
	langCount := make(map[string]int)

	for _, word := range words {
		if lang, exists := commonWords[word]; exists {
			langCount[lang]++
		}
	}

	primaryLang := "en"
	maxCount := 0
	for lang, count := range langCount {
		if count > maxCount {
			maxCount = count
			primaryLang = lang
		}
	}

	var alternatives []LanguageCandidate
	for lang, count := range langCount {
		if lang != primaryLang {
			confidence := float64(count) / float64(len(words))
			alternatives = append(alternatives, LanguageCandidate{
				Language:   lang,
				Confidence: confidence,
			})
		}
	}

	sort.Slice(alternatives, func(i, j int) bool {
		return alternatives[i].Confidence > alternatives[j].Confidence
	})

	confidence := float64(maxCount) / float64(len(words))
	if confidence < 0.1 {
		confidence = 0.1
	}

	return LanguageInfo{
		PrimaryLanguage:      primaryLang,
		Confidence:           confidence,
		AlternativeLanguages: alternatives,
		Script:               "Latin",
		Direction:            "ltr",
	}
}

func analyzeEncoding(text string) EncodingAnalysis {
	var nonASCIIBytes int
	var problems []string

	for _, char := range text {
		if char > 127 {
			nonASCIIBytes++
		}
	}

	isValidUTF8 := utf8.ValidString(text)
	if !isValidUTF8 {
		problems = append(problems, "Invalid UTF-8 encoding detected")
	}

	hasBOM := strings.HasPrefix(text, "\uFEFF")

	return EncodingAnalysis{
		DetectedEncoding: "UTF-8",
		IsValidUTF8:      isValidUTF8,
		HasBOM:           hasBOM,
		NonASCIIBytes:    nonASCIIBytes,
		EncodingProblems: problems,
	}
}

func performNormalizationSteps(text string) NormalizationSteps {
	unicodeNormalized := text

	whitespaceNormalized := regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	whitespaceNormalized = strings.TrimSpace(whitespaceNormalized)

	caseNormalized := strings.ToLower(text)

	punctuationNormalized := regexp.MustCompile(`[''"""''‚‛""„‟‹›«»]`).ReplaceAllString(text, "'")
	punctuationNormalized = regexp.MustCompile(`[–—−]`).ReplaceAllString(punctuationNormalized, "-")

	numbersNormalized := regexp.MustCompile(`\d+`).ReplaceAllString(text, "<NUM>")

	accentsRemoved := text
	accentMap := map[rune]rune{
		'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
		'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
		'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
		'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o',
		'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
		'ñ': 'n', 'ç': 'c',
	}

	var result strings.Builder
	for _, char := range accentsRemoved {
		if replacement, exists := accentMap[unicode.ToLower(char)]; exists {
			result.WriteRune(replacement)
		} else {
			result.WriteRune(char)
		}
	}
	accentsRemoved = result.String()

	return NormalizationSteps{
		UnicodeNormalized:     unicodeNormalized,
		WhitespaceNormalized:  whitespaceNormalized,
		CaseNormalized:        caseNormalized,
		PunctuationNormalized: punctuationNormalized,
		NumbersNormalized:     numbersNormalized,
		AccentsRemoved:        accentsRemoved,
	}
}

func extractInformation(text string) ExtractionData {
	urlRegex := regexp.MustCompile(`https?://[^\s]+`)
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	phoneRegex := regexp.MustCompile(`\+?[\d\s\-\(\)]{10,}`)
	dateRegex := regexp.MustCompile(`\d{1,2}[/-]\d{1,2}[/-]\d{2,4}`)
	timeRegex := regexp.MustCompile(`\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?`)
	numberRegex := regexp.MustCompile(`\b\d+(?:\.\d+)?\b`)
	abbreviationRegex := regexp.MustCompile(`\b[A-Z]{2,}\b`)
	hashtagRegex := regexp.MustCompile(`#\w+`)
	mentionRegex := regexp.MustCompile(`@\w+`)
	emoticonRegex := regexp.MustCompile(`[:;]-?[)(\[\]{}|\\\/pP]`)

	return ExtractionData{
		URLs:            urlRegex.FindAllString(text, -1),
		EmailAddresses:  emailRegex.FindAllString(text, -1),
		PhoneNumbers:    phoneRegex.FindAllString(text, -1),
		Dates:           dateRegex.FindAllString(text, -1),
		Times:           timeRegex.FindAllString(text, -1),
		Numbers:         numberRegex.FindAllString(text, -1),
		Abbreviations:   abbreviationRegex.FindAllString(text, -1),
		Acronyms:        abbreviationRegex.FindAllString(text, -1),
		Hashtags:        hashtagRegex.FindAllString(text, -1),
		Mentions:        mentionRegex.FindAllString(text, -1),
		EmoticonsSmiley: emoticonRegex.FindAllString(text, -1),
		SpecialTokens:   []string{},
	}
}

func assessQuality(text string) QualityAssessment {
	words := strings.Fields(text)
	sentences := extractSentences(text)

	readabilityScore := calculateReadabilityScore(words, sentences)
	coherenceScore := calculateCoherenceScore(text)
	completenessScore := calculateCompletenessScore(text)

	qualityIssues := findQualityIssues(text)
	spellingErrors := findSpellingErrors(words)
	grammarIssues := findGrammarIssues(text)
	styleSuggestions := findStyleSuggestions(text)

	return QualityAssessment{
		ReadabilityScore:  readabilityScore,
		CoherenceScore:    coherenceScore,
		CompletenessScore: completenessScore,
		QualityIssues:     qualityIssues,
		SpellingErrors:    spellingErrors,
		GrammarIssues:     grammarIssues,
		StyleSuggestions:  styleSuggestions,
	}
}

func calculateReadabilityScore(words []string, sentences []string) float64 {
	if len(sentences) == 0 || len(words) == 0 {
		return 0
	}

	avgWordsPerSentence := float64(len(words)) / float64(len(sentences))

	if avgWordsPerSentence < 10 {
		return 0.9
	} else if avgWordsPerSentence < 20 {
		return 0.7
	} else if avgWordsPerSentence < 30 {
		return 0.5
	} else {
		return 0.3
	}
}

func calculateCoherenceScore(text string) float64 {
	sentences := extractSentences(text)
	if len(sentences) <= 1 {
		return 1.0
	}

	coherenceIndicators := []string{"however", "therefore", "moreover", "furthermore", "additionally", "consequently"}
	indicatorCount := 0

	for _, sentence := range sentences {
		for _, indicator := range coherenceIndicators {
			if strings.Contains(strings.ToLower(sentence), indicator) {
				indicatorCount++
				break
			}
		}
	}

	return float64(indicatorCount) / float64(len(sentences))
}

func calculateCompletenessScore(text string) float64 {
	words := strings.Fields(text)
	sentences := extractSentences(text)

	if len(words) < 10 {
		return 0.2
	}
	if len(sentences) < 2 {
		return 0.4
	}
	if len(words) < 50 {
		return 0.6
	}

	return 0.8
}

func findQualityIssues(text string) []QualityIssue {
	var issues []QualityIssue

	if strings.Contains(text, "  ") {
		issues = append(issues, QualityIssue{
			Type:        "formatting",
			Description: "Multiple consecutive spaces found",
			Severity:    "low",
			Position:    strings.Index(text, "  "),
			Length:      2,
		})
	}

	if !regexp.MustCompile(`[.!?]\s*$`).MatchString(text) {
		issues = append(issues, QualityIssue{
			Type:        "punctuation",
			Description: "Text does not end with proper punctuation",
			Severity:    "medium",
			Position:    len(text) - 1,
			Length:      1,
		})
	}

	return issues
}

func findSpellingErrors(words []string) []SpellingError {
	var errors []SpellingError
	commonMisspellings := map[string][]string{
		"recieve":    {"receive"},
		"seperate":   {"separate"},
		"definately": {"definitely"},
		"occured":    {"occurred"},
		"neccessary": {"necessary"},
	}

	position := 0
	for _, word := range words {
		cleanWord := strings.ToLower(regexp.MustCompile(`[^\w]`).ReplaceAllString(word, ""))
		if suggestions, exists := commonMisspellings[cleanWord]; exists {
			errors = append(errors, SpellingError{
				Word:        word,
				Position:    position,
				Suggestions: suggestions,
			})
		}
		position += len(word) + 1
	}

	return errors
}

func findGrammarIssues(text string) []GrammarIssue {
	var issues []GrammarIssue

	doubleNegatives := regexp.MustCompile(`\b(don't|won't|can't|shouldn't)\s+(no|nothing|nobody|never)\b`)
	matches := doubleNegatives.FindAllStringIndex(text, -1)

	for _, match := range matches {
		issues = append(issues, GrammarIssue{
			Text:        text[match[0]:match[1]],
			Position:    match[0],
			Length:      match[1] - match[0],
			Rule:        "double_negative",
			Description: "Double negative construction detected",
			Suggestion:  "Consider using a positive construction",
		})
	}

	return issues
}

func findStyleSuggestions(text string) []StyleSuggestion {
	var suggestions []StyleSuggestion

	passiveVoice := regexp.MustCompile(`\b(was|were|is|are)\s+\w+ed\b`)
	matches := passiveVoice.FindAllStringIndex(text, -1)

	for _, match := range matches {
		suggestions = append(suggestions, StyleSuggestion{
			Text:       text[match[0]:match[1]],
			Position:   match[0],
			Length:     match[1] - match[0],
			Suggestion: "Consider using active voice",
			Reason:     "Active voice is generally more direct and engaging",
		})
	}

	return suggestions
}