"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = verifyAuthToken;
exports.isAdmin = isAdmin;
exports.verifyPermission = verifyPermission;
exports.verifyOrganizationAccess = verifyOrganizationAccess;
const admin_1 = require("./admin");
const roles_1 = require("@countcard/core/permissions/roles");
async function verifyAuthToken(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer '))
            return null;
        const idToken = authHeader.slice(7);
        const decodedToken = await admin_1.adminAuth.verifyIdToken(idToken);
        return {
            ...decodedToken,
            uid: decodedToken.uid,
            role: decodedToken.role,
            organizationalAssignment: decodedToken.organizationalAssignment,
        };
    }
    catch {
        return null;
    }
}
async function isAdmin(userId) {
    try {
        const user = await admin_1.adminAuth.getUser(userId);
        const customClaims = user.customClaims || {};
        if (customClaims.role && (0, roles_1.isAdminRole)(customClaims.role))
            return true;
        if (customClaims.admin === true)
            return true;
        const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
        return adminUserIds.includes(userId);
    }
    catch {
        return false;
    }
}
function verifyPermission(token, permission) {
    if (!token?.role)
        return false;
    return (0, roles_1.hasPermission)(token.role, permission);
}
function verifyOrganizationAccess(token, targetOrg) {
    if (!token?.role || !token.organizationalAssignment)
        return false;
    return (0, roles_1.canAccessOrganizationByRole)(token.role, token.organizationalAssignment, targetOrg);
}
//# sourceMappingURL=auth.js.map