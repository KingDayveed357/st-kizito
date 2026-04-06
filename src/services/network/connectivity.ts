const DEFAULT_TIMEOUT_MS = 3500;
const CONNECTIVITY_URL = 'https://clients3.google.com/generate_204';
const FALLBACK_CONNECTIVITY_URL = 'https://www.gstatic.com/generate_204';

const getSupabaseHealthUrl = () => {
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!baseUrl) return null;

    return `${baseUrl.replace(/\/$/, '')}/rest/v1/`;
};

export const checkInternetConnection = async (timeoutMs = DEFAULT_TIMEOUT_MS): Promise<boolean> => {
    const probeUrls = [getSupabaseHealthUrl(), CONNECTIVITY_URL, FALLBACK_CONNECTIVITY_URL].filter(
        (url): url is string => Boolean(url)
    );

    for (const url of probeUrls) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
            });

            if (response.ok || response.status === 401 || response.status === 403) {
                return true;
            }
        } catch {
            // Try the next probe URL.
        } finally {
            clearTimeout(timeout);
        }
    }

    return false;
};
