import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import ReadingsScreen from '../(tabs)/readings';

export default function ReadingByDateScreen() {
	const { date } = useLocalSearchParams<{ date?: string | string[] }>();
	const setSelectedDate = useAppStore((state) => state.setSelectedDate);

	useEffect(() => {
		const selected = Array.isArray(date) ? date[0] : date;
		if (selected) {
			setSelectedDate(selected);
		}
	}, [date, setSelectedDate]);

	return <ReadingsScreen />;
}