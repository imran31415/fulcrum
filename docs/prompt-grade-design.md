# Prompt Grade Design Document

## Overview
The Prompt Grade feature provides comprehensive, non-LLM-based evaluation of prompt quality across multiple dimensions. It analyzes existing metrics and task graphs to generate actionable insights for prompt improvement.

## Core Grading Dimensions

### 1. **Understandability (0-100)**
Measures how easy the prompt is to comprehend.

**Calculation factors:**
- Flesch Reading Ease (30% weight)
- Average sentence length (20% weight)
- Sentence complexity average (20% weight)
- Lexical diversity (15% weight)
- Word complexity distribution (15% weight)

**Grading scale:**
- 90-100: Excellent - Crystal clear, easy to understand
- 75-89: Good - Clear with minor complexity
- 60-74: Fair - Some areas need simplification
- 40-59: Poor - Difficult to understand
- 0-39: Very Poor - Needs major revision

### 2. **Specificity (0-100)**
Evaluates how specific and unambiguous the prompt is.

**Calculation factors:**
- Pronoun ratio (words like "it", "this", "that") (25% weight)
- Named entity density (20% weight)
- Concrete vs abstract word ratio (20% weight)
- Question clarity (from question_analysis) (15% weight)
- Numeric/quantitative content (10% weight)
- Temporal markers presence (10% weight)

**Indicators of low specificity:**
- High pronoun usage without clear antecedents
- Vague terms ("some", "things", "stuff")
- Abstract concepts without examples
- Missing context for references

### 3. **Task Complexity (0-100)**
Assesses the complexity of tasks within the prompt.

**Calculation factors:**
- Total number of tasks (from task_graph) (25% weight)
- Task dependency depth (critical_path length) (25% weight)
- Graph complexity score (20% weight)
- Parallel vs sequential tasks ratio (15% weight)
- Task type diversity (15% weight)

**Complexity levels:**
- 0-20: Simple - 1-2 independent tasks
- 21-40: Moderate - 3-5 tasks with some dependencies
- 41-60: Complex - 6-10 tasks with multiple dependencies
- 61-80: Very Complex - 10+ interconnected tasks
- 81-100: Extremely Complex - Dense task network

### 4. **Clarity (0-100)**
Measures how clearly the prompt expresses its intent.

**Calculation factors:**
- Sentence structure consistency (25% weight)
- Ambiguous word usage (20% weight)
- Logical flow (topic_transitions) (20% weight)
- Contradiction detection (15% weight)
- Modal verb consistency (10% weight)
- Punctuation clarity (10% weight)

### 5. **Actionability (0-100)**
Evaluates how actionable and executable the prompt is.

**Calculation factors:**
- Action verb density (25% weight)
- Clear outcome specification (20% weight)
- Measurable criteria presence (20% weight)
- Temporal sequencing clarity (15% weight)
- Resource/constraint specification (10% weight)
- Success criteria definition (10% weight)

### 6. **Structure Quality (0-100)**
Assesses the organizational quality of the prompt.

**Calculation factors:**
- Logical progression score (25% weight)
- Topic coherence (20% weight)
- Paragraph/section organization (20% weight)
- Transition word usage (15% weight)
- Conclusion/summary presence (10% weight)
- Introduction clarity (10% weight)

### 7. **Context Sufficiency (0-100)**
Evaluates if enough context is provided for understanding.

**Calculation factors:**
- Background information presence (25% weight)
- Assumption explicitness (20% weight)
- Domain terminology explanation (20% weight)
- Reference completeness (15% weight)
- Constraint specification (10% weight)
- Goal clarity (10% weight)

### 8. **Scope Management (0-100)**
Assesses if the prompt scope is appropriate.

**Calculation factors:**
- Task count vs prompt length ratio (25% weight)
- Conceptual breadth score (20% weight)
- Detail depth consistency (20% weight)
- Focus maintenance (15% weight)
- Scope creep indicators (10% weight)
- Priority specification (10% weight)

