# Prompt Library Management

This folder contains the prompt templates that are automatically loaded into the Prompt Library component. Each prompt is a JavaScript module that exports a prompt object.

## Adding New Prompts

1. **Create a new `.js` file** in the appropriate category folder:
   - `cursor-agent/` - Cursor AI assistant prompts
   - `tool-calling/` - API integration and tool usage prompts  
   - `database/` - Database-related prompts
   - `development/` - General development prompts

2. **Use this template** for new prompt files:

```javascript
export const prompt = {
  title: 'Your Prompt Title',
  description: 'Brief description of what this prompt does',
  category: 'cursor-agent',
  tags: ['tag1', 'tag2', 'tag3'],
  priority: 'high',
  useCount: 0,
  icon: '🔧',
  template: `Your prompt template content goes here...

Use **markdown formatting** and [placeholders] for user input.

**Section Headers:**
- Make the prompt clear and structured
- Include examples where helpful
- Specify expected outputs`
};
```

## Prompt Object Fields

- **title**: Display name in the library
- **description**: Short explanation (shown in cards)
- **category**: Must match folder name (`cursor-agent`, `tool-calling`, `database`, `development`)
- **tags**: Array of searchable keywords
- **priority**: `'high'`, `'medium'`, or `'low'` (affects visual indicators)
- **useCount**: Number for popularity display (can be estimated)
- **icon**: Emoji to display with the prompt
- **template**: The actual prompt text (use template literals for multiline)

## File Naming

Use kebab-case filenames that describe the prompt:
- `code-refactoring.js`
- `api-integration.js` 
- `safe-migration.js`

## Automatic Loading

Prompts are automatically discovered and loaded at build time. No code changes needed - just add the file and it will appear in the library!

## Categories

### Cursor Agent 🤖
Prompts designed for AI coding assistants, code review, refactoring, debugging, and architecture analysis.

### Tool Calling 🔧  
API integration, webhook handlers, batch processing, and external tool integration prompts.

### Database 🗄️
Database migrations, query optimization, schema design, and data management prompts.

### Development 💻
CI/CD, testing strategies, security audits, and general development workflow prompts.