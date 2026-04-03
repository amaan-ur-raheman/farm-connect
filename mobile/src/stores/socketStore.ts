import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { BASE_URL, ChatMessage } from "../config/api";
import { useAuthStore } from "./authStore";

interface SocketState {
	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
	emit: (event: string, data: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
	socket: null,
	isConnected: false,

	connect: () => {
		const { accessToken, isAuthenticated } = useAuthStore.getState();
		const { socket } = get();

		if (!isAuthenticated || !accessToken) {
			if (socket) {
				socket.disconnect();
				set({ socket: null, isConnected: false });
			}
			return;
		}

		if (socket?.connected) return;

		const newSocket = io(BASE_URL, {
			auth: { token: accessToken },
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		newSocket.on("connect", () => {
			console.log("✅ Socket connected:", newSocket.id);
			set({ isConnected: true });
		});

		newSocket.on("disconnect", () => {
			console.log("❌ Socket disconnected");
			set({ isConnected: false });
		});

		newSocket.on("connect_error", (err) => {
			console.error("⚠️ Socket connection error:", err.message);
			set({ isConnected: false });
		});

		// Global notification listener
		newSocket.on("new_notification", (notification: any) => {
			console.log("🔔 New notification received:", notification.title);
		});

		// Contract updates
		newSocket.on("contract_update", (data: { type: string; id: string }) => {
			console.log("📝 Contract update:", data.type, data.id);
		});

		// Delivery updates
		newSocket.on("delivery_update", (data: { type: string; id: string; contract_id: string }) => {
			console.log("📦 Delivery update:", data.type, data.id);
		});

		// Dispute alerts
		newSocket.on("dispute_alert", (data: { type: string; id: string; contract_id: string }) => {
			console.log("⚖️ Dispute alert:", data.type, data.id);
		});

		set({ socket: newSocket });
	},

	disconnect: () => {
		const { socket } = get();
		if (socket) {
			socket.disconnect();
			set({ socket: null, isConnected: false });
		}
	},

	emit: (event: string, data: any) => {
		const { socket } = get();
		if (socket && socket.connected) {
			socket.emit(event, data);
		} else {
			console.warn(`Attempted to emit ${event} while socket is disconnected`);
		}
	},
}));
