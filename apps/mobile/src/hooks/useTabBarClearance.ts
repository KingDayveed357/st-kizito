import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

/**
 * Bottom padding a scroll view needs so its content clears the (now absolutely-positioned,
 * immersive) tab bar. Matches the tab bar height configured in app/(tabs)/_layout.tsx.
 */
export const useTabBarClearance = () => {
    const insets = useSafeAreaInsets();
    return spacing.tabBarHeight + insets.bottom;
};
