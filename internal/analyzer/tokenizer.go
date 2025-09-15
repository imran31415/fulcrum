package analyzer

import (
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

type TokenData struct {
	Tokens              []Token           `json:"tokens"`
	TokenCounts         TokenCounts       `json:"token_counts"`
	NGrams              NGramData         `json:"ngrams"`
	PartOfSpeech        POSAnalysis       `json:"part_of_speech"`
	SyntacticStructure  SyntaxAnalysis    `json:"syntactic_structure"`
	SemanticFeatures    SemanticAnalysis  `json:"semantic_features"`
	CharacterAnalysis   CharAnalysis      `json:"character_analysis"`
}

type Token struct {
	Text       string    `json:"text"`
	Type       TokenType `json:"type"`
	Position   int       `json:"position"`
	Length     int       `json:"length"`
	Syllables  int       `json:"syllables"`
	Frequency  int       `json:"frequency"`
	IsStopWord bool      `json:"is_stop_word"`
	Lemma      string    `json:"lemma"`
}

type TokenType string

const (
	Word         TokenType = "word"
	Punctuation  TokenType = "punctuation"
	Number       TokenType = "number"
	Whitespace   TokenType = "whitespace"
	Symbol       TokenType = "symbol"
	Contraction  TokenType = "contraction"
	Abbreviation TokenType = "abbreviation"
	URL          TokenType = "url"
	Email        TokenType = "email"
	Hashtag      TokenType = "hashtag"
	Mention      TokenType = "mention"
)

type TokenCounts struct {
	Total          int            `json:"total"`
	UniqueTokens   int            `json:"unique_tokens"`
	Words          int            `json:"words"`
	Punctuation    int            `json:"punctuation"`
	Numbers        int            `json:"numbers"`
	Symbols        int            `json:"symbols"`
	TypeFrequency  map[string]int `json:"type_frequency"`
	LengthDist     map[int]int    `json:"length_distribution"`
	FrequencyDist  map[string]int `json:"frequency_distribution"`
}

type NGramData struct {
	Unigrams  map[string]int `json:"unigrams"`
	Bigrams   map[string]int `json:"bigrams"`
	Trigrams  map[string]int `json:"trigrams"`
	Fourgrams map[string]int `json:"fourgrams"`
}

type POSAnalysis struct {
	Nouns       []string `json:"nouns"`
	Verbs       []string `json:"verbs"`
	Adjectives  []string `json:"adjectives"`
	Adverbs     []string `json:"adverbs"`
	Pronouns    []string `json:"pronouns"`
	Prepositions []string `json:"prepositions"`
	Conjunctions []string `json:"conjunctions"`
	Determiners  []string `json:"determiners"`
	Distribution map[string]int `json:"distribution"`
}

type SyntaxAnalysis struct {
	PhraseStructures []string `json:"phrase_structures"`
	DependencyRels   []string `json:"dependency_relations"`
	ClauseTypes      []string `json:"clause_types"`
	SentenceTypes    []string `json:"sentence_types"`
}

type SemanticAnalysis struct {
	NamedEntities    []NamedEntity `json:"named_entities"`
	ConceptClusters  []string      `json:"concept_clusters"`
	TopicDistribution map[string]float64 `json:"topic_distribution"`
	SentimentScores  SentimentScore `json:"sentiment_scores"`
}

type NamedEntity struct {
	Text  string `json:"text"`
	Type  string `json:"type"`
	Start int    `json:"start"`
	End   int    `json:"end"`
}

type SentimentScore struct {
	Positive float64 `json:"positive"`
	Negative float64 `json:"negative"`
	Neutral  float64 `json:"neutral"`
	Overall  float64 `json:"overall"`
}

type CharAnalysis struct {
	TotalChars    int            `json:"total_characters"`
	Letters       int            `json:"letters"`
	Digits        int            `json:"digits"`
	Whitespace    int            `json:"whitespace"`
	Punctuation   int            `json:"punctuation"`
	Special       int            `json:"special_characters"`
	Unicode       int            `json:"unicode_characters"`
	CharFreq      map[string]int `json:"character_frequency"`
	Encoding      string         `json:"encoding"`
	Languages     []string       `json:"detected_languages"`
}

var stopWords = map[string]bool{
	"a": true, "an": true, "and": true, "are": true, "as": true, "at": true,
	"be": true, "by": true, "for": true, "from": true, "has": true, "he": true,
	"in": true, "is": true, "it": true, "its": true, "of": true, "on": true,
	"that": true, "the": true, "to": true, "was": true, "will": true, "with": true,
	"but": true, "or": true, "so": true, "if": true, "when": true, "where": true,
	"why": true, "how": true, "what": true, "who": true, "which": true, "this": true,
	"these": true, "those": true, "they": true, "them": true, "their": true,
	"we": true, "us": true, "our": true, "you": true, "your": true, "i": true,
	"me": true, "my": true, "can": true, "could": true, "should": true, "would": true,
	"do": true, "does": true, "did": true, "have": true, "had": true, "been": true,
	"being": true, "am": true, "were": true, "said": true, "say": true, "says": true,
}

var commonNouns = map[string]bool{
	"time": true, "person": true, "year": true, "way": true, "day": true, "thing": true,
	"man": true, "world": true, "life": true, "hand": true, "part": true, "child": true,
	"eye": true, "woman": true, "place": true, "work": true, "week": true, "case": true,
	"point": true, "government": true, "company": true, "number": true, "group": true,
	"problem": true, "fact": true, "money": true, "story": true, "result": true,
}

var commonVerbs = map[string]bool{
	"be": true, "have": true, "do": true, "say": true, "go": true, "can": true,
	"get": true, "would": true, "make": true, "know": true, "will": true, "think": true,
	"take": true, "come": true, "could": true, "want": true, "look": true, "use": true,
	"find": true, "give": true, "tell": true, "work": true, "may": true, "should": true,
	"call": true, "try": true, "ask": true, "need": true, "feel": true, "become": true,
}

var commonAdjectives = map[string]bool{
	"new": true, "first": true, "last": true, "long": true, "great": true, "little": true,
	"own": true, "other": true, "old": true, "right": true, "big": true, "high": true,
	"different": true, "small": true, "large": true, "next": true, "early": true,
	"young": true, "important": true, "few": true, "public": true, "bad": true, "same": true,
	"able": true, "good": true, "white": true, "black": true, "real": true, "best": true,
}

func TokenizeText(text string) TokenData {
	tokens := extractTokens(text)

	tokenData := TokenData{
		Tokens:             tokens,
		TokenCounts:        calculateTokenCounts(tokens),
		NGrams:            generateNGrams(tokens),
		PartOfSpeech:      analyzePOS(tokens),
		SyntacticStructure: analyzeSyntax(text),
		SemanticFeatures:   analyzeSemantics(text, tokens),
		CharacterAnalysis:  analyzeCharacters(text),
	}

	return tokenData
}

func extractTokens(text string) []Token {
	var tokens []Token
	position := 0

	patterns := map[TokenType]*regexp.Regexp{
		URL:          regexp.MustCompile(`https?://[^\s]+`),
		Email:        regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),
		Hashtag:      regexp.MustCompile(`#\w+`),
		Mention:      regexp.MustCompile(`@\w+`),
		Number:       regexp.MustCompile(`\d+\.?\d*`),
		Contraction:  regexp.MustCompile(`\w+'\w+`),
		Abbreviation: regexp.MustCompile(`[A-Z]{2,}\.|[A-Z]\.[A-Z]\.`),
		Word:         regexp.MustCompile(`\b[a-zA-Z]+\b`),
		Punctuation:  regexp.MustCompile(`[.!?;:,'"()\[\]{}-]`),
		Symbol:       regexp.MustCompile(`[^a-zA-Z0-9\s.!?;:,'"()\[\]{}-]`),
		Whitespace:   regexp.MustCompile(`\s+`),
	}

	frequencyMap := make(map[string]int)

	for position < len(text) {
		matched := false

		for tokenType, pattern := range patterns {
			if match := pattern.FindString(text[position:]); match != "" {
				if pattern.FindStringIndex(text[position:])[0] == 0 {
					token := Token{
						Text:       match,
						Type:       tokenType,
						Position:   position,
						Length:     len(match),
						Syllables:  countSyllables(match),
						IsStopWord: isStopWord(match),
						Lemma:      getLemma(match),
					}

					frequencyMap[strings.ToLower(match)]++
					tokens = append(tokens, token)
					position += len(match)
					matched = true
					break
				}
			}
		}

		if !matched {
			position++
		}
	}

	for i := range tokens {
		tokens[i].Frequency = frequencyMap[strings.ToLower(tokens[i].Text)]
	}

	return tokens
}

