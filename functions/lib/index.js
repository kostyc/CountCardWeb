"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../packages/core/src/logger.ts
function logInfo(_message, _context) {
}
function logWarning(_message, _context) {
}
function logError(error, _context) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error.message);
  }
}
var init_logger = __esm({
  "../packages/core/src/logger.ts"() {
  }
});

// ../packages/core/src/featureDetection.ts
function isWebCryptoAvailable() {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof window !== "undefined" && "crypto" in window;
}
function isLocalStorageAvailable() {
  try {
    if (typeof window === "undefined") {
      return false;
    }
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
function isSessionStorageAvailable() {
  try {
    if (typeof window === "undefined") {
      return false;
    }
    const test = "__sessionStorage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
function isIndexedDBAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window && indexedDB !== null;
}
function isServiceWorkerSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "serviceWorker" in window;
}
function isFetchAvailable() {
  return typeof fetch !== "undefined";
}
function isPromiseAvailable() {
  return typeof Promise !== "undefined";
}
function isAsyncAwaitSupported() {
  try {
    eval("(async () => {})");
    return true;
  } catch {
    return false;
  }
}
function isIntersectionObserverAvailable() {
  return typeof window !== "undefined" && "IntersectionObserver" in window;
}
function isResizeObserverAvailable() {
  return typeof window !== "undefined" && "ResizeObserver" in window;
}
function getBrowserInfo() {
  if (typeof window === "undefined") {
    return {
      name: "Unknown",
      version: "Unknown",
      isSafari: false,
      isChrome: false,
      isEdge: false,
      isFirefox: false
    };
  }
  const userAgent = navigator.userAgent;
  let name = "Unknown";
  let version = "Unknown";
  let isSafari = false;
  let isChrome = false;
  let isEdge = false;
  let isFirefox = false;
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
    name = "Safari";
    isSafari = true;
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
    name = "Chrome";
    isChrome = true;
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (/Edg/.test(userAgent)) {
    name = "Edge";
    isEdge = true;
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (/Firefox/.test(userAgent)) {
    name = "Firefox";
    isFirefox = true;
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) {
      version = match[1];
    }
  }
  return {
    name,
    version,
    isSafari,
    isChrome,
    isEdge,
    isFirefox
  };
}
function meetsMinimumBrowserRequirements() {
  const browserInfo = getBrowserInfo();
  if (browserInfo.name === "Unknown") {
    return true;
  }
  const version = parseInt(browserInfo.version, 10);
  if (browserInfo.isSafari) {
    return version >= 14;
  }
  if (browserInfo.isChrome) {
    return version >= 90;
  }
  if (browserInfo.isFirefox) {
    return version >= 90;
  }
  if (browserInfo.isEdge) {
    return version >= 90;
  }
  return isWebCryptoAvailable() && isFetchAvailable() && isPromiseAvailable() && isAsyncAwaitSupported();
}
function getFeatureSupportReport() {
  return {
    webCrypto: isWebCryptoAvailable(),
    localStorage: isLocalStorageAvailable(),
    sessionStorage: isSessionStorageAvailable(),
    indexedDB: isIndexedDBAvailable(),
    serviceWorker: isServiceWorkerSupported(),
    fetch: isFetchAvailable(),
    promise: isPromiseAvailable(),
    asyncAwait: isAsyncAwaitSupported(),
    intersectionObserver: isIntersectionObserverAvailable(),
    resizeObserver: isResizeObserverAvailable(),
    meetsMinimumRequirements: meetsMinimumBrowserRequirements()
  };
}
var init_featureDetection = __esm({
  "../packages/core/src/featureDetection.ts"() {
  }
});

// ../packages/encryption/src/browserCompatibility.ts
async function checkEncryptionCompatibility() {
  const browserInfo = getBrowserInfo();
  const warnings = [];
  const errors = [];
  const hasWebCrypto = isWebCryptoAvailable();
  const meetsMinimumVersion = meetsMinimumBrowserRequirements();
  if (!meetsMinimumVersion) {
    errors.push(
      `Browser version does not meet minimum requirements. Required: Safari 14+, Chrome 90+, Firefox 90+, or Edge 90+. Detected: ${browserInfo.name} ${browserInfo.version}`
    );
  }
  if (!hasWebCrypto) {
    warnings.push(
      "Web Crypto API is not available. Encryption may use fallback methods which may be slower."
    );
  }
  if (browserInfo.isSafari) {
    const version = parseInt(browserInfo.version, 10);
    if (version < 14) {
      errors.push("Safari version 14 or higher is required for encryption support");
    }
  }
  if (browserInfo.isChrome) {
    const version = parseInt(browserInfo.version, 10);
    if (version < 90) {
      errors.push("Chrome version 90 or higher is required for encryption support");
    }
  }
  if (browserInfo.isEdge) {
    const version = parseInt(browserInfo.version, 10);
    if (version < 90) {
      errors.push("Edge version 90 or higher is required for encryption support");
    }
  }
  if (browserInfo.isFirefox) {
    const version = parseInt(browserInfo.version, 10);
    if (version < 90) {
      errors.push("Firefox version 90 or higher is required for encryption support");
    }
  }
  const isCompatible = errors.length === 0;
  const result = {
    isCompatible,
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    hasWebCrypto,
    meetsMinimumVersion,
    warnings,
    errors
  };
  if (isCompatible) {
    logInfo(
      `Encryption compatibility check passed (${browserInfo.name} ${browserInfo.version})`,
      "encryption.browserCompatibility"
    );
  } else {
    logWarning(
      `Encryption compatibility check failed: ${errors.join("; ")}`,
      "encryption.browserCompatibility"
    );
  }
  if (warnings.length > 0) {
    logWarning(
      `Encryption compatibility warnings: ${warnings.join("; ")}`,
      "encryption.browserCompatibility"
    );
  }
  return result;
}
async function verifyEncryptionSupport() {
  const compatibility = await checkEncryptionCompatibility();
  if (!compatibility.isCompatible) {
    const errorMessage = `Encryption is not supported in this browser. Errors: ${compatibility.errors.join("; ")}. Please use Safari 14+, Chrome 90+, Firefox 90+, or Edge 90+.`;
    throw new Error(errorMessage);
  }
}
var init_browserCompatibility = __esm({
  "../packages/encryption/src/browserCompatibility.ts"() {
    init_featureDetection();
    init_logger();
  }
});

// ../packages/encryption/src/encryptionService.web.ts
async function getSodium() {
  if (typeof window !== "undefined") {
    try {
      await verifyEncryptionSupport();
    } catch (error) {
      logError(error, "encryptionService.getSodium");
      throw error;
    }
  }
  if (!sodiumModule) {
    const sodiumPlusModule = "sodium-plus";
    sodiumModule = await import(sodiumPlusModule);
  }
  return await sodiumModule.default.ready;
}
function encodeBase64(data) {
  const binary = Array.from(data).map((byte) => String.fromCharCode(byte)).join("");
  if (typeof window !== "undefined" && window.btoa) {
    return window.btoa(binary);
  } else {
    return Buffer.from(data).toString("base64");
  }
}
function decodeBase64(data) {
  let binary;
  if (typeof window !== "undefined" && window.atob) {
    binary = window.atob(data);
  } else {
    binary = Buffer.from(data, "base64").toString("binary");
  }
  return new Uint8Array(
    Array.from(binary, (char) => char.charCodeAt(0))
  );
}
async function generateKey() {
  try {
    const sodium = await getSodium();
    const key = sodium.crypto_secretbox_keygen();
    if (key.length !== KEY_SIZE) {
      throw new Error(`Generated key has incorrect size: ${key.length} bytes (expected ${KEY_SIZE})`);
    }
    logInfo("Encryption key generated successfully", "encryptionService.generateKey");
    return key;
  } catch (error) {
    logError(error, "encryptionService.generateKey");
    throw new Error("Failed to generate encryption key");
  }
}
async function generateNonce() {
  try {
    const sodium = await getSodium();
    const nonce = sodium.randombytes_buf(NONCE_SIZE);
    if (nonce.length !== NONCE_SIZE) {
      throw new Error(`Generated nonce has incorrect size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
    }
    return nonce;
  } catch (error) {
    logError(error, "encryptionService.generateNonce");
    throw new Error("Failed to generate nonce");
  }
}
async function encrypt(plaintext, key) {
  try {
    if (!plaintext) {
      throw new Error("Plaintext cannot be empty");
    }
    if (!key || key.length !== KEY_SIZE) {
      throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
    }
    const sodium = await getSodium();
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const nonce = await generateNonce();
    const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, key);
    const encryptedData = {
      ciphertext: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce)
    };
    logInfo("Data encrypted successfully", "encryptionService.encrypt");
    return encryptedData;
  } catch (error) {
    logError(error, "encryptionService.encrypt");
    throw new Error("Failed to encrypt data");
  }
}
async function decrypt(encryptedData, key) {
  try {
    if (!encryptedData.ciphertext || !encryptedData.nonce) {
      throw new Error("Encrypted data must contain both ciphertext and nonce");
    }
    if (!key || key.length !== KEY_SIZE) {
      throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
    }
    const sodium = await getSodium();
    const ciphertext = decodeBase64(encryptedData.ciphertext);
    const nonce = decodeBase64(encryptedData.nonce);
    if (nonce.length !== NONCE_SIZE) {
      throw new Error(`Invalid nonce size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
    }
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
    const plaintext = new TextDecoder().decode(plaintextBytes);
    logInfo("Data decrypted successfully", "encryptionService.decrypt");
    return plaintext;
  } catch (error) {
    logError(error, "encryptionService.decrypt");
    throw new Error("Failed to decrypt data");
  }
}
var sodiumModule, KEY_SIZE, NONCE_SIZE;
var init_encryptionService_web = __esm({
  "../packages/encryption/src/encryptionService.web.ts"() {
    init_logger();
    init_browserCompatibility();
    sodiumModule = null;
    KEY_SIZE = 32;
    NONCE_SIZE = 24;
  }
});

// ../packages/encryption/src/encryptionService.ts
var init_encryptionService = __esm({
  "../packages/encryption/src/encryptionService.ts"() {
    init_encryptionService_web();
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  api: () => api,
  syncUserClaimsOnProfileWrite: () => syncUserClaimsOnProfileWrite
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");

// src/app.ts
var import_express6 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// src/firebaseClient.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_auth = require("firebase/auth");

// ../packages/firebase/src/instance.ts
var _db = null;
var _auth = null;
function setFirestore(db2) {
  _db = db2;
}
function setAuth(auth2) {
  _auth = auth2;
}
var db = new Proxy({}, {
  get(_target, prop) {
    if (!_db) {
      throw new Error("Firestore not initialized. Call setFirestore() from app bootstrap.");
    }
    return Reflect.get(_db, prop);
  }
});
var auth = new Proxy({}, {
  get(_target, prop) {
    if (!_auth) {
      throw new Error("Auth not initialized. Call setAuth() from app bootstrap.");
    }
    return Reflect.get(_auth, prop);
  }
});

// src/firebaseClient.ts
function initFirebaseClient() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return;
  const config = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  };
  const app = (0, import_app.getApps)().length === 0 ? (0, import_app.initializeApp)(config) : (0, import_app.getApps)()[0];
  setFirestore((0, import_firestore.getFirestore)(app));
  setAuth((0, import_auth.getAuth)(app));
}

// src/routes/encryption.ts
var import_express = require("express");

// src/admin.ts
var import_app2 = require("firebase-admin/app");
var import_firestore2 = require("firebase-admin/firestore");
var import_auth2 = require("firebase-admin/auth");
var adminApp;
if ((0, import_app2.getApps)().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.GCLOUD_PROJECT || "countcard-94c5b";
  const hasServiceAccountCreds = process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (hasServiceAccountCreds) {
    adminApp = (0, import_app2.initializeApp)({
      credential: (0, import_app2.cert)({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      }),
      projectId
    });
  } else {
    adminApp = (0, import_app2.initializeApp)({
      credential: (0, import_app2.applicationDefault)(),
      projectId
    });
  }
} else {
  adminApp = (0, import_app2.getApps)()[0];
}
var adminDb = (0, import_firestore2.getFirestore)(adminApp);
var adminAuth = (0, import_auth2.getAuth)(adminApp);

// ../packages/core/src/permissions/roles.ts
function canAccessOrganization(userOrg, targetOrg) {
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }
  if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
    return false;
  }
  if (userOrg.series && targetOrg.series && userOrg.series !== targetOrg.series) {
    return false;
  }
  if (userOrg.platoon && targetOrg.platoon && userOrg.platoon !== targetOrg.platoon) {
    return false;
  }
  return true;
}
function canAccessCompany(userOrg, targetOrg) {
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }
  if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
    return false;
  }
  return true;
}
function canAccessBattalion(userOrg, targetOrg) {
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }
  return true;
}
var ROLE_HIERARCHY = {
  // Level 1: Drill Instructor
  drill_instructor: {
    role: "drill_instructor",
    privilegeLevel: 1 /* Level1 */,
    permissions: [
      "view_own_platoon",
      "edit_own_platoon",
      "create_count_card",
      "submit_count_card"
    ],
    canAccessOrganizations: canAccessOrganization
  },
  // Level 2: Senior Drill Instructor
  senior_drill_instructor: {
    role: "senior_drill_instructor",
    privilegeLevel: 2 /* Level2 */,
    permissions: [
      "view_own_platoon",
      "edit_own_platoon",
      "view_series",
      "edit_series",
      "create_count_card",
      "submit_count_card",
      "approve_count_card",
      "reject_count_card",
      "forward_count_cards"
    ],
    canAccessOrganizations: (userOrg, targetOrg) => {
      if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
        return false;
      }
      if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
        return false;
      }
      if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
        return false;
      }
      if (userOrg.series && targetOrg.series && userOrg.series !== targetOrg.series) {
        return false;
      }
      return true;
    }
  },
  // Level 3: Chief Drill Instructor
  chief_drill_instructor: {
    role: "chief_drill_instructor",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_own_platoon",
      "edit_own_platoon",
      "view_series",
      "edit_series",
      "view_company",
      "edit_company",
      "create_count_card",
      "submit_count_card",
      "approve_count_card",
      "reject_count_card",
      "consolidate_count_cards",
      "forward_count_cards"
    ],
    canAccessOrganizations: canAccessCompany
  },
  // Level 3: Company 1stSgt
  company_first_sgt: {
    role: "company_first_sgt",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs"
    ],
    canAccessOrganizations: canAccessCompany
  },
  // Level 3: Series Commander
  series_commander: {
    role: "series_commander",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs"
    ],
    canAccessOrganizations: canAccessCompany
  },
  // Level 3: Company XO
  company_xo: {
    role: "company_xo",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs"
    ],
    canAccessOrganizations: canAccessCompany
  },
  // Level 3: Company Commander
  company_commander: {
    role: "company_commander",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs",
      "assign_roles",
      "manage_organizations"
    ],
    canAccessOrganizations: canAccessCompany
  },
  // Level 3: Battalion SgtMaj
  battalion_sgt_maj: {
    role: "battalion_sgt_maj",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_battalion",
      "edit_battalion",
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs"
    ],
    canAccessOrganizations: canAccessBattalion
  },
  // Level 3: Battalion XO
  battalion_xo: {
    role: "battalion_xo",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_battalion",
      "edit_battalion",
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs"
    ],
    canAccessOrganizations: canAccessBattalion
  },
  // Level 3: Battalion Commander
  battalion_commander: {
    role: "battalion_commander",
    privilegeLevel: 3 /* Level3 */,
    permissions: [
      "view_battalion",
      "edit_battalion",
      "view_company",
      "edit_company",
      "view_series",
      "edit_series",
      "view_own_platoon",
      "edit_own_platoon",
      "consolidate_count_cards",
      "forward_count_cards",
      "view_audit_logs",
      "assign_roles",
      "manage_users",
      "manage_organizations"
    ],
    canAccessOrganizations: canAccessBattalion
  }
};
function hasPermission(role, permission) {
  return ROLE_HIERARCHY[role].permissions.includes(permission);
}
function isAdminRole(role) {
  const adminRoles = [
    "company_first_sgt",
    "series_commander",
    "company_xo",
    "company_commander",
    "battalion_sgt_maj",
    "battalion_xo",
    "battalion_commander"
  ];
  return adminRoles.includes(role);
}

