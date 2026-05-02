import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';

const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_APP as string;
const SHARE_MESSAGE = `Hey 👋

I've been using this app and I think you might find it helpful.

Check it out:
${SHARE_URL}`;

let isSharing = false;
let lastShareAt = 0;
const SHARE_DEBOUNCE_MS = 900;

export async function shareApp(): Promise<void> {
    const now = Date.now();
    if (isSharing || now - lastShareAt < SHARE_DEBOUNCE_MS) {
        return;
    }

    isSharing = true;
    lastShareAt = now;

    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Share.share({
            message: SHARE_MESSAGE,
            url: SHARE_URL,
        });
    } catch (error) {
        console.error('[shareApp] Failed to open share sheet:', error);
    } finally {
        isSharing = false;
    }
}
