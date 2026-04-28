import React, { useMemo, useRef, useState, useCallback, memo, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    ListRenderItem,
    NativeSyntheticEvent,
    NativeScrollEvent,
    LayoutChangeEvent,
    useWindowDimensions,
} from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { Header } from '../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { LiturgicalBadge } from '../src/components/liturgical/LiturgicalBadge';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { getCalendar, getDatePresentation, getTodayIso } from '../src/services/liturgicalData';

const todayIso = getTodayIso();
const DAY_MILLIS = 24 * 60 * 60 * 1000;
const INITIAL_DAYS = 365 * 2;
const ROW_HEIGHT = 70;
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

type TimelineItem = {
    date: string;
    dayNum: number;
    dayName: string;
    isSunday: boolean;
    celebration: string;
    celebrationType: string;
    color: string;
};

const TimelineRow = memo(({
    item,
    isSelected,
    onSelect,
    borderColor,
    textPrimary,
    textSecondary,
    accent,
    accentSoft,
    surface,
    surfaceElevated,
    ordinaryColor,
    christmasColor,
}: {
    item: TimelineItem;
    isSelected: boolean;
    onSelect: (d: string) => void;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
    surface: string;
    surfaceElevated: string;
    ordinaryColor: string;
    christmasColor: string;
}) => {
    const isSpecial = item.celebrationType === 'Solemnity' || item.celebrationType === 'Feast';
    const liturgicalColor = item.color === 'white' ? ordinaryColor : (item.color === 'gold' ? christmasColor : item.color);

    return (
        <TouchableOpacity
            onPress={() => onSelect(item.date)}
            activeOpacity={0.85}
            style={[
                styles.rowContainer,
                { borderBottomColor: borderColor },
                isSelected && { backgroundColor: surfaceElevated, borderBottomColor: accentSoft },
            ]}
        >
            <View style={styles.dateColumn}>
                <Text style={[styles.dayNameText, { color: item.isSunday ? accent : textSecondary }]}>
                    {item.dayName}
                </Text>
                <View
                    style={[
                        styles.selectedDayBadge,
                        isSelected && { backgroundColor: accent, borderColor: accent },
                    ]}
                >
                    <Text style={[styles.dayNumberText, { color: isSelected ? surface : textPrimary }]}>
                        {item.dayNum}
                    </Text>
                </View>
            </View>

            <View style={styles.contentColumn}>
                <Text
                    style={[
                        styles.celebrationText,
                        {
                            color: item.isSunday || isSpecial ? textPrimary : textSecondary,
                            fontWeight: item.isSunday || isSpecial ? '700' : '400',
                            fontStyle: isSpecial ? 'italic' : 'normal',
                        },
                    ]}
                    numberOfLines={1}
                >
                    {item.celebration}
                </Text>
                {item.celebrationType !== 'Weekday' && (
                    <Text style={[styles.celebrationTypeText, { color: liturgicalColor }]}>
                        {item.celebrationType}
                    </Text>
                )}
            </View>

            {isSelected && <View style={[styles.selectedRail, { backgroundColor: accent }]} />}
        </TouchableOpacity>
    );
}, (prev, next) => (
    prev.isSelected === next.isSelected &&
    prev.item.date === next.item.date &&
    prev.borderColor === next.borderColor &&
    prev.textPrimary === next.textPrimary &&
    prev.textSecondary === next.textSecondary &&
    prev.accent === next.accent &&
    prev.accentSoft === next.accentSoft &&
    prev.surface === next.surface &&
    prev.surfaceElevated === next.surfaceElevated &&
    prev.ordinaryColor === next.ordinaryColor &&
    prev.christmasColor === next.christmasColor
));

const toMonthKey = (isoDate: string) => isoDate.slice(0, 7);

