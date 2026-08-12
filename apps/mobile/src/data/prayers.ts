/**
 * The parish prayer library.
 *
 * Before this there was no prayers section at all outside the Divine Office: the More tab promised
 * "daily tools for your prayer life" and linked only to Inspirations, Favourites, Donations and
 * Settings.
 *
 * All texts here are traditional Catholic prayers in long-standing public use — the ordinary
 * devotional patrimony of the Church, not attributed quotations. That distinction is why this file
 * can carry prayer texts directly while the daily inspiration bank is generated and verified
 * against Scripture (see scripts/generate-inspirations.mjs).
 *
 * Bundled rather than fetched: prayer is the thing a parishioner is most likely to reach for with
 * no signal — in a hospital corridor, at a graveside. The whole library is a few kilobytes, so it
 * costs nothing against the APK budget.
 */

export type PrayerCategoryId = 'daily' | 'marian' | 'devotions' | 'rosary' | 'occasions';

export interface PrayerSection {
    /** Optional heading, for prayers with named parts (the Rosary's mysteries, the Angelus verses). */
    heading?: string;
    /** Spoken by the leader, where a prayer alternates. */
    lead?: string;
    /** The response, shown in the responsory style used by the Divine Office. */
    response?: string;
    /** A continuous body of text. */
    body?: string;
}

export interface Prayer {
    slug: string;
    title: string;
    category: PrayerCategoryId;
    /** One line on when or why this prayer is prayed. */
    context: string;
    sections: PrayerSection[];
    /**
     * Set when the prayer belongs to a particular season and should be surfaced then.
     * `easter` — the Regina Caeli replaces the Angelus throughout Eastertide.
     */
    season?: 'easter' | 'advent' | 'lent';
    /** Links this prayer to a schedulable devotion reminder. */
    reminderKey?: 'angelus' | 'divine_mercy' | 'rosary';
}

export interface PrayerCategory {
    id: PrayerCategoryId;
    title: string;
    description: string;
    icon: string;
}

export const PRAYER_CATEGORIES: PrayerCategory[] = [
    {
        id: 'daily',
        title: 'Daily Prayers',
        description: 'The prayers every Catholic carries by heart.',
        icon: 'sunny-outline',
    },
    {
        id: 'marian',
        title: 'To Our Lady',
        description: 'Marian prayers and antiphons through the year.',
        icon: 'rose-outline',
    },
    {
        id: 'devotions',
        title: 'Devotions',
        description: 'The Chaplet of Divine Mercy and other devotions.',
        icon: 'heart-outline',
    },
    {
        id: 'rosary',
        title: 'The Holy Rosary',
        description: 'How to pray it, and the mysteries for each day.',
        icon: 'ellipsis-horizontal-circle-outline',
    },
    {
        id: 'occasions',
        title: 'For Particular Needs',
        description: 'Prayers for the sick, the dead, and times of trouble.',
        icon: 'people-outline',
    },
];

