import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SmartMetricCard } from './MetricComponents';
import { PerformanceSummary, TimingCard } from './PerformanceComponents';

// Enhanced Analysis Section with better organization
export const AnalysisSection = ({ title, data, emoji }) => {
  if (data === null || data === undefined) return null;

  // Special handling for performance metrics
  if (title === 'Performance Metrics' && typeof data === 'object') {
    return (
      <View style={styles.analysisSection}>
        <Text style={styles.analysisSectionTitle}>
          {emoji} {title}
        </Text>
        <PerformanceSummary performanceData={data} />
        
        {/* Individual timing cards for detailed view */}
        {Object.entries(data).map(([key, value]) => {
          if (key.includes('duration') && typeof value === 'object') {
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
      </View>
    );
  }

  // Handle primitives by wrapping them in a single metric
  const entries = (() => {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data);
    }
    // For arrays, numbers, strings, etc., create a single entry
    return [['value', data]];
  })();

  return (
    <View style={styles.analysisSection}>
      <Text style={styles.analysisSectionTitle}>
        {emoji} {title}
      </Text>
      {entries.map(([key, value]) => (
        <SmartMetricCard 
          key={key} 
          title={key === 'value' ? title : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
          metric={value} 
        />
      ))}
    </View>
  );
};

// Enhanced Result Display with comprehensive section mapping
export const EnhancedResultDisplay = ({ data }) => {
  if (!data) return null;

  // Debug: Log the data structure to help troubleshoot
  console.log('Enhanced view data:', JSON.stringify(data, null, 2));

  // Build known sections with graceful fallbacks for varying JSON shapes
  const sectionConfigs = [
    {
      keys: ['complexity_metrics', 'complexity', 'readability'],
      title: 'Readability Analysis',
      emoji: '📊',
      priority: 1
    },
    {
      keys: ['word_stats', 'word_statistics'],
      title: 'Word Analysis',
      emoji: '📝',
      priority: 2
    },
    {
      keys: ['sentence_stats', 'sentence_statistics'],
      title: 'Sentence Analysis',
      emoji: '📄',
      priority: 3
    },
    {
      keys: ['syllable_stats', 'syllable_statistics'],
      title: 'Syllable Analysis',
      emoji: '🔤',
      priority: 4
    },
    {
      keys: ['preprocessing', 'processing', 'normalization'],
      title: 'Text Processing',
      emoji: '🔧',
      priority: 5
    },
    {
      keys: ['text_statistics', 'statistics', 'stats'],
      title: 'Text Statistics',
      emoji: '📈',
      priority: 6
    },
    {
      keys: ['language_detection', 'language'],
      title: 'Language Detection',
      emoji: '🌍',
      priority: 7
    },
    {
      keys: ['encoding_info', 'encoding'],
      title: 'Encoding Analysis',
      emoji: '⚙️',
      priority: 8
    },
    {
      keys: ['quality_metrics', 'quality'],
      title: 'Quality Assessment',
      emoji: '✅',
      priority: 9
    },
    {
      keys: ['extraction_results', 'extracted', 'entities'],
      title: 'Information Extraction',
      emoji: '🎯',
      priority: 10
    },
    {
      keys: ['tokens', 'tokenization', 'token_metrics'],
      title: 'Tokenization',
      emoji: '🔍',
      priority: 11
    },
    {
      keys: ['token_counts', 'counts'],
      title: 'Token Counts',
      emoji: '📊',
      priority: 12
    },
    {
      keys: ['ngrams', 'n_grams'],
      title: 'N-Grams',
      emoji: '🔗',
      priority: 13
    },
    {
      keys: ['part_of_speech', 'pos'],
      title: 'Part of Speech',
      emoji: '🏷️',
      priority: 14
    },
    {
      keys: ['syntactic_structure', 'syntax'],
      title: 'Syntactic Structure',
      emoji: '🌳',
      priority: 15
    },
    {
      keys: ['semantic_features', 'semantics'],
      title: 'Semantic Features',
      emoji: '🧠',
      priority: 16
    },
    {
      keys: ['character_analysis', 'characters'],
      title: 'Character Analysis',
      emoji: '🔡',
      priority: 17
    },
    {
      keys: ['performance_metrics', 'performance'],
      title: 'Performance Metrics',
      emoji: '⚡',
      priority: 18
    }
  ];

  const sections = [];
  const consumed = new Set();

  // Find matching sections
  sectionConfigs.forEach(({ keys, title, emoji, priority }) => {
    for (const k of keys) {
      if (data && Object.prototype.hasOwnProperty.call(data, k) && data[k] && !consumed.has(k)) {
        sections.push({ title, emoji, data: data[k], priority });
        consumed.add(k);
        break;
      }
    }
  });

  // Handle any remaining unconsumed keys
  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([k, v]) => {
      if (!consumed.has(k) && v !== null && v !== undefined) {
        sections.push({ 
          title: k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), 
          emoji: '🧩', 
          data: v,
          priority: 999 
        });
      }
    });
  }

  // Final fallback: if still no sections, create one with all data
  if (sections.length === 0) {
    sections.push({ title: 'Analysis Result', emoji: '📊', data, priority: 1 });
  }

  // Sort sections by priority
  sections.sort((a, b) => a.priority - b.priority);

  return (
    <ScrollView style={styles.enhancedOutput} contentContainerStyle={styles.enhancedOutputContent} showsVerticalScrollIndicator={true}>
      <View>
        {sections.length > 0 ? (
          sections.map((s, idx) => (
            <AnalysisSection key={`${s.title}-${idx}`} title={s.title} data={s.data} emoji={s.emoji} />
          ))
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataTitle}>No Data Available</Text>
            <Text style={styles.noDataHelp}>The analysis result appears to be empty or in an unexpected format.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  enhancedOutput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 200,
  },
  enhancedOutputContent: {
    padding: 16,
    flexGrow: 1,
  },
  noDataCard: {
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
  noDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  noDataHelp: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
