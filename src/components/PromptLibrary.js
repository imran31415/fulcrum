import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { promptLibrary } from '../utils/promptLoader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PromptLibrary = ({ visible, onClose, onSelectPrompt, embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [slideAnim] = useState(new Animated.Value(screenWidth));

  console.log('📚 Loading prompt library:', promptLibrary);

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Filter prompts based on search and category
  const filteredPrompts = promptLibrary.prompts.filter(prompt => {
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleSelectPrompt = (prompt) => {
    onSelectPrompt(prompt.template);
    onClose();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = promptLibrary.categories.find(cat => cat.id === categoryId);
    return category ? category.icon : '📝';
  };

  if (!visible && !embedded) return null;

  const content = embedded ? (
    // Embedded version without animation
    <View style={styles.embeddedContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search prompts..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {promptLibrary.categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === category.id && styles.categoryCountActive
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  selectedCategory === category.id && styles.categoryCountTextActive
                ]}>
                  {category.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Prompt List */}
      <ScrollView 
        style={styles.promptList}
        showsVerticalScrollIndicator={false}
      >
        {filteredPrompts.map(prompt => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.promptCard}
            onPress={() => handleSelectPrompt(prompt)}
            activeOpacity={0.8}
          >
            <View style={styles.promptHeader}>
              <View style={styles.promptTitleContainer}>
                <Text style={styles.promptIcon}>
                  {getCategoryIcon(prompt.category)}
                </Text>
                <View style={styles.promptInfo}>
                  <Text style={styles.promptTitle} numberOfLines={1}>
                    {prompt.title}
                  </Text>
                  <Text style={styles.promptDescription} numberOfLines={2}>
                    {prompt.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.promptMeta}>
                <View style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(prompt.priority) }
                ]} />
                <Text style={styles.useCount}>
                  {prompt.useCount} uses
                </Text>
              </View>
            </View>

            <View style={styles.promptTags}>
              {prompt.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {prompt.tags.length > 3 && (
                <Text style={styles.moreTags}>+{prompt.tags.length - 3}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredPrompts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No prompts found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  ) : (
    // Modal version with animation
    <Animated.View
      style={[
        styles.sidebar,
        {
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>📚 Prompt Library</Text>
          <Text style={styles.subtitle}>
            {filteredPrompts.length} professional templates
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search prompts..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {promptLibrary.categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === category.id && styles.categoryCountActive
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  selectedCategory === category.id && styles.categoryCountTextActive
                ]}>
                  {category.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Prompt List */}
      <ScrollView 
        style={styles.promptList}
        showsVerticalScrollIndicator={false}
      >
        {filteredPrompts.map(prompt => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.promptCard}
            onPress={() => handleSelectPrompt(prompt)}
            activeOpacity={0.8}
          >
            <View style={styles.promptHeader}>
              <View style={styles.promptTitleContainer}>
                <Text style={styles.promptIcon}>
                  {getCategoryIcon(prompt.category)}
                </Text>
                <View style={styles.promptInfo}>
                  <Text style={styles.promptTitle} numberOfLines={1}>
                    {prompt.title}
                  </Text>
                  <Text style={styles.promptDescription} numberOfLines={2}>
                    {prompt.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.promptMeta}>
                <View style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(prompt.priority) }
                ]} />
                <Text style={styles.useCount}>
                  {prompt.useCount} uses
                </Text>
              </View>
            </View>

            <View style={styles.promptTags}>
              {prompt.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {prompt.tags.length > 3 && (
                <Text style={styles.moreTags}>+{prompt.tags.length - 3}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredPrompts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No prompts found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        {content}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    width: Math.min(480, screenWidth * 0.85),
    height: screenHeight,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  embeddedContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryCountText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryCountTextActive: {
    color: '#ffffff',
  },
  promptList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  promptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  promptIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  promptInfo: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  promptDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  promptMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  useCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  promptTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PromptLibrary;