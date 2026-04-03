import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback, createContext, useContext } from "react";
import * as Device from "expo-device";
import Constants from "expo-constants";
import "../src/global.css";
import { useAuthStore, useSocketStore } from "../src/stores";
import api from "../src/config/api";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { OfflineBanner } from "../src/components/ui/OfflineBanner";

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
	if (!ctx) throw new Error("useUnreadCounts must be used within RootLayoutNav");
	return ctx;
}

SplashScreen.preventAutoHideAsync();

const isExpoGo = Constants.appOwnership === "expo";

// Show notifications when app is in foreground
if (!isExpoGo) {
	try {
		const Notifications = require("expo-notifications");
		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});
	} catch (err) {
		console.warn("Notifications setup failed:", err);
	}
}

function RootLayoutNav() {
	const router = useRouter();
	const segments = useSegments();
	const { isAuthenticated, userRole, setPushToken } = useAuthStore();
	const { connect, disconnect } = useSocketStore();
	const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
		notifications: 0,
		chat: 0,
	});

	const refreshUnreadCounts = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const [notifRes, chatRes] = await Promise.all([
				api.get<{ data: { count: number } }>("/api/notifications/unread-count").catch(() => ({ data: { data: { count: 0 } } })),
				api.get<{ data: { count: number } }>("/api/chat/unread-count").catch(() => ({ data: { data: { count: 0 } } })),
			]);
			setUnreadCounts({
				notifications: notifRes.data.data?.count || 0,
				chat: chatRes.data.data?.count || 0,
			});
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

	// Handle notification response (tap on notification) for deep linking
	useEffect(() => {
		if (!isAuthenticated || isExpoGo) return;

		const Notifications = require("expo-notifications");
		const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
			const data = response.notification.request.content.data;
			
			if (data.screen) {
				const screen = data.screen as string;
				const id = data.id as string;

				switch (screen) {
					case 'chat':
						router.push(`/chat/${id}`);
						break;
					case 'contract':
						router.push(`/contracts/${id}`);
						break;
					case 'delivery':
						router.push('/deliveries');
						break;
					case 'dispute':
						router.push('/disputes');
						break;
					case 'update':
						router.push(`/updates/${id}`);
						break;
					case 'notification':
						router.push('/notifications');
						break;
					default:
						router.push('/notifications');
				}
			} else {
				router.push('/notifications');
			}
			
			refreshUnreadCounts();
		});

		return () => subscription.remove();
	}, [isAuthenticated, refreshUnreadCounts, router]);

	useEffect(() => {
		// Register push notifications silently
		(async () => {
			if (!Device.isDevice || isExpoGo) return;

			try {
				const Notifications = require("expo-notifications");
				const { status: existingStatus } = await Notifications.getPermissionsAsync();
				let finalStatus = existingStatus;

				if (existingStatus !== "granted") {
					const { status } = await Notifications.requestPermissionsAsync();
					finalStatus = status;
				}

				if (finalStatus !== "granted") return;

				const projectId = Constants.expoConfig?.extra?.eas?.projectId;
				const tokenData = await Notifications.getExpoPushTokenAsync(
					projectId ? { projectId } : undefined,
				);

				// Set in store for login flow
				setPushToken(tokenData.data);

				// Register with backend if authenticated
				if (isAuthenticated) {
					await api.post("/api/users/push-token", {
						expo_push_token: tokenData.data,
					});
				}
			} catch (err) {
				console.log("Push registration failed:", err);
			}
		})();
	}, [isAuthenticated, setPushToken]);

	useEffect(() => {
		if (!isAuthenticated) return;

		const currentPath = segments[0];

		if (!currentPath) return;

		const isAuthRoute = ["login", "register"].includes(currentPath);

		if (isAuthRoute) {
			if (userRole === "farmer") {
				router.replace("/dashboard");
			} else if (userRole === "investor") {
				router.replace("/investor-dashboard");
			}
			return;
		}
	}, [isAuthenticated, userRole, segments]);

	return (
		<UnreadCountsContext.Provider value={{ unreadCounts, refreshUnreadCounts }}>
			<StatusBar hidden />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="login" />
				<Stack.Screen name="register" />
				<Stack.Screen name="marketplace" />
				<Stack.Screen name="dashboard" />
				<Stack.Screen name="investor-dashboard" />
				<Stack.Screen name="property/[id]" />
				<Stack.Screen name="chat/index" />
				<Stack.Screen name="chat/[id]" />
				<Stack.Screen name="profile" />
				<Stack.Screen name="notifications" />
				<Stack.Screen name="wallet" />
				<Stack.Screen name="contracts/index" />
				<Stack.Screen name="contracts/[id]" />
				<Stack.Screen name="listings/index" />
				<Stack.Screen name="listings/create" />
				<Stack.Screen name="listings/edit/[id]" />
				<Stack.Screen name="updates/[contractId]" />
				<Stack.Screen name="deliveries" />
				<Stack.Screen name="disputes" />
				<Stack.Screen name="reviews" />
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
			<RootLayoutNav />
		</ErrorBoundary>
	);
}
