import { createContext, useContext } from 'react';

// Context for unread counts (badges)
export interface UnreadCounts {
	notifications: number;
	chat: number;
}

export interface UnreadCountsContextType {
	unreadCounts: UnreadCounts;
	refreshUnreadCounts: () => Promise<void>;
}

export const UnreadCountsContext = createContext<UnreadCountsContextType | null>(null);

export function useUnreadCounts() {
	const ctx = useContext(UnreadCountsContext);
	if (!ctx)
		throw new Error("useUnreadCounts must be used within UnreadCountsProvider");
	return ctx;
}
