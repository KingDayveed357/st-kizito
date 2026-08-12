/**
 * ReminderSettingsScreen — Final
 *
 * ① Drag-to-dismiss: PanResponder on gesture zone (handle + header only).
 *    Sheet follows finger, springs back if released early, dismisses past 130px / 0.7 vel.
 *    Backdrop fades in sync with drag. No dependency added — pure Animated + PanResponder.
 *
 * ② X button: 36×36 circular badge, hitSlop 16px all sides.
 *    Triggers same dismiss animation as drag (not an abrupt `visible=false`).
 *
 * ③ Period column removed: redundant with the 46px live time that already shows "9:30 PM".
 *    Wheel row is now symmetric: Hour : Minute.
 *
 * ④ Switch lag fixed: local optimistic state in ReminderCard gives instant visual feedback.
 *    External store update syncs back via useEffect — if store reverts, UI follows.
 *
 * ⑤ Wheel re-render perf: hourOptions / hourLabels / minuteLabels are useMemo'd.
 *    handleHourSelect / handleMinuteSelect are useCallback'd with stable deps.
 *    WheelColumn.memo now correctly skips sibling re-renders when only one wheel scrolls.
 *
 * ⑥ All hooks in TimePickerModal declared before any conditional return (Rules of Hooks).
 *
 * ⑦ Custom animation lifecycle: animationType="none" on Modal.
 *    isMounted drives Modal visibility. Dismiss always runs the out-animation first,
 *    then calls onCancel/onSave — no jarring instant unmounts.
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Animated,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/ui/Header';
import { DevotionReminders } from '../../src/components/more/DevotionReminders';
import { useTheme } from '../../src/hooks/useTheme';
import { formatReminderTime, useNotifications } from '../../src/hooks/useNotifications';
import { PrayerReminderKey } from '../../src/services/notifications/notificationService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReminderEntry = {
    key: PrayerReminderKey;
    title: string;
    helper: string;
    icon: keyof typeof Ionicons.glyphMap;
};

type ReminderBounds = {
    minHour: number;
    maxHour: number;
    periodLabel: string;
    periodRange: string;
    meridiem: 'AM' | 'PM';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT   = 44;
const VISIBLE_ROWS  = 5;
const WHEEL_PADDING = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT; // 88
const SHEET_OFFSET  = 700; // off-screen distance for slide animation

const REMINDER_ENTRIES: ReminderEntry[] = [
    { key: 'morning',   title: 'Morning',   helper: 'Begin your day with prayer.',     icon: 'sunny-outline' },
    { key: 'afternoon', title: 'Afternoon', helper: 'Pause and reconnect with God.',   icon: 'sunny'         },
    { key: 'evening',   title: 'Evening',   helper: 'Close your day in thanksgiving.', icon: 'moon-outline'  },
];

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

const REMINDER_BOUNDS: Record<PrayerReminderKey, ReminderBounds> = {
    morning:   { minHour: 0,  maxHour: 11, periodLabel: 'AM', periodRange: '12:00 AM – 11:59 AM', meridiem: 'AM' },
    afternoon: { minHour: 12, maxHour: 16, periodLabel: 'PM', periodRange: '12:00 PM – 4:59 PM',  meridiem: 'PM' },
    evening:   { minHour: 17, maxHour: 23, periodLabel: 'PM', periodRange: '5:00 PM – 11:59 PM',  meridiem: 'PM' },
};

const LITURGICAL_PRESETS = [
    { label: 'Lauds',    note: 'Dawn',    hour24: 6,  emoji: '🌅' },
    { label: 'Terce',    note: '9 AM',    hour24: 9,  emoji: '☀️' },
    { label: 'Sext',     note: 'Noon',    hour24: 12, emoji: '🕛' },
    { label: 'None',     note: '3 PM',    hour24: 15, emoji: '🌤' },
    { label: 'Vespers',  note: 'Evening', hour24: 18, emoji: '🌇' },
    { label: 'Compline', note: 'Night',   hour24: 21, emoji: '🌙' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toHour12 = (h24: number) => {
    const h = Math.max(0, Math.min(23, h24));
    return h % 12 === 0 ? 12 : h % 12;
};
const clampMinute    = (m: number) => Math.max(0, Math.min(59, m));
const clampToPeriod  = (key: PrayerReminderKey, hour: number, minute: number) => {
    const b = REMINDER_BOUNDS[key];
    return { hour: Math.max(b.minHour, Math.min(b.maxHour, hour)), minute: clampMinute(minute) };
};
const getHourOptions = (key: PrayerReminderKey): number[] => {
    if (key === 'morning')   return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (key === 'afternoon') return [12, 1, 2, 3, 4];
    return [5, 6, 7, 8, 9, 10, 11];
};
const to24HourByPeriod = (key: PrayerReminderKey, h12: number) => {
    const h = Math.max(1, Math.min(12, h12));
    if (key === 'morning')   return h === 12 ? 0 : h;
    if (key === 'afternoon') return h === 12 ? 12 : Math.min(16, h + 12);
    return Math.max(17, h + 12);
};
const getPeriodIcon  = (key: PrayerReminderKey): keyof typeof Ionicons.glyphMap =>
    REMINDER_ENTRIES.find(e => e.key === key)?.icon ?? 'time-outline';

// ─── WheelColumn ──────────────────────────────────────────────────────────────

interface WheelColumnProps {
    label: string;
    items: string[];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
    width?: number;
}

const WheelColumn = memo(({ label, items, selectedIndex, onSelectIndex, width = 104 }: WheelColumnProps) => {
    const { colors } = useTheme();
    const scrollRef         = useRef<ScrollView>(null);
    const lastKnownIndexRef = useRef(selectedIndex);

    useEffect(() => {
        if (lastKnownIndexRef.current === selectedIndex) return;
        lastKnownIndexRef.current = selectedIndex;
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: true });
    }, [selectedIndex]);

    const commitIndexFromOffset = useCallback((offsetY: number) => {
        const next = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
        if (next === lastKnownIndexRef.current) return;
        lastKnownIndexRef.current = next;
        onSelectIndex(next);
    }, [items.length, onSelectIndex]);

    const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        commitIndexFromOffset(e.nativeEvent.contentOffset.y);
    }, [commitIndexFromOffset]);

    return (
        <View style={styles.wheelColumnWrap}>
            <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={[styles.wheelColumn, { width, backgroundColor: colors.surfaceElevated }]}>
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
                    onMomentumScrollEnd={handleScrollEnd}
                    onScrollEndDrag={handleScrollEnd}
                    contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
                >
                    {items.map((item, index) => {
                        const isSelected = index === selectedIndex;
                        const distance   = Math.abs(index - selectedIndex);
                        const opacity    = distance === 0 ? 1 : distance === 1 ? 0.42 : 0.18;
                        return (
                            <View key={`${label}-${item}-${index}`} style={styles.wheelItem}>
                                <Text style={{
                                    fontSize:      isSelected ? 28 : 22,
                                    fontWeight:    isSelected ? '700' : '500',
                                    letterSpacing: 0.2,
                                    color:         isSelected ? colors.accent : colors.textMuted,
                                    opacity,
                                }}>
                                    {item}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
                {/* Selection highlight band */}
                <View
                    pointerEvents="none"
                    style={[styles.selectionFrame, { borderColor: colors.accentSoft, backgroundColor: `${colors.accent}12` }]}
                />
            </View>
        </View>
    );
});
WheelColumn.displayName = 'WheelColumn';

