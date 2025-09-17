import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const InteractiveTextInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  suggestions = [],
  onSuggestionClick,
  showSuggestions = true,
  style 
}) => {
  console.log('🎯 InteractiveTextInput mounted with:', {
    suggestionCount: suggestions.length,
    showSuggestions,
    textLength: value.length
  });
  const [showPreview, setShowPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
  const [tooltipAnimation] = useState(new Animated.Value(0));
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [showSuggestionsTooltip, setShowSuggestionsTooltip] = useState(false);
  const [suggestionsTooltipAnim] = useState(new Animated.Value(0));
  const [suggestionMarkers, setSuggestionMarkers] = useState([]);
  
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const pulseAnimations = useRef({}).current;
  
  // Text analysis for mapping suggestions to positions
  const mapSuggestionsToPositions = useCallback((text, suggestions) => {
    const markers = [];
    
    suggestions.forEach((suggestion, index) => {
      const positions = findSuggestionPositions(text, suggestion);
      positions.forEach(pos => {
        markers.push({
          id: `${index}-${pos.start}`,
          suggestion,
          position: pos,
          priority: suggestion.priority,
          type: getSuggestionType(suggestion)
        });
      });
    });
    
    return markers.sort((a, b) => a.position.start - b.position.start);
  }, []);

  // Find text positions where suggestions apply
  const findSuggestionPositions = (text, suggestion) => {
    const positions = [];
    console.log('🔍 Analyzing suggestion:', suggestion.message);
    
    // Map suggestion types to search patterns
    if (suggestion.message.toLowerCase().includes('pronoun')) {
      const pronouns = ['it', 'this', 'that', 'these', 'those', 'they', 'them', 'we', 'us'];
      pronouns.forEach(pronoun => {
        const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          console.log(`Found pronoun "${match[0]}" at position ${match.index}`);
          positions.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'pronoun',
            replacement: suggestion.example?.split('To: ')[1] || 'specific noun'
          });
        }
      });
    }
    
    else if (suggestion.message.includes('sentence')) {
      // Find long sentences (>25 words)
      const sentences = text.split(/[.!?]+/);
      let currentPos = 0;
      sentences.forEach(sentence => {
        const wordCount = sentence.trim().split(/\s+/).filter(w => w).length;
        if (wordCount > 25) {
          const start = text.indexOf(sentence.trim(), currentPos);
          if (start !== -1) {
            positions.push({
              start: start + sentence.trim().length - 1,
              end: start + sentence.trim().length,
              type: 'long-sentence',
              wordCount
            });
          }
        }
        currentPos += sentence.length + 1;
      });
    }
    
    else if (suggestion.message.includes('action verbs')) {
      // Find passive voice or weak verb areas
      const weakPatterns = ['should be', 'will be', 'need to', 'have to'];
      weakPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          positions.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'weak-verb'
          });
        }
      });
    }
    
    else if (suggestion.message.includes('transition words')) {
      // Find sentence boundaries that could use transitions
      const sentences = text.split(/[.!?]+/);
      let currentPos = 0;
      for (let i = 1; i < sentences.length; i++) {
        const prevSentence = sentences[i-1].trim();
        const currSentence = sentences[i].trim();
        
        if (prevSentence && currSentence && !hasTransitionWord(currSentence)) {
          const start = text.indexOf(currSentence, currentPos);
          if (start !== -1) {
            positions.push({
              start: start,
              end: start + 1,
              type: 'missing-transition'
            });
          }
        }
        currentPos += sentences[i-1].length + 1;
      }
    }
    
    // If no specific patterns matched, add fallback markers
    if (positions.length === 0) {
      console.log('No specific patterns found, adding fallback markers');
      // Add markers at paragraph starts or every ~100 characters
      const paragraphs = text.split('\n');
      let currentPos = 0;
      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim() && index < 5) { // First 5 paragraphs
          positions.push({
            start: currentPos + Math.min(paragraph.length / 2, 50), // Middle of paragraph or 50 chars
            end: currentPos + Math.min(paragraph.length / 2, 50) + 1,
            type: 'general',
            paragraph: index
          });
        }
        currentPos += paragraph.length + 1; // +1 for \n
      });
      
      // If still no positions, add one at the start
      if (positions.length === 0) {
        positions.push({
          start: Math.min(20, text.length - 1),
          end: Math.min(21, text.length),
          type: 'general'
        });
      }
    }
    
    console.log(`Found ${positions.length} positions for: ${suggestion.message}`);
    return positions;
  };

  const hasTransitionWord = (sentence) => {
    const transitions = ['first', 'then', 'next', 'after', 'before', 'finally', 'meanwhile', 'however', 'therefore'];
    return transitions.some(word => sentence.toLowerCase().includes(word));
  };

  const getSuggestionType = (suggestion) => {
    if (suggestion.message.includes('pronouns')) return 'pronoun';
    if (suggestion.message.includes('sentence')) return 'sentence';
    if (suggestion.message.includes('action verbs')) return 'verb';
    if (suggestion.message.includes('transition')) return 'transition';
    return 'general';
  };

  // Update suggestion markers when text or suggestions change
  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      const markers = mapSuggestionsToPositions(value, suggestions);
      console.log('📍 Mapped suggestion markers:', markers.length, markers);
      setSuggestionMarkers(markers);
      
      // Create pulse animations for each marker
      markers.forEach(marker => {
        if (!pulseAnimations[marker.id]) {
          pulseAnimations[marker.id] = new Animated.Value(0);
          
          // Start continuous pulse animation
          const startPulse = () => {
            Animated.sequence([
              Animated.timing(pulseAnimations[marker.id], {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimations[marker.id], {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              })
            ]).start(() => startPulse());
          };
          
          // Stagger the start times for a more natural effect
          setTimeout(() => startPulse(), Math.random() * 1000);
        }
      });
    } else {
      console.log('📍 No suggestions or not showing suggestions');
      setSuggestionMarkers([]);
    }
  }, [value, suggestions, showSuggestions, mapSuggestionsToPositions, pulseAnimations]);

  // Handle suggestion marker click
  const handleMarkerClick = (marker, event) => {
    setActiveTooltip(marker);
    
    // Animate tooltip appearance
    Animated.spring(tooltipAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
    
    if (onSuggestionClick) {
      onSuggestionClick(marker.suggestion, marker.position);
    }
  };

  // Close tooltip
  const closeTooltip = () => {
    Animated.timing(tooltipAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveTooltip(null);
    });
  };

  // Handle suggestions pill click
  const handleSuggestionsPillClick = () => {
    setShowSuggestionsTooltip(true);
    Animated.spring(suggestionsTooltipAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  // Close suggestions tooltip
  const closeSuggestionsTooltip = () => {
    Animated.timing(suggestionsTooltipAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestionsTooltip(false);
    });
  };

  // Calculate marker positions with better accuracy
  const getMarkerStyle = (marker) => {
    const lineHeight = 22;
    const charWidth = 7.5; // Slightly more accurate for most fonts
    const padding = 24;
    
    // Get text before the marker position
    const textBeforeMarker = value.substring(0, marker.position.start);
    
    // Count actual line breaks
    const lines = textBeforeMarker.split('\n');
    const lineNumber = lines.length - 1;
    const charInLine = lines[lines.length - 1].length;
    
    // Calculate position
    const left = padding + (charInLine * charWidth);
    const top = padding + (lineNumber * lineHeight);
    
    return {
      position: 'absolute',
      left: Math.min(left, 400), // Prevent going too far right
      top: top,
      zIndex: 10,
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'rgba(239, 68, 68, 0.7)'; // More transparent red
      case 'medium': return 'rgba(245, 158, 11, 0.7)'; // More transparent orange
      case 'low': return 'rgba(16, 185, 129, 0.7)'; // More transparent green
      default: return 'rgba(107, 114, 128, 0.7)'; // More transparent gray
    }
  };

  const insertMarkdown = (before, after = '') => {
    const start = cursorPosition.start;
    const end = cursorPosition.end;
    const selectedText = value.substring(start, end);
    const newText = 
      value.substring(0, start) + 
      before + selectedText + after + 
      value.substring(end);
    
    onChangeText(newText);
    
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = start + before.length + selectedText.length;
        inputRef.current.setNativeProps({
          selection: { start: newPosition, end: newPosition }
        });
      }
    }, 10);
  };

  const ToolbarButton = ({ onPress, children, label, active = false }) => (
    <TouchableOpacity
      style={[styles.toolbarButton, active && styles.toolbarButtonActive]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Text style={[styles.toolbarButtonText, active && styles.toolbarButtonTextActive]}>
        {children}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Enhanced Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.toolbarSection}>
            <ToolbarButton onPress={() => insertMarkdown('**', '**')} label="Bold">
              <Text style={{ fontWeight: 'bold' }}>B</Text>
            </ToolbarButton>
            
            <ToolbarButton onPress={() => insertMarkdown('_', '_')} label="Italic">
              <Text style={{ fontStyle: 'italic' }}>I</Text>
            </ToolbarButton>
            
            <ToolbarButton onPress={() => insertMarkdown('# ')} label="Heading">
              H1
            </ToolbarButton>
            
            <ToolbarButton onPress={() => insertMarkdown('## ')} label="Subheading">
              H2
            </ToolbarButton>
          </View>
          
          <View style={styles.toolbarSeparator} />
          
          <View style={styles.toolbarSection}>
            <ToolbarButton onPress={() => insertMarkdown('* ')} label="Bullet list">
              •
            </ToolbarButton>
            
            <ToolbarButton onPress={() => insertMarkdown('1. ')} label="Numbered list">
              1.
            </ToolbarButton>
            
            <ToolbarButton onPress={() => insertMarkdown('`', '`')} label="Code">
              {'</>'}
            </ToolbarButton>
          </View>
          
          <View style={styles.toolbarSeparator} />
          
          <View style={styles.toolbarSection}>
            <ToolbarButton 
              onPress={() => setShowPreview(!showPreview)} 
              label={showPreview ? 'Edit' : 'Preview'}
              active={showPreview}
            >
              {showPreview ? '✏️' : '👁'}
            </ToolbarButton>
            
            {suggestions.length > 0 && (
              <TouchableOpacity 
                style={styles.suggestionsCounter}
                onPress={handleSuggestionsPillClick}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionsCountText}>
                  {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Main Input with Line Numbers */}
      <View style={styles.inputContainer}>
        {/* Line Numbers Column */}
        <View style={styles.lineNumbersColumn}>
          {showSuggestions && value && Array.from({ length: value.split('\n').length }, (_, index) => {
            const lineNumber = index + 1;
            const lineMarkers = suggestionMarkers.filter(marker => {
              const textBeforeMarker = value.substring(0, marker.position.start);
              const markerLine = textBeforeMarker.split('\n').length;
              return markerLine === lineNumber;
            });
            
            return (
              <View key={lineNumber} style={styles.lineNumberRow}>
                <Text style={styles.lineNumber}>{lineNumber}</Text>
                {lineMarkers.length > 0 && (
                  <View style={styles.lineMarkers}>
                    {lineMarkers.map((marker) => (
                      <TouchableOpacity
                        key={marker.id}
                        style={[
                          styles.lineMarker,
                          { backgroundColor: getPriorityColor(marker.priority) }
                        ]}
                        onPress={(e) => handleMarkerClick(marker, e)}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.lineMarkerPulse,
                            {
                              opacity: pulseAnimations[marker.id]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.4, 0.9]
                              }) || 0.4,
                            }
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        
        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[styles.mainTextInput, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          onSelectionChange={(event) => {
            setCursorPosition(event.nativeEvent.selection);
          }}
        />
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {value.split(/\s+/).filter(w => w).length} words • {value.length} characters
        </Text>
        <Text style={styles.statusText}>
          Line {Math.max(1, value.substring(0, cursorPosition.start).split('\n').length)}
        </Text>
      </View>

      {/* Suggestion Tooltip */}
      {activeTooltip && (
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={closeTooltip}
        >
          <Animated.View
            style={[
              styles.tooltip,
              {
                opacity: tooltipAnimation,
                transform: [{
                  scale: tooltipAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }
            ]}
          >
            <View style={styles.tooltipHeader}>
              <View style={styles.tooltipPriority}>
                <View style={[
                  styles.priorityDot, 
                  { backgroundColor: getPriorityColor(activeTooltip.priority) }
                ]} />
                <Text style={styles.priorityText}>
                  {activeTooltip.priority.charAt(0).toUpperCase() + activeTooltip.priority.slice(1)} Priority
                </Text>
              </View>
              
              <TouchableOpacity onPress={closeTooltip} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.tooltipTitle}>
              {activeTooltip.suggestion.dimension}
            </Text>
            
            <Text style={styles.tooltipMessage}>
              {activeTooltip.suggestion.message}
            </Text>

            <View style={styles.tooltipImpact}>
              <Text style={styles.impactLabel}>Expected Impact:</Text>
              <Text style={styles.impactText}>
                {activeTooltip.suggestion.impact}
              </Text>
            </View>

            {activeTooltip.suggestion.example && (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleLabel}>Example:</Text>
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleText}>
                    {activeTooltip.suggestion.example}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.tooltipActions}>
              <TouchableOpacity style={styles.actionButton} onPress={closeTooltip}>
                <Text style={styles.actionButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Suggestions Info Tooltip */}
      {showSuggestionsTooltip && (
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={closeSuggestionsTooltip}
        >
          <Animated.View
            style={[
              styles.suggestionsTooltip,
              {
                opacity: suggestionsTooltipAnim,
                transform: [{
                  scale: suggestionsTooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }
            ]}
          >
            <View style={styles.suggestionsTooltipHeader}>
              <Text style={styles.suggestionsTooltipTitle}>💡 How to Use Suggestions</Text>
              <TouchableOpacity onPress={closeSuggestionsTooltip} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.suggestionsTooltipMessage}>
              Look for the colored markers next to line numbers to see specific suggestions for improving your text. Each marker represents a different type of enhancement.
            </Text>
            
            <View style={styles.suggestionsTooltipTips}>
              <View style={styles.suggestionTip}>
                <Text style={styles.tipIcon}>🎯</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Click markers</Text> to see detailed suggestions
                </Text>
              </View>
              
              <View style={styles.suggestionTip}>
                <Text style={styles.tipIcon}>📊</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Analysis tab</Text> shows aggregate insights
                </Text>
              </View>
              
              <View style={styles.suggestionTip}>
                <Text style={styles.tipIcon}>🌈</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Color coding:</Text> Red (high), Orange (medium), Green (low) priority
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.suggestionsTooltipButton} onPress={closeSuggestionsTooltip}>
              <Text style={styles.suggestionsTooltipButtonText}>Got it!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toolbar: {
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  toolbarButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  toolbarButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  toolbarButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  toolbarButtonTextActive: {
    color: '#ffffff',
  },
  toolbarSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  suggestionsCounter: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginLeft: 8,
  },
  suggestionsCountText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  lineNumbersColumn: {
    width: 40,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingTop: 24,
  },
  lineNumberRow: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  lineNumber: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '400',
    minWidth: 16,
    textAlign: 'right',
  },
  lineMarkers: {
    flexDirection: 'row',
    gap: 2,
  },
  lineMarker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  lineMarkerPulse: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -2,
    left: -2,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  mainTextInput: {
    flex: 1,
    padding: 24,
    paddingLeft: 12, // Reduced since line numbers provide the left spacing
    minHeight: 320, // Increased to better fill the 400px container
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    textAlignVertical: 'top',
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'sans-serif',
      default: 'system-ui',
    }),
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fafbfc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  // Tooltip styles
  tooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxWidth: screenWidth * 0.9,
    minWidth: 300,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tooltipTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 8,
  },
  tooltipMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  tooltipImpact: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  impactLabel: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  impactText: {
    fontSize: 13,
    color: '#0c4a6e',
    fontWeight: '500',
  },
  exampleContainer: {
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  exampleBox: {
    backgroundColor: '#f6f8fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  tooltipActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Suggestions info tooltip styles
  suggestionsTooltip: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxWidth: screenWidth * 0.9,
    minWidth: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  suggestionsTooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionsTooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  suggestionsTooltipMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
    marginBottom: 20,
  },
  suggestionsTooltipTips: {
    marginBottom: 24,
  },
  suggestionTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    flex: 1,
  },
  tipBold: {
    fontWeight: '600',
    color: '#374151',
  },
  suggestionsTooltipButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  suggestionsTooltipButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InteractiveTextInput;
