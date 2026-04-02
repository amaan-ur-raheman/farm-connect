import { prisma } from "@/config/database";
import { NotificationType, Prisma } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export const createNotification = async (
	userId: string,
	type: NotificationType,
	title: string,
	message: string,
	data?: Record<string, unknown>,
) => {
	const notification = await prisma.notification.create({
		data: {
			user_id: userId,
			type,
			title,
			message,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: data ? (data as any) : Prisma.JsonNull,
		},
	});

	// Send push notification if user has a token
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { expo_push_token: true },
	});

	if (user?.expo_push_token && Expo.isExpoPushToken(user.expo_push_token)) {
		try {
			const receipts = await expo.sendPushNotificationsAsync([
				{ to: user.expo_push_token, title, body: message },
			]);
			for (const receipt of receipts) {
				if (receipt.status === "error") {
					console.error(
						"Expo push notification error:",
						receipt.message,
						receipt.details,
					);
				}
			}
		} catch (err) {
			console.error("Failed to send push notification:", err);
		}
	}

	return notification;
};

export const getNotifications = async (
	userId: string,
	page = 1,
	limit = 20,
) => {
	const skip = (page - 1) * limit;

	const [notifications, total, unreadCount] = await Promise.all([
		prisma.notification.findMany({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
			take: limit,
			skip,
		}),
		prisma.notification.count({ where: { user_id: userId } }),
		prisma.notification.count({ where: { user_id: userId, read: false } }),
	]);

	return {
		notifications,
		unread_count: unreadCount,
		pagination: {
			total,
			page,
			limit,
			pages: Math.ceil(total / limit),
		},
	};
};

export const markAsRead = async (notificationId: string, userId: string) => {
	return prisma.notification.updateMany({
		where: { id: notificationId, user_id: userId },
		data: { read: true },
	});
};

export const markAllAsRead = async (userId: string) => {
	return prisma.notification.updateMany({
		where: { user_id: userId, read: false },
		data: { read: true },
	});
};

export const getUnreadCount = async (userId: string) => {
	return prisma.notification.count({
		where: { user_id: userId, read: false },
	});
};
