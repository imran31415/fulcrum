#!/usr/bin/env node

// Script to embed wasm_exec.js content as a string
const fs = require('fs');
const path = require('path');

const wasmExecPath = path.join(__dirname, '../src/wasm/wasm_exec.js');
const outputPath = path.join(__dirname, '../src/wasm/wasmExecEmbedded.js');

// Read the wasm_exec.js file
const wasmExecContent = fs.readFileSync(wasmExecPath, 'utf8');

// Escape the content for embedding
const escaped = wasmExecContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

// Create the module
const moduleContent = `// Auto-generated file - do not edit
// Contains embedded wasm_exec.js content

export const wasmExecCode = \`${escaped}\`;
`;

// Write the output file
fs.writeFileSync(outputPath, moduleContent, 'utf8');

console.log('✅ Embedded wasm_exec.js to wasmExecEmbedded.js');