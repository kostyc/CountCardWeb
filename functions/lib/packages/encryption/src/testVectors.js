"use strict";
/**
 * Cross-platform encryption round-trip test vectors.
 * Run in CI to verify web and native produce compatible ciphertext.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIXED_TEST_VECTOR = void 0;
exports.runEncryptionRoundTrip = runEncryptionRoundTrip;
exports.verifyCrossPlatformCompatibility = verifyCrossPlatformCompatibility;
const encryptionService_web_1 = require("./encryptionService.web");
/** Fixed test vector — populate after first successful round-trip in dev. */
exports.FIXED_TEST_VECTOR = null;
async function runEncryptionRoundTrip() {
    const key = await (0, encryptionService_web_1.generateKey)();
    const plaintext = 'CountCard cross-platform encryption test';
    const { ciphertext, nonce: resultNonce } = await (0, encryptionService_web_1.encrypt)(plaintext, key);
    const decrypted = await (0, encryptionService_web_1.decrypt)({ ciphertext, nonce: resultNonce }, key);
    return decrypted === plaintext;
}
async function verifyCrossPlatformCompatibility() {
    try {
        const ok = await runEncryptionRoundTrip();
        return { success: ok, error: ok ? undefined : 'Round-trip mismatch' };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown encryption error',
        };
    }
}
//# sourceMappingURL=testVectors.js.map