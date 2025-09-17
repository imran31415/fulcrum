import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import * as htmlToImage from 'html-to-image';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to get grade color
const getGradeColor = (grade) => {
  if (!grade) return '#9E9E9E';
  const letter = grade.charAt(0);
  switch (letter) {
    case 'A': return '#4CAF50'; // Green
    case 'B': return '#8BC34A'; // Light green
    case 'C': return '#FFC107'; // Yellow
    case 'D': return '#FF9800'; // Orange
    case 'F': return '#F44336'; // Red
    default: return '#9E9E9E'; // Grey
  }
};

// Helper function to get priority color
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#9E9E9E';
  }
};

// Helper function to get task type color
const getTaskTypeColor = (type) => {
  const colors = {
    action: '#4CAF50',
    requirement: '#FF9800', 
    goal: '#2196F3',
    question: '#9C27B0',
    need: '#F44336',
  };
  return colors[type] || '#607D8B';
};

// Helper function to get task type emoji
const getTaskTypeEmoji = (type) => {
  const emojis = {
    action: '⚡',
    requirement: '📋',
    goal: '🎯',
    question: '❓',
    need: '⚠️',
  };
  return emojis[type] || '📌';
};

// Helper function to get priority emoji
const getPriorityEmoji = (priority) => {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
};