// src/auth.ts
async function verifyAuthToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const idToken = authHeader.slice(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      ...decodedToken,
      uid: decodedToken.uid,
      role: decodedToken.role,
      organizationalAssignment: decodedToken.organizationalAssignment
    };
  } catch {
    return null;
  }
}
async function isAdmin(userId) {
  try {
    const user = await adminAuth.getUser(userId);
    const customClaims = user.customClaims || {};
    if (customClaims.role && isAdminRole(customClaims.role)) return true;
    if (customClaims.admin === true) return true;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];
    return adminUserIds.includes(userId);
  } catch {
    return false;
  }
}
function verifyPermission(token, permission) {
  if (!token?.role) return false;
  return hasPermission(token.role, permission);
}

// ../packages/encryption/src/index.ts
init_encryptionService_web();

// ../packages/encryption/src/testVectors.ts
init_encryptionService_web();

// ../packages/encryption/src/utils.ts
function encodeBase642(data) {
  const binary = Array.from(data).map((byte) => String.fromCharCode(byte)).join("");
  if (typeof window !== "undefined" && window.btoa) {
    return window.btoa(binary);
  } else {
    return Buffer.from(data).toString("base64");
  }
}
function decodeBase642(data) {
  let binary;
  if (typeof window !== "undefined" && window.atob) {
    binary = window.atob(data);
  } else {
    binary = Buffer.from(data, "base64").toString("binary");
  }
  return new Uint8Array(
    Array.from(binary, (char) => char.charCodeAt(0))
  );
}

