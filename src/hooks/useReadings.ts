import { useState, useEffect } from 'react';

export const useReadings = (date: string) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mocking SQLite/Network fetch
        setTimeout(() => {
            setData({
                id: "2024-06-27",
                date: "2024-06-27",
                lectionaryNumber: 374,
                feastName: "Thursday of the Twelfth Week in Ordinary Time",
                liturgicalSeason: "ordinary",
                liturgicalColor: "green",
                firstReading: {
                    reference: "2 Kings 24:8-17",
                    text: "\"The word of the Lord came to me: Son of man, prophesy against the prophets...\"\n\nThus says the Lord GOD: Woe to the foolish prophets who follow their own spirit and have seen nothing! Your..."
                },
                psalm: {
                    reference: "Psalm 79:1-2, 3-5, 8, 9",
                    verses: [
                        { type: "response", text: "For the glory of your name, O Lord, deliver us." },
                        { type: "verse", text: "O God, the nations have come into your inheritance; they have defiled your holy temple, they have laid Jerusalem in ruins." },
                        { type: "verse", text: "They have given the corpses of your servants as food to the birds of heaven, the flesh of your faithful ones to the beasts of the earth." }
                    ]
                },
                gospelAcclamation: "Alleluia, alleluia. Whoever loves me will keep my word, and my Father will love him and we will come to him. Alleluia",
                gospel: {
                    reference: "Matt 7:21-29",
                    text: "Jesus said to his disciples: \"Not everyone who says to me, 'Lord, Lord,' will enter the Kingdom of heaven, but only the one who does the will of my Father in heaven. Many will say to me on that day, 'Lord, Lord, did we not prophesy in your name? Did we not drive out demons in your name? Did we not do mighty deeds in your name?' Then I will declare to them solemnly, 'I never knew you. Depart from me, you evildoers.\""
                }
            });
            setIsLoading(false);
        }, 300);
    }, [date]);

    return { data, isLoading, isOffline: true, lastSynced: Date.now() };
};