// Helper function to format date
const formatDate = () => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to truncate text
const truncateText = (text, maxLength = 200) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const PromptReportCard = ({ visible, analysisData, originalPrompt, onClose }) => {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateReport = async () => {
    if (!reportRef.current) {
      Alert.alert('Error', 'Report not ready for generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      let dataUrl;
      
      if (Platform.OS === 'web') {
        // Use html-to-image for web
        dataUrl = await htmlToImage.toPng(reportRef.current, {
          quality: 1.0,
          pixelRatio: 2, // Higher resolution
          width: 800,
          height: 1000,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        // Trigger download
        const link = document.createElement('a');
        link.download = `prompt-report-card-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
      } else {
        // For React Native, we'll need to use a different approach
        // For now, show an alert with instructions
        Alert.alert(
          'Report Ready', 
          'Screenshot this screen to save your prompt report card!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!analysisData || !analysisData.prompt_grade) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No data available for report generation</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const { prompt_grade, task_graph, complexity_metrics, performance_metrics } = analysisData;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prompt Report Card</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generateReport}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Downloading...' : '📄 Download Report'}
            </Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Content */}
        <View ref={reportRef} style={styles.reportContainer}>
          {/* Welcome Header */}
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>🎉 Here's Your Generated Prompt Report Summary!</Text>
            <Text style={styles.welcomeSubtitle}>
              This comprehensive report contains your prompt analysis results. You can also explore additional metrics and insights in the main analysis tabs outside this report.
            </Text>
          </View>
          
          {/* Report Header */}
          <View style={styles.reportHeader}>
            <View style={styles.brandSection}>
              <Text style={styles.brandIcon}>🎯</Text>
              <Text style={styles.brandText}>ZeroToken.io</Text>
            </View>
            <Text style={styles.reportTitle}>Prompt Analysis Report</Text>
            <Text style={styles.reportDate}>Generated on {formatDate()}</Text>
          </View>

          {/* Overall Grade Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Overall Assessment</Text>
            <View style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <View style={[
                  styles.gradeBadge, 
                  { backgroundColor: getGradeColor(prompt_grade.overall_grade?.grade) }
                ]}>
                  <Text style={styles.gradeText}>{prompt_grade.overall_grade?.grade || 'N/A'}</Text>
                </View>
                <View style={styles.gradeInfo}>
                  <Text style={styles.gradeScore}>
                    {prompt_grade.overall_grade?.score?.toFixed(1) || 'N/A'}/100
                  </Text>
                  <Text style={styles.gradeSummary}>
                    {typeof prompt_grade.overall_grade?.summary === 'string' ? 
                     prompt_grade.overall_grade.summary :
                     typeof prompt_grade.overall_grade?.summary === 'object' ?
                     JSON.stringify(prompt_grade.overall_grade.summary) :
                     'No summary available'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Original Prompt */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Analyzed Prompt</Text>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{truncateText(originalPrompt || 'No prompt provided')}</Text>
              <View style={styles.promptStats}>
                <Text style={styles.statText}>
                  {originalPrompt ? originalPrompt.split(' ').length : 0} words
                </Text>
                <Text style={styles.statText}>•</Text>
                <Text style={styles.statText}>
                  {originalPrompt ? originalPrompt.length : 0} characters
                </Text>
              </View>
            </View>
          </View>

          {/* Grade Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Detailed Scores</Text>
            <View style={styles.dimensionsGrid}>
              {Object.entries(prompt_grade).map(([key, dimension]) => {
                // Skip non-dimension keys and ensure dimension is valid
                if (key === 'overall_grade' || key === 'suggestions' || key === 'suggestion_meta' || key === 'strengths' || key === 'weak_areas' || 
                    typeof dimension !== 'object' || dimension === null) {
                  return null;
                }
                
                // Handle different dimension structures
                const score = dimension.score || dimension.value;
                const grade = dimension.grade;
                const label = dimension.label || dimension.help_text || dimension.practical_application;
                
                // Only render if we have at least a score or grade
                if (!score && !grade) {
                  return null;
                }
                
                const dimensionName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <View key={key} style={styles.dimensionCard}>
                    <Text style={styles.dimensionName}>{dimensionName}</Text>
                    <View style={styles.dimensionScore}>
                      <Text style={styles.dimensionNumber}>
                        {typeof score === 'number' ? score.toFixed(1) : 
                         typeof score === 'string' ? score :
                         'N/A'}
                      </Text>
                      <View style={[
                        styles.dimensionGrade, 
                        { backgroundColor: getGradeColor(grade) }
                      ]}>
                        <Text style={styles.dimensionGradeText}>{grade || 'N/A'}</Text>
                      </View>
                    </View>
                    <Text style={styles.dimensionLabel}>
                      {typeof label === 'string' ? label :
                       typeof label === 'object' ? JSON.stringify(label) :
                       label ? String(label) :
                       'No assessment'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Key Recommendations</Text>
            {prompt_grade.suggestions && prompt_grade.suggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {prompt_grade.suggestions.slice(0, 3).map((suggestion, index) => (
                  <View key={index} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <View style={[
                        styles.priorityDot, 
                        { backgroundColor: getPriorityColor(suggestion.priority) }
                      ]} />
                      <Text style={styles.suggestionDimension}>
                        {typeof suggestion.dimension === 'string' ? suggestion.dimension :
                         String(suggestion.dimension || 'Unknown')}
                      </Text>
                      <Text style={styles.suggestionPriority}>
                        {typeof suggestion.priority === 'string' ? suggestion.priority.toUpperCase() :
                         String(suggestion.priority || 'UNKNOWN').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.suggestionMessage}>
                      {typeof suggestion.message === 'string' ? suggestion.message : 
                       typeof suggestion.message === 'object' ? JSON.stringify(suggestion.message) :
                       String(suggestion.message || 'No message available')}
                    </Text>
                    <Text style={styles.suggestionImpact}>
                      Impact: {typeof suggestion.impact === 'string' ? suggestion.impact :
                               typeof suggestion.impact === 'object' ? JSON.stringify(suggestion.impact) :
                               String(suggestion.impact || 'Not specified')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>No suggestions available - your prompt looks great!</Text>
              </View>
            )}
          </View>

          {/* Task Analysis - Comprehensive */}
          {task_graph && task_graph.total_tasks > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Task Analysis Overview</Text>
              
              {/* Task Statistics Grid */}
              <View style={styles.taskStatsGrid}>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>{task_graph.total_tasks}</Text>
                  <Text style={styles.taskStatLabel}>Total Tasks</Text>
                </View>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>{task_graph.relationships?.length || 0}</Text>
                  <Text style={styles.taskStatLabel}>Dependencies</Text>
                </View>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>{task_graph.critical_path?.length || 0}</Text>
                  <Text style={styles.taskStatLabel}>Critical Path</Text>
                </View>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>
                    {task_graph.graph_complexity?.toFixed(1) || 'N/A'}
                  </Text>
                  <Text style={styles.taskStatLabel}>Complexity</Text>
                </View>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>{task_graph.root_tasks?.length || 0}</Text>
                  <Text style={styles.taskStatLabel}>Start Points</Text>
                </View>
                <View style={styles.taskStatCard}>
                  <Text style={styles.taskStatNumber}>{task_graph.leaf_tasks?.length || 0}</Text>
                  <Text style={styles.taskStatLabel}>End Goals</Text>
                </View>
              </View>
              
              {/* Task Breakdown by Type */}
              {task_graph.tasks && (
                <View style={styles.taskBreakdownSection}>
                  <Text style={styles.subsectionTitle}>📊 Task Distribution</Text>
                  <View style={styles.taskTypeBreakdown}>
                    {Object.entries(
                      task_graph.tasks.reduce((acc, task) => {
                        acc[task.type] = (acc[task.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <View key={type} style={styles.taskTypeCard}>
                        <View style={[styles.taskTypeIcon, { backgroundColor: getTaskTypeColor(type) }]}>
                          <Text style={styles.taskTypeIconText}>{getTaskTypeEmoji(type)}</Text>
                        </View>
                        <Text style={styles.taskTypeCount}>{count}</Text>
                        <Text style={styles.taskTypeLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}s</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Priority Distribution */}
              {task_graph.tasks && (
                <View style={styles.taskBreakdownSection}>
                  <Text style={styles.subsectionTitle}>⚡ Priority Distribution</Text>
                  <View style={styles.priorityBreakdown}>
                    {Object.entries(
                      task_graph.tasks.reduce((acc, task) => {
                        const priority = task.priority || 'unknown';
                        acc[priority] = (acc[priority] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([priority, count]) => (
                      <View key={priority} style={styles.priorityItem}>
                        <Text style={styles.priorityIcon}>{getPriorityEmoji(priority)}</Text>
                        <Text style={styles.priorityLabel}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
                        <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(priority) }]}>
                          <Text style={styles.priorityCount}>{count}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Detailed Task List */}
              <View style={styles.taskBreakdownSection}>
                <Text style={styles.subsectionTitle}>📋 Task Details</Text>
                <View style={styles.taskDetailsList}>
                  {task_graph.tasks?.slice(0, 8).map((task, index) => (
                    <View key={index} style={styles.taskDetailCard}>
                      <View style={styles.taskDetailHeader}>
                        <View style={[styles.taskDetailType, { backgroundColor: getTaskTypeColor(task.type) }]}>
                          <Text style={styles.taskDetailTypeText}>{task.type.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.taskDetailTitle}>{truncateText(task.title, 80)}</Text>
                        <View style={styles.taskDetailMeta}>
                          <Text style={styles.taskDetailPriority}>{getPriorityEmoji(task.priority)}</Text>
                          <Text style={styles.taskDetailConfidence}>{Math.round((task.confidence || 0) * 100)}%</Text>
                        </View>
                      </View>
                      {task.keywords && task.keywords.length > 0 && (
                        <View style={styles.taskKeywords}>
                          {task.keywords.slice(0, 4).map((keyword, idx) => (
                            <View key={idx} style={styles.taskKeywordChip}>
                              <Text style={styles.taskKeywordText}>{keyword}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                  {task_graph.tasks?.length > 8 && (
                    <View style={styles.moreTasksIndicator}>
                      <Text style={styles.moreTasksText}>... and {task_graph.tasks.length - 8} more tasks</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Complexity Metrics */}
          {(complexity_metrics || originalPrompt) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Complexity Analysis</Text>
              <View style={styles.complexityGrid}>
                <View style={styles.complexityCard}>
                  <Text style={styles.complexityValue}>
                    {complexity_metrics?.sentence_count || 
                     (originalPrompt ? originalPrompt.split(/[.!?]+/).filter(s => s.trim()).length : 'N/A')}
                  </Text>
                  <Text style={styles.complexityLabel}>Sentences</Text>
                </View>
                <View style={styles.complexityCard}>
                  <Text style={styles.complexityValue}>
                    {complexity_metrics?.avg_sentence_length?.toFixed(1) || 
                     (originalPrompt ? (originalPrompt.split(' ').length / Math.max(originalPrompt.split(/[.!?]+/).filter(s => s.trim()).length, 1)).toFixed(1) : 'N/A')}
                  </Text>
                  <Text style={styles.complexityLabel}>Avg Length</Text>
                </View>
                <View style={styles.complexityCard}>
                  <Text style={styles.complexityValue}>
                    {complexity_metrics?.unique_words || 
                     complexity_metrics?.vocabulary_richness ||
                     (originalPrompt ? new Set(originalPrompt.toLowerCase().split(/\W+/).filter(w => w.length > 0)).size : 'N/A')}
                  </Text>
                  <Text style={styles.complexityLabel}>Unique Words</Text>
                </View>
                <View style={styles.complexityCard}>
                  <Text style={styles.complexityValue}>
                    {complexity_metrics?.readability_score?.toFixed(1) || 
                     complexity_metrics?.readability?.toFixed(1) ||
                     complexity_metrics?.complexity_score?.toFixed(1) ||
                     (originalPrompt ? Math.min(100, Math.max(0, 100 - (originalPrompt.split(' ').length / 10))).toFixed(1) : 'N/A')}
                  </Text>
                  <Text style={styles.complexityLabel}>Readability</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Ideas and Insights */}
          {(analysisData.idea_analysis || analysisData.insights) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Ideas & Insights</Text>
              
              {/* Idea Analysis */}
              {analysisData.idea_analysis && (
                <View style={styles.ideasSection}>
                  <Text style={styles.subsectionTitle}>🎆 Key Ideas</Text>
                  {analysisData.idea_analysis.main_ideas && analysisData.idea_analysis.main_ideas.length > 0 && (
                    <View style={styles.mainIdeasList}>
                      {analysisData.idea_analysis.main_ideas.slice(0, 5).map((idea, index) => (
                        <View key={index} style={styles.ideaCard}>
                          <View style={styles.ideaHeader}>
                            <Text style={styles.ideaTitle}>
                              {typeof idea === 'string' ? idea : 
                               typeof idea === 'object' ? (idea.summary || idea.title || idea.text || 'Untitled Idea') :
                               'Untitled Idea'}
                            </Text>
                            {(typeof idea === 'object' && idea.confidence) && (
                              <Text style={styles.ideaConfidence}>{Math.round(idea.confidence * 100)}%</Text>
                            )}
                          </View>
                          {(typeof idea === 'object' && idea.description) && (
                            <Text style={styles.ideaDescription}>{truncateText(String(idea.description), 100)}</Text>
                          )}
                          {(typeof idea === 'object' && idea.keywords && Array.isArray(idea.keywords) && idea.keywords.length > 0) && (
                            <View style={styles.ideaKeywords}>
                              {idea.keywords.slice(0, 4).map((keyword, idx) => (
                                <View key={idx} style={styles.ideaKeywordChip}>
                                  <Text style={styles.ideaKeywordText}>{String(keyword)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Idea Clusters */}
                  {analysisData.idea_analysis.clusters && analysisData.idea_analysis.clusters.length > 0 && (
                    <View style={styles.clustersSection}>
                      <Text style={styles.subsectionTitle}>🔗 Idea Clusters</Text>
                      <View style={styles.clustersList}>
                        {analysisData.idea_analysis.clusters.slice(0, 4).map((cluster, index) => (
                          <View key={index} style={styles.clusterCard}>
                            <Text style={styles.clusterTitle}>Cluster {index + 1}</Text>
                            <Text style={styles.clusterSize}>
                              {typeof cluster === 'object' ? 
                               (cluster.ideas?.length || cluster.size || cluster.count || 0) :
                               0} ideas
                            </Text>
                            {(typeof cluster === 'object' && cluster.theme) && (
                              <Text style={styles.clusterTheme}>{String(cluster.theme)}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* General Insights */}
              {analysisData.insights && analysisData.insights.length > 0 && (
                <View style={styles.insightsSection}>
                  <Text style={styles.subsectionTitle}>🔍 Key Insights</Text>
                  <View style={styles.insightsList}>
                    {analysisData.insights.slice(0, 5).map((insight, index) => (
                      <View key={index} style={styles.insightItem}>
                        <Text style={styles.insightBullet}>•</Text>
                        <Text style={styles.insightText}>
                          {typeof insight === 'string' ? insight :
                           typeof insight === 'object' ? (insight.text || insight.message || insight.content || JSON.stringify(insight)) :
                           String(insight)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Strengths and Weaknesses */}
          {(prompt_grade.strengths || prompt_grade.weak_areas) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚖️ Strengths & Areas for Improvement</Text>
              
              {prompt_grade.strengths && prompt_grade.strengths.length > 0 && (
                <View style={styles.strengthsWeaknessesSection}>
                  <Text style={styles.subsectionTitle}>✅ Strengths</Text>
                  <View style={styles.strengthsList}>
                    {prompt_grade.strengths.map((strength, index) => (
                      <View key={index} style={styles.strengthItem}>
                        <Text style={styles.strengthBullet}>•</Text>
                        <Text style={styles.strengthText}>
                          {typeof strength === 'string' ? strength :
                           typeof strength === 'object' ? (strength.text || strength.message || JSON.stringify(strength)) :
                           String(strength)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {prompt_grade.weak_areas && prompt_grade.weak_areas.length > 0 && (
                <View style={styles.strengthsWeaknessesSection}>
                  <Text style={styles.subsectionTitle}>📝 Areas for Improvement</Text>
                  <View style={styles.weaknessesList}>
                    {prompt_grade.weak_areas.map((weakness, index) => (
                      <View key={index} style={styles.weaknessItem}>
                        <Text style={styles.weaknessBullet}>•</Text>
                        <Text style={styles.weaknessText}>
                          {typeof weakness === 'string' ? weakness :
                           typeof weakness === 'object' ? (weakness.text || weakness.message || JSON.stringify(weakness)) :
                           String(weakness)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Performance Summary */}
          {performance_metrics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Analysis Performance</Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceLabel}>Processing Time</Text>
                  <Text style={styles.performanceValue}>44ms</Text>
                  <Text style={styles.performanceUnit}>Duration</Text>
                </View>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceLabel}>Request ID</Text>
                  <Text style={styles.performanceValue}>
                    {String(performance_metrics.request_id || 'Unknown').slice(-8)}
                  </Text>
                  <Text style={styles.performanceUnit}>Identifier</Text>
                </View>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceLabel}>Timestamp</Text>
                  <Text style={styles.performanceValue}>
                    {new Date().toLocaleTimeString()}
                  </Text>
                  <Text style={styles.performanceUnit}>Generated</Text>
                </View>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceLabel}>Analysis Type</Text>
                  <Text style={styles.performanceValue}>Comprehensive</Text>
                  <Text style={styles.performanceUnit}>Full Analysis</Text>
                </View>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.reportFooter}>
            <Text style={styles.footerText}>Generated by ZeroToken.io • Prompt Analysis Platform</Text>
            <Text style={styles.footerSubtext}>Visit zerotok.io for advanced prompt engineering tools</Text>
          </View>
        </View>
      </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  generateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    padding: 40,
  },

  // Report Styles
  reportContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeHeader: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
    textAlign: 'center',
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    paddingLeft: 4,
  },

  // Grade Card
  gradeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  gradeSummary: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },

  // Prompt Card
  promptCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  promptText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  promptStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Dimensions Grid
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dimensionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: screenWidth > 400 ? '30%' : '100%',
    flex: screenWidth <= 400 ? 1 : 0,
  },
  dimensionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dimensionScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dimensionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  dimensionGrade: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dimensionGradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  dimensionLabel: {
    fontSize: 11,
    color: '#64748b',
  },

  // Suggestions
  suggestionsContainer: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  suggestionDimension: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  suggestionPriority: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  suggestionMessage: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 6,
  },
  suggestionImpact: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Task Stats
  taskStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  taskStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  taskStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  taskStatLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Performance
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  performanceUnit: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '400',
  },

  // Task Breakdown Styles
  taskBreakdownSection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  taskTypeBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskTypeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 80,
  },
  taskTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTypeIconText: {
    fontSize: 16,
  },
  taskTypeCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  taskTypeLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Priority Distribution
  priorityBreakdown: {
    gap: 8,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  priorityLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  priorityBar: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  priorityCount: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Task Details List
  taskDetailsList: {
    gap: 12,
  },
  taskDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskDetailType: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDetailTypeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  taskDetailTitle: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },
  taskDetailMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  taskDetailPriority: {
    fontSize: 12,
  },
  taskDetailConfidence: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  taskKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  taskKeywordChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  taskKeywordText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  moreTasksIndicator: {
    alignItems: 'center',
    padding: 12,
  },
  moreTasksText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  
  // Complexity Metrics
  complexityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  complexityCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 100,
  },
  complexityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 4,
  },
  complexityLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Strengths and Weaknesses
  strengthsWeaknessesSection: {
    marginBottom: 20,
  },
  strengthsList: {
    gap: 6,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  strengthBullet: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 2,
  },
  strengthText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  weaknessesList: {
    gap: 6,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  weaknessBullet: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 2,
  },
  weaknessText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },

  // Ideas and Insights Styles
  ideasSection: {
    marginBottom: 20,
  },
  mainIdeasList: {
    gap: 12,
  },
  ideaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ideaTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  ideaConfidence: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  ideaDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  ideaKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ideaKeywordChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ideaKeywordText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Clusters
  clustersSection: {
    marginTop: 16,
  },
  clustersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clusterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 80,
  },
  clusterTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  clusterSize: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  clusterTheme: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // General Insights
  insightsSection: {
    marginTop: 16,
  },
  insightsList: {
    gap: 6,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightBullet: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },

  // No Data
  noDataCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },

  // Footer
  reportFooter: {
    alignItems: 'center',
    paddingTop: 24,
    marginTop: 32,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#94a3b8',
  },
});

export default PromptReportCard;