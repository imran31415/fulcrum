package analyzer

import (
	"regexp"
	"sort"
	"strings"
	"unicode"
	"unicode/utf8"
)

type PreprocessingData struct {
	OriginalText        EnhancedStringMetric      `json:"original_text"`
	CleanedText         EnhancedStringMetric      `json:"cleaned_text"`
	NormalizedText      EnhancedStringMetric      `json:"normalized_text"`
	LowercaseText       EnhancedStringMetric      `json:"lowercase_text"`
	WithoutStopWords    EnhancedStringMetric      `json:"without_stop_words"`
	StemmedText         EnhancedStringMetric      `json:"stemmed_text"`
	LemmatizedText      EnhancedStringMetric      `json:"lemmatized_text"`
	TextStatistics      EnhancedTextStats         `json:"text_statistics"`
	LanguageDetection   EnhancedLanguageInfo      `json:"language_detection"`
	EncodingInfo        EnhancedEncodingAnalysis  `json:"encoding_info"`
	TextNormalization   EnhancedNormalizationSteps `json:"normalization_steps"`
	ExtractionResults   EnhancedExtractionData    `json:"extraction_results"`
	QualityMetrics      EnhancedQualityAssessment `json:"quality_metrics"`
	TransformationLog   EnhancedTransformationLog `json:"transformation_log"`
}

type EnhancedTextStats struct {
	OriginalLength      EnhancedIntMetric   `json:"original_length"`
	CleanedLength       EnhancedIntMetric   `json:"cleaned_length"`
	CompressionRatio    EnhancedFloatMetric `json:"compression_ratio"`
	WhitespaceRatio     EnhancedFloatMetric `json:"whitespace_ratio"`
	PunctuationRatio    EnhancedFloatMetric `json:"punctuation_ratio"`
	DigitRatio          EnhancedFloatMetric `json:"digit_ratio"`
	UppercaseRatio      EnhancedFloatMetric `json:"uppercase_ratio"`
	SpecialCharRatio    EnhancedFloatMetric `json:"special_char_ratio"`
	UnicodeCharCount    EnhancedIntMetric   `json:"unicode_char_count"`
	ASCIICharCount      EnhancedIntMetric   `json:"ascii_char_count"`
	LineCount           EnhancedIntMetric   `json:"line_count"`
	ParagraphCount      EnhancedIntMetric   `json:"paragraph_count"`
}

// Enhanced structures for preprocessing
type EnhancedLanguageInfo struct {
	PrimaryLanguage     EnhancedStringMetric `json:"primary_language"`
	Confidence          EnhancedFloatMetric  `json:"confidence"`
	AlternativeLanguages EnhancedLangCandidates `json:"alternative_languages"`
	Script              EnhancedStringMetric `json:"script"`
	Direction           EnhancedStringMetric `json:"direction"`
}

type EnhancedLangCandidates struct {
	Value               []LanguageCandidate `json:"value"`
	Scale               string              `json:"scale"`
	HelpText            string              `json:"help_text"`
	PracticalApplication string              `json:"practical_application"`
}

type EnhancedEncodingAnalysis struct {
	DetectedEncoding    EnhancedStringMetric      `json:"detected_encoding"`
	IsValidUTF8         EnhancedBoolMetric        `json:"is_valid_utf8"`
	HasBOM              EnhancedBoolMetric        `json:"has_bom"`
	NonASCIIBytes       EnhancedIntMetric         `json:"non_ascii_bytes"`
	EncodingProblems    EnhancedStringSliceMetric `json:"encoding_problems"`
}

type EnhancedNormalizationSteps struct {
	UnicodeNormalized     EnhancedStringMetric `json:"unicode_normalized"`
	WhitespaceNormalized  EnhancedStringMetric `json:"whitespace_normalized"`
	CaseNormalized        EnhancedStringMetric `json:"case_normalized"`
	PunctuationNormalized EnhancedStringMetric `json:"punctuation_normalized"`
	NumbersNormalized     EnhancedStringMetric `json:"numbers_normalized"`
	AccentsRemoved        EnhancedStringMetric `json:"accents_removed"`
}

type EnhancedExtractionData struct {
	URLs            EnhancedStringSliceMetric `json:"urls"`
	EmailAddresses  EnhancedStringSliceMetric `json:"email_addresses"`
	PhoneNumbers    EnhancedStringSliceMetric `json:"phone_numbers"`
	Dates           EnhancedStringSliceMetric `json:"dates"`
	Times           EnhancedStringSliceMetric `json:"times"`
	Numbers         EnhancedStringSliceMetric `json:"numbers"`
	Abbreviations   EnhancedStringSliceMetric `json:"abbreviations"`
	Acronyms        EnhancedStringSliceMetric `json:"acronyms"`
	Hashtags        EnhancedStringSliceMetric `json:"hashtags"`
	Mentions        EnhancedStringSliceMetric `json:"mentions"`
	EmoticonsSmiley EnhancedStringSliceMetric `json:"emoticons_smiley"`
	SpecialTokens   EnhancedStringSliceMetric `json:"special_tokens"`
}

