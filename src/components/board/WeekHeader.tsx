import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  Key,
  Sun,
  Moon,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Sparkles,
  Menu,
  Languages,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { formatDateISO, getMondayOfWeek, getWeekDays } from '../../utils/dateUtils';
import { WorkShiftWidget } from './WorkShiftWidget';
import { AyeLogo } from '../ui/AyeLogo';

const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const MONTH_NAMES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const MONTH_NAMES_SHORT_EN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const MONTH_NAMES_SHORT_ES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];

export const WeekHeader: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const isTablet = width < 1024;

  const { language, t, toggleLanguage } = useTranslation();

  const currentReferenceDate = useUIStore((state) => state.currentReferenceDate);
  const nextWeek = useUIStore((state) => state.nextWeek);
  const prevWeek = useUIStore((state) => state.prevWeek);
  const jumpToToday = useUIStore((state) => state.jumpToToday);
  const setReferenceDate = useUIStore((state) => state.setReferenceDate);
  const openQuickAdd = useUIStore((state) => state.openQuickAdd);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const openSidebar = useUIStore((state) => state.openSidebar);
  const backendStatus = useUIStore((state) => state.backendStatus);
  const syncStatus = useUIStore((state) => state.syncStatus);
  const pendingSyncCount = useUIStore((state) => state.pendingSyncCount);

  const syncPendingMutations = useTaskStore((state) => state.syncPendingMutations);
  const tasks = useTaskStore((state) => state.tasks);

  const { themeMode, colors, toggleTheme, isDark } = useTheme();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const today = new Date();
  const todayISO = formatDateISO(today);

  // Calculate clean week metadata
  const monday = getMondayOfWeek(currentReferenceDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayToday = getMondayOfWeek(today);
  const diffWeeks = Math.round(
    (monday.getTime() - mondayToday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const mondayStr = formatDateISO(monday);
  const sundayStr = formatDateISO(sunday);

  const monthNamesShort = language === 'es' ? MONTH_NAMES_SHORT_ES : MONTH_NAMES_SHORT_EN;
  const startMonthShort = monthNamesShort[monday.getMonth()];
  const endMonthShort = monthNamesShort[sunday.getMonth()];

  const formattedDateRange =
    monday.getMonth() === sunday.getMonth()
      ? `${monday.getDate()} — ${sunday.getDate()} ${startMonthShort}`
      : `${monday.getDate()} ${startMonthShort} — ${sunday.getDate()} ${endMonthShort}`;

  const weekNumber = Math.ceil(monday.getDate() / 7);

  // Relative week descriptor
  const relativeBadge =
    diffWeeks === 0
      ? (language === 'es' ? 'SEMANA ACTIVA' : 'CURRENT ACTIVE WEEK')
      : diffWeeks === 1
      ? (language === 'es' ? '+1 SEMANA ADELANTE' : '+1 WEEK AHEAD')
      : diffWeeks > 1
      ? `+${diffWeeks} ${language === 'es' ? 'SEMS ADELANTE' : 'WKS AHEAD'}`
      : diffWeeks === -1
      ? (language === 'es' ? 'HACE 1 SEM' : '1 WK AGO')
      : `${Math.abs(diffWeeks)} ${language === 'es' ? 'SEMS ATRÁS' : 'WKS AGO'}`;

  const weekDays = React.useMemo(
    () => getWeekDays(currentReferenceDate, language),
    [currentReferenceDate, language]
  );

  // Telemetry stats for this week
  const weekTasks = tasks.filter((t) => t.date >= mondayStr && t.date <= sundayStr);
  const completedTasks = weekTasks.filter((t) => t.status === 'completed');
  const completionPercentage =
    weekTasks.length > 0
      ? Math.round((completedTasks.length / weekTasks.length) * 100)
      : 0;

  const isOnline = backendStatus === 'online';
  const isConnecting = backendStatus === 'connecting';

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: colors.bgBase,
          borderBottomColor: colors.borderColor,
        },
      ]}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEVEL 1: MAIN APPLICATION HEADER BAR (SPACIOUS & ACCESSIBLE)
         ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.topBar,
          { borderBottomColor: colors.borderMuted },
          isMobile && styles.topBarMobile,
        ]}
      >
        {/* Left Side: Menu Trigger + Brand Anchor + Work Shift Live Clock & Status Widget */}
        <View style={[styles.topLeftCluster, isMobile && styles.topLeftClusterMobile]}>
          {/* Menu / Sidebar Drawer Open Button */}
          <TouchableOpacity
            style={[
              styles.menuBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
            onPress={openSidebar}
            activeOpacity={0.7}
          >
            <Menu size={18} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.brandGroup}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.borderColor,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <AyeLogo width={32} color={colors.textInvert} />
            </View>

            <View style={styles.brandMeta}>
              <View style={styles.brandTitleRow}>
                <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
                  AyeTasks
                </Text>
                {!isMobile ? (
                  <View
                    style={[
                      styles.engineTag,
                      {
                        borderColor: colors.borderColor,
                        backgroundColor: colors.bgSurface,
                      },
                    ]}
                  >
                    <Text style={[styles.engineTagText, { color: colors.textPrimary }]}>
                      CYBER V1.0
                    </Text>
                  </View>
                ) : null}
              </View>
              {!isMobile ? (
                <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                  WORKFLOW & STOPWATCH ENGINE
                </Text>
              ) : null}
            </View>
          </View>

          {/* Live Work Shift & Countdown Clock Widget (Desktop & Tablet only) */}
          {!isMobile ? <WorkShiftWidget /> : null}
        </View>

        {/* Top Right Controls & CTA */}
        <View style={styles.topRightCluster}>
          {/* Cloud Sync Status (Content-Reactive & Interactive) */}
          {!isMobile ? (
            <TouchableOpacity
              style={[
                styles.syncBadge,
                {
                  borderColor:
                    syncStatus === 'synced'
                      ? colors.accentSuccess
                      : syncStatus === 'syncing'
                      ? (isDark ? '#00e5ff' : '#0284c7')
                      : syncStatus === 'pending'
                      ? colors.accentWarning
                      : colors.borderMuted,
                  backgroundColor:
                    syncStatus === 'synced'
                      ? colors.accentSuccessSubtle
                      : syncStatus === 'syncing'
                      ? (isDark ? '#082530' : '#e0f2fe')
                      : syncStatus === 'pending'
                      ? colors.accentWarningSubtle
                      : 'transparent',
                },
              ]}
              onPress={() => {
                if (syncStatus === 'pending' || syncStatus === 'offline') {
                  syncPendingMutations();
                }
              }}
              activeOpacity={syncStatus === 'pending' || syncStatus === 'offline' ? 0.7 : 1}
            >
              <View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor:
                      syncStatus === 'synced'
                        ? colors.accentSuccess
                        : syncStatus === 'syncing'
                        ? (isDark ? '#00e5ff' : '#0284c7')
                        : syncStatus === 'pending'
                        ? colors.accentWarning
                        : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.syncText,
                  {
                    color:
                      syncStatus === 'synced'
                        ? colors.accentSuccess
                        : syncStatus === 'syncing'
                        ? (isDark ? '#00e5ff' : '#0284c7')
                        : syncStatus === 'pending'
                        ? colors.accentWarning
                        : colors.textMuted,
                  },
                ]}
              >
                {syncStatus === 'synced'
                  ? 'CLOUD SYNCED'
                  : syncStatus === 'syncing'
                  ? 'SYNCING...'
                  : syncStatus === 'pending'
                  ? `PENDING SYNC (${pendingSyncCount})`
                  : 'LOCAL CACHE'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Theme Switcher (Desktop & Tablet only) */}
          {!isMobile ? (
            <TouchableOpacity
              style={[
                styles.utilityBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgSurface,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              {themeMode === 'dark' ? (
                <Sun size={17} color={colors.accentWarning} strokeWidth={2.5} />
              ) : (
                <Moon size={17} color={colors.textPrimary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ) : null}

          {/* Language Switcher (Desktop & Tablet only) */}
          {!isMobile ? (
            <TouchableOpacity
              style={[
                styles.utilityBtn,
                styles.langBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgSurface,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={toggleLanguage}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Languages size={15} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.langBtnText, { color: colors.textPrimary }]}>
                {language.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* User Account / Profile */}
          {isAuthenticated && user ? (
            <View style={styles.userWrapper}>
              <TouchableOpacity
                style={[
                  styles.profileChip,
                  {
                    borderColor: colors.borderColor,
                    backgroundColor: colors.bgSurface,
                    shadowColor: colors.shadowColor,
                  },
                ]}
                onPress={() => setShowProfileMenu(!showProfileMenu)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatarBadge,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.textInvert }]}>
                    {userInitial}
                  </Text>
                </View>

                {!isMobile ? (
                  <Text
                    style={[styles.userName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {(user?.name || user?.email?.split('@')[0] || 'USUARIO').toUpperCase()}
                  </Text>
                ) : null}
                <ChevronDown size={14} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Profile Dropdown Popover */}
              {showProfileMenu ? (
                <>
                  <TouchableOpacity
                    style={styles.popoverBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowProfileMenu(false)}
                  />
                  <View
                    style={[
                      styles.profilePopover,
                      {
                        backgroundColor: colors.bgBase,
                        borderColor: colors.borderColor,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                  >
                    <View style={[styles.popoverHeader, { borderBottomColor: colors.borderMuted }]}>
                      <Text style={[styles.popoverUserName, { color: colors.textPrimary }]}>
                        {(user?.name || user?.email || 'USUARIO').toUpperCase()}
                      </Text>
                      <Text style={[styles.popoverUserEmail, { color: colors.textSecondary }]}>
                        {user?.email || ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.logoutButton,
                        {
                          borderColor: colors.accentDanger,
                          backgroundColor: colors.accentDangerSubtle,
                        },
                      ]}
                      onPress={handleLogout}
                    >
                      <LogOut size={14} color={colors.accentDanger} strokeWidth={2.5} />
                      <Text style={[styles.logoutButtonText, { color: colors.accentDanger }]}>
                        LOG OUT
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.loginBtn,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.borderColor,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={openAuthModal}
            >
              <Key size={14} color={colors.textInvert} strokeWidth={2.5} />
              <Text style={[styles.loginBtnText, { color: colors.textInvert }]}>LOGIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Dedicated Full-Width Work Shift Countdown Strip */}
      {isMobile ? (
        <View
          style={[
            styles.mobileWorkShiftStrip,
            {
              backgroundColor: colors.bgBase,
              borderBottomColor: colors.borderMuted,
            },
          ]}
        >
          <WorkShiftWidget />
        </View>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────
          LEVEL 2: DEDICATED HIGH-IMPACT DATE COMMAND SECTION
         ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.dateCommandStrip,
          {
            backgroundColor: colors.bgSurface,
            borderBottomColor: colors.borderColor,
          },
          isMobile && styles.dateCommandStripMobile,
        ]}
      >
        {/* Left: Quick Week Shift Controls */}
        <View style={styles.weekShiftControls}>
          <TouchableOpacity
            style={[
              styles.shiftBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgBase,
                shadowColor: colors.shadowColor,
              },
            ]}
            onPress={prevWeek}
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color={colors.textPrimary} strokeWidth={2.5} />
            {!isMobile ? (
              <Text style={[styles.shiftBtnText, { color: colors.textPrimary }]}>
                PREV
              </Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.todayPillBtn,
              {
                borderColor: diffWeeks === 0 ? colors.accent : colors.borderColor,
                backgroundColor: diffWeeks === 0 ? colors.accent : colors.bgBase,
                shadowColor: colors.shadowColor,
              },
            ]}
            onPress={jumpToToday}
            activeOpacity={0.7}
          >
            <Sparkles
              size={14}
              color={diffWeeks === 0 ? colors.textInvert : colors.textPrimary}
            />
            <Text
              style={[
                styles.todayPillText,
                {
                  color: diffWeeks === 0 ? colors.textInvert : colors.textPrimary,
                },
              ]}
            >
              TODAY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shiftBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgBase,
                shadowColor: colors.shadowColor,
              },
            ]}
            onPress={nextWeek}
            activeOpacity={0.7}
          >
            {!isMobile ? (
              <Text style={[styles.shiftBtnText, { color: colors.textPrimary }]}>
                NEXT
              </Text>
            ) : null}
            <ChevronRight size={18} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Center: Hero Date & Week Identifier */}
        <View style={styles.heroDateCapsule}>
          {!isMobile ? (
            <View
              style={[
                styles.weekBadgeBox,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              <Text style={[styles.weekBadgeBoxText, { color: colors.textInvert }]}>
                WEEK {weekNumber.toString().padStart(2, '0')} // {monday.getFullYear()}
              </Text>
            </View>
          ) : null}

          <View style={styles.heroDateInfo}>
            <View style={styles.heroDateRow}>
              <Calendar size={17} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.heroDateTitle, { color: colors.textPrimary }]}>
                {formattedDateRange}
              </Text>
            </View>

            {!isMobile ? (
              <Text
                style={[
                  styles.relativeStatusPill,
                  {
                    color: diffWeeks === 0 ? colors.accent : colors.textSecondary,
                  },
                ]}
              >
                ● {relativeBadge}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right: 7-Day Quick Overview & Telemetry Meter (Desktop & Tablet) */}
        {!isTablet ? (
          <View style={styles.weekOverviewTracker}>
            {/* 7 Daily Mini Chips */}
            <View style={styles.miniDaysRow}>
              {weekDays.map((d) => {
                const dayTasks = tasks.filter((t) => t.date === d.dateString);
                const isAllDone =
                  dayTasks.length > 0 && dayTasks.every((t) => t.status === 'completed');
                const hasPending =
                  dayTasks.length > 0 && dayTasks.some((t) => t.status !== 'completed');

                return (
                  <TouchableOpacity
                    key={d.dateString}
                    style={[
                      styles.miniDayChip,
                      {
                        borderColor: d.isToday ? colors.accent : colors.borderMuted,
                        backgroundColor: d.isToday
                          ? colors.accentSubtle
                          : colors.bgBase,
                      },
                    ]}
                    onPress={() => setReferenceDate(new Date(d.dateString + 'T00:00:00'))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.miniDayText,
                        {
                          color: d.isToday ? colors.accent : colors.textSecondary,
                          fontWeight: d.isToday ? '900' : '700',
                        },
                      ]}
                    >
                      {d.name.slice(0, 1)}
                    </Text>
                    {isAllDone ? (
                      <View
                        style={[
                          styles.miniDot,
                          { backgroundColor: colors.accent },
                        ]}
                      />
                    ) : hasPending ? (
                      <View
                        style={[
                          styles.miniDot,
                          { backgroundColor: colors.accentWarning },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.miniDotEmpty,
                          { borderColor: colors.borderMuted },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weekly Completion Telemetry Meter */}
            <View
              style={[
                styles.weeklyTelemetryCard,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgBase,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <View style={styles.telemetryHeaderRow}>
                <CheckCircle2 size={14} color={colors.accent} />
                <Text style={[styles.telemetryCount, { color: colors.textPrimary }]}>
                  {completedTasks.length}/{weekTasks.length} NODES
                </Text>
                <Text style={[styles.telemetryPercentage, { color: colors.accent }]}>
                  {completionPercentage}%
                </Text>
              </View>

              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.borderMuted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    borderBottomWidth: THEME.borders.thick,
    zIndex: 100,
  },
  topBar: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 1000,
    elevation: 1000,
  },
  topBarMobile: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 52,
  },
  mobileWorkShiftStrip: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  topLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  topLeftClusterMobile: {
    gap: 8,
    flex: 1,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.borders.thick,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  logoBadgeText: {
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 1.5,
  },
  brandMeta: {
    flexDirection: 'column',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 20,
  },
  engineTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  engineTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  topRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1000,
    elevation: 1000,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  utilityBtn: {
    width: 40,
    height: 40,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  langBtn: {
    paddingHorizontal: 8,
    width: 'auto',
    minWidth: 48,
    flexDirection: 'row',
    gap: 4,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  userWrapper: {
    position: 'relative',
    zIndex: 1000,
    elevation: 1000,
  },
  popoverBackdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 40,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  avatarBadge: {
    width: 24,
    height: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '900',
  },
  userName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    maxWidth: 100,
  },
  profilePopover: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 240,
    borderWidth: THEME.borders.thick,
    padding: 14,
    zIndex: 9999,
    elevation: 9999,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  popoverHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  popoverUserName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  popoverUserEmail: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: THEME.fonts.mono,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  logoutButtonText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  loginBtnText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  heroNewTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 40,
    shadowOffset: { width: 3.5, height: 3.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  heroNewTaskText: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },

  /* ─────────────────────────────────────────────────────────────
      LEVEL 2: DATE COMMAND STRIP STYLES (LARGE & AUTHORITATIVE)
     ───────────────────────────────────────────────────────────── */
  dateCommandStrip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: THEME.borders.thick,
    zIndex: 1,
  },
  dateCommandStripMobile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  weekShiftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  shiftBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  heroDateCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    justifyContent: 'center',
  },
  weekBadgeBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: THEME.borders.thick,
  },
  weekBadgeBoxText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: THEME.fonts.mono,
  },
  heroDateInfo: {
    flexDirection: 'column',
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDateTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  relativeStatusPill: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  weekOverviewTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  miniDaysRow: {
    flexDirection: 'row',
    gap: 5,
  },
  miniDayChip: {
    width: 28,
    height: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  miniDayText: {
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniDotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  weeklyTelemetryCard: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 160,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  telemetryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  telemetryCount: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  telemetryPercentage: {
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 'auto',
    fontFamily: THEME.fonts.mono,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
