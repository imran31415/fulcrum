package analyzer

// PromptTestCase represents a test case for calibrating the grading system
type PromptTestCase struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	Text         string     `json:"text"`
	ExpectedType PromptType `json:"expected_type"`
	ExpectedGrade struct {
		MinScore float64 `json:"min_score"` // Minimum expected score
		MaxScore float64 `json:"max_score"` // Maximum expected score
		TargetGrade string `json:"target_grade"` // Target letter grade
	} `json:"expected_grade"`
	QualityLevel string   `json:"quality_level"` // "excellent", "good", "average", "poor"
	Source       string   `json:"source"`        // "cursor", "claude", "chatgpt", "synthetic"
	Tags         []string `json:"tags"`
}

// GetHighQualityPromptTestCases returns a comprehensive set of test cases
// based on real-world examples from leading AI tools and prompt engineering guides
func GetHighQualityPromptTestCases() []PromptTestCase {
	return []PromptTestCase{
		// EXCELLENT QUALITY PROMPTS (should get A/A+ grades)
		{
			ID:          "cursor-react-component",
			Name:        "Cursor-style React Component",
			Description: "High-quality React component request with specific requirements",
			Text: `Create a React component called UserProfile that displays user information.

Requirements:
- Display user's name, email, avatar, and join date
- Use TypeScript for type safety
- Include loading and error states
- Make it responsive using CSS modules
- Add hover animations for interactive elements
- Include proper accessibility attributes (ARIA labels, keyboard navigation)
- Handle missing/null data gracefully

Props interface:
- userId: string (required)
- showActions?: boolean (optional, defaults to true)
- onEdit?: (user: User) => void (callback for edit action)

Styling requirements:
- Use CSS Grid for layout
- Mobile-first responsive design
- Follow Material Design principles
- Support both light and dark themes

Please include:
1. The main component file
2. TypeScript interfaces
3. CSS module file
4. Basic unit tests using React Testing Library`,
			ExpectedType: CodeGeneration,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 90, MaxScore: 95, TargetGrade: "A"},
			QualityLevel: "excellent",
			Source:      "cursor",
			Tags:        []string{"react", "typescript", "component", "detailed-requirements"},
		},
		{
			ID:          "claude-technical-architecture",
			Name:        "Claude-style Technical Architecture",
			Description: "Comprehensive system architecture prompt with clear constraints",
			Text: `Design a scalable real-time chat application architecture for a team collaboration platform.

Context:
- Expected 10,000+ concurrent users
- Multi-tenant SaaS application
- Must support file sharing, voice/video calls, and screen sharing
- Global user base requiring low latency
- Enterprise security requirements (SOC2, GDPR compliance)

Technical Requirements:
1. Backend Services:
   - WebSocket connections for real-time messaging
   - REST API for user management and file operations
   - Message persistence and search capabilities
   - User presence tracking
   - Rate limiting and abuse prevention

2. Data Storage:
   - Message history (searchable, archived)
   - File storage with CDN distribution
   - User profiles and permissions
   - Channel/workspace metadata

3. Infrastructure:
   - Auto-scaling capabilities
   - Multi-region deployment
   - Load balancing strategy
   - Database sharding/partitioning approach
   - Monitoring and observability

4. Security:
   - End-to-end encryption for messages
   - Authentication/authorization (SSO support)
   - API security (rate limiting, input validation)
   - Data encryption at rest

Constraints:
- Budget: $50K/month infrastructure cost
- Latency: <100ms message delivery within region
- Availability: 99.9% uptime SLA
- Technology preference: Node.js/Python backend, React frontend
- Must integrate with Slack, Microsoft Teams APIs

Deliverables:
1. High-level architecture diagram
2. Database schema design
3. API endpoint specifications
4. Deployment strategy
5. Security implementation plan
6. Cost breakdown and scaling projections`,
			ExpectedType: TechnicalSpec,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 92, MaxScore: 97, TargetGrade: "A+"},
			QualityLevel: "excellent",
			Source:      "claude",
			Tags:        []string{"architecture", "scalability", "detailed-spec", "constraints"},
		},
		{
			ID:          "chatgpt-data-analysis",
			Name:        "ChatGPT-style Data Analysis",
			Description: "Comprehensive data analysis request with specific methodology",
			Text: `Analyze the customer churn data to identify key factors driving customer attrition and recommend retention strategies.

Dataset Context:
- E-commerce SaaS platform with 50,000+ customers
- Data includes: customer demographics, usage metrics, support interactions, billing history
- Time period: 24 months (Jan 2022 - Dec 2023)
- Churn definition: No login activity for 90+ days AND cancelled subscription

Analysis Requirements:

1. Exploratory Data Analysis:
   - Churn rate trends over time
   - Customer segment breakdown (by plan, industry, company size)
   - Feature correlation analysis
   - Identify data quality issues and handle missing values

2. Statistical Analysis:
   - Survival analysis to model time-to-churn
   - Cohort analysis by acquisition channel
   - A/B test results analysis for retention campaigns
   - Statistical significance testing

3. Machine Learning:
   - Build predictive churn model (preference: logistic regression, random forest)
   - Feature importance analysis
   - Model validation and performance metrics (precision, recall, F1, AUC)
   - Identify high-risk customer segments

4. Business Insights:
   - Top 5 churn drivers with quantified impact
   - Customer lifetime value analysis
   - Revenue impact of churn by segment
   - Actionable retention strategies with expected ROI

Deliverables:
- Jupyter notebook with complete analysis
- Executive summary with key findings
- Interactive dashboard for ongoing monitoring
- Recommendation implementation roadmap

Constraints:
- Use Python (pandas, scikit-learn, matplotlib)
- Results must be explainable to non-technical stakeholders
- Analysis should complete within 2 weeks
- Comply with data privacy regulations (anonymize PII)`,
			ExpectedType: DataAnalysis,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 88, MaxScore: 93, TargetGrade: "A"},
			QualityLevel: "excellent", 
			Source:      "chatgpt",
			Tags:        []string{"data-analysis", "machine-learning", "business-insights", "methodology"},
		},

		// GOOD QUALITY PROMPTS (should get B/B+ grades)
		{
			ID:          "good-webhook-handler",
			Name:        "Good Webhook Handler",
			Description: "Well-structured webhook handler request (the user's example)",
			Text: `Create a robust webhook handler:

**Webhook Source:** [e.g., GitHub, Stripe, Slack]
**Expected Events:** [List event types to handle]
**Processing Requirements:** [What to do with the data]

**Security Requirements:**
- Signature verification
- IP allowlisting (if applicable)
- Rate limiting
- Request validation

**Infrastructure:**
- Platform: [AWS Lambda, Express.js, etc.]
- Database: [for storing events, if needed]
- Queue system: [for async processing, if needed]

Please provide:
1. Complete webhook handler code
2. Security validation implementation
3. Event processing logic
4. Error handling and retry mechanisms
5. Monitoring and logging setup
6. Testing strategy with mock payloads`,
			ExpectedType: TechnicalSpec,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 78, MaxScore: 85, TargetGrade: "B+"},
			QualityLevel: "good",
			Source:      "user-example",
			Tags:        []string{"webhook", "technical-spec", "well-structured"},
		},
		{
			ID:          "good-creative-brief",
			Name:        "Good Creative Brief",
			Description: "Creative task with clear parameters",
			Text: `Design a brand identity for a sustainable tech startup.

Company Background:
- Name: EcoTech Solutions
- Mission: Making renewable energy accessible to small businesses
- Target audience: SMB owners, environmentally conscious consumers
- Industry: Clean energy technology

Brand Requirements:
- Logo design (primary and secondary versions)
- Color palette (3-5 colors)
- Typography system (header, body, accent fonts)
- Brand voice and messaging guidelines

Deliverables:
- Logo variations (horizontal, stacked, icon-only)
- Brand style guide
- Business card and letterhead designs
- Website header mockup

Style preferences:
- Modern but approachable
- Professional yet environmental/organic feeling
- Avoid overused green clichés
- Should work well in digital and print

Timeline: 2 weeks
Budget: $5,000-$8,000`,
			ExpectedType: CreativeTask,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 75, MaxScore: 82, TargetGrade: "B+"},
			QualityLevel: "good",
			Source:      "synthetic",
			Tags:        []string{"creative", "branding", "clear-requirements"},
		},

		// AVERAGE QUALITY PROMPTS (should get C/C+ grades)
		{
			ID:          "average-code-request",
			Name:        "Average Code Request",
			Description: "Basic code request missing some context",
			Text: `I need a function that processes user data. It should take a list of users and return some analytics about them. The function should be in Python and handle edge cases. Please make it efficient and add some comments.`,
			ExpectedType: CodeGeneration,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 60, MaxScore: 70, TargetGrade: "C+"},
			QualityLevel: "average",
			Source:      "synthetic",
			Tags:        []string{"vague", "missing-details", "basic-request"},
		},
		{
			ID:          "average-analysis-request",
			Name:        "Average Analysis Request",
			Description: "Analysis request with limited context",
			Text: `Analyze our sales data to find trends and insights. Look at the numbers and tell me what's working and what's not. We want to improve our sales performance. The data is in a CSV file with sales information from last year. Please create some visualizations and a summary report.`,
			ExpectedType: DataAnalysis,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 55, MaxScore: 68, TargetGrade: "C"},
			QualityLevel: "average",
			Source:      "synthetic",
			Tags:        []string{"vague-requirements", "missing-context", "generic"},
		},

		// POOR QUALITY PROMPTS (should get D/F grades)
		{
			ID:          "poor-generic-request",
			Name:        "Poor Generic Request",
			Description: "Very vague request without specifics",
			Text: `Make me a website that looks good and works well. It should have all the features that websites need. Please use modern technology and best practices.`,
			ExpectedType: General,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 30, MaxScore: 45, TargetGrade: "D"},
			QualityLevel: "poor",
			Source:      "synthetic",
			Tags:        []string{"extremely-vague", "no-requirements", "generic"},
		},
		{
			ID:          "poor-conflicting-request",
			Name:        "Poor Conflicting Request",
			Description: "Request with conflicting and unclear requirements",
			Text: `Build a simple but complex system that is lightweight yet feature-rich. It should be fast and slow depending on the user. Use all the latest technologies but keep it compatible with old systems. Make it secure but easy to access. The budget is unlimited but keep costs low.`,
			ExpectedType: General,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 25, MaxScore: 40, TargetGrade: "F"},
			QualityLevel: "poor",
			Source:      "synthetic",
			Tags:        []string{"contradictory", "unclear", "nonsensical"},
		},

		// EDGE CASES
		{
			ID:          "learning-prompt-excellent",
			Name:        "Excellent Learning Prompt",
			Description: "High-quality educational request with clear learning objectives",
			Text: `Explain machine learning concepts for a software developer transitioning to ML engineering.

Learning Context:
- Background: 5+ years in web development (JavaScript, Python)
- Goal: Understand ML fundamentals to contribute to ML projects
- Timeline: 4 weeks of self-study (10 hours/week)
- Learning style: Hands-on with code examples

Specific Topics to Cover:
1. Supervised vs Unsupervised Learning (with practical examples)
2. Key algorithms: Linear Regression, Decision Trees, Random Forest, Neural Networks
3. Data preprocessing and feature engineering
4. Model evaluation metrics and validation techniques
5. Overfitting/underfitting and how to address them
6. Basic deep learning concepts

For Each Topic:
- Theoretical explanation (15-20 minutes reading)
- Code example in Python using scikit-learn/pandas
- Practice exercise with sample dataset
- Real-world use case example

Preferred Format:
- Interactive Jupyter notebooks
- Step-by-step tutorials with explanations
- Include common pitfalls and debugging tips
- Provide additional resources for deeper learning

Success Criteria:
- Can build and evaluate a basic ML model
- Understands when to use different algorithms
- Can interpret model performance metrics
- Knows how to approach ML problem solving

Please structure as a 4-week curriculum with specific learning objectives for each week.`,
			ExpectedType: Learning,
			ExpectedGrade: struct {
				MinScore float64 `json:"min_score"`
				MaxScore float64 `json:"max_score"`
				TargetGrade string `json:"target_grade"`
			}{MinScore: 88, MaxScore: 94, TargetGrade: "A"},
			QualityLevel: "excellent",
			Source:      "synthetic",
			Tags:        []string{"learning", "structured", "clear-objectives", "practical"},
		},
	}
}

