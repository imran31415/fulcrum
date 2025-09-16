import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, SafeAreaView, Platform, InteractionManager, Dimensions, Modal } from 'react-native';
// Conditionally import WASM based on platform and worker support
let initWasm, processText;
if (Platform.OS === 'web' && typeof Worker !== 'undefined') {
  // Use web worker version for web platform
  const wasmWorker = require('./src/wasm/index.webworker');
  initWasm = wasmWorker.initWasm;
  processText = wasmWorker.processText;
} else {
  // Use regular version for React Native or web without workers
  const wasmModule = require('./src/wasm');
  initWasm = wasmModule.initWasm;
  processText = wasmModule.processText;
}
import { WasmProvider } from './src/wasm/WasmProvider';
import { EnhancedResultDisplay } from './src/components/AnalysisComponents';
import { PerformanceCompact } from './src/components/PerformanceComponents';
import { InsightsTab } from './src/components/InsightComponents';
import TaskGraph from './components/TaskGraph';
import PromptGradeTab from './src/components/PromptGradeTab';
import SuggestionsTab from './src/components/SuggestionsTab';
import LoadingProgress from './src/components/LoadingProgress';
import MarkdownTextInput from './src/components/MarkdownTextInput';
// Ensure the native WebView module is installed (for iOS/Android):
//   expo install react-native-webview


