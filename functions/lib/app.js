"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiApp = createApiApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firebaseClient_1 = require("./firebaseClient");
const encryption_1 = __importDefault(require("./routes/encryption"));
const user_1 = __importDefault(require("./routes/user"));
const countCards_1 = __importDefault(require("./routes/countCards"));
const admin_1 = __importDefault(require("./routes/admin"));
const recruits_1 = __importDefault(require("./routes/recruits"));
(0, firebaseClient_1.initFirebaseClient)();
function createApiApp() {
    const app = (0, express_1.default)();
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
    app.use((0, cors_1.default)({
        origin: allowedOrigins.length ? allowedOrigins : true,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'countcard-api' });
    });
    app.use('/encryption', encryption_1.default);
    app.use('/user', user_1.default);
    app.use('/count-cards', countCards_1.default);
    app.use('/admin', admin_1.default);
    app.use('/recruits', recruits_1.default);
    return app;
}
//# sourceMappingURL=app.js.map