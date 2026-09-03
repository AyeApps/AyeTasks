import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  X,
  FileText,
  Clock,
  Palette,
  Trash2,
  CheckCircle2,
  Calendar,
  Activity,
  Flame,
  ArrowRight,
  Pencil,
  Check,
  Eye,
  MapPin,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useTimerStore } from '../../store/useTimerStore';
import { useTranslation } from '../../store/useLanguageStore';
import { Task } from '../../types';
import {
  formatDigitalTimer,
  formatLoggedTime,
  formatEstimatedDuration,
  formatTimeInput,
  isValidTimeHHMM,
  formatTime12h,
  formatDateISO,
  getMondayOfWeek,
} from '../../utils/dateUtils';

const COLOR_PALETTE = [
  '#00c853', // Emerald Green
  '#00e5ff', // Cyan Neon
  '#ffab00', // Amber
  '#ff1744', // Crimson Red
  '#a855f7', // Purple Neon
  '#ec4899', // Pink Neon
  '#3b82f6', // Electric Blue
  '#f97316', // Orange
  '#eab308', // Yellow
  '#14b8a6', // Teal
  '#ffffff', // Clean White
  '#94a3b8', // Muted Slate
];

const TIME_PRESETS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { colors } = useTheme();
  const { t } = useTranslation();

  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const startTaskTimer = useTimerStore((state) => state.startTaskTimer);
  const stopTaskTimer = useTimerStore((state) => state.stopTaskTimer);
  const activeTimers = useTimerStore((state) => state.activeTimers);
  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [colorTag, setColorTag] = useState('#00c853');
  const [customHex, setCustomHex] = useState('#00c853');
  const [isSaving, setIsSaving] = useState(false);

  // Compute preset dates for quick selection
  const computedPresets = React.useMemo(() => {
    if (!task?.date) return [];
    const base = new Date(task.date + 'T00:00:00');

    const tomorrow = new Date(base);
    tomorrow.setDate(base.getDate() + 1);

    const monday = getMondayOfWeek(base);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return [
      { id: 'same', label: t.quickAdd.sameDay, date: task.date },
      { id: 'tomorrow', label: t.quickAdd.tomorrow, date: formatDateISO(tomorrow) },
      { id: 'sunday', label: t.quickAdd.endOfWeek, date: formatDateISO(sunday) },
    ];
  }, [task?.date, t.quickAdd.sameDay, t.quickAdd.tomorrow, t.quickAdd.endOfWeek]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setNotes(task.notes || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEventDate(task.date || '');
      setStartTime(task.startTime || '');
      setEndTime(task.endTime || '');
      setLocation(task.location || '');
      setColorTag(task.colorTag || '#00c853');
      setCustomHex(task.colorTag || '#00c853');
    }
    // Default to clean view mode whenever modal is opened
    setIsEditing(false);
  }, [task, isOpen]);

  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!task) return null;

  const isTimerRunning = !!activeTimers[task.id];
  const thisTimer = activeTimers[task.id];
  const isFocusModeRunning = isTimerRunning && thisTimer?.uiMode === 'focus_bar';
  const isBgTrackRunning = isTimerRunning && thisTimer?.uiMode === 'background';
  const isCompleted = task.status === 'completed';

  const handleToggleFocus = () => {
    if (isFocusModeRunning) {
      stopTaskTimer(task.id);
    } else {
      startTaskTimer(task.id, task.title, 'focus_bar');
    }
  };

  const handleToggleInProgress = () => {
    if (isBgTrackRunning) {
      stopTaskTimer(task.id);
    } else {
      startTaskTimer(task.id, task.title, 'background');
    }
  };

  const handleApplyColor = (color: string) => {
    setColorTag(color);
    setCustomHex(color);
  };

  const handleCustomHexChange = (text: string) => {
    let clean = text.trim();
    if (!clean.startsWith('#') && clean.length > 0) {
      clean = '#' + clean;
    }
    setCustomHex(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setColorTag(clean);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setNotes(task.notes || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEventDate(task.date || '');
      setStartTime(task.startTime || '');
      setEndTime(task.endTime || '');
      setLocation(task.location || '');
      setColorTag(task.colorTag || '#00c853');
      setCustomHex(task.colorTag || '#00c853');
    }
    setIsEditing(false);
  };

  const handleSaveNotesAndDetails = async () => {
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        date: task.taskType === 'event' ? (eventDate.trim() || task.date) : task.date,
        dueDate: task.taskType === 'task' ? (dueDate.trim() || undefined) : undefined,
        dueTime: task.taskType === 'task' ? (dueTime.trim() || undefined) : undefined,
        startTime: task.taskType === 'event' ? (startTime.trim() || undefined) : undefined,
        endTime: task.taskType === 'event' ? (endTime.trim() || undefined) : undefined,
        location: task.taskType === 'event' ? (location.trim() || undefined) : undefined,
        colorTag,
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isTimerRunning) {
      stopTaskTimer(task.id);
    }
    await deleteTask(task.id);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.techFrame,
            {
              backgroundColor: colors.bgBase,
              borderColor: colorTag || colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.techFrameMobile,
          ]}
        >
          {/* Top Color Stripe */}
          <View style={[styles.topColorStripe, { backgroundColor: colorTag }]} />

          {/* Tech Badge */}
          <View
            style={[
              styles.techBadge,
              {
                backgroundColor: colors.bgBase,
                borderColor: colorTag || colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.techBadgeText, { color: colorTag }]}>
              {task.taskType === 'event' ? t.taskDetails.eventPrefix : t.taskDetails.statusPrefix} {isEditing ? t.taskDetails.editingSpec : task.status.toUpperCase()} // ID: {task.id.slice(-6)}
            </Text>
          </View>

          {/* Top Right Header Controls: Edit Pencil / View Button + Close Button */}
          <View style={styles.headerRightControls}>
            {!isEditing ? (
              <TouchableOpacity
                style={[
                  styles.editModeToggleBtn,
                  {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSubtle,
                  },
                ]}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <Pencil size={13} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.editModeToggleText, { color: colors.accent }]}>{t.taskDetails.editBtn}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.editModeToggleBtn,
                  {
                    borderColor: colors.borderMuted,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <Eye size={13} color={colors.textSecondary} strokeWidth={2.5} />
                <Text style={[styles.editModeToggleText, { color: colors.textSecondary }]}>{t.taskDetails.viewBtn}</Text>
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgBase,
                },
              ]}
              activeOpacity={0.7}
            >
              <X size={16} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* ════════════════════════════════════════════════════════════════
              MODE 1: CLEAN VISUALIZATION / OPERATOR VIEW (!isEditing)
             ════════════════════════════════════════════════════════════════ */}
          {!isEditing ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Task Title with Toggle Checkbox */}
              <View style={styles.viewTitleHeader}>
                <TouchableOpacity
                  style={[
                    styles.viewCheckbox,
                    {
                      borderColor: isCompleted ? colors.accent : colors.borderColor,
                      backgroundColor: isCompleted ? colors.accent : colors.bgSurface,
                    },
                  ]}
                  onPress={() => toggleTaskStatus(task.id)}
                  activeOpacity={0.7}
                >
                  {isCompleted ? (
                    <Check size={14} color={colors.textInvert} strokeWidth={3.5} />
                  ) : null}
                </TouchableOpacity>

                <Text
                  style={[
                    styles.viewTitleText,
                    { color: isCompleted ? colors.textMuted : colors.textPrimary },
                    isCompleted && styles.titleCompleted,
                  ]}
                >
                  {task.title.toUpperCase()}
                </Text>
              </View>

              {/* Quick Metrics Bar */}
              <View style={[styles.metricsBar, { borderColor: colors.borderMuted, backgroundColor: colors.bgSurface }]}>
                <View style={styles.metricItem}>
                  <Clock size={13} color={colors.textSecondary} />
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.taskDetails.estimatedLabel}</Text>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
                    {formatEstimatedDuration(task.estimatedDurationMinutes)}
                  </Text>
                </View>

                <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />

                <View style={styles.metricItem}>
                  <Activity size={13} color={colors.accentWarning} />
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.taskDetails.loggedLabel}</Text>
                  <Text style={[styles.metricVal, { color: colors.accentWarning }]}>
                    {formatLoggedTime(task.actualDurationSeconds)}
                  </Text>
                </View>

                {task.taskType === 'event' ? (
                  <>
                    <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />
                    <View style={styles.metricItem}>
                      <Calendar size={13} color={colors.accent} />
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.taskDetails.eventDateLabel}</Text>
                      <Text style={[styles.metricVal, { color: colors.accent }]}>
                        {task.date}
                      </Text>
                    </View>
                    {(task.startTime || task.endTime) ? (
                      <>
                        <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />
                        <View style={styles.metricItem}>
                          <Clock size={13} color={colors.accentWarning} />
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.taskDetails.eventTimeLabel}</Text>
                          <Text style={[styles.metricVal, { color: colors.accentWarning }]}>
                            {task.startTime || '??:??'}{task.endTime ? ` - ${task.endTime}` : ''}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </>
                ) : task.dueDate ? (
                  <>
                    <View style={[styles.metricDivider, { backgroundColor: colors.borderMuted }]} />
                    <View style={styles.metricItem}>
                      <Calendar size={13} color={colors.accent} />
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t.taskDetails.dueLabel}</Text>
                      <Text style={[styles.metricVal, { color: colors.accent }]}>
                        {task.dueDate} {task.dueTime || ''}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Location View Section for Events */}
              {task.taskType === 'event' && task.location ? (
                <View style={[styles.viewSection, { marginTop: 8 }]}>
                  <View style={styles.labelWithIcon}>
                    <MapPin size={13} color={colors.accent} />
                    <Text style={[styles.viewSectionLabel, { color: colors.textSecondary }]}>
                      {t.taskDetails.locationLabel}
                    </Text>
                  </View>
                  <View style={[styles.viewBox, { backgroundColor: colors.bgSurface, borderColor: colors.borderMuted, minHeight: 38, justifyContent: 'center' }]}>
                    <Text style={[styles.viewBoxText, { color: colors.textPrimary, fontWeight: '700' }]}>
                      {task.location}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Stopwatch / Timer Quick Control Buttons */}
              <View style={styles.timerControlRow}>
                <TouchableOpacity
                  style={[
                    styles.modalTimerBtn,
                    {
                      borderColor: isFocusModeRunning ? colors.accentDanger : colors.borderColor,
                      backgroundColor: isFocusModeRunning ? colors.accentDanger : colors.bgSurface,
                    },
                  ]}
                  onPress={handleToggleFocus}
                  activeOpacity={0.8}
                >
                  <Flame size={14} color={isFocusModeRunning ? colors.textInvert : colors.accentDanger} />
                  <Text
                    style={[
                      styles.modalTimerBtnText,
                      { color: isFocusModeRunning ? colors.textInvert : colors.accentDanger },
                    ]}
                  >
                    {isFocusModeRunning ? t.taskDetails.pauseFocus : t.taskDetails.startFocus}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalTimerBtn,
                    {
                      borderColor: isBgTrackRunning ? colors.accentWarning : colors.borderColor,
                      backgroundColor: isBgTrackRunning ? colors.accentWarning : colors.bgSurface,
                    },
                  ]}
                  onPress={handleToggleInProgress}
                  activeOpacity={0.8}
                >
                  <Activity size={14} color={isBgTrackRunning ? colors.textInvert : colors.accentWarning} />
                  <Text
                    style={[
                      styles.modalTimerBtnText,
                      { color: isBgTrackRunning ? colors.textInvert : colors.accentWarning },
                    ]}
                  >
                    {isBgTrackRunning ? t.taskDetails.pauseTracking : t.taskDetails.startTracking}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Description / Subtitle View */}
              {task.description ? (
                <View style={styles.viewSection}>
                  <Text style={[styles.viewSectionLabel, { color: colors.textSecondary }]}>
                    {t.taskDetails.descLabel}
                  </Text>
                  <View style={[styles.viewBox, { backgroundColor: colors.bgSurface, borderColor: colors.borderMuted }]}>
                    <Text style={[styles.viewBoxText, { color: colors.textPrimary }]}>
                      {task.description}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Notes / Scratchpad View */}
              <View style={styles.viewSection}>
                <View style={styles.labelWithIcon}>
                  <FileText size={14} color={colors.accent} />
                  <Text style={[styles.viewSectionLabel, { color: colors.textPrimary }]}>
                    {t.taskDetails.notesLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.viewBox,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: task.notes ? colors.borderColor : colors.borderMuted,
                      minHeight: 90,
                    },
                  ]}
                >
                  {task.notes ? (
                    <Text style={[styles.viewNotesText, { color: colors.textPrimary }]}>
                      {task.notes}
                    </Text>
                  ) : (
                    <Text style={[styles.viewEmptyNotes, { color: colors.textMuted }]}>
                      {t.taskDetails.noNotesText}
                    </Text>
                  )}
                </View>
              </View>

              {/* View Mode Footer CTA */}
              <View style={styles.viewFooterBar}>
                <TouchableOpacity
                  style={[
                    styles.viewEditActionBtn,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.borderColor,
                    },
                  ]}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.8}
                >
                  <Pencil size={14} color={colors.textInvert} strokeWidth={2.5} />
                  <Text style={[styles.viewEditActionBtnText, { color: colors.textInvert }]}>
                    {t.taskDetails.editSpecBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ════════════════════════════════════════════════════════════════
                MODE 2: INTERACTIVE EDIT SPECIFICATION (isEditing === true)
               ════════════════════════════════════════════════════════════════ */
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Header / Title Input */}
              <View style={styles.headerSection}>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {task.taskType === 'event' ? t.taskDetails.editTitleLabelEvent : t.taskDetails.editTitleLabel}
                </Text>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.borderMuted,
                      backgroundColor: colors.bgSurface,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={task.taskType === 'event' ? t.taskDetails.titlePlaceholderEvent : t.taskDetails.titlePlaceholder}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Color Customizer Section */}
              <View style={styles.section}>
                <View style={styles.labelWithIcon}>
                  <Palette size={14} color={colorTag} />
                  <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                    {t.taskDetails.colorPaletteLabel}
                  </Text>
                  <View style={[styles.colorPreviewDot, { backgroundColor: colorTag }]} />
                </View>

                {/* Swatches Grid */}
                <View style={styles.paletteGrid}>
                  {COLOR_PALETTE.map((c) => {
                    const isSelected = colorTag.toLowerCase() === c.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: c,
                            borderColor: isSelected ? colors.textPrimary : colors.borderMuted,
                            borderWidth: isSelected ? 3 : 1.5,
                            transform: isSelected ? [{ scale: 1.18 }] : [{ scale: 1 }],
                          },
                        ]}
                        onPress={() => handleApplyColor(c)}
                        activeOpacity={0.7}
                      />
                    );
                  })}
                </View>

                {/* Custom HEX Code Input + Native Color Picker Trigger */}
                <View style={styles.customHexRow}>
                  <Text style={[styles.hexLabel, { color: colors.textSecondary }]}>{t.taskDetails.customHexLabel}</Text>
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={customHex}
                    onChangeText={handleCustomHexChange}
                    placeholder="#00C853"
                    placeholderTextColor={colors.textMuted}
                    maxLength={7}
                    autoCapitalize="characters"
                  />

                  {/* HTML5 Native Color Picker integration on Web */}
                  {Platform.OS === 'web' ? (
                    <View style={styles.nativePickerContainer}>
                      <input
                        type="color"
                        value={colorTag}
                        onChange={(e) => handleApplyColor(e.target.value)}
                        style={{
                          width: 42,
                          height: 42,
                          cursor: 'pointer',
                          background: 'transparent',
                          border: `2px solid ${colors.borderColor}`,
                          padding: 0,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Deadline or Event Schedule Section */}
              {task.taskType === 'event' ? (
                <View style={styles.section}>
                  <View style={styles.labelWithIcon}>
                    <Calendar size={14} color={colors.accent} />
                    <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                      {t.taskDetails.eventScheduleLabel}
                    </Text>
                  </View>

                  {/* Event Date */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                      {t.quickAdd.eventDateLabel}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                            minHeight: 40,
                            flex: 1,
                            fontFamily: THEME.fonts.mono,
                          },
                        ]}
                        value={eventDate}
                        onChangeText={setEventDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        maxLength={10}
                      />
                      {Platform.OS === 'web' ? (
                        <View style={{ height: 40, justifyContent: 'center' }}>
                          <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            style={{
                              height: 40,
                              padding: '0 8px',
                              background: colors.bgSurface,
                              border: `2px solid ${colors.borderColor}`,
                              color: colors.textPrimary,
                              cursor: 'pointer',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                            }}
                          />
                        </View>
                      ) : null}
                    </View>

                    {/* Quick Preset Buttons for Event Date */}
                    <View style={styles.presetsRowFlex}>
                      {computedPresets.map((p) => {
                        const isSelected = eventDate === p.date;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              styles.chip,
                              {
                                flex: 1,
                                borderColor: isSelected ? colors.accent : colors.borderMuted,
                                backgroundColor: isSelected ? colors.accentSubtle : colors.bgSurface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 0,
                              },
                            ]}
                            onPress={() => setEventDate(p.date)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: isSelected ? colors.accent : colors.textSecondary,
                                  fontWeight: isSelected ? '900' : '700',
                                },
                              ]}
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Start & End Times */}
                  <View style={[styles.deadlineRow, isMobile && styles.deadlineRowMobile, { marginBottom: 12 }]}>
                    {/* Start Time */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                          {t.taskDetails.startTimeLabel}
                        </Text>
                        {isValidTimeHHMM(startTime) ? (
                          <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accent, fontWeight: '800' }}>
                            ✓ {formatTime12h(startTime)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: colors.bgSurface,
                              borderColor: isValidTimeHHMM(startTime) ? colors.accent : colors.borderColor,
                              color: colors.textPrimary,
                              minHeight: 40,
                              flex: 1,
                              fontFamily: THEME.fonts.mono,
                              letterSpacing: 1,
                            },
                          ]}
                          value={startTime}
                          onChangeText={(t) => setStartTime(formatTimeInput(t))}
                          placeholder="10:00"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />
                        {Platform.OS === 'web' ? (
                          <View style={{ height: 40, justifyContent: 'center' }}>
                            <input
                              type="time"
                              value={isValidTimeHHMM(startTime) ? startTime : ''}
                              onChange={(e) => setStartTime(e.target.value)}
                              style={{
                                height: 40,
                                padding: '0 8px',
                                background: colors.bgSurface,
                                border: `2px solid ${colors.borderColor}`,
                                color: colors.textPrimary,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                              }}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* End Time */}
                    <View style={{ flex: 1, marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 8 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                          {t.taskDetails.endTimeLabel}
                        </Text>
                        {isValidTimeHHMM(endTime) ? (
                          <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accent, fontWeight: '800' }}>
                            ✓ {formatTime12h(endTime)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: colors.bgSurface,
                              borderColor: isValidTimeHHMM(endTime) ? colors.accent : colors.borderColor,
                              color: colors.textPrimary,
                              minHeight: 40,
                              flex: 1,
                              fontFamily: THEME.fonts.mono,
                              letterSpacing: 1,
                            },
                          ]}
                          value={endTime}
                          onChangeText={(t) => setEndTime(formatTimeInput(t))}
                          placeholder="11:30"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />
                        {Platform.OS === 'web' ? (
                          <View style={{ height: 40, justifyContent: 'center' }}>
                            <input
                              type="time"
                              value={isValidTimeHHMM(endTime) ? endTime : ''}
                              onChange={(e) => setEndTime(e.target.value)}
                              style={{
                                height: 40,
                                padding: '0 8px',
                                background: colors.bgSurface,
                                border: `2px solid ${colors.borderColor}`,
                                color: colors.textPrimary,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                              }}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Location Input */}
                  <View>
                    <View style={styles.labelWithIcon}>
                      <MapPin size={13} color={colors.accent} />
                      <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                        {t.taskDetails.locationEditLabel}
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                          minHeight: 40,
                        },
                      ]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder={t.taskDetails.locationEditPlaceholder}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              ) : (
                /* Task Mode: Delivery Deadline & Due Time Section */
                <View style={styles.section}>
                  <View style={styles.labelWithIcon}>
                    <Calendar size={14} color={colors.accent} />
                    <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                      {t.taskDetails.deadlinesLabel}
                    </Text>
                  </View>

                  <View style={[styles.deadlineRow, isMobile && styles.deadlineRowMobile]}>
                    {/* Due Date */}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                        {t.taskDetails.dueDateLabel}
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                            minHeight: 40,
                            fontFamily: THEME.fonts.mono,
                          },
                        ]}
                        value={dueDate}
                        onChangeText={setDueDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        maxLength={10}
                      />

                      {/* Quick Preset Buttons */}
                      <View style={styles.presetsRowFlex}>
                        <TouchableOpacity
                          style={[
                            styles.chip,
                            {
                              flex: 0.85,
                              borderColor: dueDate === '' ? colors.borderMuted : colors.borderMuted,
                              backgroundColor: dueDate === '' ? colors.textPrimary : colors.bgSurface,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 0,
                            },
                          ]}
                          onPress={() => {
                            setDueDate('');
                            setDueTime('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: dueDate === '' ? colors.bgBase : colors.textSecondary,
                                fontWeight: dueDate === '' ? '900' : '700',
                              },
                            ]}
                          >
                            {t.quickAdd.noneDate}
                          </Text>
                        </TouchableOpacity>

                        {computedPresets.map((p) => {
                          const isSelected = dueDate === p.date;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={[
                                styles.chip,
                                {
                                  flex: 1,
                                  borderColor: isSelected ? colors.accent : colors.borderMuted,
                                  backgroundColor: isSelected ? colors.accentSubtle : colors.bgSurface,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingHorizontal: 0,
                                },
                              ]}
                              onPress={() => setDueDate(p.date)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  {
                                    color: isSelected ? colors.accent : colors.textSecondary,
                                    fontWeight: isSelected ? '900' : '700',
                                  },
                                ]}
                              >
                                {p.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Due Time */}
                    <View style={{ flex: 1.1, marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 8 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                          {t.taskDetails.dueTimeLabel}
                        </Text>
                        {isValidTimeHHMM(dueTime) ? (
                          <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accent, fontWeight: '800' }}>
                            ✓ {formatTime12h(dueTime)}
                          </Text>
                        ) : dueTime ? (
                          <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accentWarning, fontWeight: '800' }}>
                            {t.quickAdd.timeFormatHelper}
                          </Text>
                        ) : null}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: colors.bgSurface,
                              borderColor: isValidTimeHHMM(dueTime)
                                ? colors.accent
                                : dueTime
                                ? colors.accentWarning
                                : colors.borderColor,
                              color: colors.textPrimary,
                              minHeight: 40,
                              flex: 1,
                              fontFamily: THEME.fonts.mono,
                              letterSpacing: 1,
                            },
                          ]}
                          value={dueTime}
                          onChangeText={(t) => setDueTime(formatTimeInput(t))}
                          placeholder="18:30"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />

                        {Platform.OS === 'web' ? (
                          <View style={{ height: 40, justifyContent: 'center' }}>
                            <input
                              type="time"
                              value={isValidTimeHHMM(dueTime) ? dueTime : ''}
                              onChange={(e) => setDueTime(e.target.value)}
                              style={{
                                height: 40,
                                padding: '0 8px',
                                background: colors.bgSurface,
                                border: `2px solid ${colors.borderColor}`,
                                color: colors.textPrimary,
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                              }}
                            />
                          </View>
                        ) : null}
                      </View>

                      {/* Preset Pills */}
                      <View style={styles.presetsRowFlex}>
                        {TIME_PRESETS.map((tPreset) => {
                          const isSelected = dueTime === tPreset;
                          return (
                            <TouchableOpacity
                              key={tPreset}
                              style={[
                                styles.timePresetChip,
                                {
                                  flex: 1,
                                  backgroundColor: isSelected ? colors.accent : colors.bgSurface,
                                  borderColor: isSelected ? colors.accent : colors.borderMuted,
                                  paddingHorizontal: 0,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                              ]}
                              onPress={() => setDueTime(tPreset)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.timePresetText,
                                  { color: isSelected ? colors.textInvert : colors.textSecondary },
                                ]}
                              >
                                {tPreset}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Description Field (Brief Subtitle) */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t.taskDetails.descEditLabel}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t.taskDetails.descEditPlaceholder}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Dedicated Notes / Scratchpad Section */}
              <View style={styles.section}>
                <View style={styles.labelWithIcon}>
                  <FileText size={14} color={colors.accent} />
                  <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                    {t.taskDetails.notesEditLabel}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.notesEditor,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t.taskDetails.notesEditPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={7}
                  textAlignVertical="top"
                />
              </View>

              {/* Edit Mode Actions Bar */}
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    {
                      borderColor: colors.accentDanger,
                      backgroundColor: 'rgba(255, 23, 68, 0.1)',
                    },
                  ]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color={colors.accentDanger} />
                  <Text style={[styles.deleteBtnText, { color: colors.accentDanger }]}>
                    {task.taskType === 'event' ? t.taskDetails.deleteEventBtn : t.taskDetails.deleteBtn}
                  </Text>
                </TouchableOpacity>

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      {
                        borderColor: colors.borderMuted,
                        backgroundColor: colors.bgSurface,
                      },
                    ]}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t.taskDetails.cancelBtn}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.borderColor,
                      },
                      isSaving && { opacity: 0.6 },
                    ]}
                    onPress={handleSaveNotesAndDetails}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.saveText, { color: colors.textInvert }]}>
                      {isSaving ? t.taskDetails.savingBtn : t.taskDetails.saveChangesBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1100,
  },
  techFrame: {
    width: '100%',
    maxWidth: 740,
    maxHeight: '92%',
    borderWidth: THEME.borders.thick,
    position: 'relative',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0,
    overflow: 'hidden',
  },
  techFrameMobile: {
    maxWidth: '100%',
    maxHeight: '95%',
    shadowOffset: { width: 4, height: 4 },
  },
  topColorStripe: {
    height: 6,
    width: '100%',
  },
  techBadge: {
    position: 'absolute',
    top: 14,
    left: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: THEME.borders.thick,
    zIndex: 10,
  },
  techBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  headerRightControls: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  editModeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 32,
  },
  editModeToggleText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 24,
    paddingTop: 46,
  },
  viewTitleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  viewCheckbox: {
    width: 24,
    height: 24,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTitleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  viewSection: {
    marginBottom: 16,
  },
  viewSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
    marginBottom: 6,
  },
  viewBox: {
    borderWidth: 1.5,
    padding: 12,
  },
  viewBoxText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  viewNotesText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: THEME.fonts.mono,
    lineHeight: 18,
  },
  viewEmptyNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: THEME.fonts.mono,
  },
  viewFooterBar: {
    marginTop: 8,
    marginBottom: 20,
  },
  viewEditActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingVertical: 11,
    paddingHorizontal: 16,
    width: '100%',
  },
  viewEditActionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  headerSection: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: THEME.fonts.mono,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '900',
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: THEME.fonts.mono,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 10,
    flexWrap: 'wrap',
  },
  timerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  modalTimerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingVertical: 9,
    paddingHorizontal: 10,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    cursor: 'pointer',
  } as any,
  modalTimerBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  metricDivider: {
    width: 1,
    height: 16,
  },
  section: {
    marginBottom: 18,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  colorPreviewDot: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
  },
  customHexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hexLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  hexInput: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    width: 110,
    textAlign: 'center',
  },
  nativePickerContainer: {
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
  },
  notesEditor: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: THEME.fonts.mono,
    minHeight: 130,
    lineHeight: 20,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingBottom: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deadlineRowMobile: {
    flexDirection: 'column',
  },
  inputSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  presetsRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  timePresetChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePresetText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  saveBtn: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
});
