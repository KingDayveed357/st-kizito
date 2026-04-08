import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';

const lineSpacingScaleMap = {
    compact: 0.92,
    standard: 1,
    relaxed: 1.12,
} as const;

const getThemeColors = (mode: ReturnType<typeof useThemeStore.getState>['mode']) => {
    if (mode === 'dark') {
        return {
            background: colors.background.dark,
            surface: colors.surface.dark,
            surfaceElevated: colors.surfaceElevated.dark,
            textPrimary: colors.textPrimary.dark,
            textSecondary: colors.textSecondary.dark,
            textMuted: colors.textMuted.dark,
            accent: colors.accent,
            accentSoft: colors.accentSoft,
            border: '#2F3342',
            overlay: 'rgba(7, 9, 14, 0.72)',
        };
    }

    if (mode === 'sepia') {
        return {
            background: colors.sepia.background,
            surface: '#F7EEDC',
            surfaceElevated: colors.sepia.surface,
            textPrimary: colors.sepia.text,
            textSecondary: '#7A624B',
            textMuted: '#A1866E',
            accent: '#9A7A43',
            accentSoft: '#D6BE90',
            border: '#E2D1B0',
            overlay: 'rgba(59, 42, 26, 0.2)',
        };
    }

    if (mode === 'high-contrast') {
        return {
            background: '#000000',
            surface: '#0D0D0D',
            surfaceElevated: '#171717',
            textPrimary: '#FFFFFF',
            textSecondary: '#E5E5E5',
            textMuted: '#B8B8B8',
            accent: '#FFD21F',
            accentSoft: '#FFE680',
            border: '#FFFFFF',
            overlay: 'rgba(0, 0, 0, 0.84)',
        };
    }

    return {
        background: colors.background.light,
        surface: colors.surface.light,
        surfaceElevated: colors.surfaceElevated.light,
        textPrimary: colors.textPrimary.light,
        textSecondary: colors.textSecondary.light,
        textMuted: colors.textMuted.light,
        accent: colors.accent,
        accentSoft: colors.accentSoft,
        border: '#E7E0D3',
        overlay: 'rgba(26, 26, 26, 0.08)',
    };
};

export const useTheme = () => {
    const { mode, textScale, lineSpacing } = useThemeStore();
    const themeColors = getThemeColors(mode);
    const lineHeightScale = lineSpacingScaleMap[lineSpacing];

    return {
        colors: themeColors,
        allColors: colors,
        isDark: mode === 'dark' || mode === 'high-contrast',
        textScale,
        lineSpacing,
        lineHeightScale,
        mode,
    };
};
