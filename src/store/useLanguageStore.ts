import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../i18n/translations';
import { useUIStore } from './useUIStore';

const LANGUAGE_STORAGE_KEY = '@ayetasks_selected_language';

interface LanguageState {
  language: Language;
  t: typeof translations['es'];
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  initLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'es',
  t: translations.es,

  initLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'es') {
        set({ language: stored, t: translations[stored] });
      }
    } catch {
      // Default to 'es'
    }
  },

  setLanguage: async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
    set({ language: lang, t: translations[lang] });
    useUIStore.getState().showToast(
      lang === 'es' ? 'Idioma cambiado a Español' : 'Language switched to English',
      'info',
      '// IDIOMA // LANGUAGE',
      3500
    );
  },

  toggleLanguage: async () => {
    const next: Language = get().language === 'es' ? 'en' : 'es';
    await get().setLanguage(next);
  },
}));

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const t = useLanguageStore((state) => state.t);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  return { language, t, setLanguage, toggleLanguage };
};
