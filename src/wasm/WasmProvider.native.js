import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WasmBridge } from './WasmBridge.native.js';
import { setBridge } from './bridgeRegistry.native.js';

export function WasmProvider() {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) setBridge(ref.current);
  }, []);
  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <WasmBridge ref={ref} />
    </View>
  );
}
