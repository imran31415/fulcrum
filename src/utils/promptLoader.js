// Import all prompt files using require.context for automatic discovery
function importAll(r) {
  let prompts = [];
  
  r.keys().forEach((fileName) => {
    const module = r(fileName);
    const promptData = module.prompt || module.default?.prompt;
    
    if (promptData) {
      const prompt = {
        id: generateId(fileName),
        fileName,
        ...promptData
      };
      prompts.push(prompt);
      console.log('✅ Loaded prompt:', prompt.title);
    } else {
      console.warn('⚠️ No prompt data found in:', fileName);
    }
  });
  
  return prompts;
}

// Generate ID from filename
function generateId(fileName) {
  return fileName
    .replace('./src/prompts/', '')
    .replace(/\.md$/, '')
    .replace(/\//g, '-');
}

// Load all prompts at build time
console.log('🔍 Attempting to load prompts...');
let loadedPrompts = [];
try {
  const promptsContext = require.context('../prompts', true, /\.js$/);
  console.log('📁 Found prompt files:', promptsContext.keys());
  loadedPrompts = importAll(promptsContext);
  console.log('✅ Loaded prompts:', loadedPrompts);
} catch (error) {
  console.error('❌ Error loading prompts:', error);
  loadedPrompts = []; // Fallback to empty array
}

// Group prompts by category
const promptsByCategory = loadedPrompts.reduce((acc, prompt) => {
  const category = prompt.category || 'general';
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(prompt);
  return acc;
}, {});

// Calculate category counts
const categories = [
  { id: 'all', name: 'All Prompts', icon: '📚' },
  { id: 'cursor-agent', name: 'Cursor Agent', icon: '🤖' },
  { id: 'tool-calling', name: 'Tool Calling', icon: '🔧' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'development', name: 'Development', icon: '💻' },
].map(category => ({
  ...category,
  count: category.id === 'all' ? loadedPrompts.length : (promptsByCategory[category.id]?.length || 0)
}));

export const promptLibrary = {
  categories,
  prompts: loadedPrompts,
  promptsByCategory
};

export default promptLibrary;