// GetPromptTestCasesByQuality returns test cases filtered by quality level
func GetPromptTestCasesByQuality(quality string) []PromptTestCase {
	cases := GetHighQualityPromptTestCases()
	filtered := []PromptTestCase{}
	
	for _, testCase := range cases {
		if testCase.QualityLevel == quality {
			filtered = append(filtered, testCase)
		}
	}
	
	return filtered
}

// GetPromptTestCasesByType returns test cases filtered by prompt type
func GetPromptTestCasesByType(promptType PromptType) []PromptTestCase {
	cases := GetHighQualityPromptTestCases()
	filtered := []PromptTestCase{}
	
	for _, testCase := range cases {
		if testCase.ExpectedType == promptType {
			filtered = append(filtered, testCase)
		}
	}
	
	return filtered
}

// PromptGradingBenchmark runs the grading system against test cases
type PromptGradingBenchmark struct {
	TestCases []PromptTestCase `json:"test_cases"`
	Results   []BenchmarkResult `json:"results"`
}

// BenchmarkResult contains the actual vs expected results
type BenchmarkResult struct {
	TestCaseID     string  `json:"test_case_id"`
	ExpectedGrade  string  `json:"expected_grade"`
	ActualGrade    string  `json:"actual_grade"`
	ExpectedScore  float64 `json:"expected_score"` // Midpoint of expected range
	ActualScore    float64 `json:"actual_score"`
	ScoreDiff      float64 `json:"score_diff"`     // Actual - Expected
	Passed         bool    `json:"passed"`         // Within acceptable range
	Classification struct {
		Expected PromptType `json:"expected"`
		Actual   PromptType `json:"actual"`
		Correct  bool       `json:"correct"`
	} `json:"classification"`
}

