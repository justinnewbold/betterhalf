import { Platform } from 'react-native';

// Haptic feedback types matching iOS conventions
export type HapticType = 
  | 'light'      // Light tap - subtle feedback
  | 'medium'     // Medium tap - button press
  | 'heavy'      // Heavy tap - significant action
  | 'success'    // Success notification
  | 'warning'    // Warning notification
  | 'error'      // Error notification
  | 'selection'; // Selection change

// Vibration patterns for web fallback (in ms)
const VIBRATION_PATTERNS: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
  selection: [5],
};

/**
 * Trigger haptic feedback
 * Uses native haptics on iOS/Android, vibration API on web
 */
export const triggerHaptic = async (type: HapticType = 'medium'): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web: Use Vibration API if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(VIBRATION_PATTERNS[type]);
      }
    } else {
      // Native: Use expo-haptics (we'd need to install this)
      // For now, use react-native's Vibration as fallback
      const { Vibration } = await import('react-native');
      const pattern = VIBRATION_PATTERNS[type];
      if (pattern.length === 1) {
        Vibration.vibrate(pattern[0]);
      } else {
        Vibration.vibrate(pattern);
      }
    }
  } catch (error) {
    // Silently fail - haptics are not critical
    console.debug('[Haptics] Failed:', error);
  }
};

/**
 * Trigger haptic on button press
 */
export const hapticPress = () => triggerHaptic('medium');

/**
 * Trigger haptic on selection
 */
export const hapticSelection = () => triggerHaptic('selection');

/**
 * Trigger haptic on success (match, achievement, etc.)
 */
export const hapticSuccess = () => triggerHaptic('success');

/**
 * Trigger haptic on error
 */
export const hapticError = () => triggerHaptic('error');