export const PRAYERS: Prayer[] = [
    // ── Daily ───────────────────────────────────────────────────────────────
    {
        slug: 'sign-of-the-cross',
        title: 'The Sign of the Cross',
        category: 'daily',
        context: 'How every prayer begins and ends.',
        sections: [
            { body: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.' },
        ],
    },
    {
        slug: 'our-father',
        title: 'The Our Father',
        category: 'daily',
        context: 'The prayer the Lord himself taught.',
        sections: [
            {
                body:
                    'Our Father, who art in heaven,\n' +
                    'hallowed be thy name;\n' +
                    'thy kingdom come,\n' +
                    'thy will be done\n' +
                    'on earth as it is in heaven.\n\n' +
                    'Give us this day our daily bread,\n' +
                    'and forgive us our trespasses,\n' +
                    'as we forgive those who trespass against us;\n' +
                    'and lead us not into temptation,\n' +
                    'but deliver us from evil. Amen.',
            },
        ],
    },
    {
        slug: 'hail-mary',
        title: 'The Hail Mary',
        category: 'daily',
        context: 'Prayed at the Angelus, and on every bead of the Rosary.',
        sections: [
            {
                body:
                    'Hail Mary, full of grace,\n' +
                    'the Lord is with thee.\n' +
                    'Blessed art thou amongst women,\n' +
                    'and blessed is the fruit of thy womb, Jesus.\n\n' +
                    'Holy Mary, Mother of God,\n' +
                    'pray for us sinners,\n' +
                    'now and at the hour of our death. Amen.',
            },
        ],
    },
    {
        slug: 'glory-be',
        title: 'Glory Be',
        category: 'daily',
        context: 'The doxology that closes each psalm and each decade.',
        sections: [
            {
                body:
                    'Glory be to the Father, and to the Son, and to the Holy Spirit:\n' +
                    'as it was in the beginning, is now, and ever shall be,\n' +
                    'world without end. Amen.',
            },
        ],
    },
    {
        slug: 'apostles-creed',
        title: "The Apostles' Creed",
        category: 'daily',
        context: 'The baptismal profession of faith, prayed at the start of the Rosary.',
        sections: [
            {
                body:
                    'I believe in God, the Father almighty,\n' +
                    'Creator of heaven and earth,\n' +
                    'and in Jesus Christ, his only Son, our Lord,\n' +
                    'who was conceived by the Holy Spirit,\n' +
                    'born of the Virgin Mary,\n' +
                    'suffered under Pontius Pilate,\n' +
                    'was crucified, died and was buried;\n' +
                    'he descended into hell;\n' +
                    'on the third day he rose again from the dead;\n' +
                    'he ascended into heaven,\n' +
                    'and is seated at the right hand of God the Father almighty;\n' +
                    'from there he will come to judge the living and the dead.\n\n' +
                    'I believe in the Holy Spirit,\n' +
                    'the holy catholic Church,\n' +
                    'the communion of saints,\n' +
                    'the forgiveness of sins,\n' +
                    'the resurrection of the body,\n' +
                    'and life everlasting. Amen.',
            },
        ],
    },
    {
        slug: 'act-of-contrition',
        title: 'Act of Contrition',
        category: 'daily',
        context: 'Prayed in confession, and at the end of the day.',
        sections: [
            {
                body:
                    'O my God, I am heartily sorry for having offended thee,\n' +
                    'and I detest all my sins because of thy just punishments,\n' +
                    'but most of all because they offend thee, my God,\n' +
                    'who art all good and deserving of all my love.\n\n' +
                    'I firmly resolve, with the help of thy grace,\n' +
                    'to sin no more and to avoid the near occasions of sin. Amen.',
            },
        ],
    },
    {
        slug: 'come-holy-spirit',
        title: 'Come, Holy Spirit',
        category: 'daily',
        context: 'Prayed before work, study, or any decision.',
        sections: [
            { lead: 'Come, Holy Spirit, fill the hearts of your faithful.', response: 'And kindle in them the fire of your love.' },
            { lead: 'Send forth your Spirit and they shall be created.', response: 'And you shall renew the face of the earth.' },
            {
                heading: 'Let us pray',
                body:
                    'O God, who by the light of the Holy Spirit\n' +
                    'did instruct the hearts of the faithful,\n' +
                    'grant that by the same Holy Spirit\n' +
                    'we may be truly wise and ever rejoice in his consolation.\n' +
                    'Through Christ our Lord. Amen.',
            },
        ],
    },
    {
        slug: 'guardian-angel',
        title: 'Angel of God',
        category: 'daily',
        context: 'The prayer to one’s guardian angel, often taught first to children.',
        sections: [
            {
                body:
                    'Angel of God, my guardian dear,\n' +
                    'to whom God’s love commits me here,\n' +
                    'ever this day be at my side,\n' +
                    'to light and guard, to rule and guide. Amen.',
            },
        ],
    },
    {
        slug: 'grace-before-meals',
        title: 'Grace Before and After Meals',
        category: 'daily',
        context: 'Blessing the table.',
        sections: [
            {
                heading: 'Before the meal',
                body:
                    'Bless us, O Lord, and these thy gifts,\n' +
                    'which we are about to receive from thy bounty.\n' +
                    'Through Christ our Lord. Amen.',
            },
            {
                heading: 'After the meal',
                body:
                    'We give thee thanks, almighty God,\n' +
                    'for all thy benefits, who livest and reignest for ever and ever. Amen.',
            },
        ],
    },

    // ── Marian ──────────────────────────────────────────────────────────────
    {
        slug: 'angelus',
        title: 'The Angelus',
        category: 'marian',
        context: 'Prayed at six in the morning, at noon, and at six in the evening — outside Eastertide.',
        reminderKey: 'angelus',
        sections: [
            { lead: 'The Angel of the Lord declared unto Mary.', response: 'And she conceived of the Holy Spirit.' },
            { heading: 'Hail Mary', body: 'Hail Mary, full of grace…' },
            { lead: 'Behold the handmaid of the Lord.', response: 'Be it done unto me according to thy word.' },
            { heading: 'Hail Mary', body: 'Hail Mary, full of grace…' },
            { lead: 'And the Word was made flesh.', response: 'And dwelt among us.' },
            { heading: 'Hail Mary', body: 'Hail Mary, full of grace…' },
            { lead: 'Pray for us, O holy Mother of God.', response: 'That we may be made worthy of the promises of Christ.' },
            {
                heading: 'Let us pray',
                body:
                    'Pour forth, we beseech thee, O Lord, thy grace into our hearts,\n' +
                    'that we to whom the Incarnation of Christ thy Son\n' +
                    'was made known by the message of an angel,\n' +
                    'may by his Passion and Cross be brought to the glory of his Resurrection.\n' +
                    'Through the same Christ our Lord. Amen.',
            },
        ],
    },
    {
        slug: 'regina-caeli',
        title: 'Regina Caeli',
        category: 'marian',
        season: 'easter',
        context: 'Replaces the Angelus throughout Eastertide, from Easter Sunday to Pentecost.',
        reminderKey: 'angelus',
        sections: [
            {
                body:
                    'Queen of Heaven, rejoice, alleluia.\n' +
                    'For he whom you did merit to bear, alleluia.\n' +
                    'Has risen, as he said, alleluia.\n' +
                    'Pray for us to God, alleluia.',
            },
            { lead: 'Rejoice and be glad, O Virgin Mary, alleluia.', response: 'For the Lord has truly risen, alleluia.' },
            {
                heading: 'Let us pray',
                body:
                    'O God, who through the resurrection of your Son, our Lord Jesus Christ,\n' +
                    'did vouchsafe to give joy to the world,\n' +
                    'grant, we beseech you, that through his Mother, the Virgin Mary,\n' +
                    'we may obtain the joys of everlasting life.\n' +
                    'Through the same Christ our Lord. Amen.',
            },
        ],
    },
    {
        slug: 'memorare',
        title: 'The Memorare',
        category: 'marian',
        context: 'A prayer of confidence in Our Lady’s intercession, in trouble.',
        sections: [
            {
                body:
                    'Remember, O most gracious Virgin Mary,\n' +
                    'that never was it known that anyone who fled to thy protection,\n' +
                    'implored thy help, or sought thy intercession, was left unaided.\n\n' +
                    'Inspired by this confidence, I fly unto thee,\n' +
                    'O Virgin of virgins, my Mother.\n' +
                    'To thee do I come; before thee I stand, sinful and sorrowful.\n' +
                    'O Mother of the Word Incarnate, despise not my petitions,\n' +
                    'but in thy mercy hear and answer me. Amen.',
            },
        ],
    },
    {
        slug: 'salve-regina',
        title: 'Hail, Holy Queen',
        category: 'marian',
        context: 'The Salve Regina, sung at Compline and prayed at the end of the Rosary.',
        sections: [
            {
                body:
                    'Hail, holy Queen, Mother of mercy,\n' +
                    'our life, our sweetness and our hope.\n' +
                    'To thee do we cry, poor banished children of Eve.\n' +
                    'To thee do we send up our sighs,\n' +
                    'mourning and weeping in this valley of tears.\n\n' +
                    'Turn then, most gracious advocate,\n' +
                    'thine eyes of mercy toward us,\n' +
                    'and after this our exile show unto us the blessed fruit of thy womb, Jesus.\n' +
                    'O clement, O loving, O sweet Virgin Mary.',
            },
            { lead: 'Pray for us, O holy Mother of God.', response: 'That we may be made worthy of the promises of Christ.' },
        ],
    },

    // ── Devotions ───────────────────────────────────────────────────────────
    {
        slug: 'divine-mercy-chaplet',
        title: 'Chaplet of Divine Mercy',
        category: 'devotions',
        context: 'Prayed on rosary beads, traditionally at three o’clock, the hour of the Lord’s death.',
        reminderKey: 'divine_mercy',
        sections: [
            {
                heading: 'To begin',
                body: 'Our Father… Hail Mary… The Apostles’ Creed.',
            },
            {
                heading: 'On each large bead',
                body:
                    'Eternal Father, I offer you the Body and Blood,\n' +
                    'Soul and Divinity of your dearly beloved Son,\n' +
                    'our Lord Jesus Christ,\n' +
                    'in atonement for our sins and those of the whole world.',
            },
            {
                heading: 'On each of the ten small beads',
                body: 'For the sake of his sorrowful Passion,\nhave mercy on us and on the whole world.',
            },
            {
                heading: 'To conclude — three times',
                body:
                    'Holy God, Holy Mighty One, Holy Immortal One,\n' +
                    'have mercy on us and on the whole world.',
            },
        ],
    },
    {
        slug: 'st-michael',
        title: 'Prayer to St Michael',
        category: 'devotions',
        context: 'For protection, often prayed after Mass.',
        sections: [
            {
                body:
                    'Saint Michael the Archangel, defend us in battle.\n' +
                    'Be our protection against the wickedness and snares of the devil.\n' +
                    'May God rebuke him, we humbly pray;\n' +
                    'and do thou, O Prince of the heavenly host,\n' +
                    'by the power of God, cast into hell Satan\n' +
                    'and all the evil spirits who prowl about the world\n' +
                    'seeking the ruin of souls. Amen.',
            },
        ],
    },
    {
        slug: 'anima-christi',
        title: 'Anima Christi',
        category: 'devotions',
        context: 'A prayer of thanksgiving after Holy Communion.',
        sections: [
            {
                body:
                    'Soul of Christ, sanctify me.\n' +
                    'Body of Christ, save me.\n' +
                    'Blood of Christ, inebriate me.\n' +
                    'Water from the side of Christ, wash me.\n' +
                    'Passion of Christ, strengthen me.\n\n' +
                    'O good Jesus, hear me.\n' +
                    'Within thy wounds hide me.\n' +
                    'Suffer me not to be separated from thee.\n' +
                    'From the malicious enemy defend me.\n' +
                    'In the hour of my death call me,\n' +
                    'and bid me come unto thee,\n' +
                    'that with thy saints I may praise thee\n' +
                    'for ever and ever. Amen.',
            },
        ],
    },

    // ── Rosary ──────────────────────────────────────────────────────────────
    {
        slug: 'how-to-pray-the-rosary',
        title: 'How to Pray the Rosary',
        category: 'rosary',
        context: 'The order of the prayers, bead by bead.',
        reminderKey: 'rosary',
        sections: [
            { heading: 'On the crucifix', body: 'The Sign of the Cross, then the Apostles’ Creed.' },
            { heading: 'On the first bead', body: 'One Our Father.' },
            { heading: 'On the next three beads', body: 'Three Hail Marys, for faith, hope and charity.' },
            { heading: 'Then', body: 'One Glory Be.' },
            {
                heading: 'For each of the five decades',
                body:
                    'Announce the mystery.\n' +
                    'One Our Father.\n' +
                    'Ten Hail Marys, meditating on the mystery.\n' +
                    'One Glory Be, and the Fatima prayer:\n\n' +
                    '“O my Jesus, forgive us our sins, save us from the fires of hell,\n' +
                    'and lead all souls to heaven, especially those in most need of thy mercy.”',
            },
            { heading: 'To conclude', body: 'Hail, Holy Queen, and the Sign of the Cross.' },
        ],
    },
    {
        slug: 'mysteries-of-the-rosary',
        title: 'The Mysteries',
        category: 'rosary',
        context: 'Which mysteries are prayed on which day.',
        sections: [
            {
                heading: 'The Joyful Mysteries — Monday and Saturday',
                body:
                    '1. The Annunciation\n' +
                    '2. The Visitation\n' +
                    '3. The Nativity of Our Lord\n' +
                    '4. The Presentation in the Temple\n' +
                    '5. The Finding of the Child Jesus in the Temple',
            },
            {
                heading: 'The Sorrowful Mysteries — Tuesday and Friday',
                body:
                    '1. The Agony in the Garden\n' +
                    '2. The Scourging at the Pillar\n' +
                    '3. The Crowning with Thorns\n' +
                    '4. The Carrying of the Cross\n' +
                    '5. The Crucifixion and Death of Our Lord',
            },
            {
                heading: 'The Glorious Mysteries — Wednesday and Sunday',
                body:
                    '1. The Resurrection\n' +
                    '2. The Ascension\n' +
                    '3. The Descent of the Holy Spirit\n' +
                    '4. The Assumption of Our Lady\n' +
                    '5. The Coronation of Our Lady as Queen of Heaven and Earth',
            },
            {
                heading: 'The Luminous Mysteries — Thursday',
                body:
                    '1. The Baptism of the Lord in the Jordan\n' +
                    '2. The Wedding at Cana\n' +
                    '3. The Proclamation of the Kingdom\n' +
                    '4. The Transfiguration\n' +
                    '5. The Institution of the Eucharist',
            },
        ],
    },

    // ── Occasions ───────────────────────────────────────────────────────────
    {
        slug: 'eternal-rest',
        title: 'Prayer for the Dead',
        category: 'occasions',
        context: 'Prayed for the faithful departed, especially in November.',
        sections: [
            {
                body:
                    'Eternal rest grant unto them, O Lord,\n' +
                    'and let perpetual light shine upon them.\n' +
                    'May they rest in peace. Amen.\n\n' +
                    'May their souls, and the souls of all the faithful departed,\n' +
                    'through the mercy of God, rest in peace. Amen.',
            },
        ],
    },
    {
        slug: 'prayer-for-the-sick',
        title: 'Prayer for the Sick',
        category: 'occasions',
        context: 'For someone who is ill, at home or in hospital.',
        sections: [
            {
                body:
                    'Father of mercies and God of all consolation,\n' +
                    'graciously look upon your servant who is ill.\n' +
                    'Relieve their suffering, strengthen them in weakness,\n' +
                    'and give them the comfort of your presence.\n\n' +
                    'Grant them healing of body and of soul,\n' +
                    'and restore them in your good time to health and to those who love them.\n' +
                    'Through Christ our Lord. Amen.',
            },
        ],
    },
    {
        slug: 'prayer-in-trouble',
        title: 'Prayer in Time of Trouble',
        category: 'occasions',
        context: 'When there is fear, loss, or hardship.',
        sections: [
            {
                body:
                    'O God, our refuge and our strength,\n' +
                    'you are a very present help in trouble.\n' +
                    'Look with mercy on us in our need.\n\n' +
                    'Give us patience in what we cannot change,\n' +
                    'courage in what we must face,\n' +
                    'and trust in your providence in all things.\n' +
                    'Through Christ our Lord. Amen.',
            },
        ],
    },
    {
        slug: 'prayer-for-the-parish',
        title: 'Prayer for Our Parish',
        category: 'occasions',
        context: 'For St. Kizito Parish and all who serve it.',
        sections: [
            {
                body:
                    'Lord Jesus Christ, good Shepherd of your people,\n' +
                    'bless our parish and all who worship here.\n' +
                    'Strengthen our priests, our catechists and all who serve.\n\n' +
                    'Make us one in faith and generous in charity,\n' +
                    'that our parish may be a home for the stranger,\n' +
                    'a comfort to the sorrowing,\n' +
                    'and a light to all who seek you.\n' +
                    'Through the intercession of St. Kizito, we pray. Amen.',
            },
        ],
    },
];

export const getPrayer = (slug: string): Prayer | undefined =>
    PRAYERS.find((prayer) => prayer.slug === slug);

export const getPrayersByCategory = (category: PrayerCategoryId): Prayer[] =>
    PRAYERS.filter((prayer) => prayer.category === category);
