import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import AnimatedText from './AnimatedText';

const AboutZeroToken = ({ isCompact = false, showAnimation = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGitHubPress = () => {
    Linking.openURL('https://github.com/imran31415/fulcrum');
  };

  if (isCompact && !isExpanded) {
    return (
      <Pressable 
        style={styles.compactBadge}
        onPress={() => setIsExpanded(true)}
      >
        <Text style={styles.badgeIcon}>ℹ️</Text>
        <Text style={styles.badgeText}>About</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {isCompact && (
        <Pressable 
          style={styles.closeButton}
          onPress={() => setIsExpanded(false)}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      )}
      
      <View style={styles.content}>
        {showAnimation ? (
          <AnimatedText 
            text="💡 About ZeroToken.io"
            style={styles.title}
            delay={100}
            typingSpeed={60}
          />
        ) : (
          <Text style={styles.title}>💡 About ZeroToken.io</Text>
        )}
        
        <View style={styles.description}>
          {showAnimation ? (
            <>
              <AnimatedText 
                text="🪙 AI Tokens = 💸 Cash! ZeroToken lets you dissect your prompts into multiple dimensions using good old-fashioned brute force analysis (no LLM required). Perfect your prompts, grade others, break complex requests into structured tasks... all while keeping your wallet happy! 😄"
                style={styles.descriptionText}
                delay={300}
                typingSpeed={25}
              />
            </>
          ) : (
            <Text style={styles.descriptionText}>
              🪙 AI Tokens = 💸 Cash! ZeroToken lets you dissect your prompts into multiple dimensions using good old-fashioned brute force analysis (no LLM required). Perfect your prompts, grade others, break complex requests into structured tasks... all while keeping your wallet happy! 😄
            </Text>
          )}
        </View>

        <Pressable 
          style={styles.githubButton}
          onPress={handleGitHubPress}
        >
          <Text style={styles.githubIcon}>⭐</Text>
          {showAnimation ? (
            <AnimatedText 
              text="View Source Code"
              style={styles.githubText}
              delay={600}
              typingSpeed={40}
            />
          ) : (
            <Text style={styles.githubText}>View Source Code</Text>
          )}
        </Pressable>

        <View style={styles.funFact}>
          <Text style={styles.funFactLabel}>🤓 Fun Fact:</Text>
          {showAnimation ? (
            <AnimatedText 
              text="ZeroToken is 100% client-side! Your data never leaves your browser. We use WASM + Web Workers to analyze hundreds of text dimensions locally. No servers, no tracking, no tokens spent! 🚀"
              style={styles.funFactText}
              delay={800}
              typingSpeed={20}
            />
          ) : (
            <Text style={styles.funFactText}>
              ZeroToken is 100% client-side! Your data never leaves your browser. We use WASM + Web Workers to analyze hundreds of text dimensions locally. No servers, no tracking, no tokens spent! 🚀
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerCompact: {
    position: 'relative',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    margin: 16,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginVertical: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    paddingRight: 16, // Space for close button in compact mode
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    shadowColor: '#374151',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  githubIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  githubText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  funFact: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  funFactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
});

export default AboutZeroToken;