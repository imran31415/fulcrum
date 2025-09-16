import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Priority color mapping
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#999';
  }
};

export default function SuggestionsTab({ data }) {
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  
  if (!data || !data.prompt_grade || !data.prompt_grade.suggestions || data.prompt_grade.suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No Suggestions Available</Text>
          <Text style={styles.emptyText}>
            Your prompt is well-crafted! No major improvements needed.
          </Text>
        </View>
      </View>
    );
  }

  const suggestions = data.prompt_grade.suggestions;
  const meta = data.prompt_grade.suggestion_meta;
  
  // Group suggestions by priority
  const highPriority = suggestions.filter(s => s.priority === 'high');
  const mediumPriority = suggestions.filter(s => s.priority === 'medium');
  const lowPriority = suggestions.filter(s => s.priority === 'low');

  const toggleExpanded = (index) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderSuggestionGroup = (title, items, priorityColor) => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.priorityGroup}>
        <View style={styles.groupHeader}>
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
          <Text style={styles.groupTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>
        
        {items.map((suggestion, index) => {
          const globalIndex = suggestions.indexOf(suggestion);
          const isExpanded = expandedSuggestions[globalIndex];
          
          return (
            <Pressable
              key={globalIndex}
              style={styles.suggestionCard}
              onPress={() => toggleExpanded(globalIndex)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dimensionBadge}>
                  <Text style={styles.dimensionText}>{suggestion.dimension}</Text>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </View>
              
              <Text style={styles.message}>{suggestion.message}</Text>
              
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.impactContainer}>
                    <Text style={styles.impactLabel}>Expected Impact:</Text>
                    <Text style={styles.impactText}>{suggestion.impact}</Text>
                  </View>
                  
                  {suggestion.example && (
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleLabel}>Example:</Text>
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleText}>{suggestion.example}</Text>
                      </View>
                    </View>
                  )}

                  {/* Optional: Apply template action */}
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.applyButton}
                      onPress={() => {
                        // Fire a lightweight event for parent to handle
                        if (data && data.onApplySuggestion) {
                          data.onApplySuggestion(suggestion);
                        }
                      }}
                    >
                      <Text style={styles.applyButtonText}>Apply template</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Improvement Suggestions</Text>
        <Text style={styles.headerSubtitle}>
          Actionable recommendations to enhance your prompt
        </Text>

        {meta && (
          <View style={styles.metaBox}>
            <Text style={styles.metaTitle}>Why these suggestions?</Text>
            <Text style={styles.metaText}>
              {meta.prompt_type_icon ? meta.prompt_type_icon + ' ' : ''}
              {meta.prompt_type_label || meta.prompt_type}
            </Text>
            {meta.reasoning ? (
              <Text style={styles.metaReasoning}>{meta.reasoning}</Text>
            ) : null}
          </View>
        )}
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.statLabel}>High Priority</Text>
            <Text style={styles.statValue}>{highPriority.length}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.statLabel}>Medium Priority</Text>
            <Text style={styles.statValue}>{mediumPriority.length}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statLabel}>Low Priority</Text>
            <Text style={styles.statValue}>{lowPriority.length}</Text>
          </View>
        </View>
      </View>

      {/* Suggestions by Priority */}
      <View style={styles.suggestionsContainer}>
        {renderSuggestionGroup('High Priority - Address These First', highPriority, '#F44336')}
        {renderSuggestionGroup('Medium Priority - Consider Improving', mediumPriority, '#FF9800')}
        {renderSuggestionGroup('Low Priority - Nice to Have', lowPriority, '#4CAF50')}
      </View>
    </ScrollView>
  );
}

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
    marginTop: 100,
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
    lineHeight: 20,
  },
  headerCard: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  metaTitle: {
    fontSize: 12,
    color: '#646cff',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  metaReasoning: {
    fontSize: 12,
    color: '#64748b',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: screenWidth * 0.25,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  priorityGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dimensionBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dimensionText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandIcon: {
    fontSize: 12,
    color: '#64748b',
  },
  message: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  impactContainer: {
    marginBottom: 12,
  },
  impactLabel: {
    fontSize: 12,
    color: '#646cff',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  impactText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  exampleContainer: {
    marginTop: 12,
  },
  exampleLabel: {
    fontSize: 12,
    color: '#646cff',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleBox: {
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  exampleText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
