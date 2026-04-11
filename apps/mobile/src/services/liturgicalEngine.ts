/**
 * Liturgical Engine for the St. Kizito App
 * Handles calculation of liturgical seasons, cycles, and feast days for any given date.
 * Based on the General Instruction of the Roman Missal (GIRM).
 */

export type LiturgicalSeason = 'Advent' | 'Christmas' | 'Lent' | 'Easter' | 'Ordinary Time' | 'Paschal Triduum';
export type LiturgicalYear = 'A' | 'B' | 'C';
export type CelebrationType = 'Solemnity' | 'Feast' | 'Memorial' | 'Optional Memorial' | 'Weekday';

export interface LiturgicalDay {
    date: string; // ISO format YYYY-MM-DD
    season: LiturgicalSeason;
    year: LiturgicalYear;
    week: number;
    dayOfWeek: string;
    celebration: string;
    celebrationType: CelebrationType;
    color: string;
    rank: number; // For conflict resolution
}

/**
 * Calculates Easter Sunday for a given year using Butcher's Algorithm.
 */
export function getEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/**
 * Calculates the start of Advent for a given year (Dec 25 - 4 Sundays).
 */
export function getAdventStart(year: number): Date {
    const christmas = new Date(year, 11, 25);
    const christmasDayOfWeek = christmas.getDay(); // 0 is Sunday
    const daysToSubtract = (christmasDayOfWeek === 0 ? 28 : christmasDayOfWeek + 21);
    const adventStart = new Date(year, 11, 25);
    adventStart.setDate(christmas.getDate() - daysToSubtract);
    return adventStart;
}

/**
 * Checks if a date is between two dates (inclusive).
 */
function isBetween(target: Date, start: Date, end: Date): boolean {
    const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return t >= s && t <= e;
}

/**
 * Main function to resolve liturgical info for any date.
 */
