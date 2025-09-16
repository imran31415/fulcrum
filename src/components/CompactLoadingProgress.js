import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';

const CompactLoadingProgress = ({ isAnalyzing, promptText }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const steps = [
    { label: 'Initializing...', duration: 500 },
    { label: 'Parsing text...', duration: 800 },
    { label: 'Extracting metrics...', duration: 1200 },
    { label: 'Building graph...', duration: 1500 },
    { label: 'Analyzing complexity...', duration: 1000 },
    { label: 'Grading quality...', duration: 1200 },
    { label: 'Generating suggestions...', duration: 800 },
    { label: 'Finalizing...', duration: 500 },
  ];

  // Calculate estimated total time based on prompt length
  const getEstimatedTime = () => {
    if (!promptText) return 3000;
    const wordCount = promptText.split(/\s+/).length;
    const baseTime = 2000;
    const timePerWord = 5; // ms per word
    return Math.min(baseTime + (wordCount * timePerWord), 10000);
  };

  useLayoutEffect(() => {
    if (isAnalyzing) {
      setCurrentStep(0);
      setProgress(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      const totalTime = getEstimatedTime();
      const stepTime = totalTime / steps.length;

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (totalTime / 50));
          return Math.min(newProgress, 100);
        });
      }, 50);

      steps.forEach((step, index) => {
        setTimeout(() => {
          if (isAnalyzing) {
            setCurrentStep(index);
          }
        }, index * stepTime);
      });

      return () => clearInterval(interval);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isAnalyzing, promptText]);

  if (!isAnalyzing) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Analyzing</Text>
            <Text style={styles.subtitle}>
              {steps[currentStep]?.label || 'Processing...'}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {promptText && promptText.length > 500 && (
          <Text style={styles.tipText}>
            💡 Longer prompts take more time to analyze
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  tipText: {
    fontSize: 10,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CompactLoadingProgress;