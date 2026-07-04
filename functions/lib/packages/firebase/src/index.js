"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessages = exports.useConversations = exports.auth = exports.db = exports.setAuth = exports.setFirestore = void 0;
var instance_1 = require("./instance");
Object.defineProperty(exports, "setFirestore", { enumerable: true, get: function () { return instance_1.setFirestore; } });
Object.defineProperty(exports, "setAuth", { enumerable: true, get: function () { return instance_1.setAuth; } });
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return instance_1.db; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return instance_1.auth; } });
__exportStar(require("./services"), exports);
var useConversations_1 = require("./hooks/useConversations");
Object.defineProperty(exports, "useConversations", { enumerable: true, get: function () { return useConversations_1.useConversations; } });
var useMessages_1 = require("./hooks/useMessages");
Object.defineProperty(exports, "useMessages", { enumerable: true, get: function () { return useMessages_1.useMessages; } });
//# sourceMappingURL=index.js.map