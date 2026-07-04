"use strict";
/**
 * Firebase Admin SDK for Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminApp = exports.adminAuth = exports.adminDb = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
let adminApp;
if ((0, app_1.getApps)().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ||
        process.env.GCLOUD_PROJECT ||
        'countcard-94c5b';
    const hasServiceAccountCreds = process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (hasServiceAccountCreds) {
        exports.adminApp = adminApp = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            projectId,
        });
    }
    else {
        exports.adminApp = adminApp = (0, app_1.initializeApp)({
            credential: (0, app_1.applicationDefault)(),
            projectId,
        });
    }
}
else {
    exports.adminApp = adminApp = (0, app_1.getApps)()[0];
}
exports.adminDb = (0, firestore_1.getFirestore)(adminApp);
exports.adminAuth = (0, auth_1.getAuth)(adminApp);
//# sourceMappingURL=admin.js.map