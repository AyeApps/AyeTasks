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
  Clock,
  Briefcase,
  Check,
  Zap,
  Sliders,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/useUIStore';
import { formatTimeInput, isValidTimeHHMM, formatTime12h } from '../../utils/dateUtils';

interface WorkHoursSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const START_PRESETS = ['07:00', '08:00', '08:30', '09:00', '10:00'];
const END_PRESETS = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const SHIFT_TEMPLATES = [
  { label: '08:00 - 17:00', start: '08:00', end: '17:00', desc: '9H ESTÁNDAR' },
  { label: '09:00 - 18:00', start: '09:00', end: '18:00', desc: '9H OFICINA' },
  { label: '10:00 - 19:00', start: '10:00', end: '19:00', desc: '9H TARDE' },
  { label: '08:00 - 14:00', start: '08:00', end: '14:00', desc: '6H MEDIA JORNADA' },
  { label: '09:00 - 17:00', start: '09:00', end: '17:00', desc: '8H CONTINUA' },
];

export const WorkHoursSettingsModal: React.FC<WorkHoursSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { colors } = useTheme();

  const workStartTime = useUIStore((state) => state.workStartTime);
  const workEndTime = useUIStore((state) => state.workEndTime);
  const setWorkHours = useUIStore((state) => state.setWorkHours);

  const [startTime, setStartTime] = useState(workStartTime || '09:00');
  const [endTime, setEndTime] = useState(workEndTime || '18:00');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStartTime(workStartTime || '09:00');
      setEndTime(workEndTime || '18:00');
      setErrorMsg('');
    }
  }, [isOpen, workStartTime, workEndTime]);

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

  if (!isOpen) return null;

  // Calculate shift duration in hours & minutes
  const calculateShiftDuration = () => {
    if (!isValidTimeHHMM(startTime) || !isValidTimeHHMM(endTime)) {
      return null;
    }
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;

    const diffMins = endTotalMins - startTotalMins;
    if (diffMins <= 0) {
      return null;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return {
      hours,
      mins,
      totalMins: diffMins,
    };
  };

  const shiftDuration = calculateShiftDuration();

  const handleSave = () => {
    if (!isValidTimeHHMM(startTime)) {
      setErrorMsg('La hora de entrada debe tener un formato válido (HH:MM).');
      return;
    }
    if (!isValidTimeHHMM(endTime)) {
      setErrorMsg('La hora de salida debe tener un formato válido (HH:MM).');
      return;
    }
    if (!shiftDuration) {
      setErrorMsg('La hora de salida debe ser posterior a la hora de entrada.');
      return;
    }

    setWorkHours(startTime, endTime);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalFrame,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.modalFrameMobile,
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

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadgeRow}>
              <View
                style={[
                  styles.cyberBadge,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Briefcase size={12} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.cyberBadgeText, { color: colors.accent }]}>
                  WORK SHIFT & SCHEDULE ENGINE
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              HORARIO DE JORNADA LABORAL
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Configura tu hora de entrada y salida para calcular la cuenta regresiva en vivo del día.
            </Text>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
            {/* Quick Shift Templates */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PLANTILLAS PREDEFINIDAS:
              </Text>
              <View style={styles.templateGrid}>
                {SHIFT_TEMPLATES.map((tmpl) => {
                  const isSelected = startTime === tmpl.start && endTime === tmpl.end;
                  return (
                    <TouchableOpacity
                      key={tmpl.label}
                      style={[
                        styles.templateCard,
                        {
                          backgroundColor: isSelected ? colors.accentSubtle : colors.bgSurface,
                          borderColor: isSelected ? colors.accent : colors.borderMuted,
                        },
                      ]}
                      onPress={() => {
                        setStartTime(tmpl.start);
                        setEndTime(tmpl.end);
                        setErrorMsg('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.templateLabel,
                          { color: isSelected ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {tmpl.label}
                      </Text>
                      <Text
                        style={[
                          styles.templateDesc,
                          { color: isSelected ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        {tmpl.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Input Fields Row */}
            <View style={[styles.inputRow, isMobile && styles.inputRowMobile]}>
              {/* Start Time Input */}
              <View style={{ flex: 1 }}>
                <View style={styles.inputHeader}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    HORA DE ENTRADA (HH:MM):
                  </Text>
                  {isValidTimeHHMM(startTime) ? (
                    <Text style={[styles.timePreview, { color: colors.accent }]}>
                      ✓ {formatTime12h(startTime)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputWithPickerRow}>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: isValidTimeHHMM(startTime)
                          ? colors.accent
                          : colors.borderColor,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={startTime}
                    onChangeText={(t) => {
                      setStartTime(formatTimeInput(t));
                      setErrorMsg('');
                    }}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                  />

                  {Platform.OS === 'web' ? (
                    <View style={styles.nativePickerWrap}>
                      <input
                        type="time"
                        value={isValidTimeHHMM(startTime) ? startTime : ''}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setErrorMsg('');
                        }}
                        style={{
                          height: 42,
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

                {/* Preset Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {START_PRESETS.map((p) => {
                      const isSelected = startTime === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isSelected ? colors.accent : colors.bgSurface,
                              borderColor: isSelected ? colors.accent : colors.borderMuted,
                            },
                          ]}
                          onPress={() => {
                            setStartTime(p);
                            setErrorMsg('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.presetText,
                              { color: isSelected ? colors.textInvert : colors.textSecondary },
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* End Time Input */}
              <View style={{ flex: 1, marginLeft: isMobile ? 0 : 16, marginTop: isMobile ? 12 : 0 }}>
                <View style={styles.inputHeader}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    HORA DE SALIDA (HH:MM):
                  </Text>
                  {isValidTimeHHMM(endTime) ? (
                    <Text style={[styles.timePreview, { color: colors.accentWarning }]}>
                      ✓ {formatTime12h(endTime)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputWithPickerRow}>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: isValidTimeHHMM(endTime)
                          ? colors.accentWarning
                          : colors.borderColor,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={endTime}
                    onChangeText={(t) => {
                      setEndTime(formatTimeInput(t));
                      setErrorMsg('');
                    }}
                    placeholder="18:00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                  />

                  {Platform.OS === 'web' ? (
                    <View style={styles.nativePickerWrap}>
                      <input
                        type="time"
                        value={isValidTimeHHMM(endTime) ? endTime : ''}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setErrorMsg('');
                        }}
                        style={{
                          height: 42,
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

                {/* Preset Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {END_PRESETS.map((p) => {
                      const isSelected = endTime === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isSelected ? colors.accentWarning : colors.bgSurface,
                              borderColor: isSelected ? colors.accentWarning : colors.borderMuted,
                            },
                          ]}
                          onPress={() => {
                            setEndTime(p);
                            setErrorMsg('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.presetText,
                              { color: isSelected ? '#000' : colors.textSecondary },
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Error Message if any */}
            {errorMsg ? (
              <View style={[styles.errorBox, { borderColor: colors.accentDanger, backgroundColor: 'rgba(255, 23, 68, 0.1)' }]}>
                <AlertCircle size={14} color={colors.accentDanger} />
                <Text style={[styles.errorText, { color: colors.accentDanger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Live Calculation Preview Banner */}
            {shiftDuration ? (
              <View
                style={[
                  styles.previewBanner,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderMuted,
                  },
                ]}
              >
                <Clock size={16} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
                    DURACIÓN TOTAL DE LA JORNADA:
                  </Text>
                  <Text style={[styles.previewVal, { color: colors.accent }]}>
                    {shiftDuration.hours} HORAS {shiftDuration.mins > 0 ? `${shiftDuration.mins} MINUTOS` : ''} // {shiftDuration.totalMins} MINUTOS
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.bottomBar, { borderTopColor: colors.borderMuted }]}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.borderMuted,
                  backgroundColor: colors.bgSurface,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.textPrimary }]}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Check size={14} color={colors.textInvert} strokeWidth={3} />
              <Text style={[styles.saveText, { color: colors.textInvert }]}>
                GUARDAR JORNADA
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  modalFrame: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    borderWidth: THEME.borders.thick,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  modalFrameMobile: {
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
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
    lineHeight: 15,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateCard: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 105,
    flex: 1,
    alignItems: 'center',
  },
  templateLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
  },
  templateDesc: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputRowMobile: {
    flexDirection: 'column',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  timePreview: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  inputWithPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    minHeight: 42,
    letterSpacing: 1,
  },
  nativePickerWrap: {
    height: 42,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    padding: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  previewVal: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  cancelBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 42,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
});
