import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GitCommit, X, ArrowRight } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';

export const ConnectingBanner: React.FC = () => {
  const isConnectingMode = useUIStore((state) => state.isConnectingMode);
  const connectingSourceTaskId = useUIStore((state) => state.connectingSourceTaskId);
  const cancelConnecting = useUIStore((state) => state.cancelConnecting);
  const tasks = useTaskStore((state) => state.tasks);

  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!isConnectingMode || !connectingSourceTaskId) return null;

  const sourceTask = tasks.find((t) => t.id === connectingSourceTaskId);

  return (
    <View style={styles.floatingContainer}>
      <View
        style={[
          styles.bannerFrame,
          {
            backgroundColor: colors.bgBase,
            borderColor: colors.accent,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        <View style={styles.leftGroup}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.accentSubtle,
                borderColor: colors.accent,
              },
            ]}
          >
            <GitCommit size={14} color={colors.accent} />
          </View>

          <View style={styles.textGroup}>
            <Text style={[styles.statusLabel, { color: colors.accent }]}>
              {t.connectingBanner.linkingFrom}
            </Text>
            <Text
              style={[styles.taskTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {(sourceTask?.title || 'TASK').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.centerPrompt}>
          <ArrowRight size={14} color={colors.accent} strokeWidth={2.5} />
          <Text style={[styles.promptText, { color: colors.textPrimary }]}>
            {t.connectingBanner.prompt}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cancelBtn,
            {
              borderColor: colors.borderColor,
              backgroundColor: colors.bgSurface,
            },
          ]}
          onPress={cancelConnecting}
          activeOpacity={0.7}
        >
          <X size={12} color={colors.textPrimary} strokeWidth={2.5} />
          <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
            {t.connectingBanner.cancel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    zIndex: 900,
    alignItems: 'center',
  },
  bannerFrame: {
    width: '100%',
    maxWidth: 820,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    maxWidth: 280,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