// ─── ReminderCard ─────────────────────────────────────────────────────────────

interface ReminderCardProps {
    entry: ReminderEntry;
    enabled: boolean;
    hour: number;
    minute: number;
    label: string;
    periodRange: string;
    onToggle: (key: PrayerReminderKey, enabled: boolean) => void;
    onOpenCustomTime: (key: PrayerReminderKey, hour: number, minute: number) => void;
}

const ReminderCard = memo(({
    entry, enabled, hour, minute, label, periodRange, onToggle, onOpenCustomTime,
}: ReminderCardProps) => {
    const { colors } = useTheme();

    // ④ Optimistic local state — instant toggle, store syncs async
    const [localEnabled, setLocalEnabled] = useState(enabled);
    useEffect(() => { setLocalEnabled(enabled); }, [enabled]);

    const handleToggle = useCallback((value: boolean) => {
        setLocalEnabled(value);      // immediate visual
        onToggle(entry.key, value);  // async store
    }, [entry.key, onToggle]);

    return (
        <View style={[styles.card, {
            backgroundColor: colors.surface,
            borderColor:    localEnabled ? colors.accent : colors.border,
            elevation:      localEnabled ? 5 : 1,
            shadowOpacity:  localEnabled ? 0.11 : 0.05,
        }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, {
                    backgroundColor: localEnabled ? `${colors.accent}15` : colors.surfaceElevated,
                }]}>
                    <Ionicons name={entry.icon} size={24} color={localEnabled ? colors.accent : colors.textSecondary} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} className="font-serif">
                        {entry.title}
                    </Text>
                    <Text style={[styles.cardHelper, { color: colors.textSecondary }]}>{entry.helper}</Text>
                </View>
                <Switch
                    value={localEnabled}
                    onValueChange={handleToggle}
                    trackColor={{ true: colors.accentSoft, false: '#D5CBB9' }}
                    thumbColor={localEnabled ? colors.accent : '#FFFFFF'}
                />
            </View>

            {localEnabled && (
                <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => onOpenCustomTime(entry.key, hour, minute)}
                    style={[styles.timeTile, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
                >
                    <View>
                        <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>{periodRange}</Text>
                        <Text style={[styles.timeValue, { color: colors.textPrimary }]}>{label}</Text>
                    </View>
                    <View style={[styles.editBadge, { backgroundColor: `${colors.accent}12`, borderColor: colors.accentSoft }]}>
                        <Ionicons name="pencil-outline" size={13} color={colors.accent} />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
});
ReminderCard.displayName = 'ReminderCard';

// ─── TimePickerModal ──────────────────────────────────────────────────────────

interface TimePickerModalProps {
    visible: boolean;
    reminderKey: PrayerReminderKey | null;
    selectedHour12: number;
    selectedMinute: number;
    onSelectHour: (hour12: number) => void;
    onSelectMinute: (minute: number) => void;
    onCancel: () => void;
    onSave: () => void;
}

const TimePickerModal = memo(({
    visible, reminderKey, selectedHour12, selectedMinute,
    onSelectHour, onSelectMinute, onCancel, onSave,
}: TimePickerModalProps) => {
    const { colors } = useTheme();

    // ── Animation values — stable Animated refs, safe in panResponder closure ──
    const translateY      = useRef(new Animated.Value(SHEET_OFFSET)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // ── Mount state and guards ────────────────────────────────────────────────
    const [isMounted, setIsMounted]  = useState(false);
    const isAnimatingRef             = useRef(false);
    // Holds the last valid key so the sheet doesn't lose its content during the
    // out-animation (when parent sets reminderKey → null before animation ends)
    const lastValidKeyRef            = useRef<PrayerReminderKey | null>(null);

    // ── Stable callback refs (safe in panResponder closure, never stale) ──────
    const onCancelRef = useRef(onCancel);
    const onSaveRef   = useRef(onSave);
    useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);
    useEffect(() => { onSaveRef.current   = onSave;   }, [onSave]);

    // ── Core dismiss animation — reused by X, backdrop, drag, and Save ────────
    const dismiss = useCallback((onComplete: () => void) => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        Animated.parallel([
            Animated.timing(translateY,      { toValue: SHEET_OFFSET, duration: 300, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 0,            duration: 240, useNativeDriver: true }),
        ]).start(({ finished }) => {
            if (finished) {
                setIsMounted(false);
                onComplete();
            }
        });
    }, [translateY, backdropOpacity]);

    const handleCancel = useCallback(() => dismiss(() => onCancelRef.current()), [dismiss]);
    const handleSave   = useCallback(() => dismiss(() => onSaveRef.current()),   [dismiss]);

    // ── ⑤ Memoised wheel data — reference-stable so WheelColumn.memo holds ────
    const hourOptions = useMemo(
        () => reminderKey ? getHourOptions(reminderKey) : [],
        [reminderKey],
    );
    const hourLabels = useMemo(
        () => hourOptions.map(v => String(v).padStart(2, '0')),
        [hourOptions],
    );
    // minuteLabels is static — computed exactly once, never re-allocated
    const minuteLabels = useMemo(
        () => MINUTE_OPTIONS.map(v => String(v).padStart(2, '0')),
        [],
    );
    // Stable callbacks — sibling WheelColumn skips re-render when only one scrolls
    const handleHourSelect = useCallback((i: number) => {
        onSelectHour(hourOptions[i] ?? hourOptions[0]);
    }, [hourOptions, onSelectHour]);

    const handleMinuteSelect = useCallback((i: number) => {
        onSelectMinute(MINUTE_OPTIONS[i] ?? 0);
    }, [onSelectMinute]);

    const handlePreset = useCallback((hour24: number) => {
        onSelectHour(toHour12(hour24));
        onSelectMinute(0);
    }, [onSelectHour, onSelectMinute]);

    // ── ① PanResponder — drag-to-dismiss ─────────────────────────────────────
    // All captured values are stable (Animated.Values, refs, state setter).
    // No stale closure risk — safe inside the one-time useRef.create call.
    const panResponder = useRef(
        PanResponder.create({
            // Don't steal taps — activate only on deliberate downward swipe
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder:  (_, gs) => gs.dy > 10 && gs.dy > Math.abs(gs.dx),

            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) {
                    translateY.setValue(gs.dy);
                    // Backdrop fades with drag — premium parallel feel
                    backdropOpacity.setValue(Math.max(0, 1 - gs.dy / 420));
                }
            },

            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 130 || gs.vy > 0.7) {
                    // Past threshold → dismiss
                    if (isAnimatingRef.current) return;
                    isAnimatingRef.current = true;
                    Animated.parallel([
                        Animated.timing(translateY,      { toValue: SHEET_OFFSET, duration: 280, useNativeDriver: true }),
                        Animated.timing(backdropOpacity, { toValue: 0,            duration: 220, useNativeDriver: true }),
                    ]).start(({ finished }) => {
                        if (finished) { setIsMounted(false); onCancelRef.current(); }
                    });
                } else {
                    // Below threshold → spring back to resting position
                    isAnimatingRef.current = false;
                    Animated.parallel([
                        Animated.spring(translateY, {
                            toValue: 0, damping: 22, stiffness: 220, useNativeDriver: true,
                        }),
                        Animated.timing(backdropOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                    ]).start();
                }
            },
        }),
    ).current;

    // ── Mount trigger: capture key, then mount Modal ──────────────────────────
    useEffect(() => {
        if (visible && reminderKey) {
            lastValidKeyRef.current = reminderKey;
            isAnimatingRef.current  = true; // guards against spurious dismiss on visible=false
            setIsMounted(true);
        }
    }, [visible, reminderKey]);

    // ── Animate in once React has mounted the Modal ───────────────────────────
    useEffect(() => {
        if (!isMounted) return;
        // Start off-screen; spring up with natural deceleration
        translateY.setValue(SHEET_OFFSET);
        backdropOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0, damping: 26, stiffness: 170, mass: 1, useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start(() => { isAnimatingRef.current = false; });
    }, [isMounted, translateY, backdropOpacity]);

    // ── ⑥ All hooks declared — safe to return early now ──────────────────────
    if (!isMounted) return null;

    // Use lastValidKeyRef so the sheet retains content during the out-animation
    // (parent may null reminderKey before animation finishes)
    const safeKey       = lastValidKeyRef.current!;
    const bounds        = REMINDER_BOUNDS[safeKey];
    const hourIndex     = Math.max(0, hourOptions.indexOf(selectedHour12));
    const minuteIndex   = Math.max(0, MINUTE_OPTIONS.indexOf(selectedMinute));
    const liveTime      = `${selectedHour12}:${String(selectedMinute).padStart(2, '0')} ${bounds.meridiem}`;
    const periodPresets = LITURGICAL_PRESETS.filter(
        p => p.hour24 >= bounds.minHour && p.hour24 <= bounds.maxHour,
    );
    const periodIcon  = getPeriodIcon(safeKey);
    const periodTitle = safeKey.charAt(0).toUpperCase() + safeKey.slice(1);

    return (
        <Modal
            visible={isMounted}
            transparent
            animationType="none"      // fully custom animation
            onRequestClose={handleCancel}
            statusBarTranslucent      // full-screen on Android
        >
            {/* ── Animated backdrop (visual only, pointerEvents=none) ─────── */}
            <Animated.View
                style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
                pointerEvents="none"
            >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.48)' }]} />
            </Animated.View>

            {/* ── Full-screen tap target for backdrop dismiss ─────────────── */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={handleCancel} />

            {/* ── Sheet — renders above the Pressable ─────────────────────── */}
            <View style={styles.modalRoot} pointerEvents="box-none">
                <Animated.View style={[
                    styles.modalCard,
                    { backgroundColor: colors.surface, transform: [{ translateY }] },
                ]}>

                    {/* ── ① Gesture zone: drag handle + header only ─────────
                          Wheels and preset ScrollViews are intentionally OUTSIDE
                          this zone so their scroll events are never intercepted. */}
                    <View {...panResponder.panHandlers}>
                        {/* Drag handle */}
                        <View style={styles.dragHandleRow}>
                            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconBadge, {
                                backgroundColor: `${colors.accent}15`,
                                borderColor:     colors.accentSoft,
                            }]}>
                                <Ionicons name={periodIcon} size={20} color={colors.accent} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                    Set {periodTitle} Reminder
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                    {bounds.periodRange}
                                </Text>
                            </View>

                            {/* ② X button — circular badge, generous hit area */}
                            <TouchableOpacity
                                onPress={handleCancel}
                                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                                style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
                            >
                                <Ionicons name="close" size={15} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Live time preview ──────────────────────────────────── */}
                    <View style={styles.liveTimeRow}>
                        <Text style={[styles.liveTimeText, { color: colors.textPrimary }]}>
                            {liveTime}
                        </Text>
                    </View>

                    {/* ── ③ Wheel row — symmetric without Period column ─────── */}
                    <View style={styles.wheelsRow}>
                        <WheelColumn
                            label="Hour"
                            items={hourLabels}
                            selectedIndex={hourIndex}
                            onSelectIndex={handleHourSelect}
                        />
                        <Text style={[styles.separatorText, { color: colors.textSecondary }]}>:</Text>
                        <WheelColumn
                            label="Minute"
                            items={minuteLabels}
                            selectedIndex={minuteIndex}
                            onSelectIndex={handleMinuteSelect}
                        />
                    </View>

                    {/* ── Liturgical presets ─────────────────────────────────── */}
                    {periodPresets.length > 0 && (
                        <View style={styles.presetsSection}>
                            <Text style={[styles.presetsHeading, { color: colors.textSecondary }]}>
                                Liturgy of the Hours
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.presetsRow}
                            >
                                {periodPresets.map(p => {
                                    const isActive = selectedHour12 === toHour12(p.hour24) && selectedMinute === 0;
                                    return (
                                        <TouchableOpacity
                                            key={p.label}
                                            activeOpacity={0.75}
                                            onPress={() => handlePreset(p.hour24)}
                                            style={[styles.presetChip, {
                                                backgroundColor: isActive ? `${colors.accent}18` : colors.surfaceElevated,
                                                borderColor:     isActive ? colors.accent : colors.border,
                                            }]}
                                        >
                                            <Text style={styles.presetEmoji}>{p.emoji}</Text>
                                            <Text style={[styles.presetLabel, { color: isActive ? colors.accent : colors.textPrimary }]}>
                                                {p.label}
                                            </Text>
                                            <Text style={[styles.presetNote, { color: isActive ? colors.accent : colors.textSecondary }]}>
                                                {p.note}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Save ──────────────────────────────────────────────── */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.9}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Save Reminder</Text>
                    </TouchableOpacity>

                    <View style={{ height: 12 }} />
                </Animated.View>
            </View>
        </Modal>
    );
});
TimePickerModal.displayName = 'TimePickerModal';

// ─── Screen (unchanged logic, no structural changes needed) ───────────────────

export default function ReminderSettingsScreen() {
    const { colors } = useTheme();
    const { prayerReminders, togglePrayerReminder, setPrayerReminderTime } = useNotifications();

    const [activeKey,   setActiveKey]   = useState<PrayerReminderKey | null>(null);
    const [draftHour12, setDraftHour12] = useState<number>(6);
    const [draftMinute, setDraftMinute] = useState<number>(0);

    useEffect(() => {
        (['morning', 'afternoon', 'evening'] as PrayerReminderKey[]).forEach(key => {
            const r = prayerReminders[key];
            const n = clampToPeriod(key, r.hour, r.minute);
            if (n.hour !== r.hour || n.minute !== r.minute) {
                void setPrayerReminderTime(key, n.hour, n.minute);
            }
        });
    }, [prayerReminders, setPrayerReminderTime]);

    const handleToggle = useCallback((key: PrayerReminderKey, enabled: boolean) => {
        void togglePrayerReminder(key, enabled);
    }, [togglePrayerReminder]);

    const openCustomTime = useCallback((key: PrayerReminderKey, hour: number, minute: number) => {
        const n = clampToPeriod(key, hour, minute);
        setDraftHour12(toHour12(n.hour));
        setDraftMinute(n.minute);
        setActiveKey(key);
    }, []);

    const closeModal = useCallback(() => setActiveKey(null), []);

    const handleSave = useCallback(() => {
        if (!activeKey) return;
        const hour24 = to24HourByPeriod(activeKey, draftHour12);
        const n      = clampToPeriod(activeKey, hour24, draftMinute);
        void setPrayerReminderTime(activeKey, n.hour, n.minute);
        setActiveKey(null);
    }, [activeKey, draftHour12, draftMinute, setPrayerReminderTime]);

    const cardModels = useMemo(() => REMINDER_ENTRIES.map(entry => {
        const r = prayerReminders[entry.key];
        const n = clampToPeriod(entry.key, r.hour, r.minute);
        return {
            entry,
            enabled:     r.enabled,
            hour:        n.hour,
            minute:      n.minute,
            label:       formatReminderTime(n.hour, n.minute),
            periodRange: REMINDER_BOUNDS[entry.key].periodRange,
        };
    }), [prayerReminders]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Prayer Reminders" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introSection}>
                    <Text style={[styles.introTitle, { color: colors.textPrimary }]}>
                        Your rhythm of prayer
                    </Text>
                    <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
                        Let each hour become an offering.
                    </Text>
                </View>

                {cardModels.map(m => (
                    <ReminderCard
                        key={m.entry.key}
                        entry={m.entry}
                        enabled={m.enabled}
                        hour={m.hour}
                        minute={m.minute}
                        label={m.label}
                        periodRange={m.periodRange}
                        onToggle={handleToggle}
                        onOpenCustomTime={openCustomTime}
                    />
                ))}

                <DevotionReminders />
            </ScrollView>

            <TimePickerModal
                visible={activeKey !== null}
                reminderKey={activeKey}
                selectedHour12={draftHour12}
                selectedMinute={draftMinute}
                onSelectHour={setDraftHour12}
                onSelectMinute={setDraftMinute}
                onCancel={closeModal}
                onSave={handleSave}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop:        12,
        paddingBottom:     40,
    },
    introSection: {
        marginBottom:      22,
        paddingHorizontal: 2,
    },
    introTitle: {
        fontSize:     20,
        fontWeight:   '700',
        marginBottom: 4,
    },
    introSubtitle: {
        fontSize:   14,
        fontStyle:  'italic',
        lineHeight: 21,
        fontWeight: '400',
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        borderRadius:  24,
        borderWidth:   1.5,
        padding:       18,
        marginBottom:  14,
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 2 },
        shadowRadius:  10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems:    'center',
    },
    iconContainer: {
        width:          48,
        height:         48,
        borderRadius:   16,
        justifyContent: 'center',
        alignItems:     'center',
        marginRight:    14,
    },
    titleContainer: { flex: 1 },
    cardTitle: {
        fontSize:   18,
        fontWeight: '700',
    },
    cardHelper: {
        fontSize:  13,
        marginTop: 1,
    },
    timeTile: {
        marginTop:         14,
        borderWidth:       1,
        borderRadius:      16,
        paddingHorizontal: 16,
        paddingVertical:   16,
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
    },
    rangeLabel: {
        fontSize:      11,
        fontWeight:    '700',
        letterSpacing: 0.4,
        marginBottom:  6,
        textTransform: 'uppercase',
    },
    timeValue: {
        fontSize:   28,
        fontWeight: '300',  // intentionally light — serene, premium
        lineHeight: 32,
    },
    editBadge: {
        width:          32,
        height:         32,
        borderRadius:   10,
        borderWidth:    1,
        alignItems:     'center',
        justifyContent: 'center',
    },

    // ── Modal shell ───────────────────────────────────────────────────────────
    modalRoot: {
        flex:           1,
        justifyContent: 'flex-end',
    },
    modalCard: {
        borderTopLeftRadius:  28,
        borderTopRightRadius: 28,
        paddingHorizontal:    20,
        paddingTop:           0,
        // Elevation for the sheet shadow upward
        shadowColor:    '#000',
        shadowOffset:   { width: 0, height: -4 },
        shadowOpacity:  0.1,
        shadowRadius:   20,
        elevation:      24,
    },

    // ── Drag handle ───────────────────────────────────────────────────────────
    dragHandleRow: {
        paddingTop:    14,
        paddingBottom: 10,
        alignItems:    'center',
    },
    dragHandle: {
        width:        40,
        height:       4,
        borderRadius: 2,
    },

    // ── Modal header ──────────────────────────────────────────────────────────
    modalHeader: {
        flexDirection: 'row',
        alignItems:    'center',
        marginBottom:  18,
    },
    modalIconBadge: {
        width:          44,
        height:         44,
        borderRadius:   14,
        borderWidth:    1,
        alignItems:     'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize:   17,
        fontWeight: '700',
    },
    modalSubtitle: {
        fontSize:  12,
        marginTop: 2,
    },

    // ② X button — prominent circular target
    closeBtn: {
        width:          36,
        height:         36,
        borderRadius:   18,
        alignItems:     'center',
        justifyContent: 'center',
    },

    // ── Live time ─────────────────────────────────────────────────────────────
    liveTimeRow: {
        alignItems:   'center',
        marginBottom: 12,
    },
    liveTimeText: {
        fontSize:      48,
        fontWeight:    '200',
        letterSpacing: -1.5,
    },

    // ── ③ Wheel row — symmetric, centered ────────────────────────────────────
    wheelsRow: {
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
    },
    wheelColumnWrap: {
        alignItems: 'center',
    },
    wheelLabel: {
        fontSize:      12,
        fontWeight:    '700',
        marginBottom:  8,
        letterSpacing: 0.3,
    },
    wheelColumn: {
        height:       ITEM_HEIGHT * VISIBLE_ROWS,
        borderRadius: 14,
        overflow:     'hidden',
        position:     'relative',
    },
    wheelItem: {
        height:         ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems:     'center',
    },
    selectionFrame: {
        position:     'absolute',
        top:          WHEEL_PADDING,
        left:         6,
        right:        6,
        height:       ITEM_HEIGHT,
        borderRadius: 10,
        borderWidth:  1,
    },
    separatorText: {
        fontSize:   34,
        fontWeight: '700',
        marginTop:  20, // visually centers colon relative to wheel mid-row
    },

    // ── Liturgical presets ────────────────────────────────────────────────────
    presetsSection: {
        marginTop:    20,
        marginBottom: 20,
    },
    presetsHeading: {
        fontSize:      11,
        fontWeight:    '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom:  10,
        marginLeft:    2,
    },
    presetsRow: {
        paddingRight: 4,
    },
    presetChip: {
        alignItems:        'center',
        paddingVertical:   10,
        paddingHorizontal: 14,
        borderRadius:      14,
        borderWidth:       1,
        marginRight:       8,
        minWidth:          66,
    },
    presetEmoji: {
        fontSize:     17,
        marginBottom: 4,
    },
    presetLabel: {
        fontSize:   12,
        fontWeight: '600',
    },
    presetNote: {
        fontSize:  10,
        marginTop: 2,
    },

    // ── Save ──────────────────────────────────────────────────────────────────
    saveButton: {
        borderRadius:   14,
        height:         52,
        alignItems:     'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color:         '#FFFFFF',
        fontSize:      16,
        fontWeight:    '700',
        letterSpacing: 0.3,
    },
});