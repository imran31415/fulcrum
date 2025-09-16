package analyzer

import (
	"time"
)

// PerformanceMetrics tracks timing information for analysis operations
type PerformanceMetrics struct {
	TotalDuration        EnhancedDurationMetric            `json:"total_duration"`
	ComplexityDuration   EnhancedDurationMetric            `json:"complexity_analysis_duration"`
	TokenizationDuration EnhancedDurationMetric            `json:"tokenization_duration"`
	PreprocessingDuration EnhancedDurationMetric           `json:"preprocessing_duration"`
	SubOperations        map[string]EnhancedDurationMetric `json:"sub_operations,omitempty"`
	StartTime            time.Time                         `json:"-"` // Don't marshal to JSON
	RequestID            string                            `json:"request_id,omitempty"`
}

// EnhancedDurationMetric for duration-based metrics with millisecond precision
type EnhancedDurationMetric struct {
	Value               float64 `json:"value"`               // Duration in milliseconds
	Scale               string  `json:"scale"`               
	HelpText            string  `json:"help_text"`           
	PracticalApplication string  `json:"practical_application"`
	StartTime           string  `json:"start_time,omitempty"`
	EndTime             string  `json:"end_time,omitempty"`
}

// Timer represents a simple timer for measuring operation duration
type Timer struct {
	start time.Time
	name  string
}

// NewTimer creates a new timer and starts it
func NewTimer(name string) *Timer {
	return &Timer{
		start: time.Now(),
		name:  name,
	}
}

// Stop stops the timer and returns the duration
func (t *Timer) Stop() time.Duration {
	return time.Since(t.start)
}

// NewEnhancedDurationMetric creates a new enhanced duration metric
func NewEnhancedDurationMetric(duration time.Duration, scale, helpText, practicalApp string) EnhancedDurationMetric {
	ms := float64(duration.Nanoseconds()) / 1e6 // Convert to milliseconds
	
	return EnhancedDurationMetric{
		Value:               ms,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
		StartTime:           time.Now().Add(-duration).Format("15:04:05.000"),
		EndTime:             time.Now().Format("15:04:05.000"),
	}
}

// NewPerformanceMetrics creates a new performance metrics tracker
func NewPerformanceMetrics(requestID string) *PerformanceMetrics {
	return &PerformanceMetrics{
		StartTime:     time.Now(),
		RequestID:     requestID,
		SubOperations: make(map[string]EnhancedDurationMetric),
	}
}

// AddSubOperation adds a sub-operation timing
func (p *PerformanceMetrics) AddSubOperation(name string, duration time.Duration) {
	p.SubOperations[name] = NewEnhancedDurationMetric(
		duration,
		"0-∞ ms",
		"Duration of "+name+" operation in milliseconds",
		"Monitor for performance bottlenecks. Longer times may indicate complex text or processing issues.",
	)
}

// Finalize completes the performance metrics with total duration and individual metrics
func (p *PerformanceMetrics) Finalize(complexityDur, tokenDur, preprocessDur time.Duration) {
	totalDuration := time.Since(p.StartTime)
	
	p.TotalDuration = NewEnhancedDurationMetric(
		totalDuration,
		"0-∞ ms", 
		"Total time taken for complete text analysis including all sub-operations",
		"Monitor overall performance. Times >1000ms may indicate need for optimization or text length concerns.",
	)
	
	p.ComplexityDuration = NewEnhancedDurationMetric(
		complexityDur,
		"0-∞ ms",
		"Time taken to analyze text complexity, readability scores, and linguistic features",
		"Complexity analysis is typically the most time-consuming. Times >500ms suggest very complex or long text.",
	)
	
	p.TokenizationDuration = NewEnhancedDurationMetric(
		tokenDur,
		"0-∞ ms", 
		"Time taken to tokenize text into words, sentences, and linguistic units",
		"Tokenization should be fast (<100ms). Higher times may indicate very long texts or complex tokenization rules.",
	)
	
	p.PreprocessingDuration = NewEnhancedDurationMetric(
		preprocessDur,
		"0-∞ ms",
		"Time taken for text preprocessing including cleaning, normalization, and preparation",
		"Preprocessing should be very fast (<50ms). Higher times may indicate complex text cleaning requirements.",
	)
}

// GetPerformanceSummary returns a human-readable summary of performance
func (p *PerformanceMetrics) GetPerformanceSummary() string {
	total := p.TotalDuration.Value
	if total < 100 {
		return "Fast"
	} else if total < 500 {
		return "Normal"
	} else if total < 1000 {
		return "Slow"
	} else {
		return "Very Slow"
	}
}

// MeasureFunc is a utility function to measure the duration of any function
func MeasureFunc(name string, fn func()) (time.Duration, interface{}) {
	timer := NewTimer(name)
	var result interface{}
	
	// Execute the function
	fn()
	
	duration := timer.Stop()
	return duration, result
}

// MeasureFuncWithReturn is a utility function to measure the duration of a function with a return value
func MeasureFuncWithReturn[T any](name string, fn func() T) (time.Duration, T) {
	timer := NewTimer(name)
	result := fn()
	duration := timer.Stop()
	return duration, result
}