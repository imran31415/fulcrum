// Knowledge base for common text analysis metrics
// Provides educational context when backend doesn't include enhanced information

export const METRIC_KNOWLEDGE = {
  'flesch_kincaid_grade_level': {
    scale: '0-18+ (US Grade Level)',
    help_text: 'Indicates the U.S. school grade level required to understand the text. Based on average sentence length and syllables per word.',
    practical_application: 'Target 6-8 for general audience, 8-10 for high school, 12+ for academic content. Lower scores indicate easier readability.'
  },
  'flesch_reading_ease': {
    scale: '0-100 (Higher = Easier)',
    help_text: 'Measures text readability. 90-100: Very Easy, 80-89: Easy, 70-79: Fairly Easy, 60-69: Standard, 50-59: Fairly Difficult, 30-49: Difficult, 0-29: Very Difficult.',
    practical_application: 'Target 60-70 for general audience, 80+ for children, 30-50 for academic content. Optimize by shortening sentences and using simpler words.'
  },
  'automated_readability_index': {
    scale: '1-14+ (US Grade Level)',
    help_text: 'Character-based readability index that correlates with grade level. More stable than syllable-based measures for technical content.',
    practical_application: 'Use for precise grade-level targeting. Particularly useful for technical writing where syllable counting may be unreliable.'
  },
  'coleman_liau_index': {
    scale: '1-16+ (US Grade Level)',
    help_text: 'Readability index based on characters per word and sentences per 100 words. Less affected by technical terms than syllable-based metrics.',
    practical_application: 'Ideal for technical documentation where specialized vocabulary is necessary but sentence structure can be optimized.'
  },
  'gunning_fog_index': {
    scale: '6-17+ (Years of Education)',
    help_text: 'Estimates years of formal education needed to understand text on first reading. Focuses on complex words (3+ syllables).',
    practical_application: 'Target 8-12 for business writing, 6-8 for general public. Reduce by breaking long sentences and replacing complex words.'
  },
  'smog_index': {
    scale: '7-18+ (Years of Education)',
    help_text: 'Simple Measure of Gobbledygook - estimates years of education needed for 100% comprehension. Most accurate for longer texts (30+ sentences).',
    practical_application: 'Use for longer content. Healthcare materials often target SMOG 6-8. More conservative than other readability measures.'
  },
  'lexical_diversity': {
    scale: '0-1 (Higher = More Diverse)',
    help_text: 'Ratio of unique words to total words. Higher values indicate richer vocabulary and less repetition.',
    practical_application: '0.3-0.5 typical for general writing, 0.6+ indicates sophisticated vocabulary. Low scores may suggest repetitive writing.'
  },
  'sentence_complexity_average': {
    scale: '1-10+ (Higher = More Complex)',
    help_text: 'Average structural complexity per sentence based on clauses, conjunctions, and punctuation patterns.',
    practical_application: '1-2: Simple sentences, 3-4: Moderate complexity, 5+: Complex sentences. Balance complexity with readability goals.'
  },
  'total_words': {
    scale: '0-∞ (Count)',
    help_text: 'Total number of words in the text. Primary measure of text length and scope.',
    practical_application: 'Longer texts provide more context but require more reader attention. Optimize length for purpose and audience.'
  },
  'unique_words': {
    scale: '0-∞ (Count)',  
    help_text: 'Number of unique/distinct words. Indicates vocabulary richness and diversity.',
    practical_application: 'Higher unique word counts suggest richer vocabulary. Very low counts may indicate repetitive writing.'
  },
  'total_sentences': {
    scale: '0-∞ (Count)',
    help_text: 'Total number of sentences in the text. Basic structural measure for pacing and flow.',
    practical_application: 'More sentences with fewer words each typically improves readability. Consider breaking long paragraphs.'
  },
  'average_words_per_sentence': {
    scale: '5-50+ (Words per Sentence)',
    help_text: 'Average words per sentence. Shorter sentences generally improve readability and comprehension.',
    practical_application: 'Aim for 15-20 words for general audience, 10-15 for simple text, 20+ acceptable for academic writing.'
  },
  'total_syllables': {
    scale: '0-∞ (Count)',
    help_text: 'Total number of syllables across all words. Used in most readability calculations.',
    practical_application: 'Higher syllable counts generally indicate more complex words. Monitor in relation to word count for readability assessment.'
  },
  'average_syllables_per_word': {
    scale: '1.0-5.0+ (Syllables per Word)',
    help_text: 'Average syllables per word. English averages around 1.3-1.5 syllables per word.',
    practical_application: 'Lower values (1.0-1.5) suggest simpler vocabulary, higher values (2.0+) indicate complex vocabulary.'
  },
  'compression_ratio': {
    scale: '0-1 (Lower = More Removed)',
    help_text: 'Ratio of cleaned length to original length after text processing.',
    practical_application: 'Lower ratios indicate heavy cleaning; verify important content wasn\'t lost during preprocessing.'
  },
  'word_complexity_distribution': {
    scale: 'Count by Category',
    help_text: 'Distribution of words by syllable complexity: simple (1 syllable), moderate (2 syllables), complex (3+ syllables).',
    practical_application: 'Monitor complex word ratio. High complex word count may indicate need for simpler alternatives to improve readability.'
  },
  'simple': {
    scale: 'Count',
    help_text: 'Number of simple words (1 syllable). These are typically the easiest words to understand.',
    practical_application: 'Higher ratios of simple words generally improve readability for all audiences.'
  },
  'moderate': {
    scale: 'Count', 
    help_text: 'Number of moderate complexity words (2 syllables). Balanced vocabulary component.',
    practical_application: 'Moderate words provide good balance between simplicity and expressiveness.'
  },
  'complex': {
    scale: 'Count',
    help_text: 'Number of complex words (3+ syllables). These significantly impact readability scores.',
    practical_application: 'Consider if complex terms are necessary or if simpler alternatives could improve accessibility.'
  },
  'max_syllables_word': {
    scale: 'Word (String)',
    help_text: 'The word with the most syllables in your text. Identifies the most phonetically complex word.',
    practical_application: 'Review for potential simplification. Consider if specialized terms are necessary or if simpler alternatives exist.'
  },
  'longest_word': {
    scale: 'Word (String)', 
    help_text: 'The longest word in the text by character count. May represent the most complex vocabulary item.',
    practical_application: 'Review long words for potential simplification or ensure they\'re necessary for accuracy and clarity.'
  },
  'shortest_word': {
    scale: 'Word (String)',
    help_text: 'The shortest word in the text. Shows minimum word complexity.',
    practical_application: 'Very short words (1-2 chars) are typically function words or abbreviations. Ensure they\'re appropriate.'
  },
  'longest_sentence': {
    scale: 'Sentence (String)',
    help_text: 'The sentence with the most words. May indicate areas for potential simplification.',
    practical_application: 'Review for clarity and consider breaking into shorter sentences if it exceeds 25-30 words.'
  },
  'shortest_sentence': {
    scale: 'Sentence (String)',
    help_text: 'The sentence with the fewest words. Shows minimum sentence complexity.',
    practical_application: 'Very short sentences (1-3 words) can add emphasis but may seem choppy if overused.'
  },
  
  // Syntactic Structure Metrics
  'phrase_structures': {
    scale: 'Linguistic Analysis',
    help_text: 'Identifies different types of grammatical phrases (noun phrases, verb phrases, prepositional phrases, etc.) in your text.',
    practical_application: 'Understanding phrase patterns helps improve sentence variety and grammatical complexity. More diverse phrase types indicate sophisticated writing.'
  },
  'dependency_relations': {
    scale: 'Grammatical Relations',
    help_text: 'Maps grammatical relationships between words (subject-verb, modifier-head, etc.) showing sentence structure.',
    practical_application: 'Complex dependency patterns may indicate sophisticated writing but could affect readability. Monitor for balance.'
  },
  'clause_types': {
    scale: 'Clause Categories',
    help_text: 'Categorizes clauses by type: simple, compound, complex, compound-complex. Shows structural variety.',
    practical_application: 'Mix clause types for engaging writing. Simple clauses improve readability, complex clauses add sophistication.'
  },
  'sentence_types': {
    scale: 'Sentence Categories', 
    help_text: 'Classifies sentences by structure: declarative, interrogative, imperative, exclamatory.',
    practical_application: 'Varied sentence types create more engaging content. Declarative sentences inform, questions engage, imperatives direct.'
  },
  
  // Semantic Features Metrics
  'named_entities': {
    scale: 'Entity Recognition',
    help_text: 'Identifies proper nouns, organizations, locations, dates, and other specific entities in your text.',
    practical_application: 'High entity density may indicate factual, informative content. Ensure entities are accurate and relevant to your topic.'
  },
  'concept_clusters': {
    scale: 'Thematic Groups',
    help_text: 'Groups related concepts and themes found in your text, showing semantic coherence and topic distribution.',
    practical_application: 'Well-defined clusters indicate focused content. Multiple clusters suggest broad coverage or potential lack of focus.'
  },
  'topic_distribution': {
    scale: 'Topic Analysis',
    help_text: 'Shows the distribution of different topics or themes throughout your text.',
    practical_application: 'Balanced topic distribution indicates comprehensive coverage. Heavily skewed distribution may suggest focus areas or gaps.'
  },
  'semantic_coherence': {
    scale: '0-1 (Higher = More Coherent)',
    help_text: 'Measures how well ideas and concepts connect throughout your text.',
    practical_application: 'Higher coherence scores indicate better organized, more logical content flow. Low scores suggest need for better transitions.'
  },
  'sentiment_polarity': {
    scale: '-1 to +1 (Negative to Positive)',
    help_text: 'Overall emotional tone of your text, from very negative (-1) to very positive (+1).',
    practical_application: 'Monitor sentiment to ensure it matches your intended tone. Neutral (around 0) is often appropriate for informational content.'
  },
  'semantic_density': {
    scale: '0-1 (Higher = More Dense)',
    help_text: 'Ratio of meaningful content words to total words, indicating information density.',
    practical_application: 'Higher density suggests information-rich content. Very low density may indicate wordiness or filler content.'
  },
  
  // Performance Metrics
  'total_duration': {
    scale: '0-∞ ms',
    help_text: 'Total time taken for complete text analysis including all sub-operations.',
    practical_application: 'Monitor overall performance. Times >1000ms may indicate need for optimization or very long/complex text.'
  },
  'complexity_analysis_duration': {
    scale: '0-∞ ms', 
    help_text: 'Time taken to analyze text complexity, readability scores, and linguistic features.',
    practical_application: 'Complexity analysis is typically the most time-consuming. Times >500ms suggest very complex or long text.'
  },
  'tokenization_duration': {
    scale: '0-∞ ms',
    help_text: 'Time taken to tokenize text into words, sentences, and linguistic units.',
    practical_application: 'Tokenization should be fast (<100ms). Higher times may indicate very long texts or complex tokenization rules.'
  },
  'preprocessing_duration': {
    scale: '0-∞ ms',
    help_text: 'Time taken for text preprocessing including cleaning, normalization, and preparation.',
    practical_application: 'Preprocessing should be very fast (<50ms). Higher times may indicate complex text cleaning requirements.'
  },
  'json_marshaling': {
    scale: '0-∞ ms',
    help_text: 'Time taken to convert analysis results into JSON format for transmission.',
    practical_application: 'JSON marshaling should be very fast (<10ms). Higher times may indicate large result sets or complex data structures.'
  },
  'request_id': {
    scale: 'Identifier',
    help_text: 'Unique identifier for this analysis request, useful for debugging and performance tracking.',
    practical_application: 'Use for correlating performance data across different analysis runs and identifying performance patterns.'
  },
  'performance_metrics': {
    scale: 'Timing Data',
    help_text: 'Comprehensive timing information for all analysis operations, helping identify performance bottlenecks.',
    practical_application: 'Review timing data to optimize text analysis performance and understand processing characteristics of different text types.'
  }
};

