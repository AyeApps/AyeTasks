import React from 'react';
import { Path, Polygon, Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { calculateConnectionPath, Rect } from '../../utils/geometryUtils';

interface ArrowCurveProps {
  fromRect: Rect;
  toRect: Rect;
  connectionId: string;
  isHighlighted?: boolean;
  isCompleted?: boolean;
}

export const ArrowCurve: React.FC<ArrowCurveProps> = ({
  fromRect,
  toRect,
  isHighlighted = false,
  isCompleted = false,
}) => {
  const { colors } = useTheme();
  const { path, startPoint, endPoint, angle } = calculateConnectionPath(fromRect, toRect);

  const strokeColor = isCompleted
    ? colors.textMuted
    : isHighlighted
    ? colors.accentHover
    : colors.accent;

  const strokeWidth = isHighlighted ? 2.5 : 2;

  // Arrowhead geometry
  const arrowSize = 8;
  const rad = (angle * Math.PI) / 180;
  const p1x = endPoint.x;
  const p1y = endPoint.y;
  const p2x = endPoint.x - arrowSize * Math.cos(rad - Math.PI / 5.5);
  const p2y = endPoint.y - arrowSize * Math.sin(rad - Math.PI / 5.5);
  const p3x = endPoint.x - arrowSize * Math.cos(rad + Math.PI / 5.5);
  const p3y = endPoint.y - arrowSize * Math.sin(rad + Math.PI / 5.5);

  return (
    <>
      {/* Starting terminal dot */}
      <Circle
        cx={startPoint.x}
        cy={startPoint.y}
        r={isHighlighted ? 4.5 : 3.5}
        fill={strokeColor}
      />

      {/* 90-degree Base Orthogonal Circuit Path */}
      <Path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        opacity={isCompleted ? 0.35 : 0.6}
      />

      {/* Continuous Animated Energy Pulse along the 90° Circuit Path */}
      {!isCompleted ? (
        <Path
          d={path}
          stroke={isHighlighted ? '#ffffff' : colors.accent}
          strokeWidth={isHighlighted ? 2.5 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="12, 12"
          // @ts-ignore
          className="circuit-animated-flow"
          // @ts-ignore
          dataSet={{ role: 'circuit-flow' }}
          fill="none"
          opacity={isHighlighted ? 1 : 0.85}
        />
      ) : null}

      {/* Destination Arrowhead */}
      <Polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill={strokeColor}
      />
    </>
  );
};