// ../packages/encryption/src/index.ts
init_browserCompatibility();

// ../packages/encryption/src/keyManager.ts
init_encryptionService();
init_encryptionService();
init_logger();
async function getMasterKey() {
  const masterKeyBase64 = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKeyBase64) {
    throw new Error("ENCRYPTION_MASTER_KEY environment variable is not set");
  }
  try {
    const masterKey = decodeBase642(masterKeyBase64);
    if (masterKey.length !== 32) {
      throw new Error(`Master key has incorrect size: ${masterKey.length} bytes (expected 32)`);
    }
    return masterKey;
  } catch (error) {
    logError(error, "keyManager.getMasterKey");
    throw new Error("Failed to load master encryption key");
  }
}
async function generateUserKey() {
  try {
    const key = await generateKey();
    logInfo("User encryption key generated", "keyManager.generateUserKey");
    return key;
  } catch (error) {
    logError(error, "keyManager.generateUserKey");
    throw new Error("Failed to generate user encryption key");
  }
}
async function encryptUserKeyForStorage(userKey) {
  try {
    const masterKey = await getMasterKey();
    const keyString = encodeBase642(userKey);
    const encrypted = await encrypt(keyString, masterKey);
    return encrypted;
  } catch (error) {
    logError(error, "keyManager.encryptUserKeyForStorage");
    throw new Error("Failed to encrypt user key for storage");
  }
}
async function decryptUserKeyFromStorage(encryptedKey) {
  try {
    const masterKey = await getMasterKey();
    const keyString = await decrypt(encryptedKey, masterKey);
    const userKey = decodeBase642(keyString);
    if (userKey.length !== 32) {
      throw new Error(`Decrypted key has incorrect size: ${userKey.length} bytes (expected 32)`);
    }
    return userKey;
  } catch (error) {
    logError(error, "keyManager.decryptUserKeyFromStorage");
    throw new Error("Failed to decrypt user key from storage");
  }
}
async function prepareEncryptionKeyForStorage(userId, key, keyVersion = 1) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!key || key.length !== 32) {
      throw new Error("Invalid encryption key");
    }
    const encryptedKey = await encryptUserKeyForStorage(key);
    const keyDoc = {
      userId,
      encryptedKey,
      keyVersion,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    logInfo(`Encryption key prepared for storage (userId: ${userId}, version: ${keyVersion})`, "keyManager.prepareEncryptionKeyForStorage");
    return keyDoc;
  } catch (error) {
    logError(error, "keyManager.prepareEncryptionKeyForStorage");
    throw new Error("Failed to prepare encryption key for storage");
  }
}
async function decryptStoredEncryptionKey(storedKey) {
  try {
    if (!storedKey.encryptedKey) {
      throw new Error("Stored key document missing encrypted key data");
    }
    const userKey = await decryptUserKeyFromStorage(storedKey.encryptedKey);
    logInfo(`Encryption key retrieved and decrypted (userId: ${storedKey.userId}, version: ${storedKey.keyVersion})`, "keyManager.decryptStoredEncryptionKey");
    return userKey;
  } catch (error) {
    logError(error, "keyManager.decryptStoredEncryptionKey");
    throw new Error("Failed to decrypt stored encryption key");
  }
}

