# Fulcrum Text Analysis Service

A comprehensive Go service for deep text analysis that provides extensive preprocessing, tokenization, and complexity analysis capabilities.

## Features

- **Text Complexity Analysis**: Multiple readability metrics including Flesch-Kincaid, Gunning Fog Index, SMOG, and more
- **Advanced Tokenization**: Comprehensive token extraction with n-gram generation and part-of-speech analysis
- **Text Preprocessing**: Full text cleaning, normalization, stemming, and lemmatization
- **Language Detection**: Automatic language identification with confidence scores
- **Quality Assessment**: Spelling, grammar, and style analysis
- **Named Entity Recognition**: Extraction of entities, URLs, emails, and other structured data

## Quick Start

### Build and Run

```bash
go build -o fulcrum
./fulcrum
```

The service will start on port 8080.

### Usage

Send a POST request to `/analyze` with JSON payload:

```bash
curl -X POST http://localhost:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text to analyze goes here."}'
```

### Health Check

```bash
curl http://localhost:8080/health
```

## API Endpoints

### POST /analyze

Analyzes the provided text and returns comprehensive metrics.

**Request Body:**
```json
{
  "text": "The text you want to analyze"
}
```

**Response:**
```json
{
  "complexity_metrics": {
    "flesch_kincaid_grade_level": 8.2,
    "flesch_reading_ease": 72.1,
    "automated_readability_index": 7.9,
    "lexical_diversity": 0.85,
    "sentence_stats": {...},
    "word_stats": {...}
  },
  "tokens": {
    "tokens": [...],
    "token_counts": {...},
    "ngrams": {...},
    "part_of_speech": {...}
  },
  "preprocessing": {
    "original_text": "...",
    "cleaned_text": "...",
    "normalized_text": "...",
    "text_statistics": {...},
    "quality_metrics": {...}
  }
}
```

### GET /health

Returns service health status.

## Analysis Features

### Complexity Metrics
- Flesch-Kincaid Grade Level
- Flesch Reading Ease Score
- Automated Readability Index (ARI)
- Coleman-Liau Index
- Gunning Fog Index
- SMOG Index
- Lexical Diversity
- Sentence and word complexity distributions

### Tokenization
- Multi-type token extraction (words, punctuation, numbers, URLs, emails, etc.)
- N-gram generation (1-4 grams)
- Basic part-of-speech analysis
- Named entity recognition
- Sentiment analysis
- Character-level analysis

### Preprocessing
- Text cleaning and normalization
- Stop word removal
- Stemming and lemmatization
- Language detection
- Encoding analysis
- Quality assessment with spelling and grammar checks
- Information extraction (URLs, emails, dates, etc.)

## Development

### Project Structure
```
fulcrum/
├── main.go                          # HTTP server and API endpoints
├── internal/analyzer/
│   ├── complexity.go               # Text complexity analysis
│   ├── tokenizer.go               # Tokenization and linguistic analysis
│   └── preprocessor.go            # Text preprocessing and cleaning
└── README.md
```

### Dependencies
This service uses only Go standard library packages, making it lightweight and easy to deploy.

## License

MIT License