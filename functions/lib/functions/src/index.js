"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("./app");
const apiApp = (0, app_1.createApiApp)();
/**
 * HTTPS Cloud Function — mirrors Next.js /api/* routes for mobile clients.
 * Base URL: https://<region>-countcard-94c5b.cloudfunctions.net/api
 */
exports.api = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: false,
}, apiApp);
//# sourceMappingURL=index.js.map