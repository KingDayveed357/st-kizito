import React, { useMemo, useRef, useState, useCallback, useEffect, memo } from 'react';
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
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../src/hooks/useTheme';
import { Header } from '../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { LiturgicalBadge } from '../src/components/liturgical/LiturgicalBadge';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { getCalendar, getDatePresentation, getTodayIso } from '../src/services/liturgicalData';
import { TimelineRow, TimelineItem } from '../src/components/calendar/TimelineRow';
import { buildTimelineDays } from '../src/domain/calendar/timeline';

const todayIso = getTodayIso();
const MIN_YEAR = 2000;
const MAX_YEAR = 2040;
const ROW_HEIGHT = 70;
const MONTH_HEADER_HEIGHT = 44;
const YEAR_NAV_HEIGHT = 56;
const FOOTER_SAFE_SCROLL_SPACE = 150;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarData = ReturnType<typeof getCalendar>;

type YearNavItem    = { type: 'year-nav';     direction: 'prev' | 'next'; year: number };
type MonthHeaderItem = { type: 'month-header'; monthIndex: number; title: string };
// calendar is pre-computed here so renderItem never calls getCalendar()
type DayItem        = { type: 'day'; item: TimelineItem; calendar: CalendarData };
type CalendarListItem = YearNavItem | MonthHeaderItem | DayItem;

type BuiltCalendarList = {
    listData: CalendarListItem[];
    dateToOffsetMap: Map<string, number>;
    dateToIndexMap: Map<string, number>;
    monthOffsets: { monthIndex: number; offset: number }[];
    stickyHeaderIndices: number[];
    layoutOffsets: number[];
};

// Module-level cache: the per-year list (365 rows + offsets) is built once and reused across
// screen mounts, so re-opening the calendar is instant. Building synchronously on mount (rather
// than deferring behind a spinner) avoids a 0→365 VirtualizedList "slow to update" churn (audit #8).
const yearListCache = new Map<number, BuiltCalendarList>();

// ─── Cell colours bundle — passed as a single stable object ───────────────────

interface CellColors {
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
    surface: string;
    surfaceElevated: string;
    ordColor: string;
    chrColor: string;
}

// ─── Extracted memo cell components ──────────────────────────────────────────
// Keeping these outside the parent ensures React never recreates them.

interface MonthHeaderCellProps {
    title: string;
    background: string;
    border: string;
    textPrimary: string;
}
const MonthHeaderCell = memo(({ title, background, border, textPrimary }: MonthHeaderCellProps) => (
    <View style={[styles.monthHeaderRow, { backgroundColor: background, borderBottomColor: border }]}>
        <Text style={[styles.monthHeaderText, { color: textPrimary }]}>{title}</Text>
    </View>
));

interface YearNavCellProps {
    year: number;
    direction: 'prev' | 'next';
    border: string;
    onPress: (year: number) => void;
}
const YearNavCell = memo(({ year, direction, border, onPress }: YearNavCellProps) => {
    const label = direction === 'prev' ? `Previous year (${year})` : `Next year (${year})`;
    const handlePress = useCallback(() => onPress(year), [onPress, year]);
    return (
        <View style={[styles.yearNavRow, { borderBottomColor: border }]}>
            <Button onPress={handlePress} size="sm" className="px-5 rounded-2xl h-11">
                <Text style={styles.yearNavText}>{label}</Text>
            </Button>
        </View>
    );
});

