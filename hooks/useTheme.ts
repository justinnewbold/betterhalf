import { useMemo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { getThemeColors, ThemeColors, darkColors, lightColors } from '../constants/colors';

/**
 * Hook to get theme-aware colors
 * Returns colors object that updates when theme changes
 */
export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore((state) => state.isDark);
  
  const colors = useMemo(() => {
    return getThemeColors(isDark);
  }, [isDark]);
  
  return colors;
}

/**
 * Hook to get full theme state and controls
 */
export function useTheme() {
  const { mode, isDark, setMode, toggleTheme } = useThemeStore();
  const colors = useThemeColors();
  
  return {
    mode,
    isDark,
    colors,
    setMode,
    toggleTheme,
  };
}

// Re-export types
export type { ThemeColors };
export { darkColors, lightColors };