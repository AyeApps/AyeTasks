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
import { X, Link as LinkIcon, Calendar, Check, Ban, Clock, Palette, FileText } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import {
  formatDateISO,
  getMondayOfWeek,
  formatEstimatedDuration,
  formatTimeInput,
  isValidTimeHHMM,
  formatTime12h,
} from '../../utils/dateUtils';

type DurationUnit = 'minutes' | 'hours' | 'days';

const DURATION_UNITS: { id: DurationUnit; label: string; short: string }[] = [
  { id: 'minutes', label: 'MINUTES', short: 'MIN' },
  { id: 'hours', label: 'HOURS', short: 'HRS' },
  { id: 'days', label: 'DAYS', short: 'DAYS' },
];

const QUICK_DURATION_PRESETS = [
  { label: '30M', val: '30', unit: 'minutes' as DurationUnit },
  { label: '1H', val: '1', unit: 'hours' as DurationUnit },
  { label: '2H', val: '2', unit: 'hours' as DurationUnit },
  { label: '4H', val: '4', unit: 'hours' as DurationUnit },
  { label: '1D', val: '1', unit: 'days' as DurationUnit },
];

const TIME_PRESETS = ['09:00', '12:00', '15:00', '18:00', '21:00'];

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

  const { colors } = useTheme();

  const createTask = useTaskStore((state) => state.createTask);
  const tasks = useTaskStore((state) => state.tasks);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState('');
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [selectedColor, setSelectedColor] = useState('#00c853');
  const [customHex, setCustomHex] = useState('#00c853');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute preset dates for quick selection
  const computedPresets = React.useMemo(() => {
    if (!targetDate) return [];
    const base = new Date(targetDate + 'T00:00:00');

    const tomorrow = new Date(base);
    tomorrow.setDate(base.getDate() + 1);

    const monday = getMondayOfWeek(base);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return [
      { id: 'same', label: 'SAME DAY', date: targetDate },
      { id: 'tomorrow', label: 'TOMORROW', date: formatDateISO(tomorrow) },
      { id: 'sunday', label: 'END OF WK', date: formatDateISO(sunday) },
    ];
  }, [targetDate]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setNotes('');
      setDueDate('');
      setDueTime('');
      setDurationValue('1');
      setDurationUnit('hours');
      setSelectedColor('#00c853');
      setCustomHex('#00c853');
    }
  }, [isOpen]);

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

  const handleSave = async () => {
    if (!title.trim() || !targetDate) return;
    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        date: targetDate,
        dueDate: dueDate.trim() || undefined,
        dueTime: dueTime.trim() || undefined,
        estimatedDurationMinutes: estimatedDurationMinutes || 60,
        colorTag: selectedColor,
        parentTaskId: parentTaskId || undefined,
      });

      closeQuickAdd();
    } catch (err) {
      console.error(err);
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
              STATUS: DRAFT // NEW NODE
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

          <ScrollView style={styles.techFrameContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.titleSection}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                WORKFLOW SPECIFICATION
              </Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                CREATE TASK
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
                  CONTINUATION OF: <Text style={{ fontWeight: '900' }}>{parentTask.title.toUpperCase()}</Text>
                </Text>
              </View>
            ) : null}

            {/* Form Title */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TASK TITLE:</Text>
              <TextInput
                style={[
                  styles.geometricInput,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="E.G. DEVELOP AUTH MODULE ARCHITECTURE"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Form Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION (OPTIONAL):</Text>
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
                placeholder="ADD BRIEF OVERVIEW..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Dedicated Notes / Scratchpad Input */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithIcon}>
                <FileText size={13} color={colors.accent} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  INTERNAL NOTES & SCRATCHPAD (OPTIONAL):
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
                placeholder="CHECKLISTS, CODE SNIPPETS, KEY REQUIREMENTS..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Delivery Deadline & Due Time Section */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithIcon}>
                <Calendar size={13} color={colors.accent} />
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  DELIVERY DEADLINE & DUE TIME (OPTIONAL):
                </Text>
              </View>

              {/* Date and Time Inputs Side-by-Side */}
              <View style={[styles.deadlineInputsRow, isMobile && styles.deadlineInputsRowMobile]}>
                {/* Date Input Column */}
                <View style={{ flex: 1.2 }}>
                  <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                    DUE DATE (YYYY-MM-DD):
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
                        NONE
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
                      DUE TIME (HH:MM):
                    </Text>
                    {isValidTimeHHMM(dueTime) ? (
                      <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accent, fontWeight: '800' }}>
                        ✓ {formatTime12h(dueTime)}
                      </Text>
                    ) : dueTime ? (
                      <Text style={{ fontSize: 10, fontFamily: THEME.fonts.mono, color: colors.accentWarning, fontWeight: '800' }}>
                        FORMAT: HH:MM
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

            {/* Estimated Duration Section */}
            <View style={styles.formGroup}>
              <View style={styles.durationHeaderRow}>
                <View style={styles.labelWithIcon}>
                  <Clock size={13} color={colors.accent} />
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    ESTIMATED DURATION:
                  </Text>
                </View>
                <Text style={[styles.durationPreviewText, { color: colors.accent }]}>
                  [ {formatEstimatedDuration(estimatedDurationMinutes)} // {estimatedDurationMinutes}M ]
                </Text>
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
                  COLOR CODE TAG & PALETTE:
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
                <Text style={[styles.hexLabel, { color: colors.textSecondary }]}>HEX CODE:</Text>
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
                  CANCEL
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
                  {isSubmitting ? 'CREATING NODE...' : 'CREATE NODE ➔'}
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
