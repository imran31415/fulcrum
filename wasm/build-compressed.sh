#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Building Compressed Fulcrum WASM Module${NC}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go 1.21 or later.${NC}"
    exit 1
fi

# Check for gzip
if ! command -v gzip &> /dev/null; then
    echo -e "${RED}❌ gzip is not available${NC}"
    exit 1
fi

# Set up directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
SRC_DIR="$SCRIPT_DIR/src"
JS_DIR="$SCRIPT_DIR/../src/wasm"

echo -e "${YELLOW}📁 Creating build directories${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$JS_DIR"

# Change to the wasm directory
cd "$SCRIPT_DIR"

# Download dependencies
echo -e "${YELLOW}📦 Downloading Go dependencies${NC}"
go mod tidy

# Build the WASM module
echo -e "${YELLOW}🏗️  Compiling Go to WebAssembly${NC}"
GOOS=js GOARCH=wasm go build -o "$BUILD_DIR/main.wasm" "$SRC_DIR/main.go"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ WASM build failed${NC}"
    exit 1
fi

# Get WASM file size
WASM_SIZE=$(du -h "$BUILD_DIR/main.wasm" | cut -f1)
echo -e "${GREEN}✅ WASM build successful (${WASM_SIZE})${NC}"

# Compress WASM with gzip for transfer
echo -e "${YELLOW}🗜️  Compressing WASM${NC}"
gzip -9 -c "$BUILD_DIR/main.wasm" > "$BUILD_DIR/main.wasm.gz"
COMPRESSED_SIZE=$(du -h "$BUILD_DIR/main.wasm.gz" | cut -f1)
echo -e "${GREEN}✅ Compressed to ${COMPRESSED_SIZE}${NC}"

# Copy the Go WASM exec helper
GO_ROOT=$(go env GOROOT)
WASM_EXEC_JS="$GO_ROOT/misc/wasm/wasm_exec.js"

if [ -f "$WASM_EXEC_JS" ]; then
    echo -e "${YELLOW}📋 Copying WASM exec helper${NC}"
    cp "$WASM_EXEC_JS" "$BUILD_DIR/"
    cp "$WASM_EXEC_JS" "$JS_DIR/"
else
    echo -e "${RED}❌ wasm_exec.js not found in Go installation${NC}"
    exit 1
fi

# Create compressed WASM data
echo -e "${YELLOW}⚡ Creating compressed binary embedding${NC}"

echo "// Auto-generated compressed WASM data - $(date)" > "$JS_DIR/wasmData.js"
echo "// Gzip compressed for fast loading" >> "$JS_DIR/wasmData.js"
echo "" >> "$JS_DIR/wasmData.js"

# Embed compressed binary
echo "const compressedBytes = new Uint8Array([" >> "$JS_DIR/wasmData.js"
xxd -i "$BUILD_DIR/main.wasm.gz" | \
  grep -v 'unsigned' | \
  grep -v '};' | \
  sed 's/^[[:space:]]*//' | \
  tr -d '\n' | \
  sed 's/,$//' >> "$JS_DIR/wasmData.js"
echo "]);" >> "$JS_DIR/wasmData.js"

# Add decompression and conversion functions
cat >> "$JS_DIR/wasmData.js" << 'EOF'

// Decompress using browser's built-in decompression
async function decompressWasm() {
  if (typeof DecompressionStream !== 'undefined') {
    // Use modern streaming decompression (Chrome 80+, Firefox 101+)
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(compressedBytes);
    writer.close();
    
    const chunks = [];
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressed = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }
    return decompressed;
  }
  
  // Fallback: Use pako library if available
  if (typeof globalThis.pako !== 'undefined') {
    return new Uint8Array(globalThis.pako.ungzip(compressedBytes));
  }
  
  // Final fallback: Load via fetch with compression headers
  const blob = new Blob([compressedBytes], { type: 'application/gzip' });
  const response = await fetch(URL.createObjectURL(blob));
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Export decompressed bytes
let _wasmBytes = null;
export const wasmBytes = (async () => {
  if (_wasmBytes === null) {
    _wasmBytes = await decompressWasm();
  }
  return _wasmBytes;
})();

// Legacy base64 export
let _wasmBase64 = null;
export const wasmBase64 = (async () => {
  if (_wasmBase64 === null) {
    const bytes = await wasmBytes;
    _wasmBase64 = btoa(String.fromCharCode(...bytes));
  }
  return _wasmBase64;
})();

export const wasmInfo = {
EOF

echo "  originalSize: '$WASM_SIZE'," >> "$JS_DIR/wasmData.js"
echo "  compressedSize: '$COMPRESSED_SIZE'," >> "$JS_DIR/wasmData.js"
echo "  generatedAt: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'," >> "$JS_DIR/wasmData.js"

cat >> "$JS_DIR/wasmData.js" << 'EOF'
  optimized: true,
  method: 'gzip-compressed',
  functions: ['processText']
};
EOF

# Create compressed loader
cat > "$JS_DIR/index.compressed.js" << 'EOF'
// Compressed WASM loader
import './wasm_exec.js';
import { wasmBytes } from './wasmData.js';

let initPromise = null;
let goInstance = null;
let isRunning = false;

function waitForReady(timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (globalThis.wasmReady === true) return resolve();
      if (Date.now() - start > timeoutMs)
        return reject(new Error('WASM initialization timed out'));
      setTimeout(check, 10);
    };
    check();
  });
}

export async function initWasm() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      if (goInstance && isRunning) {
        console.log('Cleaning up previous WASM instance...');
        goInstance = null;
        isRunning = false;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (typeof globalThis.Go !== 'function') {
        throw new Error('Go WASM runtime not loaded');
      }
      
      console.log('Loading compressed WASM...');
      goInstance = new globalThis.Go();
      
      // Decompress and load WASM
      const bytes = await wasmBytes;
      const { instance } = await WebAssembly.instantiate(bytes, goInstance.importObject);
      
      const runPromise = goInstance.run(instance);
      isRunning = true;
      
      runPromise.then(
        () => { console.warn('Go WASM program exited'); isRunning = false; },
        (error) => { console.error('Go WASM program crashed:', error); isRunning = false; }
      );
      
      await waitForReady();
      
      if (typeof globalThis.processText !== 'function') {
        throw new Error('processText not exported by WASM module');
      }
      
      console.log('Compressed WASM initialized successfully');
    } catch (error) {
      initPromise = null;
      goInstance = null;
      isRunning = false;
      throw error;
    }
  })();
  
  return initPromise;
}

export async function processText(operation, text) {
  if (!isRunning) {
    console.log('WASM not running, reinitializing...');
    initPromise = null;
    await initWasm();
  }
  
  const fn = globalThis.processText;
  if (typeof fn !== 'function') {
    throw new Error('processText not available');
  }
  
  try {
    return fn(operation, text);
  } catch (error) {
    console.error('Error calling processText:', error);
    if (error.message && error.message.includes('Go program has already exited')) {
      console.log('Go program exited, attempting to reinitialize...');
      initPromise = null;
      isRunning = false;
      goInstance = null;
      await initWasm();
      return globalThis.processText(operation, text);
    }
    throw error;
  }
}
EOF

echo -e "${GREEN}✅ Compressed WASM files created${NC}"
echo -e "${GREEN}   📄 Original: $WASM_SIZE${NC}"
echo -e "${GREEN}   🗜️  Compressed: $COMPRESSED_SIZE${NC}"
echo -e "${GREEN}   ⚡ Uses browser-native decompression${NC}"
echo -e "${YELLOW}   💡 Use: import './index.compressed.js'${NC}"