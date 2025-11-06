// Firebase Admin SDK configuration for server-side operations
import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin (server-side)
let adminApp;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
} else {
    adminApp = getApps()[0];
}

export const adminDatabase = getDatabase(adminApp);
export default adminApp;