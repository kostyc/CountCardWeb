"use strict";
/**
 * Injectable Firestore / Auth instances for cross-platform use.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
exports.setFirestore = setFirestore;
exports.setAuth = setAuth;
let _db = null;
let _auth = null;
function setFirestore(db) {
    _db = db;
}
function setAuth(auth) {
    _auth = auth;
}
exports.db = new Proxy({}, {
    get(_target, prop) {
        if (!_db) {
            throw new Error('Firestore not initialized. Call setFirestore() from app bootstrap.');
        }
        return Reflect.get(_db, prop);
    },
});
exports.auth = new Proxy({}, {
    get(_target, prop) {
        if (!_auth) {
            throw new Error('Auth not initialized. Call setAuth() from app bootstrap.');
        }
        return Reflect.get(_auth, prop);
    },
});
//# sourceMappingURL=instance.js.map