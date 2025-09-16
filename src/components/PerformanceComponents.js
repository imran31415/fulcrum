import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMetricInfo } from '../utils/MetricKnowledge';

// Performance indicator component showing speed classification
export const PerformanceIndicator = ({ duration, label }) => {
  const getPerformanceLevel = (ms) => {
    if (ms < 50) return { level: 'Excellent', color: '#10b981', emoji: '🚀' };
    if (ms < 100) return { level: 'Fast', color: '#22c55e', emoji: '⚡' };
    if (ms < 500) return { level: 'Normal', color: '#f59e0b', emoji: '⏱️' };
    if (ms < 1000) return { level: 'Slow', color: '#f97316', emoji: '🐌' };
    return { level: 'Very Slow', color: '#ef4444', emoji: '🚨' };
  };

  const performance = getPerformanceLevel(duration);

  return (
    <View style={styles.performanceIndicator}>
      <Text style={styles.performanceEmoji}>{performance.emoji}</Text>
      <View style={styles.performanceInfo}>
        <Text style={styles.performanceLabel}>{label}</Text>
        <Text style={[styles.performanceLevel, { color: performance.color }]}>
          {performance.level}
        </Text>
        <Text style={styles.performanceDuration}>{duration.toFixed(2)}ms</Text>
      </View>
    </View>
  );
};

// Detailed timing card for individual operations
export const TimingCard = ({ title, metric }) => {
  if (!metric || typeof metric !== 'object') return null;

  const normalized = (() => {
    if (metric.value !== undefined) return metric;
    const enhanced = getMetricInfo(title, metric);
    return enhanced;
  })();

  const duration = normalized.value || 0;
  const getTimingColor = (ms) => {
    if (ms < 50) return '#10b981';
    if (ms < 100) return '#22c55e';
    if (ms < 500) return '#f59e0b';
    if (ms < 1000) return '#f97316';
    return '#ef4444';
  };

  return (
    <View style={styles.timingCard}>
      <View style={styles.timingHeader}>
        <Text style={styles.timingTitle}>{title}</Text>
        <View style={[styles.timingBadge, { backgroundColor: getTimingColor(duration) }]}>
          <Text style={styles.timingValue}>{duration.toFixed(2)}ms</Text>
        </View>
      </View>
      
      {normalized.start_time && normalized.end_time && (
        <View style={styles.timingDetails}>
          <Text style={styles.timingDetail}>
            Started: {normalized.start_time}
          </Text>
          <Text style={styles.timingDetail}>
            Ended: {normalized.end_time}
          </Text>
        </View>
      )}
      
      {normalized.scale && (
        <Text style={styles.timingScale}>Scale: {normalized.scale}</Text>
      )}
      
      {normalized.help_text && (
        <Text style={styles.timingHelp}>{normalized.help_text}</Text>
      )}
      
      {normalized.practical_application && (
        <Text style={styles.timingApplication}>
          💡 {normalized.practical_application}
        </Text>
      )}
    </View>
  );
};

// Performance summary component showing overall analysis performance
export const PerformanceSummary = ({ performanceData }) => {
  if (!performanceData) return null;

  const totalDuration = performanceData.total_duration?.value || 0;
  const operations = [
    { key: 'complexity_analysis_duration', label: 'Complexity Analysis' },
    { key: 'tokenization_duration', label: 'Tokenization' },
    { key: 'preprocessing_duration', label: 'Preprocessing' },
  ];

  // Calculate percentages
  const getPercentage = (duration) => {
    if (totalDuration === 0) return 0;
    return ((duration / totalDuration) * 100);
  };

  return (
    <View style={styles.performanceSummary}>
      <Text style={styles.summaryTitle}>⚡ Performance Summary</Text>
      
      <PerformanceIndicator 
        duration={totalDuration} 
        label="Total Analysis Time" 
      />
      
      <Text style={styles.breakdownTitle}>Operation Breakdown:</Text>
      
      {operations.map(({ key, label }) => {
        const duration = performanceData[key]?.value || 0;
        const percentage = getPercentage(duration);
        
        return (
          <View key={key} style={styles.operationRow}>
            <View style={styles.operationInfo}>
              <Text style={styles.operationLabel}>{label}</Text>
              <Text style={styles.operationDuration}>{duration.toFixed(2)}ms</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: duration < 100 ? '#22c55e' : duration < 500 ? '#f59e0b' : '#ef4444'
                  }
                ]} 
              />
            </View>
            <Text style={styles.operationPercentage}>{percentage.toFixed(1)}%</Text>
          </View>
        );
      })}
      
      {performanceData.sub_operations && Object.keys(performanceData.sub_operations).length > 0 && (
        <View style={styles.subOperationsSection}>
          <Text style={styles.subOperationsTitle}>Sub-operations:</Text>
          {Object.entries(performanceData.sub_operations).map(([key, metric]) => (
            <View key={key} style={styles.subOperation}>
              <Text style={styles.subOperationName}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.subOperationDuration}>
                {metric.value?.toFixed(2) || 0}ms
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {performanceData.request_id && (
        <Text style={styles.requestId}>Request ID: {performanceData.request_id}</Text>
      )}
    </View>
  );
};

// Component for displaying performance metrics in a compact format
export const PerformanceCompact = ({ performanceData }) => {
  if (!performanceData) return null;

  const totalDuration = performanceData.total_duration?.value || 0;
  const getPerformanceEmoji = (ms) => {
    if (ms < 100) return '🚀';
    if (ms < 500) return '⚡';
    if (ms < 1000) return '⏱️';
    return '🐌';
  };

  return (
    <View style={styles.performanceCompact}>
      <Text style={styles.compactEmoji}>{getPerformanceEmoji(totalDuration)}</Text>
      <Text style={styles.compactDuration}>{totalDuration.toFixed(0)}ms</Text>
      <Text style={styles.compactLabel}>Analysis Time</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  performanceEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  performanceLevel: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 2,
  },
  performanceDuration: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  timingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  timingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  timingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  timingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  timingDetail: {
    fontSize: 10,
    color: '#94a3b8',
  },
  timingScale: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
  timingHelp: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginTop: 6,
  },
  timingApplication: {
    fontSize: 11,
    color: '#059669',
    lineHeight: 14,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  
  performanceSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  operationInfo: {
    width: 120,
  },
  operationLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  operationDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  operationPercentage: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    width: 35,
    textAlign: 'right',
  },
  
  subOperationsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subOperationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  subOperation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subOperationName: {
    fontSize: 11,
    color: '#64748b',
  },
  subOperationDuration: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0f172a',
  },
  
  requestId: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  
  performanceCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  compactDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 6,
  },
  compactLabel: {
    fontSize: 11,
    color: '#64748b',
  },
});