import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';

const MetricTooltip = ({ metric, label, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!metric) return children || null;

  const hasMethodology = metric.methodology && metric.methodology.length > 0;
  const hasHelp = metric.help_text || metric.practical_application;

  if (!hasMethodology && !hasHelp) {
    return children || <Text style={styles.value}>{metric.value}</Text>;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowTooltip(true)}
        style={styles.touchable}
      >
        {children || (
          <View style={styles.valueContainer}>
            <Text style={styles.value}>
              {typeof metric.value === 'number' 
                ? metric.value.toFixed(2) 
                : metric.value}
            </Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Metric Details'}</Text>
                <TouchableOpacity onPress={() => setShowTooltip(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Value */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Value</Text>
                <Text style={styles.valueText}>
                  {typeof metric.value === 'number' 
                    ? metric.value.toFixed(2) 
                    : metric.value}
                </Text>
                {metric.scale && (
                  <Text style={styles.scaleText}>{metric.scale}</Text>
                )}
              </View>

              {/* Methodology */}
              {hasMethodology && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>📐 Methodology</Text>
                  <View style={styles.methodologyBox}>
                    <Text style={styles.methodologyText}>
                      {metric.methodology}
                    </Text>
                  </View>
                </View>
              )}

              {/* Help Text */}
              {metric.help_text && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>📖 Description</Text>
                  <Text style={styles.helpText}>{metric.help_text}</Text>
                </View>
              )}

              {/* Practical Application */}
              {metric.practical_application && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>💡 How to Use</Text>
                  <Text style={styles.applicationText}>
                    {metric.practical_application}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoIcon: {
    marginLeft: 4,
    fontSize: 12,
    color: '#3b82f6',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 20,
    color: '#64748b',
    padding: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  scaleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  methodologyBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  methodologyText: {
    fontSize: 13,
    color: '#1e40af',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    lineHeight: 18,
  },
  helpText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  applicationText: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
});

export default MetricTooltip;