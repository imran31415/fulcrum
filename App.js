import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, TouchableOpacity, ScrollView, SafeAreaView, Platform, InteractionManager, Dimensions, Modal } from 'react-native';
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
import CompactLoadingProgress from './src/components/CompactLoadingProgress';
import MarkdownTextInput from './src/components/MarkdownTextInput';
import InteractiveTextInput from './src/components/InteractiveTextInput';
import DragDivider from './src/components/DragDivider';
import PromptLibrary from './src/components/PromptLibrary';
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
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  // State for draggable pane widths
  const [leftPaneWidth, setLeftPaneWidth] = useState(0.35); // Default to 35% as it was before
  const [isDragging, setIsDragging] = useState(false);
  const [initialLeftPaneWidth, setInitialLeftPaneWidth] = useState(0.35);
  // Interactive input state
  const [useInteractiveInput, setUseInteractiveInput] = useState(true);
  // Prompt Library state
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  // Right pane view state
  const [rightPaneView, setRightPaneView] = useState('library'); // 'library' or 'analysis'

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
      // Switch to analysis view when running analysis
      setRightPaneView('analysis');
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

  // Drag handling logic
  const handleDrag = (deltaX, isDragEnd = false, isDragStart = false) => {
    if (isDragStart) {
      setIsDragging(true);
      setInitialLeftPaneWidth(leftPaneWidth);
      return;
    }
    
    if (isDragEnd) {
      setIsDragging(false);
      return;
    }
    
    if (deltaX !== null) {
      // Calculate new width as percentage of screen width
      const deltaPercentage = deltaX / screenWidth;
      let newLeftPaneWidth = initialLeftPaneWidth + deltaPercentage;
      
      // Constrain to reasonable bounds (20% to 70%)
      newLeftPaneWidth = Math.max(0.2, Math.min(0.7, newLeftPaneWidth));
      
      setLeftPaneWidth(newLeftPaneWidth);
    }
  };

  const availableTabs = getAvailableTabs();
  const isNarrowScreen = screenWidth < 768; // Consider screens under 768px as narrow
  const isWideScreen = screenWidth >= 1024; // IDE mode for screens 1024px and wider (reduced threshold)
  const isWebPlatform = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Mount native WebView bridge invisibly on iOS/Android */}
        {Platform.OS !== 'web' ? <WasmProvider /> : null}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>Zero Tokens</Text>
            <View style={styles.statusRow}>
              <View style={styles.tokensBadge}><Text style={styles.tokensBadgeText}>TOKENS USED: ZERO</Text></View>
              <View style={[styles.statusDot, ready ? styles.statusDotReady : styles.statusDotInit]} />
              <Text style={styles.statusText}>{ready ? 'WASM ready' : 'Initializing'}</Text>
              {isWideScreen && isWebPlatform && (
                <Text style={styles.ideMode}>IDE Mode</Text>
              )}
            </View>
          </View>

          {/* IDE Layout for Wide Screens */}
          {isWideScreen && isWebPlatform ? (
            <View style={styles.ideLayout}>
              {/* Left Pane - Input and Controls */}
              <View style={[styles.leftPane, { width: `${leftPaneWidth * 100}%` }]}>
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
                {parsedResult?.prompt_grade?.suggestions && (
                  <Pressable
                    style={[styles.headerButton, useInteractiveInput && styles.headerButtonActive]}
                    onPress={() => setUseInteractiveInput(!useInteractiveInput)}
                  >
                    <Text style={[styles.headerButtonText, useInteractiveInput && styles.headerButtonActiveText]}>
                      {useInteractiveInput ? '🎯 Interactive' : '💫 Enable Tips'}
                    </Text>
                  </Pressable>
                )}
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
            
            
            {useEnhancedEditor ? (
              <View style={styles.enhancedEditorWrapper}>
                {useInteractiveInput && parsedResult?.prompt_grade?.suggestions ? (
                  <InteractiveTextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type or paste your text here...\n\nSupports **markdown** formatting for better text organization."
                    suggestions={parsedResult.prompt_grade.suggestions}
                    showSuggestions={true}
                    onSuggestionClick={(suggestion, position) => {
                      console.log('Suggestion clicked:', suggestion.message, 'at position:', position);
                    }}
                  />
                ) : (
                  <MarkdownTextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type or paste your text here...\n\nSupports **markdown** formatting for better text organization."
                  />
                )}
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

                {/* Primary Action - Only Analyze button */}
                <View style={styles.primaryActionContainer}>
                  <Pressable 
                    style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]} 
                    onPress={() => {
                      if (!isAnalyzing && ready) {
                        setIsAnalyzing(true);
                        setTimeout(() => run('analyze'), 10);
                      }
                    }} 
                    disabled={!ready || isAnalyzing}
                  >
                    <Text style={styles.analyzeButtonText}>{isAnalyzing ? 'Analyzing...' : 'Analyze Text'}</Text>
                  </Pressable>
                  
                  {/* Utility Actions Menu */}
                  <Pressable 
                    style={styles.utilityMenuButton}
                    onPress={() => setShowUtilityMenu(!showUtilityMenu)}
                  >
                    <Text style={styles.utilityMenuIcon}>⋯</Text>
                  </Pressable>
                </View>
                
                {/* Utility Menu Dropdown */}
                {showUtilityMenu && (
                  <View style={styles.utilityMenu}>
                    <Pressable 
                      style={styles.utilityMenuItem} 
                      onPress={() => {
                        run('uppercase');
                        setShowUtilityMenu(false);
                      }} 
                      disabled={!ready || isAnalyzing}
                    >
                      <Text style={styles.utilityMenuItemText}>📝 Uppercase</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.utilityMenuItem} 
                      onPress={() => {
                        run('lowercase');
                        setShowUtilityMenu(false);
                      }} 
                      disabled={!ready || isAnalyzing}
                    >
                      <Text style={styles.utilityMenuItemText}>🔤 Lowercase</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.utilityMenuItem} 
                      onPress={() => {
                        run('wordcount');
                        setShowUtilityMenu(false);
                      }} 
                      disabled={!ready || isAnalyzing}
                    >
                      <Text style={styles.utilityMenuItemText}>📊 Word Count</Text>
                    </Pressable>
                  </View>
                )}

                {/* Error */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>
              
              {/* Draggable Divider */}
              <DragDivider 
                onDrag={handleDrag} 
                isDragging={isDragging}
              />
              
              {/* Right Pane - Library/Analysis */}
              <View style={[styles.rightPane, { width: `${(1 - leftPaneWidth) * 100}%` }]}>
                <View style={styles.rightPaneHeader}>
                  <View style={styles.rightPaneTitleContainer}>
                    <Text style={styles.rightPaneTitle}>
                      {rightPaneView === 'library' ? 'Prompt Library' : 'Analysis Results'}
                    </Text>
                    {rightPaneView === 'analysis' && parsedResult && parsedResult.performance_metrics && (
                      <PerformanceCompact performanceData={parsedResult.performance_metrics} />
                    )}
                  </View>
                  
                  {/* Right Pane View Toggle */}
                  <View style={styles.rightPaneToggle}>
                    <TouchableOpacity
                      style={[
                        styles.rightPaneToggleButton,
                        rightPaneView === 'library' && styles.rightPaneToggleButtonActive
                      ]}
                      onPress={() => setRightPaneView('library')}
                    >
                      <Text style={[
                        styles.rightPaneToggleText,
                        rightPaneView === 'library' && styles.rightPaneToggleTextActive
                      ]}>
                        📚 Library
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.rightPaneToggleButton,
                        rightPaneView === 'analysis' && styles.rightPaneToggleButtonActive
                      ]}
                      onPress={() => setRightPaneView('analysis')}
                    >
                      <Text style={[
                        styles.rightPaneToggleText,
                        rightPaneView === 'analysis' && styles.rightPaneToggleTextActive
                      ]}>
                        📊 Analysis
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Right Pane Content - Library or Analysis */}
                {rightPaneView === 'library' ? (
                  <View style={styles.libraryContent}>
                    <PromptLibrary
                      visible={true}
                      embedded={true}
                      onClose={() => {}}
                      onSelectPrompt={(template) => {
                        setInput(template);
                        setRightPaneView('library'); // Stay in library view
                      }}
                    />
                  </View>
                ) : (
                  /* Analysis Content */
                  result && parsedResult && parsedResult.complexity_metrics ? (
                    <View style={styles.analysisContent}>
                      {/* Tab selector for analysis */}
                      <View style={styles.rightPaneTabs}>
                        {availableTabs.map((tab) => (
                          <Pressable 
                            key={tab.key}
                            style={[styles.rightPaneTab, activeTab === tab.key && styles.rightPaneActiveTab]}
                            onPress={() => setActiveTab(tab.key)}
                          >
                            <Text style={styles.rightPaneTabIcon}>{tab.icon}</Text>
                            <Text style={[styles.rightPaneTabText, activeTab === tab.key && styles.rightPaneActiveTabText]}>
                              {tab.label.replace(/📊|💡|🎯|🔍|🔧/g, '').trim()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      
                      {/* Analysis content */}
                      <View style={styles.rightPaneContent}>
                        {isAnalyzing && (
                          <View style={styles.rightPaneLoadingOverlay}>
                            <CompactLoadingProgress isAnalyzing={isAnalyzing} promptText={input} />
                          </View>
                        )}
                        {activeTab === 'promptgrade' ? (
                          <PromptGradeTab data={parsedResult} />
                        ) : activeTab === 'suggestions' ? (
                          <SuggestionsTab 
                            data={parsedResult}
                            onApplySuggestion={(s) => {
                              const scaffold = buildScaffoldFromSuggestion(s, parsedResult);
                              if (scaffold) {
                                setInput((prev) => prev + (prev.endsWith('\n') ? '' : '\n\n') + scaffold);
                              }
                            }}
                          />
                        ) : activeTab === 'taskgraph' ? (
                          parsedResult.task_graph ? (
                            <TaskGraph taskGraphData={parsedResult.task_graph} />
                          ) : (
                            <View style={styles.noData}>
                              <Text style={styles.noDataText}>No task graph data available</Text>
                            </View>
                          )
                        ) : activeTab === 'insights' ? (
                          <InsightsTab data={parsedResult} />
                        ) : activeTab === 'metrics' ? (
                          <EnhancedResultDisplay data={parsedResult} />
                        ) : activeTab === 'raw' ? (
                          <ScrollView style={styles.rawContent}>
                            <Text selectable style={styles.rawText}>{result}</Text>
                          </ScrollView>
                        ) : null}
                      </View>
                    </View>
                  ) : result ? (
                    <View style={styles.simpleResult}>
                      <Text style={styles.simpleResultText}>{result}</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyResults}>
                      <Text style={styles.emptyResultsText}>
                        {rightPaneView === 'analysis' ? 'Run analysis to see results' : 'Browse prompts to get started'}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          ) : (
            // Non-IDE layout for smaller screens
            <>
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
                    {parsedResult?.prompt_grade?.suggestions && (
                      <Pressable
                        style={[styles.headerButton, useInteractiveInput && styles.headerButtonActive]}
                        onPress={() => setUseInteractiveInput(!useInteractiveInput)}
                      >
                        <Text style={[styles.headerButtonText, useInteractiveInput && styles.headerButtonActiveText]}>
                          {useInteractiveInput ? '🎯 Interactive' : '💫 Enable Tips'}
                        </Text>
                      </Pressable>
                    )}
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
                
                
                {useEnhancedEditor ? (
                  <View style={styles.enhancedEditorWrapper}>
                    {useInteractiveInput && parsedResult?.prompt_grade?.suggestions ? (
                      <InteractiveTextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type or paste your text here...\n\nSupports **markdown** formatting for better text organization."
                        suggestions={parsedResult.prompt_grade.suggestions}
                        showSuggestions={true}
                        onSuggestionClick={(suggestion, position) => {
                          console.log('Suggestion clicked:', suggestion.message, 'at position:', position);
                        }}
                      />
                    ) : (
                      <MarkdownTextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type or paste your text here...\n\nSupports **markdown** formatting for better text organization."
                      />
                    )}
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
                      setIsAnalyzing(true);
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
              <View style={styles.nonIdeResultsContainer}>
                {isAnalyzing && (
                  <View style={styles.nonIdeLoadingOverlay}>
                    <CompactLoadingProgress isAnalyzing={isAnalyzing} promptText={input} />
                  </View>
                )}
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
              </View>
            </>
          )}

          <Text style={styles.footer}>Made with Go + WASM</Text>
        </View>

        <StatusBar style="light" />
      </ScrollView>

      {/* Simple scaffold builder for applying suggestions */}
      {/* Keep near bottom-level so it's defined before use */}
      
      function buildScaffoldFromSuggestion(s, parsed) {
        const dim = (s?.dimension || '').toLowerCase();
        const msg = (s?.message || '').toLowerCase();
        const meta = parsed?.prompt_grade?.suggestion_meta || {};
        const ptype = (meta?.prompt_type || '').toLowerCase();
        const includesAny = (str, arr) => arr.some(a => str.includes(a));

        // Targeted scaffolds based on message and prompt type
        if (includesAny(msg, ['non-functional requirements', 'performance', 'slas', 'security']) || (ptype === 'technical_spec' && dim.includes('context'))) {
          return `## Context
- Runtime: <Node.js 20 | Python 3.11>
- Framework: <Express | FastAPI>
- Database: <Postgres 15>
- Hosting: <AWS Lambda>
- Non-Functional: p95 latency < 200ms, 99.9% uptime, rate-limit 100 rps
- Security: OAuth2/JWT, input validation, logging + metrics
`;
        }
        
        if (includesAny(msg, ['interface shapes', 'schemas', 'endpoint contracts']) || (ptype === 'code_generation' && dim.includes('specific'))) {
          return `## Interfaces / Contracts
Input (JSON):
{
  "id": "string",
  "name": "string",
  "status": "active|inactive"
}

Output (JSON):
{
  "ok": true,
  "errors": []
}
`;
        }
        
        if (includesAny(msg, ['deliverables', 'step-by-step', 'steps']) || dim.includes('action')) {
          return `## Deliverables / Steps
1) Database schema (SQL or migration)
2) API endpoints (OpenAPI spec)
3) Implementation (handlers/services)
4) Unit tests (covering success + failure cases)
5) README with run + test instructions
`;
        }
        
        if (includesAny(msg, ['tests', 'observability', 'logging', 'metrics']) || dim.includes('quality')) {
          return `## Quality
- Tests: unit, integration (mock external services)
- Observability: structured logs, metrics (request_count, error_rate, latency)
- Error handling: retries (exponential backoff) on 5xx, idempotency
`;
        }

        if (includesAny(msg, ['split into phases', 'separate prompts']) || dim.includes('scope')) {
          return `## Phases
Phase 1: Ingestion (receive + validate payloads)
Phase 2: Processing (business rules + persistence)
Phase 3: Exports (notifications or downstream updates)
`;
        }

        // Data analysis specific scaffolds
        if (ptype === 'data_analysis' && includesAny(msg, ['dataset fields', 'time window', 'filters'])) {
          return `## Dataset Specification
- Tables/files: <customers.csv>, <events.csv>
- Key fields: customer_id, plan, mrr, signup_date, last_active_at, churned_at
- Time window: <2024-01-01 .. 2024-12-31>
- Filters: <active customers>, <region = US>
- Join keys: customers.customer_id = events.customer_id
`;
        }

        if (ptype === 'data_analysis' && includesAny(msg, ['analysis methods', 'output artifacts'])) {
          return `## Analysis Plan
- EDA: distributions, missingness, correlations
- Cohorts: by acquisition channel, plan
- Modeling: logistic regression + random forest (compare AUC/F1)
- Validation: train/valid split, cross-validation, ROC/PR curves
- Deliverables: notebook, dashboard (key charts), executive summary PDF
`;
        }

        if (ptype === 'data_analysis' && includesAny(msg, ['convert open questions'])) {
          return `## Questions → Tasks
- Q: What drives churn most? → T: Fit logit with standardized features; report top coefficients (±CI)
- Q: Which segments at risk? → T: Predict risk; list top 5 segments by lift
- Q: What action reduces churn? → T: Simulate retention uplift scenarios and expected ROI
`;
        }

        // Creative/Writing brief
        if ((ptype === 'creative_task' || ptype === 'writing') && includesAny(msg, ['audience', 'tone', "do/don't", 'style'])) {
          return `## Creative Brief
- Audience: <who>
- Tone/Voice: <e.g., practical, friendly>
- Style: <short sentences, active voice>
- Do: <short bullets>
- Don't: <avoid clichés>
- Key messages: <list>
`;
        }

        if ((ptype === 'creative_task' || ptype === 'writing') && includesAny(msg, ['reference examples', 'links'])) {
          return `## References
- <https://example.com/reference-1>
- <https://example.com/reference-2>
- Notes: emulate structure; adapt tone to Audience above
`;
        }

        // Learning curriculum
        if (ptype === 'learning' && includesAny(msg, ['learning objectives', 'timeline'])) {
          return `## Learning Objectives & Timeline
- Objectives: <list three measurable outcomes>
- Timeline: 4 weeks, 10h/week
- Prereqs: <list>
`;
        }

        if (ptype === 'learning' && includesAny(msg, ['curriculum', 'exercises', 'assessments'])) {
          return `## Curriculum (4 Weeks)
Week 1: Basics — theory 15m, code demo, 1 exercise, quiz
Week 2: Feature engineering + validation — demo, exercise, quiz
Week 3: Modeling — logit + trees; metrics; project exercise
Week 4: Deployment basics + wrap-up — capstone + assessment
`;
        }

        // General clarifying questions
        if (includesAny(msg, ['clarifying questions'])) {
          return `## Clarifying Questions
1) What are success criteria and constraints?
2) What inputs/outputs and formats are expected?
3) What environment and dependencies apply?
4) Any non-functional requirements (perf, security, SLA)?
5) Are examples or references available?
`;
        }

        // Default fallback: return example if present
        if (s?.example) {
          return `## Example
${s.example}
`;
        }
        return '';
      }
      
      {/* Analysis summary tooltip */}
      {analysisSummary?.visible && (
        <View style={styles.summaryTooltip}>
          <Text style={styles.summaryText}>{analysisSummary.text}</Text>
        </View>
      )}

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

      {/* Examples Modal */}
      <Modal
        visible={showExamples}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExamples(false)}
      >
        <View style={styles.examplesModalOverlay}>
          <Pressable 
            style={styles.examplesModalBackground} 
            onPress={() => setShowExamples(false)}
          />
          <View style={styles.examplesModal}>
            <View style={styles.examplesModalHeader}>
              <Text style={styles.examplesModalTitle}>Example Prompts</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowExamples(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.examplesModalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.examplesModalSubtitle}>
                Select a pre-written prompt to get started quickly
              </Text>
              
              {examplePrompts.map((example, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.exampleModalCard,
                    example.category === 'complex' && styles.exampleModalCardComplex,
                    example.category === 'medium' && styles.exampleModalCardMedium,
                  ]}
                  onPress={() => {
                    setInput(example.text);
                    setShowExamples(false);
                  }}
                >
                  <View style={styles.exampleModalCardHeader}>
                    <Text style={styles.exampleModalTitle}>{example.title}</Text>
                    <View style={[
                      styles.exampleModalBadge,
                      example.category === 'complex' && styles.exampleModalBadgeComplex,
                      example.category === 'medium' && styles.exampleModalBadgeMedium,
                    ]}>
                      <Text style={styles.exampleModalBadgeText}>
                        {example.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.exampleModalPreview} numberOfLines={3}>
                    {example.text}
                  </Text>
                  <View style={styles.exampleModalFooter}>
                    <Text style={styles.exampleModalWordCount}>
                      {example.text.split(' ').length} words
                    </Text>
                    <Text style={styles.exampleModalAction}>Tap to use →</Text>
                  </View>
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
    paddingHorizontal: 8, // Reduced padding for more screen space
    paddingTop: 8,
    paddingBottom: 20,
  },
  content: {
    width: '100%',
    maxWidth: 1600, // Increased for better wide screen support
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
  headerButtonActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtonActiveText: {
    color: '#ffffff',
    fontWeight: '700',
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
    minHeight: 300,
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
  // IDE Layout styles
  ideMode: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ideLayout: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'stretch',
    minHeight: 600,
    maxWidth: '100%', // Ensure full width usage
  },
  leftPane: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'visible', // Allow utility menu to show outside
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    marginRight: 4, // Small margin for the divider
  },
  rightPane: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 4, // Small margin for the divider
  },
  rightPaneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  rightPaneTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightPaneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  rightPaneToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  rightPaneToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rightPaneToggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  rightPaneToggleText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  rightPaneToggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  libraryContent: {
    flex: 1,
  },
  analysisContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  rightPaneTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fafafa',
    flexWrap: 'wrap',
    gap: 6,
  },
  rightPaneTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  rightPaneActiveTab: {
    backgroundColor: '#2563eb',
  },
  rightPaneTabIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  rightPaneTabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  rightPaneActiveTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  rightPaneContent: {
    flex: 1,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  simpleResult: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    margin: 16,
    borderRadius: 8,
  },
  noData: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  rawContent: {
    flex: 1,
    padding: 16,
  },
  rawText: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    lineHeight: 18,
  },
  // IDE Action Styles
  primaryActionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  utilityMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityMenuIcon: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  utilityMenu: {
    position: 'absolute',
    right: 16,
    bottom: 60,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
    zIndex: 1000,
  },
  utilityMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  utilityMenuItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  // Examples Modal Styles
  examplesModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examplesModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  examplesModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  examplesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  examplesModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  examplesModalContent: {
    maxHeight: 500,
  },
  examplesModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exampleModalCard: {
    marginHorizontal: 24,
    marginVertical: 8,
    padding: 16,
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
  exampleModalCardComplex: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  exampleModalCardMedium: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  exampleModalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exampleModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  exampleModalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  exampleModalBadgeComplex: {
    backgroundColor: '#f59e0b',
  },
  exampleModalBadgeMedium: {
    backgroundColor: '#3b82f6',
  },
  exampleModalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  exampleModalPreview: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  exampleModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleModalWordCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  exampleModalAction: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  // Loading Overlay Styles
  rightPaneLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  nonIdeResultsContainer: {
    position: 'relative',
  },
  nonIdeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
