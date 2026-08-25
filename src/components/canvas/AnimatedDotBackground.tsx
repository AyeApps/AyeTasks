import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

const GRID_SIZE = 32;
const DOT_RADIUS = 1.5;
const DURATION_MS = 5000;

export const AnimatedDotBackground: React.FC = () => {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [anim]);

  const dotColor = colors.gridDotColor || (isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)');

  if (Platform.OS === 'web') {
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: isDark
              ? 'radial-gradient(rgba(255, 255, 255, 0.18) 1.5px, transparent 1.5px)'
              : 'radial-gradient(rgba(0, 0, 0, 0.14) 1.5px, transparent 1.5px)',
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            backgroundPosition: 'center',
            animationName: 'gridMove',
            animationDuration: `${DURATION_MS / 1000}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            zIndex: 0,
          } as any,
        ]}
      />
    );
  }

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GRID_SIZE],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GRID_SIZE],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.nativeContainer]}>
      <Animated.View
        style={[
          styles.svgWrapper,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="ayetasks-dot-grid"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <Circle
                cx={GRID_SIZE / 2}
                cy={GRID_SIZE / 2}
                r={DOT_RADIUS}
                fill={dotColor}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ayetasks-dot-grid)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    overflow: 'hidden',
    zIndex: 0,
  },
  svgWrapper: {
    position: 'absolute',
    top: -GRID_SIZE,
    left: -GRID_SIZE,
    right: -GRID_SIZE,
    bottom: -GRID_SIZE,
  },
});
