package analyzer

// EnhancedMetric represents a metric with comprehensive context information
type EnhancedMetric struct {
	Value               interface{} `json:"value"`
	Scale               string      `json:"scale"`
	HelpText            string      `json:"help_text"`
	PracticalApplication string      `json:"practical_application"`
}

// EnhancedStringMetric for string-based metrics
type EnhancedStringMetric struct {
	Value               string `json:"value"`
	Scale               string `json:"scale"`
	HelpText            string `json:"help_text"`
	PracticalApplication string `json:"practical_application"`
}

// EnhancedFloatMetric for float-based metrics
type EnhancedFloatMetric struct {
	Value               float64 `json:"value"`
	Scale               string  `json:"scale"`
	HelpText            string  `json:"help_text"`
	PracticalApplication string  `json:"practical_application"`
}

// EnhancedIntMetric for integer-based metrics
type EnhancedIntMetric struct {
	Value               int    `json:"value"`
	Scale               string `json:"scale"`
	HelpText            string `json:"help_text"`
	PracticalApplication string `json:"practical_application"`
}

// EnhancedMapMetric for map-based metrics
type EnhancedMapMetric struct {
	Value               map[string]int `json:"value"`
	Scale               string         `json:"scale"`
	HelpText            string         `json:"help_text"`
	PracticalApplication string         `json:"practical_application"`
}

// EnhancedStringSliceMetric for string slice metrics
type EnhancedStringSliceMetric struct {
	Value               []string `json:"value"`
	Scale               string   `json:"scale"`
	HelpText            string   `json:"help_text"`
	PracticalApplication string   `json:"practical_application"`
}

// EnhancedBoolMetric for boolean metrics
type EnhancedBoolMetric struct {
	Value               bool   `json:"value"`
	Scale               string `json:"scale"`
	HelpText            string `json:"help_text"`
	PracticalApplication string `json:"practical_application"`
}

// Utility functions to create enhanced metrics easily

func NewEnhancedFloatMetric(value float64, scale, helpText, practicalApp string) EnhancedFloatMetric {
	return EnhancedFloatMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

func NewEnhancedIntMetric(value int, scale, helpText, practicalApp string) EnhancedIntMetric {
	return EnhancedIntMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

func NewEnhancedStringMetric(value, scale, helpText, practicalApp string) EnhancedStringMetric {
	return EnhancedStringMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

func NewEnhancedMapMetric(value map[string]int, scale, helpText, practicalApp string) EnhancedMapMetric {
	return EnhancedMapMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

func NewEnhancedStringSliceMetric(value []string, scale, helpText, practicalApp string) EnhancedStringSliceMetric {
	return EnhancedStringSliceMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}

func NewEnhancedBoolMetric(value bool, scale, helpText, practicalApp string) EnhancedBoolMetric {
	return EnhancedBoolMetric{
		Value:               value,
		Scale:               scale,
		HelpText:            helpText,
		PracticalApplication: practicalApp,
	}
}