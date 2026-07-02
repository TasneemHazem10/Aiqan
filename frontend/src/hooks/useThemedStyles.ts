import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

type StyleSheetDefinition = Record<string, any>;

export function useThemedStyles<T extends StyleSheetDefinition>(
  factory: (colors: Record<string, string>) => T,
  deps: any[] = []
): T {
  const { activeColors, themeVersion } = useApp();
  return useMemo(
    () => StyleSheet.create(factory(activeColors)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeColors, themeVersion, ...deps]
  );
}