// RunBenchmark tests the grading system against high-quality examples
func (b *PromptGradingBenchmark) RunBenchmark(grader *ModernPromptGrader) {
	b.TestCases = GetHighQualityPromptTestCases()
	b.Results = make([]BenchmarkResult, len(b.TestCases))
	
	for i, testCase := range b.TestCases {
		// Note: This would need actual metrics calculation in a real implementation
		// For now, we'll structure it to show how the benchmark would work
		
		result := BenchmarkResult{
			TestCaseID: testCase.ID,
			ExpectedGrade: testCase.ExpectedGrade.TargetGrade,
			ExpectedScore: (testCase.ExpectedGrade.MinScore + testCase.ExpectedGrade.MaxScore) / 2,
		}
		
		// Classification check
		result.Classification.Expected = testCase.ExpectedType
		// result.Classification.Actual = grader.classifier.ClassifyPrompt(testCase.Text).PrimaryType
		// result.Classification.Correct = result.Classification.Expected == result.Classification.Actual
		
		// Score validation - passes if within expected range with 10% tolerance
		tolerance := 10.0
		result.Passed = result.ActualScore >= (testCase.ExpectedGrade.MinScore - tolerance) &&
			result.ActualScore <= (testCase.ExpectedGrade.MaxScore + tolerance)
		
		b.Results[i] = result
	}
}