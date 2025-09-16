export const prompt = {
  title: 'Bug Investigation & Fix',
  description: 'Systematic debugging approach with root cause analysis',
  category: 'cursor-agent',
  tags: ['debugging', 'troubleshooting', 'analysis'],
  priority: 'high',
  useCount: 203,
  icon: '🐛',
  template: `Help me debug this issue systematically:

**Problem Description:**
[Describe the bug or issue]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What is happening instead]

**Code/Context:**
[Paste relevant code, error messages, logs]

**Environment:**
- Language/Framework: [e.g., React, Node.js, Python]
- Version: [version info]
- Platform: [OS, browser, etc.]

Please:
1. Analyze the root cause
2. Suggest step-by-step debugging approach
3. Provide the fix with explanation
4. Recommend prevention strategies`
};