import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import {
  Check,
  Zap,
  AlertTriangle,
  AlertOctagon,
  X,
  Trash2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react-native';
import { useUIStore, ToastMessage } from '../../store/useUIStore';
import { useTheme } from '../../hooks/useTheme';
import { THEME } from '../../constants/theme';

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  isMobile: boolean;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, isMobile }) => {
  const { colors, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const isClosingRef = useRef(false);
  const progressAnimInstance = useRef<Animated.CompositeAnimation | null>(null);
  const remainingTimeRef = useRef(toast.durationMs || 4500);
  const startTimeRef = useRef(Date.now());

  const triggerClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (progressAnimInstance.current) {
      progressAnimInstance.current.stop();
    }

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 14,
        duration: 180,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 180,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [onDismiss, toast.id, opacityAnim, slideAnim, scaleAnim]);

  const startProgressAnimation = useCallback((duration: number) => {
    startTimeRef.current = Date.now();
    remainingTimeRef.current = duration;

    progressAnimInstance.current = Animated.timing(progressAnim, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    progressAnimInstance.current.start(({ finished }) => {
      if (finished && !isClosingRef.current) {
        triggerClose();
      }
    });
  }, [progressAnim, triggerClose]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    startProgressAnimation(toast.durationMs || 4500);

    return () => {
      if (progressAnimInstance.current) {
        progressAnimInstance.current.stop();
      }
    };
  }, [toast.id, toast.durationMs, opacityAnim, slideAnim, scaleAnim, startProgressAnimation]);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && !isClosingRef.current) {
      if (progressAnimInstance.current) {
        progressAnimInstance.current.stop();
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(800, remainingTimeRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && !isClosingRef.current) {
      startProgressAnimation(remainingTimeRef.current);
    }
  };

  // Action-dependent color and styling architecture
  const isDelete = toast.type === 'delete';
  const isSync = toast.type === 'sync';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isSuccess = toast.type === 'success';

  let backgroundColor = colors.bgSurface;
  let borderColor = colors.accent || '#FE9D01';
  let titleColor = colors.accent || '#FE9D01';
  let textColor = colors.textPrimary;
  let iconBg = colors.accent || '#FE9D01';
  let iconColor = '#000000';
  let progressColor = colors.accent || '#FE9D01';

  if (isDelete) {
    backgroundColor = toast.customTheme?.backgroundColor || '#08080a';
    borderColor = toast.customTheme?.borderColor || '#27272a';
    titleColor = toast.customTheme?.titleColor || '#ef4444';
    textColor = toast.customTheme?.textColor || '#ffffff';
    iconBg = toast.customTheme?.iconBg || '#18181b';
    iconColor = toast.customTheme?.iconColor || '#ef4444';
    progressColor = toast.customTheme?.progressColor || '#ef4444';
  } else if (isSync) {
    const syncHue = isDark ? '#00e5ff' : '#0284c7';
    borderColor = syncHue;
    titleColor = syncHue;
    iconBg = syncHue;
    iconColor = isDark ? '#000000' : '#ffffff';
    progressColor = syncHue;
  } else if (isError) {
    const errHue = colors.accentAlert || '#ff1744';
    borderColor = errHue;
    titleColor = errHue;
    iconBg = errHue;
    iconColor = '#ffffff';
    progressColor = errHue;
  } else if (isWarning) {
    const warnHue = colors.accentWarning || '#ffab00';
    borderColor = warnHue;
    titleColor = warnHue;
    iconBg = warnHue;
    iconColor = '#000000';
    progressColor = warnHue;
  } else if (isSuccess) {
    // Creation and success actions stay high-contrast Cyber Amber/Orange
    const orangeHue = '#FE9D01';
    borderColor = orangeHue;
    titleColor = orangeHue;
    iconBg = orangeHue;
    iconColor = '#000000';
    progressColor = orangeHue;
  }

  const renderIcon = () => {
    switch (toast.type) {
      case 'delete':
        return <Trash2 size={16} strokeWidth={2.5} color={iconColor} />;
      case 'sync':
        return <RefreshCw size={16} strokeWidth={2.5} color={iconColor} />;
      case 'success':
        return <Check size={16} strokeWidth={3} color={iconColor} />;
      case 'error':
        return <AlertOctagon size={16} strokeWidth={3} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={16} strokeWidth={3} color={iconColor} />;
      case 'info':
      default:
        return <Zap size={16} strokeWidth={3} color={iconColor} />;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      {...(Platform.OS === 'web' ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave } : {})}
      style={[
        styles.toastCard,
        isMobile ? styles.toastCardMobile : styles.toastCardDesktop,
        {
          backgroundColor,
          borderColor,
          shadowColor: colors.shadowColor,
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.toastContent}>
        {/* 32x32 Vector Icon Box from AyeVideo */}
        <View style={[styles.toastIconBox, { backgroundColor: iconBg, borderColor: isDelete ? '#3f3f46' : colors.borderMuted }]}>
          {renderIcon()}
        </View>

        {/* 2-Line Body from AyeVideo */}
        <View style={styles.toastBody}>
          <Text style={[styles.toastTitle, { color: titleColor }]}>
            {toast.title}
          </Text>
          <Text style={[styles.toastText, { color: textColor }]} numberOfLines={3}>
            {toast.text}
          </Text>
        </View>
      </View>

      <View style={styles.rightActionsRow}>
        {/* Action Button (e.g. REVERTIR for Delete) */}
        {toast.action && (
          <TouchableOpacity
            onPress={() => {
              toast.action?.onPress();
              triggerClose();
            }}
            style={styles.actionBtn}
            activeOpacity={0.8}
            accessibilityLabel={toast.action.label}
          >
            <RotateCcw size={11} strokeWidth={3} color="#000000" />
            <Text style={styles.actionBtnText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}

        {/* Close Action Button */}
        <TouchableOpacity
          onPress={triggerClose}
          style={styles.closeBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Cerrar notificación"
        >
          <X size={14} strokeWidth={2.5} color={isDelete ? '#a1a1aa' : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Realtime Countdown Progress Line */}
      <Animated.View
        style={[
          styles.toastProgressLine,
          {
            backgroundColor: progressColor,
            width: progressWidth,
          },
        ]}
      />
    </Animated.View>
  );
};

export const ToastNotification: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const hideToast = useUIStore((state) => state.hideToast);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (!toasts || toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.stackContainer,
        isMobile ? styles.stackContainerMobile : styles.stackContainerDesktop,
      ]}
    >
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          onDismiss={hideToast}
          isMobile={isMobile}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    flexDirection: 'column',
    gap: 10,
  },
  stackContainerDesktop: {
    bottom: 84,
    right: 28,
    alignItems: 'flex-end',
    maxWidth: 480,
  },
  stackContainerMobile: {
    bottom: 96,
    left: 16,
    right: 16,
    alignItems: 'stretch',
  },
  toastCard: {
    borderWidth: THEME.borders.thick,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    overflow: 'hidden',
  },
  toastCardDesktop: {
    maxWidth: 480,
    minWidth: 320,
    width: '100%',
  },
  toastCardMobile: {
    width: '100%',
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastIconBox: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toastBody: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  toastTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  toastText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowColor: '#000000',
  },
  actionBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastProgressLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
});
