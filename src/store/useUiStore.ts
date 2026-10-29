import { create } from 'zustand';

export type MobileTab = 'terminal' | 'graph' | 'files';
export type Theme = 'dark' | 'light';

interface UiState {
  readonly theme: Theme;
  readonly showExplanations: boolean;
  readonly mobileTab: MobileTab;
  readonly graphUnseen: number;
  setTheme(theme: Theme): void;
  toggleTheme(): void;
  setShowExplanations(value: boolean): void;
  setMobileTab(tab: MobileTab): void;
  noteGraphChange(): void;
}

function readTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'dark';
  return localStorage.getItem('gitquest.theme') === 'light' ? 'light' : 'dark';
}

function readExplanations(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem('gitquest.explanations') !== 'off';
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readTheme(),
  showExplanations: readExplanations(),
  mobileTab: 'terminal',
  graphUnseen: 0,

  setTheme(theme) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('gitquest.theme', theme);
    set({ theme });
  },

  toggleTheme() {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },

  setShowExplanations(value) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gitquest.explanations', value ? 'on' : 'off');
    }
    set({ showExplanations: value });
  },

  setMobileTab(tab) {
    set({ mobileTab: tab, ...(tab === 'graph' ? { graphUnseen: 0 } : {}) });
  },

  noteGraphChange() {
    set({ graphUnseen: get().graphUnseen + 1 });
  },
}));
