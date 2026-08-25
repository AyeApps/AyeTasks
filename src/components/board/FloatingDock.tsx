import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Plus, CheckCircle2, Circle, Flame, Filter, Activity, Square } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { TaskFilterMode, useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { formatDateISO, getWeekDays } from '../../utils/dateUtils';

export const FloatingDock: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const { language, t } = useTranslation();

  const openQuickAdd = useUIStore((state) => state.openQuickAdd);
  const filterMode = useUIStore((state) => state.filterMode);
  const setFilterMode = useUIStore((state) => state.setFilterMode);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);
  const currentReferenceDate = useUIStore((state) => state.currentReferenceDate);
  const selectedMobileDayIndex = useUIStore((state) => state.selectedMobileDayIndex);

  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);
  const activeTimers = useTimerStore((state) => state.activeTimers);
  const startTaskTimer = useTimerStore((state) => state.startTaskTimer);
  const stopTaskTimer = useTimerStore((state) => state.stopTaskTimer);
  const tasks = useTaskStore((state) => state.tasks);

  const { colors } = useTheme();
  const todayISO = formatDateISO(new Date());

  const weekDays = React.useMemo(
    () => getWeekDays(currentReferenceDate, language),
    [currentReferenceDate, language]
  );
  const activeDay = weekDays[selectedMobileDayIndex] || weekDays[0];
  const targetDateISO = isMobile && activeDay ? activeDay.dateString : todayISO;

  const isFocusedRunning = !!focusedTaskId && !!activeTimers[focusedTaskId];

  const dockSlideAnim = useRef(new Animated.Value(40)).current;
  const dockFadeAnim = useRef(new Animated.Value(0)).current;
  const flamePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dockSlideAnim, {
        toValue: 0,
        friction: 6,
        tension: 150,
        useNativeDriver: false,
      }),
      Animated.timing(dockFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [dockSlideAnim, dockFadeAnim]);

  useEffect(() => {
    if (isFocusedRunning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flamePulseAnim, {
            toValue: 1.2,
            duration: 650,
            useNativeDriver: false,
          }),
          Animated.timing(flamePulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      flamePulseAnim.setValue(1);
    }
  }, [isFocusedRunning, flamePulseAnim]);

  const handleStartNextFocus = () => {
    if (focusedTaskId) {
      stopTaskTimer(focusedTaskId);
      return;
    }
    // 1. If user selected a task on the board, focus that specific task
    let targetTask = selectedTaskId
      ? tasks.find((t) => t.id === selectedTaskId && t.status !== 'completed')
      : null;

    // 2. Otherwise focus the first pending task
    if (!targetTask) {
      targetTask = tasks.find((t) => t.status !== 'completed');
    }

    if (targetTask) {
      startTaskTimer(targetTask.id, targetTask.title, 'focus_bar');
    } else {
      openQuickAdd(targetDateISO);
    }
  };

  const filters: { id: TaskFilterMode; label: string; icon: any; activeColor?: string }[] = [
    { id: 'all', label: t.dock.all, icon: Filter },
    { id: 'focused', label: t.dock.focus, icon: Flame, activeColor: colors.accentDanger },
    { id: 'in_progress', label: t.dock.progress, icon: Activity, activeColor: colors.accentWarning },
    { id: 'pending', label: t.dock.pending, icon: Circle },
    { id: 'completed', label: t.dock.done, icon: CheckCircle2, activeColor: colors.accent },
  ];

  return (
    <Animated.View
      style={[
        styles.dockWrapper,
        {
          opacity: dockFadeAnim,
          transform: [{ translateY: dockSlideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.dockFrame,
          {
            backgroundColor: colors.bgBase,
            borderColor: colors.borderColor,
            shadowColor: colors.shadowColor,
          },
          isMobile && styles.dockFrameMobile,
        ]}
      >
        {/* Quick Add Node FAB Button */}
        <TouchableOpacity
          // @ts-ignore
          dataSet={{ role: 'action-btn' }}
          style={[
            styles.fabBtn,
            {
              backgroundColor: colors.accent,
              borderColor: colors.borderColor,
            },
          ]}
          onPress={() => openQuickAdd(targetDateISO)}
          activeOpacity={0.8}
        >
          <Plus size={16} color={colors.textInvert} strokeWidth={3} />
          <Text style={[styles.fabText, { color: colors.textInvert }]}>
            {isMobile ? t.dock.task : t.dock.quickTask}
          </Text>
        </TouchableOpacity>

        {/* Separator */}
        <View style={[styles.dockDivider, { backgroundColor: colors.borderMuted }]} />

        {/* Filter Segmented Control */}
        <View style={styles.filterGroup}>
          {filters.map((f) => {
            const isActive = filterMode === f.id;
            const Icon = f.icon;
            const itemColor = isActive
              ? (f.activeColor || colors.accent)
              : colors.textMuted;

            return (
              <TouchableOpacity
                key={f.id}
                // @ts-ignore
                dataSet={{ role: 'action-btn' }}
                style={[
                  styles.filterBtn,
                  {
                    borderColor: isActive ? (f.activeColor || colors.borderColor) : 'transparent',
                    backgroundColor: isActive ? colors.bgSurface : 'transparent',
                  },
                ]}
                onPress={() => setFilterMode(f.id)}
                activeOpacity={0.7}
              >
                <Icon
                  size={13}
                  color={itemColor}
                  strokeWidth={2.5}
                />
                {!isMobile ? (
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: isActive ? (f.activeColor || colors.textPrimary) : colors.textSecondary,
                        fontWeight: isActive ? '900' : '700',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Separator */}
        <View style={[styles.dockDivider, { backgroundColor: colors.borderMuted }]} />

        {/* Quick Focus Mode Trigger */}
        <TouchableOpacity
          // @ts-ignore
          dataSet={{ role: 'action-btn' }}
          style={[
            styles.focusBtn,
            {
              borderColor: isFocusedRunning ? colors.accentDanger : colors.accent,
              backgroundColor: isFocusedRunning ? colors.accentDangerSubtle : colors.accentSubtle,
            },
          ]}
          onPress={handleStartNextFocus}
          activeOpacity={0.7}
        >
          {isFocusedRunning ? (
            <Animated.View style={{ transform: [{ scale: flamePulseAnim }] }}>
              <Square size={13} color={colors.accentDanger} fill={colors.accentDanger} />
            </Animated.View>
          ) : (
            <Flame size={15} color={colors.accent} />
          )}
          <Text
            style={[
              styles.focusBtnText,
              { color: isFocusedRunning ? colors.accentDanger : colors.accent },
            ]}
          >
            {isFocusedRunning
              ? t.dock.pauseFocus
              : isMobile
              ? t.dock.focus
              : t.dock.startFocus}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 800,
    pointerEvents: 'box-none',
  },
  dockFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    gap: 8,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    maxWidth: '95%',
  },
  dockFrameMobile: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    minHeight: 44,
    gap: 6,
  },
  fabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  fabText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  dockDivider: {
    width: 1.5,
    height: 22,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 32,
  },
  filterText: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  focusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1.5,
    minHeight: 34,
  },
  focusBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
});
