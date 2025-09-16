import React, { useImperativeHandle, useMemo, useRef, forwardRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { mobileHtml } from './mobileHtml';

export const WasmBridge = forwardRef(function WasmBridge(props, ref) {
  const webviewRef = useRef(null);
  const pending = useRef(new Map());
  const ready = useRef(false);

  const html = useMemo(() => mobileHtml, []);

  useImperativeHandle(ref, () => ({
    isReady: () => ready.current,
    async call(op, text) {
      if (!ready.current) throw new Error('WASM not ready');
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return new Promise((resolve, reject) => {
        pending.current.set(id, { resolve, reject });
        webviewRef.current?.postMessage(JSON.stringify({ id, op, text }));
      });
    },
  }));

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === 'ready') {
              ready.current = true;
              return;
            }
            const { id, res, err } = msg || {};
            if (!id) return;
            const p = pending.current.get(id);
            if (!p) return;
            pending.current.delete(id);
            err ? p.reject(new Error(err)) : p.resolve(res);
          } catch (ex) {}
        }}
      />
    </View>
  );
});