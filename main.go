package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"fulcrum/internal/analyzer"
)

type AnalyzeRequest struct {
	Text string `json:"text"`
}

type AnalyzeResponse struct {
	ComplexityMetrics analyzer.ComplexityMetrics `json:"complexity_metrics"`
	Tokens           analyzer.TokenData         `json:"tokens"`
	Preprocessing    analyzer.PreprocessingData `json:"preprocessing"`
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received %s request to %s", r.Method, r.URL.String())

	if r.Method == http.MethodGet {
		// Redirect GET requests back to the main page
		log.Printf("GET request to /analyze, redirecting to /")
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	if r.Method != http.MethodPost {
		log.Printf("Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse JSON or form data
	var text string
	contentType := r.Header.Get("Content-Type")
	log.Printf("Request content type: %s", contentType)

	if strings.Contains(contentType, "application/json") {
		var req AnalyzeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Error parsing JSON: %v", err)
			http.Error(w, "Invalid JSON data", http.StatusBadRequest)
			return
		}
		text = req.Text
		log.Printf("JSON text parameter: '%s'", text)
	} else {
		// Parse form data
		if err := r.ParseForm(); err != nil {
			log.Printf("Error parsing form: %v", err)
			http.Error(w, "Invalid form data", http.StatusBadRequest)
			return
		}
		text = r.FormValue("text")
		log.Printf("Form text parameter: '%s'", text)
		log.Printf("All form values: %v", r.Form)
	}

	if text == "" {
		// Return error signals using SSE format
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "event: datastar-patch-signals\ndata: signals {error: \"Please enter some text to analyze\", isAnalyzing: false}\n\n")
		return
	}

	// Perform analysis
	analysisResult := AnalyzeResponse{
		ComplexityMetrics: analyzer.AnalyzeComplexity(text),
		Tokens:           analyzer.TokenizeText(text),
		Preprocessing:    analyzer.PreprocessText(text),
	}

	// Return DataStar signals in the response using Server-Sent Events format
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	// Create signals response as SSE
	analysisJSON, err := json.Marshal(analysisResult)
	if err != nil {
		log.Printf("Error marshaling analysis result: %v", err)
		fmt.Fprintf(w, "event: datastar-patch-signals\ndata: signals {error: \"Failed to process analysis\", isAnalyzing: false}\n\n")
		return
	}

	signalsData := fmt.Sprintf(`{analysisResults: %s, isAnalyzing: false, error: null}`, string(analysisJSON))
	fmt.Fprintf(w, "event: datastar-patch-signals\ndata: signals %s\n\n", signalsData)

	log.Printf("Successfully sent SSE response with signals")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
if err := json.NewEncoder(w).Encode(map[string]string{"status": "healthy"}); err != nil {
		log.Printf("Error encoding health status: %v", err)
	}
}

func frontendHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func main() {
	http.HandleFunc("/", corsMiddleware(frontendHandler))
	http.HandleFunc("/analyze", corsMiddleware(analyzeHandler))
	http.HandleFunc("/health", corsMiddleware(healthHandler))

	port := ":8080"
	fmt.Printf("Fulcrum text analysis service starting on port %s\n", port)
	fmt.Printf("Open http://localhost%s to use the web interface\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}