export default function App() {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('I need to update the user authentication system to support OAuth. First, we must implement the OAuth client configuration. Then we should create the login flow UI components. After that, we have to test the integration with Google and GitHub providers. Finally, we need to deploy the changes to the staging server. Make sure to validate all security tokens properly.');
  const [result, setResult] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('promptgrade'); // 'promptgrade', 'suggestions', 'taskgraph', 'insights', 'metrics', 'raw'
  const [showExamples, setShowExamples] = useState(false);
  const [useEnhancedEditor, setUseEnhancedEditor] = useState(true); // Default to enhanced editor
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  const examplePrompts = [
    {
      title: '🔐 OAuth Implementation',
      text: 'I need to update the user authentication system to support OAuth. First, we must implement the OAuth client configuration. Then we should create the login flow UI components. After that, we have to test the integration with Google and GitHub providers. Finally, we need to deploy the changes to the staging server. Make sure to validate all security tokens properly.',
      category: 'simple'
    },
    {
      title: '🛍️ E-commerce Migration',
      text: 'We need to migrate our e-commerce platform to a microservices architecture. First, we must analyze the current monolithic codebase and create a dependency map. Then we should design the new microservices architecture with separate services for user management, product catalog, and payment processing. After the architecture design, we have to implement the user service API. In parallel, we need to build the product catalog service. Once both services are ready, we must create the API gateway to route requests. Before implementing the payment service, we need to ensure PCI compliance requirements are met. Then we should integrate with Stripe and PayPal payment providers. After payment integration, we have to implement the order processing workflow. Meanwhile, we must set up the Kubernetes cluster for deployment. Once the cluster is ready, we need to configure CI/CD pipelines for each microservice. Then we should implement monitoring with Prometheus and Grafana. After all services are deployed, we have to migrate the existing customer data. Finally, we need to perform load testing to ensure the system can handle Black Friday traffic.',
      category: 'complex'
    },
    {
      title: '🚀 DevOps Pipeline',
      text: 'I need to set up a complete DevOps pipeline for our multi-tenant SaaS application. First, we must audit the current infrastructure and identify security vulnerabilities. Then we should implement infrastructure as code using Terraform. After setting up IaC, we need to create three separate environments: development, staging, and production. Once environments are ready, we must configure VPN access for the team. In parallel, we should set up centralized logging with ELK stack. Before deploying applications, we have to implement secret management with HashiCorp Vault. Then we need to create Docker images for all services. Meanwhile, we should implement automated security scanning in the CI pipeline. Once security scanning is ready, we need to add unit tests and integration tests. After the CI pipeline is complete, we have to set up blue-green deployments. Finally, we must document the entire infrastructure and create an on-call rotation schedule.',
      category: 'complex'
    },
    {
      title: '📱 Mobile App Development',
      text: 'We need to develop a new mobile application for our service. First, we must create wireframes and get stakeholder approval. Then we should set up the React Native development environment. After that, we need to implement the authentication screens. Once authentication is working, we have to build the main dashboard. In parallel, we should integrate push notifications. Then we must implement offline data synchronization. Finally, we need to submit the app to both App Store and Google Play.',
      category: 'medium'
    },
    {
      title: '🔍 Bug Fix Workflow',
      text: 'We need to fix the critical bug in the payment system. First, I must reproduce the issue in the development environment. Then I should analyze the error logs to identify the root cause. After finding the issue, I need to implement a fix. Once the fix is ready, I have to write unit tests. Then we should test the fix in staging. Finally, we need to deploy the hotfix to production.',
      category: 'simple'
    }
  ];

  useEffect(() => {
    initWasm().then(() => setReady(true)).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);


  const run = async (op) => {
    setError('');
    // Don't set isAnalyzing here if it's already set (from button press)
    if (!isAnalyzing) {
      setIsAnalyzing(true);
    }
    // Reset active tab when switching operations
    if (op !== 'analyze') {
      setActiveTab('simple');
    } else {
      setActiveTab('promptgrade');
    }
    
    // Defer the heavy WASM processing to allow UI updates
    if (Platform.OS === 'web') {
      // For web, use setTimeout to defer to next event loop
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      // For React Native, use InteractionManager for smoother performance
      await new Promise(resolve => {
        InteractionManager.runAfterInteractions(() => {
          resolve();
        });
      });
    }
    
    try {
      // Add another small delay to ensure loading animation is visible
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
      
      const out = await processText(op, input);
      console.log('Raw WASM output:', out);
      // Store for debugging
      window.lastWasmOutput = out;
      
      // Better debug logging for TaskGraph
      if (out?.success && out?.data) {
        try {
          const parsed = JSON.parse(out.data);
          console.log('TaskGraph found:', parsed.task_graph ? 'YES' : 'NO');
          if (parsed.task_graph) {
            console.log('TaskGraph details:', {
              totalTasks: parsed.task_graph.total_tasks,
              tasks: parsed.task_graph.tasks?.length || 0,
              relationships: parsed.task_graph.relationships?.length || 0
            });
          }
        } catch (e) {
          console.error('Error parsing data for TaskGraph check:', e);
        }
      }
      
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
              console.log('FULL PARSED DATA:', parsed);
              console.log('KEYS IN PARSED DATA:', Object.keys(parsed));
              console.log('TASK_GRAPH IN DATA:', parsed.task_graph);
              console.log('PROMPT_GRADE IN DATA:', parsed.prompt_grade);
              console.log('Has prompt_grade key?', 'prompt_grade' in parsed);
              if (parsed.prompt_grade) {
                console.log('PromptGrade details:', {
                  overallGrade: parsed.prompt_grade.overall_grade,
                  understandability: parsed.prompt_grade.understandability?.score,
                  specificity: parsed.prompt_grade.specificity?.score,
                  suggestions: parsed.prompt_grade.suggestions?.length
                });
              }
              setResult(data);
              setParsedResult(parsed);
              // Expose for debugging
              window.parsedResult = parsed;
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
      // Add a small delay before hiding the loading animation for smooth transition
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  };

  // Helper function to get available tabs
  const getAvailableTabs = () => {
    const tabs = [];
    
    if (parsedResult?.prompt_grade !== undefined) {
      tabs.push({ key: 'promptgrade', label: '📊 Grade', icon: '📊' });
    }
    
    if (parsedResult?.prompt_grade?.suggestions?.length > 0) {
      tabs.push({ 
        key: 'suggestions', 
        label: `💡 Suggestions (${parsedResult.prompt_grade.suggestions.length})`, 
        icon: '💡' 
      });
    }
    
    if (parsedResult?.task_graph !== undefined) {
      tabs.push({ key: 'taskgraph', label: '🎯 Tasks', icon: '🎯' });
    }
    
    if (parsedResult?.idea_analysis || parsedResult?.insights) {
      tabs.push({ key: 'insights', label: '🔍 Insights', icon: '🔍' });
    }
    
    tabs.push({ key: 'metrics', label: '📊 Metrics', icon: '📊' });
    tabs.push({ key: 'raw', label: '🔧 Raw', icon: '🔧' });
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();
  const isNarrowScreen = screenWidth < 768; // Consider screens under 768px as narrow

  return (
    <SafeAreaView style={styles.safe}>
      <LoadingProgress isAnalyzing={isAnalyzing} promptText={input} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

          {/* Input Section with Enhanced Design */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.sectionLabel}>Text Analysis Input</Text>
                <Text style={styles.inputSubtitle}>Enter text to analyze for tasks, complexity, and insights</Text>
              </View>
              <View style={styles.inputHeaderButtons}>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => setUseEnhancedEditor(!useEnhancedEditor)}
                >
                  <Text style={styles.headerButtonText}>
                    {useEnhancedEditor ? '📝 Simple' : '✨ Enhanced'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => setShowExamples(!showExamples)}
                >
                  <Text style={styles.headerButtonText}>
                    {showExamples ? '✕ Close' : '💡 Examples'}
                  </Text>
                </Pressable>
              </View>
            </View>
            
            {/* Example Prompts */}
            {showExamples && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.examplesContainer}
                contentContainerStyle={styles.examplesContent}
              >
                {examplePrompts.map((example, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.exampleCard,
                      example.category === 'complex' && styles.exampleCardComplex,
                      example.category === 'medium' && styles.exampleCardMedium,
                    ]}
                    onPress={() => {
                      setInput(example.text);
                      setShowExamples(false);
                    }}
                  >
                    <Text style={styles.exampleTitle}>{example.title}</Text>
                    <Text style={styles.examplePreview} numberOfLines={2}>
                      {example.text}
                    </Text>
                    <View style={[
                      styles.exampleBadge,
                      example.category === 'complex' && styles.exampleBadgeComplex,
                      example.category === 'medium' && styles.exampleBadgeMedium,
                    ]}>
                      <Text style={styles.exampleBadgeText}>
                        {example.category.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            
            {useEnhancedEditor ? (
              <View style={styles.enhancedEditorWrapper}>
                <MarkdownTextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type or paste your text here...\n\nSupports **markdown** formatting for better text organization."
                />
              </View>
            ) : (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  multiline
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type or paste your text here...\n\nTry describing a workflow, project plan, or any text with sequential tasks."
                  placeholderTextColor="#94a3b8"
                />
                <View style={styles.inputFooter}>
                  <Text style={styles.charCount}>
                    {input.length} characters • {input.split(' ').filter(w => w).length} words
                  </Text>
                  {input.length > 0 && (
                    <Pressable
                      style={styles.clearButton}
                      onPress={() => setInput('')}
                    >
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

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
            <Pressable 
              style={[styles.btnPrimary, isAnalyzing && styles.btnPrimaryAnalyzing]} 
              onPress={() => {
                if (!isAnalyzing && ready) {
                  // Immediate feedback
                  setIsAnalyzing(true);
                  // Run analysis after state update
                  setTimeout(() => run('analyze'), 10);
                }
              }} 
              disabled={!ready || isAnalyzing}
            >
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
          
          {/* Tab Navigation - Only show for analyze operation */}
          {parsedResult && parsedResult.complexity_metrics && (
            <View style={styles.tabContainer}>
              {isNarrowScreen ? (
                // Mobile: Show gear icon with bottom sheet
                <View style={styles.mobileTabContainer}>
                  <Text style={styles.currentTabLabel}>
                    {availableTabs.find(tab => tab.key === activeTab)?.label || 'Analysis'}
                  </Text>
                  <Pressable 
                    style={styles.moreAnalysisButton}
                    onPress={() => setShowTabSelector(true)}
                  >
                    <Text style={styles.gearIcon}>⚙️</Text>
                    <Text style={styles.moreAnalysisText}>More analysis</Text>
                  </Pressable>
                </View>
              ) : (
                // Desktop: Show all tabs in ScrollView
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabScrollContent}
                >
                  {availableTabs.map((tab) => (
                    <Pressable 
                      key={tab.key}
                      style={[styles.simpleTab, activeTab === tab.key && styles.simpleActiveTab]}
                      onPress={() => setActiveTab(tab.key)}
                    >
                      <Text style={[styles.simpleTabText, activeTab === tab.key && styles.simpleActiveTabText]}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
          
          {/* Tab Content */}
          {result ? (
            parsedResult && parsedResult.complexity_metrics ? (
              // Analysis results with tabs
              activeTab === 'promptgrade' ? (
                <PromptGradeTab data={parsedResult} />
              ) : activeTab === 'suggestions' ? (
                <SuggestionsTab data={parsedResult} />
              ) : activeTab === 'taskgraph' ? (
                parsedResult.task_graph ? (
                  <TaskGraph taskGraphData={parsedResult.task_graph} />
                ) : (
                  <View style={styles.output}>
                    <Text style={styles.code}>No task graph data available. Tasks found: {parsedResult.task_graph?.total_tasks || 0}</Text>
                  </View>
                )
              ) : activeTab === 'insights' ? (
                <InsightsTab data={parsedResult} />
              ) : activeTab === 'metrics' ? (
                <EnhancedResultDisplay data={parsedResult} />
              ) : activeTab === 'raw' ? (
                <ScrollView style={styles.output} contentContainerStyle={styles.outputContent}>
                  <Text selectable style={styles.code}>{result}</Text>
                </ScrollView>
              ) : null
            ) : (
              // Simple text results (uppercase, lowercase, wordcount)
              <View style={styles.simpleResultContainer}>
                <Text style={styles.simpleResultText}>{result}</Text>
              </View>
            )
          ) : null}

          <Text style={styles.footer}>Made with Go + WASM</Text>
        </View>

        <StatusBar style="light" />
      </ScrollView>

      {/* Tab Selector Modal for Mobile */}
      <Modal
        visible={showTabSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTabSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setShowTabSelector(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Analysis View</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowTabSelector(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.tabOptions}>
              {availableTabs.map((tab) => (
                <Pressable 
                  key={tab.key}
                  style={[
                    styles.tabOption,
                    activeTab === tab.key && styles.activeTabOption
                  ]}
                  onPress={() => {
                    setActiveTab(tab.key);
                    setShowTabSelector(false);
                  }}
                >
                  <Text style={styles.tabOptionIcon}>{tab.icon}</Text>
                  <Text style={[
                    styles.tabOptionText,
                    activeTab === tab.key && styles.activeTabOptionText
                  ]}>
                    {tab.label}
                  </Text>
                  {activeTab === tab.key && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  content: {
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
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputSection: {
    marginVertical: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inputLabelContainer: {
    flex: 1,
  },
  inputSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  inputHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea',
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  examplesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea',
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  examplesButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  examplesContainer: {
    marginBottom: 12,
    maxHeight: 140,
  },
  examplesContent: {
    paddingRight: 16,
    gap: 12,
  },
  exampleCard: {
    width: 200,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exampleCardComplex: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  exampleCardMedium: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  examplePreview: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  exampleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  exampleBadgeComplex: {
    backgroundColor: '#f59e0b',
  },
  exampleBadgeMedium: {
    backgroundColor: '#3b82f6',
  },
  exampleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  enhancedEditorWrapper: {
    width: '100%',
    flex: 1,
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
  tabContainer: {
    marginBottom: 16,
  },
  tabScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  simpleTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  simpleActiveTab: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  simpleTabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  simpleActiveTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Mobile tab styles
  mobileTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentTabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  moreAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gearIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  moreAnalysisText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  tabOptions: {
    maxHeight: 400,
  },
  tabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activeTabOption: {
    backgroundColor: '#eff6ff',
  },
  tabOptionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  tabOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  activeTabOptionText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '600',
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
    minHeight: 140,
    padding: 16,
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  charCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
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
  btnPrimaryAnalyzing: {
    backgroundColor: '#64748b',
    opacity: 0.9,
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
  simpleResultContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginVertical: 8,
  },
  simpleResultText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