func calculateTokenCounts(tokens []Token) TokenCounts {
	counts := TokenCounts{
		Total:         len(tokens),
		TypeFrequency: make(map[string]int),
		LengthDist:    make(map[int]int),
		FrequencyDist: make(map[string]int),
	}

	uniqueTokens := make(map[string]bool)

	for _, token := range tokens {
		uniqueTokens[strings.ToLower(token.Text)] = true
		counts.TypeFrequency[string(token.Type)]++
		counts.LengthDist[token.Length]++
		counts.FrequencyDist[strings.ToLower(token.Text)]++

		switch token.Type {
		case Word:
			counts.Words++
		case Punctuation:
			counts.Punctuation++
		case Number:
			counts.Numbers++
		case Symbol:
			counts.Symbols++
		}
	}

	counts.UniqueTokens = len(uniqueTokens)
	return counts
}

func generateNGrams(tokens []Token) NGramData {
	var wordTokens []string
	for _, token := range tokens {
		if token.Type == Word {
			wordTokens = append(wordTokens, strings.ToLower(token.Text))
		}
	}

	return NGramData{
		Unigrams:  generateUniGrams(wordTokens),
		Bigrams:   generateBiGrams(wordTokens),
		Trigrams:  generateTriGrams(wordTokens),
		Fourgrams: generateFourGrams(wordTokens),
	}
}

