import { getCalendar } from './liturgicalData';
import { resolveCelebration } from './calendarEngine';
import divineOfficeData from '../../data/divineOffice.json';
import passageCache from '../../data/passageCache.json';

// ─── Cycle data (keyed by liturgical key, not date) ───────────────────────
// This file is built by: node scripts/scrape-divine-office-cycle.mjs
// It maps e.g. "OrdinaryTime_Week3_Monday" → scraped office content
let divineOfficeCycleData: Record<string, any> = {};
try {
    // Dynamic require so the app still boots if the file doesn't exist yet
    divineOfficeCycleData = require('../../data/divineOfficeCycle.json') as Record<string, any>;
} catch {
    // File not yet generated — will gracefully fall back to computed content
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OfficeParts {
    invitatory?: { heading?: string; text: string };
    introduction?: string;
    hymn?: { text: string };
    psalmody: { heading?: string; antiphon?: string; text: string; antiphon2?: string }[];
    reading?: { reference?: string; text: string };
    responsory?: { text: string };
    gospelCanticle?: { heading?: string; antiphon?: string; text: string; antiphon2?: string };
    intercessions?: { text: string };
    lordsPrayer?: { text: string };
    concludingPrayer?: { text: string };
}

export interface StructuredOffice {
    date: string;
    office: string;
    celebration: string;
    parts: OfficeParts;
}

// ─── Validation ────────────────────────────────────────────────────────────

export function validateOfficeData(data: StructuredOffice): boolean {
    if (!data.date || !data.office || !data.celebration) return false;
    if (!data.parts) return false;
    if (!Array.isArray(data.parts.psalmody)) return false;
    return true;
}

// ─── Day resolution ────────────────────────────────────────────────────────

export function resolveLiturgicalDay(date: string) {
    const calendar = getCalendar(date);
    if (!calendar) return { date, primary: { celebration: 'Ordinary Time', type: 'weekday', season: 'ordinary' } };
    return {
        date,
        calendar,
        primary: {
            celebration: calendar.celebration,
            type: calendar.celebrationType || 'weekday',
            season: calendar.season ? calendar.season.toLowerCase() : 'ordinary',
        },
    };
}

// ─── Text helpers ──────────────────────────────────────────────────────────

const sanitizeText = (text?: string | null) =>
    (text ?? '').replace(/[ \t]+/g, ' ').trim();

const getPassage = (reference?: string | null): { text: string; verses?: string[] } | null => {
    if (!reference) return null;
    const passages = passageCache as Record<string, any>;
    const normalized = reference.trim().replace(/\.$/, '').replace(/\s+/g, ' ');
    if (passages[normalized]) return passages[normalized];

    // Try splitting on semicolons/pipes for compound refs
    const parts = normalized.split(/[;|]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
        const resolved = parts.map(p => passages[p]).filter(Boolean);
        if (resolved.length) {
            return {
                text: resolved.map((e: any) => sanitizeText(e.text)).filter(Boolean).join('\n\n'),
                verses: resolved.flatMap((e: any) => e.verses ?? []),
            };
        }
    }
    return null;
};

// ─── Season-appropriate hymn texts ────────────────────────────────────────

const SEASONAL_HYMNS: Record<string, Record<string, string>> = {
    Advent: {
        morningPrayer:
            'Creator of the stars of night,\nThy people\'s everlasting light,\nJesu, Redeemer, save us all;\nHear thou thy servants when they call.\n\nThou, grieving that the ancient curse\nShould doom to death a universe,\nHast found the medicine, full of grace,\nTo save and heal a ruined race.',
        eveningPrayer:
            'O come, O come, Emmanuel,\nAnd ransom captive Israel,\nThat mourns in lonely exile here\nUntil the Son of God appear.\n\nRejoice! Rejoice! Emmanuel\nShall come to thee, O Israel.',
        nightPrayer:
            'Before the ending of the day,\nCreator of the world, we pray\nThat with thy wonted favour thou\nWouldst be our guard and keeper now.',
        default:
            'O come, O Wisdom from on high,\nWho orderest all things mightily;\nTo us the path of knowledge show,\nAnd teach us in her ways to go.',
    },
    Christmas: {
        morningPrayer:
            'A great and mighty wonder,\nA full and holy cure!\nThe Virgin bears the Infant\nWith virgin-honour pure.\n\nRepeat the hymn again:\n"To God on high be glory,\nAnd peace on earth to men!"',
        eveningPrayer:
            'Of the Father\'s love begotten\nEre the worlds began to be,\nHe is Alpha and Omega,\nHe the source, the ending he.',
        nightPrayer:
            'Before the ending of the day,\nCreator of the world, we pray\nThat with thy wonted favour thou\nWouldst be our guard and keeper now.',
        default:
            'Come, thou Redeemer of the earth,\nAnd manifest thy virgin birth;\nLet every age adoring fall;\nSuch birth befits the God of all.',
    },
    Lent: {
        morningPrayer:
            'Now in the sun\'s new dawning ray\nLowly of heart, our God we pray\nThat he, the unblemished Lamb who died,\nMay shield us with his wounded side.\n\nFor this is our redemption\'s hour,\nWhen holy love outweighs sin\'s power;\nFor this the ransomed soul is free\nTo live with God eternally.',
        eveningPrayer:
            'O merciful Creator, hear!\nTo us in penitence draw near;\nGranted our foes may work no ill\nThrough thy protection and goodwill.',
        nightPrayer:
            'Before the ending of the day,\nCreator of the world, we pray\nThat with thy wonted favour thou\nWouldst be our guard and keeper now.',
        default:
            'The fast, as taught by holy lore,\nWe keep in solemn course once more;\nThe fast to man by God ordained,\nWith ancient lauds and thanks maintained.',
    },
    Easter: {
        morningPrayer:
            'The golden sun lights up the sky,\nThe morning star proclaims on high\nThat Christ is risen from the dead\nAnd death is conquered, as he said.\n\nAlleluia, alleluia!\nPraise to the risen Lord;\nAlleluia, alleluia!\nPraise to the living Word.',
        eveningPrayer:
            'O sons and daughters, let us sing!\nThe King of heaven, the glorious King,\nO\'er death today rose triumphing.\nAlleluia!\n\nThat Easter morn, at break of day,\nThe faithful women went their way\nTo seek the tomb where Jesus lay.\nAlleluia!',
        nightPrayer:
            'The day is past and over;\nAll thanks, O Lord, to thee;\nI pray thee that offenceless\nThe hours of dark may be.',
        default:
            'Now let the earth with joy resound,\nAnd heaven reflect the chorus;\nLet voice of angels join with ours\nTo sing the chorus for us:\nAlleluia, alleluia!',
    },
    OrdinaryTime: {
        morningPrayer:
            'Splendour of God\'s glory bright,\nWho bringest forth the light from light;\nO Light of light, light\'s living spring;\nTrue Day, all days illumining.\n\nCome, Holy Sun of heavenly love,\nShower down thy radiance from above;\nAnd to our inward hearts convey\nThe Holy Spirit\'s cloudless ray.',
        eveningPrayer:
            'O blest Creator, God most high,\nRuler of all the earth and sky,\nWho robing day in light, hast made\nThe gracious gift of evening shade.\n\nThat night no evil can betide;\nWe pray thee, hear us, Lord and guide;\nGrant us, beneath thy sheltering care,\nA respite from our toil and prayer.',
        nightPrayer:
            'Before the ending of the day,\nCreator of the world, we pray\nThat with thy wonted favour thou\nWouldst be our guard and keeper now.\n\nFrom all ill dreams defend our sight,\nFrom fears and terrors of the night;\nWithhold from us our ghostly foe,\nThat spot of sin we may not know.',
        default:
            'O God of light, the dawning day\nBrings forth creation\'s joyous ray;\nWe lift our hearts in praise to thee,\nFor all thy love and majesty.',
    },
};

function getSeasonalHymn(seasonKey: string, officeKey: string): string {
    const season = SEASONAL_HYMNS[seasonKey] ?? SEASONAL_HYMNS.OrdinaryTime;
    return season[officeKey] ?? season.default ?? SEASONAL_HYMNS.OrdinaryTime.default;
}

// ─── Season-appropriate intercessions ─────────────────────────────────────

const SEASONAL_INTERCESSIONS: Record<string, string> = {
    Advent:
        'Lord, come and save us.\n— Come, Lord Jesus.\n\nFor your Church, that she may prepare the way of the Lord.\n— Come, Lord Jesus.\n\nFor all who wait in darkness; may your light shine upon them.\n— Come, Lord Jesus.\n\nFor the gift of your peace in our hearts and in our world.\n— Come, Lord Jesus.',
    Christmas:
        'Lord, you came to bring light to the world.\n— Glory to God in the highest!\n\nFor all who are lonely or forgotten; may they know your presence.\n— Glory to God in the highest!\n\nFor the poor and the vulnerable; protect them through your grace.\n— Glory to God in the highest!',
    Lent:
        'Lord, have mercy on us.\n— Lord, have mercy.\n\nFor the grace to turn back to you with our whole heart.\n— Lord, have mercy.\n\nFor those preparing for Baptism at Easter.\n— Lord, have mercy.\n\nFor the poor and suffering; in them we serve you.\n— Lord, have mercy.',
    Easter:
        'Risen Lord, hear our prayer.\n— Alleluia!\n\nFor your Church, that she may proclaim your Resurrection boldly.\n— Alleluia!\n\nFor those who suffer, that they may share in your victory over death.\n— Alleluia!\n\nFor all the faithful departed, that they may rise to eternal life.\n— Alleluia!',
    OrdinaryTime:
        'Lord, hear our prayer.\n— Lord, graciously hear us.\n\nFor your holy Church, that she may grow in unity and love.\n— Lord, graciously hear us.\n\nFor civil leaders, that they may govern with wisdom and justice.\n— Lord, graciously hear us.\n\nFor the sick and suffering; strengthen them by your grace.\n— Lord, graciously hear us.',
};

// ─── Full Lord's Prayer ────────────────────────────────────────────────────

const LORDS_PRAYER =
    'Our Father, who art in heaven,\nhallowed be thy name;\nthy kingdom come,\nthy will be done\non earth as it is in heaven.\n\nGive us this day our daily bread,\nand forgive us our trespasses,\nas we forgive those who trespass against us;\nand lead us not into temptation,\nbut deliver us from evil. Amen.';

// ─── Season-appropriate concluding prayers ────────────────────────────────

const SEASONAL_CONCLUDING_PRAYERS: Record<string, Record<string, string>> = {
    Advent: {
        morningPrayer: 'Lord our God, grant that we may be ready to receive Christ when he comes in glory, and to share in his heavenly kingdom, where he lives and reigns with you and the Holy Spirit, one God, for ever and ever. Amen.',
        eveningPrayer: 'Almighty God, give us grace to cast away the works of darkness and put on the armour of light, now in the time of this mortal life, in which your Son Jesus Christ came to us in great humility; so that on the last day, when he shall come again in his glorious majesty to judge the living and the dead, we may rise to the life immortal. Amen.',
        default: 'Father of mercy, fill us with your Holy Spirit as we await the coming of your Son, our Lord Jesus Christ. Amen.',
    },
    Christmas: {
        morningPrayer: 'O God, who wonderfully created, and yet more wonderfully restored, the dignity of human nature: grant that we may share the divine life of him who humbled himself to share our humanity, your Son Jesus Christ, who lives and reigns with you and the Holy Spirit, one God for ever and ever. Amen.',
        default: 'Lord God, we praise you for the light of creation, the light of revelation, and the light of redemption. Through Jesus Christ our Lord. Amen.',
    },
    Lent: {
        morningPrayer: 'Father, through our observance of Lent, help us to understand the meaning of your Son\'s death and resurrection, and teach us to reflect it in our lives. Grant this through our Lord Jesus Christ, your Son, who lives and reigns with you and the Holy Spirit, one God for ever and ever. Amen.',
        eveningPrayer: 'Lord God, you have called your servants to ventures of which we cannot see the ending, by paths as yet untrodden, through perils unknown. Give us faith to go out with good courage, not knowing where we go, but only that your hand is leading us and your love supporting us. Amen.',
        default: 'Lord, protect us in our struggle against evil. As we begin the discipline of Lent, make this season holy by our self-denial. We ask this through Christ our Lord. Amen.',
    },
    Easter: {
        morningPrayer: 'God our Father, by raising Christ your Son you conquered the power of death and opened for us the way to eternal life. Let our celebration today raise us up and renew our lives by the Spirit that is within us. Grant this through our Lord Jesus Christ, your Son, who lives and reigns with you and the Holy Spirit, one God for ever and ever. Amen.',
        eveningPrayer: 'Lord God, whose Son our Saviour Jesus Christ triumphed over the powers of death and prepared for us our place in the new Jerusalem: grant that we, who have this day given thanks for his resurrection, may praise you in that City of which he is the light, and where he lives and reigns for ever and ever. Amen.',
        default: 'Almighty and eternal God, you have restored to us the gift of eternal life through the triumph of the Risen Christ. Grant us this day to live in his risen life, through Christ our Lord. Amen.',
    },
    OrdinaryTime: {
        morningPrayer: 'Lord, in your mercy hear our morning prayer, and through this day guide us in your ways. May all we think, say, and do be for your greater glory. Through Christ our Lord. Amen.',
        eveningPrayer: 'Lord God, whose mercy never fails, as the day draws to a close, accept our evening sacrifice of praise. Protect us through the night, and awaken us to renewed service of you. Through Christ our Lord. Amen.',
        nightPrayer: 'Visit this house, we pray, O Lord; drive far from it all the snares of the enemy. May your holy angels dwell here to keep us in peace, and may your blessing be always upon us. Through Christ our Lord. Amen.',
        default: 'O God, in your providence guide all things, hear our prayer and grant that we may live this day in your peace. Through Christ our Lord. Amen.',
    },
};

function getConcludingPrayer(seasonKey: string, officeKey: string): string {
    const season = SEASONAL_CONCLUDING_PRAYERS[seasonKey] ?? SEASONAL_CONCLUDING_PRAYERS.OrdinaryTime;
    return season[officeKey] ?? season.default ?? SEASONAL_CONCLUDING_PRAYERS.OrdinaryTime.default;
}

// ─── Gospel canticle texts from local scripture.json ──────────────────────

const GOSPEL_CANTICLE_REFS: Record<string, { name: string; ref: string }> = {
    morningPrayer: { name: 'Benedictus', ref: 'Luke 1:68-79' },
    eveningPrayer: { name: 'Magnificat', ref: 'Luke 1:46-55' },
    nightPrayer: { name: 'Nunc Dimittis', ref: 'Luke 2:29-32' },
};

// ─── Psalter week / scope helpers ─────────────────────────────────────────

const getPsalterWeek = (calendar: any): number => {
    const week = calendar?.week && calendar.week > 0 ? calendar.week : 1;
    return ((week - 1) % 4) + 1;
};

const getSeasonKey = (calendar: any): string => {
    const s = calendar?.season ?? '';
    if (s === 'Advent') return 'Advent';
    if (s === 'Christmas') return 'Christmas';
    if (s === 'Lent') return 'Lent';
    if (s === 'Easter') return 'Easter';
    return 'OrdinaryTime';
};

// ─── Core builder ──────────────────────────────────────────────────────────

export function buildStructuredOffice(date: string, officeKey: string): StructuredOffice | null {
    const resolvedDay = resolveLiturgicalDay(date);
    const { calendar, primary } = resolvedDay;
    if (!calendar) return null;

    const liturgicalKey = calendar.key;
    const seasonKey = getSeasonKey(calendar);
    const officeMeta = divineOfficeData as Record<string, any>;

    // ── Priority 1: High-fidelity scraped cycle data (keyed by liturgical key) ──
    if (liturgicalKey && divineOfficeCycleData[liturgicalKey]?.offices?.[officeKey]) {
        const scrapedPayload = divineOfficeCycleData[liturgicalKey].offices[officeKey];
        if (scrapedPayload?.parts && Array.isArray(scrapedPayload.parts.psalmody)) {
            const structuredOffice: StructuredOffice = {
                date,
                office: officeKey,
                celebration: primary.celebration,
                parts: scrapedPayload.parts,
            };
            if (validateOfficeData(structuredOffice)) return structuredOffice;
        }
    }

    // ── Priority 2: Computed fallback using real liturgical data ──────────
    const psalterWeek = getPsalterWeek(calendar);
    const isSunday = calendar.day === 'Sunday';
    const isSolemnity = primary.type?.toLowerCase().includes('solemnity');
    const scope = isSunday || isSolemnity ? 'sunday' : 'weekday';

    const psalterEntry = officeMeta.psalter?.[`week${psalterWeek}`]?.[officeKey];
    let psalmRefs: string[] = psalterEntry?.[scope]?.psalms ?? [];

    // Night prayer uses fixed day-of-week psalms
    if (officeKey === 'nightPrayer') {
        const complineRefs = officeMeta.complineByDay?.[calendar.day]?.psalms;
        if (complineRefs?.length) psalmRefs = complineRefs;
    }

    // Triduum overrides
    if (primary.season === 'lent') {
        if (primary.celebration === 'Good Friday' && officeKey === 'morningPrayer') {
            psalmRefs = ['Psalm 51', 'Habakkuk 3:2-4, 13a, 15-19', 'Psalm 147:12-20'];
        }
        if (primary.celebration === 'Holy Saturday' && officeKey === 'morningPrayer') {
            psalmRefs = ['Psalm 64', 'Isaiah 38:10-14, 17-20', 'Psalm 150'];
        }
    }

    // Opening versicle (Introduction)
    const introduction = officeKey === 'nightPrayer'
        ? 'God, come to my assistance.\nLord, make haste to help me.\nGlory to the Father, and to the Son, and to the Holy Spirit:\nas it was in the beginning, is now, and will be for ever. Amen.\nAlleluia.'
        : 'O God, come to our aid.\nO Lord, make haste to help us.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\nAs it was in the beginning, is now, and ever shall be, world without end. Amen.';

    // Psalmody — use passage cache text when available, else named fallback
    const psalmodyParts = psalmRefs.map((ref: string, idx: number) => {
        const passage = getPassage(ref);
        const text = sanitizeText(passage?.text) || `[ ${ref} — prayed from memory ]`;
        return {
            heading: ref,
            antiphon: '',  // Proper antiphons come from scraped data; leave empty for computed fallback
            text,
        };
    });

    // Reading from season defaults
    const seasonEntry = officeMeta.seasons?.[seasonKey];
    const readingRef = seasonEntry?.readings?.[officeKey] ?? seasonEntry?.readings?.morningPrayer ?? null;
    let reading: OfficeParts['reading'];
    if (readingRef) {
        const passage = getPassage(readingRef);
        reading = {
            reference: readingRef,
            text: sanitizeText(passage?.text) || 'Brothers and sisters: Let the word of Christ dwell in you richly, as in all wisdom you teach and admonish one another.',
        };
    }

    // Gospel Canticle (Benedictus / Magnificat / Nunc Dimittis)
    const canticleInfo = GOSPEL_CANTICLE_REFS[officeKey];
    let gospelCanticle: OfficeParts['gospelCanticle'];
    if (canticleInfo) {
        const passage = getPassage(canticleInfo.ref);
        gospelCanticle = {
            heading: canticleInfo.name,
            antiphon: '',  // Proper antiphon depends on the specific day; left empty in fallback
            text: sanitizeText(passage?.text) || 'My soul glorifies the Lord,\nmy spirit rejoices in God, my Saviour.',
        };
    }

    const parts: OfficeParts = {
        introduction,
        hymn: { text: getSeasonalHymn(seasonKey, officeKey) },
        psalmody: psalmodyParts,
        ...(reading ? { reading } : {}),
        responsory: { text: getResponsory(seasonKey, officeKey) },
        ...(gospelCanticle ? { gospelCanticle } : {}),
    };

    // Intercessions and Lord's Prayer (not at Night Prayer)
    if (officeKey !== 'nightPrayer') {
        parts.intercessions = { text: SEASONAL_INTERCESSIONS[seasonKey] ?? SEASONAL_INTERCESSIONS.OrdinaryTime };
        parts.lordsPrayer = { text: LORDS_PRAYER };
    }

    parts.concludingPrayer = { text: getConcludingPrayer(seasonKey, officeKey) };

    const structuredOffice: StructuredOffice = {
        date,
        office: officeKey,
        celebration: primary.celebration,
        parts,
    };

    validateOfficeData(structuredOffice);
    return structuredOffice;
}

// ─── Responsory by season / office ────────────────────────────────────────

function getResponsory(seasonKey: string, officeKey: string): string {
    const table: Record<string, Record<string, string>> = {
        Advent: {
            morningPrayer: 'Christ, Son of the living God, have mercy on us.\n— Christ, Son of the living God, have mercy on us.\nYou who are to come, have mercy on us.\n— Have mercy on us.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Christ, Son of the living God, have mercy on us.',
            eveningPrayer: 'Our King and Saviour draws near.\n— Come, let us worship him.\nOur King and Saviour draws near.\n— Come, let us worship him.\nHe will be called Emmanuel.\n— Come, let us worship him.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Come, let us worship him.',
            default: 'Come, Lord, do not delay.\n— Come, Lord, do not delay.\nForgive the sins of your people.\n— Do not delay.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Come, Lord, do not delay.',
        },
        Lent: {
            morningPrayer: 'Have mercy on me, O God, in your kindness.\n— In your compassion blot out my offence.\nWash me more and more from my guilt.\n— Blot out my offence.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— In your compassion blot out my offence.',
            default: 'Save us, Lord our God;\n— Save us, Lord our God.\nRedeem us from all our sins.\n— Lord our God.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Save us, Lord our God.',
        },
        Easter: {
            morningPrayer: 'This is the day the Lord has made, alleluia.\n— Let us rejoice and be glad, alleluia.\nThis is the day the Lord has made.\n— Let us rejoice and be glad.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Let us rejoice and be glad, alleluia.',
            default: 'Christ is risen from the dead, alleluia.\n— Christ is risen from the dead, alleluia.\nTrampling down death by death.\n— Alleluia.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Christ is risen from the dead, alleluia.',
        },
        default: {
            morningPrayer: 'O Lord, open my lips.\n— And my mouth will declare your praise.\nMake haste, O God, to rescue me.\n— O Lord, make haste to help me.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— As it was in the beginning, is now, and ever shall be.',
            eveningPrayer: 'Into your hands, O Lord, I commend my spirit.\n— Into your hands, O Lord, I commend my spirit.\nYou have redeemed us, Lord God of truth.\n— I commend my spirit.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Into your hands, O Lord, I commend my spirit.',
            nightPrayer: 'Into your hands, Lord, I commend my spirit.\n— Into your hands, Lord, I commend my spirit.\nYou will redeem us, Lord God of truth.\n— I commend my spirit.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— Into your hands, Lord, I commend my spirit.',
            default: 'O Lord, hear my prayer.\n— And let my cry come before you.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— As it was in the beginning, is now, and ever shall be.',
        },
    };

    const seasonTable = table[seasonKey] ?? table.default;
    return seasonTable[officeKey] ?? seasonTable.default ?? table.default.default;
}
