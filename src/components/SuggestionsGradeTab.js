import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SuggestionsTab from './SuggestionsTab';
import PromptGradeTab from './PromptGradeTab';

const SuggestionsGradeTab = ({ data, onApplySuggestion }) => {
  const hasSuggestions = data?.prompt_grade?.suggestions?.length > 0;
  const hasGrade = data?.prompt_grade !== undefined;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Suggestions Section */}
      {hasSuggestions && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💡 Suggestions</Text>
            <Text style={styles.sectionSubtitle}>
              Tips to improve your prompt
            </Text>
          </View>
          <SuggestionsTab 
            data={data} 
            onApplySuggestion={onApplySuggestion}
            embedded={true}
          />
        </View>
      )}

      {/* Grade Section */}
      {hasGrade && (
        <View style={[styles.section, hasSuggestions && styles.sectionWithMargin]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Grade</Text>
            <Text style={styles.sectionSubtitle}>
              Analysis of prompt quality
            </Text>
          </View>
          <PromptGradeTab 
            data={data}
            embedded={true}
          />
        </View>
      )}

      {/* Empty state */}
      {!hasSuggestions && !hasGrade && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No grade or suggestions available</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionWithMargin: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default SuggestionsGradeTab;