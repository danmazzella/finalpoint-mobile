/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';

  try {
    // Ensure Colors is properly imported
    if (!Colors || !Colors.light || !Colors.dark) {
      console.warn('Colors not properly loaded, using fallbacks');
      if (colorName === 'background') return '#ffffff';
      if (colorName === 'text') return '#000000';
      return '#ffffff';
    }

    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    } else {
      // Add fallback to prevent undefined values
      const themeColors = Colors[theme];
      if (themeColors && themeColors[colorName]) {
        return themeColors[colorName];
      }
      // Fallback to light theme if dark theme doesn't have the color
      if (Colors.light && Colors.light[colorName]) {
        return Colors.light[colorName];
      }
      // Ultimate fallback
      return '#ffffff';
    }
  } catch (error) {
    console.warn('useThemeColor error:', error);
    // Return safe fallback colors
    if (colorName === 'background') return '#ffffff';
    if (colorName === 'text') return '#000000';
    return '#ffffff';
  }
}
