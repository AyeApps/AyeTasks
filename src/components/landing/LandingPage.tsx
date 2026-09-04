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
import { CheckCircle2, Clock, Zap, Sun, Moon, Languages, ShieldCheck } from 'lucide-react-native';
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
      heroSub: 'Organiza tus pendientes, gestiona proyectos mediante subtareas claras y mantén el control del tiempo dedicado a cada objetivo. Sin distracciones ni configuraciones innecesarias.',
      ctaBtn: 'COMENZAR AHORA ➔',
      loginBtn: 'INICIAR SESIÓN',
      feature1Title: 'Jerarquía y Subtareas Claras',
      feature1Desc: 'Divide proyectos complejos en pasos accionables para avanzar con certeza sin perder de vista el panorama general.',
      feature2Title: 'Temporizador de Enfoque',
      feature2Desc: 'Cronometra tu tiempo de concentración en cada tarea con un solo toque y monitorea tus horas productivas de la semana.',
      feature3Title: 'Sincronización Inmediata',
      feature3Desc: 'Continúa exactamente donde lo dejaste. Tus tareas y avances se actualizan al instante entre todos tus dispositivos.',
      footerText: 'AyeTasks es parte de la suite de software AyeApps. Privado, seguro y diseñado para alta productividad.',
    },
    en: {
      badge: '✦ AYETASKS · HIGH-VELOCITY TASK & TIME MANAGER',
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
      footerText: 'AyeTasks is part of the AyeApps software suite. Private, secure, and built for high productivity.',
    },
  }[isEs ? 'es' : 'en'];

  const handleCta = (source: string) => {
    trackAuthOpened(source);
    onStartAuth();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgBase }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderBase }]}>
        <View style={styles.brandRow}>
          <AyeLogo width={36} color={colors.accent} />
          <View style={styles.brandTextCol}>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>AyeTasks</Text>
            <Text style={[styles.brandSub, { color: colors.textSecondary }]}>AyeApps Suite</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { borderColor: colors.borderBase, backgroundColor: colors.bgSurface }]}
            onPress={toggleLanguage}
            accessibilityLabel="Toggle Language"
          >
            <Languages size={15} color={colors.accent} />
            <Text style={[styles.headerBtnText, { color: colors.textPrimary }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerBtn, { borderColor: colors.borderBase, backgroundColor: colors.bgSurface }]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme"
          >
            {isDark ? <Sun size={15} color={colors.accent} /> : <Moon size={15} color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navAuthBtn, { backgroundColor: colors.accent, borderColor: colors.borderBase }]}
            onPress={() => handleCta('nav_login')}
          >
            <Text style={styles.navAuthBtnText}>{t.loginBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={[styles.badgePill, { borderColor: colors.accent, backgroundColor: isDark ? 'rgba(254, 157, 1, 0.1)' : 'rgba(254, 157, 1, 0.15)' }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>{t.badge}</Text>
        </View>

        <Text style={[styles.heroTitle, { color: colors.textPrimary, fontSize: isMobile ? 28 : 44 }]}>
          {t.heroTitle}
        </Text>

        <Text style={[styles.heroSub, { color: colors.textSecondary, fontSize: isMobile ? 15 : 17 }]}>
          {t.heroSub}
        </Text>

        <TouchableOpacity
          style={[styles.heroCtaBtn, { backgroundColor: colors.accent }]}
          onPress={() => handleCta('hero_primary')}
          activeOpacity={0.88}
        >
          <Text style={styles.heroCtaText}>{t.ctaBtn}</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards Grid */}
      <View style={[styles.featuresGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
        <View style={[styles.featureCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderBase }]}>
          <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(254, 157, 1, 0.12)' : 'rgba(254, 157, 1, 0.2)' }]}>
            <CheckCircle2 size={24} color={colors.accent} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.feature1Title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t.feature1Desc}</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderBase }]}>
          <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(254, 157, 1, 0.12)' : 'rgba(254, 157, 1, 0.2)' }]}>
            <Clock size={24} color={colors.accent} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.feature2Title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t.feature2Desc}</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderBase }]}>
          <View style={[styles.featureIconBox, { backgroundColor: isDark ? 'rgba(254, 157, 1, 0.12)' : 'rgba(254, 157, 1, 0.2)' }]}>
            <Zap size={24} color={colors.accent} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.feature3Title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t.feature3Desc}</Text>
        </View>
      </View>

      {/* Trust & Privacy Guarantee */}
      <View style={[styles.trustBox, { borderColor: colors.borderBase, backgroundColor: colors.bgSurface }]}>
        <ShieldCheck size={20} color={colors.accent} />
        <Text style={[styles.trustText, { color: colors.textSecondary }]}>
          {t.footerText}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.copyright, { color: colors.textSecondary }]}>
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
  header: {
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
  },
  navAuthBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  navAuthBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSection: {
    maxWidth: 820,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 40,
    alignItems: 'center',
    textAlign: 'center',
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
  },
  heroTitle: {
    fontWeight: '900',
    lineHeight: 46,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  heroSub: {
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 32,
  },
  heroCtaBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#FE9D01',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  heroCtaText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  featuresGrid: {
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 24,
    gap: 20,
    marginBottom: 40,
  },
  featureCard: {
    flex: 1,
    padding: 24,
    borderWidth: 1.5,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
  featureIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FE9D01',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  trustBox: {
    maxWidth: 900,
    marginHorizontal: 24,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  trustText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
  },
  footer: {
    paddingTop: 10,
  },
  copyright: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
  },
});
