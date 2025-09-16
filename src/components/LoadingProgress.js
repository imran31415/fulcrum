import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';

const LoadingProgress = ({ isAnalyzing, promptText }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  const steps = [
    { label: 'Initializing analyzer...', duration: 500 },
    { label: 'Parsing prompt text...', duration: 800 },
    { label: 'Extracting metrics...', duration: 1200 },
    { label: 'Building task graph...', duration: 1500 },
    { label: 'Analyzing complexity...', duration: 1000 },
    { label: 'Grading prompt quality...', duration: 1200 },
    { label: 'Generating suggestions...', duration: 800 },
    { label: 'Finalizing analysis...', duration: 500 },
  ];

  // Calculate estimated total time based on prompt length
  const getEstimatedTime = () => {
    if (!promptText) return 3000;
    const wordCount = promptText.split(/\s+/).length;
    const baseTime = 2000;
    const timePerWord = 5; // ms per word
    return Math.min(baseTime + (wordCount * timePerWord), 10000);
  };

  // Use useLayoutEffect for immediate visual feedback
  useLayoutEffect(() => {
    if (isAnalyzing) {
      // Reset state
      setCurrentStep(0);
      setProgress(0);

      // Animate in immediately with faster animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150, // Faster fade in
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150, // Faster slide in
          useNativeDriver: true,
        }),
      ]).start();

      // Progress through steps after a small delay
      const totalTime = getEstimatedTime();
      const stepTime = totalTime / steps.length;

      // Start progress immediately
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (totalTime / 50)); // Faster updates
          return Math.min(newProgress, 100);
        });
      }, 50); // More frequent updates

      // Update steps
      steps.forEach((step, index) => {
        setTimeout(() => {
          if (isAnalyzing) {
            setCurrentStep(index);
          }
        }, index * stepTime);
      });

      return () => clearInterval(interval);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAnalyzing, promptText]);

  if (!isAnalyzing) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Analyzing Your Prompt</Text>
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

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View
                style={[
                  styles.stepIndicator,
                  index <= currentStep && styles.stepIndicatorActive,
                  index === currentStep && styles.stepIndicatorCurrent,
                ]}
              >
                {index < currentStep ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : index === currentStep ? (
                  <View style={styles.currentDot} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index <= currentStep && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {promptText && promptText.length > 500 && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              💡 Longer prompts take a bit more time to analyze thoroughly
            </Text>
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  checkmark: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  stepLabelActive: {
    color: '#1e293b',
    fontWeight: '500',
  },
  tipContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default LoadingProgress;