// src/routes/encryption.ts
var router = (0, import_express.Router)();
async function requireUid(req, res) {
  const token = await verifyAuthToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized - valid authentication token required" });
    return null;
  }
  return token.uid;
}
router.get("/key", async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const requestedUserId = req.query.userId || uid;
    if (requestedUserId !== uid) {
      res.status(403).json({ error: "Forbidden - you can only retrieve your own encryption key" });
      return;
    }
    const keySnap = await adminDb.collection("encryptionKeys").doc(requestedUserId).get();
    if (!keySnap.exists) {
      res.status(404).json({ error: "Encryption key not found. Generate a key first." });
      return;
    }
    const storedKey = keySnap.data();
    const userKey = await decryptStoredEncryptionKey(storedKey);
    res.json({ success: true, key: encodeBase642(userKey), keyVersion: storedKey.keyVersion });
  } catch {
    res.status(500).json({ error: "Failed to retrieve encryption key" });
  }
});
router.post("/generate-key", async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const keyRef = adminDb.collection("encryptionKeys").doc(uid);
    if ((await keyRef.get()).exists) {
      res.status(409).json({ error: "Encryption key already exists. Use rotate-key endpoint to rotate the key." });
      return;
    }
    const userKey = await generateUserKey();
    const keyDoc = await prepareEncryptionKeyForStorage(uid, userKey, 1);
    await keyRef.set(keyDoc);
    await adminDb.collection("encryptionConfig").doc(uid).set({
      userId: uid,
      keyVersion: 1,
      algorithm: "XChaCha20-Poly1305",
      keyRotationEnabled: true,
      recoveryCodesEnabled: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    res.json({ success: true, message: "Encryption key generated and stored successfully", keyVersion: keyDoc.keyVersion });
  } catch {
    res.status(500).json({ error: "Failed to generate encryption key" });
  }
});
router.post("/rotate-key", async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const keyRef = adminDb.collection("encryptionKeys").doc(uid);
    const existing = await keyRef.get();
    if (!existing.exists) {
      res.status(404).json({ error: "Encryption key not found" });
      return;
    }
    const newKey = await generateUserKey();
    const keyDoc = await prepareEncryptionKeyForStorage(uid, newKey, (existing.data()?.keyVersion ?? 0) + 1);
    await keyRef.set(keyDoc);
    res.json({ success: true, message: "Encryption key rotated successfully", keyVersion: keyDoc.keyVersion });
  } catch {
    res.status(500).json({ error: "Failed to rotate encryption key" });
  }
});
router.post("/recovery-code", async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    res.status(501).json({ error: "Recovery code generation delegated to client key manager" });
  } catch {
    res.status(500).json({ error: "Failed to generate recovery code" });
  }
});
router.post("/recover-key", async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    res.status(501).json({ error: "Key recovery requires client-side verification flow" });
  } catch {
    res.status(500).json({ error: "Failed to recover encryption key" });
  }
});
var encryption_default = router;