// Function to get enhanced information for a metric
export const getMetricInfo = (metricKey, metricValue) => {
  // Try exact match first
  let knowledge = METRIC_KNOWLEDGE[metricKey.toLowerCase()];
  
  // If no exact match, try some common variations
  if (!knowledge) {
    const normalized = metricKey.toLowerCase().replace(/[\s-]/g, '_');
    knowledge = METRIC_KNOWLEDGE[normalized];
  }
  
  // Try without common suffixes/prefixes
  if (!knowledge) {
    const simplified = metricKey.toLowerCase()
      .replace(/^(total_|average_|max_|min_)/, '')
      .replace(/_(count|stats|statistics|metrics?)$/, '')
      .replace(/[\s-]/g, '_');
    knowledge = METRIC_KNOWLEDGE[simplified];
  }
  
  if (knowledge) {
    return {
      value: metricValue,
      scale: knowledge.scale,
      help_text: knowledge.help_text,
      practical_application: knowledge.practical_application
    };
  }
  
  // Enhanced fallback based on metric type and common patterns
  const enhancedFallback = createEnhancedFallback(metricKey, metricValue);
  return enhancedFallback;
};

// Create enhanced fallback information based on patterns
function createEnhancedFallback(metricKey, metricValue) {
  const keyLower = metricKey.toLowerCase();
  const valueType = typeof metricValue;
  const isArray = Array.isArray(metricValue);
  const isObject = valueType === 'object' && !isArray && metricValue !== null;
  
  // Readability-related metrics
  if (keyLower.includes('reading') || keyLower.includes('readability')) {
    return {
      value: metricValue,
      scale: valueType === 'number' ? '0-100+ (Score)' : 'Score',
      help_text: 'This readability metric helps assess how easy your text is to understand.',
      practical_application: 'Use to optimize content difficulty for your target audience. Lower scores typically indicate easier reading.'
    };
  }
  
  // Count-related metrics
  if (keyLower.includes('count') || keyLower.includes('total') || keyLower.includes('number')) {
    return {
      value: metricValue,
      scale: '0-∞ (Count)',
      help_text: `Count of ${keyLower.replace(/_/g, ' ').replace(/count|total|number/g, '').trim() || 'items'} in your text.`,
      practical_application: 'Monitor counts to understand text composition and identify potential areas for optimization.'
    };
  }
  
  // Average-related metrics  
  if (keyLower.includes('average') || keyLower.includes('mean')) {
    return {
      value: metricValue,
      scale: 'Average Value',
      help_text: `Average ${keyLower.replace(/average_|mean_/g, '').replace(/_/g, ' ')} across your text.`,
      practical_application: 'Averages help identify overall patterns. Compare with recommended ranges for your content type.'
    };
  }
  
  // Ratio or percentage metrics
  if (keyLower.includes('ratio') || keyLower.includes('percentage') || (valueType === 'number' && metricValue >= 0 && metricValue <= 1)) {
    return {
      value: metricValue,
      scale: '0-1 (Ratio)',
      help_text: `Proportional measure of ${keyLower.replace(/ratio|percentage/g, '').replace(/_/g, ' ').trim()} in your text.`,
      practical_application: 'Ratios help understand text composition. Values closer to 0.5 indicate balanced distribution.'
    };
  }
  
  // Index or score metrics
  if (keyLower.includes('index') || keyLower.includes('score')) {
    return {
      value: metricValue,
      scale: valueType === 'number' ? 'Numeric Score' : 'Score',
      help_text: `${keyLower.replace(/_/g, ' ')} measurement for analyzing text characteristics.`,
      practical_application: 'Use this score to benchmark your content against standards for similar text types.'
    };
  }
  
  // Length-related metrics
  if (keyLower.includes('length') || keyLower.includes('size')) {
    return {
      value: metricValue,
      scale: 'Length Units',
      help_text: `Measurement of ${keyLower.replace(/length|size/g, '').replace(/_/g, ' ').trim()} length in your text.`,
      practical_application: 'Length measurements help assess text scope and reading time requirements.'
    };
  }
  
  // List/array metrics
  if (isArray) {
    return {
      value: metricValue,
      scale: 'List of Items',
      help_text: `Collection of ${keyLower.replace(/_/g, ' ')} found in your text.`,
      practical_application: 'Review items in this list to understand patterns and identify optimization opportunities.'
    };
  }
  
  // Object/map metrics
  if (isObject) {
    return {
      value: metricValue,
      scale: 'Categorized Data',
      help_text: `Detailed breakdown of ${keyLower.replace(/_/g, ' ')} organized by category.`,
      practical_application: 'Examine each category to understand distribution and identify areas for improvement.'
    };
  }
  
  // Final fallback
  return {
    value: metricValue,
    scale: valueType === 'number' ? 'Numeric Value' : 'Value',
    help_text: `This metric provides insights about ${keyLower.replace(/_/g, ' ')} in your text.`,
    practical_application: 'Use this measurement to understand patterns in your text and optimize for your target audience.'
  };
}
