import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PerformanceSummary, TimingCard } from './PerformanceComponents';

const PerformanceTab = ({ data }) => {
  if (!data || !data.performance_metrics) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚡</Text>
          <Text style={styles.emptyTitle}>No Performance Data Available</Text>
          <Text style={styles.emptyText}>
            Performance metrics will appear here after running an analysis.
          </Text>
        </View>
      </View>
    );
  }

  const performanceData = data.performance_metrics;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Performance Summary */}
      <PerformanceSummary performanceData={performanceData} />
      
      {/* Detailed Timing Cards */}
      <View style={styles.detailedSection}>
        <Text style={styles.sectionTitle}>🔍 Detailed Timing Analysis</Text>
        
        {Object.entries(performanceData).map(([key, value]) => {
          if (key.includes('duration') && typeof value === 'object' && value !== null) {
            return (
              <TimingCard 
                key={key}
                title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                metric={value}
              />
            );
          }
          return null;
        }).filter(Boolean)}
        
        {/* If no timing cards, show a message */}
        {Object.entries(performanceData).every(([key, value]) => 
          !(key.includes('duration') && typeof value === 'object' && value !== null)
        ) && (
          <View style={styles.noTimingData}>
            <Text style={styles.noTimingText}>
              No detailed timing breakdowns available for this analysis.
            </Text>
          </View>
        )}
      </View>

      {/* Performance Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Performance Insights</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Understanding Performance Metrics</Text>
          <Text style={styles.tipText}>
            • <Text style={styles.tipHighlight}>Excellent (&lt;50ms):</Text> Lightning fast analysis ⚡{'\n'}
            • <Text style={styles.tipHighlight}>Fast (&lt;100ms):</Text> Very responsive performance 🚀{'\n'}
            • <Text style={styles.tipHighlight}>Normal (&lt;500ms):</Text> Good performance for complex text ⏱️{'\n'}
            • <Text style={styles.tipHighlight}>Slow (&gt;1s):</Text> May indicate complex processing 🐌
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  detailedSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  noTimingData: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  noTimingText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tipsSection: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  tipHighlight: {
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default PerformanceTab;