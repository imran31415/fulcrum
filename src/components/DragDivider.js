import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const DragDivider = ({ onDrag, isDragging }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e) => {
    if (Platform.OS !== 'web') return;
    
    e.preventDefault();
    const startX = e.clientX;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      onDrag(deltaX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onDrag(null, true); // Signal drag end
    };
    
    onDrag(0, false, true); // Signal drag start
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const webProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onMouseDown: handleMouseDown,
  } : {};

  return (
    <View 
      {...webProps}
      style={[
        styles.divider,
        (isHovered || isDragging) && styles.dividerActive,
      ]}
    >
      <View style={styles.dividerHandle} />
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    width: 8,
    backgroundColor: '#e5e7eb',
    cursor: Platform.OS === 'web' ? 'col-resize' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    transition: Platform.OS === 'web' ? 'background-color 0.2s ease' : undefined,
  },
  dividerActive: {
    backgroundColor: '#3b82f6',
  },
  dividerHandle: {
    width: 2,
    height: 40,
    backgroundColor: '#94a3b8',
    borderRadius: 1,
  },
});

export default DragDivider;