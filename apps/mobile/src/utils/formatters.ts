export function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

export function formatPremiumDate(dateString: string) {
    const date = new Date(`${dateString}T12:00:00`);
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    const day = date.getDate();
    
    return `${dayName} ${day}${getOrdinalSuffix(day)} ${monthName}`;
}