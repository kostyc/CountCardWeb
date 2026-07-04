"use strict";
/**
 * Initialize Firebase client SDK for shared Firestore services in Cloud Functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFirebaseClient = initFirebaseClient;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const auth_1 = require("firebase/auth");
const firebase_1 = require("@countcard/firebase");
function initFirebaseClient() {
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(config) : (0, app_1.getApps)()[0];
    (0, firebase_1.setFirestore)((0, firestore_1.getFirestore)(app));
    (0, firebase_1.setAuth)((0, auth_1.getAuth)(app));
}
//# sourceMappingURL=firebaseClient.js.map