func generateUniGrams(words []string) map[string]int {
	unigrams := make(map[string]int)
	for _, word := range words {
		unigrams[word]++
	}
	return unigrams
}

func generateBiGrams(words []string) map[string]int {
	bigrams := make(map[string]int)
	for i := 0; i < len(words)-1; i++ {
		bigram := words[i] + " " + words[i+1]
		bigrams[bigram]++
	}
	return bigrams
}

func generateTriGrams(words []string) map[string]int {
	trigrams := make(map[string]int)
	for i := 0; i < len(words)-2; i++ {
		trigram := words[i] + " " + words[i+1] + " " + words[i+2]
		trigrams[trigram]++
	}
	return trigrams
}

func generateFourGrams(words []string) map[string]int {
	fourgrams := make(map[string]int)
	for i := 0; i < len(words)-3; i++ {
		fourgram := words[i] + " " + words[i+1] + " " + words[i+2] + " " + words[i+3]
		fourgrams[fourgram]++
	}
	return fourgrams
}

func analyzePOS(tokens []Token) POSAnalysis {
	analysis := POSAnalysis{
		Distribution: make(map[string]int),
	}

	for _, token := range tokens {
		if token.Type == Word {
			word := strings.ToLower(token.Text)

			if commonNouns[word] {
				analysis.Nouns = append(analysis.Nouns, word)
				analysis.Distribution["noun"]++
			} else if commonVerbs[word] {
				analysis.Verbs = append(analysis.Verbs, word)
				analysis.Distribution["verb"]++
			} else if commonAdjectives[word] {
				analysis.Adjectives = append(analysis.Adjectives, word)
				analysis.Distribution["adjective"]++
			} else if strings.HasSuffix(word, "ly") {
				analysis.Adverbs = append(analysis.Adverbs, word)
				analysis.Distribution["adverb"]++
			} else {
				analysis.Distribution["unknown"]++
			}
		}
	}

	return analysis
}

