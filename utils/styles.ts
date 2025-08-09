import { StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Common border radius values
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Common shadow styles
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common text styles
export const textStyles = {
  xs: {
    fontSize: 12,
    lineHeight: 16,
  },
  sm: {
    fontSize: 14,
    lineHeight: 20,
  },
  base: {
    fontSize: 16,
    lineHeight: 24,
  },
  lg: {
    fontSize: 18,
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
  },
  '2xl': {
    fontSize: 24,
    lineHeight: 32,
  },
  '3xl': {
    fontSize: 30,
    lineHeight: 36,
  },
  '4xl': {
    fontSize: 36,
    lineHeight: 40,
  },
};

// Common button styles
export const buttonStyles = {
  primary: {
    backgroundColor: Colors.light.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: Colors.light.gray200,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
};

// Common card styles
export const cardStyles = {
  base: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  elevated: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
};

// Common input styles
export const inputStyles = {
  base: {
    backgroundColor: Colors.light.backgroundPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderMedium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: textStyles.base.fontSize,
  },
  focused: {
    backgroundColor: Colors.light.backgroundPrimary,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: textStyles.base.fontSize,
  },
  error: {
    backgroundColor: Colors.light.backgroundPrimary,
    borderWidth: 2,
    borderColor: Colors.light.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: textStyles.base.fontSize,
  },
};

// Common layout styles
export const layoutStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spaceAround: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
};

// Common status styles
export const statusStyles = {
  online: {
    backgroundColor: Colors.light.statusOnline,
  },
  offline: {
    backgroundColor: Colors.light.statusOffline,
  },
  away: {
    backgroundColor: Colors.light.statusAway,
  },
};

// Helper function to create consistent styles
export const createStyles = (styleDefinitions: any) => {
  return StyleSheet.create(styleDefinitions);
};

// Common flex utilities
export const flex = {
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  wrap: { flexWrap: 'wrap' },
  nowrap: { flexWrap: 'nowrap' },
  '1': { flex: 1 },
  '2': { flex: 2 },
  '3': { flex: 3 },
  '4': { flex: 4 },
  '5': { flex: 5 },
  '6': { flex: 6 },
  '7': { flex: 7 },
  '8': { flex: 8 },
  '9': { flex: 9 },
  '10': { flex: 10 },
  '11': { flex: 11 },
  '12': { flex: 12 },
};

// Common justify content utilities
export const justify = {
  start: { justifyContent: 'flex-start' },
  end: { justifyContent: 'flex-end' },
  center: { justifyContent: 'center' },
  between: { justifyContent: 'space-between' },
  around: { justifyContent: 'space-around' },
  evenly: { justifyContent: 'space-evenly' },
};

// Common align items utilities
export const items = {
  start: { alignItems: 'flex-start' },
  end: { alignItems: 'flex-end' },
  center: { alignItems: 'center' },
  stretch: { alignItems: 'stretch' },
  baseline: { alignItems: 'baseline' },
};

// Common self align utilities
export const self = {
  start: { alignSelf: 'flex-start' },
  end: { alignSelf: 'flex-end' },
  center: { alignSelf: 'center' },
  stretch: { alignSelf: 'stretch' },
  baseline: { alignSelf: 'baseline' },
};
