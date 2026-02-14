// Theme color definitions for Better Half
// Supports both dark and light modes

export interface ThemeColors {
  // Primary Brand (same for both themes)
  coral: string;
  coralLight: string;
  purple: string;
  purpleLight: string;
  blend: string;
  
  // Gradients
  gradientPrimary: string[];
  gradientCoral: string[];
  gradientPurple: string[];
  
  // Backgrounds
  background: string;
  cardBackground: string;
  cardBorder: string;
  
  // Feedback
  success: string;
  error: string;
  warning: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  
  // Misc
  transparent: string;
  overlay: string;
  
  // Input/Form
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  
  // Friends Mode
  greenAccent: string;
  coralPrimary: string;
  
  // Aliases (backwards compat)
  textPrimaryMuted: string;
  textPrimarySecondary: string;
}

// Dark theme colors (original)
export const darkColors: ThemeColors = {
  // Primary Brand
  coral: '#FF6B6B',
  coralLight: '#FF8E72',
  purple: '#A855F7',
  purpleLight: '#C084FC',
  blend: '#E85D8C',
  
  // Gradients
  gradientPrimary: ['#FF6B6B', '#C084FC'],
  gradientCoral: ['#FF6B6B', '#FF8E72'],
  gradientPurple: ['#A855F7', '#C084FC'],
  
  // Backgrounds
  background: '#0F0F1A',
  cardBackground: '#1A1A2E',
  cardBorder: 'rgba(255,255,255,0.1)',
  
  // Feedback
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.3)',
  
  // Misc
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
  
  // Input/Form
  inputBackground: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.1)',
  placeholder: 'rgba(255,255,255,0.4)',
  
  // Friends Mode
  greenAccent: '#10B981',
  coralPrimary: '#FF6B6B',
  
  // Aliases
  textPrimaryMuted: 'rgba(255,255,255,0.5)',
  textPrimarySecondary: 'rgba(255,255,255,0.7)',
};

// Light theme colors
export const lightColors: ThemeColors = {
  // Primary Brand (slightly adjusted for light mode)
  coral: '#E85555',
  coralLight: '#FF7A62',
  purple: '#9333EA',
  purpleLight: '#A855F7',
  blend: '#D14D7C',
  
  // Gradients
  gradientPrimary: ['#E85555', '#A855F7'],
  gradientCoral: ['#E85555', '#FF7A62'],
  gradientPurple: ['#9333EA', '#A855F7'],
  
  // Backgrounds
  background: '#F8F9FC',
  cardBackground: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  
  // Feedback
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  
  // Text
  textPrimary: '#1A1A2E',
  textSecondary: 'rgba(26,26,46,0.7)',
  textMuted: 'rgba(26,26,46,0.5)',
  textFaint: 'rgba(26,26,46,0.3)',
  
  // Misc
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.3)',
  
  // Input/Form
  inputBackground: 'rgba(0,0,0,0.03)',
  inputBorder: 'rgba(0,0,0,0.1)',
  placeholder: 'rgba(26,26,46,0.4)',
  
  // Friends Mode
  greenAccent: '#059669',
  coralPrimary: '#E85555',
  
  // Aliases
  textPrimaryMuted: 'rgba(26,26,46,0.5)',
  textPrimarySecondary: 'rgba(26,26,46,0.7)',
};

// Helper function to get colors based on theme
export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkColors : lightColors;
};

// Legacy export for backwards compatibility
// This will be the default dark theme
export const colors = {
  // Primary Brand
  coral: '#FF6B6B',
  coralLight: '#FF8E72',
  purple: '#A855F7',
  purpleLight: '#C084FC',
  blend: '#E85D8C',
  
  // Gradients (as array for LinearGradient)
  gradientPrimary: ['#FF6B6B', '#C084FC'],
  gradientCoral: ['#FF6B6B', '#FF8E72'],
  gradientPurple: ['#A855F7', '#C084FC'],
  
  // Backgrounds
  darkBg: '#0F0F1A',
  cardDark: '#1A1A2E',
  cardDarkBorder: 'rgba(255,255,255,0.1)',
  
  // Feedback
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.3)',
  
  // Misc
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
  
  // Friends Mode
  greenAccent: '#10B981',
  coralPrimary: '#FF6B6B',
  
  // Aliases
  textPrimaryMuted: 'rgba(255,255,255,0.5)',
  textPrimarySecondary: 'rgba(255,255,255,0.7)',
};

export const gradients = {
  primary: { colors: ['#FF6B6B', '#C084FC'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  coral: { colors: ['#FF6B6B', '#FF8E72'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  purple: { colors: ['#A855F7', '#C084FC'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  card: { colors: ['rgba(255,107,107,0.1)', 'rgba(192,132,252,0.1)'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};