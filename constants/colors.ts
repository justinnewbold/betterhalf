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
};

export const gradients = {
  primary: { colors: ['#FF6B6B', '#C084FC'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  coral: { colors: ['#FF6B6B', '#FF8E72'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  purple: { colors: ['#A855F7', '#C084FC'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  card: { colors: ['rgba(255,107,107,0.1)', 'rgba(192,132,252,0.1)'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
};
