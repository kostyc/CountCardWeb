"use strict";
/**
 * Encryption Module
 *
 * Main export file for encryption functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEncryptionConfig = exports.getEncryptionConfig = exports.recoverKeyFromCode = exports.generateRecoveryCodeForKey = exports.reEncryptData = exports.rotateUserKey = exports.decryptStoredEncryptionKey = exports.prepareEncryptionKeyForStorage = exports.generateKeyPair = exports.generateUserKey = exports.checkAndLogEncryptionCompatibility = exports.getCompatibilityMessage = exports.canInitializeSodiumPlus = exports.verifyEncryptionSupport = exports.checkEncryptionCompatibility = exports.decryptString = exports.encryptString = exports.decryptObject = exports.encryptObject = exports.formatRecoveryCode = exports.validateRecoveryCode = exports.validateKey = exports.validateEncryptedData = exports.decodeHex = exports.encodeHex = exports.decodeBase64 = exports.encodeBase64 = exports.runEncryptionRoundTrip = exports.verifyCrossPlatformCompatibility = exports.generateRecoveryCode = exports.deriveKeyFromPassword = exports.decrypt = exports.encrypt = exports.generateSalt = exports.generateNonce = exports.generateKey = void 0;
// Core encryption service
var encryptionService_web_1 = require("./encryptionService.web");
Object.defineProperty(exports, "generateKey", { enumerable: true, get: function () { return encryptionService_web_1.generateKey; } });
Object.defineProperty(exports, "generateNonce", { enumerable: true, get: function () { return encryptionService_web_1.generateNonce; } });
Object.defineProperty(exports, "generateSalt", { enumerable: true, get: function () { return encryptionService_web_1.generateSalt; } });
Object.defineProperty(exports, "encrypt", { enumerable: true, get: function () { return encryptionService_web_1.encrypt; } });
Object.defineProperty(exports, "decrypt", { enumerable: true, get: function () { return encryptionService_web_1.decrypt; } });
Object.defineProperty(exports, "deriveKeyFromPassword", { enumerable: true, get: function () { return encryptionService_web_1.deriveKeyFromPassword; } });
Object.defineProperty(exports, "generateRecoveryCode", { enumerable: true, get: function () { return encryptionService_web_1.generateRecoveryCode; } });
var testVectors_1 = require("./testVectors");
Object.defineProperty(exports, "verifyCrossPlatformCompatibility", { enumerable: true, get: function () { return testVectors_1.verifyCrossPlatformCompatibility; } });
Object.defineProperty(exports, "runEncryptionRoundTrip", { enumerable: true, get: function () { return testVectors_1.runEncryptionRoundTrip; } });
// Utility functions
var utils_1 = require("./utils");
Object.defineProperty(exports, "encodeBase64", { enumerable: true, get: function () { return utils_1.encodeBase64; } });
Object.defineProperty(exports, "decodeBase64", { enumerable: true, get: function () { return utils_1.decodeBase64; } });
Object.defineProperty(exports, "encodeHex", { enumerable: true, get: function () { return utils_1.encodeHex; } });
Object.defineProperty(exports, "decodeHex", { enumerable: true, get: function () { return utils_1.decodeHex; } });
Object.defineProperty(exports, "validateEncryptedData", { enumerable: true, get: function () { return utils_1.validateEncryptedData; } });
Object.defineProperty(exports, "validateKey", { enumerable: true, get: function () { return utils_1.validateKey; } });
Object.defineProperty(exports, "validateRecoveryCode", { enumerable: true, get: function () { return utils_1.validateRecoveryCode; } });
Object.defineProperty(exports, "formatRecoveryCode", { enumerable: true, get: function () { return utils_1.formatRecoveryCode; } });
Object.defineProperty(exports, "encryptObject", { enumerable: true, get: function () { return utils_1.encryptObject; } });
Object.defineProperty(exports, "decryptObject", { enumerable: true, get: function () { return utils_1.decryptObject; } });
Object.defineProperty(exports, "encryptString", { enumerable: true, get: function () { return utils_1.encryptString; } });
Object.defineProperty(exports, "decryptString", { enumerable: true, get: function () { return utils_1.decryptString; } });
// Browser compatibility
var browserCompatibility_1 = require("./browserCompatibility");
Object.defineProperty(exports, "checkEncryptionCompatibility", { enumerable: true, get: function () { return browserCompatibility_1.checkEncryptionCompatibility; } });
Object.defineProperty(exports, "verifyEncryptionSupport", { enumerable: true, get: function () { return browserCompatibility_1.verifyEncryptionSupport; } });
Object.defineProperty(exports, "canInitializeSodiumPlus", { enumerable: true, get: function () { return browserCompatibility_1.canInitializeSodiumPlus; } });
Object.defineProperty(exports, "getCompatibilityMessage", { enumerable: true, get: function () { return browserCompatibility_1.getCompatibilityMessage; } });
Object.defineProperty(exports, "checkAndLogEncryptionCompatibility", { enumerable: true, get: function () { return browserCompatibility_1.checkAndLogEncryptionCompatibility; } });
// Key management
var keyManager_1 = require("./keyManager");
Object.defineProperty(exports, "generateUserKey", { enumerable: true, get: function () { return keyManager_1.generateUserKey; } });
Object.defineProperty(exports, "generateKeyPair", { enumerable: true, get: function () { return keyManager_1.generateKeyPair; } });
Object.defineProperty(exports, "prepareEncryptionKeyForStorage", { enumerable: true, get: function () { return keyManager_1.prepareEncryptionKeyForStorage; } });
Object.defineProperty(exports, "decryptStoredEncryptionKey", { enumerable: true, get: function () { return keyManager_1.decryptStoredEncryptionKey; } });
Object.defineProperty(exports, "rotateUserKey", { enumerable: true, get: function () { return keyManager_1.rotateUserKey; } });
Object.defineProperty(exports, "reEncryptData", { enumerable: true, get: function () { return keyManager_1.reEncryptData; } });
Object.defineProperty(exports, "generateRecoveryCodeForKey", { enumerable: true, get: function () { return keyManager_1.generateRecoveryCodeForKey; } });
Object.defineProperty(exports, "recoverKeyFromCode", { enumerable: true, get: function () { return keyManager_1.recoverKeyFromCode; } });
Object.defineProperty(exports, "getEncryptionConfig", { enumerable: true, get: function () { return keyManager_1.getEncryptionConfig; } });
Object.defineProperty(exports, "updateEncryptionConfig", { enumerable: true, get: function () { return keyManager_1.updateEncryptionConfig; } });
//# sourceMappingURL=index.js.map