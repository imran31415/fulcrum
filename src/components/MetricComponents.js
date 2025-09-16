import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMetricInfo } from '../utils/MetricKnowledge';

// Enhanced Metric Card for different value types
export const MetricCard = ({ title, metric }) => {
  if (metric === undefined || metric === null) return null;

  // Debug: Log the metric structure for this specific card (disabled for now)
  // console.log(`MetricCard "${title}":`, JSON.stringify(metric, null, 2));

  // Normalize various metric shapes into a display object
  const normalized = (() => {
    // If metric looks like { value, scale?, help_text?, practical_application? }
    if (typeof metric === 'object' && metric !== null && 'value' in metric) {
      return metric;
    }
    
    // If metric is a primitive, try to enhance it with knowledge base
    const enhanced = getMetricInfo(title, metric);
    return enhanced;
  })();

  const renderValue = (value) => {
    if (typeof value === 'number') {
      // Show up to 2 decimals for readability, but keep integers clean
      const isInt = Number.isInteger(value);
      return isInt ? String(value) : value.toFixed(2);
    } else if (typeof value === 'string') {
      // Truncate very long strings
      return value.length > 200 ? value.substring(0, 200) + '...' : value;
    } else if (Array.isArray(value)) {
      return `${value.length} items`;
    } else if (typeof value === 'object' && value !== null) {
      return `${Object.keys(value).length} properties`;
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>
        {renderValue(normalized.value)}
        {normalized.scale && <Text style={styles.metricScale}> ({normalized.scale})</Text>}
      </Text>
      {normalized.help_text && (
        <Text style={styles.metricHelp}>{normalized.help_text}</Text>
      )}
      {normalized.practical_application && (
        <Text style={styles.metricApplication}>
          💡 {normalized.practical_application}
        </Text>
      )}
    </View>
  );
};

// Specialized component for displaying map/object data
export const MapMetricCard = ({ title, metric }) => {
  if (!metric || typeof metric !== 'object') return null;

  const normalized = (() => {
    if (metric.value) return metric;
    // If it's just a map, try to enhance it with knowledge base info
    const enhanced = getMetricInfo(title, metric);
    return enhanced;
  })();
  
  const mapData = normalized.value || {};

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      {Object.entries(mapData).map(([key, value]) => {
        // Get educational info for this specific map entry
        const entryInfo = getMetricInfo(key, value);
        
        return (
          <View key={key} style={styles.mapItemContainer}>
            <View style={styles.mapItem}>
              <View style={styles.mapKeyContainer}>
                <Text style={styles.mapKey}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                {entryInfo.help_text && (
                  <Text style={styles.helpIcon} title={entryInfo.help_text}>ⓘ</Text>
                )}
              </View>
              <View style={styles.mapValueContainer}>
                <Text style={styles.mapValue}>{String(value)}</Text>
                {entryInfo.scale && (
                  <Text style={styles.entryScale}> ({entryInfo.scale})</Text>
                )}
              </View>
            </View>
            {entryInfo.help_text && (
              <Text style={styles.entryHelp}>{entryInfo.help_text}</Text>
            )}
            {entryInfo.practical_application && (
              <Text style={styles.entryApplication}>
                💡 {entryInfo.practical_application}
              </Text>
            )}
          </View>
        );
      })}
      {normalized.scale && (
        <Text style={styles.metricScale}>Scale: {normalized.scale}</Text>
      )}
      {normalized.help_text && (
        <Text style={styles.metricHelp}>{normalized.help_text}</Text>
      )}
      {normalized.practical_application && (
        <Text style={styles.metricApplication}>
          💡 {normalized.practical_application}
        </Text>
      )}
    </View>
  );
};

// Specialized component for displaying list/array data
export const ListMetricCard = ({ title, metric }) => {
  if (!metric) return null;

  const normalized = (() => {
    if (metric.value) return metric;
    // If it's just a list, try to enhance it with knowledge base info
    const enhanced = getMetricInfo(title, metric);
    return enhanced;
  })();
  
  const listData = Array.isArray(normalized.value) ? normalized.value : [];

  if (listData.length === 0) return null;

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.listCount}>{listData.length} items</Text>
      {listData.slice(0, 5).map((item, index) => (
        <Text key={index} style={styles.listItem}>
          • {typeof item === 'object' ? JSON.stringify(item) : String(item)}
        </Text>
      ))}
      {listData.length > 5 && (
        <Text style={styles.listMore}>... and {listData.length - 5} more</Text>
      )}
      {normalized.scale && (
        <Text style={styles.metricScale}>Scale: {normalized.scale}</Text>
      )}
      {normalized.help_text && (
        <Text style={styles.metricHelp}>{normalized.help_text}</Text>
      )}
      {normalized.practical_application && (
        <Text style={styles.metricApplication}>
          💡 {normalized.practical_application}
        </Text>
      )}
    </View>
  );
};

// Component to intelligently choose the right metric display
export const SmartMetricCard = ({ title, metric }) => {
  if (metric === undefined || metric === null) return null;

  // Determine the best display method based on the data structure
  const value = metric.value !== undefined ? metric.value : metric;

  if (Array.isArray(value)) {
    return <ListMetricCard title={title} metric={metric} />;
  } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return <MapMetricCard title={title} metric={metric} />;
  } else {
    return <MetricCard title={title} metric={metric} />;
  }
};

const styles = StyleSheet.create({
  metricCard: {
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
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  metricScale: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  metricHelp: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  metricApplication: {
    fontSize: 12,
    color: '#059669',
    lineHeight: 16,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  mapItemContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  mapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mapKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapKey: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  helpIcon: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  mapValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  entryScale: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748b',
  },
  entryHelp: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14,
    marginTop: 4,
    paddingLeft: 8,
    fontStyle: 'italic',
  },
  entryApplication: {
    fontSize: 10,
    color: '#059669',
    lineHeight: 13,
    marginTop: 4,
    paddingLeft: 8,
    backgroundColor: '#f0fdf4',
    padding: 4,
    borderRadius: 3,
  },
  listCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 13,
    color: '#475569',
    paddingVertical: 2,
    lineHeight: 18,
  },
  listMore: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
});