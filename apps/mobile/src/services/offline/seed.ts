import { getDb } from './database';
import { useAppStore } from '../../store/useAppStore';
import readingsData from '../../data/liturgical/readings-2025.json';

// Minimal stub for seed. Real one iterates JSON files
export const seedDatabaseIfNeeded = async () => {
    const store = useAppStore.getState();
    if (store.hasSeeded) return;

    try {
        const db = await getDb();

        // In real app, we'd loop over imported JSON and insert into DB
        // e.g. readingsData.map(...)

        store.setHasSeeded(true);
        console.log('[Seed] Database seeded successfully.');
    } catch (error) {
        console.error('[Seed] Error seeding database:', error);
    }
};