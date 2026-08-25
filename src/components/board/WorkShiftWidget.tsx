import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  Clock,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  Moon,
  Sun,
  Flame,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/useUIStore';
import { formatDigitalTimer, formatTime12h, isValidTimeHHMM } from '../../utils/dateUtils';
import { WorkHoursSettingsModal } from './WorkHoursSettingsModal';

export const WorkShiftWidget: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const isTablet = width < 1024;
  const { colors, isDark } = useTheme();

  const workStartTime = useUIStore((state) => state.workStartTime) || '09:00';
  const workEndTime = useUIStore((state) => state.workEndTime) || '18:00';

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Exact local system clock ticker: Self-aligns to the exact millisecond of each second
  // guaranteeing 100% synchronization with the device's clock (laptop/phone) with 0 delay or drift
  useEffect(() => {
    let timeoutId: any;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;
      const now = new Date();
      setCurrentTime(now);
      // Align next tick to the exact zero-millisecond boundary of the next second
      const delayUntilNextSec = 1000 - (now.getTime() % 1000);
      timeoutId = setTimeout(tick, delayUntilNextSec);
    };

    // Instant initial tick
    tick();

    // Instant resync on tab focus or screen wake up
    const handleFocus = () => {
      setCurrentTime(new Date());
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      }
    };
  }, []);

  // Compute live current clock (HH:MM:SS) directly from local device time
  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMins = String(currentTime.getMinutes()).padStart(2, '0');
  const currentSecs = String(currentTime.getSeconds()).padStart(2, '0');
  const clockString = `${currentHours}:${currentMins}:${currentSecs}`;

  // Parse today's shift start & end timestamps in device's local timezone
  const [startH, startM] = (isValidTimeHHMM(workStartTime) ? workStartTime : '09:00')
    .split(':')
    .map(Number);
  const [endH, endM] = (isValidTimeHHMM(workEndTime) ? workEndTime : '18:00')
    .split(':')
    .map(Number);

  const startToday = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate(),
    startH,
    startM,
    0
  );

  const endToday = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate(),
    endH,
    endM,
    0
  );

  const nowMs = currentTime.getTime();
  const startMs = startToday.getTime();
  const endMs = endToday.getTime();

  let shiftState: 'before' | 'active' | 'completed' = 'active';
  let countdownLabel = '';
  let progressPercent = 0;
  let statusBadgeText = '';
  let statusColor = colors.accent;

  const activeColor = isDark ? '#00e5ff' : '#0284c7';
  const completedColor = isDark ? '#a855f7' : '#7e22ce';

  if (nowMs < startMs) {
    // 1. Before shift start
    shiftState = 'before';
    const diffSecs = Math.max(0, Math.floor((startMs - nowMs) / 1000));
    countdownLabel = `ENTRADA EN ${formatDigitalTimer(diffSecs)}`;
    progressPercent = 0;
    statusBadgeText = 'ANTES DE ENTRAR';
    statusColor = colors.textSecondary;
  } else if (nowMs >= startMs && nowMs <= endMs) {
    // 2. Active Shift
    shiftState = 'active';
    const totalShiftMs = Math.max(1000, endMs - startMs);
    const elapsedMs = nowMs - startMs;
    const remainingSecs = Math.max(0, Math.floor((endMs - nowMs) / 1000));
    progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalShiftMs) * 100));
    countdownLabel = `${formatDigitalTimer(remainingSecs)} PARA SALIR`;
    statusBadgeText = 'JORNADA ACTIVA';
    statusColor = activeColor;
  } else {
    // 3. Completed Shift / Overtime
    shiftState = 'completed';
    const overtimeSecs = Math.max(0, Math.floor((nowMs - endMs) / 1000));
    countdownLabel = `JORNADA COMPLETADA // +${formatDigitalTimer(overtimeSecs)}`;
    progressPercent = 100;
    statusBadgeText = 'FINALIZADA';
    statusColor = completedColor;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.widgetContainer,
          {
            backgroundColor: colors.bgSurface,
            borderColor: shiftState === 'active' ? activeColor : colors.borderColor,
            shadowColor: colors.shadowColor,
          },
          isMobile && styles.widgetContainerMobile,
        ]}
        onPress={() => setIsSettingsOpen(true)}
        activeOpacity={0.8}
      >
        {/* Left Section: Live Digital Clock */}
        <View style={styles.clockSection}>
          <Clock
            size={13}
            color={shiftState === 'active' ? activeColor : colors.accent}
            strokeWidth={2.5}
          />
          <Text
            style={[
              styles.clockText,
              { color: colors.textPrimary },
            ]}
          >
            {clockString}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.verticalDivider, { backgroundColor: colors.borderMuted }]} />

        {/* Center Section: Countdown & Shift Progress */}
        <View style={styles.countdownSection}>
          <View style={styles.countdownHeaderRow}>
            <Text
              style={[
                styles.countdownLabel,
                {
                  color:
                    shiftState === 'active'
                      ? activeColor
                      : shiftState === 'completed'
                      ? completedColor
                      : colors.textSecondary,
                },
              ]}
            >
              {countdownLabel}
            </Text>

            {!isMobile ? (
              <Text style={[styles.progressPercentText, { color: colors.textSecondary }]}>
                {Math.round(progressPercent)}%
              </Text>
            ) : null}
          </View>

          {/* Mini Shift Progress Bar */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: isDark ? '#161616' : '#e0e0e0' },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(progressPercent)}%`,
                  backgroundColor:
                    shiftState === 'active'
                      ? activeColor
                      : shiftState === 'completed'
                      ? completedColor
                      : colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* Right Section: Shift Hours & Config Trigger */}
        {!isMobile && !isTablet ? (
          <>
            <View style={[styles.verticalDivider, { backgroundColor: colors.borderMuted }]} />

            <View style={styles.shiftMetaSection}>
              <View
                style={[
                  styles.shiftRangeBadge,
                  {
                    borderColor: colors.borderMuted,
                    backgroundColor: colors.bgBase,
                  },
                ]}
              >
                <Briefcase size={10} color={colors.textSecondary} />
                <Text style={[styles.shiftRangeText, { color: colors.textSecondary }]}>
                  {workStartTime} - {workEndTime}
                </Text>
              </View>

              <Sliders size={12} color={colors.textMuted} />
            </View>
          </>
        ) : null}
      </TouchableOpacity>

      {/* Settings Modal */}
      <WorkHoursSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 10,
    minHeight: 38,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    cursor: 'pointer',
  } as any,
  widgetContainerMobile: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
    minHeight: 36,
  },
  clockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  verticalDivider: {
    width: 1.5,
    height: 18,
  },
  countdownSection: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 100,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  progressBarTrack: {
    height: 3.5,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  shiftMetaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftRangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shiftRangeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
});
