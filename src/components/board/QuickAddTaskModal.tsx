import React, { useState, useEffect, useRef } from 'react';
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
import { X, Link as LinkIcon, Calendar, Check, Ban, Clock, Palette, FileText, MapPin } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { TaskType } from '../../types';
import {
  formatDateISO,
  getMondayOfWeek,
  formatEstimatedDuration,
  formatTimeInput,
  isValidTimeHHMM,
  formatTime12h,
  calculateMinutesBetweenTimes,
} from '../../utils/dateUtils';

type DurationUnit = 'minutes' | 'hours' | 'days';

const QUICK_DURATION_PRESETS = [
  { label: '30M', val: '30', unit: 'minutes' as DurationUnit },
  { label: '1H', val: '1', unit: 'hours' as DurationUnit },
  { label: '2H', val: '2', unit: 'hours' as DurationUnit },
  { label: '4H', val: '4', unit: 'hours' as DurationUnit },
  { label: '1D', val: '1', unit: 'days' as DurationUnit },
];

const TIME_PRESETS = ['09:00', '12:00', '15:00', '18:00', '21:00'];
const START_TIME_PRESETS = ['08:00', '09:00', '10:00', '11:00', '14:00', '16:00'];
const END_TIME_PRESETS = ['09:00', '10:00', '11:00', '12:00', '15:00', '17:00'];

const COLOR_PALETTE = [
  '#00c853', // Emerald
  '#00e5ff', // Cyan
  '#ffab00', // Amber
  '#ff1744', // Red
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#eab308', // Yellow
  '#14b8a6', // Teal
  '#ffffff', // White
  '#94a3b8', // Slate
];