// src/routes/user.ts
var import_express2 = require("express");
var router2 = (0, import_express2.Router)();
var VALID_ROLES = [
  "drill_instructor",
  "senior_drill_instructor",
  "chief_drill_instructor",
  "company_first_sgt",
  "series_commander",
  "company_xo",
  "company_commander",
  "battalion_sgt_maj",
  "battalion_xo",
  "battalion_commander"
];
router2.post("/profile", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const profileData = req.body;
    const profileRef = adminDb.collection("userProfiles").doc(token.uid);
    await profileRef.set({ ...profileData, userId: token.uid, updatedAt: /* @__PURE__ */ new Date() }, { merge: true });
    res.json({ success: true, message: "Profile saved successfully" });
  } catch {
    res.status(500).json({ error: "Failed to save profile" });
  }
});
router2.get("/profile/completion", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const snap = await adminDb.collection("userProfiles").doc(token.uid).get();
    const data = snap.data() ?? {};
    const required = ["firstName", "lastName", "rank", "role"];
    const completed = required.filter((f) => Boolean(data[f])).length;
    res.json({ success: true, completionPercentage: Math.round(completed / required.length * 100), profile: data });
  } catch {
    res.status(500).json({ error: "Failed to get profile completion" });
  }
});
router2.post("/profile/completion", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const { completionPercentage } = req.body ?? {};
    if (typeof completionPercentage !== "number") {
      res.status(400).json({ error: "completionPercentage is required" });
      return;
    }
    await adminDb.collection("userProfiles").doc(token.uid).set(
      { profileCompletion: completionPercentage, updatedAt: /* @__PURE__ */ new Date() },
      { merge: true }
    );
    res.json({ success: true, completionPercentage });
  } catch {
    res.status(500).json({ error: "Failed to update profile completion" });
  }
});
router2.post("/accept-policies", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const { privacyPolicyAccepted, termsOfServiceAccepted } = req.body ?? {};
    await adminDb.collection("userProfiles").doc(token.uid).set(
      {
        privacyPolicyAccepted: Boolean(privacyPolicyAccepted),
        termsOfServiceAccepted: Boolean(termsOfServiceAccepted),
        policiesAcceptedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      { merge: true }
    );
    res.json({ success: true, message: "Policy acceptance recorded" });
  } catch {
    res.status(500).json({ error: "Failed to record policy acceptance" });
  }
});
router2.post("/set-custom-claims", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const { userId, role, organizationalAssignment } = req.body ?? {};
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    const userIsAdmin = await isAdmin(token.uid);
    if (userId !== token.uid && !userIsAdmin) {
      res.status(403).json({ error: "Forbidden - you can only update your own custom claims or must be an admin" });
      return;
    }
    if (role && !VALID_ROLES.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    if (organizationalAssignment?.regiment && !["West", "East"].includes(organizationalAssignment.regiment)) {
      res.status(400).json({ error: 'Invalid regiment. Must be "West" or "East"' });
      return;
    }
    const user = await adminAuth.getUser(userId);
    const currentClaims = user.customClaims || {};
    const newClaims = { ...currentClaims };
    if (role !== void 0) newClaims.role = role;
    if (organizationalAssignment !== void 0) {
      newClaims.organizationalAssignment = organizationalAssignment;
    }
    await adminAuth.setCustomUserClaims(userId, newClaims);
    res.json({ success: true, message: "Custom claims updated successfully", claims: newClaims });
  } catch {
    res.status(500).json({ error: "Failed to set custom claims" });
  }
});
var user_default = router2;

