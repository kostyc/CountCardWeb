"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConversations = useConversations;
const react_1 = require("react");
const conversationRealtime_1 = require("@countcard/firebase/services/conversationRealtime");
/**
 * Real-time subscription to conversations for the given user.
 * Unsubscribes on unmount or when userId changes.
 */
function useConversations(userId) {
    const [conversations, setConversations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!userId) {
            setConversations([]);
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        const unsubscribe = (0, conversationRealtime_1.subscribeConversationsForUser)(userId, (next) => {
            setConversations(next);
            setLoading(false);
        });
        return () => {
            unsubscribe();
        };
    }, [userId]);
    return { conversations, loading, error };
}
//# sourceMappingURL=useConversations.js.map