export const QuickAddTaskModal: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isOpen = useUIStore((state) => state.isQuickAddModalOpen);
  const targetDate = useUIStore((state) => state.quickAddTargetDate);
  const parentTaskId = useUIStore((state) => state.quickAddParentTaskId);
  const closeQuickAdd = useUIStore((state) => state.closeQuickAdd);
  const setReferenceDate = useUIStore((state) => state.setReferenceDate);

  const { colors } = useTheme();
  const { t } = useTranslation();

  const DURATION_UNITS: { id: DurationUnit; label: string; short: string }[] = [
    { id: 'minutes', label: t.quickAdd.minutes, short: t.quickAdd.minutes },
    { id: 'hours', label: t.quickAdd.hours, short: t.quickAdd.hours },
    { id: 'days', label: t.quickAdd.days, short: t.quickAdd.days },
  ];

  const createTask = useTaskStore((state) => state.createTask);
  const tasks = useTaskStore((state) => state.tasks);

  const [taskType, setTaskType] = useState<TaskType>('task');
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState('');
  const [eventDate, setEventDate] = useState<string>('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [selectedColor, setSelectedColor] = useState('#00c853');
  const [customHex, setCustomHex] = useState('#00c853');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Compute preset dates for quick selection
  const computedPresets = React.useMemo(() => {
    const baseDateStr = targetDate || formatDateISO(new Date());
    const base = new Date(baseDateStr + 'T00:00:00');

    const tomorrow = new Date(base);
    tomorrow.setDate(base.getDate() + 1);

    const monday = getMondayOfWeek(base);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return [
      { id: 'same', label: t.quickAdd.sameDay, date: baseDateStr },
      { id: 'tomorrow', label: t.quickAdd.tomorrow, date: formatDateISO(tomorrow) },
      { id: 'sunday', label: t.quickAdd.endOfWeek, date: formatDateISO(sunday) },
    ];
  }, [targetDate, t.quickAdd.sameDay, t.quickAdd.tomorrow, t.quickAdd.endOfWeek]);

  useEffect(() => {
    if (isOpen) {
      setTaskType('task');
      setTitle('');
      setTitleError(false);
      setDescription('');
      setNotes('');
      setDueDate('');
      setDueTime('');
      setEventDate(targetDate || formatDateISO(new Date()));
      setStartTime('10:00');
      setEndTime('11:00');
      setLocation('');
      setDurationValue('1');
      setDurationUnit('hours');
      setSelectedColor('#00c853');
      setCustomHex('#00c853');
    }
  }, [isOpen, targetDate]);

  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeQuickAdd();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeQuickAdd]);

  const parentTask = parentTaskId ? tasks.find((t) => t.id === parentTaskId) : null;

  // Compute calculated duration in minutes
  const parsedVal = parseFloat(durationValue.replace(',', '.')) || 0;
  let estimatedDurationMinutes = 0;
  if (durationUnit === 'minutes') {
    estimatedDurationMinutes = Math.max(1, Math.round(parsedVal));
  } else if (durationUnit === 'hours') {
    estimatedDurationMinutes = Math.max(1, Math.round(parsedVal * 60));
  } else if (durationUnit === 'days') {
    estimatedDurationMinutes = Math.max(1, Math.round(parsedVal * 24 * 60));
  }

  const handleApplyColor = (color: string) => {
    setSelectedColor(color);
    setCustomHex(color);
  };

  const handleCustomHexChange = (text: string) => {
    let clean = text.trim();
    if (!clean.startsWith('#') && clean.length > 0) {
      clean = '#' + clean;
    }
    setCustomHex(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setSelectedColor(clean);
    }
  };

  const handleDueTimeChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setDueTime(formatted);
  };

  const syncDurationFromEventTimes = (start: string, end: string) => {
    if (isValidTimeHHMM(start) && isValidTimeHHMM(end)) {
      const diffMins = calculateMinutesBetweenTimes(start, end);
      if (diffMins && diffMins > 0) {
        if (diffMins >= 60 && diffMins % 30 === 0) {
          setDurationValue((diffMins / 60).toFixed(1).replace(/\.0$/, ''));
          setDurationUnit('hours');
        } else {
          setDurationValue(String(diffMins));
          setDurationUnit('minutes');
        }
      }
    }
  };

  const handleStartTimeChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setStartTime(formatted);
    syncDurationFromEventTimes(formatted, endTime);
  };

  const handleEndTimeChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setEndTime(formatted);
    syncDurationFromEventTimes(startTime, formatted);
  };

  const handleSelectStartTime = (timePreset: string) => {
    setStartTime(timePreset);
    syncDurationFromEventTimes(timePreset, endTime);
  };

  const handleSelectEndTime = (timePreset: string) => {
    setEndTime(timePreset);
    syncDurationFromEventTimes(startTime, timePreset);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => titleInputRef.current?.focus(), 150);
      return;
    }
    setTitleError(false);
    setIsSubmitting(true);
    try {
      const scheduledDate = taskType === 'event'
        ? (eventDate.trim() || targetDate || formatDateISO(new Date()))
        : (targetDate || formatDateISO(new Date()));

      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        date: scheduledDate,
        dueDate: taskType === 'task' ? (dueDate.trim() || undefined) : undefined,
        dueTime: taskType === 'task' ? (dueTime.trim() || undefined) : undefined,
        taskType,
        startTime: taskType === 'event' ? (isValidTimeHHMM(startTime.trim()) ? startTime.trim() : undefined) : undefined,
        endTime: taskType === 'event' ? (isValidTimeHHMM(endTime.trim()) ? endTime.trim() : undefined) : undefined,
        location: taskType === 'event' ? (location.trim() || undefined) : undefined,
        estimatedDurationMinutes: estimatedDurationMinutes || 60,
        colorTag: selectedColor,
        parentTaskId: parentTaskId || undefined,
      });

      // Automatically shift board view to the week of the created task/event if different
      const targetD = new Date(scheduledDate + 'T00:00:00');
      if (!isNaN(targetD.getTime())) {
        setReferenceDate(targetD);
      }

      closeQuickAdd();
    } catch (err) {
      console.error('Failed to create task/event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeQuickAdd}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.techFrame,
            {
              backgroundColor: colors.bgBase,
              borderColor: selectedColor || colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.techFrameMobile,
          ]}
        >
          {/* Top Color Stripe */}
          <View style={[styles.topColorStripe, { backgroundColor: selectedColor }]} />

          {/* Tech Badge */}
          <View
            style={[
              styles.techBadge,
              {
                backgroundColor: colors.bgBase,
                borderColor: selectedColor || colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.techBadgeText, { color: selectedColor }]}>
              {taskType === 'event' ? t.quickAdd.statusDraftEvent : t.quickAdd.statusDraft}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={closeQuickAdd}
            style={[
              styles.closeBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgBase,
              },
            ]}
            activeOpacity={0.7}
          >
            <X size={18} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          <ScrollView ref={scrollViewRef} style={styles.techFrameContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.titleSection}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t.quickAdd.modalSubtitle}
              </Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                {taskType === 'event' ? t.quickAdd.modalTitleEvent : t.quickAdd.modalTitle}
              </Text>
            </View>

            {/* Linked Parent Notice if any */}
            {parentTask ? (
              <View
                style={[
                  styles.linkedNotice,
                  {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSubtle,
                  },
                ]}
              >
                <LinkIcon size={14} color={colors.accent} />
                <Text style={[styles.linkedText, { color: colors.accent }]} numberOfLines={1}>
                  {t.quickAdd.continuationOf} <Text style={{ fontWeight: '900' }}>{parentTask.title.toUpperCase()}</Text>
                </Text>
              </View>
            ) : null}

            {/* Mode Switcher Segmented Control (TRÁMITE / TAREA vs EVENTO) */}
            <View style={styles.modeSection}>
              <Text style={[styles.modeSectionLabel, { color: colors.textSecondary }]}>
                {t.quickAdd.modeSelectorLabel}
              </Text>
              <View style={styles.modeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    taskType === 'task' && styles.modeBtnActive,
                    {
                      backgroundColor: taskType === 'task' ? colors.textPrimary : colors.bgSurface,
                      borderColor: taskType === 'task' ? colors.textPrimary : colors.borderMuted,
                      shadowColor: colors.shadowColor,
                    },
                  ]}
                  onPress={() => setTaskType('task')}
                  activeOpacity={0.8}
                >
                  <FileText size={15} color={taskType === 'task' ? colors.bgBase : colors.textSecondary} />
                  <Text
                    style={[
                      styles.modeBtnText,
                      {
                        color: taskType === 'task' ? colors.bgBase : colors.textSecondary,
                        fontWeight: taskType === 'task' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.quickAdd.modeTask}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    taskType === 'event' && styles.modeBtnActive,
                    {
                      backgroundColor: taskType === 'event' ? colors.accent : colors.bgSurface,
                      borderColor: taskType === 'event' ? colors.accent : colors.borderMuted,
                      shadowColor: colors.shadowColor,
                    },
                  ]}
                  onPress={() => setTaskType('event')}
                  activeOpacity={0.8}
                >
                  <Calendar size={15} color={taskType === 'event' ? colors.textInvert : colors.textSecondary} />
                  <Text
                    style={[
                      styles.modeBtnText,
                      {
                        color: taskType === 'event' ? colors.textInvert : colors.textSecondary,
                        fontWeight: taskType === 'event' ? '900' : '700',
                      },
                    ]}
                  >
                    {t.quickAdd.modeEvent}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Title */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {taskType === 'event' ? t.quickAdd.titleLabelEvent : t.quickAdd.titleLabel} <Text style={{ color: colors.accentAlert || '#ff4444' }}>*</Text>
                </Text>
                {titleError ? (
                  <Text style={{ fontSize: 10, color: colors.accentAlert || '#ff4444', fontFamily: THEME.fonts.mono, fontWeight: '800' }}>
                    [ CAMPO REQUERIDO ]
                  </Text>
                ) : null}
              </View>
              <TextInput
                ref={titleInputRef}
                style={[
                  styles.geometricInput,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: titleError ? (colors.accentAlert || '#ff4444') : colors.borderColor,
                    borderWidth: titleError ? 2 : 1,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={taskType === 'event' ? t.quickAdd.titlePlaceholderEvent : t.quickAdd.titlePlaceholder}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (titleError && text.trim()) setTitleError(false);
                }}
                autoFocus
              />
            </View>

            {/* Form Description (Shared) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.quickAdd.descLabel}</Text>
              <TextInput
                style={[
                  styles.geometricInput,
                  styles.textArea,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t.quickAdd.descPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Dedicated Notes / Scratchpad Input (Shared) */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithIcon}>
                <FileText size={13} color={colors.accent} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {t.quickAdd.notesLabel}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.geometricInput,
                  styles.notesArea,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t.quickAdd.notesPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Mode 1: Delivery Deadline & Due Time Section (Task Mode) */}
            {taskType === 'task' ? (
              <View style={styles.formGroup}>
                <View style={styles.labelWithIcon}>
                  <Calendar size={13} color={colors.accent} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {t.quickAdd.deadlineSectionLabel}
                  </Text>
                </View>

                {/* Date and Time Inputs Side-by-Side */}
                <View style={[styles.deadlineInputsRow, isMobile && styles.deadlineInputsRowMobile]}>
                  {/* Date Input Column */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                      {t.quickAdd.dueDateLabel}
                    </Text>
                    <TextInput
                      style={[
                        styles.geometricInput,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                          minHeight: 44,
                        },
                      ]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      value={dueDate}
                      onChangeText={setDueDate}
                      maxLength={10}
                    />

                    {/* Date Presets Row directly under Due Date input */}
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

                  {/* Due Time Input */}
                  <View style={{ flex: 1, marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 8 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                        {t.quickAdd.dueTimeLabel}
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
                          styles.geometricInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: isValidTimeHHMM(dueTime)
                              ? colors.accent
                              : dueTime
                              ? colors.accentWarning
                              : colors.borderColor,
                            color: colors.textPrimary,
                            minHeight: 44,
                            flex: 1,
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: 1,
                          },
                        ]}
                        placeholder="18:30"
                        placeholderTextColor={colors.textMuted}
                        value={dueTime}
                        onChangeText={handleDueTimeChange}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />

                      {Platform.OS === 'web' ? (
                        <View style={{ height: 44, justifyContent: 'center' }}>
                          <input
                            type="time"
                            value={isValidTimeHHMM(dueTime) ? dueTime : ''}
                            onChange={(e) => setDueTime(e.target.value)}
                            style={{
                              height: 44,
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

                    {/* Time Presets Row directly under Due Time input */}
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
            ) : (
              /* Mode 2: Event Specification Section (Event Mode) */
              <View style={styles.formGroup}>
                <View style={styles.labelWithIcon}>
                  <Calendar size={13} color={colors.accent} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {t.quickAdd.eventSectionLabel}
                  </Text>
                </View>

                {/* Event Date Row */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                    {t.quickAdd.eventDateLabel}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TextInput
                      style={[
                        styles.geometricInput,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                          minHeight: 44,
                          flex: 1,
                        },
                      ]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      value={eventDate}
                      onChangeText={setEventDate}
                      maxLength={10}
                    />

                    {Platform.OS === 'web' ? (
                      <View style={{ height: 44, justifyContent: 'center' }}>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          style={{
                            height: 44,
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

                  {/* Event Date Presets Row */}
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

                {/* Start and End Times Row */}
                <View style={[styles.deadlineInputsRow, isMobile && styles.deadlineInputsRowMobile, { marginBottom: 12 }]}>
                  {/* Start Time Column */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                        {t.quickAdd.eventStartTimeLabel}
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
                          styles.geometricInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: isValidTimeHHMM(startTime) ? colors.accent : colors.borderColor,
                            color: colors.textPrimary,
                            minHeight: 44,
                            flex: 1,
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: 1,
                          },
                        ]}
                        placeholder="10:00"
                        placeholderTextColor={colors.textMuted}
                        value={startTime}
                        onChangeText={handleStartTimeChange}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />

                      {Platform.OS === 'web' ? (
                        <View style={{ height: 44, justifyContent: 'center' }}>
                          <input
                            type="time"
                            value={isValidTimeHHMM(startTime) ? startTime : ''}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            style={{
                              height: 44,
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

                    {/* Start Time Presets */}
                    <View style={styles.presetsRowFlex}>
                      {START_TIME_PRESETS.slice(0, 4).map((tPreset) => {
                        const isSelected = startTime === tPreset;
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
                            onPress={() => handleSelectStartTime(tPreset)}
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

                  {/* End Time Column */}
                  <View style={{ flex: 1, marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 8 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                        {t.quickAdd.eventEndTimeLabel}
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
                          styles.geometricInput,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: isValidTimeHHMM(endTime) ? colors.accent : colors.borderColor,
                            color: colors.textPrimary,
                            minHeight: 44,
                            flex: 1,
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: 1,
                          },
                        ]}
                        placeholder="11:30"
                        placeholderTextColor={colors.textMuted}
                        value={endTime}
                        onChangeText={handleEndTimeChange}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />

                      {Platform.OS === 'web' ? (
                        <View style={{ height: 44, justifyContent: 'center' }}>
                          <input
                            type="time"
                            value={isValidTimeHHMM(endTime) ? endTime : ''}
                            onChange={(e) => handleEndTimeChange(e.target.value)}
                            style={{
                              height: 44,
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

                    {/* End Time Presets */}
                    <View style={styles.presetsRowFlex}>
                      {END_TIME_PRESETS.slice(0, 4).map((tPreset) => {
                        const isSelected = endTime === tPreset;
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
                            onPress={() => handleSelectEndTime(tPreset)}
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

                {/* Location Input */}
                <View style={{ marginTop: 4 }}>
                  <View style={styles.labelWithIcon}>
                    <MapPin size={13} color={colors.accent} />
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                      {t.quickAdd.locationLabel}
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.geometricInput,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        minHeight: 44,
                      },
                    ]}
                    placeholder={t.quickAdd.locationPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>
            )}

            {/* Estimated Duration Section */}
            <View style={styles.formGroup}>
              <View style={styles.durationHeaderRow}>
                <View style={styles.labelWithIcon}>
                  <Clock size={13} color={colors.accent} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {t.quickAdd.estDurationLabel}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {taskType === 'event' && calculateMinutesBetweenTimes(startTime, endTime) ? (
                    <View
                      style={{
                        backgroundColor: colors.accentSubtle,
                        borderColor: colors.accent,
                        borderWidth: 1,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontFamily: THEME.fonts.mono, color: colors.accent, fontWeight: '900' }}>
                        AUTO
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.durationPreviewText, { color: colors.accent }]}>
                    [ {formatEstimatedDuration(estimatedDurationMinutes)} // {estimatedDurationMinutes}M ]
                  </Text>
                </View>
              </View>

              {/* Input + Unit Selector Group */}
              <View style={styles.durationInputWrapper}>
                <TextInput
                  style={[
                    styles.geometricInput,
                    styles.durationNumInput,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="1.5"
                  placeholderTextColor={colors.textMuted}
                  value={durationValue}
                  onChangeText={setDurationValue}
                  keyboardType="decimal-pad"
                />

                {/* Unit Segmented Buttons (MIN / HRS / DAYS) */}
                <View style={[styles.unitButtonGroup, { borderColor: colors.borderColor }]}>
                  {DURATION_UNITS.map((u) => {
                    const isSelected = durationUnit === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          styles.unitBtn,
                          {
                            backgroundColor: isSelected ? colors.textPrimary : colors.bgSurface,
                            borderRightColor: colors.borderMuted,
                          },
                        ]}
                        onPress={() => setDurationUnit(u.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.unitBtnText,
                            {
                              color: isSelected ? colors.bgBase : colors.textSecondary,
                              fontWeight: isSelected ? '900' : '700',
                            },
                          ]}
                        >
                          {u.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Quick Duration Presets - Exact width fitting */}
              <View style={styles.presetsRowFlex}>
                {QUICK_DURATION_PRESETS.map((p) => {
                  const isSelected = durationValue === p.val && durationUnit === p.unit;
                  return (
                    <TouchableOpacity
                      key={p.label}
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
                      onPress={() => {
                        setDurationValue(p.val);
                        setDurationUnit(p.unit);
                      }}
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

            {/* Customizable Color Palette & Custom Hex */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithIcon}>
                <Palette size={13} color={selectedColor} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {t.quickAdd.colorTagLabel}
                </Text>
                <View style={[styles.colorPreviewDot, { backgroundColor: selectedColor }]} />
              </View>

              {/* Extended Swatches */}
              <View style={styles.colorsRow}>
                {COLOR_PALETTE.map((color) => {
                  const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorBox,
                        {
                          backgroundColor: color,
                          borderColor: isSelected ? colors.textPrimary : colors.borderMuted,
                          borderWidth: isSelected ? 3 : 1.5,
                          transform: isSelected ? [{ scale: 1.15 }] : [{ scale: 1 }],
                        },
                      ]}
                      onPress={() => handleApplyColor(color)}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>

              {/* Custom Hex input + Native Web Color Picker */}
              <View style={styles.customHexRow}>
                <Text style={[styles.hexLabel, { color: colors.textSecondary }]}>{t.quickAdd.customHexLabel}</Text>
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

                {Platform.OS === 'web' ? (
                  <View style={styles.nativePickerContainer}>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => handleApplyColor(e.target.value)}
                      style={{
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        background: 'transparent',
                        border: `1.5px solid ${colors.borderColor}`,
                        padding: 0,
                      }}
                    />
                  </View>
                ) : null}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.borderMuted,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
                onPress={closeQuickAdd}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  {t.quickAdd.cancelBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.borderColor,
                  },
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.submitText, { color: colors.textInvert }]}>
                  {taskType === 'event'
                    ? isSubmitting
                      ? t.quickAdd.creatingEventBtn
                      : t.quickAdd.createEventBtn
                    : isSubmitting
                    ? t.quickAdd.creatingBtn
                    : t.quickAdd.createBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    zIndex: 1000,
  },
  techFrame: {
    width: '100%',
    maxWidth: 740,
    maxHeight: '92%',
    borderWidth: THEME.borders.thick,
    position: 'relative',
    shadowOffset: { width: 8, height: 8 },
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
    height: 5,
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
  techFrameContent: {
    padding: 24,
    paddingTop: 36,
  },
  titleSection: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontFamily: THEME.fonts.mono,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  linkedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  linkedText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    flex: 1,
  },
  modeSection: {
    marginBottom: 16,
  },
  modeSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: THEME.fonts.mono,
    marginBottom: 8,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 12,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modeBtnActive: {
    shadowOffset: { width: 4, height: 4 },
  },
  modeBtnText: {
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: THEME.fonts.mono,
  },
  colorPreviewDot: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  geometricInput: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
    minHeight: 46,
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  notesArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  presetChipText: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  deadlineInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  deadlineInputsRowMobile: {
    flexDirection: 'column',
  },
  inputSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  presetsRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '100%',
    marginTop: 6,
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  rowFieldMobile: {
    flexDirection: 'column',
  },
  durationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  durationPreviewText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  durationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  durationNumInput: {
    flex: 1,
    minHeight: 44,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  unitButtonGroup: {
    flexDirection: 'row',
    borderWidth: THEME.borders.thick,
    overflow: 'hidden',
    minHeight: 44,
  },
  unitBtn: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  unitBtnText: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    fontFamily: THEME.fonts.mono,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorBox: {
    width: 28,
    height: 28,
  },
  customHexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  hexLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  hexInput: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    width: 100,
    textAlign: 'center',
  },
  nativePickerContainer: {
    justifyContent: 'center',
  },
  timePresetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePresetText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    paddingBottom: 16,
  },
  cancelBtn: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  submitBtn: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
});
