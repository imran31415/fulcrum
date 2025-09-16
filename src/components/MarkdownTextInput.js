import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

const MarkdownTextInput = ({ value, onChangeText, placeholder }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
  const [lineNumbers, setLineNumbers] = useState([]);
  const inputRef = useRef(null);

  // Calculate line numbers
  useEffect(() => {
    const lines = value.split('\n');
    setLineNumbers(lines.map((_, i) => i + 1));
  }, [value]);

  // Simple markdown preview (basic implementation)
  const renderMarkdownPreview = (text) => {
    // This is a simple markdown parser - can be enhanced
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    html = html.replace(/__([^_]+)__/g, '<b>$1</b>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    html = html.replace(/_([^_]+)_/g, '<i>$1</i>');
    
    // Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.+)/gim, '• $1');
    html = html.replace(/^\d+\. (.+)/gim, '○ $1');
    
    // Line breaks
    html = html.replace(/\n/g, '\n');
    
    return html;
  };

  // Insert markdown syntax
  const insertMarkdown = (before, after = '') => {
    const start = cursorPosition.start;
    const end = cursorPosition.end;
    const selectedText = value.substring(start, end);
    const newText = 
      value.substring(0, start) + 
      before + selectedText + after + 
      value.substring(end);
    
    onChangeText(newText);
    
    // Update cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = start + before.length + selectedText.length;
        inputRef.current.setNativeProps({
          selection: { start: newPosition, end: newPosition }
        });
      }
    }, 10);
  };

  // Toolbar buttons
  const ToolbarButton = ({ onPress, children, label }) => (
    <TouchableOpacity
      style={styles.toolbarButton}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Text style={styles.toolbarButtonText}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Markdown Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ToolbarButton
            onPress={() => insertMarkdown('**', '**')}
            label="Bold"
          >
            <Text style={{ fontWeight: 'bold' }}>B</Text>
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('_', '_')}
            label="Italic"
          >
            <Text style={{ fontStyle: 'italic' }}>I</Text>
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('# ')}
            label="Heading"
          >
            H1
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('## ')}
            label="Subheading"
          >
            H2
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('* ')}
            label="Bullet list"
          >
            •
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('1. ')}
            label="Numbered list"
          >
            1.
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('`', '`')}
            label="Code"
          >
            {'</>'}
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('> ')}
            label="Quote"
          >
            "
          </ToolbarButton>
          
          <ToolbarButton
            onPress={() => insertMarkdown('[', '](url)')}
            label="Link"
          >
            🔗
          </ToolbarButton>
          
          <View style={styles.toolbarSeparator} />
          
          <ToolbarButton
            onPress={() => setShowPreview(!showPreview)}
            label={showPreview ? 'Edit' : 'Preview'}
          >
            {showPreview ? '✏️' : '👁'}
          </ToolbarButton>
        </ScrollView>
      </View>

      {/* Main Text Input */}
      <TextInput
        ref={inputRef}
        style={styles.mainTextInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline
        textAlignVertical="top"
        onSelectionChange={(event) => {
          setCursorPosition(event.nativeEvent.selection);
        }}
      />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {value.split(/\s+/).filter(w => w).length} words • {value.length} chars
        </Text>
        <Text style={styles.statusText}>
          Line {Math.max(1, value.substring(0, cursorPosition.start).split('\n').length)}
        </Text>
      </View>
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
  },
  toolbar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 16, // Increased for better consistency
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 32,
    alignItems: 'center',
  },
  toolbarButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  toolbarSeparator: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  mainTextInput: {
    padding: 24, // Increased from 16 to 24 for better spacing
    minHeight: 400,
    fontSize: 15,
    lineHeight: 22,
    color: '#0f172a',
    textAlignVertical: 'top',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  preview: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  previewText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 24,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24, // Increased to match text input padding
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
  },
});

export default MarkdownTextInput;