import { Platform, StyleSheet } from 'react-native';

// Single source of truth for colors, spacing and type sizes.
// The light green app bar is the app's existing identity; the darker green is
// used for accents (active tab, selection, spinners) where light green lacks contrast.
export const colors = {
  brand: '#90EE90',
  brandDark: '#2a7a2a',
  brandTint: '#e8f5e9',

  text: '#1a1a1a',
  textSecondary: '#5c5f62',
  textTertiary: '#8a8d90',

  background: '#ffffff',
  surfaceMuted: '#f3f4f3',
  border: '#d9dbd9',
  pressed: '#ececec',
  overlay: 'rgba(0,0,0,0.4)',

  red: '#c62828',
  redTint: '#fdecea',
  blue: '#1a56b8',
  blueTint: '#e7eefb',

  link: '#1a56b8',
  danger: '#c62828',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const fontSize = {
  title: 18,
  body: 15,
  secondary: 13,
  caption: 12,
};

export const hairline = StyleSheet.hairlineWidth;

/**
 * Width of list dividers. On Android, Fabric rounds each view's position and height to
 * whole pixels independently (FabricMountingManager.cpp), so adjacent rows can overlap by
 * one pixel and hide a one-pixel divider. 1dp (Material's standard divider, 2–3px on
 * modern phones) always stays visible. iOS lays out on the exact pixel grid, so it keeps
 * the native hairline.
 */
export const dividerWidth = Platform.OS === 'android' ? 1 : StyleSheet.hairlineWidth;
