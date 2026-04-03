import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
	useEffect,
	useState,
	useCallback,
	createContext,
	useContext,
	useRef,
} from "react";
import Constants from "expo-constants";
import "../src/global.css";
import { useAuthStore, useSocketStore } from "../src/stores";
import api from "../src/config/api";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { OfflineBanner } from "../src/components/ui/OfflineBanner";
import { ToastContainer } from "../src/components/ui/Toast";
import {
	setupNotificationHandler,
	getNotificationsModule,
	shouldSkipNotifications,
	registerForPushNotifications,
} from "../src/utils/notifications";

// Context for unread counts (badges)
interface UnreadCounts {
	notifications: number;
	chat: number;
}

interface UnreadCountsContextType {
	unreadCounts: UnreadCounts;
	refreshUnreadCounts: () => Promise<void>;
}

const UnreadCountsContext = createContext<UnreadCountsContextType | null>(null);

export function useUnreadCounts() {
	const ctx = useContext(UnreadCountsContext);
	if (!ctx)
		throw new Error("useUnreadCounts must be used within RootLayoutNav");
	return ctx;
}

SplashScreen.preventAutoHideAsync();

// Initial notification setup
setupNotificationHandler();

function RootLayoutNav() {
	const { isAuthenticated, setPushToken } = useAuthStore();
	const { connect, disconnect } = useSocketStore();
	const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
		notifications: 0,
		chat: 0,
	});
	const isMounted = useRef(false);

	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	const refreshUnreadCounts = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const [notifRes, chatRes] = await Promise.all([
				api
					.get<{
						data: { count: number };
					}>("/api/notifications/unread-count")
					.catch(() => ({ data: { data: { count: 0 } } })),
				api
					.get<{ data: { count: number } }>("/api/chat/unread-count")
					.catch(() => ({ data: { data: { count: 0 } } })),
			]);
			if (isMounted.current) {
				setUnreadCounts({
					notifications: notifRes.data.data?.count || 0,
					chat: chatRes.data.data?.count || 0,
				});
			}
		} catch (err) {
			console.log("Failed to refresh unread counts:", err);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		if (isAuthenticated) {
			connect();
			refreshUnreadCounts();
		} else {
			disconnect();
			setUnreadCounts({ notifications: 0, chat: 0 });
		}
	}, [isAuthenticated, connect, disconnect, refreshUnreadCounts]);

	// Poll unread counts every 30 seconds
	useEffect(() => {
		if (!isAuthenticated) return;
		const interval = setInterval(refreshUnreadCounts, 30000);
		return () => clearInterval(interval);
	}, [isAuthenticated, refreshUnreadCounts]);

	useEffect(() => {
		// Handle push notifications
		if (shouldSkipNotifications) return;

		const Notifications = getNotificationsModule();
		if (!Notifications) return;

		// Listener for notification clicks
		const subscription =
			Notifications.addNotificationResponseReceivedListener(
				(response: any) => {
					// Deep linking logic moved to index.tsx or handled manually if needed
					// For now just refresh counts
					refreshUnreadCounts();
				},
			);

		// Register token
		(async () => {
			const projectId = Constants.expoConfig?.extra?.eas?.projectId;
			const token = await registerForPushNotifications(projectId);
			if (token && isMounted.current) {
				setPushToken(token);
				if (isAuthenticated) {
					await api
						.post("/api/users/push-token", {
							expo_push_token: token,
						})
						.catch(() => {});
				}
			}
		})();

		return () => subscription.remove();
	}, [isAuthenticated, setPushToken, refreshUnreadCounts]);

	return (
		<UnreadCountsContext.Provider
			value={{ unreadCounts, refreshUnreadCounts }}
		>
			<StatusBar hidden />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="index" />
				<Stack.Screen name="onboarding" />
				<Stack.Screen name="login" />
				<Stack.Screen name="register" />
				<Stack.Screen name="favorites" />
				<Stack.Screen name="help" />
				<Stack.Screen name="property/[id]" />
				<Stack.Screen name="chat/[id]" />
				<Stack.Screen name="notifications" />
				<Stack.Screen name="wallet" />
				<Stack.Screen name="contracts/[id]" />
				<Stack.Screen name="listings/create" />
				<Stack.Screen name="listings/edit/[id]" />
				<Stack.Screen name="updates/[contractId]" />
				<Stack.Screen name="deliveries" />
				<Stack.Screen name="disputes" />
				<Stack.Screen name="reviews" />
				<Stack.Screen name="investor-dashboard" />
			</Stack>
		</UnreadCountsContext.Provider>
	);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	return (
		<ErrorBoundary>
			<OfflineBanner />
			<ToastContainer />
			<RootLayoutNav />
		</ErrorBoundary>
	);
}
