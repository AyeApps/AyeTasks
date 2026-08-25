import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { CanvasProvider, useCanvasContext } from '../../context/CanvasContext';
import { getWeekDays } from '../../utils/dateUtils';
import { useLanguageStore } from '../../store/useLanguageStore';
import { ConnectingBanner } from '../board/ConnectingBanner';
import { DayColumn } from '../board/DayColumn';
import { SvgConnectionLayer } from './SvgConnectionLayer';

const WeekCanvasInner: React.FC = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 700;
  const isMobile = windowWidth < 700;
  const { colors, isDark } = useTheme();

  const language = useLanguageStore((state) => state.language);
  const currentReferenceDate = useUIStore((state) => state.currentReferenceDate);
  const selectedMobileDayIndex = useUIStore((state) => state.selectedMobileDayIndex);
  const setSelectedMobileDayIndex = useUIStore((state) => state.setSelectedMobileDayIndex);
  const nextDay = useUIStore((state) => state.nextDay);
  const prevDay = useUIStore((state) => state.prevDay);

  const tasks = useTaskStore((state) => state.tasks);
  const loadTasksAndConnections = useTaskStore((state) => state.loadTasksAndConnections);
  const canvasCtx = useCanvasContext();

  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 1800,
    height: 900,
  });

  const weekDays = React.useMemo(
    () => getWeekDays(currentReferenceDate, language),
    [currentReferenceDate, language]
  );

  const activeDay = weekDays[selectedMobileDayIndex] || weekDays[0];

  const monday = weekDays[0]?.dateString;
  const sunday = weekDays[6]?.dateString;

  useEffect(() => {
    if (monday && sunday) {
      loadTasksAndConnections(monday, sunday);
    }
  }, [monday, sunday, loadTasksAndConnections]);

  const mobileColumnWidth = isMobile ? Math.min(windowWidth - 24, 600) : 280;

  const renderColumns = () => (
    <View style={styles.columnsRow}>
      {weekDays.map((day, idx) => (
        <DayColumn
          key={day.dateString}
          day={day}
          columnIndex={idx}
          columnWidth={mobileColumnWidth}
          isDesktop={isDesktop}
          nextDayDateString={weekDays[idx + 1]?.dateString}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.canvasWrapper,
        { backgroundColor: 'transparent' },
      ]}
    >
      {/* Floating Link Connection Mode Banner */}
      <ConnectingBanner />

      {isDesktop ? (
        /* Fullscreen Desktop View (Dynamic Flex 1 for all 7 columns) */
        <View
          ref={canvasCtx?.canvasRef}
          style={styles.desktopContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ width, height });
            canvasCtx?.recomputeLayouts();
          }}
        >
          {renderColumns()}

          <SvgConnectionLayer
            cardLayouts={canvasCtx?.cardLayouts || {}}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </View>
      ) : (
        /* ── SINGLE DAY VIEW WITH 7-DAY SELECTOR STRIP (FOR IPAD MINI, TABLETS & PHONES) ── */
        <View style={styles.mobileCanvasContainer}>
          {/* 7-Day Quick Strip Navigator with Previous / Next Buttons */}
          <View
            style={[
              styles.mobileDayStripWrapper,
              {
                backgroundColor: colors.bgSurface,
                borderBottomColor: colors.borderColor,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.mobileDayArrowBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgBase,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={prevDay}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={18} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.mobileDaysList}>
              {weekDays.map((d, idx) => {
                const isSelected = idx === selectedMobileDayIndex;
                const dayTasks = tasks.filter((t) => t.date === d.dateString);
                const hasDeliveries = tasks.some((t) => t.dueDate === d.dateString);
                const isAllDone = dayTasks.length > 0 && dayTasks.every((t) => t.status === 'completed');
                const hasPending = dayTasks.length > 0 && dayTasks.some((t) => t.status !== 'completed');

                return (
                  <TouchableOpacity
                    key={d.dateString}
                    style={[
                      styles.mobileDayPill,
                      {
                        borderColor: isSelected
                          ? colors.accent
                          : d.isToday
                          ? colors.borderMuted
                          : colors.borderColor,
                        backgroundColor: isSelected
                          ? colors.accentSubtle
                          : d.isToday
                          ? isDark
                            ? 'rgba(0, 200, 83, 0.08)'
                            : 'rgba(0, 200, 83, 0.12)'
                          : colors.bgBase,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                    onPress={() => setSelectedMobileDayIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.mobileDayPillDayName,
                        {
                          color: isSelected
                            ? colors.accent
                            : d.isToday
                            ? colors.textPrimary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {d.name.slice(0, 1).toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.mobileDayPillDayNum,
                        {
                          color: isSelected
                            ? colors.accent
                            : d.isToday
                            ? colors.accent
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {d.dayNumber}
                    </Text>

                    {/* Status Dot */}
                    {hasDeliveries ? (
                      <View style={[styles.mobileDayStatusDot, { backgroundColor: colors.accentWarning }]} />
                    ) : isAllDone ? (
                      <View style={[styles.mobileDayStatusDot, { backgroundColor: colors.accent }]} />
                    ) : hasPending ? (
                      <View style={[styles.mobileDayStatusDot, { backgroundColor: colors.textMuted }]} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.mobileDayArrowBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgBase,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={nextDay}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Active Single Day Column with Vertical Scroll */}
          <View style={styles.mobileSingleColumnWrap}>
            <DayColumn
              key={activeDay.dateString}
              day={activeDay}
              columnIndex={selectedMobileDayIndex}
              columnWidth={windowWidth - 20}
              isDesktop={false}
              nextDayDateString={weekDays[selectedMobileDayIndex + 1]?.dateString}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export const WeekCanvas: React.FC = () => {
  return (
    <CanvasProvider>
      <WeekCanvasInner />
    </CanvasProvider>
  );
};

const styles = StyleSheet.create({
  canvasWrapper: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    padding: 8,
    position: 'relative',
  },
  columnsRow: {
    flex: 1,
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  mobileCanvasContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileDayStripWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: THEME.borders.thick,
    gap: 8,
  },
  mobileDayArrowBtn: {
    width: 34,
    height: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  mobileDaysList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: 6,
  },
  mobileDayPill: {
    flex: 1,
    height: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  mobileDayPillDayName: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    lineHeight: 12,
  },
  mobileDayPillDayNum: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  mobileDayStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  mobileSingleColumnWrap: {
    flex: 1,
    height: '100%',
    width: '100%',
    padding: 10,
  },
  mobileScrollView: {
    flex: 1,
    height: '100%',
  },
  mobileScrollContent: {
    height: '100%',
    padding: 12,
  },
  mobileBoardContainer: {
    position: 'relative',
    height: '100%',
  },
});

