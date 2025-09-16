#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Building Fulcrum WASM Module${NC}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go 1.21 or later.${NC}"
    exit 1
fi

# Check Go version
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
if [[ "$(printf '%s\n' "1.21" "$GO_VERSION" | sort -V | head -n1)" != "1.21" ]]; then
    echo -e "${YELLOW}⚠️  Warning: Go version $GO_VERSION detected. Go 1.21+ recommended.${NC}"
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

# Check if the WASM file was created
if [ ! -f "$BUILD_DIR/main.wasm" ]; then
    echo -e "${RED}❌ WASM file not found at $BUILD_DIR/main.wasm${NC}"
    exit 1
fi

# Get WASM file size
WASM_SIZE=$(du -h "$BUILD_DIR/main.wasm" | cut -f1)
echo -e "${GREEN}✅ WASM build successful (${WASM_SIZE})${NC}"

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

# Encode WASM to base64 (like Gorph does)
echo -e "${YELLOW}🔐 Encoding WASM to base64${NC}"
WASM_BASE64=$(base64 -i "$BUILD_DIR/main.wasm")

# Create the WASM data file
cat > "$JS_DIR/wasmData.js" << EOF
// Auto-generated WASM data - DO NOT EDIT MANUALLY
// Generated on: $(date)
// WASM size: $WASM_SIZE

export const wasmBase64 = \`$WASM_BASE64\`;

export const wasmInfo = {
  size: '$WASM_SIZE',
  generatedAt: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  functions: [
    'processText'
  ]
};
EOF

# Also create a CommonJS version for broader compatibility
cat > "$JS_DIR/wasmData.cjs" << EOF
// Auto-generated WASM data - DO NOT EDIT MANUALLY
// Generated on: $(date)
// WASM size: $WASM_SIZE

const wasmBase64 = \`$WASM_BASE64\`;

const wasmInfo = {
  size: '$WASM_SIZE',
  generatedAt: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  functions: [
    'processText'
  ]
};

module.exports = {
  wasmBase64,
  wasmInfo
};
EOF

# Create mobile HTML bundle (for React Native WebView) with inlined runtime and WASM
WASM_EXEC_BASE64=$(base64 -i "$JS_DIR/wasm_exec.js")
cat > "$JS_DIR/mobileHtml.js" << EOF
// Auto-generated mobile HTML payload for React Native WebView - DO NOT EDIT
// Generated on: $(date)

export const mobileHtml = \`<!doctype html>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<body>
<script>
  // Decode and eval Go's wasm_exec.js (inlined as base64 to avoid escaping issues)
  (function(){
    const b64 = '${WASM_EXEC_BASE64}';
    const js = atob(b64);
    eval(js);
  })();
</script>
<script>
  const wasmBase64 = \`${WASM_BASE64}\`;
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Set up inbound messages from React Native
  window.addEventListener('message', (e) => {
    try {
      const { id, op, text } = JSON.parse(e.data);
      if (typeof window.processText !== 'function') throw new Error('processText not available');
      const res = window.processText(op, text);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ id, res }));
    } catch (err) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ id: null, err: String(err) }));
    }
  });

  (async function init() {
    if (typeof window.Go !== 'function') {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', err: 'Go runtime not loaded' }));
      return;
    }
    const go = new window.Go();
    const { instance } = await WebAssembly.instantiate(b64ToBytes(wasmBase64), go.importObject);

    // Notify readiness as soon as Go sets wasmReady and processText is exported
    let readySent = false;
    const notifyReady = () => {
      if (!readySent && window.wasmReady === true && typeof window.processText === 'function') {
        readySent = true;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    };
    setInterval(notifyReady, 20);

    // Start the Go runtime (blocks until program exit, timers still run)
    go.run(instance);
  })();
</script>
</body>\`;
EOF

echo -e "${GREEN}✅ Mobile HTML bundle created${NC}"

# Create build info
cat > "$BUILD_DIR/build-info.json" << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "goVersion": "$GO_VERSION",
  "wasmSize": "$WASM_SIZE",
  "functions": [
    "processText"
  ]
}
EOF
echo -e "${GREEN}🎉 WASM build complete!${NC}"
echo -e "${GREEN}   📄 WASM file: $BUILD_DIR/main.wasm${NC}"
echo -e "${GREEN}   📄 Base64 data: $JS_DIR/wasmData.js${NC}"
echo -e "${GREEN}   📄 WASM exec: $JS_DIR/wasm_exec.js${NC}"
echo -e "${GREEN}   📊 Size: $WASM_SIZE${NC}"