interface DayCellProps {
    item: TimelineItem;
    calendar: CalendarData;
    isSelected: boolean;
    colors: CellColors;
    onSelect: (date: string) => void;
}
const DayCell = memo(({ item, calendar, isSelected, colors, onSelect }: DayCellProps) => (
    <TimelineRow
        item={item}
        calendar={calendar}
        isSelected={isSelected}
        onSelect={onSelect}
        borderColor={colors.border}
        textPrimary={colors.textPrimary}
        textSecondary={colors.textSecondary}
        accent={colors.accent}
        accentSoft={colors.accentSoft}
        surface={colors.surface}
        surfaceElevated={colors.surfaceElevated}
        ordinaryColor={colors.ordColor}
        christmasColor={colors.chrColor}
    />
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const selectedDate = useAppStore((state) => state.selectedDate);
    const source = useAppStore((state) => state.source);
    const setLiturgicalContext = useAppStore((state) => state.setLiturgicalContext);

    const listRef = useRef<FlatList>(null);
    const [isPickerVisible, setPickerVisible] = useState(false);

    const selectedDateObject = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
    const [visibleYear, setVisibleYear] = useState(selectedDateObject.getFullYear());
    const [visibleMonthIndex, setVisibleMonthIndex] = useState(selectedDateObject.getMonth());

    // Ref so handleScroll stays stable without stale closures
    const visibleMonthIndexRef = useRef(visibleMonthIndex);
    visibleMonthIndexRef.current = visibleMonthIndex;

    useEffect(() => {
        const selectedYear = selectedDateObject.getFullYear();
        if (selectedYear < MIN_YEAR || selectedYear > MAX_YEAR) return;
        setVisibleYear((prev) => (prev === selectedYear ? prev : selectedYear));
        setVisibleMonthIndex(selectedDateObject.getMonth());
    }, [selectedDateObject]);

    // Bundle theme colours into a single stable object so DayCell dependency is one ref
    const cellColors = useMemo<CellColors>(() => ({
        background:     colors.background,
        border:         colors.border,
        textPrimary:    colors.textPrimary,
        textSecondary:  colors.textSecondary,
        accent:         colors.accent,
        accentSoft:     colors.accentSoft,
        surface:        colors.surface,
        surfaceElevated: colors.surfaceElevated,
        ordColor:       allColors.liturgical.ordinaryTime,
        chrColor:       allColors.liturgical.christmasEaster,
    }), [colors, allColors]);

    const {
        listData,
        dateToOffsetMap,
        dateToIndexMap,
        monthOffsets,
        stickyHeaderIndices,
        layoutOffsets,
    } = useMemo<BuiltCalendarList>(() => {
        const cached = yearListCache.get(visibleYear);
        if (cached) return cached;

        const startIso = `${visibleYear}-01-01`;
        const endIso   = `${visibleYear}-12-31`;
        const days = buildTimelineDays(startIso, endIso);

        const items: CalendarListItem[] = [];
        const dateToOffset = new Map<string, number>();
        const dateToIndex = new Map<string, number>();
        const monthStartOffsets: { monthIndex: number; offset: number }[] = [];
        const sticky: number[] = [];
        const offsets: number[] = [];
        let runningOffset = 0;
        let lastMonth = -1;

        if (visibleYear > MIN_YEAR) {
            items.push({ type: 'year-nav', direction: 'prev', year: visibleYear - 1 });
            offsets.push(runningOffset);
            runningOffset += YEAR_NAV_HEIGHT;
        }

        days.forEach((day) => {
            const d = new Date(`${day.date}T12:00:00`);
            const month = d.getMonth();

            if (month !== lastMonth) {
                sticky.push(items.length);
                items.push({ type: 'month-header', monthIndex: month, title: `${MONTHS[month]} ${visibleYear}` });
                offsets.push(runningOffset);
                monthStartOffsets.push({ monthIndex: month, offset: runningOffset });
                runningOffset += MONTH_HEADER_HEIGHT;
                lastMonth = month;
            }

            // Pre-compute calendar data here — never again inside renderItem
            dateToIndex.set(day.date, items.length);
            items.push({ type: 'day', item: day, calendar: getCalendar(day.date) });
            offsets.push(runningOffset);
            dateToOffset.set(day.date, runningOffset);
            runningOffset += ROW_HEIGHT;
        });

        if (visibleYear < MAX_YEAR) {
            items.push({ type: 'year-nav', direction: 'next', year: visibleYear + 1 });
            offsets.push(runningOffset);
            runningOffset += YEAR_NAV_HEIGHT;
        }

        const built: BuiltCalendarList = {
            listData: items,
            dateToOffsetMap: dateToOffset,
            dateToIndexMap: dateToIndex,
            monthOffsets: monthStartOffsets,
            stickyHeaderIndices: sticky,
            layoutOffsets: offsets,
        };
        yearListCache.set(visibleYear, built);
        return built;
    }, [visibleYear]);

    // Render the list AT the selected date on first mount (initialScrollIndex) so the visible
    // window is never blank on open. The post-mount scroll effect below then only handles later
    // date changes — it skips the first run to avoid fighting initialScrollIndex (audit #1).
    const initialScrollIndex = useMemo(
        () => dateToIndexMap.get(selectedDate),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // mount-time only
    );
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
        if (!didInitialScrollRef.current) {
            didInitialScrollRef.current = true;
            return; // initialScrollIndex already positioned the list
        }
        const offset = dateToOffsetMap.get(selectedDate);
        if (offset === undefined) return;
        const id = setTimeout(() => {
            listRef.current?.scrollToOffset({ offset, animated: false });
        }, 0);
        return () => clearTimeout(id);
    }, [selectedDate, dateToOffsetMap]);

    // monthOffsets only changes when visibleYear changes — stable the rest of the time
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        let month = monthOffsets[0]?.monthIndex ?? 0;
        for (let i = monthOffsets.length - 1; i >= 0; i--) {
            if (offsetY + 8 >= monthOffsets[i].offset) {
                month = monthOffsets[i].monthIndex;
                break;
            }
        }
        if (month !== visibleMonthIndexRef.current) {
            setVisibleMonthIndex(month);
        }
    }, [monthOffsets]);

    const handleYearNav = useCallback((nextYear: number) => {
        if (nextYear < MIN_YEAR || nextYear > MAX_YEAR) return;
        const month = selectedDateObject.getMonth();
        const day   = selectedDateObject.getDate();
        const daysInTargetMonth = new Date(nextYear, month + 1, 0).getDate();
        const safeDay = Math.min(day, daysInTargetMonth);
        const nextDate = `${nextYear}-${String(month + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
        setVisibleYear(nextYear);
        setVisibleMonthIndex(month);
        setLiturgicalContext(nextDate, source);
    }, [selectedDateObject, setLiturgicalContext, source]);

    const handleJumpToToday = useCallback(() => {
        setVisibleYear(new Date(`${todayIso}T12:00:00`).getFullYear());
        setLiturgicalContext(todayIso, source);
    }, [setLiturgicalContext, source]);

    const handleDateSelect = useCallback((date: string) => {
        setLiturgicalContext(date, source);
    }, [setLiturgicalContext, source]);

    // ─── renderItem — minimal work, delegates to memo cells ───────────────────
    const renderItem = useCallback<ListRenderItem<CalendarListItem>>(({ item }) => {
        if (item.type === 'month-header') {
            return (
                <MonthHeaderCell
                    title={item.title}
                    background={cellColors.background}
                    border={cellColors.border}
                    textPrimary={cellColors.textPrimary}
                />
            );
        }
        if (item.type === 'year-nav') {
            return (
                <YearNavCell
                    year={item.year}
                    direction={item.direction}
                    border={cellColors.border}
                    onPress={handleYearNav}
                />
            );
        }
        return (
            <DayCell
                item={item.item}
                calendar={item.calendar}
                isSelected={selectedDate === item.item.date}
                colors={cellColors}
                onSelect={handleDateSelect}
            />
        );
    }, [selectedDate, cellColors, handleYearNav, handleDateSelect]);
    // Note: selectedDate and cellColors are the only things that need to be here.
    // selectedDate changes on tap — that's intentional and unavoidable.
    // cellColors only changes on theme switch.

    const getItemLayout = useCallback((_: unknown, index: number) => {
        const entry = listData[index];
        const length = entry?.type === 'month-header'
            ? MONTH_HEADER_HEIGHT
            : entry?.type === 'year-nav'
                ? YEAR_NAV_HEIGHT
                : ROW_HEIGHT;
        return { length, offset: layoutOffsets[index] ?? 0, index };
    }, [listData, layoutOffsets]);

    const keyExtractor = useCallback(
        (item: CalendarListItem, index: number) =>
            item.type === 'day' ? item.item.date : `${item.type}-${index}`,
        [],
    );

    // ─── Picker state ─────────────────────────────────────────────────────────

    const [pickerYear, setPickerYear]   = useState(selectedDateObject.getFullYear());
    const [pickerMonth, setPickerMonth] = useState(selectedDateObject.getMonth());

    useEffect(() => {
        const d = new Date(`${selectedDate}T12:00:00`);
        setPickerYear(d.getFullYear());
        setPickerMonth(d.getMonth());
    }, [selectedDate]);

    const years = useMemo(() => Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }).map((_, i) => MIN_YEAR + i), []);

    const confirmPickerDate = useCallback(() => {
        const monthPart = String(pickerMonth + 1).padStart(2, '0');
        const newDate = `${pickerYear}-${monthPart}-01`;
        setVisibleYear(pickerYear);
        setVisibleMonthIndex(pickerMonth);
        setLiturgicalContext(newDate, source);
        setPickerVisible(false);
    }, [pickerYear, pickerMonth, setLiturgicalContext, source]);

    const navigateToReading = useCallback(() => {
        if (source === 'readings') router.push({ pathname: '/readings', params: { date: selectedDate } });
        else if (source === 'divineOffice') router.push({ pathname: '/divine-office', params: { date: selectedDate } });
        else router.push('/inspiration');
    }, [source, router, selectedDate]);

    const selectedInfo  = useMemo(() => getCalendar(selectedDate), [selectedDate]);
    const presentation  = useMemo(() => getDatePresentation(selectedDate), [selectedDate]);

    const selectedMonth = MONTHS[visibleMonthIndex];
    const selectedYear  = visibleYear;

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
                                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                            ]}
                        >
                            <Animated.View
                                key={`${selectedMonth}-${selectedYear}`}
                                entering={FadeIn.duration(250)}
                                exiting={FadeOut.duration(150)}
                                style={styles.headerTextContainer}
                            >
                                <Text style={[styles.headerMonthText, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {selectedMonth} {selectedYear}
                                </Text>
                            </Animated.View>
                            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                            {presentation?.shortMeta ?? selectedDate}
                        </Text>
                    </View>
                }
                rightElement={
                    // Only show the "return to today" control when the user has navigated away from
                    // today — a labelled pill (not a bare icon) makes its purpose unambiguous, and
                    // its contextual appearance teaches the interaction without cluttering (audit #4).
                    selectedDate !== todayIso ? (
                        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                            <TouchableOpacity
                                onPress={handleJumpToToday}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel="Return to today's readings"
                                style={[styles.todayPill, { backgroundColor: colors.accent }]}
                            >
                                <Ionicons name="arrow-undo" size={13} color="#FFFFFF" />
                                <Text style={styles.todayPillText}>TODAY</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.todayPillPlaceholder} />
                    )
                }
            />

            <View style={{ flex: 1 }}>
                <FlatList
                    ref={listRef}
                    data={listData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    initialScrollIndex={initialScrollIndex}
                    initialNumToRender={14}
                    maxToRenderPerBatch={12}
                    updateCellsBatchingPeriod={40}
                    // windowSize 11 (~5 screens each way) keeps more rows pre-rendered so fast
                    // scrolling shows far fewer blank gaps before content fills in (audit #1).
                    windowSize={11}
                    // NOTE: removeClippedSubviews was removed — on the new architecture (Fabric) it
                    // crashes with `ReactClippingViewManager … addViewAt: IndexOutOfBounds` when the
                    // list data + stickyHeaderIndices populate together. FlatList windowing
                    // (windowSize/maxToRenderPerBatch) already virtualizes without it (audit #8).
                    // stickyHeaderIndices={stickyHeaderIndices}
                    getItemLayout={getItemLayout}
                    onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
                        const safeIndex = Math.max(0, Math.min(index, highestMeasuredFrameIndex));
                        const fallbackOffset = layoutOffsets[safeIndex] ?? 0;
                        listRef.current?.scrollToOffset({ offset: fallbackOffset, animated: false });
                    }}
                    onScroll={handleScroll}
                    scrollEventThrottle={32}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: Math.max(insets.bottom, 14) + FOOTER_SAFE_SCROLL_SPACE,
                    }}
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
    monthHeaderRow: {
        height: MONTH_HEADER_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    monthHeaderText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    yearNavRow: {
        height: YEAR_NAV_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    yearNavText: {
        fontSize: 13,
        fontWeight: '900',
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
    headerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    todayPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    todayPillText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    todayPillPlaceholder: {
        width: 40,
        height: 34,
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