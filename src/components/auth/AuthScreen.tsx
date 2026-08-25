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
import Svg, { Path } from 'react-native-svg';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { THEME } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../store/useLanguageStore';

WebBrowser.maybeCompleteAuthSession();

const REMEMBERED_EMAIL_KEY = '@ayetasks_remembered_email';

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

const AppleIcon = ({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.85 2.76 1.01.08 2.03-.51 2.56-1.26z" />
  </Svg>
);

export const AuthScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { language, t, toggleLanguage } = useTranslation();

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginWithApple = useAuthStore((state) => state.loginWithApple);
  const { themeMode, colors, toggleTheme, isDark } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then((avail) => setIsAppleAuthAvailable(avail))
        .catch(() => setIsAppleAuthAvailable(false));
    } else {
      setIsAppleAuthAvailable(false);
    }
  }, []);

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '627799707976-gt9uudejrtd5d4b7pubkso0ev35j2rhr.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '627799707976-dmm76mhsvc1b7d7jcrf2hpfjbtnpb6te.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '627799707976-ek7dcu7lgfuj06us18cu5gnfuf6n3qqt.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) {
        setIsLoading(true);
        setAuthError('');
        setIsAccountNotFound(false);
        loginWithGoogle(id_token)
          .catch((err: any) => {
            setAuthError(err.message || t.auth.oauthError);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else if (googleResponse?.type === 'error') {
      setAuthError(t.auth.oauthError);
      setIsLoading(false);
    }
  }, [googleResponse]);

  const handleAppleAuth = async () => {
    try {
      setIsLoading(true);
      setAuthError('');
      setIsAccountNotFound(false);

      if (Platform.OS === 'ios' && isAppleAuthAvailable) {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (credential.identityToken) {
          const fullName = credential.fullName
            ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
            : undefined;
          await loginWithApple(credential.identityToken, fullName, credential.email || undefined);
        }
      } else {
        // Cross-platform Apple OAuth 2.0 Web flow for Android & Web
        const rawNonce = await Crypto.getRandomBytesAsync(16);
        const nonce = Array.from(rawNonce).map((b) => b.toString(16).padStart(2, '0')).join('');
        const state = Array.from(await Crypto.getRandomBytesAsync(16)).map((b) => b.toString(16).padStart(2, '0')).join('');
        const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ayetasks' });

        const serviceId = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID || 'com.ayeapps.ayetasks.auth';
        const authUrl =
          `https://appleid.apple.com/auth/authorize?` +
          `client_id=${encodeURIComponent(serviceId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code%20id_token` +
          `&response_mode=form_post` +
          `&scope=name%20email` +
          `&state=${state}` +
          `&nonce=${nonce}`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        if (result.type === 'success' && result.url) {
          const urlObj = new URL(result.url.replace('#', '?'));
          const idToken = urlObj.searchParams.get('id_token');
          if (idToken) {
            await loginWithApple(idToken);
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED' || err.message?.includes('cancel') || err.message?.includes('CANCELED')) {
        return;
      }
      setAuthError(err.message || t.auth.oauthError);
    } finally {
      setIsLoading(false);
    }
  };

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

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderColor }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                  {t.auth.orContinueWithEmail}
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.borderColor }]} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: colors.bgBase,
                      borderColor: colors.borderColor,
                      shadowColor: colors.shadowColor,
                    },
                    isLoading && styles.heroBtnDisabled,
                  ]}
                  onPress={() => promptGoogleAsync()}
                  disabled={isLoading || !googleRequest}
                  activeOpacity={0.8}
                >
                  <GoogleIcon size={18} />
                  <Text style={[styles.socialBtnText, { color: colors.textPrimary }]}>
                    {t.auth.continueWithGoogle}
                  </Text>
                </TouchableOpacity>

                {/* Apple Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                      borderColor: isDark ? '#FFFFFF' : '#000000',
                      shadowColor: colors.shadowColor,
                    },
                    isLoading && styles.heroBtnDisabled,
                  ]}
                  onPress={handleAppleAuth}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <AppleIcon size={18} color={isDark ? '#000000' : '#FFFFFF'} />
                  <Text
                    style={[
                      styles.socialBtnText,
                      { color: isDark ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    {t.auth.continueWithApple}
                  </Text>
                </TouchableOpacity>
              </View>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    opacity: 0.2,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 0.8,
  },
  socialContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: THEME.borders.thick,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: THEME.fonts.mono,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
