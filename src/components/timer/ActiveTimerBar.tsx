import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Square, CheckCircle, Flame, Minimize2 } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTimerStore } from '../../store/useTimerStore';
import { formatDigitalTimer } from '../../utils/dateUtils';

export const ActiveTimerBar: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);
  const activeTimers = useTimerStore((state) => state.activeTimers);
  const switchTaskUIMode = useTimerStore((state) => state.switchTaskUIMode);
  const stopTaskTimer = useTimerStore((state) => state.stopTaskTimer);
  const completeTaskAndStop = useTimerStore((state) => state.completeTaskAndStop);

  const { colors } = useTheme();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideInAnim = useRef(new Animated.Value(60)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideInAnim, {
        toValue: 0,
        friction: 6,
        tension: 150,
        useNativeDriver: false,
      }),
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [slideInAnim, fadeInAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const activeFocusTimer = focusedTaskId ? activeTimers[focusedTaskId] : null;

  // Only render the floating focus bar when a task is actively in focus_bar mode
  if (!focusedTaskId || !activeFocusTimer || activeFocusTimer.uiMode !== 'focus_bar') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        {
          opacity: fadeInAnim,
          transform: [{ translateY: slideInAnim }],
        },
      ]}
    >
      <View
        // @ts-ignore
        className="focus-bar-glow"
        style={[
          styles.techBarFrame,
          {
            backgroundColor: colors.bgBase,
            borderColor: colors.accentDanger,
            shadowColor: colors.accentDanger,
          },
          isMobile && styles.techBarFrameMobile,
        ]}
      >
        {/* Floating Top Badge */}
        <View
          style={[
            styles.techBadge,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.accentDanger,
            },
          ]}
        >
          <Text style={[styles.techBadgeText, { color: colors.accentDanger }]}>
            STATUS: DEEP FOCUS // ACTIVE SESSION ({formatDigitalTimer(activeFocusTimer.sessionElapsedSeconds)})
          </Text>
        </View>

        {/* Left: Flame Icon + Task Title */}
        <View style={styles.leftGroup}>
          <Animated.View
            style={[
              styles.pulseBox,
              {
                borderColor: colors.accentDanger,
                backgroundColor: colors.accentDangerSubtle,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Flame size={18} color={colors.accentDanger} />
          </Animated.View>
          <View style={styles.taskInfo}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>FOCUSING ON TASK:</Text>
            <Text
              style={[styles.taskTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {(activeFocusTimer.taskTitle || 'ACTIVE TASK').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Center: Large Digital Cumulative Time Display */}
        <View
          style={[
            styles.digitalTimerBox,
            {
              borderColor: colors.borderColor,
              backgroundColor: colors.bgSurface,
            },
          ]}
        >
          <Text style={[styles.digitalTimerText, { color: colors.accentDanger }]}>
            {formatDigitalTimer(activeFocusTimer.totalElapsedSeconds)}
          </Text>
        </View>

        {/* Right: Actions */}
        <View style={styles.actionGroup}>
          {/* Minimize / Continue in Background without Stopping */}
          <TouchableOpacity
            style={[
              styles.utilityBtn,
              {
                borderColor: colors.borderMuted,
                backgroundColor: colors.bgBase,
              },
            ]}
            onPress={() => switchTaskUIMode(focusedTaskId, 'background')}
            activeOpacity={0.7}
          >
            <Minimize2 size={13} color={colors.textSecondary} />
            {!isMobile ? (
              <Text style={[styles.utilityBtnText, { color: colors.textSecondary }]}>
                MINIMIZE
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* Pause / Stop Session */}
          <TouchableOpacity
            style={[
              styles.stopBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgBase,
              },
            ]}
            onPress={() => stopTaskTimer(focusedTaskId)}
            activeOpacity={0.7}
          >
            <Square size={13} color={colors.textPrimary} fill={colors.textPrimary} />
            <Text style={[styles.stopBtnText, { color: colors.textPrimary }]}>PAUSE</Text>
          </TouchableOpacity>

          {/* Complete Task and Close */}
          <TouchableOpacity
            style={[
              styles.completeBtn,
              {
                backgroundColor: colors.accent,
                borderColor: colors.borderColor,
              },
            ]}
            onPress={() => completeTaskAndStop(focusedTaskId)}
            activeOpacity={0.8}
          >
            <CheckCircle size={16} color={colors.textInvert} strokeWidth={2.5} />
            <Text style={[styles.completeBtnText, { color: colors.textInvert }]}>
              {isMobile ? 'COMPLETE' : 'COMPLETE TASK ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  techBarFrame: {
    width: '100%',
    maxWidth: 960,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    position: 'relative',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  techBarFrameMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    gap: 10,
  },
  techBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: THEME.borders.thick,
  },
  techBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    maxWidth: 300,
  },
  pulseBox: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  digitalTimerBox: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  digitalTimerText: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 2,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 40,
  },
  utilityBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
  },
  stopBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minHeight: 40,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
});
