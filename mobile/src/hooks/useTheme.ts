import { useUIStore } from '../store/useUIStore';

export function useTheme() {
  const themePreference = useUIStore((state) => state.themePreference);
  const themeMode = useUIStore((state) => state.themeMode);
  const colors = useUIStore((state) => state.themeColors);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const setThemeMode = useUIStore((state) => state.setThemeMode);

  return {
    themePreference,
    themeMode,
    colors,
    toggleTheme,
    setThemeMode,
    isDark: themeMode === 'dark',
  };
}
