import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();


if (!admin.apps.length) {

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'autointell-aa9d6',
    });
}

export const auth = admin.auth();
export const db = admin.firestore();

export default admin;