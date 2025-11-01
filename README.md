# Fulcrum Text Analysis Service
**🎯 [Live Demo](https://fulcrum.scalebase.io)**


## 🚀 Architecture Overview

Fulcrum is a **truly backendless** text analysis service built with a modern, innovative architecture:

- **🦀 Go Backend**: High-performance text analysis engine written in Go
- **🌐 WebAssembly (WASM)**: Go compiled to WASM for browser execution
- **📱 React Native**: Cross-platform mobile interface
- **☁️ Serverless**: Runs entirely in the browser/mobile app - no servers needed!

This unique architecture enables **zero-infrastructure deployment** while maintaining the performance of native Go code. Perfect for privacy-sensitive text analysis where data never leaves the client.



---

## 📸 Screenshots

<details>
<summary>Click to view app screenshots</summary>

### 🎯 Text Input with Example Prompts
<img width="1048" height="516" alt="Text input interface with example prompts" src="https://github.com/user-attachments/assets/8b454e84-0943-4dcd-ad0d-c4f2561947f9" />

---

### 📊 Comprehensive Analysis Output
<img width="332" height="468" alt="Analysis output with detailed metrics" src="https://github.com/user-attachments/assets/bb17215a-045f-41de-9f63-e4ea45d995c7" />

---

### 🔍 Detailed Insights
<img width="343" height="679" alt="Detailed text analysis insights" src="https://github.com/user-attachments/assets/a669da95-152f-481b-8fcf-92f683db8c52" />

---

### 📈 Additional Metrics
<img width="245" height="478" alt="Additional analysis metrics" src="https://github.com/user-attachments/assets/edc62384-5a6e-4a1d-b7c4-17c268feba41" />

---

### 🔧 Raw JSON Output
<img width="269" height="83" alt="Raw JSON analysis output" src="https://github.com/user-attachments/assets/d59c97cc-70a1-49a7-9707-5d61381445b7" />

</details>



## 🌟 Key Features

### 🔒 Privacy-First Architecture
- **Client-Side Processing**: All analysis happens in your browser/device
- **Zero Data Transmission**: Your text never leaves your machine
- **No Server Dependencies**: Works offline after initial load

### 📈 Comprehensive Text Analysis
- **Text Complexity Analysis**: Multiple readability metrics including Flesch-Kincaid, Gunning Fog Index, SMOG, and more
- **Advanced Tokenization**: Comprehensive token extraction with n-gram generation and part-of-speech analysis
- **Text Preprocessing**: Full text cleaning, normalization, stemming, and lemmatization
- **Language Detection**: Automatic language identification with confidence scores
- **Quality Assessment**: Spelling, grammar, and style analysis
- **Named Entity Recognition**: Extraction of entities, URLs, emails, and other structured data

### ⚡ Performance Benefits
- **Native Go Speed**: WASM compilation retains Go's performance characteristics
- **Cross-Platform**: Runs on web browsers, React Native apps, and Node.js
- **Lightweight**: No server infrastructure or API calls required

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

## 🎯 Web Worker Architecture for Non-Blocking UI

### The Challenge
WebAssembly (WASM) executes synchronously on the main JavaScript thread, which can block the UI during intensive computations. For text analysis of large documents, this causes:
- Frozen UI during processing
- Unresponsive buttons and inputs  
- Stopped animations and progress indicators
- Poor user experience

### The Solution: Web Workers
Fulcrum implements a sophisticated Web Worker architecture that moves WASM processing to a background thread, keeping the UI completely responsive.

#### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Main Thread (UI)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   React     │  │   Loading    │  │    Results      │   │
│  │   App       │  │  Animation   │  │    Display      │   │
│  └──────┬──────┘  └──────────────┘  └─────────────────┘   │
│         │                                                    │
│         │ postMessage({operation, text})                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            WasmWorkerManager (Orchestrator)           │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ Message Passing
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Web Worker Thread                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Go WASM Runtime                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Analyzer   │  │  Tokenizer  │  │   Grader    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. **Worker Creation** (`worker.inline.js`)
```javascript
// Creates worker from Blob URL to avoid CORS issues
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));
```

#### 2. **Message-Based Communication**
- **Main → Worker**: Send analysis requests
- **Worker → Main**: Return results or errors
- **Timeout Protection**: 30-second timeout for long operations
- **Request Tracking**: Unique IDs for concurrent requests

#### 3. **WASM Initialization in Worker**
```javascript
// Worker loads Go runtime and WASM module
const go = new Go();
const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
go.run(instance);
```

#### 4. **Automatic Platform Detection**
```javascript
if (Platform.OS === 'web' && typeof Worker !== 'undefined') {
  // Use Web Worker version
  const wasmWorker = require('./src/wasm/index.webworker');
} else {
  // Fallback to main thread for React Native
  const wasmModule = require('./src/wasm');
}
```

### Performance Benefits

| Metric | Without Worker | With Worker | Improvement |
|--------|---------------|-------------|-------------|
| UI Responsiveness | Blocked | Smooth | ✅ 100% |
| Animation FPS | 0-5 fps | 60 fps | ✅ 12x |
| User Input | Frozen | Responsive | ✅ Instant |
| Progress Updates | None | Real-time | ✅ Continuous |

### Key Features

✅ **Zero UI Blocking**: All heavy computation runs in background thread
✅ **Smooth Animations**: Loading indicators continue during processing
✅ **Responsive Input**: Users can interact with UI while analyzing
✅ **Error Recovery**: Automatic cleanup and retry on failures
✅ **Memory Management**: Worker terminates after use to free resources
✅ **Cross-Platform**: Automatically falls back on unsupported platforms

### Files Structure
```
src/wasm/
├── index.webworker.js     # Web Worker manager with lifecycle control
├── worker.inline.js       # Worker creation from Blob URL
├── wasmExecEmbedded.js   # Embedded Go runtime for worker
├── index.web.js          # Fallback for non-worker environments
└── index.native.js       # React Native implementation
```

## 🚀 Development

### 🏧 Architecture Components

#### Go Backend Engine
```
fulcrum/
├── main.go                          # HTTP server and WASM entry points
├── internal/analyzer/
│   ├── complexity.go               # Text complexity analysis
│   ├── tokenizer.go               # Tokenization and linguistic analysis
│   └── preprocessor.go            # Text preprocessing and cleaning
└── wasm/
    ├── main.go                      # WASM-specific bindings
    └── wasm_exec.js                 # Go WASM runtime
```

#### Building for Different Platforms

**Traditional HTTP Server:**
```bash
go build -o fulcrum
./fulcrum
```

**WebAssembly Build:**
```bash
GOOS=js GOOS=wasm go build -o fulcrum.wasm main.go
```

**React Native Integration:**
```javascript
// Load WASM module in React Native
import { loadWASM } from './wasm-loader';
const analyzer = await loadWASM('fulcrum.wasm');
```

### 📦 Dependencies
This service uses only Go standard library packages, making it:
- **Lightweight**: Minimal dependencies
- **Portable**: Easy WASM compilation
- **Secure**: No external dependencies to audit

## License

MIT License