export function getLiturgicalDay(dateStr: string): LiturgicalDay {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // 1. Determine Liturgical Year (Starts first Sunday of Advent of the previous calendar year)
    const adventStartCurrent = getAdventStart(year);
    const liturgicalYearInt = (date >= adventStartCurrent) ? year + 1 : year;
    const yearCycle: LiturgicalYear[] = ['C', 'A', 'B']; // (2022+1)%3 = 2 -> B (2022 is C). Wait. 
    // Let's use 2023 as A. (2023 - 2023) % 3 = 0 -> A.
    const yearType = yearCycle[(liturgicalYearInt - 2022) % 3];
    
    // 2. Determine Season
    const easter = getEasterSunday(year);
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);
    
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    
    const baptismOfTheLord = new Date(year, 0, 13); // Simple approximation
    // Adjust Baptism of the Lord: Sunday after Epiphany (Jan 6)
    const epiphany = new Date(year, 0, 6);
    const epiphanySun = new Date(epiphany);
    if (epiphany.getDay() !== 0) {
        epiphanySun.setDate(epiphany.getDate() + (7 - epiphany.getDay()));
    }
    const actualBaptism = new Date(epiphanySun);
    actualBaptism.setDate(epiphanySun.getDate() + 1);

    const adventPrev = getAdventStart(year - 1);
    const christmasPrev = new Date(year - 1, 11, 25);
    
    let season: LiturgicalSeason = 'Ordinary Time';
    let celebration = '';
    let celebrationType: CelebrationType = 'Weekday';
    let color = 'green';
    let week = 1;

    // Check Seasons sequentially
    if (isBetween(date, adventPrev, new Date(year - 1, 11, 24))) {
        season = 'Advent';
        color = 'purple';
        const diff = Math.floor((date.getTime() - adventPrev.getTime()) / (1000 * 60 * 60 * 24 * 7));
        week = diff + 1;
    } else if (isBetween(date, christmasPrev, actualBaptism)) {
        season = 'Christmas';
        color = 'white';
        week = 1; // Simplify
    } else if (isBetween(date, ashWednesday, new Date(easter.getTime() - 1000 * 60 * 60 * 24))) {
        season = 'Lent';
        color = 'purple';
        const diff = Math.floor((date.getTime() - ashWednesday.getTime()) / (1000 * 60 * 60 * 24 * 7));
        week = diff + 1;
    } else if (isBetween(date, easter, pentecost)) {
        season = 'Easter';
        color = 'white';
        const diff = Math.floor((date.getTime() - easter.getTime()) / (1000 * 60 * 60 * 24 * 7));
        week = diff + 1;
    } else if (isBetween(date, adventStartCurrent, new Date(year, 11, 24))) {
        season = 'Advent';
        color = 'purple';
        const diff = Math.floor((date.getTime() - adventStartCurrent.getTime()) / (1000 * 60 * 60 * 24 * 7));
        week = diff + 1;
    } else {
        season = 'Ordinary Time';
        color = 'green';
        // OT has two parts. 
        if (date < ashWednesday) {
            // Part 1
            const diff = Math.floor((date.getTime() - actualBaptism.getTime()) / (1000 * 60 * 60 * 24 * 7));
            week = diff + 1;
        } else {
            // Part 2
            // Week 34 is always the week before Advent.
            const nextAdvent = getAdventStart(year);
            const diffFromEnd = Math.floor((nextAdvent.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 7));
            week = 34 - diffFromEnd;
        }
    }

    // Days of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    
    // Title construction
    if (dayName === 'Sunday') {
        celebration = `${week}${getOrdinal(week)} Sunday in ${season}`;
        celebrationType = 'Solemnity';
    } else {
        celebration = `${dayName} of the ${week}${getOrdinal(week)} week of ${season}`;
        celebrationType = 'Weekday';
    }

    // Basic Solemnities (Fixed)
    const monthDay = `${month + 1}-${day}`;
    const fixedFeasts: any = {
        '1-1': { title: 'Solemnity of Mary, Mother of God', type: 'Solemnity', color: 'white' },
        '1-6': { title: 'Epiphany of the Lord', type: 'Solemnity', color: 'white' },
        '2-2': { title: 'Presentation of the Lord', type: 'Feast', color: 'white' },
        '3-19': { title: 'St. Joseph, Spouse of the Blessed Virgin Mary', type: 'Solemnity', color: 'white' },
        '3-25': { title: 'Annunciation of the Lord', type: 'Solemnity', color: 'white' },
        '6-24': { title: 'Nativity of St. John the Baptist', type: 'Solemnity', color: 'white' },
        '6-29': { title: 'Sts. Peter and Paul, Apostles', type: 'Solemnity', color: 'red' },
        '8-6': { title: 'Transfiguration of the Lord', type: 'Feast', color: 'white' },
        '8-15': { title: 'Assumption of the Blessed Virgin Mary', type: 'Solemnity', color: 'white' },
        '9-14': { title: 'Exaltation of the Holy Cross', type: 'Feast', color: 'red' },
        '11-1': { title: 'All Saints', type: 'Solemnity', color: 'white' },
        '11-2': { title: 'The Commemoration of All the Faithful Departed (All Souls)', type: 'Solemnity', color: 'purple' },
        '11-9': { title: 'Dedication of the Lateran Basilica', type: 'Feast', color: 'white' },
        '12-8': { title: 'Immaculate Conception of the Blessed Virgin Mary', type: 'Solemnity', color: 'white' },
        '12-25': { title: 'The Nativity of the Lord (Christmas)', type: 'Solemnity', color: 'white' },
        '12-26': { title: 'St. Stephen, First Martyr', type: 'Feast', color: 'red' },
        '12-27': { title: 'St. John, Apostle and Evangelist', type: 'Feast', color: 'white' },
        '12-28': { title: 'The Holy Innocents, Martyrs', type: 'Feast', color: 'red' },
    };

    if (fixedFeasts[monthDay]) {
        celebration = fixedFeasts[monthDay].title;
        celebrationType = fixedFeasts[monthDay].type;
        color = fixedFeasts[monthDay].color;
    }

    return {
        date: dateStr,
        season,
        year: yearType,
        week,
        dayOfWeek: dayName,
        celebration,
        celebrationType,
        color,
        rank: getRankValue(celebrationType)
    };
}

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRankValue(type: CelebrationType): number {
    switch (type) {
        case 'Solemnity': return 5;
        case 'Feast': return 4;
        case 'Memorial': return 3;
        case 'Optional Memorial': return 2;
        case 'Weekday': return 1;
        default: return 0;
    }
}
