import { NativeModules } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

// Detection for environments where expo-notifications will crash
const isExpoGo = Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";
const hasNativeModule = !!NativeModules.ExpoNotificationsModule;
export const shouldSkipNotifications = isExpoGo || !hasNativeModule;

// Lazy load notifications helper to prevent evaluation at module load time
export const getNotificationsModule = () => {
	if (shouldSkipNotifications) return null;
	try {
		return require("expo-notifications");
	} catch (e) {
		console.warn("Failed to load expo-notifications", e);
		return null;
	}
};

export const setupNotificationHandler = () => {
	const Notifications = getNotificationsModule();
	if (Notifications && Notifications.setNotificationHandler) {
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
			console.warn("Notifications handler setup failed:", err);
		}
	}
};

export const registerForPushNotifications = async (projectId?: string) => {
	if (!Device.isDevice || shouldSkipNotifications) return null;

	try {
		const Notifications = getNotificationsModule();
		if (!Notifications || !Notifications.getPermissionsAsync) return null;

		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") return null;

		const tokenData = await Notifications.getExpoPushTokenAsync(
			projectId ? { projectId } : undefined,
		);
		return tokenData.data;
	} catch (err) {
		console.log("Push registration failed:", err);
		return null;
	}
};
