import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Plus, Target, FileText } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useUIStore } from '../../store/useUIStore';
import { WeekDay } from '../../utils/dateUtils';
import { TaskCard } from './TaskCard';
import { DayDeliveryReportModal } from './DayDeliveryReportModal';

interface DayColumnProps {
  day: WeekDay;
  columnIndex: number;
  nextDayDateString?: string;
  columnWidth?: number;
  isDesktop?: boolean;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  columnIndex,
  nextDayDateString,
  columnWidth = 260,
  isDesktop = false,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const columnRef = useRef<View>(null);
  const { colors, isDark } = useTheme();

  const allTasks = useTaskStore((state) => state.tasks);
  const activeTimers = useTimerStore((state) => state.activeTimers);
  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);
  const filterMode = useUIStore((state) => state.filterMode);
  const openQuickAdd = useUIStore((state) => state.openQuickAdd);

  const [isReportOpen, setIsReportOpen] = React.useState(false);

  // Scheduled workflow tasks for this day
  const dayTasks = React.useMemo(
    () => allTasks.filter((t) => t.date === day.dateString),
    [allTasks, day.dateString]
  );

  // Delivery deadline tasks for this day (tasks due on this specific date)
  const deliveryTasks = React.useMemo(
    () => allTasks.filter((t) => t.dueDate === day.dateString),
    [allTasks, day.dateString]
  );

  const visibleTasks = React.useMemo(() => {
    // 1. FOCUS filter: Only the task actively running in Deep Focus mode
    if (filterMode === 'focused') {
      return dayTasks.filter((t) => focusedTaskId === t.id && !!activeTimers[t.id]);
    }
    // 2. PROGRESS filter: Tasks with active background timer or marked in_progress
    if (filterMode === 'in_progress') {
      return dayTasks.filter((t) => {
        const timer = activeTimers[t.id];
        return (timer && timer.uiMode === 'background') || t.status === 'in_progress';
      });
    }
    // 3. PENDING filter: All open tasks (not completed)
    if (filterMode === 'pending') {
      return dayTasks.filter((t) => t.status !== 'completed');
    }
    // 4. DONE filter: Completed tasks
    if (filterMode === 'completed') {
      return dayTasks.filter((t) => t.status === 'completed');
    }
    // 5. ALL filter: Everything
    return dayTasks;
  }, [dayTasks, filterMode, focusedTaskId, activeTimers]);

  const completedCount = dayTasks.filter((t) => t.status === 'completed').length;

  return (
    <View
      ref={columnRef}
      style={[
        styles.columnContainer,
        {
          backgroundColor: colors.bgSurface,
          borderColor: day.isToday ? colors.accent : colors.borderColor,
        },
        isMobile ? styles.columnMobile : isDesktop ? styles.columnDesktop : { width: columnWidth },
      ]}
    >
      {/* Day Column Header (Spacious & Bold) */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: day.isToday
              ? isDark
                ? '#05190d'
                : 'rgba(0, 200, 83, 0.12)'
              : colors.bgBase,
            borderBottomColor: day.isToday ? colors.accent : colors.borderColor,
          },
        ]}
      >
        <View style={styles.headerTitleGroup}>
          <View
            style={[
              styles.dayPill,
              {
                backgroundColor: day.isToday ? colors.accent : colors.bgSurface,
                borderColor: day.isToday ? colors.accent : colors.borderMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                { color: day.isToday ? colors.textInvert : colors.textPrimary },
              ]}
            >
              {day.dayNumber}
            </Text>
          </View>
          <View style={styles.titleTextColumn}>
            <Text
              style={[
                styles.dayName,
                { color: day.isToday ? colors.accent : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {day.name.slice(0, 3).toUpperCase()}
            </Text>
            <Text style={[styles.dayMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {day.monthName.slice(0, 3).toUpperCase()} // {completedCount}/{dayTasks.length}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Daily Deliveries & Deadlines Report Button (Unified with DUE Badge) */}
          <TouchableOpacity
            style={[
              deliveryTasks.length > 0 ? styles.deliveryReportBtnActive : styles.headerActionBtn,
              {
                backgroundColor: isReportOpen
                  ? colors.accentSubtle
                  : deliveryTasks.length > 0
                  ? 'rgba(255, 171, 0, 0.14)'
                  : colors.bgSurface,
                borderColor: deliveryTasks.length > 0 ? colors.accentWarning : colors.borderMuted,
              },
            ]}
            onPress={() => setIsReportOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {deliveryTasks.length > 0 ? (
              <>
                <Target size={12} color={colors.accentWarning} strokeWidth={2.5} />
                <Text style={[styles.deliveryCountText, { color: colors.accentWarning }]}>
                  {deliveryTasks.length} DUE
                </Text>
              </>
            ) : (
              <FileText size={13} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Quick Add Button */}
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderMuted,
              },
            ]}
            onPress={() => openQuickAdd(day.dateString)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={16} color={colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Cards Vertical Stream */}
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {visibleTasks.length === 0 ? (
          <TouchableOpacity
            style={[
              styles.emptyState,
              {
                borderColor: colors.borderMuted,
                backgroundColor: colors.bgBase,
              },
            ]}
            onPress={() => openQuickAdd(day.dateString)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emptyPlus, { color: colors.textMuted }]}>+</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {filterMode === 'focused'
                ? 'NO FOCUSED NODE'
                : filterMode === 'in_progress'
                ? 'NO ACTIVE TRACKERS'
                : 'NO NODES'}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {filterMode === 'all' ? 'TAP TO CREATE' : 'CLICK ALL TO VIEW ALL'}
            </Text>
          </TouchableOpacity>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              nextDayDateString={nextDayDateString}
            />
          ))
        )}
      </ScrollView>

      {/* Daily Deliveries & Timetable Report Modal */}
      <DayDeliveryReportModal
        day={day}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    borderWidth: THEME.borders.thick,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  columnMobile: {
    flex: 1,
    width: '100%',
  },
  columnDesktop: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderBottomWidth: THEME.borders.thick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  titleTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  dayPill: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dayMeta: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryReportBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minHeight: 26,
  },
  deliveryCountText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  headerActionBtn: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 10,
    paddingBottom: 90,
  },
  emptyState: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  emptyPlus: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptySubText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
