import { useLocalSearchParams } from 'expo-router';
import ReadingsScreen from '../(tabs)/readings';

/**
 * A specific day's readings, opened from Favourites, History, the Calendar, or a deep link.
 *
 * This route renders the readings screen as a *controlled* view of the route's `date` param and
 * deliberately does NOT touch the global `selectedDate`. Writing global state here was the root
 * cause of the P1 "shared state" bugs — opening a bookmarked reading changed the Readings and
 * Divine Office tabs to that date. The screen now takes the date as a prop instead.
 */
export default function ReadingByDateScreen() {
	const { date } = useLocalSearchParams<{ date?: string | string[] }>();
	const selected = Array.isArray(date) ? date[0] : date;

	return <ReadingsScreen showBack dateOverride={selected} />;
}