func analyzeSyntax(text string) SyntaxAnalysis {
	analysis := SyntaxAnalysis{}

	sentences := extractSentences(text)
	for _, sentence := range sentences {
		if strings.HasSuffix(sentence, "?") {
			analysis.SentenceTypes = append(analysis.SentenceTypes, "interrogative")
		} else if strings.HasSuffix(sentence, "!") {
			analysis.SentenceTypes = append(analysis.SentenceTypes, "exclamatory")
		} else {
			analysis.SentenceTypes = append(analysis.SentenceTypes, "declarative")
		}

		if strings.Contains(sentence, ",") && strings.Contains(sentence, "and") {
			analysis.ClauseTypes = append(analysis.ClauseTypes, "compound")
		} else if strings.Contains(sentence, "because") || strings.Contains(sentence, "although") {
			analysis.ClauseTypes = append(analysis.ClauseTypes, "complex")
		} else {
			analysis.ClauseTypes = append(analysis.ClauseTypes, "simple")
		}
	}

	return analysis
}

func analyzeSemantics(text string, tokens []Token) SemanticAnalysis {
	analysis := SemanticAnalysis{
		TopicDistribution: make(map[string]float64),
	}

	entities := extractNamedEntities(text)
	analysis.NamedEntities = entities

	analysis.SentimentScores = calculateSentiment(tokens)

	topics := []string{"technology", "business", "science", "politics", "sports", "entertainment"}
	for _, topic := range topics {
		analysis.TopicDistribution[topic] = 0.1
	}

	return analysis
}

func extractNamedEntities(text string) []NamedEntity {
	var entities []NamedEntity

	capitalizedWords := regexp.MustCompile(`\b[A-Z][a-z]+\b`)
	matches := capitalizedWords.FindAllStringIndex(text, -1)

	for _, match := range matches {
		entity := NamedEntity{
			Text:  text[match[0]:match[1]],
			Type:  "PERSON",
			Start: match[0],
			End:   match[1],
		}
		entities = append(entities, entity)
	}

	return entities
}

func calculateSentiment(tokens []Token) SentimentScore {
	positiveWords := map[string]bool{
		"good": true, "great": true, "excellent": true, "amazing": true, "wonderful": true,
		"fantastic": true, "awesome": true, "brilliant": true, "outstanding": true, "perfect": true,
	}

	negativeWords := map[string]bool{
		"bad": true, "terrible": true, "awful": true, "horrible": true, "disgusting": true,
		"hate": true, "dislike": true, "worst": true, "disappointing": true, "annoying": true,
	}

	positive := 0
	negative := 0
	total := 0

	for _, token := range tokens {
		if token.Type == Word {
			word := strings.ToLower(token.Text)
			total++

			if positiveWords[word] {
				positive++
			} else if negativeWords[word] {
				negative++
			}
		}
	}

	neutral := total - positive - negative

	if total == 0 {
		return SentimentScore{}
	}

	return SentimentScore{
		Positive: float64(positive) / float64(total),
		Negative: float64(negative) / float64(total),
		Neutral:  float64(neutral) / float64(total),
		Overall:  (float64(positive) - float64(negative)) / float64(total),
	}
}

func analyzeCharacters(text string) CharAnalysis {
	analysis := CharAnalysis{
		TotalChars: len(text),
		CharFreq:   make(map[string]int),
		Encoding:   "UTF-8",
		Languages:  []string{"en"},
	}

	for _, char := range text {
		charStr := string(char)
		analysis.CharFreq[charStr]++

		if unicode.IsLetter(char) {
			analysis.Letters++
		} else if unicode.IsDigit(char) {
			analysis.Digits++
		} else if unicode.IsSpace(char) {
			analysis.Whitespace++
		} else if unicode.IsPunct(char) {
			analysis.Punctuation++
		} else if char > 127 {
			analysis.Unicode++
		} else {
			analysis.Special++
		}
	}

	if !utf8.ValidString(text) {
		analysis.Encoding = "Unknown"
	}

	return analysis
}

func isStopWord(word string) bool {
	return stopWords[strings.ToLower(word)]
}

func getLemma(word string) string {
	word = strings.ToLower(word)

	if strings.HasSuffix(word, "ing") && len(word) > 3 {
		return word[:len(word)-3]
	}
	if strings.HasSuffix(word, "ed") && len(word) > 2 {
		return word[:len(word)-2]
	}
	if strings.HasSuffix(word, "s") && len(word) > 1 {
		return word[:len(word)-1]
	}

	return word
}