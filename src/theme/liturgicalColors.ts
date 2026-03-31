import { colors } from './colors';

export type LiturgicalColor = 'green' | 'purple' | 'white' | 'red' | 'rose' | 'gold' | 'blue';

export const getLiturgicalHex = (colorKey: LiturgicalColor): string => {
    switch (colorKey) {
        case 'green': return colors.liturgical.ordinaryTime;
        case 'purple': return colors.liturgical.adventLent;
        case 'rose': return '#D88A9F';
        case 'white': return '#F1F1F1';
        case 'gold': return colors.liturgical.christmasEaster;
        case 'red': return colors.liturgical.pentecost;
        case 'blue': return colors.liturgical.marian;
        default: return colors.liturgical.ordinaryTime;
    }
};