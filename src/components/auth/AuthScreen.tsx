import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sun, Moon, Languages, AlertCircle, UserPlus } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../store/useLanguageStore';

const REMEMBERED_EMAIL_KEY = '@ayetasks_remembered_email';

export const AuthScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { language, t, toggleLanguage } = useTranslation();

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const { themeMode, colors, toggleTheme, isDark } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then((saved) => {
      if (saved) setAuthEmail(saved);
    });
  }, []);

  const handleAuth = async () => {
    const trimmedEmail = authEmail.trim();
    const trimmedPassword = authPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setIsAccountNotFound(false);
      setAuthError(
        language === 'es'
          ? 'POR FAVOR INGRESA CORREO Y CONTRASEÑA'
          : 'PLEASE ENTER EMAIL AND PASSWORD'
      );
      return;
    }
    if (authMode === 'register' && trimmedPassword.length < 8) {
      setIsAccountNotFound(false);
      setAuthError(
        language === 'es'
          ? 'LA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES'
          : 'PASSWORD MUST BE AT LEAST 8 CHARACTERS'
      );
      return;
    }

    setIsAccountNotFound(false);
    setAuthError('');
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        await register(authName.trim() || 'USER', trimmedEmail, trimmedPassword);
      } else {
        await login(trimmedEmail, trimmedPassword);
      }
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.includes('ACCOUNT_NOT_FOUND') ||
        msg.includes('no existe') ||
        msg.includes('No account found') ||
        msg.includes('404')
      ) {
        setIsAccountNotFound(true);
        setAuthError('');
      } else if (
        msg.includes('INVALID_PASSWORD') ||
        msg.includes('Contraseña incorrecta') ||
        msg.includes('Credenciales')
      ) {
        setIsAccountNotFound(false);
        setAuthError(t.auth.invalidPassword || 'CONTRASEÑA INCORRECTA');
      } else {
        setIsAccountNotFound(false);
        setAuthError(msg.toUpperCase());
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.appContainer,
        { backgroundColor: 'transparent' },
      ]}
    >
      {/* Top Right Controls: Language Switcher & Theme Toggle */}
      <View style={styles.topRightControls}>
        <TouchableOpacity
          style={[
            styles.themeToggleTop,
            styles.langToggleTop,
            {
              borderColor: colors.borderColor,
              backgroundColor: colors.bgSurface,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Languages size={16} color={colors.accent} strokeWidth={2.5} />
          <Text style={[styles.langText, { color: colors.textPrimary }]}>
            {language.toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeToggleTop,
            {
              borderColor: colors.borderColor,
              backgroundColor: colors.bgSurface,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          {themeMode === 'dark' ? (
            <Sun size={18} color={colors.accentWarning} strokeWidth={2.5} />
          ) : (
            <Moon size={18} color={colors.textPrimary} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Centered Tech View with Animated Matrix Dotted Grid */}
      <View
        style={[
          styles.centeredView,
          { backgroundColor: 'transparent' },
        ]}
      >
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
            <Text style={[styles.techBadgeText, { color: colors.textPrimary }]}>
              {t.auth.statusOffline}
            </Text>
          </View>

          <View style={styles.techFrameContent}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={[styles.secureAccessText, { color: colors.textSecondary }]}>
                {t.auth.secureAccess}
              </Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                {t.auth.title}
              </Text>
            </View>

            {/* Segmented Mode Selector */}
            <View
              style={[
                styles.segmentedSelector,
                {
                  borderColor: colors.borderColor,
                  backgroundColor: colors.bgSurface,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  authMode === 'login'
                    ? { backgroundColor: colors.textPrimary }
                    : { backgroundColor: 'transparent' },
                ]}
                onPress={() => {
                  setAuthMode('login');
                  setIsAccountNotFound(false);
                  setAuthError('');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: authMode === 'login' ? colors.bgBase : colors.textPrimary,
                    },
                  ]}
                >
                  {t.auth.login}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  authMode === 'register'
                    ? { backgroundColor: colors.textPrimary }
                    : { backgroundColor: 'transparent' },
                ]}
                onPress={() => {
                  setAuthMode('register');
                  setIsAccountNotFound(false);
                  setAuthError('');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: authMode === 'register' ? colors.bgBase : colors.textPrimary,
                    },
                  ]}
                >
                  {t.auth.register}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {authMode === 'register' ? (
                <TextInput
                  style={[
                    styles.geometricInput,
                    {
                      backgroundColor: colors.bgBase,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t.auth.name}
                  placeholderTextColor={colors.textMuted}
                  value={authName}
                  onChangeText={setAuthName}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  importantForAutofill="yes"
                />
              ) : null}

              <TextInput
                style={[
                  styles.geometricInput,
                  {
                    backgroundColor: colors.bgBase,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t.auth.email}
                placeholderTextColor={colors.textMuted}
                value={authEmail}
                onChangeText={(val) => {
                  setAuthEmail(val);
                  if (isAccountNotFound) setIsAccountNotFound(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                importantForAutofill="yes"
              />

              <TextInput
                style={[
                  styles.geometricInput,
                  {
                    backgroundColor: colors.bgBase,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={t.auth.password}
                placeholderTextColor={colors.textMuted}
                value={authPassword}
                onChangeText={setAuthPassword}
                secureTextEntry
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                textContentType={authMode === 'login' ? 'password' : 'newPassword'}
                importantForAutofill="yes"
              />

              {/* Suggest Register Box when Account Does Not Exist */}
              {isAccountNotFound ? (
                <View
                  style={[
                    styles.suggestRegisterBox,
                    {
                      borderColor: colors.accentWarning,
                      backgroundColor: colors.accentWarningSubtle,
                    },
                  ]}
                >
                  <View style={styles.suggestHeaderRow}>
                    <UserPlus size={16} color={colors.accentWarning} strokeWidth={2.5} />
                    <Text style={[styles.suggestTitle, { color: colors.accentWarning }]}>
                      {t.auth.accountNotFoundTitle}
                    </Text>
                  </View>

                  <Text style={[styles.suggestDesc, { color: colors.textPrimary }]}>
                    {t.auth.accountNotFoundDesc}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.suggestBtn,
                      {
                        borderColor: colors.accentWarning,
                        backgroundColor: colors.bgBase,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                    onPress={() => {
                      setAuthMode('register');
                      setIsAccountNotFound(false);
                      setAuthError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={14} color={colors.accentWarning} strokeWidth={2.5} />
                    <Text style={[styles.suggestBtnText, { color: colors.accentWarning }]}>
                      {t.auth.suggestRegisterBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : authError ? (
                <View
                  style={[
                    styles.errorAlertBox,
                    {
                      borderColor: colors.accentDanger,
                      backgroundColor: colors.accentDangerSubtle,
                    },
                  ]}
                >
                  <AlertCircle size={16} color={colors.accentDanger} strokeWidth={2.5} />
                  <Text style={[styles.errorAlertText, { color: colors.accentDanger }]}>
                    {authError}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.heroBtn,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.borderColor,
                    shadowColor: colors.shadowColor,
                  },
                  isLoading && styles.heroBtnDisabled,
                ]}
                onPress={handleAuth}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color={colors.textInvert} />
                    <Text style={[styles.heroBtnText, { color: colors.textInvert }]}>
                      {t.auth.processing}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.heroBtnText, { color: colors.textInvert }]}>
                    {authMode === 'login' ? t.auth.initSession : t.auth.createAccount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topRightControls: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
  },
  themeToggleTop: {
    width: 44,
    height: 44,
    borderWidth: THEME.borders.thick,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  langToggleTop: {
    width: 'auto',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  centeredView: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  techFrame: {
    width: '100%',
    maxWidth: 480,
    borderWidth: THEME.borders.thick,
    position: 'relative',
    paddingTop: 52,
    shadowOffset: { width: 12, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  techFrameMobile: {
    maxWidth: '100%',
    paddingTop: 44,
  },
  techBadge: {
    position: 'absolute',
    top: -14,
    left: 24,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: THEME.borders.thick,
  },
  techBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  techFrameContent: {
    paddingHorizontal: 32,
    paddingBottom: 36,
  },
  titleSection: {
    marginBottom: 24,
  },
  secureAccessText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  segmentedSelector: {
    flexDirection: 'row',
    borderWidth: THEME.borders.thick,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  geometricInput: {
    borderWidth: THEME.borders.thick,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
    outlineWidth: 0,
    minHeight: 52,
  },
  suggestRegisterBox: {
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  suggestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestTitle: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  suggestDesc: {
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
    lineHeight: 16,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  suggestBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroBtn: {
    borderWidth: THEME.borders.thick,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 54,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  heroBtnDisabled: {
    opacity: 0.6,
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: THEME.fonts.mono,
  },
});