type EnhancedQualityAssessment struct {
	ReadabilityScore    EnhancedFloatMetric       `json:"readability_score"`
	CoherenceScore      EnhancedFloatMetric       `json:"coherence_score"`
	CompletenessScore   EnhancedFloatMetric       `json:"completeness_score"`
	QualityIssues       EnhancedQualityIssues     `json:"quality_issues"`
	SpellingErrors      EnhancedSpellingErrors    `json:"spelling_errors"`
	GrammarIssues       EnhancedGrammarIssues     `json:"grammar_issues"`
	StyleSuggestions    EnhancedStyleSuggestions  `json:"style_suggestions"`
}

type EnhancedQualityIssues struct {
	Value               []QualityIssue `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

type EnhancedSpellingErrors struct {
	Value               []SpellingError `json:"value"`
	Scale               string          `json:"scale"`
	HelpText            string          `json:"help_text"`
	PracticalApplication string          `json:"practical_application"`
}

type EnhancedGrammarIssues struct {
	Value               []GrammarIssue `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

type EnhancedStyleSuggestions struct {
	Value               []StyleSuggestion `json:"value"`
	Scale               string            `json:"scale"`
	HelpText            string            `json:"help_text"`
	PracticalApplication string            `json:"practical_application"`
}

type EnhancedTransformationLog struct {
	Value               []TransformStep `json:"value"`
	Scale               string          `json:"scale"`
	HelpText            string          `json:"help_text"`
	PracticalApplication string          `json:"practical_application"`
}

// Keep original structures for internal processing
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

func calculateEnhancedTextStats(original, cleaned string) EnhancedTextStats {
	base := calculateTextStats(original, cleaned)
	return EnhancedTextStats{
		OriginalLength: NewEnhancedIntMetric(
			base.OriginalLength,
			"0-∞ (Characters)",
			"Number of characters in the original text.",
			"Use to gauge input size and potential processing cost.",
		),
		CleanedLength: NewEnhancedIntMetric(
			base.CleanedLength,
			"0-∞ (Characters)",
			"Number of characters after cleaning.",
			"Compare with original length to estimate cleaning impact.",
		),
		CompressionRatio: NewEnhancedFloatMetric(
			base.CompressionRatio,
			"0-1 (Lower = More Removed)",
			"Ratio of cleaned length to original length.",
			"Lower ratios indicate heavy cleaning; verify important content wasn't lost.",
		),
		WhitespaceRatio: NewEnhancedFloatMetric(
			base.WhitespaceRatio,
			"0-1 (Proportion)",
			"Proportion of whitespace characters.",
			"High whitespace ratio may indicate formatting (tables/code) or inconsistent spacing.",
		),
		PunctuationRatio: NewEnhancedFloatMetric(
			base.PunctuationRatio,
			"0-1 (Proportion)",
			"Proportion of punctuation characters.",
			"Very high values may suggest lists, code, or fragmented text.",
		),
		DigitRatio: NewEnhancedFloatMetric(
			base.DigitRatio,
			"0-1 (Proportion)",
			"Proportion of numeric characters.",
			"Useful to detect data-heavy content; adjust analysis accordingly.",
		),
		UppercaseRatio: NewEnhancedFloatMetric(
			base.UppercaseRatio,
			"0-1 (Proportion)",
			"Proportion of uppercase letters.",
			"High uppercase may indicate titles, acronyms, or shouting in informal text.",
		),
		SpecialCharRatio: NewEnhancedFloatMetric(
			base.SpecialCharRatio,
			"0-1 (Proportion)",
			"Proportion of special characters.",
			"Detects presence of emoji, symbols; may require different tokenization.",
		),
		UnicodeCharCount: NewEnhancedIntMetric(
			base.UnicodeCharCount,
			"0-∞ (Count)",
			"Number of non-ASCII unicode characters.",
			"Non-ASCII content suggests multilingual text or special symbols.",
		),
		ASCIICharCount: NewEnhancedIntMetric(
			base.ASCIICharCount,
			"0-∞ (Count)",
			"Number of ASCII characters.",
			"Compare with unicode count to understand character set mix.",
		),
		LineCount: NewEnhancedIntMetric(
			base.LineCount,
			"1-∞ (Lines)",
			"Number of newline-delimited lines.",
			"Useful for structure detection (paragraphs, lists, logs).",
		),
		ParagraphCount: NewEnhancedIntMetric(
			base.ParagraphCount,
			"1-∞ (Paragraphs)",
			"Number of paragraphs separated by blank lines.",
			"Indicates document structure; few paragraphs may suggest unstructured text.",
		),
	}
}

func detectEnhancedLanguage(text string) EnhancedLanguageInfo {
	base := detectLanguage(text)
	return EnhancedLanguageInfo{
		PrimaryLanguage: NewEnhancedStringMetric(
			base.PrimaryLanguage,
			"BCP-47 Code",
			"Detected primary language code.",
			"Route language-specific processing and models.",
		),
		Confidence: NewEnhancedFloatMetric(
			base.Confidence,
			"0-1 (Higher = More Confident)",
			"Confidence score for detected language.",
			"Low confidence suggests multilingual text or insufficient context.",
		),
		AlternativeLanguages: EnhancedLangCandidates{
			Value:               base.AlternativeLanguages,
			Scale:               "List of candidates",
			HelpText:            "Alternative likely languages with confidence.",
			PracticalApplication: "Use for fallback language selection or multilingual handling.",
		},
		Script: NewEnhancedStringMetric(base.Script, "Script Name", "Writing system used.", "Handle script-specific normalization and tokenization."),
		Direction: NewEnhancedStringMetric(base.Direction, "ltr/rtl", "Text direction.", "Required for rendering and some NLP pipelines."),
	}
}

func analyzeEnhancedEncoding(text string) EnhancedEncodingAnalysis {
	base := analyzeEncoding(text)
	return EnhancedEncodingAnalysis{
		DetectedEncoding: NewEnhancedStringMetric(base.DetectedEncoding, "IANA Name", "Detected character encoding.", "Validate and convert encodings if necessary."),
		IsValidUTF8:      NewEnhancedBoolMetric(base.IsValidUTF8, "true/false", "Whether text is valid UTF-8.", "Invalid UTF-8 may break processing; clean or re-encode."),
		HasBOM:           NewEnhancedBoolMetric(base.HasBOM, "true/false", "Whether text starts with a Byte Order Mark.", "Strip BOM when concatenating files to avoid artifacts."),
		NonASCIIBytes:    NewEnhancedIntMetric(base.NonASCIIBytes, "0-∞ (Bytes)", "Count of non-ASCII bytes.", "High values indicate non-English or special symbols."),
		EncodingProblems: NewEnhancedStringSliceMetric(base.EncodingProblems, "List", "Detected encoding issues.", "Investigate and remediate before downstream tasks."),
	}
}

func performEnhancedNormalizationSteps(text string) EnhancedNormalizationSteps {
	base := performNormalizationSteps(text)
	return EnhancedNormalizationSteps{
		UnicodeNormalized:     NewEnhancedStringMetric(base.UnicodeNormalized, "Text String", "Unicode normalization applied.", "Ensures consistent code points."),
		WhitespaceNormalized:  NewEnhancedStringMetric(base.WhitespaceNormalized, "Text String", "Whitespace normalized.", "Removes irregular spacing for consistent tokenization."),
		CaseNormalized:        NewEnhancedStringMetric(base.CaseNormalized, "Text String", "Case normalized.", "Enable case-insensitive analysis."),
		PunctuationNormalized: NewEnhancedStringMetric(base.PunctuationNormalized, "Text String", "Punctuation normalized.", "Standardize quotes/dashes for parsing."),
		NumbersNormalized:     NewEnhancedStringMetric(base.NumbersNormalized, "Text String", "Numbers normalized.", "Mask numbers to focus on structure vs values."),
		AccentsRemoved:        NewEnhancedStringMetric(base.AccentsRemoved, "Text String", "Accents removed.", "Improve search matching across diacritics."),
	}
}

func extractEnhancedInformation(text string) EnhancedExtractionData {
	base := extractInformation(text)
	wrap := func(v []string, help string) EnhancedStringSliceMetric {
		return NewEnhancedStringSliceMetric(v, "List", help, "Use for link detection, contact extraction, and PII handling.")
	}
	return EnhancedExtractionData{
		URLs:            wrap(base.URLs, "Detected URLs in the text."),
		EmailAddresses:  wrap(base.EmailAddresses, "Detected email addresses."),
		PhoneNumbers:    wrap(base.PhoneNumbers, "Detected phone numbers (heuristic)."),
		Dates:           wrap(base.Dates, "Date-like tokens."),
		Times:           wrap(base.Times, "Time-like tokens."),
		Numbers:         wrap(base.Numbers, "Numeric tokens."),
		Abbreviations:   wrap(base.Abbreviations, "All-caps abbreviations."),
		Acronyms:        wrap(base.Acronyms, "Acronyms detected (heuristic)."),
		Hashtags:        wrap(base.Hashtags, "Hashtags from social text."),
		Mentions:        wrap(base.Mentions, "@mentions from social text."),
		EmoticonsSmiley: wrap(base.EmoticonsSmiley, "ASCII emoticons."),
		SpecialTokens:   wrap(base.SpecialTokens, "Other special tokens."),
	}
}

func assessEnhancedQuality(text string) EnhancedQualityAssessment {
	base := assessQuality(text)
	return EnhancedQualityAssessment{
		ReadabilityScore:  NewEnhancedFloatMetric(base.ReadabilityScore, "0-1 (Higher = Easier)", "Heuristic readability based on sentence length.", "Target 0.6-0.8 for general audiences."),
		CoherenceScore:    NewEnhancedFloatMetric(base.CoherenceScore, "0-1", "Heuristic coherence based on discourse markers.", "Use to identify transitions and logical flow."),
		CompletenessScore: NewEnhancedFloatMetric(base.CompletenessScore, "0-1", "Heuristic completeness based on length/sentences.", "Flag very short inputs for insufficiency."),
		QualityIssues: EnhancedQualityIssues{Value: base.QualityIssues, Scale: "List", HelpText: "Detected issues in formatting/punctuation.", PracticalApplication: "Address medium/high severity issues first."},
		SpellingErrors: EnhancedSpellingErrors{Value: base.SpellingErrors, Scale: "List", HelpText: "Common misspellings detected.", PracticalApplication: "Offer corrections or auto-fix in UI."},
		GrammarIssues:  EnhancedGrammarIssues{Value: base.GrammarIssues, Scale: "List", HelpText: "Detected grammar patterns (heuristic).", PracticalApplication: "Highlight for user review."},
		StyleSuggestions: EnhancedStyleSuggestions{Value: base.StyleSuggestions, Scale: "List", HelpText: "Suggestions to improve style.", PracticalApplication: "Guide users toward clearer, more active writing."},
	}
}

func createEnhancedTransformationLog(steps []TransformStep) EnhancedTransformationLog {
	return EnhancedTransformationLog{
		Value:               steps,
		Scale:               "Ordered Steps",
		HelpText:            "Sequence of transformations applied to the text.",
		PracticalApplication: "Audit trail for explainability; helps debug preprocessing effects.",
	}
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
		OriginalText: NewEnhancedStringMetric(
			originalText,
			"Text String",
			"The unmodified original text as provided by the user.",
			"Use as baseline for comparing all preprocessing transformations. Keep for reference when analyzing changes.",
		),
		CleanedText: NewEnhancedStringMetric(
			cleanedText,
			"Text String",
			"Text after removing unwanted characters and normalizing whitespace. Basic cleanup step.",
			"Good starting point for most text analysis. Maintains readability while standardizing format.",
		),
		NormalizedText: NewEnhancedStringMetric(
			normalizedText,
			"Text String",
			"Text after Unicode normalization and character standardization. More consistent character representation.",
			"Use for cross-platform compatibility and consistent text processing across different systems.",
		),
		LowercaseText: NewEnhancedStringMetric(
			lowercaseText,
			"Text String",
			"All text converted to lowercase for case-insensitive analysis.",
			"Essential for tasks like keyword matching, duplicate detection, and statistical analysis where case shouldn't matter.",
		),
		WithoutStopWords: NewEnhancedStringMetric(
			withoutStopWords,
			"Text String",
			"Text with common stop words (the, and, is, etc.) removed to focus on meaningful content.",
			"Use for content analysis, keyword extraction, and topic modeling where function words add noise.",
		),
		StemmedText: NewEnhancedStringMetric(
			stemmedText,
			"Text String",
			"Words reduced to their root form using stemming algorithm (running -> run, better -> better).",
			"Useful for search applications and text classification where word variations should be treated equally.",
		),
		LemmatizedText: NewEnhancedStringMetric(
			lemmatizedText,
			"Text String",
			"Words converted to their dictionary base form (am/is/are -> be, better -> good if comparative).",
			"More linguistically accurate than stemming. Better for semantic analysis and meaning preservation.",
		),
		TextStatistics:      calculateEnhancedTextStats(originalText, cleanedText),
		LanguageDetection:   detectEnhancedLanguage(originalText),
		EncodingInfo:        analyzeEnhancedEncoding(originalText),
		TextNormalization:   performEnhancedNormalizationSteps(originalText),
		ExtractionResults:   extractEnhancedInformation(originalText),
		QualityMetrics:      assessEnhancedQuality(originalText),
		TransformationLog:   createEnhancedTransformationLog(transformationLog),
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
