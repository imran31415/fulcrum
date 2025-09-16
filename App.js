import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, SafeAreaView, Platform } from 'react-native';
import { initWasm, processText } from './src/wasm';
import { WasmProvider } from './src/wasm/WasmProvider';
import { EnhancedResultDisplay } from './src/components/AnalysisComponents';
import { PerformanceCompact } from './src/components/PerformanceComponents';
import { InsightsTab } from './src/components/InsightComponents';
// Ensure the native WebView module is installed (for iOS/Android):
//   expo install react-native-webview


export default function App() {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('Text analysis is a powerful technique for understanding written content and communication effectiveness. It helps identify readability levels, complexity patterns, linguistic features, and semantic structures that significantly impact reader comprehension and engagement. Modern computational tools can process natural language efficiently, providing detailed insights into vocabulary complexity, sentence structure, grammatical patterns, and stylistic elements. These analyses enable writers, educators, and content creators to optimize their text for specific audiences and purposes.');
  const [result, setResult] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'insights', 'raw'

  useEffect(() => {
    initWasm().then(() => setReady(true)).catch((e) => setError(String(e)));
  }, []);


  const run = async (op) => {
    setError('');
    setIsAnalyzing(true);
    try {
      const out = await processText(op, input);
      console.log('Raw WASM output:', out);
      
      if (typeof out === 'object' && out !== null) {
        // Handle WASM response structure: { success: true/false, data: string/object, error?: string }
        if (out.success === false) {
          setError(out.error || 'Analysis failed');
          setResult('');
          setParsedResult(null);
          return;
        }
        
        if (out.success === true && out.data !== undefined) {
          const data = out.data;
          
          if (typeof data === 'string') {
            // Try to parse the data string as JSON
            try {
              const parsed = JSON.parse(data);
              setResult(data);
              setParsedResult(parsed);
            } catch {
              // Not JSON, treat as plain text
              setResult(data);
              setParsedResult(null);
            }
          } else {
            // Data is already an object
            setResult(JSON.stringify(data, null, 2));
            setParsedResult(data);
          }
        } else {
          // Fallback: treat entire response as data
          setResult(JSON.stringify(out, null, 2));
          setParsedResult(out);
        }
      } else if (typeof out === 'string') {
        // Direct string response
        try {
          const parsed = JSON.parse(out);
          setResult(out);
          setParsedResult(parsed);
        } catch {
          setResult(out);
          setParsedResult(null);
        }
      } else {
        setResult('No result returned');
        setParsedResult(null);
      }
    } catch (e) {
      console.error('Analysis error:', e);
      setError(String(e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Mount native WebView bridge invisibly on iOS/Android */}
        {Platform.OS !== 'web' ? <WasmProvider /> : null}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>Fulcrum</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, ready ? styles.statusDotReady : styles.statusDotInit]} />
              <Text style={styles.statusText}>{ready ? 'WASM ready' : 'Initializing'}</Text>
            </View>
          </View>

          {/* Input */}
          <Text style={styles.sectionLabel}>Text</Text>
          <TextInput
            style={styles.input}
            multiline
            value={input}
            onChangeText={setInput}
            placeholder="Type or paste text..."
            placeholderTextColor="#64748b"
          />

          {/* Actions */}
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => run('uppercase')} disabled={!ready || isAnalyzing}>
              <Text style={styles.btnText}>Uppercase</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => run('lowercase')} disabled={!ready || isAnalyzing}>
              <Text style={styles.btnText}>Lowercase</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => run('wordcount')} disabled={!ready || isAnalyzing}>
              <Text style={styles.btnText}>Wordcount</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={() => run('analyze')} disabled={!ready || isAnalyzing}>
              <Text style={styles.btnPrimaryText}>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</Text>
            </Pressable>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Output */}
          <View style={styles.outputHeader}>
            <Text style={styles.sectionLabel}>Result</Text>
            {parsedResult && parsedResult.performance_metrics && (
              <PerformanceCompact performanceData={parsedResult.performance_metrics} />
            )}
          </View>
          
          {/* Tab Navigation */}
          {parsedResult && (
            <View style={styles.tabBar}>
              <Pressable 
                style={[styles.tab, activeTab === 'metrics' && styles.activeTab]}
                onPress={() => setActiveTab('metrics')}
              >
                <Text style={[styles.tabText, activeTab === 'metrics' && styles.activeTabText]}>
                  📊 Metrics
                </Text>
              </Pressable>
              
              {(parsedResult.idea_analysis || parsedResult.insights) && (
                <Pressable 
                  style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
                  onPress={() => setActiveTab('insights')}
                >
                  <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
                    🔍 Insights
                  </Text>
                  <View style={styles.derivedBadge}>
                    <Text style={styles.derivedBadgeText}>DERIVED</Text>
                  </View>
                </Pressable>
              )}
              
              <Pressable 
                style={[styles.tab, activeTab === 'raw' && styles.activeTab]}
                onPress={() => setActiveTab('raw')}
              >
                <Text style={[styles.tabText, activeTab === 'raw' && styles.activeTabText]}>
                  🔧 Raw JSON
                </Text>
              </Pressable>
            </View>
          )}
          
          {/* Tab Content */}
          {parsedResult ? (
            activeTab === 'raw' ? (
              <ScrollView style={styles.output} contentContainerStyle={styles.outputContent}>
                <Text selectable style={styles.code}>{result}</Text>
              </ScrollView>
            ) : activeTab === 'insights' ? (
              <InsightsTab data={parsedResult} />
            ) : (
              <EnhancedResultDisplay data={parsedResult} />
            )
          ) : (
            <ScrollView style={styles.output} contentContainerStyle={styles.outputContent}>
              <Text selectable style={styles.code}>{result}</Text>
            </ScrollView>
          )}

          <Text style={styles.footer}>Made with Go + WASM</Text>
        </View>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  statusDotReady: {
    backgroundColor: '#22c55e',
  },
  statusDotInit: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outputHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#646cff',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  derivedBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#646cff20',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#646cff40',
  },
  derivedBadgeText: {
    fontSize: 9,
    color: '#646cff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleBtnText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  btn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnText: {
    color: '#334155',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  errorText: {
    color: '#b91c1c',
  },
  output: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  outputContent: {
    padding: 12,
  },
  code: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  footer: {
    marginTop: 10,
    marginBottom: 10,
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});
