import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowLeft,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Info,
  Shield,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  Database,
  Cpu,
  Sparkles,
  Edit3,
  Save,
  Lock,
  Mail,
  User as UserIcon,
  X,
  AlertCircle,
  Languages,
  Globe,
  Smartphone,
  Trash2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { formatTime12h, formatDigitalTimer, getWeekDays } from '../../utils/dateUtils';
import { WorkHoursSettingsModal } from '../board/WorkHoursSettingsModal';

export const SettingsView: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { language, t, setLanguage } = useTranslation();

  const setViewMode = useUIStore((state) => state.setViewMode);
  const currentReferenceDate = useUIStore((state) => state.currentReferenceDate);
  const syncStatus = useUIStore((state) => state.syncStatus);
  const pendingSyncCount = useUIStore((state) => state.pendingSyncCount);

  const workStartTime = useUIStore((state) => state.workStartTime) || '09:00';
  const workEndTime = useUIStore((state) => state.workEndTime) || '18:00';

  const isWorkHoursModalOpen = useUIStore((state) => state.isWorkHoursModalOpen);
  const openWorkHoursModal = useUIStore((state) => state.openWorkHoursModal);
  const closeWorkHoursModal = useUIStore((state) => state.closeWorkHoursModal);

  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  const tasks = useTaskStore((state) => state.tasks);
  const connections = useTaskStore((state) => state.connections);
  const loadTasksAndConnections = useTaskStore((state) => state.loadTasksAndConnections);
  const syncPendingMutations = useTaskStore((state) => state.syncPendingMutations);

  const [isSyncingManually, setIsSyncingManually] = React.useState(false);
  const [justSynced, setJustSynced] = React.useState(false);

  // Account deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = React.useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteErrorMsg(null);
    try {
      await deleteAccount();
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      setDeleteErrorMsg(err.message || 'Error al eliminar la cuenta');
      setIsDeletingAccount(false);
    }
  };

  // Account editing form state
  const [isEditingAccount, setIsEditingAccount] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(user?.name || '');
  const [emailInput, setEmailInput] = React.useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [showPasswordChange, setShowPasswordChange] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = React.useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setEmailInput(user.email || '');
    }
  }, [user]);

  const { themePreference, themeMode, colors, toggleTheme, setThemeMode, isDark } = useTheme();

  // Load tasks on mount if not loaded
  React.useEffect(() => {
    if (tasks.length === 0) {
      const days = getWeekDays(currentReferenceDate);
      const monday = days[0]?.dateString;
      const sunday = days[6]?.dateString;
      if (monday && sunday) {
        loadTasksAndConnections(monday, sunday);
      }
    }
  }, [tasks.length, currentReferenceDate, loadTasksAndConnections]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalLoggedSeconds = tasks.reduce((acc, t) => acc + (t.actualDurationSeconds || 0), 0);

  const handleSyncNow = async () => {
    if (isSyncingManually) return;
    setIsSyncingManually(true);
    try {
      await syncPendingMutations();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    } finally {
      setIsSyncingManually(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim() || !emailInput.trim()) {
      setProfileErrorMsg('El nombre y el correo no pueden estar vacíos.');
      return;
    }
    if (showPasswordChange && newPassword) {
      if (!currentPassword) {
        setProfileErrorMsg('Debes ingresar tu contraseña actual para cambiarla.');
        return;
      }
      if (newPassword.length < 8) {
        setProfileErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
    }

    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await updateProfile({
        name: nameInput.trim(),
        email: emailInput.trim(),
        current_password: showPasswordChange && currentPassword ? currentPassword : undefined,
        new_password: showPasswordChange && newPassword ? newPassword : undefined,
      });
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
      setProfileSuccessMsg('¡Datos de la cuenta actualizados correctamente!');
      setTimeout(() => {
        setProfileSuccessMsg(null);
        setIsEditingAccount(false);
      }, 1600);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Error al guardar los cambios de la cuenta.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setNameInput(user.name || '');
      setEmailInput(user.email || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setShowPasswordChange(false);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);
    setIsEditingAccount(false);
  };

  // Calculate shift duration in hours
  const calculateShiftDuration = () => {
    try {
      const [startH, startM] = workStartTime.split(':').map(Number);
      const [endH, endM] = workEndTime.split(':').map(Number);
      let diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours}H ${mins}M` : `${hours}H`;
    } catch {
      return '9H';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* ─────────────────────────────────────────────────────────────
          SETTINGS HEADER BAR WITH BACK BUTTON
         ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.bgSurface,
            borderBottomColor: colors.borderColor,
          },
          isMobile && styles.headerBarMobile,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              borderColor: colors.borderColor,
              backgroundColor: colors.bgBase,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={() => setViewMode('week')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={colors.textPrimary} strokeWidth={2.5} />
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>
            {t.settings.returnToBoard}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
            {t.settings.title}
          </Text>
          <Text style={[styles.headerSubText, { color: colors.accent }]}>
            {t.settings.subTitle}
          </Text>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          SETTINGS SCROLLABLE BODY
         ───────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.centerWrapper, { maxWidth: isMobile ? '100%' : 780 }]}>
          {/* ── CARD 1: ACCOUNT & OPERATOR PROFILE ── */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Shield size={16} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {t.settings.operatorProfile}
                </Text>
              </View>

              {!isEditingAccount ? (
                <TouchableOpacity
                  style={[
                    styles.editAccountBtn,
                    {
                      borderColor: colors.borderColor,
                      backgroundColor: colors.bgBase,
                    },
                  ]}
                  onPress={() => setIsEditingAccount(true)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={13} color={colors.accent} strokeWidth={2.5} />
                  <Text style={[styles.editAccountBtnText, { color: colors.textPrimary }]}>
                    {t.settings.editProfile}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Profile Success / Error Alerts */}
            {profileSuccessMsg ? (
              <View style={[styles.alertBanner, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                <CheckCircle2 size={15} color={colors.accent} />
                <Text style={[styles.alertText, { color: colors.accent }]}>{profileSuccessMsg}</Text>
              </View>
            ) : null}

            {profileErrorMsg ? (
              <View style={[styles.alertBanner, { backgroundColor: colors.accentDangerSubtle, borderColor: colors.accentDanger }]}>
                <AlertCircle size={15} color={colors.accentDanger} />
                <Text style={[styles.alertText, { color: colors.accentDanger }]}>{profileErrorMsg}</Text>
              </View>
            ) : null}

            {!isEditingAccount && user ? (
              <View style={styles.profileRow}>
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
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.profileDetails}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {user.name ? user.name.toUpperCase() : 'AYETASKS OPERATOR'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                    {user.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {isEditingAccount ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {t.settings.operatorName}
                  </Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.borderColor, backgroundColor: colors.bgBase }]}>
                    <UserIcon size={15} color={colors.textMuted} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="e.g. ALBERTO DEV"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {t.settings.accountEmail}
                  </Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.borderColor, backgroundColor: colors.bgBase }]}>
                    <Mail size={15} color={colors.textMuted} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={emailInput}
                      onChangeText={setEmailInput}
                      placeholder="operator@ayetasks.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Optional Change Password Accordion */}
                <TouchableOpacity
                  style={styles.togglePasswordBtn}
                  onPress={() => setShowPasswordChange(!showPasswordChange)}
                  activeOpacity={0.7}
                >
                  <Lock size={13} color={colors.accentWarning} />
                  <Text style={[styles.togglePasswordText, { color: colors.accentWarning }]}>
                    {showPasswordChange ? `− ${t.settings.hidePassword}` : `+ ${t.settings.changePassword}`}
                  </Text>
                </TouchableOpacity>

                {showPasswordChange ? (
                  <View style={[styles.passwordBox, { borderColor: colors.borderMuted, backgroundColor: colors.bgBase }]}>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        {t.settings.currentPassword}
                      </Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.borderColor, backgroundColor: colors.bgSurface }]}>
                        <Lock size={15} color={colors.textMuted} />
                        <TextInput
                          style={[styles.textInput, { color: colors.textPrimary }]}
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                          placeholder="Required to set new password"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { marginTop: 10 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        {t.settings.newPassword}
                      </Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.borderColor, backgroundColor: colors.bgSurface }]}>
                        <Lock size={15} color={colors.textMuted} />
                        <TextInput
                          style={[styles.textInput, { color: colors.textPrimary }]}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Save and Cancel Buttons */}
                <View style={styles.formActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.borderColor,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                    onPress={handleSaveProfile}
                    disabled={isSavingProfile}
                    activeOpacity={0.7}
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator size="small" color={colors.textInvert} />
                    ) : (
                      <>
                        <Save size={14} color={colors.textInvert} strokeWidth={2.5} />
                        <Text style={[styles.saveBtnText, { color: colors.textInvert }]}>
                          {t.settings.saveAccountChanges}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      {
                        borderColor: colors.borderMuted,
                        backgroundColor: colors.bgBase,
                      },
                    ]}
                    onPress={handleCancelEdit}
                    disabled={isSavingProfile}
                    activeOpacity={0.7}
                  >
                    <X size={14} color={colors.textSecondary} />
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                      {t.settings.cancelBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Realtime Cloud Sync Reactive Badge & Manual Sync */}
            <View style={[styles.syncContainer, { borderTopColor: colors.borderMuted }]}>
              <View style={styles.syncStatusLeft}>
                <View
                  style={[
                    styles.syncPulseDot,
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
                <View>
                  <Text style={[styles.syncStatusTitle, { color: colors.textPrimary }]}>
                    {syncStatus === 'synced'
                      ? t.settings.cloudSynced
                      : syncStatus === 'syncing'
                      ? t.settings.syncingInFlight
                      : syncStatus === 'pending'
                      ? `${t.settings.changesPending} (${pendingSyncCount})`
                      : t.settings.offlineCache}
                  </Text>
                  <Text style={[styles.syncStatusSub, { color: colors.textSecondary }]}>
                    {syncStatus === 'synced'
                      ? t.settings.cloudSyncedDesc
                      : syncStatus === 'pending'
                      ? t.settings.changesPendingDesc
                      : t.settings.offlineCacheDesc}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.syncBtn,
                  {
                    borderColor:
                      justSynced || syncStatus === 'synced'
                        ? colors.accentSuccess
                        : syncStatus === 'pending'
                        ? colors.accentWarning
                        : colors.borderColor,
                    backgroundColor:
                      justSynced || syncStatus === 'synced'
                        ? colors.accentSuccessSubtle
                        : syncStatus === 'pending'
                        ? colors.accentWarningSubtle
                        : colors.bgBase,
                  },
                ]}
                onPress={handleSyncNow}
                disabled={isSyncingManually || syncStatus === 'syncing'}
                activeOpacity={0.7}
              >
                <RefreshCw
                  size={13}
                  color={
                    justSynced || syncStatus === 'synced'
                      ? colors.accentSuccess
                      : syncStatus === 'pending'
                      ? colors.accentWarning
                      : colors.textPrimary
                  }
                />
                <Text
                  style={[
                    styles.syncBtnText,
                    {
                      color:
                        justSynced || syncStatus === 'synced'
                          ? colors.accentSuccess
                          : syncStatus === 'pending'
                          ? colors.accentWarning
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {isSyncingManually || syncStatus === 'syncing'
                    ? t.settings.syncingInFlight
                    : justSynced
                    ? t.settings.syncedSuccess
                    : t.settings.syncNow}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CARD 2: WORK SHIFT & STOPWATCH ENGINE ── */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Briefcase size={16} color={colors.accentWarning} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t.settings.workHoursTitle}
              </Text>
            </View>

            <View style={styles.shiftOverviewRow}>
              <View style={styles.shiftTimeBlock}>
                <Text style={[styles.shiftBlockLabel, { color: colors.textMuted }]}>{t.settings.startHour}</Text>
                <Text style={[styles.shiftBlockValue, { color: colors.textPrimary }]}>
                  {formatTime12h(workStartTime)} ({workStartTime})
                </Text>
              </View>

              <View style={[styles.shiftArrowDivider, { backgroundColor: colors.borderMuted }]} />

              <View style={styles.shiftTimeBlock}>
                <Text style={[styles.shiftBlockLabel, { color: colors.textMuted }]}>{t.settings.endHour}</Text>
                <Text style={[styles.shiftBlockValue, { color: colors.textPrimary }]}>
                  {formatTime12h(workEndTime)} ({workEndTime})
                </Text>
              </View>

              <View style={[styles.shiftArrowDivider, { backgroundColor: colors.borderMuted }]} />

              <View style={styles.shiftTimeBlock}>
                <Text style={[styles.shiftBlockLabel, { color: colors.textMuted }]}>{t.settings.dailyShift}</Text>
                <Text style={[styles.shiftBlockValue, { color: colors.accent }]}>
                  {calculateShiftDuration()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.cardActionBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgBase,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={openWorkHoursModal}
              activeOpacity={0.7}
            >
              <Sliders size={15} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.cardActionBtnText, { color: colors.textPrimary }]}>
                {t.settings.editShiftBtn}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── CARD 3: APPEARANCE & DISPLAY THEME ── */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Sun size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                DISPLAY THEME & INTERFACE
              </Text>
            </View>

            <View style={styles.themeOptionsGrid}>
              {/* Option 1: System / Automatic */}
              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  {
                    borderColor: themePreference === 'system' ? colors.accent : colors.borderMuted,
                    backgroundColor: themePreference === 'system' ? colors.accentSubtle : colors.bgBase,
                  },
                ]}
                onPress={() => setThemeMode('system')}
                activeOpacity={0.7}
              >
                <Smartphone
                  size={18}
                  color={themePreference === 'system' ? colors.accent : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <View style={styles.themeOptionMeta}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: themePreference === 'system' ? colors.textPrimary : colors.textSecondary,
                        fontWeight: themePreference === 'system' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.settings.systemTheme}
                  </Text>
                  <Text style={[styles.themeOptionSub, { color: colors.textMuted }]}>
                    {t.settings.systemThemeDesc}
                  </Text>
                </View>
                {themePreference === 'system' ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </TouchableOpacity>

              {/* Option 2: Dark Cyber */}
              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  {
                    borderColor: themePreference === 'dark' ? colors.accent : colors.borderMuted,
                    backgroundColor: themePreference === 'dark' ? colors.accentSubtle : colors.bgBase,
                  },
                ]}
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.7}
              >
                <Moon
                  size={18}
                  color={themePreference === 'dark' ? colors.accent : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <View style={styles.themeOptionMeta}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: themePreference === 'dark' ? colors.textPrimary : colors.textSecondary,
                        fontWeight: themePreference === 'dark' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.settings.darkTheme}
                  </Text>
                  <Text style={[styles.themeOptionSub, { color: colors.textMuted }]}>
                    {t.settings.darkThemeDesc}
                  </Text>
                </View>
                {themePreference === 'dark' ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </TouchableOpacity>

              {/* Option 3: Light Minimalist */}
              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  {
                    borderColor: themePreference === 'light' ? colors.accent : colors.borderMuted,
                    backgroundColor: themePreference === 'light' ? colors.accentSubtle : colors.bgBase,
                  },
                ]}
                onPress={() => setThemeMode('light')}
                activeOpacity={0.7}
              >
                <Sun
                  size={18}
                  color={themePreference === 'light' ? colors.accent : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <View style={styles.themeOptionMeta}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: themePreference === 'light' ? colors.textPrimary : colors.textSecondary,
                        fontWeight: themePreference === 'light' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.settings.lightTheme}
                  </Text>
                  <Text style={[styles.themeOptionSub, { color: colors.textMuted }]}>
                    {t.settings.lightThemeDesc}
                  </Text>
                </View>
                {themePreference === 'light' ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CARD 4: INTERFACE LANGUAGE // IDIOMA ── */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Languages size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t.settings.languageTitle}
              </Text>
            </View>

            <View style={styles.themeOptionsGrid}>
              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  {
                    borderColor: language === 'es' ? colors.accent : colors.borderMuted,
                    backgroundColor: language === 'es' ? colors.accentSubtle : colors.bgBase,
                  },
                ]}
                onPress={() => setLanguage('es')}
                activeOpacity={0.7}
              >
                <Globe
                  size={18}
                  color={language === 'es' ? colors.accent : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <View style={styles.themeOptionMeta}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: language === 'es' ? colors.textPrimary : colors.textSecondary,
                        fontWeight: language === 'es' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.settings.spanish}
                  </Text>
                  <Text style={[styles.themeOptionSub, { color: colors.textMuted }]}>
                    {t.settings.spanishDesc}
                  </Text>
                </View>
                {language === 'es' ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOptionCard,
                  {
                    borderColor: language === 'en' ? colors.accent : colors.borderMuted,
                    backgroundColor: language === 'en' ? colors.accentSubtle : colors.bgBase,
                  },
                ]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.7}
              >
                <Languages
                  size={18}
                  color={language === 'en' ? colors.accent : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <View style={styles.themeOptionMeta}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      {
                        color: language === 'en' ? colors.textPrimary : colors.textSecondary,
                        fontWeight: language === 'en' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.settings.english}
                  </Text>
                  <Text style={[styles.themeOptionSub, { color: colors.textMuted }]}>
                    {t.settings.englishDesc}
                  </Text>
                </View>
                {language === 'en' ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CARD 5: DATA & OFFLINE CACHE SUMMARY ── */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Database size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t.settings.telemetryTitle}
              </Text>
            </View>

            <View style={styles.dataStatsRow}>
              <View style={styles.dataStatBox}>
                <Text style={[styles.dataStatVal, { color: colors.textPrimary }]}>{totalTasks}</Text>
                <Text style={[styles.dataStatLbl, { color: colors.textMuted }]}>{t.settings.totalTasks}</Text>
              </View>
              <View style={[styles.dataStatDivider, { backgroundColor: colors.borderMuted }]} />
              <View style={styles.dataStatBox}>
                <Text style={[styles.dataStatVal, { color: colors.accent }]}>{completedTasks}</Text>
                <Text style={[styles.dataStatLbl, { color: colors.textMuted }]}>{t.settings.completedTasks}</Text>
              </View>
              <View style={[styles.dataStatDivider, { backgroundColor: colors.borderMuted }]} />
              <View style={styles.dataStatBox}>
                <Text style={[styles.dataStatVal, { color: colors.textPrimary }]}>{connections.length}</Text>
                <Text style={[styles.dataStatLbl, { color: colors.textMuted }]}>{t.settings.flowLinks}</Text>
              </View>
              <View style={[styles.dataStatDivider, { backgroundColor: colors.borderMuted }]} />
              <View style={styles.dataStatBox}>
                <Text style={[styles.dataStatVal, { color: colors.accentWarning }]}>
                  {formatDigitalTimer(totalLoggedSeconds)}
                </Text>
                <Text style={[styles.dataStatLbl, { color: colors.textMuted }]}>{t.settings.loggedTime}</Text>
              </View>
            </View>
          </View>

          {/* ── CARD 5: ABOUT AYETASKS (HASTA ABAJO EN SETTINGS) ── */}
          <View
            style={[
              styles.card,
              styles.aboutCard,
              {
                borderColor: colors.borderMuted,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Info size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {t.settings.aboutTitle}
              </Text>
            </View>

            <View style={styles.aboutGrid}>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>APPLICATION:</Text>
                <Text style={[styles.aboutValue, { color: colors.accent }]}>AyeTasks Cyber-Engine</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>RELEASE VERSION:</Text>
                <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>v1.0.0 (Production)</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>ARCHITECTURE:</Text>
                <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>FatimaWeb Level Standards</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>DATABASE & SYNC:</Text>
                <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>MongoDB Atlas + WebSockets Realtime</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>CLIENT CACHE:</Text>
                <Text style={[styles.aboutValue, { color: colors.accent }]}>100% Offline-First Indexed Cache</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>STOPWATCH ENGINE:</Text>
                <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>Precision Millisecond Clock & Decay</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>ECOSYSTEM:</Text>
                <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>AyeApps Development Suite</Text>
              </View>
            </View>
          </View>

          {/* ── CARD 6: DANGER ZONE // DELETE ACCOUNT (MANDATORY APPLE GUIDELINE 5.1.1(V)) ── */}
          <View
            style={[
              styles.card,
              styles.dangerZoneCard,
              {
                borderColor: colors.accentDanger,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <ShieldAlert size={16} color={colors.accentDanger} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.accentDanger }]}>
                {t.settings.dangerZoneTitle}
              </Text>
            </View>

            <Text style={[styles.dangerZoneDesc, { color: colors.textSecondary }]}>
              {t.settings.deleteAccountDesc}
            </Text>

            <TouchableOpacity
              style={[
                styles.deleteAccountBtn,
                {
                  borderColor: colors.accentDanger,
                  backgroundColor: colors.accentDangerSubtle,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={() => setIsDeleteModalOpen(true)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={colors.accentDanger} strokeWidth={2.5} />
              <Text style={[styles.deleteAccountBtnText, { color: colors.accentDanger }]}>
                {t.settings.deleteAccountBtn}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── CARD 7: LOGOUT SECTION (HASTA ABAJO) ── */}
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                shadowColor: colors.shadowColor,
              },
            ]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={colors.textPrimary} strokeWidth={2.5} />
            <Text style={[styles.logoutBtnText, { color: colors.textPrimary }]}>
              {t.settings.logoutBtn}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Embedded Work Hours Settings Modal */}
      <WorkHoursSettingsModal
        isOpen={isWorkHoursModalOpen}
        onClose={closeWorkHoursModal}
      />

      {/* Account Deletion Confirmation Modal (Apple / Google Guideline Mandatory) */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeletingAccount && setIsDeleteModalOpen(false)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View
            style={[
              styles.deleteModalContent,
              {
                backgroundColor: colors.bgBase,
                borderColor: colors.accentDanger,
                shadowColor: colors.accentDanger,
              },
            ]}
          >
            <View style={styles.deleteModalHeader}>
              <View style={[styles.deleteModalIconBox, { backgroundColor: colors.accentDangerSubtle }]}>
                <AlertTriangle size={24} color={colors.accentDanger} strokeWidth={2.5} />
              </View>
              <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>
                {t.settings.deleteModalTitle}
              </Text>
            </View>

            <Text style={[styles.deleteModalWarningText, { color: colors.textSecondary }]}>
              {t.settings.deleteModalWarning}
            </Text>

            {deleteErrorMsg ? (
              <View style={[styles.alertBanner, { backgroundColor: colors.accentDangerSubtle, borderColor: colors.accentDanger, marginTop: 12 }]}>
                <AlertCircle size={15} color={colors.accentDanger} />
                <Text style={[styles.alertText, { color: colors.accentDanger }]}>
                  {deleteErrorMsg}
                </Text>
              </View>
            ) : null}

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[
                  styles.deleteModalCancelBtn,
                  {
                    borderColor: colors.borderColor,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
                onPress={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteModalCancelText, { color: colors.textPrimary }]}>
                  {t.settings.deleteModalCancelBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalConfirmBtn,
                  {
                    borderColor: colors.accentDanger,
                    backgroundColor: colors.accentDanger,
                  },
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.8}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={styles.deleteModalConfirmText}>
                      {t.settings.deleteModalConfirmBtn}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBar: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: THEME.borders.thick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerBarMobile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  headerTitleGroup: {
    flexDirection: 'column',
  },
  headerTitleText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSubText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  scrollContentMobile: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  centerWrapper: {
    width: '100%',
    gap: 18,
  },
  card: {
    borderWidth: THEME.borders.thick,
    padding: 18,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  editAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editAccountBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    flex: 1,
  },
  editForm: {
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 42,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  togglePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  togglePasswordText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  passwordBox: {
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: THEME.fonts.mono,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  syncContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  syncPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncStatusTitle: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  syncStatusSub: {
    fontSize: 10,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncBtnText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  shiftOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  shiftTimeBlock: {
    flex: 1,
    minWidth: 100,
  },
  shiftBlockLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  shiftBlockValue: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  shiftArrowDivider: {
    width: 1,
    height: 30,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  themeOptionCard: {
    flex: 1,
    minWidth: 200,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionMeta: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  themeOptionSub: {
    fontSize: 9,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
  },
  dataStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  dataStatBox: {
    flex: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  dataStatVal: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  dataStatLbl: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dataStatDivider: {
    width: 1,
    height: 28,
  },
  aboutCard: {
    marginTop: 4,
  },
  aboutGrid: {
    gap: 6,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  aboutLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  aboutValue: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  dangerZoneCard: {
    marginTop: 8,
  },
  dangerZoneDesc: {
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
    lineHeight: 16,
    marginBottom: 14,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  deleteAccountBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginTop: 8,
    marginBottom: 40,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1.2,
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 480,
    borderWidth: THEME.borders.thick,
    padding: 24,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  deleteModalIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ff1744',
  },
  deleteModalTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  deleteModalWarningText: {
    fontSize: 12,
    fontFamily: THEME.fonts.mono,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  deleteModalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  deleteModalCancelText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  deleteModalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    minWidth: 160,
  },
  deleteModalConfirmText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
});
