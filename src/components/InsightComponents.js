import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

// Component for displaying thought type distribution
export const ThoughtTypeDistribution = ({ distribution }) => {
  if (!distribution || !distribution.value) return null;
  
  const data = distribution.value;
  const thoughtTypes = [
    { key: 'facts', label: 'Facts', color: '#3b82f6', emoji: '📊' },
    { key: 'questions', label: 'Questions', color: '#8b5cf6', emoji: '❓' },
    { key: 'opinions', label: 'Opinions', color: '#f59e0b', emoji: '💭' },
    { key: 'instructions', label: 'Instructions', color: '#10b981', emoji: '📝' },
    { key: 'examples', label: 'Examples', color: '#06b6d4', emoji: '💡' },
    { key: 'arguments', label: 'Arguments', color: '#ef4444', emoji: '⚖️' },
    { key: 'descriptions', label: 'Descriptions', color: '#64748b', emoji: '🖼️' },
    { key: 'ideas', label: 'Ideas', color: '#ec4899', emoji: '🧠' },
  ];
  
  const total = thoughtTypes.reduce((sum, type) => sum + (data[type.key] || 0), 0);
  
  return (
    <View style={styles.distributionCard}>
      <Text style={styles.distributionTitle}>🎯 Thought Type Distribution</Text>
      
      <View style={styles.dominantType}>
        <Text style={styles.dominantLabel}>Dominant Type:</Text>
        <Text style={styles.dominantValue}>{data.dominant_type || 'Mixed'}</Text>
      </View>
      
      <View style={styles.balanceIndicator}>
        <Text style={styles.balanceLabel}>Content Balance:</Text>
        <View style={styles.balanceBar}>
          <View style={[styles.balanceFill, { width: `${(data.balance || 0) * 100}%` }]} />
        </View>
        <Text style={styles.balanceValue}>{((data.balance || 0) * 100).toFixed(0)}%</Text>
      </View>
      
      <View style={styles.typeGrid}>
        {thoughtTypes.map(type => {
          const count = data[type.key] || 0;
          const percentage = total > 0 ? (count / total * 100) : 0;
          
          return (
            <View key={type.key} style={styles.typeCard}>
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={[styles.typeCount, { color: type.color }]}>{count}</Text>
              <View style={styles.typeBar}>
                <View 
                  style={[styles.typeBarFill, { 
                    width: `${percentage}%`,
                    backgroundColor: type.color 
                  }]} 
                />
              </View>
              <Text style={styles.typePercentage}>{percentage.toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Component for displaying question analysis
export const QuestionAnalysisCard = ({ analysis }) => {
  if (!analysis || !analysis.value) return null;
  
  const data = analysis.value;
  const [showQuestions, setShowQuestions] = React.useState(false);
  
  return (
    <View style={styles.analysisCard}>
      <Text style={styles.analysisTitle}>❓ Question Analysis</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.total_questions || 0}</Text>
          <Text style={styles.statLabel}>Total Questions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.actionable?.length || 0}</Text>
          <Text style={styles.statLabel}>Actionable</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.rhetorical?.length || 0}</Text>
          <Text style={styles.statLabel}>Rhetorical</Text>
        </View>
      </View>
      
      {data.question_types && Object.keys(data.question_types).length > 0 && (
        <View style={styles.typeBreakdown}>
          <Text style={styles.breakdownTitle}>Question Types:</Text>
          {Object.entries(data.question_types).map(([type, count]) => (
            <View key={type} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>
                {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.breakdownValue}>{count}</Text>
            </View>
          ))}
        </View>
      )}
      
      {data.unanswered && data.unanswered.length > 0 && (
        <Pressable 
          style={styles.expandButton}
          onPress={() => setShowQuestions(!showQuestions)}
        >
          <Text style={styles.expandButtonText}>
            {showQuestions ? 'Hide' : 'Show'} Unanswered Questions ({data.unanswered.length})
          </Text>
        </Pressable>
      )}
      
      {showQuestions && data.unanswered && (
        <View style={styles.questionList}>
          {data.unanswered.slice(0, 5).map((q, i) => (
            <Text key={i} style={styles.questionItem}>• {q}</Text>
          ))}
          {data.unanswered.length > 5 && (
            <Text style={styles.moreItems}>...and {data.unanswered.length - 5} more</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Component for displaying factual content analysis
export const FactualContentCard = ({ content }) => {
  if (!content || !content.value) return null;
  
  const data = content.value;
  const [showFacts, setShowFacts] = React.useState(false);
  
  return (
    <View style={styles.analysisCard}>
      <Text style={styles.analysisTitle}>📊 Factual Content Analysis</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.total_facts || 0}</Text>
          <Text style={styles.statLabel}>Total Facts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.verifiable_facts?.length || 0}</Text>
          <Text style={styles.statLabel}>Verifiable</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{(data.fact_density || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Fact Density</Text>
        </View>
      </View>
      
      {data.fact_types && Object.keys(data.fact_types).length > 0 && (
        <View style={styles.typeBreakdown}>
          <Text style={styles.breakdownTitle}>Fact Types:</Text>
          {Object.entries(data.fact_types).map(([type, count]) => (
            <View key={type} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>
                {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.breakdownValue}>{count}</Text>
            </View>
          ))}
        </View>
      )}
      
      {data.statistical_facts && data.statistical_facts.length > 0 && (
        <Pressable 
          style={styles.expandButton}
          onPress={() => setShowFacts(!showFacts)}
        >
          <Text style={styles.expandButtonText}>
            {showFacts ? 'Hide' : 'Show'} Statistical Facts ({data.statistical_facts.length})
          </Text>
        </Pressable>
      )}
      
      {showFacts && data.statistical_facts && (
        <View style={styles.factList}>
          {data.statistical_facts.slice(0, 5).map((f, i) => (
            <Text key={i} style={styles.factItem}>📈 {f}</Text>
          ))}
          {data.statistical_facts.length > 5 && (
            <Text style={styles.moreItems}>...and {data.statistical_facts.length - 5} more</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Component for displaying idea clusters with thought types
export const IdeaClustersCard = ({ clusters }) => {
  if (!clusters || !clusters.value || clusters.value.length === 0) return null;
  
  const [expandedCluster, setExpandedCluster] = React.useState(null);
  
  const getTypeColor = (type) => {
    const colors = {
      'fact': '#3b82f6',
      'question': '#8b5cf6',
      'opinion': '#f59e0b',
      'instruction': '#10b981',
      'example': '#06b6d4',
      'argument': '#ef4444',
      'description': '#64748b',
      'idea': '#ec4899'
    };
    return colors[type] || '#94a3b8';
  };
  
  const getTypeEmoji = (type) => {
    const emojis = {
      'fact': '📊',
      'question': '❓',
      'opinion': '💭',
      'instruction': '📝',
      'example': '💡',
      'argument': '⚖️',
      'description': '🖼️',
      'idea': '🧠'
    };
    return emojis[type] || '📄';
  };
  
  return (
    <View style={styles.clustersCard}>
      <Text style={styles.clustersTitle}>🎯 Idea Clusters by Type</Text>
      
      {clusters.value.slice(0, 10).map((cluster) => (
        <Pressable
          key={cluster.id}
          style={styles.clusterItem}
          onPress={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
        >
          <View style={styles.clusterHeader}>
            <View style={styles.clusterTypeIndicator}>
              <Text style={styles.clusterTypeEmoji}>{getTypeEmoji(cluster.thought_type)}</Text>
              <View style={[styles.clusterTypeBadge, { backgroundColor: getTypeColor(cluster.thought_type) }]}>
                <Text style={styles.clusterTypeText}>{cluster.thought_type}</Text>
              </View>
              <Text style={styles.clusterConfidence}>
                {(cluster.type_confidence * 100).toFixed(0)}% confident
              </Text>
            </View>
            <Text style={styles.clusterTopic}>{cluster.main_topic}</Text>
          </View>
          
          <View style={styles.clusterMeta}>
            <Text style={styles.clusterMetaItem}>📍 {cluster.position_in_text}</Text>
            <Text style={styles.clusterMetaItem}>📝 {cluster.sentences.length} sentences</Text>
            {cluster.actionable && (
              <Text style={styles.clusterMetaItem}>✅ Actionable</Text>
            )}
            {cluster.certainty_level && (
              <Text style={styles.clusterMetaItem}>🎯 {cluster.certainty_level}</Text>
            )}
          </View>
          
          {cluster.key_words && cluster.key_words.length > 0 && (
            <View style={styles.keywordsRow}>
              {cluster.key_words.slice(0, 5).map((kw, i) => (
                <View key={i} style={styles.keywordChip}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
            </View>
          )}
          
          {expandedCluster === cluster.id && (
            <View style={styles.clusterDetails}>
              {cluster.sentence_types && cluster.sentence_types.map((st, i) => (
                <View key={i} style={styles.sentenceType}>
                  <View style={styles.sentenceTypeHeader}>
                    <Text style={[styles.sentenceTypeLabel, { color: getTypeColor(st.type) }]}>
                      {st.type}
                    </Text>
                    {st.sub_type && (
                      <Text style={styles.sentenceSubtype}>{st.sub_type}</Text>
                    )}
                    <Text style={styles.sentenceConfidence}>
                      {(st.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <Text style={styles.sentenceText} numberOfLines={2}>
                    {st.sentence}
                  </Text>
                  {st.indicators && st.indicators.length > 0 && (
                    <Text style={styles.sentenceIndicators}>
                      Indicators: {st.indicators.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
              
              {cluster.evidence && cluster.evidence.length > 0 && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceTitle}>📋 Evidence:</Text>
                  {cluster.evidence.map((e, i) => (
                    <Text key={i} style={styles.evidenceItem}>• {e}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </Pressable>
      ))}
      
      {clusters.value.length > 10 && (
        <Text style={styles.moreItems}>...and {clusters.value.length - 10} more clusters</Text>
      )}
    </View>
  );
};

// Component for displaying writing quality insights
export const WritingQualityCard = ({ quality }) => {
  if (!quality || !quality.value) return null;
  
  const data = quality.value;
  
  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <View style={styles.qualityCard}>
      <Text style={styles.qualityTitle}>✨ Writing Quality Assessment</Text>
      
      <View style={styles.overallScore}>
        <Text style={styles.overallScoreLabel}>Overall Score</Text>
        <Text style={[styles.overallScoreValue, { color: getScoreColor(data.overall_score) }]}>
          {(data.overall_score * 100).toFixed(0)}%
        </Text>
      </View>
      
      <View style={styles.qualityMetrics}>
        {[
          { key: 'clarity', label: 'Clarity', value: data.clarity },
          { key: 'coherence', label: 'Coherence', value: data.coherence },
          { key: 'depth', label: 'Depth', value: data.depth },
          { key: 'originality', label: 'Originality', value: data.originality }
        ].map(metric => (
          <View key={metric.key} style={styles.qualityMetric}>
            <Text style={styles.qualityMetricLabel}>{metric.label}</Text>
            <View style={styles.qualityMetricBar}>
              <View 
                style={[styles.qualityMetricFill, { 
                  width: `${(metric.value || 0) * 100}%`,
                  backgroundColor: getScoreColor(metric.value || 0)
                }]} 
              />
            </View>
            <Text style={styles.qualityMetricValue}>
              {((metric.value || 0) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
      
      {data.strengths && data.strengths.length > 0 && (
        <View style={styles.strengthsWeaknesses}>
          <Text style={styles.swTitle}>💪 Strengths:</Text>
          {data.strengths.map((s, i) => (
            <Text key={i} style={styles.swItem}>✓ {s}</Text>
          ))}
        </View>
      )}
      
      {data.weaknesses && data.weaknesses.length > 0 && (
        <View style={styles.strengthsWeaknesses}>
          <Text style={styles.swTitle}>⚠️ Areas for Improvement:</Text>
          {data.weaknesses.map((w, i) => (
            <Text key={i} style={styles.swItem}>• {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Main insights tab component
export const InsightsTab = ({ data }) => {
  if (!data) return null;
  
  return (
    <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={true}>
      <View style={styles.insightsHeader}>
        <Text style={styles.insightsHeaderTitle}>🔍 Derived Insights</Text>
        <Text style={styles.insightsHeaderSubtitle}>
          Advanced analysis layered on top of raw metrics
        </Text>
      </View>
      
      {data.idea_analysis?.thought_type_distribution && (
        <ThoughtTypeDistribution distribution={data.idea_analysis.thought_type_distribution} />
      )}
      
      {data.idea_analysis?.semantic_clusters && (
        <IdeaClustersCard clusters={data.idea_analysis.semantic_clusters} />
      )}
      
      {data.idea_analysis?.question_analysis && (
        <QuestionAnalysisCard analysis={data.idea_analysis.question_analysis} />
      )}
      
      {data.idea_analysis?.factual_content && (
        <FactualContentCard content={data.idea_analysis.factual_content} />
      )}
      
      {data.insights?.writing_quality && (
        <WritingQualityCard quality={data.insights.writing_quality} />
      )}
      
      {data.insights?.summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Executive Summary</Text>
          <Text style={styles.summaryText}>{data.insights.summary.value}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  insightsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  insightsHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  insightsHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  insightsHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  taskGraphSection: {
    minHeight: 500,
    backgroundColor: '#ffffff',
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  
  distributionCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  dominantType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dominantLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 8,
  },
  dominantValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  balanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
  },
  balanceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 8,
  },
  balanceFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    width: 35,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeCard: {
    width: '25%',
    padding: 4,
  },
  typeEmoji: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  typeBar: {
    height: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginTop: 4,
  },
  typeBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  typePercentage: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  
  analysisCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  typeBreakdown: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  expandButton: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  questionList: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  questionItem: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  factList: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  factItem: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  
  clustersCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  clustersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  clusterItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clusterHeader: {
    marginBottom: 8,
  },
  clusterTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clusterTypeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  clusterTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  clusterTypeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clusterConfidence: {
    fontSize: 10,
    color: '#64748b',
  },
  clusterTopic: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 4,
  },
  clusterMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  clusterMetaItem: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 12,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  keywordChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  keywordText: {
    fontSize: 9,
    color: '#475569',
  },
  clusterDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sentenceType: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  sentenceTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sentenceTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginRight: 6,
  },
  sentenceSubtype: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 6,
  },
  sentenceConfidence: {
    fontSize: 10,
    color: '#94a3b8',
  },
  sentenceText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 14,
  },
  sentenceIndicators: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  evidenceSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  evidenceItem: {
    fontSize: 10,
    color: '#047857',
    marginBottom: 2,
  },
  
  qualityCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  qualityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  overallScore: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 16,
  },
  overallScoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  overallScoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  qualityMetrics: {
    marginBottom: 16,
  },
  qualityMetric: {
    marginBottom: 12,
  },
  qualityMetricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  qualityMetricBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 2,
  },
  qualityMetricFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualityMetricValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  strengthsWeaknesses: {
    marginBottom: 12,
  },
  swTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  swItem: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});