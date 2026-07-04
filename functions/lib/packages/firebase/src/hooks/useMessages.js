"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessages = useMessages;
const react_1 = require("react");
const conversationRealtime_1 = require("@countcard/firebase/services/conversationRealtime");
/**
 * Real-time subscription to messages in a conversation.
 * Unsubscribes on unmount or when conversationId changes.
 */
function useMessages(conversationId) {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        const unsubscribe = (0, conversationRealtime_1.subscribeMessages)(conversationId, (next) => {
            setMessages(next);
            setLoading(false);
        });
        return () => {
            unsubscribe();
        };
    }, [conversationId]);
    return { messages, loading, error };
}
//# sourceMappingURL=useMessages.js.map