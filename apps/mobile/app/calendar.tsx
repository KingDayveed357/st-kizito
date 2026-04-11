import React, { useMemo, useRef, useState, useCallback, memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, useWindowDimensions, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { Header } from '../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { LiturgicalBadge } from '../src/components/liturgical/LiturgicalBadge';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { getCalendar, getDatePresentation, getTodayIso, getCalendarDescription } from '../src/services/liturgicalData';

const todayIso = getTodayIso();
const DAY_MILLIS = 24 * 60 * 60 * 1000;
const INITIAL_DAYS = 365 * 2; // Show 2 years of context by default

// --- Sub-Components ---

const TimelineRow = memo(({ date, isSelected, onSelect }: { date: string, isSelected: boolean, onSelect: (d: string) => void }) => {
    const { colors, allColors } = useTheme();
    const info = getCalendar(date);
    if (!info) return null;

    const d = new Date(`${date}T12:00:00`);
    const dayNum = d.getDate();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isSunday = d.getDay() === 0;

    const isSpecial = info.celebrationType === 'Solemnity' || info.celebrationType === 'Feast';
    const liturgicalColor = info.color === 'white' ? allColors.liturgical.ordinaryTime : (info.color === 'gold' ? allColors.liturgical.christmasEaster : info.color);

    return (
        <TouchableOpacity 
            onPress={() => onSelect(date)}
            style={[
                styles.rowContainer, 
                { borderBottomColor: colors.border },
                isSelected && { backgroundColor: `${colors.accent}08` }
            ]}
        >
            <View style={styles.dateColumn}>
                <Text style={{ color: isSunday ? colors.accent : colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-tighter">
                    {dayName}
                </Text>
                <Text style={{ color: colors.textPrimary }} className="font-serif font-black text-xl">
                    {dayNum}
                </Text>
            </View>
            <View style={styles.contentColumn}>
                <Text 
                    style={{ 
                        color: isSunday || isSpecial ? colors.textPrimary : colors.textSecondary,
                        fontWeight: isSunday || isSpecial ? '700' : '400',
                        fontStyle: isSpecial ? 'italic' : 'normal'
                    }} 
                    className="font-serif text-[18px] leading-tight"
                    numberOfLines={1}
                >
                    {info.celebration}
                </Text>
                {info.celebrationType !== 'Weekday' && (
                    <Text style={{ color: liturgicalColor }} className="font-sans text-[10px] font-bold uppercase tracking-[2px] mt-1 opacity-80">
                        {info.celebrationType}
                    </Text>
                )}
            </View>
            {isSelected && (
                <View style={{ backgroundColor: colors.accent, width: 4 }} className="h-2/3 absolute left-0 rounded-r-full" />
            )}
        </TouchableOpacity>
    );
});

export default function CalendarScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { selectedDate, source, setLiturgicalContext } = useAppStore();
    const listRef = useRef<FlatList>(null);
    
    const [isPickerVisible, setPickerVisible] = useState(false);

    // Timeline Data: 1 year before, 1 year after today
    const timelineData = useMemo(() => {
        const start = new Date(todayIso).getTime() - (INITIAL_DAYS / 2) * DAY_MILLIS;
        return Array.from({ length: INITIAL_DAYS }).map((_, i) => {
            return new Date(start + i * DAY_MILLIS).toISOString().slice(0, 10);
        });
    }, []);

    const selectedInfo = useMemo(() => getCalendar(selectedDate), [selectedDate]);
    const presentation = useMemo(() => getDatePresentation(selectedDate), [selectedDate]);

    useEffect(() => {
        const index = timelineData.indexOf(selectedDate);
        if (index !== -1) {
            setTimeout(() => {
                listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.3 });
            }, 100);
        }
    }, []);

    const handleJumpToToday = () => {
        setLiturgicalContext(todayIso, source);
        const index = timelineData.indexOf(todayIso);
        if (index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
        }
    };

    const handleDateSelect = (date: string) => {
        setLiturgicalContext(date, source);
    };

    const [pickerYear, setPickerYear] = useState(new Date(selectedDate).getFullYear());
    const [pickerMonth, setPickerMonth] = useState(new Date(selectedDate).getMonth());

    // Update picker state when selectedDate changes from row taps or "Today"
    useEffect(() => {
        const d = new Date(`${selectedDate}T12:00:00`);
        setPickerYear(d.getFullYear());
        setPickerMonth(d.getMonth());
    }, [selectedDate]);

    const years = Array.from({ length: 41 }).map((_, i) => 2000 + i);
    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const confirmPickerDate = () => {
        // Use string construction to avoid timezone shifts from .toISOString()
        const newDate = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-01`;
        setLiturgicalContext(newDate, source);
        const index = timelineData.findIndex(d => d.startsWith(`${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}`));
        if (index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
        }
        setPickerVisible(false);
    };

    const navigateToReading = () => {
        if (source === 'readings') router.push({ pathname: '/readings', params: { date: selectedDate } });
        else if (source === 'divineOffice') router.push({ pathname: '/divine-office', params: { date: selectedDate } });
        else router.push('/inspiration');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                leftElement={
                    <TouchableOpacity onPress={() => setPickerVisible(true)} className="flex-row items-center ml-4">
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg">
                            {months[new Date(selectedDate).getMonth()]} {new Date(selectedDate).getFullYear()}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textPrimary} className="ml-1" />
                    </TouchableOpacity>
                }
                rightElement={
                    <TouchableOpacity onPress={handleJumpToToday} className="mr-4">
                        <View style={{ backgroundColor: colors.surfaceElevated }} className="px-6 py-3 rounded-3xl">
                            <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] uppercase tracking-wider">Today</Text>
                        </View>
                    </TouchableOpacity>
                }
            />

            <View style={{ flex: 1 }}>
                <FlatList
                    ref={listRef}
                    data={timelineData}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TimelineRow 
                            date={item} 
                            isSelected={selectedDate === item} 
                            onSelect={handleDateSelect} 
                        />
                    )}
                    initialNumToRender={20}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    getItemLayout={(data, index) => ({ length: 70, offset: 70 * index, index })}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Detailed Selection Summary (Bottom Sticky) */}
            <View 
                style={[
                    styles.selectionFooter, 
                    { 
                        backgroundColor: colors.surface, 
                        borderTopColor: colors.border,
                        shadowColor: '#000',
                        paddingBottom: Math.max(insets.bottom, 40),
                        paddingTop: Math.max(insets.top, 40),
                    }
                ]}
                className="shadow-2xl"
            >
                <View className="flex-row justify-between items-center px-6 pt-5">
                    <View style={{ flex: 1, marginRight: 16 }}>
                        <LiturgicalBadge label={presentation?.badgeLabel ?? 'DAY'} color={selectedInfo?.color} />
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl mt-2" numberOfLines={1}>
                            {selectedInfo?.celebration}
                        </Text>
                    </View>
                    <Button onPress={navigateToReading} size="sm" className="px-7 rounded-2xl h-12">
                        <Text className="font-sans font-black text-sm">Open Day</Text>
                    </Button>
                </View>
            </View>

            <Modal visible={isPickerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerVisible(false)} />
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
                        <View className="flex-row justify-between items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text style={{ color: colors.textSecondary }} className="font-sans font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg">Select Date</Text>
                            <TouchableOpacity onPress={confirmPickerDate}>
                                <Text style={{ color: colors.accent }} className="font-sans font-bold">Done</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View className="flex-row h-64">
                            <FlatList 
                                data={months}
                                keyExtractor={item => item}
                                className="flex-1"
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity 
                                        onPress={() => setPickerMonth(index)}
                                        className="h-12 justify-center items-center"
                                        style={pickerMonth === index ? { backgroundColor: `${colors.accent}15` } : {}}
                                    >
                                        <Text style={{ color: pickerMonth === index ? colors.accent : colors.textPrimary }} className="font-serif text-lg">
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <FlatList 
                                data={years}
                                keyExtractor={item => String(item)}
                                className="flex-1"
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        onPress={() => setPickerYear(item)}
                                        className="h-12 justify-center items-center"
                                        style={pickerYear === item ? { backgroundColor: `${colors.accent}15` } : {}}
                                    >
                                        <Text style={{ color: pickerYear === item ? colors.accent : colors.textPrimary }} className="font-serif text-lg">
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
    dateColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 10,
    },
    contentColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    selectionFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: StyleSheet.hairlineWidth,
        elevation: 10,
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
    }
});
