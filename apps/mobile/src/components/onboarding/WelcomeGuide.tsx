import React, { useCallback, useRef, useState } from 'react';
import {
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface GuideSlide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    body: string;
}

/**
 * What the guide teaches. Deliberately short: where the main things live, and — because this is an
 * offline-first app — what does and does not need the internet. Many parishioners are older or on
 * intermittent data, so knowing "the prayers always work, the forms need a connection" prevents the
 * most common confusion.
 */
const SLIDES: GuideSlide[] = [
    {
        id: 'welcome',
        icon: 'home-outline',
        title: 'Welcome to St. Kizito',
        body: 'Your parish in your pocket — daily readings, the Divine Office, Mass bookings and parish news. This short guide shows you where everything is. You can skip it at any time.',
    },
    {
        id: 'readings',
        icon: 'book-outline',
        title: 'Daily Readings',
        body: 'The Readings tab opens today\'s Mass readings. Tap the calendar icon at the top to read another day, and use the A/A buttons to make the text larger or smaller.',
    },
    {
        id: 'office',
        icon: 'sunny-outline',
        title: 'Divine Office',
        body: 'The Divine Office tab has the prayers of the Church through the day — Morning Prayer, Midday, Evening and Night Prayer. Tap any hour to begin praying.',
    },
    {
        id: 'parish',
        icon: 'people-outline',
        title: 'Parish & Mass Booking',
        body: 'The Parish tab shows Mass times, announcements and events. From More you can book a Mass intention, make a donation, or request a baptismal card.',
    },
    {
        id: 'favourites',
        icon: 'heart-outline',
        title: 'Save what you love',
        body: 'Tap the bookmark on any reading or reflection to save it. Your saved items live in More → Favourites, ready whenever you want to return to them.',
    },
    {
        id: 'offline',
        icon: 'cloud-offline-outline',
        title: 'Works without internet',
        body: 'Readings and the Divine Office are stored on your phone, so they open even with no network. Booking a Mass, giving a donation or sending a request does need internet — if you are offline, your request is saved and sent once you reconnect.',
    },
];

interface WelcomeGuideProps {
    visible: boolean;
    onFinish: () => void;
}

/**
 * First-run guide for parishioners (the mobile app has no accounts, so this is the only onboarding).
 *
 * Built for accessibility first: text scales with the user's chosen size, touch targets are large,
 * nothing auto-advances, and Skip is always reachable. It is a paged carousel rather than
 * spotlight/coach-marks over the live UI — coach-marks depend on measuring real screen coordinates,
 * which is fragile across device sizes and font scales, and is exactly the audience most likely to
 * be hurt when it misaligns.
 */
export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ visible, onFinish }) => {
    const { colors, textScale, lineHeightScale } = useTheme();
    const { width } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const [index, setIndex] = useState(0);

    const isLast = index === SLIDES.length - 1;

    const goToIndex = useCallback(
        (next: number) => {
            const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
            setIndex(clamped);
            scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
        },
        [width],
    );

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / width);
            if (next !== index) setIndex(next);
        },
        [index, width],
    );

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onFinish} statusBarTranslucent>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                {/* Skip — always available, never hidden behind a menu. */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Skip the guide"
                        onPress={onFinish}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.skipButton}
                    >
                        <Text style={{ color: colors.textSecondary, fontSize: 15 * textScale }} className="font-sans font-semibold">
                            Skip
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    style={{ flex: 1 }}
                >
                    {SLIDES.map((slide) => (
                        <View key={slide.id} style={[styles.slide, { width }]}>
                            <View style={[styles.iconCircle, { backgroundColor: `${colors.accent}18` }]}>
                                <Ionicons name={slide.icon} size={46} color={colors.accent} />
                            </View>

                            <Text
                                accessibilityRole="header"
                                style={{
                                    color: colors.textPrimary,
                                    fontSize: 26 * textScale,
                                    lineHeight: 34 * textScale * lineHeightScale,
                                }}
                                className="font-serif font-bold text-center"
                            >
                                {slide.title}
                            </Text>

                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 17 * textScale,
                                    lineHeight: 27 * textScale * lineHeightScale,
                                    marginTop: 16,
                                }}
                                className="font-sans text-center"
                            >
                                {slide.body}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Progress dots — decorative; the label below announces position to screen readers. */}
                <View
                    style={styles.dots}
                    accessible
                    accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
                >
                    {SLIDES.map((slide, dotIndex) => (
                        <View
                            key={slide.id}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: dotIndex === index ? colors.accent : colors.surfaceElevated,
                                    width: dotIndex === index ? 22 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.footer}>
                    {index > 0 ? (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Go to previous step"
                            onPress={() => goToIndex(index - 1)}
                            style={[styles.secondaryButton, { borderColor: colors.border }]}
                        >
                            <Text style={{ color: colors.textPrimary, fontSize: 16 * textScale }} className="font-sans font-semibold">
                                Back
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.buttonSpacer} />
                    )}

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={isLast ? 'Finish the guide and start using the app' : 'Go to next step'}
                        onPress={() => (isLast ? onFinish() : goToIndex(index + 1))}
                        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16 * textScale }} className="font-sans font-bold">
                            {isLast ? 'Start praying' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    skipButton: {
        minHeight: 48,
        minWidth: 64,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    slide: {
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    iconCircle: {
        width: 104,
        height: 104,
        borderRadius: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    dot: {
        height: 8,
        borderRadius: 999,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    // Generous 56px targets — this audience includes users with reduced dexterity.
    primaryButton: {
        flex: 1,
        minHeight: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButton: {
        minHeight: 56,
        minWidth: 104,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    buttonSpacer: {
        minWidth: 104,
    },
});
