import React from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  X,
  Calendar,
  Sliders,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  Languages,
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../store/useLanguageStore';
import { AyeLogo } from '../ui/AyeLogo';

export const SidebarDrawer: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { language, t, setLanguage } = useTranslation();

  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const closeSidebar = useUIStore((state) => state.closeSidebar);

  const viewMode = useUIStore((state) => state.viewMode);
  const setViewMode = useUIStore((state) => state.setViewMode);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { colors } = useTheme();

  // Escape key listener for web
  React.useEffect(() => {
    if (Platform.OS === 'web' && isSidebarOpen && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeSidebar();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSidebarOpen, closeSidebar]);

  if (!isSidebarOpen) return null;

  const handleNavigate = (mode: 'week' | 'settings') => {
    setViewMode(mode);
    closeSidebar();
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  return (
    <Modal
      visible={isSidebarOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSidebar}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop Overlay */}
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: colors.bgInvert + '44' }]}
          activeOpacity={1}
          onPress={closeSidebar}
        />

        {/* Sidebar Drawer Surface */}
        <View
          style={[
            styles.drawerSurface,
            {
              backgroundColor: colors.bgBase,
              borderColor: colors.borderColor,
              shadowColor: colors.shadowColor,
              width: isMobile ? '82%' : 320,
            },
          ]}
        >
          <SafeAreaView style={styles.safeDrawerInner}>
            {/* Top Neon Accent Stripe */}
            <View style={[styles.drawerTopStripe, { backgroundColor: colors.accent }]} />

          {/* ─────────────────────────────────────────────────────────────
              HEADER: BRAND ANCHOR & CLOSE BUTTON
             ───────────────────────────────────────────────────────────── */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.borderMuted }]}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.borderColor,
                    shadowColor: colors.shadowColor,
                  },
                ]}
              >
                <AyeLogo width={34} color={colors.textInvert} />
              </View>

              <View style={styles.brandTextGroup}>
                <Text style={[styles.brandTitleText, { color: colors.textPrimary }]}>
                  AyeTasks
                </Text>
                <View
                  style={[
                    styles.cyberTag,
                    {
                      borderColor: colors.accent,
                      backgroundColor: colors.accentSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.cyberTagText, { color: colors.accent }]}>
                    CYBER V1.0
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgSurface,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={closeSidebar}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* ─────────────────────────────────────────────────────────────
              NAVIGATION ITEMS
             ───────────────────────────────────────────────────────────── */}
          <View style={styles.drawerBody}>
            <Text style={[styles.navSectionLabel, { color: colors.textMuted }]}>
              {t.sidebar.menu}
            </Text>

            {/* Board / Canvas Link */}
            <TouchableOpacity
              style={[
                styles.navItemBtn,
                {
                  borderColor: viewMode === 'week' ? colors.accent : colors.borderColor,
                  backgroundColor: viewMode === 'week' ? colors.accentSubtle : colors.bgSurface,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={() => handleNavigate('week')}
              activeOpacity={0.7}
            >
              <View style={styles.navItemLeft}>
                <Calendar
                  size={18}
                  color={viewMode === 'week' ? colors.accent : colors.textPrimary}
                  strokeWidth={2.5}
                />
                <View>
                  <Text
                    style={[
                      styles.navItemTitle,
                      {
                        color: viewMode === 'week' ? colors.accent : colors.textPrimary,
                        fontWeight: viewMode === 'week' ? '900' : '800',
                      },
                    ]}
                  >
                    {t.sidebar.board}
                  </Text>
                  <Text style={[styles.navItemSub, { color: colors.textMuted }]}>
                    {t.sidebar.boardDesc}
                  </Text>
                </View>
              </View>
              <ChevronRight
                size={16}
                color={viewMode === 'week' ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Settings View Link */}
            <TouchableOpacity
              style={[
                styles.navItemBtn,
                {
                  borderColor: viewMode === 'settings' ? colors.accent : colors.borderColor,
                  backgroundColor: viewMode === 'settings' ? colors.accentSubtle : colors.bgSurface,
                  shadowColor: colors.shadowColor,
                  marginTop: 10,
                },
              ]}
              onPress={() => handleNavigate('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.navItemLeft}>
                <Sliders
                  size={18}
                  color={viewMode === 'settings' ? colors.accent : colors.textPrimary}
                  strokeWidth={2.5}
                />
                <View>
                  <Text
                    style={[
                      styles.navItemTitle,
                      {
                        color: viewMode === 'settings' ? colors.accent : colors.textPrimary,
                        fontWeight: viewMode === 'settings' ? '900' : '800',
                      },
                    ]}
                  >
                    {t.sidebar.settings}
                  </Text>
                  <Text style={[styles.navItemSub, { color: colors.textMuted }]}>
                    {t.sidebar.settingsDesc}
                  </Text>
                </View>
              </View>
              <ChevronRight
                size={16}
                color={viewMode === 'settings' ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* ─────────────────────────────────────────────────────────────
              OPERATOR FOOTER & LOGOUT (HASTA ABAJO)
             ───────────────────────────────────────────────────────────── */}
          <View style={[styles.drawerFooter, { borderTopColor: colors.borderMuted }]}>
            {user ? (
              <View style={styles.operatorSnippet}>
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
                <View style={styles.operatorInfo}>
                  <Text
                    style={[styles.operatorName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {user.name ? user.name.toUpperCase() : t.sidebar.operator}
                  </Text>
                  <Text
                    style={[styles.operatorEmail, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Quick Language Switcher Row in Drawer */}
            <View style={styles.langRow}>
              <View style={styles.langRowLeft}>
                <Languages size={14} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.langRowLabel, { color: colors.textSecondary }]}>
                  {t.sidebar.languageLabel}
                </Text>
              </View>
              <View style={styles.langToggleGroup}>
                <TouchableOpacity
                  style={[
                    styles.langPill,
                    {
                      borderColor: language === 'es' ? colors.accent : colors.borderMuted,
                      backgroundColor: language === 'es' ? colors.accent : colors.bgSurface,
                    },
                  ]}
                  onPress={() => setLanguage('es')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      { color: language === 'es' ? colors.textInvert : colors.textSecondary },
                    ]}
                  >
                    ES
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langPill,
                    {
                      borderColor: language === 'en' ? colors.accent : colors.borderMuted,
                      backgroundColor: language === 'en' ? colors.accent : colors.bgSurface,
                    },
                  ]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      { color: language === 'en' ? colors.textInvert : colors.textSecondary },
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  borderColor: colors.accentDanger,
                  backgroundColor: colors.accentDangerSubtle,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={16} color={colors.accentDanger} strokeWidth={2.5} />
              <Text style={[styles.logoutBtnText, { color: colors.accentDanger }]}>
                {t.sidebar.logout}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  safeDrawerInner: {
    flex: 1,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    paddingBottom: Platform.OS === 'android' ? 16 : 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9990,
  },
  drawerSurface: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: THEME.borders.thick,
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  drawerTopStripe: {
    height: 4,
    width: '100%',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: THEME.borders.thick,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  logoBadgeText: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  brandTextGroup: {
    flexDirection: 'column',
    gap: 2,
  },
  brandTitleText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cyberTag: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cyberTagText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: THEME.fonts.mono,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  drawerBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
    marginBottom: 12,
  },
  navItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navItemTitle: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: THEME.fonts.mono,
  },
  navItemSub: {
    fontSize: 9,
    fontFamily: THEME.fonts.mono,
    marginTop: 2,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  operatorSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBadge: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  operatorEmail: {
    fontSize: 10,
    fontFamily: THEME.fonts.mono,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: THEME.borders.thick,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  langRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langRowLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  langToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPill: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
  },
});
