import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { THEME } from './src/constants/theme';
import { AuthScreen } from './src/components/auth/AuthScreen';
import { FloatingDock } from './src/components/board/FloatingDock';
import { QuickAddTaskModal } from './src/components/board/QuickAddTaskModal';
import { WeekHeader } from './src/components/board/WeekHeader';
import { SidebarDrawer } from './src/components/navigation/SidebarDrawer';
import { SettingsView } from './src/components/settings/SettingsView';
import { WeekCanvas } from './src/components/canvas/WeekCanvas';
import { ActiveTimerBar } from './src/components/timer/ActiveTimerBar';
import { useSyncSocket } from './src/hooks/useSyncSocket';
import { useTheme } from './src/hooks/useTheme';
import { useAuthStore } from './src/store/useAuthStore';
import { useTimerStore } from './src/store/useTimerStore';
import { useUIStore } from './src/store/useUIStore';
import { useLanguageStore } from './src/store/useLanguageStore';
import { AnimatedDotBackground } from './src/components/canvas/AnimatedDotBackground';
import { ToastNotification } from './src/components/ui/ToastNotification';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initTheme = useUIStore((state) => state.initTheme);
  const initWorkHours = useUIStore((state) => state.initWorkHours);
  const viewMode = useUIStore((state) => state.viewMode);
  const initLanguage = useLanguageStore((state) => state.initLanguage);

  const focusedTaskId = useTimerStore((state) => state.focusedTaskId);

  const { themeMode, colors } = useTheme();

  // Initialize socket realtime connection
  useSyncSocket();

  useEffect(() => {
    initTheme();
    initWorkHours();
    initLanguage();
    initAuth();
  }, [initTheme, initWorkHours, initLanguage, initAuth]);

  // Inject web CSS directly into document.head to guarantee 100% active animations in browser
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'ayetasks-master-animations';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700;800;900&display=swap');

        /* 1. Canvas Grid Motion */
        @keyframes gridMove {
          0% { background-position: 0px 0px; }
          100% { background-position: 32px 32px; }
        }

        /* 2. 90-Degree Circuit Flow Animation */
        @keyframes circuitTracePulse {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }

        /* 3. Deep Focus Pulse & Aura */
        @keyframes focusHeartbeat {
          0% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.6); }
          50% { box-shadow: 0 0 24px 6px rgba(255, 23, 68, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.6); }
        }

        @keyframes focusAuraWave {
          0% { border-color: #ff1744; box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.7); }
          50% { border-color: #ff5252; box-shadow: 0 0 20px 4px rgba(255, 23, 68, 0.45); }
          100% { border-color: #ff1744; box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.7); }
        }

        /* 4. In-Progress Electric Activation Burst */
        @keyframes inProgressBurst {
          0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(255, 171, 0, 0.9); }
          30% { transform: scale(1.02); box-shadow: 0 0 18px 4px rgba(255, 171, 0, 0.6); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 171, 0, 0); }
        }

        /* 5. Completion Ripple Burst */
        @keyframes completeGreenBurst {
          0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(254, 157, 1, 0.85); }
          40% { transform: scale(1.02); box-shadow: 0 0 22px 6px rgba(254, 157, 1, 0.55); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(254, 157, 1, 0); }
        }

        /* 6. Card Entrance & Exit Motion */
        @keyframes cardFadeSlideIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Base Reset */
        body, html, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: ${colors.bgBase};
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Task Card Transitions */
        .task-card-cyber, [data-role="task-card"] {
          transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      filter 0.28s ease !important;
        }

        /* Card in Focus Aura */
        .task-focused-aura, [data-focused="true"] {
          animation: focusAuraWave 2s ease-in-out infinite !important;
          transform: translateY(-2px) scale(1.02) !important;
          z-index: 20 !important;
        }

        /* Other Cards Dimmed when Focus is Active */
        .task-nonfocus-dim, [data-dimmed="true"] {
          opacity: 0.35 !important;
          filter: grayscale(0.7) !important;
          transform: scale(0.97) !important;
        }
        .task-nonfocus-dim:hover, [data-dimmed="true"]:hover {
          opacity: 0.95 !important;
          filter: grayscale(0) !important;
        }

        /* In-Progress Trigger Animation */
        .task-burst-trigger, [data-burst="true"] {
          animation: inProgressBurst 0.55s cubic-bezier(0.16, 1, 0.3, 1) both !important;
        }

        /* Action Buttons Hover Feedback */
        .cyber-action-btn, [data-role="action-btn"] {
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.12s ease !important;
        }
        .cyber-action-btn:hover, [data-role="action-btn"]:hover {
          transform: scale(1.18) !important;
        }
        .cyber-action-btn:active, [data-role="action-btn"]:active {
          transform: scale(0.90) translateY(1px) !important;
        }

        .circuit-animated-flow {
          stroke-dasharray: 10, 10;
          animation: circuitTracePulse 1s linear infinite !important;
        }

        /* 7. Focus Bottom Bar Ambient Glow */
        @keyframes focusBarBreathing {
          0% { box-shadow: 0 0 15px rgba(255, 23, 68, 0.35); }
          50% { box-shadow: 0 0 35px rgba(255, 23, 68, 0.7); }
          100% { box-shadow: 0 0 15px rgba(255, 23, 68, 0.35); }
        }

        .focus-bar-glow {
          animation: focusBarBreathing 2.5s ease-in-out infinite !important;
        }

        /* 8. Global 1-Second Theme Fade Transition (Dark <-> Light) */
        body, html, #root, div, span, p, h1, h2, h3, h4, h5, h6, input, textarea, button, a, svg, svg * {
          transition: background-color 1000ms cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 1000ms cubic-bezier(0.4, 0, 0.2, 1),
                      color 1000ms cubic-bezier(0.4, 0, 0.2, 1),
                      fill 1000ms cubic-bezier(0.4, 0, 0.2, 1),
                      stroke 1000ms cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 1000ms cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Fast micro-animations overrides for button click and drag */
        .cyber-action-btn:hover, [data-role="action-btn"]:hover {
          transform: scale(1.18) !important;
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .cyber-action-btn:active, [data-role="action-btn"]:active {
          transform: scale(0.90) translateY(1px) !important;
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        /* 7. Status Toast Notification Keyframes (Exact AyeVideo Spec) */
        @keyframes toastSlideUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
    }
  }, [colors.bgBase, colors.accent]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgBase }]}>
      {/* Edge-to-Edge Animated Cyber Dot Matrix (Global Layer for iOS, Android, and Web) */}
      <AnimatedDotBackground />

      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {isInitializing ? (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              [ INITIALIZING AYETASKS SYSTEM... ]
            </Text>
          </View>
        </SafeAreaView>
      ) : !isAuthenticated ? (
        <SafeAreaView style={styles.safeArea}>
          <AuthScreen />
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {viewMode === 'settings' ? (
              <SettingsView />
            ) : (
              <>
                {/* Top Week Navigation Header with Live Telemetry */}
                <WeekHeader />

                {/* Weekly Graph Canvas with Day Columns and SVG Arrows */}
                <WeekCanvas />

                {/* Bottom Floating Command Dock or Active Focus Stopwatch */}
                {focusedTaskId ? (
                  <ActiveTimerBar />
                ) : (
                  <FloatingDock />
                )}
              </>
            )}

            {/* Quick Add Task Modal */}
            <QuickAddTaskModal />

            {/* Left-anchored Cyber Dashboard & Settings Sidebar Drawer */}
            <SidebarDrawer />
          </View>
        </SafeAreaView>
      )}

      {/* Global Toast Feedback System (Atelier Cyber DNA) */}
      <ToastNotification />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    paddingBottom: Platform.OS === 'android' ? 16 : 0,
  },
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
});