// src/routes/countCards.ts
var import_express3 = require("express");

// ../packages/firebase/src/services/countCards.ts
var import_firestore4 = require("firebase/firestore");
var import_firestore5 = require("firebase/firestore");

// ../packages/firebase/src/services/base.ts
var import_firestore3 = require("firebase/firestore");
var ServiceError = class extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    this.name = "ServiceError";
  }
};
function timestampToDate(timestamp) {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
}
function updateBaseEntityFields(data, userId) {
  return {
    ...data,
    updatedAt: import_firestore3.Timestamp.now(),
    updatedBy: userId
  };
}
async function getDocumentById(collectionName, documentId) {
  try {
    const docRef = (0, import_firestore3.doc)(db, collectionName, documentId);
    const docSnap = await (0, import_firestore3.getDoc)(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt)
    };
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get document ${documentId} from ${collectionName}`);
  }
}
async function updateDocument(collectionName, documentId, data, userId) {
  try {
    const docRef = (0, import_firestore3.doc)(db, collectionName, documentId);
    const updateData = updateBaseEntityFields(data, userId);
    await (0, import_firestore3.updateDoc)(docRef, updateData);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update document ${documentId} in ${collectionName}`);
  }
}
function handleFirestoreError(error, context) {
  if (error instanceof import_firestore3.FirestoreError) {
    return new ServiceError(
      context ? `${context}: ${error.message}` : error.message,
      error.code,
      error
    );
  }
  if (error instanceof Error) {
    return new ServiceError(
      context ? `${context}: ${error.message}` : error.message,
      "unknown",
      error
    );
  }
  return new ServiceError(
    context || "An unknown error occurred",
    "unknown",
    error
  );
}

