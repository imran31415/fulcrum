import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// TaskNode Component - Individual task with beautiful styling
const TaskNode = ({ task, index, isSelected, onPress, connections }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 50,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        delay: index * 50,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for selected state
    if (isSelected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSelected]);

  const getTypeColor = () => {
    const colors = {
      action: '#4CAF50',
      requirement: '#FF9800',
      goal: '#2196F3',
      question: '#9C27B0',
      need: '#F44336',
    };
    return colors[task.type] || '#607D8B';
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getEffortBadge = () => {
    const badges = {
      small: { text: 'S', color: '#4CAF50' },
      medium: { text: 'M', color: '#FF9800' },
      large: { text: 'L', color: '#F44336' },
    };
    return badges[task.estimated_effort] || { text: '?', color: '#9E9E9E' };
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.taskNode,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { rotate: spin },
          ],
          borderColor: getTypeColor(),
          backgroundColor: isSelected ? `${getTypeColor()}15` : '#ffffff',
        },
      ]}
    >
      <Pressable onPress={() => onPress(task)} style={styles.taskNodeContent}>
        <Animated.View
          style={[
            styles.taskNodeInner,
            {
              transform: [{ rotate: Animated.multiply(rotateAnim, -1).interpolate({
                inputRange: [0, 1],
                outputRange: ['360deg', '0deg'],
              }) }],
            },
          ]}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskBadges}>
              <Text style={styles.priorityIcon}>{getPriorityIcon()}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
                <Text style={styles.typeBadgeText}>{task.type.toUpperCase()}</Text>
              </View>
              <View style={[styles.effortBadge, { backgroundColor: getEffortBadge().color }]}>
                <Text style={styles.effortBadgeText}>{getEffortBadge().text}</Text>
              </View>
            </View>
            <Text style={styles.taskConfidence}>{Math.round(task.confidence * 100)}%</Text>
          </View>
          
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          
          {task.keywords && task.keywords.length > 0 && (
            <View style={styles.keywordsContainer}>
              {task.keywords.slice(0, 3).map((keyword, idx) => (
                <View key={idx} style={styles.keywordChip}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          )}
          
          {connections > 0 && (
            <View style={styles.connectionsIndicator}>
              <Text style={styles.connectionsText}>🔗 {connections} connections</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Connection Line Component
const ConnectionLine = ({ from, to, relationship }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: relationship.strength,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const getRelationshipColor = () => {
    const colors = {
      depends_on: '#F44336',
      blocks: '#FF9800',
      related: '#4CAF50',
      subtask: '#2196F3',
      parallel: '#9C27B0',
    };
    return colors[relationship.relation_type] || '#607D8B';
  };

  return (
    <Animated.View
      style={[
        styles.connectionLine,
        {
          opacity: opacityAnim,
          backgroundColor: getRelationshipColor(),
        },
      ]}
    />
  );
};

// Main TaskGraph Component
export default function TaskGraph({ taskGraphData }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('workflow'); // 'workflow', 'graph', 'list'
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!taskGraphData || !taskGraphData.tasks) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No tasks identified</Text>
        <Text style={styles.emptySubtext}>Try analyzing text with actionable items</Text>
      </View>
    );
  }

  const { tasks, relationships, root_tasks, leaf_tasks, critical_path, graph_complexity } = taskGraphData;

  const getTaskConnections = (taskId) => {
    return relationships?.filter(
      rel => rel.from_task_id === taskId || rel.to_task_id === taskId
    ).length || 0;
  };

  const renderGraphView = () => {
    // Build a visual workflow diagram
    const renderTaskFlow = () => {
      // Create a map for quick task lookup
      const taskMap = {};
      tasks.forEach(task => {
        taskMap[task.id] = task;
      });

      // Find the starting tasks and build chains
      const chains = [];
      const processedTasks = new Set();

      // Build dependency chains starting from root tasks
      root_tasks?.forEach(rootId => {
        if (!processedTasks.has(rootId)) {
          const chain = [];
          let currentId = rootId;
          
          // Follow the dependency chain
          while (currentId && taskMap[currentId] && !processedTasks.has(currentId)) {
            chain.push(taskMap[currentId]);
            processedTasks.add(currentId);
            
            // Find what this task blocks (next in chain)
            const nextTask = taskMap[currentId].blocks?.[0];
            currentId = nextTask;
          }
          
          if (chain.length > 0) {
            chains.push(chain);
          }
        }
      });

      // Add any remaining unprocessed tasks as separate chains
      tasks.forEach(task => {
        if (!processedTasks.has(task.id)) {
          chains.push([task]);
          processedTasks.add(task.id);
        }
      });

      return (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.workflowContainer}
        >
          {chains.map((chain, chainIdx) => (
            <View key={`chain-${chainIdx}`} style={styles.taskChain}>
              {chain.map((task, taskIdx) => (
                <View key={task.id} style={styles.workflowNode}>
                  {/* Task Card */}
                  <Pressable
                    onPress={() => setSelectedTask(task)}
                    style={[
                      styles.workflowCard,
                      isSelected(task.id) && styles.workflowCardSelected,
                      { borderColor: getTypeColor(task.type) }
                    ]}
                  >
                    <View style={styles.workflowCardHeader}>
                      <View style={[styles.workflowBadge, { backgroundColor: getTypeColor(task.type) }]}>
                        <Text style={styles.workflowBadgeText}>{task.type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.workflowPriority}>{getPriorityIcon(task.priority)}</Text>
                    </View>
                    <Text style={styles.workflowTitle}>{task.title}</Text>
                    {task.keywords && task.keywords.length > 0 && (
                      <View style={styles.workflowKeywords}>
                        {task.keywords.slice(0, 3).map((keyword, idx) => (
                          <View key={idx} style={styles.workflowKeywordChip}>
                            <Text style={styles.workflowKeywordText}>{keyword}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>
                  
                  {/* Arrow connector to next task */}
                  {taskIdx < chain.length - 1 && (
                    <View style={styles.arrowContainer}>
                      <View style={styles.arrowLine} />
                      <View style={styles.arrowHead}>
                        <Text style={styles.arrowText}>↓</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      );
    };

    const isSelected = (taskId) => selectedTask?.id === taskId;

    const getTypeColor = (type) => {
      const colors = {
        action: '#4CAF50',
        requirement: '#FF9800',
        goal: '#2196F3',
        question: '#9C27B0',
        need: '#F44336',
      };
      return colors[type] || '#607D8B';
    };

    const getPriorityIcon = (priority) => {
      switch (priority) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
      }
    };

    return renderTaskFlow();
  };

  const renderColumnsView = () => {
    // Group tasks by their position in the flow
    const tasksByPosition = {
      root: tasks.filter(t => root_tasks?.includes(t.id)),
      middle: tasks.filter(t => !root_tasks?.includes(t.id) && !leaf_tasks?.includes(t.id)),
      leaf: tasks.filter(t => leaf_tasks?.includes(t.id))
    };

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.graphContainer}
      >
        <View style={styles.graphContent}>
          {/* Root Tasks Column */}
          <View style={styles.taskColumn}>
            <Text style={styles.columnHeader}>🌱 Start Points</Text>
            {tasksByPosition.root.map((task, idx) => (
              <TaskNode
                key={task.id}
                task={task}
                index={idx}
                isSelected={selectedTask?.id === task.id}
                onPress={setSelectedTask}
                connections={getTaskConnections(task.id)}
              />
            ))}
          </View>

          {/* Middle Tasks Column */}
          <View style={styles.taskColumn}>
            <Text style={styles.columnHeader}>⚡ In Progress</Text>
            {tasksByPosition.middle.map((task, idx) => (
              <TaskNode
                key={task.id}
                task={task}
                index={idx + tasksByPosition.root.length}
                isSelected={selectedTask?.id === task.id}
                onPress={setSelectedTask}
                connections={getTaskConnections(task.id)}
              />
            ))}
          </View>

          {/* Leaf Tasks Column */}
          <View style={styles.taskColumn}>
            <Text style={styles.columnHeader}>🎯 End Goals</Text>
            {tasksByPosition.leaf.map((task, idx) => (
              <TaskNode
                key={task.id}
                task={task}
                index={idx + tasks.length - tasksByPosition.leaf.length}
                isSelected={selectedTask?.id === task.id}
                onPress={setSelectedTask}
                connections={getTaskConnections(task.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderListView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {tasks.map((task, idx) => (
        <Pressable
          key={task.id}
          style={[
            styles.listItem,
            selectedTask?.id === task.id && styles.listItemSelected,
          ]}
          onPress={() => setSelectedTask(task)}
        >
          <View style={styles.listItemLeft}>
            <View style={[styles.listItemType, { backgroundColor: getTaskTypeColor(task.type) }]}>
              <Text style={styles.listItemTypeText}>{task.type[0].toUpperCase()}</Text>
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{task.title}</Text>
              <Text style={styles.listItemSubtitle}>
                {task.priority} priority • {task.estimated_effort} effort
              </Text>
            </View>
          </View>
          <View style={styles.listItemRight}>
            <Text style={styles.listItemConnections}>🔗 {getTaskConnections(task.id)}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const getTaskTypeColor = (type) => {
    const colors = {
      action: '#4CAF50',
      requirement: '#FF9800',
      goal: '#2196F3',
      question: '#9C27B0',
      need: '#F44336',
    };
    return colors[type] || '#607D8B';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{relationships?.length || 0}</Text>
          <Text style={styles.statLabel}>Dependencies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{critical_path?.length || 0}</Text>
          <Text style={styles.statLabel}>Critical Path</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(graph_complexity * 100)}%</Text>
          <Text style={styles.statLabel}>Complexity</Text>
        </View>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        <Pressable
          style={[styles.viewModeButton, viewMode === 'workflow' && styles.viewModeActive]}
          onPress={() => setViewMode('workflow')}
        >
          <Text style={[styles.viewModeText, viewMode === 'workflow' && styles.viewModeTextActive]}>
            🔄 Workflow
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeButton, viewMode === 'columns' && styles.viewModeActive]}
          onPress={() => setViewMode('columns')}
        >
          <Text style={[styles.viewModeText, viewMode === 'columns' && styles.viewModeTextActive]}>
            📋 Columns
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
            📝 List
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {viewMode === 'workflow' ? renderGraphView() : 
         viewMode === 'columns' ? renderColumnsView() : 
         renderListView()}
      </View>

      {/* Selected Task Detail */}
      {selectedTask && (
        <Animated.View style={styles.taskDetail}>
          <View style={styles.taskDetailHeader}>
            <Text style={styles.taskDetailTitle}>{selectedTask.title}</Text>
            <Pressable onPress={() => setSelectedTask(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.taskDetailContent}>
            <Text style={styles.taskDetailDescription}>{selectedTask.description}</Text>
            {selectedTask.action_verbs?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Actions:</Text>
                <View style={styles.actionVerbsContainer}>
                  {selectedTask.action_verbs.map((verb, idx) => (
                    <View key={idx} style={styles.actionVerb}>
                      <Text style={styles.actionVerbText}>{verb}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {/* Show task dependencies */}
            {selectedTask.depends_on?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Dependencies:</Text>
                <Text style={styles.taskDetailDescription}>
                  This task depends on: {selectedTask.depends_on.join(', ')}
                </Text>
              </View>
            )}
            {selectedTask.blocks?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Blocks:</Text>
                <Text style={styles.taskDetailDescription}>
                  This task blocks: {selectedTask.blocks.join(', ')}
                </Text>
              </View>
            )}
            {selectedTask.priority && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Priority:</Text>
                <Text style={[styles.taskDetailDescription, { textTransform: 'capitalize' }]}>
                  {selectedTask.priority}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#667eea',
    borderBottomWidth: 0,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: '#ffffffcc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#f8f9fa',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  viewModeActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewModeText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  graphContainer: {
    padding: 20,
  },
  graphContent: {
    flexDirection: 'row',
    gap: 32,
    minWidth: screenWidth,
  },
  taskColumn: {
    minWidth: 300,
    gap: 16,
  },
  columnHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskNode: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  taskNodeContent: {
    padding: 16,
  },
  taskNodeInner: {
    gap: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  priorityIcon: {
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  effortBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effortBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskConfidence: {
    fontSize: 12,
    color: '#999',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  keywordChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 10,
    color: '#64748b',
  },
  connectionsIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  connectionsText: {
    fontSize: 11,
    color: '#64748b',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea10',
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  listItemType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTypeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemConnections: {
    fontSize: 12,
    color: '#64748b',
  },
  taskDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomWidth: 0,
  },
  taskDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  taskDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    padding: 4,
  },
  taskDetailContent: {
    padding: 20,
  },
  taskDetailDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailSection: {
    marginTop: 16,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  actionVerbsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionVerb: {
    backgroundColor: '#667eea15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#667eea30',
  },
  actionVerbText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  dependencyIndicator: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dependencyText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  // Workflow diagram styles
  workflowContainer: {
    padding: 16,
    alignItems: 'center',
  },
  taskChain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  workflowNode: {
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minWidth: 240,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  workflowCardSelected: {
    backgroundColor: '#667eea10',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  workflowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  workflowBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  workflowPriority: {
    fontSize: 16,
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 20,
  },
  workflowKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  workflowKeywordChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  workflowKeywordText: {
    fontSize: 10,
    color: '#64748b',
  },
  arrowContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  arrowLine: {
    width: 2,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
  arrowHead: {
    marginTop: -8,
  },
  arrowText: {
    fontSize: 20,
    color: '#cbd5e1',
  },
});
