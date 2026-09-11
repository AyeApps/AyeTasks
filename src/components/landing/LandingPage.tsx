import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { CheckCircle2, Clock, Zap, Sun, Moon, Languages, ShieldCheck, ArrowUpRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../store/useLanguageStore';
import { AyeLogo } from '../ui/AyeLogo';
import { trackAuthOpened } from '../../services/analytics';

interface LandingPageProps {
  onStartAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAuth }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { colors, isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useTranslation();
  const isEs = language === 'es';

  const t = {
    es: {
      badge: '✦ AYETASKS · GESTOR DE TAREAS Y TIEMPO',
      heroTitle: 'Tu espacio de trabajo y proyectos, enfocado en lo que realmente importa.',
      heroSub: 'Organiza tus pendientes, gestiona proyectos mediante subtareas claras y mantén el control del tiempo dedicado a cada objetivo. Sin distracciones ni configuraciones complejas.',
      ctaBtn: 'COMENZAR AHORA ➔',
      loginBtn: 'INICIAR SESIÓN',
      feature1Title: 'Jerarquía y Subtareas Claras',
      feature1Desc: 'Divide proyectos complejos en pasos accionables para avanzar con certeza sin perder de vista el panorama general.',
      feature2Title: 'Temporizador de Enfoque',
      feature2Desc: 'Cronometra tu tiempo de concentración en cada tarea con un solo toque y monitorea tus horas productivas de la semana.',
      feature3Title: 'Sincronización Inmediata',
      feature3Desc: 'Continúa exactamente donde lo dejaste. Tus tareas y avances se actualizan al instante entre todos tus dispositivos.',
      securityTitle: 'Privacidad y Control Total',
      securityDesc: 'Tus listas de tareas y tiempos de enfoque son estrictamente privados. Cero rastreo publicitario ni venta de datos.',
      footerText: 'AyeTasks es parte de la suite de software AyeApps. Privado, seguro y diseñado para alta productividad.',
    },
    en: {
      badge: '✦ AYETASKS · FOCUSED WORKSPACE & TASKS',
      heroTitle: 'Your focused workspace for tasks and projects that matter.',
      heroSub: 'Organize your to-dos, break down complex projects into clear subtasks, and track time spent on every goal. Pure focus without endless setup.',
      ctaBtn: 'GET STARTED NOW ➔',
      loginBtn: 'SIGN IN',
      feature1Title: 'Clear Hierarchy & Subtasks',
      feature1Desc: 'Break down complex initiatives into actionable steps so you always know what to do next without losing the big picture.',
      feature2Title: 'Focus Timer & Tracking',
      feature2Desc: 'Track dedicated deep work sessions on each task with a single tap and review your productive hours across the week.',
      feature3Title: 'Instant Synchronization',
      feature3Desc: 'Pick up right where you left off. Your tasks, progress, and timers stay in sync in real-time across all your devices.',
      securityTitle: 'Privacy & Complete Ownership',
      securityDesc: 'Your task lists and focus sessions remain strictly confidential. Zero third-party ad networks, zero data selling.',
      footerText: 'AyeTasks is part of the AyeApps software suite. Private, secure, and built for high productivity.',
    },
  }[isEs ? 'es' : 'en'];

  const handleCta = (source: string) => {
    trackAuthOpened(source);
    onStartAuth();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: 'transparent' }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Atelier Top Navigation Bar */}
      <View style={[styles.navbar, { borderBottomColor: colors.borderColor }]}>
        <View style={styles.navBrand}>
          <AyeLogo width={36} color={colors.accent} />
          <View style={styles.brandTitleCol}>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>AYETASKS</Text>
            <Text style={[styles.brandSub, { color: colors.accent }]}>Atelier Productivity Suite</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          {/* Language Switcher */}
          <TouchableOpacity
            style={[
              styles.navIconBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                ...(Platform.OS === 'web' ? { boxShadow: `3px 3px 0px 0px ${colors.shadowColor}` } : {}),
              },
            ]}
            onPress={toggleLanguage}
            activeOpacity={0.8}
          >
            <Languages size={15} color={colors.accent} strokeWidth={2.5} />
            <Text style={[styles.navActionText, { color: colors.textPrimary }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {/* Theme Mode Switcher */}
          <TouchableOpacity
            style={[
              styles.navIconBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                ...(Platform.OS === 'web' ? { boxShadow: `3px 3px 0px 0px ${colors.shadowColor}` } : {}),
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            {isDark ? (
              <Sun size={16} color={colors.accentWarning} strokeWidth={2.5} />
            ) : (
              <Moon size={16} color={colors.textPrimary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          {/* Quick Login Button */}
          <TouchableOpacity
            style={[
              styles.loginBtn,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.bgSurface,
                ...(Platform.OS === 'web' ? { boxShadow: `3px 3px 0px 0px ${colors.shadowColor}` } : {}),
              },
            ]}
            onPress={() => handleCta('nav_login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.loginBtnText, { color: colors.textPrimary }]}>{t.loginBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Section */}
      <View style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
        <View
          style={[
            styles.badgeBox,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              ...(Platform.OS === 'web' ? { boxShadow: `3px 3px 0px 0px ${colors.accent}` } : {}),
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.accent }]}>{t.badge}</Text>
        </View>

        <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile, { color: colors.textPrimary }]}>
          {t.heroTitle}
        </Text>

        <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile, { color: colors.textSecondary }]}>
          {t.heroSub}
        </Text>

        <View style={[styles.ctaRow, isMobile && styles.ctaRowMobile]}>
          <TouchableOpacity
            style={[
              styles.mainCtaBtn,
              {
                backgroundColor: colors.accent,
                borderColor: colors.borderColor,
                ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
              },
            ]}
            onPress={() => handleCta('hero_primary')}
            activeOpacity={0.85}
          >
            <Text style={[styles.mainCtaText, { color: '#000000' }]}>{t.ctaBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryCtaBtn,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderColor,
                ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
              },
            ]}
            onPress={() => handleCta('hero_secondary')}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryCtaText, { color: colors.textPrimary }]}>{t.loginBtn}</Text>
            <ArrowUpRight size={16} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Core Feature Cards */}
      <View style={[styles.gridSection, isMobile && styles.gridSectionMobile]}>
        {/* Feature 1 */}
        <View
          style={[
            styles.featureCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
            },
          ]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.borderColor }]}>
            <CheckCircle2 size={24} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.feature1Title}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.feature1Desc}</Text>
        </View>

        {/* Feature 2 */}
        <View
          style={[
            styles.featureCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
            },
          ]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.borderColor }]}>
            <Clock size={24} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.feature2Title}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.feature2Desc}</Text>
        </View>

        {/* Feature 3 */}
        <View
          style={[
            styles.featureCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
            },
          ]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.borderColor }]}>
            <Zap size={24} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t.feature3Title}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.feature3Desc}</Text>
        </View>
      </View>

      {/* 4. Privacy & Trust Banner */}
      <View
        style={[
          styles.trustBanner,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
            ...(Platform.OS === 'web' ? { boxShadow: `4px 4px 0px 0px ${colors.shadowColor}` } : {}),
          },
        ]}
      >
        <ShieldCheck size={28} color={colors.accentSuccess} strokeWidth={2.2} />
        <View style={styles.trustTextCol}>
          <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>{t.securityTitle}</Text>
          <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>{t.securityDesc}</Text>
        </View>
      </View>

      {/* 5. Minimalist Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderColor }]}>
        <View style={styles.footerBrandRow}>
          <AyeLogo width={28} color={colors.accent} />
          <Text style={[styles.footerBrandText, { color: colors.textPrimary }]}>AyeTasks</Text>
        </View>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.footerText}</Text>
        <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
          © {new Date().getFullYear()} AyeApps. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  navbar: {
    width: '100%',
    maxWidth: 1120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.2,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navIconBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navActionText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  heroSection: {
    width: '100%',
    maxWidth: 860,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  heroSectionMobile: {
    paddingTop: 36,
    paddingBottom: 32,
  },
  badgeBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  heroTitleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 36,
  },
  heroSubtitleMobile: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 28,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ctaRowMobile: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
  },
  mainCtaBtn: {
    height: 48,
    paddingHorizontal: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCtaText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  secondaryCtaBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryCtaText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.8,
  },
  gridSection: {
    width: '100%',
    maxWidth: 1080,
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  gridSectionMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    padding: 24,
    borderWidth: 2,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 21,
  },
  trustBanner: {
    width: '100%',
    maxWidth: 1080,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    maxWidth: 1120,
    marginTop: 60,
    paddingTop: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerBrandText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 540,
    lineHeight: 19,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
