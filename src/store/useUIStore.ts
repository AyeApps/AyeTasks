import { Appearance } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerSessionPurgeHandler } from './useAuthStore';
import { DARK_THEME, getThemeColors, ThemeColors } from '../constants/theme';

export type ViewMode = 'week' | 'focus' | 'analytics' | 'settings';
export type BackendStatus = 'online' | 'offline' | 'connecting';
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';
export type ThemePreference = 'system' | 'dark' | 'light';
export type ThemeMode = 'dark' | 'light';
export type TaskFilterMode = 'all' | 'focused' | 'in_progress' | 'pending' | 'completed';

export const resolveEffectiveTheme = (preference: ThemePreference): ThemeMode => {
  if (preference === 'system') {
    const sys = Appearance.getColorScheme();
    return sys === 'light' ? 'light' : 'dark';
  }
  return preference;
};

const THEME_STORAGE_KEY = '@ayetasks_theme_mode';
const WORK_HOURS_STORAGE_KEY = '@ayetasks_work_hours';

interface UIStore {
  themePreference: ThemePreference;
  themeMode: ThemeMode;
  themeColors: ThemeColors;
  currentReferenceDate: Date;
  viewMode: ViewMode;
  filterMode: TaskFilterMode;
  backendStatus: BackendStatus;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  isConnectingMode: boolean;
  connectingSourceTaskId: string | null;
  selectedTaskId: string | null;

  // Work Shift Hours (Start & End)
  workStartTime: string; // HH:MM (e.g. "09:00")
  workEndTime: string; // HH:MM (e.g. "18:00")
  setWorkHours: (start: string, end: string) => void;
  initWorkHours: () => Promise<void>;

  // Modals & Drawers
  isSidebarOpen: boolean;
  isQuickAddModalOpen: boolean;
  quickAddTargetDate: string | null;
  quickAddParentTaskId: string | null;
  isAuthModalOpen: boolean;
  isWorkHoursModalOpen: boolean;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  initTheme: () => Promise<void>;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemePreference) => void;

  // Mobile Day Navigation
  selectedMobileDayIndex: number;
  setSelectedMobileDayIndex: (index: number) => void;
  nextDay: () => void;
  prevDay: () => void;

  setReferenceDate: (date: Date) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  jumpToToday: () => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterMode: (filter: TaskFilterMode) => void;
  setBackendStatus: (status: BackendStatus) => void;
  setSyncStatus: (status: SyncStatus, pendingCount?: number) => void;

  startConnecting: (sourceTaskId: string) => void;
  cancelConnecting: () => void;
  selectTask: (taskId: string | null) => void;

  openQuickAdd: (dateString: string, parentTaskId?: string) => void;
  closeQuickAdd: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openWorkHoursModal: () => void;
  closeWorkHoursModal: () => void;
  resetUserUIState: () => void;
}

const getTodayDayIndex = (): number => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

