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
  ActivityIndicator,
} from 'react-native';
import { X, FileJson, Check, AlertTriangle, Play } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { api, ApiError } from '../../services/api';
import { getImportTemplate } from '../../utils/importTemplate';
import { downloadImportTemplate } from '../../utils/downloadTemplate';
import { ImportErrorDetail, ImportDryRunResponse } from '../../types';

export const ImportTasksModal: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isOpen = useUIStore((state) => state.isImportModalOpen);
  const closeImportModal = useUIStore((state) => state.closeImportModal);
  const showToast = useUIStore((state) => state.showToast);
  const setReferenceDate = useUIStore((state) => state.setReferenceDate);
  const setViewMode = useUIStore((state) => state.setViewMode);

  const loadTasksAndConnections = useTaskStore((state) => state.loadTasksAndConnections);

  const { colors } = useTheme();
  const { t, language } = useTranslation();

  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [jsonText, setJsonText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [previewSummary, setPreviewSummary] = useState<ImportDryRunResponse['summary'] | null>(null);
  
  // Validation errors
  const [localError, setLocalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImportErrorDetail[]>([]);

  const textInputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (isOpen && step === 'edit') {
      setTimeout(() => textInputRef.current?.focus(), 150);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (Platform.OS === 'web' && isOpen && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isValidating && !isImporting) {
          closeImportModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isValidating, isImporting, closeImportModal]);

  const handleClose = () => {
    if (isValidating || isImporting) return;
    setStep('edit');
    setLocalError(null);
    setValidationErrors([]);
    closeImportModal();
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (localError || validationErrors.length > 0) {
      setLocalError(null);
      setValidationErrors([]);
    }
  };

    const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const content = getImportTemplate(language);
      await downloadImportTemplate(content, t.importTasks.templateFileName, t.importTasks.downloadDialogTitle);
      if (Platform.OS === 'web') {
        showToast(
          t.importTasks.downloadSuccess,
          'success',
          t.importTasks.downloadSuccessTitle
        );
      }
    } catch (error) {
      showToast(t.importTasks.downloadError, 'error');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleInsertTemplate = () => {
    setJsonText(getImportTemplate(language));
    setLocalError(null);
    setValidationErrors([]);
  };

  const handleClear = () => {
    setJsonText('');
    setLocalError(null);
    setValidationErrors([]);
  };

  const handleValidate = async () => {
    if (!jsonText.trim()) {
      setLocalError(t.importTasks.errorEmpty);
      return;
    }

    let payload;
    try {
      payload = JSON.parse(jsonText);
    } catch (e: any) {
      setLocalError(`${t.importTasks.errorInvalidJson}: ${e.message}`);
      return;
    }

    setIsValidating(true);
    setLocalError(null);
    setValidationErrors([]);

    try {
      const response = await api.importTasks(payload, true) as ImportDryRunResponse;
      setPreviewSummary(response.summary);
      setStep('preview');
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 422 && error.detail?.code === 'IMPORT_INVALID') {
        setValidationErrors(error.detail.errors || []);
      } else {
        setLocalError(error.message);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!jsonText.trim()) return;

    let payload;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      return;
    }

    setIsImporting(true);
    try {
      const response = await api.importTasks(payload, false);
      
      await loadTasksAndConnections();
      
      if (previewSummary?.date_from) {
        const [year, month, day] = previewSummary.date_from.split('-').map(Number);
        const refDate = new Date(year, month - 1, day);
        if (!isNaN(refDate.getTime())) {
          setReferenceDate(refDate);
        }
      }
      setViewMode('week');
      
      showToast(
        t.importTasks.successToast?.replace('{count}', String(response.tasks?.length || 0)),
        'success',
        t.importTasks.toastTitle
      );
      
      setJsonText('');
      setStep('edit');
      closeImportModal();
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 422 && error.detail?.code === 'IMPORT_INVALID') {
        setValidationErrors(error.detail.errors || []);
        setStep('edit');
      } else {
        showToast(error.message, 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View
          style={[
            styles.techFrame,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.borderColor,
              shadowColor: colors.shadowColor,
            },
            isMobile && styles.techFrameMobile,
          ]}
        >
          {/* Top Color Stripe */}
          <View style={[styles.topColorStripe, { backgroundColor: colors.accent }]} />

          {/* Tech Badge */}
          <View
            style={[
              styles.techBadge,
              {
                backgroundColor: colors.bgBase,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.techBadgeText, { color: colors.accent }]}>
              {t.importTasks.badge}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={handleClose}
            disabled={isValidating || isImporting}
            style={[
              styles.closeBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgBase,
                opacity: (isValidating || isImporting) ? 0.5 : 1,
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
                {step === 'edit' ? (t.importTasks.stepEditTitle) : (t.importTasks.stepPreviewTitle)}
              </Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                {t.importTasks.modalTitle}
              </Text>
            </View>

            {step === 'edit' && (
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {t.importTasks.jsonPayload}
                  </Text>
                </View>
                
                <TextInput
                  ref={textInputRef}
                  style={[
                    styles.geometricInput,
                    styles.textArea,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: (localError || validationErrors.length > 0) ? colors.accentAlert : colors.borderColor,
                      borderWidth: (localError || validationErrors.length > 0) ? THEME.borders.thick : THEME.borders.thin,
                      color: colors.textPrimary,
                      fontFamily: THEME.fonts.mono,
                      fontSize: THEME.text.body,
                    },
                  ]}
                  placeholder={t.importTasks.placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={jsonText}
                  onChangeText={handleTextChange}
                  multiline
                  autoCorrect={false}
                  autoCapitalize="none"
                  spellCheck={false}
                  textAlignVertical="top"
                />

                <Text style={[styles.noteText, { color: colors.textMuted, marginTop: THEME.spacing.sm }]}>
                  {t.importTasks.limitsNote}
                </Text>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={handleInsertTemplate}
                    disabled={isValidating || isDownloadingTemplate}
                    style={[styles.actionBtn, { borderColor: colors.borderMuted }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                      {t.importTasks.btnTemplate}
                    </Text>
                  </TouchableOpacity>

                                    <TouchableOpacity
                    onPress={handleDownloadTemplate}
                    disabled={isValidating || isDownloadingTemplate}
                    style={[styles.actionBtn, { borderColor: colors.borderMuted }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                      {t.importTasks.btnDownloadTemplate}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClear}
                    disabled={isValidating || isDownloadingTemplate}
                    style={[styles.actionBtn, { borderColor: colors.borderMuted }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                      {t.importTasks.btnClear}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Errors */}
                {localError && (
                  <View style={[styles.errorBox, { backgroundColor: colors.accentAlertSubtle, borderColor: colors.accentAlert }]}>
                    <Text style={[styles.errorText, { color: colors.accentAlert }]}>{localError}</Text>
                  </View>
                )}
                {validationErrors.length > 0 && (
                  <View style={[styles.errorBox, { backgroundColor: colors.accentAlertSubtle, borderColor: colors.accentAlert }]}>
                    {validationErrors.slice(0, 20).map((err, i) => (
                      <Text key={i} style={[styles.errorItem, { color: colors.accentAlert }]}>
                        <Text style={{ fontFamily: THEME.fonts.mono, fontWeight: THEME.weight.bold }}>{err.path}: </Text>
                        {err.message}
                      </Text>
                    ))}
                    {validationErrors.length > 20 && (
                      <Text style={[styles.errorItem, { color: colors.accentAlert, marginTop: THEME.spacing.xs, fontWeight: THEME.weight.bold }]}>
                        {t.importTasks.errorMore?.replace('{n}', String(validationErrors.length - 20))}
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: isValidating ? colors.borderMuted : colors.textPrimary,
                      opacity: isValidating ? 0.7 : 1,
                      marginTop: THEME.spacing.xl,
                    },
                  ]}
                  onPress={handleValidate}
                  disabled={isValidating || isDownloadingTemplate}
                  activeOpacity={0.8}
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color={colors.bgBase} />
                  ) : (
                    <>
                      <Check size={16} color={colors.bgBase} />
                      <Text style={[styles.primaryBtnText, { color: colors.bgBase }]}>
                        {t.importTasks.btnValidate}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 'preview' && previewSummary && (
              <View style={styles.formGroup}>
                <View style={[styles.summaryBox, { backgroundColor: colors.bgSurface, borderColor: colors.borderMuted }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {t.importTasks.summaryTasks}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{previewSummary.tasks}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {t.importTasks.summaryEvents}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{previewSummary.events}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {t.importTasks.summaryConnections}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{previewSummary.connections}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: THEME.spacing.md, paddingTop: THEME.spacing.md, borderTopWidth: THEME.borders.thin, borderTopColor: colors.borderMuted }]}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {t.importTasks.summaryRange}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                      {previewSummary.date_from === previewSummary.date_to
                        ? previewSummary.date_from
                        : `${previewSummary.date_from} ${t.importTasks.to} ${previewSummary.date_to}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.actionsRow, { marginTop: THEME.spacing.xl }]}>
                  <TouchableOpacity
                    onPress={() => setStep('edit')}
                    disabled={isImporting}
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: THEME.borders.thin }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.textPrimary }]}>
                      {t.importTasks.btnEdit}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleImport}
                    disabled={isImporting}
                    style={[
                      styles.primaryBtn,
                      {
                        flex: 2,
                        marginLeft: THEME.spacing.xs, // + columnGap de actionsRow = los 12px de antes
                        backgroundColor: isImporting ? colors.borderMuted : colors.accent,
                      },
                    ]}
                  >
                    {isImporting ? (
                      <ActivityIndicator size="small" color={colors.textInvert} />
                    ) : (
                      <>
                        <Play size={16} color={colors.textInvert} />
                        <Text style={[styles.primaryBtnText, { color: colors.textInvert }]}>
                          {t.importTasks.btnImport}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  techFrame: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderWidth: THEME.borders.thick,
    borderBottomWidth: THEME.borders.thick * 2,
    borderRightWidth: THEME.borders.thick * 2,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  techFrameMobile: {
    maxWidth: '100%',
    maxHeight: '85%',
  },
  topColorStripe: {
    height: 6,
    width: '100%',
  },
  techBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    zIndex: 10,
  },
  techBadgeText: {
    fontSize: THEME.text.caption,
    fontWeight: THEME.weight.black,
    letterSpacing: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: THEME.borders.thick,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  techFrameContent: {
    padding: THEME.spacing.xl,
    paddingTop: THEME.spacing.lg,
  },
  titleSection: {
    marginBottom: THEME.spacing.xl,
    paddingRight: 80,
  },
  subtitle: {
    fontSize: THEME.text.label,
    fontWeight: THEME.weight.bold,
    letterSpacing: 2,
    marginBottom: THEME.spacing.xs,
  },
  heroTitle: {
    fontSize: THEME.text.heading,
    fontWeight: THEME.weight.black,
    letterSpacing: -0.5,
  },
  formGroup: {
    marginBottom: THEME.spacing.xl,
  },
  inputLabel: {
    fontSize: THEME.text.label,
    fontWeight: THEME.weight.bold,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
  },
  geometricInput: {
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: THEME.spacing.md,
    fontSize: THEME.text.body,
  },
  textArea: {
    minHeight: 250,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
  noteText: {
    fontSize: THEME.text.small,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: THEME.spacing.sm,
    rowGap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  actionBtn: {
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: THEME.spacing.xs,
  },
  actionBtnText: {
    fontSize: THEME.text.small,
    fontWeight: THEME.weight.bold,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    gap: THEME.spacing.sm,
  },
  primaryBtnText: {
    fontSize: THEME.text.bodyLg,
    fontWeight: THEME.weight.black,
    letterSpacing: 1,
  },
  errorBox: {
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  errorText: {
    fontSize: THEME.text.body,
    fontWeight: THEME.weight.semibold,
  },
  errorItem: {
    fontSize: THEME.text.small,
    marginBottom: THEME.spacing.xs,
  },
  summaryBox: {
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  summaryLabel: {
    fontSize: THEME.text.label,
    fontWeight: THEME.weight.bold,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: THEME.text.bodyLg,
    fontWeight: THEME.weight.black,
  },
});
