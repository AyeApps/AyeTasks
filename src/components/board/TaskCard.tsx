import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Check,
  Square,
  ArrowRight,
  Clock,
  Trash2,
  GitCommit,
  Target,
  Flame,
  Activity,
  FileText,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { useCanvasContext } from '../../context/CanvasContext';
import { Task } from '../../types';
import { Rect } from '../../utils/geometryUtils';
import { formatDigitalTimer, formatLoggedTime, formatEstimatedDuration } from '../../utils/dateUtils';
import { calculateDeadlineProgress } from '../../utils/deadlineUtils';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskCardProps {
  task: Task;
  onLayoutMeasured?: (taskId: string, rect: Rect) => void;
  nextDayDateString?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onLayoutMeasured,
  nextDayDateString,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const cardRef = useRef<View>(null);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const canvasCtx = useCanvasContext();

  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const activeTimers = useTimerStore((state) => state.activeTimers);
  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);
  const startTaskTimer = useTimerStore((state) => state.startTaskTimer);
  const stopTaskTimer = useTimerStore((state) => state.stopTaskTimer);

  const openQuickAdd = useUIStore((state) => state.openQuickAdd);
  const isConnectingMode = useUIStore((state) => state.isConnectingMode);
  const connectingSourceTaskId = useUIStore((state) => state.connectingSourceTaskId);
  const startConnecting = useUIStore((state) => state.startConnecting);
  const cancelConnecting = useUIStore((state) => state.cancelConnecting);
  const createConnection = useTaskStore((state) => state.createConnection);
  const selectTask = useUIStore((state) => state.selectTask);
  const selectedTaskId = useUIStore((state) => state.selectedTaskId);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [burstColorState, setBurstColorState] = useState<string>(colors.accent);

  const isCompleted = task.status === 'completed';
  const thisTimer = activeTimers[task.id];
  const isTimerRunningOnThis = !!thisTimer;
  const isFocusModeRunning = isTimerRunningOnThis && thisTimer.uiMode === 'focus_bar';
  const isBgTrackRunning = isTimerRunningOnThis && thisTimer.uiMode === 'background';
  const isAnotherCardFocused = !!focusedTaskId && focusedTaskId !== task.id;

  const currentTotalSeconds = isTimerRunningOnThis
    ? thisTimer.totalElapsedSeconds
    : task.actualDurationSeconds || 0;

  const isSelected = selectedTaskId === task.id;
  const isConnectSource = connectingSourceTaskId === task.id;

  const deadlineInfo = !isCompleted && task.dueDate
    ? calculateDeadlineProgress(task.createdAt, task.dueDate, task.dueTime, isDark)
    : null;

  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const burstRippleScale = useRef(new Animated.Value(0.9)).current;
  const burstRippleOpacity = useRef(new Animated.Value(0)).current;
  const focusPulseAnim = useRef(new Animated.Value(0)).current;
  const progressPulseAnim = useRef(new Animated.Value(0)).current;
  const focusBtnScale = useRef(new Animated.Value(1)).current;
  const progressBtnScale = useRef(new Animated.Value(1)).current;
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const trackingPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isBgTrackRunning || isFocusModeRunning) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(trackingPulseAnim, {
            toValue: 1.18,
            duration: 650,
            useNativeDriver: false,
          }),
          Animated.timing(trackingPulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: false,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      trackingPulseAnim.setValue(1);
    }
  }, [isBgTrackRunning, isFocusModeRunning]);

  useEffect(() => {
    if (isFocusModeRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(focusPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(focusPulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      focusPulseAnim.setValue(0);
    }
  }, [isFocusModeRunning]);

  useEffect(() => {
    if (isBgTrackRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(progressPulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: false,
          }),
          Animated.timing(progressPulseAnim, {
            toValue: 0,
            duration: 750,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      progressPulseAnim.setValue(0);
    }
  }, [isBgTrackRunning]);

  const triggerBurst = (color: string) => {
    setBurstColorState(color);
    setIsBursting(true);
    burstRippleScale.setValue(0.9);
    burstRippleOpacity.setValue(0.9);

    Animated.parallel([
      Animated.timing(burstRippleScale, {
        toValue: 1.45,
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.timing(burstRippleOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsBursting(false);
    });
  };

  const tagColor = task.colorTag || colors.accent;

  const animatedBorderColor = isFocusModeRunning
    ? focusPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.accentDanger, '#ff616f'],
      })
    : isBgTrackRunning
    ? progressPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.accentWarning, '#ffd54f'],
      })
    : isSelected
    ? colors.accent
    : isCompleted
    ? colors.borderMuted
    : colors.borderColor;

  const animatedBgOverlay = isFocusModeRunning
    ? focusPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 23, 68, 0.05)', 'rgba(255, 23, 68, 0.18)'],
      })
    : isBgTrackRunning
    ? progressPulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 171, 0, 0.04)', 'rgba(255, 171, 0, 0.16)'],
      })
    : 'transparent';

  useEffect(() => {
    if (cardRef.current && canvasCtx?.registerCard) {
      canvasCtx.registerCard(task.id, cardRef.current);
    }
    return () => {
      canvasCtx?.unregisterCard(task.id);
    };
  }, [task.id, canvasCtx?.registerCard, canvasCtx?.unregisterCard]);

  const handleLayout = () => {
    if (cardRef.current && canvasCtx?.registerCard) {
      canvasCtx.registerCard(task.id, cardRef.current);
    }
  };

  const handleCardPress = (e?: any) => {
    e?.stopPropagation?.();
    if (isConnectingMode && connectingSourceTaskId) {
      if (connectingSourceTaskId !== task.id) {
        createConnection(connectingSourceTaskId, task.id);
        cancelConnecting();
      }
      return;
    }
    setIsDetailsOpen(true);
  };

  const handleToggleStatus = (e: any) => {
    e?.stopPropagation?.();
    triggerBurst(colors.accent);

    Animated.sequence([
      Animated.timing(checkboxScale, {
        toValue: 0.72,
        duration: 75,
        useNativeDriver: false,
      }),
      Animated.spring(checkboxScale, {
        toValue: 1,
        friction: 3,
        tension: 240,
        useNativeDriver: false,
      }),
    ]).start();

    if (isTimerRunningOnThis) {
      stopTaskTimer(task.id);
    }
    toggleTaskStatus(task.id);
  };

  const handleDelete = (e: any) => {
    e?.stopPropagation?.();
    if (isTimerRunningOnThis) {
      stopTaskTimer(task.id);
    }
    deleteTask(task.id);
  };

  const handleFocusClick = (e: any) => {
    e?.stopPropagation?.();
    triggerBurst(colors.accentDanger);

    Animated.sequence([
      Animated.timing(focusBtnScale, {
        toValue: 0.86,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.spring(focusBtnScale, {
        toValue: 1,
        friction: 3,
        tension: 220,
        useNativeDriver: false,
      }),
    ]).start();

    if (isFocusModeRunning) {
      stopTaskTimer(task.id);
    } else {
      startTaskTimer(task.id, task.title, 'focus_bar');
    }
  };

  const handleInProgressClick = (e: any) => {
    e?.stopPropagation?.();
    triggerBurst(colors.accentWarning);

    Animated.sequence([
      Animated.timing(progressBtnScale, {
        toValue: 0.86,
        duration: 80,
        useNativeDriver: false,
      }),
      Animated.spring(progressBtnScale, {
        toValue: 1,
        friction: 3,
        tension: 220,
        useNativeDriver: false,
      }),
    ]).start();

    if (isBgTrackRunning) {
      stopTaskTimer(task.id);
    } else if (isFocusModeRunning) {
      startTaskTimer(task.id, task.title, 'background');
    } else {
      startTaskTimer(task.id, task.title, 'background');
    }
  };

  const handleStartConnecting = (e: any) => {
    e?.stopPropagation?.();
    if (isConnectSource) {
      cancelConnecting();
    } else {
      startConnecting(task.id);
    }
  };

  const handleNextDayBranch = (e: any) => {
    e?.stopPropagation?.();
    if (!nextDayDateString) return;
    openQuickAdd(nextDayDateString, task.id);
  };

  return (
    <Animated.View
      ref={cardRef as any}
      onLayout={handleLayout}
      // @ts-ignore
      dataSet={{
        role: 'task-card',
        focused: isFocusModeRunning ? 'true' : 'false',
        dimmed: isAnotherCardFocused ? 'true' : 'false',
        burst: isBursting ? 'true' : 'false',
      }}
      style={[
        isDesktop ? styles.cardContainerDesktop : styles.cardContainerCompact,
        {
          backgroundColor: colors.bgBase,
          borderColor: animatedBorderColor,
          borderWidth: isFocusModeRunning || isBgTrackRunning ? 2.5 : THEME.borders.thick,
          shadowColor: isFocusModeRunning
            ? colors.accentDanger
            : isBgTrackRunning
            ? colors.accentWarning
            : colors.shadowColor,
          shadowOffset: isFocusModeRunning || isBgTrackRunning
            ? { width: 4, height: 4 }
            : { width: 3, height: 3 },
          shadowOpacity: isFocusModeRunning || isBgTrackRunning ? 0.65 : 1,
          opacity: isAnotherCardFocused ? 0.35 : 1,
        },
        isSelected && styles.cardSelected,
        isConnectSource && { backgroundColor: colors.accentSubtle },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: animatedBgOverlay, zIndex: 1 },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: 3,
            borderColor: burstColorState,
            opacity: burstRippleOpacity,
            transform: [{ scale: burstRippleScale }],
            zIndex: 100,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.accentStrip,
          {
            backgroundColor: isCompleted
              ? colors.borderMuted
              : isFocusModeRunning
              ? colors.accentDanger
              : isBgTrackRunning
              ? colors.accentWarning
              : tagColor,
            width: isFocusModeRunning || isBgTrackRunning ? 6 : 4,
            opacity: isFocusModeRunning
              ? focusPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] })
              : isBgTrackRunning
              ? progressPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] })
              : 1,
          },
        ]}
      />

      {isDesktop ? (
        <>
          <View style={styles.contentBodyDesktop}>
            <View style={styles.cardHeaderDesktop}>
              <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.checkboxDesktop,
                    {
                      borderColor: isCompleted ? colors.accent : colors.borderColor,
                      backgroundColor: isCompleted ? colors.accent : colors.bgSurface,
                    },
                  ]}
                  onPress={handleToggleStatus}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isCompleted ? (
                    <Check size={13} color={colors.textInvert} strokeWidth={3.5} />
                  ) : null}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.titleTouch}
                onPress={handleCardPress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.titleDesktop,
                    { color: isCompleted ? colors.textMuted : colors.textPrimary },
                    isCompleted && styles.titleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {task.title.toUpperCase()}
                </Text>
              </TouchableOpacity>

              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    {
                      borderColor: task.notes ? colors.accent : colors.borderMuted,
                      backgroundColor: task.notes ? colors.accentSubtle : colors.bgSurface,
                    },
                  ]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setIsDetailsOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <FileText
                    size={11}
                    color={task.notes ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    {
                      borderColor: isConnectSource ? colors.accent : colors.borderMuted,
                      backgroundColor: isConnectSource ? colors.accentSubtle : colors.bgSurface,
                    },
                  ]}
                  onPress={handleStartConnecting}
                  activeOpacity={0.7}
                >
                  <GitCommit
                    size={11}
                    color={isConnectSource ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>

                {nextDayDateString ? (
                  <TouchableOpacity
                    style={[
                      styles.headerIconBtn,
                      {
                        borderColor: colors.borderMuted,
                        backgroundColor: colors.bgSurface,
                      },
                    ]}
                    onPress={handleNextDayBranch}
                    activeOpacity={0.7}
                  >
                    <ArrowRight size={11} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    {
                      borderColor: colors.accentDanger,
                      backgroundColor: 'rgba(255, 23, 68, 0.14)',
                    },
                  ]}
                  onPress={handleDelete}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={11} color={colors.accentDanger} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {task.description ? (
              <Text
                style={[styles.descriptionDesktop, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}

            {deadlineInfo ? (
              <View
                style={[
                  styles.deadlineCardBox,
                  {
                    borderColor: deadlineInfo.color,
                    backgroundColor: deadlineInfo.backgroundColor,
                  },
                ]}
              >
                <View style={styles.deadlineHeaderRow}>
                  <View style={styles.deadlineLeftGroup}>
                    <Target size={10} color={deadlineInfo.color} strokeWidth={3} />
                    <Text style={[styles.deadlineTargetText, { color: deadlineInfo.color }]}>
                      {t.taskCard.due} {task.dueDate?.slice(5)}{task.dueTime ? ` @ ${task.dueTime}` : ''}
                    </Text>
                  </View>

                  <Text style={[styles.deadlineRemainingPill, { color: deadlineInfo.color }]}>
                    ● {deadlineInfo.label}
                  </Text>
                </View>

                <View style={[styles.deadlineTrackBg, { backgroundColor: colors.borderMuted }]}>
                  <View
                    style={[
                      styles.deadlineTrackFill,
                      {
                        width: `${deadlineInfo.percentage}%`,
                        backgroundColor: deadlineInfo.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.badgeRowDesktop}>
              {isFocusModeRunning ? (
                <View
                  style={[
                    styles.techChipDesktop,
                    {
                      borderColor: colors.accentDanger,
                      backgroundColor: colors.accentDangerSubtle,
                    },
                  ]}
                >
                  <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                    <Flame size={11} color={colors.accentDanger} />
                  </Animated.View>
                  <Text style={[styles.techChipLoggedText, { color: colors.accentDanger }]}>
                    {t.taskCard.focus}: {formatDigitalTimer(currentTotalSeconds)}
                  </Text>
                </View>
              ) : isBgTrackRunning ? (
                <View
                  style={[
                    styles.techChipDesktop,
                    {
                      borderColor: colors.accentWarning,
                      backgroundColor: 'rgba(255, 171, 0, 0.18)',
                    },
                  ]}
                >
                  <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                    <Activity size={11} color={colors.accentWarning} />
                  </Animated.View>
                  <Text style={[styles.techChipLoggedText, { color: colors.accentWarning }]}>
                    {t.taskCard.tracking}{formatDigitalTimer(currentTotalSeconds)}
                  </Text>
                </View>
              ) : null}

              {task.dueTime && !deadlineInfo ? (
                <View
                  style={[
                    styles.techChipDesktop,
                    {
                      borderColor: colors.borderMuted,
                      backgroundColor: colors.bgSurface,
                    },
                  ]}
                >
                  <Clock size={11} color={colors.accentWarning} />
                  <Text style={[styles.techChipText, { color: colors.textSecondary }]}>
                    {task.dueTime}
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.techChipDesktop,
                  {
                    borderColor: colors.borderMuted,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
              >
                <Text style={[styles.techChipText, { color: colors.textSecondary }]}>
                  {t.taskCard.est}{formatEstimatedDuration(task.estimatedDurationMinutes)}
                </Text>
              </View>

              {task.notes ? (
                <TouchableOpacity
                  style={[
                    styles.techChipDesktop,
                    {
                      borderColor: colors.accent,
                      backgroundColor: colors.accentSubtle,
                    },
                  ]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setIsDetailsOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <FileText size={10} color={colors.accent} />
                  <Text style={[styles.techChipLoggedText, { color: colors.accent }]}>
                    {t.taskCard.notes}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {task.actualDurationSeconds > 0 && !isTimerRunningOnThis ? (
                <View
                  style={[
                    styles.techChipDesktop,
                    {
                      borderColor: isCompleted ? colors.borderMuted : colors.accent,
                      backgroundColor: isCompleted ? colors.bgSurface : colors.accentSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.techChipLoggedText,
                      { color: isCompleted ? colors.textSecondary : colors.accent },
                    ]}
                  >
                    {isCompleted ? t.taskCard.took : t.taskCard.total}
                    {formatLoggedTime(task.actualDurationSeconds)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {!isCompleted ? (
            <View
              style={[
                styles.splitFooter,
                {
                  borderTopColor: isFocusModeRunning
                    ? colors.accentDanger
                    : isBgTrackRunning
                    ? colors.accentWarning
                    : colors.borderMuted,
                  backgroundColor: colors.bgBase,
                },
              ]}
            >
              <Animated.View style={[styles.splitBtnHalf, { transform: [{ scale: focusBtnScale }] }]}>
                <TouchableOpacity
                  style={[
                    styles.splitActionBtn,
                    {
                      backgroundColor: isFocusModeRunning ? colors.accentDanger : colors.bgBase,
                    },
                  ]}
                  onPress={handleFocusClick}
                  activeOpacity={0.8}
                >
                  {isFocusModeRunning ? (
                    <>
                      <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                        <Square size={9} color={colors.textInvert} fill={colors.textInvert} />
                      </Animated.View>
                      <Text style={[styles.splitBtnText, { color: colors.textInvert }]}>
                        {t.taskCard.pause}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Flame size={11} color={colors.accentDanger} />
                      <Text style={[styles.splitBtnText, { color: colors.accentDanger }]}>
                        {t.taskCard.focus}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View
                style={[
                  styles.splitDivider,
                  {
                    backgroundColor: isFocusModeRunning
                      ? colors.accentDanger
                      : isBgTrackRunning
                      ? colors.accentWarning
                      : colors.borderMuted,
                  },
                ]}
              />

              <Animated.View style={[styles.splitBtnHalf, { transform: [{ scale: progressBtnScale }] }]}>
                <TouchableOpacity
                  style={[
                    styles.splitActionBtn,
                    {
                      backgroundColor: isBgTrackRunning
                        ? 'rgba(255, 171, 0, 0.22)'
                        : colors.bgBase,
                    },
                  ]}
                  onPress={handleInProgressClick}
                  activeOpacity={0.8}
                >
                  {isBgTrackRunning ? (
                    <>
                      <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                        <Square size={9} color={colors.accentWarning} fill={colors.accentWarning} />
                      </Animated.View>
                      <Text style={[styles.splitBtnText, { color: colors.accentWarning }]}>
                        {t.taskCard.pause}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Activity size={10} color={colors.accentWarning} />
                      <Text style={[styles.splitBtnText, { color: colors.accentWarning }]}>
                        {t.taskCard.inProgress}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            <View
              style={[
                styles.completedFooter,
                {
                  borderTopColor: colors.borderMuted,
                  backgroundColor: colors.accentSubtle,
                },
              ]}
            >
              <Check size={11} color={colors.accent} strokeWidth={3} />
              <Text style={[styles.completedFooterText, { color: colors.accent }]}>
                {t.taskCard.completed}
              </Text>
            </View>
          )}
        </>
      ) : (
        <TouchableOpacity
          style={styles.contentBodyCompact}
          onPress={handleCardPress}
          activeOpacity={0.75}
        >
          <View style={styles.cardHeaderCompact}>
            <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
              <TouchableOpacity
                style={[
                  styles.checkboxCompact,
                  {
                    borderColor: isCompleted ? colors.accent : colors.borderColor,
                    backgroundColor: isCompleted ? colors.accent : colors.bgSurface,
                  },
                ]}
                onPress={handleToggleStatus}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isCompleted ? (
                  <Check size={12} color={colors.textInvert} strokeWidth={3.5} />
                ) : null}
              </TouchableOpacity>
            </Animated.View>

            <Text
              style={[
                styles.titleCompact,
                { color: isCompleted ? colors.textMuted : colors.textPrimary },
                isCompleted && styles.titleCompleted,
              ]}
              numberOfLines={2}
            >
              {task.title.toUpperCase()}
            </Text>

            <View style={styles.miniIndicatorRow}>
              {task.notes ? (
                <FileText size={11} color={colors.accent} strokeWidth={2.5} />
              ) : null}
              {isConnectSource ? (
                <GitCommit size={11} color={colors.accent} strokeWidth={2.5} />
              ) : null}
            </View>
          </View>

          {isTimerRunningOnThis || deadlineInfo || task.actualDurationSeconds > 0 ? (
            <View style={styles.microMetaRow}>
              {isFocusModeRunning ? (
                <View
                  style={[
                    styles.microChip,
                    {
                      borderColor: colors.accentDanger,
                      backgroundColor: colors.accentDangerSubtle,
                    },
                  ]}
                >
                  <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                    <Flame size={10} color={colors.accentDanger} />
                  </Animated.View>
                  <Text style={[styles.microChipText, { color: colors.accentDanger }]}>
                    {formatDigitalTimer(currentTotalSeconds)}
                  </Text>
                </View>
              ) : isBgTrackRunning ? (
                <View
                  style={[
                    styles.microChip,
                    {
                      borderColor: colors.accentWarning,
                      backgroundColor: 'rgba(255, 171, 0, 0.18)',
                    },
                  ]}
                >
                  <Animated.View style={{ transform: [{ scale: trackingPulseAnim }] }}>
                    <Activity size={10} color={colors.accentWarning} />
                  </Animated.View>
                  <Text style={[styles.microChipText, { color: colors.accentWarning }]}>
                    {formatDigitalTimer(currentTotalSeconds)}
                  </Text>
                </View>
              ) : null}

              {deadlineInfo ? (
                <View
                  style={[
                    styles.microChip,
                    {
                      borderColor: deadlineInfo.color,
                      backgroundColor: deadlineInfo.backgroundColor,
                    },
                  ]}
                >
                  <Target size={10} color={deadlineInfo.color} strokeWidth={2.5} />
                  <Text style={[styles.microChipText, { color: deadlineInfo.color }]}>
                    {task.dueTime || deadlineInfo.label}
                  </Text>
                </View>
              ) : null}

              {task.actualDurationSeconds > 0 && !isTimerRunningOnThis ? (
                <View
                  style={[
                    styles.microChip,
                    {
                      borderColor: isCompleted ? colors.borderMuted : colors.borderColor,
                      backgroundColor: colors.bgSurface,
                    },
                  ]}
                >
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={[styles.microChipText, { color: colors.textSecondary }]}>
                    {formatLoggedTime(task.actualDurationSeconds)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      )}

      <TaskDetailsModal
        task={task}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainerDesktop: {
    borderWidth: THEME.borders.thick,
    marginBottom: 9,
    position: 'relative',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    overflow: 'hidden',
    cursor: 'pointer',
    ...(Platform.OS === 'web'
      ? {
          transition: 'opacity 0.25s ease',
        }
      : {}),
  } as any,
  cardContainerCompact: {
    borderWidth: THEME.borders.thick,
    marginBottom: 7,
    position: 'relative',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    overflow: 'hidden',
    cursor: 'pointer',
    ...(Platform.OS === 'web'
      ? {
          transition: 'opacity 0.25s ease',
        }
      : {}),
  } as any,
  cardSelected: {
    borderWidth: 2.5,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 5,
  },
  contentBodyDesktop: {
    padding: 8,
    paddingLeft: 11,
  },
  cardHeaderDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  checkboxDesktop: {
    width: 18,
    height: 18,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleTouch: {
    flex: 1,
    minWidth: 0,
  },
  titleDesktop: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    lineHeight: 15,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  headerIconBtn: {
    width: 21,
    height: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionDesktop: {
    fontSize: 10.5,
    marginBottom: 5,
    lineHeight: 14,
  },
  deadlineCardBox: {
    borderWidth: 1.5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginBottom: 6,
  },
  deadlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  deadlineLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineTargetText: {
    fontSize: 9.5,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  deadlineRemainingPill: {
    fontSize: 9.5,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  deadlineTrackBg: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  deadlineTrackFill: {
    height: '100%',
  },
  badgeRowDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 7,
  },
  techChipDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  techChipText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  techChipLoggedText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  splitFooter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1.5,
    width: '100%',
    minHeight: 30,
  },
  splitBtnHalf: {
    flex: 1,
  },
  splitActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  splitDivider: {
    width: 1.5,
    height: '100%',
  },
  splitBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    fontFamily: THEME.fonts.mono,
  },
  completedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderTopWidth: 1.5,
    paddingVertical: 6,
    width: '100%',
  },
  completedFooterText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  contentBodyCompact: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    paddingLeft: 10,
  },
  cardHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxCompact: {
    width: 18,
    height: 18,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleCompact: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  miniIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  microMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  microChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  microChipText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.4,
  },
});