export default function CalendarScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const { selectedDate, source, setLiturgicalContext } = useAppStore();

    const listRef = useRef<FlatList>(null);
    const visibleMonthKeyRef = useRef(toMonthKey(selectedDate));
    const [visibleMonthDate, setVisibleMonthDate] = useState(selectedDate);
    const selectedDateRef = useRef(selectedDate);
    selectedDateRef.current = selectedDate;

    const listViewportHeightRef = useRef(Math.max(ROW_HEIGHT * 6, windowHeight - 280));
    const [isPickerVisible, setPickerVisible] = useState(false);

    const selectedDateObject = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);

    const timelineData = useMemo<TimelineItem[]>(() => {
        const start = new Date(todayIso).getTime() - (INITIAL_DAYS / 2) * DAY_MILLIS;
        return Array.from({ length: INITIAL_DAYS }).map((_, i) => {
            const iso = new Date(start + i * DAY_MILLIS).toISOString().slice(0, 10);
            const calendar = getCalendar(iso);
            const d = new Date(`${iso}T12:00:00`);

            return {
                date: iso,
                dayNum: d.getDate(),
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                isSunday: d.getDay() === 0,
                celebration: calendar?.celebration ?? 'Liturgical Day',
                celebrationType: calendar?.celebrationType ?? 'Weekday',
                color: calendar?.color ?? 'green',
            };
        });
    }, []);

    const timelineIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        timelineData.forEach((item, index) => map.set(item.date, index));
        return map;
    }, [timelineData]);

    const monthFirstIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        timelineData.forEach((item, index) => {
            const monthKey = toMonthKey(item.date);
            if (!map.has(monthKey)) {
                map.set(monthKey, index);
            }
        });
        return map;
    }, [timelineData]);

    const selectedInfo = useMemo(() => getCalendar(selectedDate), [selectedDate]);
    const presentation = useMemo(() => getDatePresentation(selectedDate), [selectedDate]);

    useEffect(() => {
        const index = timelineIndexMap.get(selectedDate);
        if (index !== undefined && index !== -1) {
            requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.3 });
            });
        }
    }, [selectedDate, timelineIndexMap]);

    useEffect(() => {
        const selectedMonthKey = toMonthKey(selectedDate);
        if (selectedMonthKey !== visibleMonthKeyRef.current) {
            visibleMonthKeyRef.current = selectedMonthKey;
            setVisibleMonthDate(selectedDate);
        }
    }, [selectedDate]);

    const handleJumpToToday = useCallback(() => {
        setLiturgicalContext(todayIso, source);
        const index = timelineIndexMap.get(todayIso);
        if (index !== undefined && index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
        }
    }, [setLiturgicalContext, source, timelineIndexMap]);

    const handleDateSelect = useCallback((date: string) => {
        setLiturgicalContext(date, source);
    }, [setLiturgicalContext, source]);

    const [pickerYear, setPickerYear] = useState(selectedDateObject.getFullYear());
    const [pickerMonth, setPickerMonth] = useState(selectedDateObject.getMonth());

    useEffect(() => {
        const d = new Date(`${selectedDate}T12:00:00`);
        setPickerYear(d.getFullYear());
        setPickerMonth(d.getMonth());
    }, [selectedDate]);

    const years = useMemo(() => Array.from({ length: 41 }).map((_, i) => 2000 + i), []);

    const confirmPickerDate = useCallback(() => {
        const monthPart = String(pickerMonth + 1).padStart(2, '0');
        const monthKey = `${pickerYear}-${monthPart}`;
        const newDate = `${monthKey}-01`;

        setLiturgicalContext(newDate, source);
        const index = monthFirstIndexMap.get(monthKey);
        if (index !== undefined) {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
        }
        setPickerVisible(false);
    }, [pickerYear, pickerMonth, setLiturgicalContext, source, monthFirstIndexMap]);

    const navigateToReading = useCallback(() => {
        if (source === 'readings') router.push({ pathname: '/readings', params: { date: selectedDate } });
        else if (source === 'divineOffice') router.push({ pathname: '/divine-office', params: { date: selectedDate } });
        else router.push('/inspiration');
    }, [source, router, selectedDate]);

    const renderTimelineRow = useCallback<ListRenderItem<TimelineItem>>(({ item }) => (
        <TimelineRow
            item={item}
            isSelected={selectedDateRef.current === item.date}
            onSelect={handleDateSelect}
            borderColor={colors.border}
            textPrimary={colors.textPrimary}
            textSecondary={colors.textSecondary}
            accent={colors.accent}
            accentSoft={colors.accentSoft}
            surface={colors.surface}
            surfaceElevated={colors.surfaceElevated}
            ordinaryColor={allColors.liturgical.ordinaryTime}
            christmasColor={allColors.liturgical.christmasEaster}
        />
    ), [
        handleDateSelect,
        colors.border,
        colors.textPrimary,
        colors.textSecondary,
        colors.accent,
        colors.accentSoft,
        colors.surface,
        colors.surfaceElevated,
        allColors.liturgical.ordinaryTime,
        allColors.liturgical.christmasEaster,
    ]);

    const handleListLayout = useCallback((event: LayoutChangeEvent) => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) {
            listViewportHeightRef.current = height;
        }
    }, []);

    const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const viewportHeight = listViewportHeightRef.current;
        const anchorIndex = Math.max(
            0,
            Math.min(
                timelineData.length - 1,
                Math.floor((offsetY + viewportHeight * 0.35) / ROW_HEIGHT)
            )
        );

        const anchorItem = timelineData[anchorIndex];
        if (!anchorItem?.date) {
            return;
        }

        const nextMonthKey = toMonthKey(anchorItem.date);
        if (nextMonthKey === visibleMonthKeyRef.current) {
            return;
        }

        visibleMonthKeyRef.current = nextMonthKey;
        setVisibleMonthDate(anchorItem.date);
    }, [timelineData]);

    const visibleMonthObject = useMemo(() => new Date(`${visibleMonthDate}T12:00:00`), [visibleMonthDate]);
    const selectedMonth = MONTHS[visibleMonthObject.getMonth()];
    const selectedYear = visibleMonthObject.getFullYear();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                centerElement={
                    <View style={styles.headerCenterWrap}>
                        <TouchableOpacity
                            onPress={() => setPickerVisible(true)}
                            activeOpacity={0.85}
                            style={[
                                styles.monthPickerPill,
                                {
                                    backgroundColor: colors.surfaceElevated,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.headerMonthText, { color: colors.textPrimary }]} numberOfLines={1}>
                                {selectedMonth} {selectedYear}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                            {presentation?.shortMeta ?? selectedDate}
                        </Text>
                    </View>
                }
                rightElement={
                    <TouchableOpacity
                        onPress={handleJumpToToday}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.85}
                        style={[
                            styles.todayIconButton,
                            { backgroundColor: `${colors.accent}12`, borderColor: `${colors.accent}35` },
                        ]}
                    >
                        <Ionicons name="today-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                }
            />

            <View style={{ flex: 1 }} onLayout={handleListLayout}>
                <FlatList
                    ref={listRef}
                    data={timelineData}
                    keyExtractor={(item) => item.date}
                    renderItem={renderTimelineRow}
                    extraData={selectedDate}
                    initialNumToRender={12}
                    maxToRenderPerBatch={8}
                    updateCellsBatchingPeriod={32}
                    windowSize={5}
                    removeClippedSubviews
                    getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
                    onScrollToIndexFailed={({ index }) => {
                        const fallbackOffset = index * ROW_HEIGHT;
                        listRef.current?.scrollToOffset({ offset: fallbackOffset, animated: false });
                    }}
                    onScroll={handleListScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            <View
                style={[
                    styles.selectionFooter,
                    {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                        shadowColor: '#000',
                        paddingBottom: Math.max(insets.bottom, 14),
                        paddingTop: 12,
                    },
                ]}
            >
                <View style={styles.footerContentRow}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                        <LiturgicalBadge label={presentation?.badgeLabel ?? 'DAY'} color={selectedInfo?.color} />
                        <Text style={[styles.footerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {selectedInfo?.celebration}
                        </Text>
                    </View>
                    <Button onPress={navigateToReading} size="sm" className="px-7 rounded-2xl h-12">
                        <Text style={styles.openDayText}>Open Day</Text>
                    </Button>
                </View>
            </View>

            <Modal visible={isPickerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerVisible(false)} />
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text style={[styles.pickerActionText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pickerTitleText, { color: colors.textPrimary }]}>Select Date</Text>
                            <TouchableOpacity onPress={confirmPickerDate}>
                                <Text style={[styles.pickerActionText, { color: colors.accent }]}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerListsRow}>
                            <FlatList
                                data={MONTHS}
                                keyExtractor={(item) => item}
                                style={{ flex: 1 }}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        onPress={() => setPickerMonth(index)}
                                        style={[styles.pickerOption, pickerMonth === index && { backgroundColor: `${colors.accent}15` }]}
                                    >
                                        <Text style={[styles.pickerOptionText, { color: pickerMonth === index ? colors.accent : colors.textPrimary }]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <FlatList
                                data={years}
                                keyExtractor={(item) => String(item)}
                                style={{ flex: 1 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => setPickerYear(item)}
                                        style={[styles.pickerOption, pickerYear === item && { backgroundColor: `${colors.accent}15` }]}
                                    >
                                        <Text style={[styles.pickerOptionText, { color: pickerYear === item ? colors.accent : colors.textPrimary }]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    rowContainer: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerCenterWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    monthPickerPill: {
        minHeight: 40,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        maxWidth: '96%',
    },
    headerMonthText: {
        fontSize: 19,
        fontWeight: '700',
    },
    headerMetaText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginTop: 4,
    },
    todayIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 10,
    },
    selectedDayBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    dayNameText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    dayNumberText: {
        fontSize: 20,
        fontWeight: '900',
    },
    contentColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    celebrationText: {
        fontSize: 18,
        lineHeight: 22,
    },
    celebrationTypeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 4,
        opacity: 0.8,
    },
    selectedRail: {
        position: 'absolute',
        left: 0,
        width: 4,
        height: '66%',
        borderTopRightRadius: 999,
        borderBottomRightRadius: 999,
    },
    selectionFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        elevation: 10,
    },
    footerContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    footerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
    },
    openDayText: {
        fontSize: 14,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '50%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerActionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    pickerTitleText: {
        fontSize: 18,
        fontWeight: '700',
    },
    pickerListsRow: {
        flexDirection: 'row',
        height: 256,
    },
    pickerOption: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerOptionText: {
        fontSize: 18,
        fontWeight: '500',
    },
});
