import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  X,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  FileText,
  Calendar,
  Check,
  Share2,
  Copy,
  Plus,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { WeekDay, formatTime12h, formatLoggedTime, formatEstimatedDuration } from '../../utils/dateUtils';
import { calculateDeadlineProgress } from '../../utils/deadlineUtils';
import { Task } from '../../types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface DayDeliveryReportModalProps {
  day: WeekDay;
  isOpen: boolean;
  onClose: () => void;
}

export const DayDeliveryReportModal: React.FC<DayDeliveryReportModalProps> = ({
  day,
  isOpen,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { colors, isDark } = useTheme();
  const { language, t } = useTranslation();

  const allTasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const startTaskTimer = useTimerStore((state) => state.startTaskTimer);
  const stopTaskTimer = useTimerStore((state) => state.stopTaskTimer);
  const activeTimers = useTimerStore((state) => state.activeTimers);
  const openQuickAdd = useUIStore((state) => state.openQuickAdd);

  const [copied, setCopied] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);

  // Filter tasks that have this day as their delivery deadline (dueDate === day.dateString)
  // Or tasks scheduled on this day (date === day.dateString) with dueTime
  const deliveryTasks = React.useMemo(() => {
    const list = allTasks.filter(
      (t) => t.dueDate === day.dateString || (t.date === day.dateString && t.dueTime)
    );

    // Sort chronologically by dueTime: specific times first in ascending order, then untimed
    return list.sort((a, b) => {
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      if (a.dueTime) return -1;
      if (b.dueTime) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [allTasks, day.dateString]);

  if (!isOpen) return null;

  const completedDeliveries = deliveryTasks.filter((t) => t.status === 'completed');
  const pendingDeliveries = deliveryTasks.filter((t) => t.status !== 'completed');
  const totalEstimatedMins = deliveryTasks.reduce(
    (acc, t) => acc + (t.estimatedDurationMinutes || 0),
    0
  );
  const totalLoggedSecs = deliveryTasks.reduce(
    (acc, t) => acc + (t.actualDurationSeconds || 0),
    0
  );

  const handleToggleTaskStatus = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'todo' : 'completed';
    if (activeTimers[task.id]) {
      stopTaskTimer(task.id);
    }
    updateTask(task.id, { status: nextStatus });
  };

  const handleCopyReport = () => {
    const isEs = language === 'es';
    const lines = [
      `📋 ${isEs ? 'INFORME DE ENTREGAS' : 'DELIVERIES REPORT'} // ${day.name.toUpperCase()} ${day.dayNumber} ${day.monthName.toUpperCase()} (${day.dateString})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• ${isEs ? 'Total Entregas' : 'Total Deliveries'}: ${deliveryTasks.length}`,
      `• ${isEs ? 'Completadas' : 'Completed'}: ${completedDeliveries.length}`,
      `• ${isEs ? 'Pendientes' : 'Pending'}: ${pendingDeliveries.length}`,
      `• ${isEs ? 'Tiempo Estimado' : 'Estimated Time'}: ${formatEstimatedDuration(totalEstimatedMins)} | ${isEs ? 'Invertido' : 'Logged'}: ${formatLoggedTime(totalLoggedSecs)}`,
      ``,
      `${isEs ? 'DETALLE DE ENTREGAS Y HORARIOS:' : 'DELIVERY TIMETABLE & DETAILS:'}`,
    ];

    if (deliveryTasks.length === 0) {
      lines.push(isEs ? `(No hay entregas programadas para este día)` : `(No deliveries scheduled for this day)`);
    } else {
      deliveryTasks.forEach((t, i) => {
        const timeStr = t.dueTime ? `${t.dueTime} (${formatTime12h(t.dueTime)})` : (isEs ? 'TODO EL DÍA' : 'ALL DAY');
        const statusStr = t.status === 'completed' ? (isEs ? '[✓ COMPLETADA]' : '[✓ COMPLETED]') : (isEs ? '[⏳ PENDIENTE]' : '[⏳ PENDING]');
        lines.push(`${i + 1}. [${timeStr}] ${t.title} ${statusStr}`);
        if (t.description) {
          lines.push(`   └ ${t.description}`);
        }
      });
    }

    const reportText = lines.join('\n');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.reportFrame,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.reportFrameMobile,
          ]}
        >
          {/* Top Neon Accent Stripe */}
          <View style={[styles.topStripe, { backgroundColor: colors.accent }]} />

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                borderColor: colors.borderMuted,
                backgroundColor: colors.bgSurface,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={16} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header Title Section */}
          <View style={styles.header}>
            <View style={styles.headerBadgeRow}>
              <View
                style={[
                  styles.cyberBadge,
                  {
                    backgroundColor: 'rgba(255, 171, 0, 0.14)',
                    borderColor: colors.accentWarning,
                  },
                ]}
              >
                <Target size={12} color={colors.accentWarning} strokeWidth={2.5} />
                <Text style={[styles.cyberBadgeText, { color: colors.accentWarning }]}>
                  {t.deliveriesReport.badge}
                </Text>
              </View>
            </View>

            <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>
              {day.name.toUpperCase()}, {day.dayNumber} {language === 'es' ? 'DE' : ''} {day.monthName.toUpperCase()}
            </Text>
            <Text style={[styles.dateSub, { color: colors.textSecondary }]}>
              {day.dateString} // {t.deliveriesReport.dateSub}
            </Text>
          </View>

          {/* Summary Metric Stats Grid */}
          <View
            style={[
              styles.metricsBar,
              {
                borderColor: colors.borderMuted,
                backgroundColor: colors.bgSurface,
              },
            ]}
          >
            <View style={styles.metricBlock}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.deliveriesReport.totalDeliveries}</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {deliveryTasks.length}
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.deliveriesReport.completed}</Text>
              <Text style={[styles.metricValue, { color: colors.accent }]}>
                {completedDeliveries.length}
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.deliveriesReport.pending}</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: pendingDeliveries.length > 0 ? colors.accentWarning : colors.textMuted },
                ]}
              >
                {pendingDeliveries.length}
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.deliveriesReport.totalTime}</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {formatEstimatedDuration(totalEstimatedMins)}
              </Text>
            </View>
          </View>

          {/* Chronological Deliveries List */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {deliveryTasks.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: colors.borderMuted, backgroundColor: colors.bgSurface }]}>
                <Calendar size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {t.deliveriesReport.noDeliveriesTitle}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {t.deliveriesReport.noDeliveriesSub}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.emptyAddBtn,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.borderColor,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    openQuickAdd(day.dateString);
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color={colors.textInvert} strokeWidth={3} />
                  <Text style={[styles.emptyAddBtnText, { color: colors.textInvert }]}>
                    {t.deliveriesReport.scheduleNewDelivery}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {deliveryTasks.map((tItem, idx) => {
                  const isDone = tItem.status === 'completed';
                  const isTracking = !!activeTimers[tItem.id];
                  const tagColor = tItem.colorTag || colors.accent;
                  const deadlineProg = tItem.dueDate
                    ? calculateDeadlineProgress(tItem.createdAt, tItem.dueDate, tItem.dueTime, isDark)
                    : null;

                  return (
                    <View
                      key={tItem.id}
                      style={[
                        styles.deliveryCard,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: isDone
                            ? colors.borderMuted
                            : isTracking
                            ? colors.accentWarning
                            : colors.borderColor,
                        },
                      ]}
                    >
                      {/* Left Accent Strip */}
                      <View
                        style={[
                          styles.deliveryAccentStrip,
                          {
                            backgroundColor: isDone
                              ? colors.borderMuted
                              : isTracking
                              ? colors.accentWarning
                              : tagColor,
                          },
                        ]}
                      />

                      {/* Header Row: Time Chip + Status Badge */}
                      <View style={styles.deliveryCardHeader}>
                        {/* Time Badge */}
                        <View
                          style={[
                            styles.timeBadge,
                            {
                              backgroundColor: tItem.dueTime
                                ? 'rgba(255, 171, 0, 0.16)'
                                : colors.bgBase,
                              borderColor: tItem.dueTime
                                ? colors.accentWarning
                                : colors.borderMuted,
                            },
                          ]}
                        >
                          <Clock
                            size={12}
                            color={tItem.dueTime ? colors.accentWarning : colors.textSecondary}
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[
                              styles.timeBadgeText,
                              {
                                color: tItem.dueTime
                                  ? colors.accentWarning
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {tItem.dueTime
                              ? `@ ${tItem.dueTime} [${formatTime12h(tItem.dueTime)}]`
                              : t.deliveriesReport.allDayNoTime}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isDone
                                ? colors.accentSubtle
                                : isTracking
                                ? 'rgba(255, 171, 0, 0.15)'
                                : colors.bgBase,
                              borderColor: isDone
                                ? colors.accent
                                : isTracking
                                ? colors.accentWarning
                                : colors.borderMuted,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              {
                                color: isDone
                                  ? colors.accent
                                  : isTracking
                                  ? colors.accentWarning
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {isDone
                              ? t.deliveriesReport.statusCompleted
                              : isTracking
                              ? t.deliveriesReport.statusInProgress
                              : t.deliveriesReport.statusPending}
                          </Text>
                        </View>
                      </View>

                      {/* Title & Body */}
                      <View style={styles.deliveryCardBody}>
                        <TouchableOpacity
                          onPress={() => handleToggleTaskStatus(tItem)}
                          style={[
                            styles.deliveryCheckbox,
                            {
                              borderColor: isDone ? colors.accent : colors.borderColor,
                              backgroundColor: isDone ? colors.accent : colors.bgBase,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          {isDone ? (
                            <Check size={12} color={colors.textInvert} strokeWidth={3.5} />
                          ) : null}
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.deliveryTitle,
                              {
                                color: isDone ? colors.textMuted : colors.textPrimary,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {tItem.title}
                          </Text>

                          {tItem.description ? (
                            <Text
                              style={[styles.deliveryDesc, { color: colors.textSecondary }]}
                              numberOfLines={2}
                            >
                              {tItem.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Deadline Countdown Progress Bar if active */}
                      {deadlineProg ? (
                        <View style={styles.deadlineBox}>
                          <View style={styles.deadlinFlexRow}>
                            <Text
                              style={[
                                styles.deadlineLabel,
                                { color: deadlineProg.color },
                              ]}
                            >
                              {deadlineProg.label.toUpperCase()}
                            </Text>
                            <Text
                              style={[
                                styles.deadlinePercent,
                                { color: deadlineProg.color },
                              ]}
                            >
                              {Math.round(deadlineProg.percentage)}% {t.deliveriesReport.consumed}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.deadlineTrack,
                              { backgroundColor: colors.borderMuted },
                            ]}
                          >
                            <View
                              style={[
                                styles.deadlineFill,
                                {
                                  width: `${Math.round(deadlineProg.percentage)}%`,
                                  backgroundColor: deadlineProg.color,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      ) : null}

                      {/* Bottom Footer Action & Estimation row */}
                      <View style={[styles.cardFooterRow, { borderTopColor: colors.borderMuted }]}>
                        <View style={styles.footerChipsGroup}>
                          <View
                            style={[
                              styles.footerChip,
                              {
                                borderColor: colors.borderMuted,
                                backgroundColor: colors.bgBase,
                              },
                            ]}
                          >
                            <Clock size={11} color={colors.textSecondary} />
                            <Text style={[styles.footerChipText, { color: colors.textSecondary }]}>
                              {t.deliveriesReport.estLabel} {formatEstimatedDuration(tItem.estimatedDurationMinutes)}
                            </Text>
                          </View>

                          {tItem.actualDurationSeconds > 0 ? (
                            <View
                              style={[
                                styles.footerChip,
                                {
                                  borderColor: isDone ? colors.borderMuted : colors.accent,
                                  backgroundColor: isDone
                                    ? colors.bgBase
                                    : colors.accentSubtle,
                                },
                              ]}
                            >
                              <Activity
                                size={11}
                                color={isDone ? colors.textSecondary : colors.accent}
                              />
                              <Text
                                style={[
                                  styles.footerChipText,
                                  { color: isDone ? colors.textSecondary : colors.accent },
                                ]}
                              >
                                {t.deliveriesReport.logLabel} {formatLoggedTime(tItem.actualDurationSeconds)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Open Details Button */}
                        <TouchableOpacity
                          style={[
                            styles.inspectBtn,
                            {
                              borderColor: colors.borderMuted,
                              backgroundColor: colors.bgBase,
                            },
                          ]}
                          onPress={() => setSelectedTaskForDetails(tItem)}
                          activeOpacity={0.7}
                        >
                          <FileText size={12} color={colors.textSecondary} />
                          <Text style={[styles.inspectBtnText, { color: colors.textSecondary }]}>
                            {t.deliveriesReport.detailsBtn}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={[styles.bottomBar, { borderTopColor: colors.borderMuted }]}>
            <TouchableOpacity
              style={[
                styles.copyReportBtn,
                {
                  borderColor: copied ? colors.accent : colors.borderColor,
                  backgroundColor: copied ? colors.accentSubtle : colors.bgSurface,
                },
              ]}
              onPress={handleCopyReport}
              activeOpacity={0.7}
            >
              {copied ? (
                <>
                  <Check size={14} color={colors.accent} strokeWidth={3} />
                  <Text style={[styles.copyReportText, { color: colors.accent }]}>
                    {t.deliveriesReport.reportCopied}
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={14} color={colors.textPrimary} />
                  <Text style={[styles.copyReportText, { color: colors.textPrimary }]}>
                    {t.deliveriesReport.copyReport}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.newDeliveryBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => {
                onClose();
                openQuickAdd(day.dateString);
              }}
              activeOpacity={0.8}
            >
              <Plus size={14} color={colors.textInvert} strokeWidth={3} />
              <Text style={[styles.newDeliveryText, { color: colors.textInvert }]}>
                {t.deliveriesReport.addDelivery}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Task Details Modal nested if inspecting */}
      {selectedTaskForDetails ? (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          isOpen={!!selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reportFrame: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    borderWidth: THEME.borders.thick,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  reportFrameMobile: {
    maxWidth: '100%',
    maxHeight: '96%',
  },
  topStripe: {
    height: 4,
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 14,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cyberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cyberBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateSub: {
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  metricBlock: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  metricDivider: {
    width: 1.5,
    height: 24,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  emptyAddBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  timelineList: {
    gap: 12,
  },
  deliveryCard: {
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  deliveryAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingLeft: 14,
    paddingBottom: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  deliveryCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  deliveryCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  deliveryDesc: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  deadlineBox: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    padding: 6,
  },
  deadlinFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deadlineLabel: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  deadlinePercent: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  deadlineTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  deadlineFill: {
    height: '100%',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  footerChipsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  footerChipText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inspectBtnText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  copyReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingVertical: 12,
    minHeight: 44,
  },
  copyReportText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  newDeliveryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingVertical: 12,
    minHeight: 44,
  },
  newDeliveryText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
});
