import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TaskGraph from './TaskGraph';

export default function InsightsTab({ data }) {
  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No insights available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Derived Insights Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔍</Text>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Derived Insights</Text>
          <Text style={styles.headerSubtitle}>Advanced analysis layered on top of raw metrics</Text>
        </View>
      </View>

      {/* Task Graph Section */}
      {data.task_graph && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Task Graph Analysis</Text>
            <View style={styles.derivedBadge}>
              <Text style={styles.derivedBadgeText}>AI-EXTRACTED</Text>
            </View>
          </View>
          <View style={styles.taskGraphContainer}>
            <TaskGraph taskGraphData={data.task_graph} />
          </View>
        </View>
      )}

      {/* Thought Type Distribution */}
      {data.idea_analysis?.thought_type_distribution && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🧠</Text>
            <Text style={styles.sectionTitle}>Thought Type Distribution</Text>
          </View>
          <ThoughtTypeDistribution data={data.idea_analysis.thought_type_distribution} />
        </View>
      )}

      {/* Question Analysis */}
      {data.idea_analysis?.question_analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>❓</Text>
            <Text style={styles.sectionTitle}>Question Analysis</Text>
          </View>
          <QuestionAnalysisCard data={data.idea_analysis.question_analysis} />
        </View>
      )}

      {/* Factual Content */}
      {data.idea_analysis?.factual_content && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Factual Content</Text>
          </View>
          <FactualContentCard data={data.idea_analysis.factual_content} />
        </View>
      )}

      {/* Idea Clusters */}
      {data.idea_analysis?.semantic_clusters && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={styles.sectionTitle}>Idea Clusters</Text>
          </View>
          <IdeaClustersCard clusters={data.idea_analysis.semantic_clusters.value} />
        </View>
      )}

      {/* Additional Insights from insights object */}
      {data.insights && (
        <>
          {/* Key Recommendations */}
          {data.insights.key_recommendations && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💡</Text>
                <Text style={styles.sectionTitle}>Key Recommendations</Text>
              </View>
              <View style={styles.recommendationsContainer}>
                {data.insights.key_recommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recommendationCard}>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Strength Areas */}
          {data.insights.strength_areas && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>✨</Text>
                <Text style={styles.sectionTitle}>Strength Areas</Text>
              </View>
              <View style={styles.strengthsContainer}>
                {data.insights.strength_areas.map((strength, idx) => (
                  <View key={idx} style={styles.strengthCard}>
                    <Text style={styles.strengthIcon}>✓</Text>
                    <Text style={styles.strengthText}>{strength}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// Helper components that might not exist yet
const ThoughtTypeDistribution = ({ data }) => {
  if (!data?.value) return null;
  
  const { value } = data;
  const total = Object.values(value).reduce((sum, count) => 
    typeof count === 'number' ? sum + count : sum, 0);

  return (
    <View style={styles.distributionContainer}>
      <Text style={styles.dominantType}>Dominant Type: {value.dominant_type}</Text>
      <View style={styles.typesList}>
        {Object.entries(value).map(([type, count]) => {
          if (typeof count !== 'number') return null;
          const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
          return (
            <View key={type} style={styles.typeItem}>
              <Text style={styles.typeLabel}>{type}:</Text>
              <Text style={styles.typeValue}>{count} ({percentage}%)</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const QuestionAnalysisCard = ({ data }) => {
  if (!data?.value) return null;
  return (
    <View style={styles.analysisCard}>
      <Text style={styles.cardText}>Total Questions: {data.value.total_questions}</Text>
      {data.value.actionable?.length > 0 && (
        <Text style={styles.cardSubtext}>
          Actionable: {data.value.actionable.length}
        </Text>
      )}
    </View>
  );
};

const FactualContentCard = ({ data }) => {
  if (!data?.value) return null;
  return (
    <View style={styles.analysisCard}>
      <Text style={styles.cardText}>Total Facts: {data.value.total_facts}</Text>
      <Text style={styles.cardSubtext}>
        Fact Density: {data.value.fact_density?.toFixed(2) || 0} per sentence
      </Text>
    </View>
  );
};

const IdeaClustersCard = ({ clusters }) => {
  if (!clusters || clusters.length === 0) return null;
  
  return (
    <View style={styles.clustersContainer}>
      {clusters.slice(0, 3).map((cluster) => (
        <View key={cluster.id} style={styles.clusterCard}>
          <View style={styles.clusterHeader}>
            <View style={[styles.clusterTypeBadge, { backgroundColor: getTypeColor(cluster.thought_type) }]}>
              <Text style={styles.clusterTypeText}>{cluster.thought_type?.toUpperCase() || 'IDEA'}</Text>
            </View>
            <Text style={styles.clusterConfidence}>
              {Math.round((cluster.type_confidence || 0) * 100)}% confident
            </Text>
          </View>
          <Text style={styles.clusterTopic}>{cluster.main_topic}</Text>
          <Text style={styles.clusterSentences} numberOfLines={2}>
            {cluster.sentences[0]}
          </Text>
        </View>
      ))}
    </View>
  );
};

const getTypeColor = (type) => {
  const colors = {
    idea: '#646cff',
    fact: '#4CAF50',
    question: '#9C27B0',
    opinion: '#FF9800',
    instruction: '#2196F3',
    description: '#607D8B',
    argument: '#F44336',
    example: '#00BCD4',
  };
  return colors[type?.toLowerCase()] || '#666';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e50',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  derivedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  taskGraphContainer: {
    height: 600,
    backgroundColor: '#0a0a0f',
  },
  distributionContainer: {
    padding: 16,
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 12,
  },
  dominantType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#646cff',
    marginBottom: 12,
  },
  typesList: {
    gap: 8,
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeLabel: {
    fontSize: 13,
    color: '#999',
    textTransform: 'capitalize',
  },
  typeValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  analysisCard: {
    padding: 16,
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#999',
  },
  clustersContainer: {
    padding: 16,
    gap: 12,
  },
  clusterCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clusterTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  clusterTypeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clusterConfidence: {
    fontSize: 11,
    color: '#999',
  },
  clusterTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  clusterSentences: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  recommendationsContainer: {
    padding: 16,
    gap: 8,
  },
  recommendationCard: {
    backgroundColor: '#646cff10',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#646cff',
  },
  recommendationText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  strengthsContainer: {
    padding: 16,
    gap: 8,
  },
  strengthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthIcon: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  strengthText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
  },
});