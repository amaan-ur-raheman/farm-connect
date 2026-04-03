import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import "../src/global.css";
import { useAuthStore, useSocketStore } from "../src/stores";
import api from "../src/config/api";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

// Show notifications when app is in foreground
try {
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

function RootLayoutNav() {
	const router = useRouter();
	const segments = useSegments();
	const { isAuthenticated, userRole, setPushToken } = useAuthStore();
	const { connect, disconnect } = useSocketStore();

	useEffect(() => {
		if (isAuthenticated) {
			connect();
		} else {
			disconnect();
		}
	}, [isAuthenticated, connect, disconnect]);

	useEffect(() => {
		// Register push notifications silently
		(async () => {
			if (!Device.isDevice) return;

			try {
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
				router.replace("/marketplace");
			}
			return;
		}
	}, [isAuthenticated, userRole, segments]);

	return (
		<>
			<StatusBar hidden />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="login" />
				<Stack.Screen name="register" />
				<Stack.Screen name="marketplace" />
				<Stack.Screen name="dashboard" />
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
				<Stack.Screen name="updates/[contractId]" />
				<Stack.Screen name="deliveries" />
				<Stack.Screen name="disputes" />
				<Stack.Screen name="reviews" />
			</Stack>
		</>
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
			<RootLayoutNav />
		</ErrorBoundary>
	);
}
