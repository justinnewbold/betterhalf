import { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'PlayfairDisplay_700Bold',
  displaySemiBold: 'PlayfairDisplay_600SemiBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const typography: Record<string, TextStyle> = {
  // Display / Headlines
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Labels / Captions
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Buttons
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
};