// ../packages/firebase/src/services/countCards.ts
var COLLECTION_NAME = "countCards";
async function updateCountCard(countCardId, data, updatedBy) {
  try {
    await updateDocument(COLLECTION_NAME, countCardId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update count card ${countCardId}`);
  }
}
async function getCountCardById(countCardId) {
  try {
    return await getDocumentById(COLLECTION_NAME, countCardId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get count card ${countCardId}`);
  }
}
async function approveCountCard(countCardId, approvedBy, notes, submittedTo) {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }
    if (countCard.workflowState !== "submitted" && countCard.workflowState !== "under_review") {
      throw new Error(`Cannot approve count card in ${countCard.workflowState} state`);
    }
    const historyEntry = {
      state: "approved",
      timestamp: import_firestore5.Timestamp.now(),
      userId: approvedBy,
      notes: notes || "Count card approved and forwarded to Company 1stSgt and Series Commander"
    };
    const updateData = {
      countCardId,
      workflowState: "approved",
      status: "approved",
      approvedBy,
      submittedTo: submittedTo?.join(",") || void 0,
      workflowHistory: [...countCard.workflowHistory || [], historyEntry],
      updatedBy: approvedBy
    };
    await updateCountCard(countCardId, updateData, approvedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to approve count card ${countCardId}`);
  }
}
async function rejectCountCard(countCardId, rejectedBy, notes) {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }
    if (countCard.workflowState !== "submitted" && countCard.workflowState !== "under_review") {
      throw new Error(`Cannot reject count card in ${countCard.workflowState} state`);
    }
    if (!notes || notes.trim().length === 0) {
      throw new Error("Rejection notes are required");
    }
    const historyEntry = {
      state: "rejected",
      timestamp: import_firestore5.Timestamp.now(),
      userId: rejectedBy,
      notes: `Count card rejected: ${notes}`
    };
    const updateData = {
      countCardId,
      workflowState: "rejected",
      status: "rejected",
      rejectedBy,
      workflowHistory: [...countCard.workflowHistory || [], historyEntry],
      updatedBy: rejectedBy
    };
    await updateCountCard(countCardId, updateData, rejectedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to reject count card ${countCardId}`);
  }
}
async function consolidateCountCard(countCardId, consolidatedBy, notes, submittedTo) {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }
    if (countCard.workflowState !== "approved") {
      throw new Error(`Cannot consolidate count card in ${countCard.workflowState} state`);
    }
    const historyEntry = {
      state: "consolidated",
      timestamp: import_firestore5.Timestamp.now(),
      userId: consolidatedBy,
      notes: notes || "Count card consolidated and forwarded"
    };
    const updateData = {
      countCardId,
      workflowState: "consolidated",
      status: "consolidated",
      submittedTo: submittedTo?.join(",") || void 0,
      workflowHistory: [...countCard.workflowHistory || [], historyEntry],
      updatedBy: consolidatedBy
    };
    await updateCountCard(countCardId, updateData, consolidatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to consolidate count card ${countCardId}`);
  }
}
async function finalApproveCountCard(countCardId, approvedBy, notes) {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }
    if (countCard.workflowState !== "consolidated") {
      throw new Error(`Cannot final approve count card in ${countCard.workflowState} state`);
    }
    const historyEntry = {
      state: "final_approval",
      timestamp: import_firestore5.Timestamp.now(),
      userId: approvedBy,
      notes: notes || "Count card final approval granted"
    };
    const updateData = {
      countCardId,
      workflowState: "final_approval",
      status: "approved",
      approvedBy,
      workflowHistory: [...countCard.workflowHistory || [], historyEntry],
      updatedBy: approvedBy
    };
    await updateCountCard(countCardId, updateData, approvedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to final approve count card ${countCardId}`);
  }
}

