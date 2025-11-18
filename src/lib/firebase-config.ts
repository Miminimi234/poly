// Firebase configuration for client-side
import { getApps, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (client-side) when config is present.
let app: any = null;
let database: Database | null = null;

if (typeof window !== 'undefined') {
    const hasRequired = firebaseConfig.databaseURL && firebaseConfig.projectId;
    if (!hasRequired) {
        // Warn but do not throw — allow the app to run without Firebase until env vars are configured.
        // This prevents the runtime fatal error seen when Firebase cannot determine the Database URL.
        // Add the following env vars to `.env.local` to enable Firebase:
        // NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        // NEXT_PUBLIC_FIREBASE_DATABASE_URL, NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        // NEXT_PUBLIC_FIREBASE_APP_ID
        // Example `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: https://your-project-id-default-rtdb.firebaseio.com
        // Example `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: your-project-id
        // Logging here helps developers notice missing configuration without crashing the client.
        // eslint-disable-next-line no-console
        console.warn('[firebase-config] Firebase Database not configured. Skipping initialization.');
    } else {
        try {
            if (!getApps().length) {
                app = initializeApp(firebaseConfig as any);
            } else {
                app = getApps()[0];
            }
            database = getDatabase(app);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error('[firebase-config] Failed to initialize Firebase database:', err?.message || err);
            database = null;
        }
    }
}

export { database };
export default firebaseConfig;