## Overall Grade Calculation

### Letter Grade System
```
A+: 95-100 - Exceptional prompt
A:  90-94  - Excellent prompt
A-: 87-89  - Very good prompt
B+: 84-86  - Good prompt with minor issues
B:  80-83  - Good prompt
B-: 77-79  - Above average prompt
C+: 74-76  - Average prompt with room for improvement
C:  70-73  - Average prompt
C-: 67-69  - Below average prompt
D+: 64-66  - Poor prompt with significant issues
D:  60-63  - Poor prompt
D-: 57-59  - Very poor prompt
F:  0-56   - Failing prompt, needs complete rewrite
```

### Composite Score
```
Overall Score = (
    Understandability * 0.20 +
    Specificity * 0.15 +
    Task Complexity * 0.15 +
    Clarity * 0.15 +
    Actionability * 0.15 +
    Structure Quality * 0.10 +
    Context Sufficiency * 0.05 +
    Scope Management * 0.05
)
```

## Suggestion Engine Rules

### Based on Understandability Score
- **< 60**: "Simplify sentences - aim for 15-20 words per sentence"
- **< 60**: "Replace complex words with simpler alternatives"
- **< 40**: "Break down compound sentences into simple ones"

### Based on Specificity Score
- **< 70**: "Replace pronouns with specific nouns"
- **< 60**: "Add concrete examples to abstract concepts"
- **< 50**: "Define vague terms explicitly"

### Based on Task Complexity Score
- **> 70**: "Consider breaking this into multiple smaller prompts"
- **> 80**: "Reduce task dependencies by making some tasks independent"
- **> 60**: "Prioritize tasks and consider removing non-essential ones"

### Based on Clarity Score
- **< 70**: "Ensure consistent verb tenses throughout"
- **< 60**: "Remove or clarify ambiguous terms"
- **< 50**: "Reorganize for better logical flow"

### Based on Actionability Score
- **< 70**: "Add more action verbs (create, analyze, implement)"
- **< 60**: "Specify clear success criteria"
- **< 50**: "Define measurable outcomes"

### Based on Structure Score
- **< 70**: "Add transition words between sections"
- **< 60**: "Group related tasks together"
- **< 50**: "Add clear introduction and conclusion"

### Based on Context Score
- **< 70**: "Provide more background information"
- **< 60**: "Define technical terms and acronyms"
- **< 50**: "State assumptions explicitly"

### Based on Scope Score
- **< 60**: "Narrow focus to core objectives"
- **< 50**: "Remove tangential tasks"
- **> 80**: "Consider adding more detail to broad tasks"

## Visual Design

### Grade Card Component
Each metric displays:
1. Metric name and icon
2. Numerical score (0-100)
3. Letter grade
4. Progress bar with color coding:
   - Green: 80-100
   - Yellow: 60-79
   - Orange: 40-59
   - Red: 0-39
5. Brief explanation
6. Improvement suggestions (expandable)

### Overall Grade Display
- Large letter grade with color coding
- Overall numerical score
- Grade trend indicator (if historical data available)
- Top 3 improvement priorities
- Detailed breakdown (expandable)

## Implementation Priority

1. **Phase 1**: Core metrics (Understandability, Specificity, Task Complexity)
2. **Phase 2**: Advanced metrics (Clarity, Actionability, Structure)
3. **Phase 3**: Contextual metrics (Context Sufficiency, Scope Management)
4. **Phase 4**: Suggestion engine and improvement tracking

## Data Flow

```
Raw Metrics + Task Graph → Grade Calculator → Grade Scores → Suggestion Engine → UI Display
                            ↓
                     Grade History Storage
```

## Success Metrics

1. Users can understand their prompt quality without LLM analysis
2. Actionable suggestions lead to measurable prompt improvements
3. Grade scores correlate with actual LLM performance
4. Fast calculation (< 100ms for typical prompts)
5. Clear, intuitive visual presentation