import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useUIStore } from '../../store/useUIStore';

export const AuthModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useUIStore((state) => state.closeAuthModal);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loadTasksAndConnections = useTaskStore((state) => state.loadTasksAndConnections);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa correo y contraseña');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        await register(name.trim() || 'Usuario', email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // Reload tasks from Mongo for this account
      await loadTasksAndConnections();
      closeAuthModal();
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeAuthModal}
    >
      <View style={styles.backdrop}>
        <View style={styles.techFrame}>
          {/* Tech Badge */}
          <View style={styles.techBadge}>
            <Text style={styles.techBadgeText}>[ AUTENTICACIÓN // AYETASKS ]</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
            </Text>
            <TouchableOpacity onPress={closeAuthModal} style={styles.closeBtn}>
              <X size={16} color={THEME.colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Segmented Mode Selector */}
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segmentTab, mode === 'login' && styles.segmentTabActive]}
              onPress={() => {
                setMode('login');
                setError(null);
              }}
            >
              <LogIn size={13} color={mode === 'login' ? THEME.colors.textInvert : THEME.colors.textSecondary} />
              <Text style={[styles.segmentTabText, mode === 'login' && styles.segmentTabTextActive]}>
                INGRESAR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentTab, mode === 'register' && styles.segmentTabActive]}
              onPress={() => {
                setMode('register');
                setError(null);
              }}
            >
              <UserPlus size={13} color={mode === 'register' ? THEME.colors.textInvert : THEME.colors.textSecondary} />
              <Text style={[styles.segmentTabText, mode === 'register' && styles.segmentTabTextActive]}>
                REGISTRARSE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message if any */}
          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color={THEME.colors.accentDanger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name input if registering */}
          {mode === 'register' ? (
            <TextInput
              style={styles.geometricInput}
              placeholder="TU NOMBRE"
              placeholderTextColor={THEME.colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          ) : null}

          {/* Email Input */}
          <TextInput
            style={styles.geometricInput}
            placeholder="CORREO ELECTRÓNICO (ej. tu@correo.com)"
            placeholderTextColor={THEME.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input */}
          <TextInput
            style={styles.geometricInput}
            placeholder="CONTRASEÑA (mínimo 8 caracteres)"
            placeholderTextColor={THEME.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>
              {isLoading
                ? 'PROCESANDO...'
                : mode === 'login'
                ? 'INICIAR SESIÓN ➔'
                : 'CREAR CUENTA Y ENTRAR ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  techFrame: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.bgBase,
    borderWidth: THEME.borders.thick,
    borderColor: THEME.colors.borderColor,
    padding: 22,
    position: 'relative',
  },
  techBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: THEME.colors.bgBase,
    paddingHorizontal: 8,
    borderWidth: THEME.borders.thick,
    borderColor: THEME.colors.borderColor,
  },
  techBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.colors.borderColor,
  },
  segmentedRow: {
    flexDirection: 'row',
    borderWidth: THEME.borders.thick,
    borderColor: THEME.colors.borderColor,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: THEME.colors.bgSurface,
  },
  segmentTabActive: {
    backgroundColor: THEME.colors.accent,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
  },
  segmentTabTextActive: {
    color: THEME.colors.textInvert,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.colors.accentDanger,
    backgroundColor: THEME.colors.accentDangerSubtle,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: THEME.colors.accentDanger,
    fontWeight: '700',
    flex: 1,
  },
  geometricInput: {
    backgroundColor: THEME.colors.bgSurface,
    borderWidth: THEME.borders.thick,
    borderColor: THEME.colors.borderColor,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: THEME.colors.accent,
    borderWidth: THEME.borders.thick,
    borderColor: THEME.colors.borderColor,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textInvert,
    letterSpacing: 1,
  },
});
