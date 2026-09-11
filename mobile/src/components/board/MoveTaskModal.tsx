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
  Calendar,
  Hand,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation, useLanguageStore } from '../../store/useLanguageStore';
import { Task } from '../../types';
import {
  getWeekDays,
  getMondayOfWeek,
  formatDateISO,
} from '../../utils/dateUtils';

interface MoveTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MoveTaskModal: React.FC<MoveTaskModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);

  const currentReferenceDate = useUIStore((state) => state.currentReferenceDate);
  const updateTask = useTaskStore((state) => state.updateTask);
  const showToast = useUIStore((state) => state.showToast);

  const [customDate, setCustomDate] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const weekDays = React.useMemo(
    () => getWeekDays(currentReferenceDate, language),
    [currentReferenceDate, language]
  );

  useEffect(() => {
    if (task) {
      setCustomDate(task.date || formatDateISO(new Date()));
    }
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

  const handleMoveToDate = async (targetDate: string, dayLabel?: string) => {
    if (!targetDate || targetDate === task.date) {
      onClose();
      return;
    }
    setIsMoving(true);
    try {
      await updateTask(task.id, { date: targetDate });
      const label = dayLabel ? `${dayLabel} (${targetDate})` : targetDate;
      showToast(
        `${(t as any).moveModal?.movedSuccess || 'Tarea reasignada al'} ${label}`,
        'success',
        '// DÍA REASIGNADO'
      );
      onClose();
    } catch (e) {
      console.error('Error moving task day:', e);
    } finally {
      setIsMoving(false);
    }
  };

  const handleCustomDateSubmit = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(customDate.trim())) {
      handleMoveToDate(customDate.trim());
    }
  };

  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  }, []);

  const nextWeekMondayStr = React.useMemo(() => {
    const mon = getMondayOfWeek(new Date());
    mon.setDate(mon.getDate() + 7);
    return formatDateISO(mon);
  }, []);

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.modalContainerMobile,
          ]}
        >
          {/* Top Amber Accent Stripe */}
          <View style={[styles.topColorStripe, { backgroundColor: colors.accent }]} />

          {/* Tech Badge */}
          <View
            style={[
              styles.techBadge,
              {
                backgroundColor: colors.bgBase,
                borderColor: colors.accent,
              },
            ]}
          >
            <Hand size={11} color={colors.accent} strokeWidth={2.5} />
            <Text style={[styles.techBadgeText, { color: colors.accent }]}>
              {(t as any).moveModal?.badge || 'REASIGNACIÓN DE TABLERO // DÍA DEL NODO'}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Header / Title */}
            <View style={styles.headerSection}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {(t as any).moveModal?.title || 'MOVER TAREA DE DÍA'}
              </Text>
              <Text style={[styles.taskTitleSnippet, { color: colors.accent }]} numberOfLines={1}>
                "{task.title.toUpperCase()}"
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {(t as any).moveModal?.subtitle || 'Selecciona el día del tablero donde deseas colocar esta tarea:'}
              </Text>
            </View>

            {/* 7-Days Active Week Grid */}
            <View style={styles.daysListSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {(t as any).moveModal?.weekDaysLabel || 'DÍAS DE LA SEMANA ACTIVA:'}
              </Text>

              <View style={styles.daysGrid}>
                {weekDays.map((d) => {
                  const isCurrent = d.dateString === task.date;
                  return (
                    <TouchableOpacity
                      key={d.dateString}
                      style={[
                        styles.dayCardBtn,
                        {
                          borderColor: isCurrent
                            ? colors.accent
                            : d.isToday
                            ? colors.accentWarning
                            : colors.borderMuted,
                          backgroundColor: isCurrent
                            ? colors.accentSubtle
                            : d.isToday
                            ? isDark
                              ? 'rgba(255, 171, 0, 0.08)'
                              : 'rgba(255, 171, 0, 0.12)'
                            : colors.bgSurface,
                        },
                      ]}
                      onPress={() => handleMoveToDate(d.dateString, d.name)}
                      disabled={isMoving}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dayCardHeader}>
                        <Text
                          style={[
                            styles.dayCardName,
                            {
                              color: isCurrent
                                ? colors.accent
                                : d.isToday
                                ? colors.accentWarning
                                : colors.textPrimary,
                            },
                          ]}
                        >
                          {d.name.toUpperCase()}
                        </Text>
                        {isCurrent ? (
                          <View style={[styles.currentPill, { backgroundColor: colors.accent }]}>
                            <Check size={10} color={colors.textInvert} strokeWidth={3} />
                            <Text style={[styles.currentPillText, { color: colors.textInvert }]}>
                              {(t as any).moveModal?.currentDay || 'ACTUAL'}
                            </Text>
                          </View>
                        ) : d.isToday ? (
                          <View style={[styles.todayPill, { borderColor: colors.accentWarning }]}>
                            <Text style={[styles.todayPillText, { color: colors.accentWarning }]}>
                              {t.common.today}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.dayCardDateRow}>
                        <Text
                          style={[
                            styles.dayCardDateNum,
                            {
                              color: isCurrent ? colors.accent : colors.textPrimary,
                            },
                          ]}
                        >
                          {d.dayNumber} {d.monthName.slice(0, 3).toUpperCase()}
                        </Text>
                        <Text style={[styles.dayCardIso, { color: colors.textMuted }]}>
                          {d.dateString}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Date Selector */}
            <View style={[styles.customDateSection, { borderColor: colors.borderMuted, backgroundColor: colors.bgSurface }]}>
              <View style={styles.labelWithIcon}>
                <Calendar size={13} color={colors.accent} />
                <Text style={[styles.customDateLabel, { color: colors.textPrimary }]}>
                  {(t as any).moveModal?.customDate || 'OTRA FECHA O SEMANA (AAAA-MM-DD):'}
                </Text>
              </View>

              <View style={styles.customDateInputRow}>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.bgBase,
                      borderColor: /^\d{4}-\d{2}-\d{2}$/.test(customDate) ? colors.accent : colors.borderColor,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={customDate}
                  onChangeText={setCustomDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  maxLength={10}
                />

                {Platform.OS === 'web' ? (
                  <View style={styles.nativeDatePickerWrap}>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      style={{
                        height: 38,
                        padding: '0 8px',
                        background: colors.bgBase,
                        border: `2px solid ${colors.borderColor}`,
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    />
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.moveCustomBtn,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.borderColor,
                    },
                    (!customDate || customDate === task.date || isMoving) && { opacity: 0.5 },
                  ]}
                  onPress={handleCustomDateSubmit}
                  disabled={!customDate || customDate === task.date || isMoving}
                  activeOpacity={0.8}
                >
                  <ArrowRight size={14} color={colors.textInvert} strokeWidth={2.5} />
                  <Text style={[styles.moveCustomBtnText, { color: colors.textInvert }]}>
                    {(t as any).moveModal?.selectDay || 'MOVER'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      borderColor: colors.borderMuted,
                      backgroundColor: colors.bgBase,
                    },
                  ]}
                  onPress={() => setCustomDate(formatDateISO(new Date()))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, { color: colors.textSecondary }]}>
                    {t.common.today}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      borderColor: colors.borderMuted,
                      backgroundColor: colors.bgBase,
                    },
                  ]}
                  onPress={() => setCustomDate(tomorrowStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, { color: colors.textSecondary }]}>
                    {t.quickAdd?.tomorrow || 'MAÑANA'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      borderColor: colors.borderMuted,
                      backgroundColor: colors.bgBase,
                    },
                  ]}
                  onPress={() => setCustomDate(nextWeekMondayStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, { color: colors.textSecondary }]}>
                    {t.header?.weekAhead || '+1 SEMANA'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    zIndex: 1200,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    borderWidth: THEME.borders.thick,
    position: 'relative',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    overflow: 'hidden',
  },
  modalContainerMobile: {
    maxWidth: '100%',
    maxHeight: '94%',
  },
  topColorStripe: {
    height: 4,
    width: '100%',
  },
  techBadge: {
    position: 'absolute',
    top: 10,
    left: 14,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  techBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 28,
    height: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalContent: {
    padding: 16,
    paddingTop: 36,
  },
  headerSection: {
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  taskTitleSnippet: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  daysListSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    fontFamily: THEME.fonts.mono,
    marginBottom: 8,
  },
  daysGrid: {
    gap: 6,
  },
  dayCardBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'column',
    gap: 2,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCardName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  dayCardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCardDateNum: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  dayCardIso: {
    fontSize: 10,
    fontFamily: THEME.fonts.mono,
  },
  currentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  todayPill: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  todayPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  customDateSection: {
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  customDateLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: THEME.fonts.mono,
  },
  customDateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  nativeDatePickerWrap: {
    height: 38,
    justifyContent: 'center',
  },
  moveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  moveCustomBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    fontFamily: THEME.fonts.mono,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  presetChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
});