// src/routes/countCards.ts
var router3 = (0, import_express3.Router)({ mergeParams: true });
router3.post("/:id/approve", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    if (!verifyPermission(token, "approve_count_card")) {
      res.status(403).json({ error: "Forbidden - insufficient permissions to approve count cards" });
      return;
    }
    const { notes, submittedTo } = req.body ?? {};
    await approveCountCard(req.params.id, token.uid, notes, submittedTo);
    res.json({ success: true, message: "Count card approved successfully" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to approve count card" });
  }
});
router3.post("/:id/reject", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    if (!verifyPermission(token, "reject_count_card")) {
      res.status(403).json({ error: "Forbidden - insufficient permissions to reject count cards" });
      return;
    }
    const { reason } = req.body ?? {};
    await rejectCountCard(req.params.id, token.uid, reason);
    res.json({ success: true, message: "Count card rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to reject count card" });
  }
});
router3.post("/:id/final-approve", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    if (!verifyPermission(token, "consolidate_count_cards")) {
      res.status(403).json({ error: "Forbidden - insufficient permissions" });
      return;
    }
    const { notes } = req.body ?? {};
    await finalApproveCountCard(req.params.id, token.uid, notes);
    res.json({ success: true, message: "Count card final approved successfully" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to final approve count card" });
  }
});
router3.post("/:id/consolidate", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    if (!verifyPermission(token, "consolidate_count_cards")) {
      res.status(403).json({ error: "Forbidden - insufficient permissions" });
      return;
    }
    await consolidateCountCard(req.params.id, token.uid);
    res.json({ success: true, message: "Count card consolidated successfully" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to consolidate count card" });
  }
});
var countCards_default = router3;

// src/routes/admin.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.get("/users", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    if (!await isAdmin(token.uid)) {
      res.status(403).json({ error: "Forbidden - admin access required" });
      return;
    }
    const searchQuery = req.query.search || "";
    const limit2 = parseInt(req.query.limit || "50", 10);
    const snapshot = await adminDb.collection("userProfiles").limit(limit2).get();
    let users = snapshot.docs.map((doc2) => ({
      id: doc2.id,
      ...doc2.data()
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(
        (u) => String(u.displayName ?? "").toLowerCase().includes(q) || String(u.email ?? "").toLowerCase().includes(q)
      );
    }
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ error: "Failed to list users" });
  }
});
var admin_default = router4;

// src/routes/recruits.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)({ mergeParams: true });
router5.get("/:id/export", async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized - valid authentication token required" });
      return;
    }
    const recruitId = req.params.id;
    const recruitSnap = await adminDb.collection("recruits").doc(recruitId).get();
    if (!recruitSnap.exists) {
      res.status(404).json({ error: "Recruit not found" });
      return;
    }
    const userIsAdmin = await isAdmin(token.uid);
    if (recruitSnap.data()?.userId !== token.uid && !userIsAdmin) {
      res.status(403).json({ error: "Forbidden - cannot export this recruit data" });
      return;
    }
    res.json({
      success: true,
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      recruit: { id: recruitSnap.id, ...recruitSnap.data() }
    });
  } catch {
    res.status(500).json({ error: "Failed to export recruit data" });
  }
});
var recruits_default = router5;

// src/app.ts
var apiApp;
function createApiApp() {
  if (apiApp) return apiApp;
  initFirebaseClient();
  const app = (0, import_express6.default)();
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  app.use(
    (0, import_cors.default)({
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true
    })
  );
  app.use(import_express6.default.json());
  const mountApi = (base) => {
    base.use("/encryption", encryption_default);
    base.use("/user", user_default);
    base.use("/count-cards", countCards_default);
    base.use("/admin", admin_default);
    base.use("/recruits", recruits_default);
  };
  const apiRouter = import_express6.default.Router();
  mountApi(apiRouter);
  app.use("/api", apiRouter);
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "countcard-api" });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "countcard-api" });
  });
  mountApi(app);
  apiApp = app;
  return app;
}

// src/triggers/userProfileClaims.ts
var import_firestore6 = require("firebase-functions/v2/firestore");
var VALID_ROLES2 = [
  "drill_instructor",
  "senior_drill_instructor",
  "chief_drill_instructor",
  "company_first_sgt",
  "series_commander",
  "company_xo",
  "company_commander",
  "battalion_sgt_maj",
  "battalion_xo",
  "battalion_commander"
];
var syncUserClaimsOnProfileWrite = (0, import_firestore6.onDocumentWritten)(
  {
    document: "userProfiles/{userId}",
    region: "us-central1"
  },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;
    const userId = event.params.userId;
    const data = after.data();
    if (!data) return;
    const role = data.role;
    const organizationalAssignment = data.organizationalAssignment;
    if (role === void 0 && organizationalAssignment === void 0) return;
    if (role !== void 0 && !VALID_ROLES2.includes(role)) return;
    try {
      const user = await adminAuth.getUser(userId);
      const currentClaims = user.customClaims ?? {};
      const newClaims = { ...currentClaims };
      if (role !== void 0) newClaims.role = role;
      if (organizationalAssignment !== void 0) {
        newClaims.organizationalAssignment = organizationalAssignment;
      }
      const unchanged = JSON.stringify(newClaims) === JSON.stringify(currentClaims);
      if (unchanged) return;
      await adminAuth.setCustomUserClaims(userId, newClaims);
    } catch {
    }
  }
);

// src/index.ts
var api = (0, import_https.onRequest)(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
    cors: false
  },
  (req, res) => createApiApp()(req, res)
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  api,
  syncUserClaimsOnProfileWrite
});
//# sourceMappingURL=index.js.map
