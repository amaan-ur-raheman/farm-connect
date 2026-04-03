import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HTTPError } from "ky";
import api, { AuthUser, BASE_URL } from "../config/api";

export type UserRole = "investor" | "farmer" | null;

const getErrorMessage = async (
	err: unknown,
	fallback: string,
): Promise<string> => {
	console.log('[Auth Error] Error type:', err?.constructor?.name || typeof err);
	
	if (err instanceof HTTPError) {
		console.log('[Auth Error] HTTP Error status:', err.response?.status);
		console.log('[Auth Error] HTTP Error body:', await err.response.text().catch(() => 'No body'));
		try {
			const body = (await err.response.json()) as { message?: string };
			return body?.message || fallback;
		} catch {
			return fallback;
		}
	}
	if (err instanceof TypeError) {
		console.log('[Auth Error] TypeError message:', err.message);
		if (err.message.includes('Network') || err.message.includes('network')) {
			return 'Cannot connect to server. Please check your internet connection.';
		}
		return err.message || fallback;
	}
	if (err instanceof Error) {
		console.log('[Auth Error] Error message:', err.message);
		return err.message || fallback;
	}
	return fallback;
};

const mapBackendRoleToMobile = (backendRole: string): UserRole => {
	if (backendRole === "FARMER") return "farmer";
	if (backendRole === "CONSUMER") return "investor";
	return null;
};

const mapMobileRoleToBackend = (mobileRole: UserRole): string | null => {
	if (mobileRole === "farmer") return "FARMER";
	if (mobileRole === "investor") return "CONSUMER";
	return null;
};

interface AuthState {
	isAuthenticated: boolean;
	userRole: UserRole;
	accessToken: string | null;
	refreshToken: string | null;
	phone: string | null;
	pushToken: string | null;
	authUser: AuthUser | null;
	isLoading: boolean;
	error: string | null;

	setAuthenticated: (isAuthenticated: boolean) => void;
	setUserRole: (role: UserRole) => void;
	setPushToken: (token: string | null) => void;
	loginWithOtp: (phone: string, otp: string) => Promise<boolean>;
	sendOtp: (
		phone: string,
	) => Promise<{ success: boolean; devOtp: string | null }>;
	refreshTokens: () => Promise<string | null>;
	logout: () => Promise<void>;
	clearError: () => void;
	setPhone: (phone: string) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			isAuthenticated: false,
			userRole: null,
			accessToken: null,
			refreshToken: null,
			phone: null,
			pushToken: null,
			authUser: null,
			isLoading: false,
			error: null,

			setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

			setUserRole: (userRole) => set({ userRole }),

			setPushToken: (pushToken) => set({ pushToken }),

			setPhone: (phone) => set({ phone }),

			sendOtp: async (phone: string) => {
				set({ isLoading: true, error: null });
				console.log('[Auth] Sending OTP to:', phone);
				console.log('[Auth] API URL being used:', BASE_URL);
				try {
					const response = await api.post("/api/auth/otp/send", {
						phone,
					});
					console.log('[Auth] OTP send response:', JSON.stringify(response.data));
					const devOtp = (response.data as any)?.data?.devOtp || null;
					set({ isLoading: false, phone });
					return { success: true, devOtp };
				} catch (err: unknown) {
					const message = await getErrorMessage(
						err,
						"Failed to send OTP",
					);
					set({ isLoading: false, error: message });
					return { success: false, devOtp: null };
				}
			},

			loginWithOtp: async (phone: string, otp: string) => {
				set({ isLoading: true, error: null });
				try {
					const { pushToken } = get();
					const requestBody: { phone: string; otp: string; fcmToken?: string } = {
						phone,
						otp,
					};
					// Only include fcmToken if it has a value (backend rejects null)
					if (pushToken) {
						requestBody.fcmToken = pushToken;
					}
					const response = await api.post("/api/auth/otp/verify", requestBody);
					const { user, accessToken, refreshToken } = (
						response.data as any
					).data;

					const mobileRole = mapBackendRoleToMobile(user.role);

					set({
						isAuthenticated: true,
						userRole: mobileRole,
						accessToken,
						refreshToken,
						phone,
						authUser: user,
						isLoading: false,
					});
					return true;
				} catch (err: unknown) {
					const message = await getErrorMessage(err, "Invalid OTP");
					set({ isLoading: false, error: message });
					return false;
				}
			},

			refreshTokens: async () => {
				const { refreshToken } = get();
				if (!refreshToken) return null;

				try {
					const response = await api.post("/api/auth/refresh", {
						refreshToken,
					});
					const { accessToken, refreshToken: newRefreshToken } = (
						response.data as any
					).data;

					set({ accessToken, refreshToken: newRefreshToken });

					// Reconnect socket with new token
					try {
						const { reconnectWithNewToken } =
							require("./socketStore").useSocketStore.getState();
						reconnectWithNewToken();
					} catch (err) {
						console.log("Socket reconnection failed:", err);
					}

					return accessToken;
				} catch {
					set({
						isAuthenticated: false,
						accessToken: null,
						refreshToken: null,
						phone: null,
						authUser: null,
					});
					return null;
				}
			},

			logout: async () => {
				const { accessToken } = get();
				try {
					if (accessToken) {
						await api.post(
							"/api/auth/logout",
							{},
							{
								headers: {
									Authorization: `Bearer ${accessToken}`,
								},
							},
						);
					}
				} catch {
					// ignore logout API errors
				} finally {
					set({
						isAuthenticated: false,
						userRole: null,
						accessToken: null,
						refreshToken: null,
						phone: null,
						authUser: null,
						isLoading: false,
						error: null,
					});
				}
			},

			clearError: () => set({ error: null }),
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				isAuthenticated: state.isAuthenticated,
				userRole: state.userRole,
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				phone: state.phone,
				authUser: state.authUser,
			}),
		},
	),
);
