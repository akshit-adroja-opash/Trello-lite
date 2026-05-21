import { create } from 'zustand';

const useThemeStore = create((set) => {
  // Initialize from localStorage or fallback to media query
  const getInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const initialDark = getInitialTheme();

  // Apply initially to DOM
  if (initialDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    darkMode: initialDark,
    toggleTheme: () => set((state) => {
      const nextMode = !state.darkMode;
      if (nextMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return { darkMode: nextMode };
    }),
    setTheme: (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      set({ darkMode: isDark });
    }
  };
});

export default useThemeStore;