export const useUIStore = create<UIStore>((set, get) => ({
  themePreference: 'system',
  themeMode: resolveEffectiveTheme('system'),
  themeColors: getThemeColors(resolveEffectiveTheme('system')),
  currentReferenceDate: new Date(),
  selectedMobileDayIndex: getTodayDayIndex(),
  viewMode: 'week',
  filterMode: 'all',
  backendStatus: 'offline',
  syncStatus: 'synced',
  pendingSyncCount: 0,
  isConnectingMode: false,
  connectingSourceTaskId: null,
  selectedTaskId: null,
  workStartTime: '09:00',
  workEndTime: '18:00',
  isSidebarOpen: false,
  isQuickAddModalOpen: false,
  quickAddTargetDate: null,
  quickAddParentTaskId: null,
  isAuthModalOpen: false,
  isWorkHoursModalOpen: false,

  resetUserUIState: () =>
    set({
      viewMode: 'week',
      filterMode: 'all',
      isConnectingMode: false,
      connectingSourceTaskId: null,
      selectedTaskId: null,
      isSidebarOpen: false,
      isQuickAddModalOpen: false,
      quickAddTargetDate: null,
      quickAddParentTaskId: null,
      isAuthModalOpen: false,
      isWorkHoursModalOpen: false,
      pendingSyncCount: 0,
    }),

    setSelectedMobileDayIndex: (index: number) =>
      set({ selectedMobileDayIndex: Math.max(0, Math.min(6, index)) }),

    nextDay: () => {
      const current = get().selectedMobileDayIndex;
      if (current < 6) {
        set({ selectedMobileDayIndex: current + 1 });
      } else {
        get().nextWeek();
        set({ selectedMobileDayIndex: 0 });
      }
    },

    prevDay: () => {
      const current = get().selectedMobileDayIndex;
      if (current > 0) {
        set({ selectedMobileDayIndex: current - 1 });
      } else {
        get().prevWeek();
        set({ selectedMobileDayIndex: 6 });
      }
    },

    initTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const preference: ThemePreference =
        saved === 'light' || saved === 'dark' || saved === 'system'
          ? (saved as ThemePreference)
          : 'system';

      const effective = resolveEffectiveTheme(preference);
      set({
        themePreference: preference,
        themeMode: effective,
        themeColors: getThemeColors(effective),
      });

      // Realtime OS Color Scheme Change Listener
      Appearance.addChangeListener(({ colorScheme }) => {
        const currentPref = get().themePreference;
        if (currentPref === 'system') {
          const sysEffective: ThemeMode = colorScheme === 'light' ? 'light' : 'dark';
          set({
            themeMode: sysEffective,
            themeColors: getThemeColors(sysEffective),
          });
        }
      });
    } catch {}
  },

  toggleTheme: () => {
    const currentMode = get().themeMode;
    const nextMode: ThemePreference = currentMode === 'dark' ? 'light' : 'dark';
    const effective = resolveEffectiveTheme(nextMode);
    set({
      themePreference: nextMode,
      themeMode: effective,
      themeColors: getThemeColors(effective),
    });
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  },

  setThemeMode: (mode: ThemePreference) => {
    const effective = resolveEffectiveTheme(mode);
    set({
      themePreference: mode,
      themeMode: effective,
      themeColors: getThemeColors(effective),
    });
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  },

  initWorkHours: async () => {
    try {
      const saved = await AsyncStorage.getItem(WORK_HOURS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.workStartTime && parsed.workEndTime) {
          set({
            workStartTime: parsed.workStartTime,
            workEndTime: parsed.workEndTime,
          });
        }
      }
    } catch {}
  },

  setWorkHours: (start: string, end: string) => {
    set({ workStartTime: start, workEndTime: end });
    AsyncStorage.setItem(
      WORK_HOURS_STORAGE_KEY,
      JSON.stringify({ workStartTime: start, workEndTime: end })
    );
  },

  setReferenceDate: (date) => set({ currentReferenceDate: date }),

  nextWeek: () =>
    set((state) => {
      const next = new Date(state.currentReferenceDate);
      next.setDate(next.getDate() + 7);
      return { currentReferenceDate: next };
    }),

  prevWeek: () =>
    set((state) => {
      const prev = new Date(state.currentReferenceDate);
      prev.setDate(prev.getDate() - 7);
      return { currentReferenceDate: prev };
    }),

  jumpToToday: () =>
    set({
      currentReferenceDate: new Date(),
      selectedMobileDayIndex: getTodayDayIndex(),
    }),

  setViewMode: (viewMode) => set({ viewMode }),

  setFilterMode: (filterMode) => set({ filterMode }),

  setBackendStatus: (backendStatus) => set({ backendStatus }),

  setSyncStatus: (status, pendingCount) =>
    set((state) => ({
      syncStatus: status,
      pendingSyncCount: pendingCount !== undefined ? pendingCount : state.pendingSyncCount,
    })),

  startConnecting: (sourceTaskId) =>
    set({ isConnectingMode: true, connectingSourceTaskId: sourceTaskId }),

  cancelConnecting: () =>
    set({ isConnectingMode: false, connectingSourceTaskId: null }),

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  openQuickAdd: (dateString, parentTaskId) =>
    set({
      isQuickAddModalOpen: true,
      quickAddTargetDate: dateString,
      quickAddParentTaskId: parentTaskId || null,
    }),

  closeQuickAdd: () =>
    set({
      isQuickAddModalOpen: false,
      quickAddTargetDate: null,
      quickAddParentTaskId: null,
    }),

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  openWorkHoursModal: () => set({ isWorkHoursModalOpen: true }),
  closeWorkHoursModal: () => set({ isWorkHoursModalOpen: false }),
}));

registerSessionPurgeHandler(() => {
  useUIStore.getState().resetUserUIState();
});

