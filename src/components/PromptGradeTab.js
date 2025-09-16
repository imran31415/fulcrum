import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Color scheme for grades
const getGradeColor = (grade) => {
  if (grade.startsWith('A')) return '#4CAF50';
  if (grade.startsWith('B')) return '#8BC34A';
  if (grade.startsWith('C')) return '#FFC107';
  if (grade.startsWith('D')) return '#FF9800';
  return '#F44336';
};

// Color scheme for scores
const getScoreColor = (score) => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  if (score >= 40) return '#FF9800';
  return '#F44336';
};

// Main component
export default function PromptGradeTab({ data }) {
  const [expandedDimension, setExpandedDimension] = useState(null);
  
  if (!data || !data.prompt_grade) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Grade Available</Text>
          <Text style={styles.emptyText}>Analyze a prompt to see its comprehensive grade</Text>
        </View>
      </View>
    );
  }

  const grade = data.prompt_grade;
  const overallGrade = grade.overall_grade;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overall Grade Header */}
      <View style={styles.overallGradeCard}>
        <View style={styles.overallGradeHeader}>
          <View style={styles.gradeCircle}>
            <Text style={[styles.letterGrade, { color: overallGrade.grade_color }]}>
              {overallGrade.grade}
            </Text>
            <Text style={styles.scoreText}>{overallGrade.score.toFixed(1)}</Text>
          </View>
          <View style={styles.gradeDetails}>
            <Text style={styles.gradeSummary}>{overallGrade.summary}</Text>
            <View style={styles.percentileContainer}>
              <Text style={styles.percentileText}>
                Better than {overallGrade.percentile}% of prompts
              </Text>
            </View>
          </View>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{grade.strengths.length}</Text>
            <Text style={styles.statLabel}>Strengths</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{grade.weak_areas.length}</Text>
            <Text style={styles.statLabel}>Weak Areas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{grade.suggestions.length}</Text>
            <Text style={styles.statLabel}>Suggestions</Text>
          </View>
        </View>
      </View>

      {/* Dimensional Grades */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📐</Text>
          <Text style={styles.sectionTitle}>Dimensional Analysis</Text>
        </View>
        
        {Object.entries({
          'Understandability': grade.understandability,
          'Specificity': grade.specificity,
          'Task Complexity': grade.task_complexity,
          'Clarity': grade.clarity,
          'Actionability': grade.actionability,
          'Structure': grade.structure_quality,
          'Context': grade.context_sufficiency,
          'Scope': grade.scope_management,
        }).map(([name, dimension], index) => (
          <GradeDimensionCard
            key={name}
            name={name}
            dimension={dimension}
            index={index}
            isExpanded={expandedDimension === name}
            onToggleExpand={() => setExpandedDimension(
              expandedDimension === name ? null : name
            )}
          />
        ))}
      </View>


      {/* Strengths and Weaknesses */}
      <View style={styles.strengthsWeaknessesContainer}>
        <View style={[styles.section, styles.halfSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✅</Text>
            <Text style={styles.sectionTitle}>Strengths</Text>
          </View>
          <View style={styles.listContainer}>
            {grade.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.halfSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={styles.sectionTitle}>Weak Areas</Text>
          </View>
          <View style={styles.listContainer}>
            {grade.weak_areas.map((weakness, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{weakness}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Grade Dimension Card Component
const GradeDimensionCard = ({ name, dimension, index, isExpanded, onToggleExpand }) => {
  const getIcon = (name) => {
    const icons = {
      'Understandability': '📖',
      'Specificity': '🎯',
      'Task Complexity': '🧩',
      'Clarity': '💎',
      'Actionability': '⚡',
      'Structure': '🏗️',
      'Context': '📋',
      'Scope': '🔍',
    };
    return icons[name] || '📊';
  };

  // Check if this is a complexity metric (no letter grade)
  const isComplexityMetric = name === 'Task Complexity';

  return (
    <View style={styles.dimensionCard}>
      <Pressable onPress={onToggleExpand} style={styles.dimensionHeader}>
        <View style={styles.dimensionInfo}>
          <Text style={styles.dimensionIcon}>{getIcon(name)}</Text>
          <View style={styles.dimensionTitleContainer}>
            <Text style={styles.dimensionName}>{name}</Text>
            <Text style={styles.dimensionLabel}>{dimension.label}</Text>
          </View>
        </View>
        
        <View style={styles.dimensionGrade}>
          {isComplexityMetric ? (
            <View style={[styles.complexityScoreBox, { backgroundColor: getScoreColor(dimension.score) }]}>
              <Text style={styles.complexityScoreText}>{dimension.score.toFixed(0)}</Text>
            </View>
          ) : (
            <View style={[styles.gradeBox, { backgroundColor: getGradeColor(dimension.grade) }]}>
              <Text style={styles.gradeText}>{dimension.grade}</Text>
            </View>
          )}
          <Text style={styles.scoreValue}>{dimension.score.toFixed(1)}</Text>
        </View>
      </Pressable>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {isComplexityMetric && (
          <View style={styles.complexityLabels}>
            <Text style={styles.complexityLabelLeft}>Less Complex</Text>
            <Text style={styles.complexityLabelRight}>More Complex</Text>
          </View>
        )}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${dimension.score}%`,
                backgroundColor: getScoreColor(dimension.score),
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.dimensionDescription}>{dimension.description}</Text>

      {/* Expanded Details */}
      {isExpanded && dimension.factors && (
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Contributing Factors:</Text>
          {dimension.factors.map((factor, idx) => (
            <View key={idx} style={styles.factorItem}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <Text style={styles.factorWeight}>({(factor.weight * 100).toFixed(0)}% weight)</Text>
              </View>
              <View style={styles.factorBar}>
                <View
                  style={[
                    styles.factorFill,
                    {
                      width: `${factor.value}%`,
                      backgroundColor: getScoreColor(factor.value),
                    },
                  ]}
                />
              </View>
              <Text style={styles.factorValue}>{factor.value.toFixed(1)}/100</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  overallGradeCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallGradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  letterGrade: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  gradeDetails: {
    flex: 1,
  },
  gradeSummary: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 8,
  },
  percentileContainer: {
    backgroundColor: '#667eea15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  percentileText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  section: {
    marginBottom: 16,
  },
  halfSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  toggleIcon: {
    color: '#64748b',
    fontSize: 12,
  },
  dimensionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dimensionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dimensionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dimensionTitleContainer: {
    flex: 1,
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  dimensionLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  dimensionGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  complexityScoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  complexityScoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  complexityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  complexityLabelLeft: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  complexityLabelRight: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dimensionDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  factorsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  factorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factorItem: {
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 12,
    color: '#ccc',
  },
  factorWeight: {
    fontSize: 11,
    color: '#666',
  },
  factorBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  factorFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorValue: {
    fontSize: 10,
    color: '#999',
  },
  suggestionsContainer: {
    padding: 16,
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  suggestionDimension: {
    fontSize: 12,
    color: '#999',
  },
  suggestionMessage: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 6,
  },
  suggestionImpact: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  exampleContainer: {
    backgroundColor: '#0a0a0f',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  exampleLabel: {
    fontSize: 10,
    color: '#646cff',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 16,
  },
  strengthsWeaknessesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    color: '#646cff',
    marginRight: 8,
  },
  listText: {
    fontSize: 12,
    color: '#ccc',
    flex: 1,
  },
});