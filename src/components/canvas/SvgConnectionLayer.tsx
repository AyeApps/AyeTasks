import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { Rect } from '../../utils/geometryUtils';
import { ArrowCurve } from './ArrowCurve';

interface SvgConnectionLayerProps {
  cardLayouts: Record<string, Rect>;
  width: number;
  height: number;
}

export const SvgConnectionLayer: React.FC<SvgConnectionLayerProps> = ({
  cardLayouts,
  width,
  height,
}) => {
  const connections = useTaskStore((state) => state.connections);
  const tasks = useTaskStore((state) => state.tasks);
  const connectingSourceTaskId = useUIStore((state) => state.connectingSourceTaskId);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          width,
          height,
          zIndex: 100,
          elevation: 100,
          pointerEvents: 'none' as const,
        },
      ]}
    >
      <Svg
        width={width}
        height={height}
        style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
      >
        {connections.map((conn) => {
          const fromRect = cardLayouts[conn.fromTaskId];
          const toRect = cardLayouts[conn.toTaskId];

          if (!fromRect || !toRect) return null;

          const fromTask = tasks.find((t) => t.id === conn.fromTaskId);
          const toTask = tasks.find((t) => t.id === conn.toTaskId);

          const isCompleted = fromTask?.status === 'completed' && toTask?.status === 'completed';
          const isHighlighted =
            selectedTaskId === conn.fromTaskId ||
            selectedTaskId === conn.toTaskId ||
            connectingSourceTaskId === conn.fromTaskId;

          return (
            <ArrowCurve
              key={conn.id}
              connectionId={conn.id}
              fromRect={fromRect}
              toRect={toRect}
              isHighlighted={isHighlighted}
              isCompleted={isCompleted}
            />
          );
        })}
      </Svg>
    </View>
  );
};
