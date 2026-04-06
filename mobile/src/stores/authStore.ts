import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HTTPError } from "ky";
import ky from "ky";
import api, { AuthUser, BASE_URL } from "../config/api";

export type UserRole = "consumer" | "farmer" | null;

const getErrorMessage = async (
	err: unknown,
	fallback: string,
): Promise<string> => {
	if (__DEV__) console.log('[Auth Error] Error type:', err?.constructor?.name || typeof err);

	if (err instanceof HTTPError) {
		if (__DEV__) console.log('[Auth Error] HTTP Error status:', err.response?.status);
		if (__DEV__) console.log('[Auth Error] HTTP Error body:', await err.response.text().catch(() => 'No body'));
		try {
			const body = (await err.response.json()) as { message?: string };
			return body?.message || fallback;
		} catch {
			return fallback;
		}
	}
	if (err instanceof TypeError) {
		if (__DEV__) console.log('[Auth Error] TypeError message:', err.message);
		if (err.message.includes('Network') || err.message.includes('network')) {
			return 'Cannot connect to server. Please check your internet connection.';
		}
		return err.message || fallback;
	}
	if (err instanceof Error) {
		if (__DEV__) console.log('[Auth Error] Error message:', err.message);
		return err.message || fallback;
	}
	return fallback;
};

const mapBackendRoleToMobile = (backendRole: string): UserRole => {
	if (backendRole === "FARMER") return "farmer";
	if (backendRole === "CONSUMER") return "consumer";
	return null;
};

const mapMobileRoleToBackend = (mobileRole: UserRole): string | null => {
	if (mobileRole === "farmer") return "FARMER";
	if (mobileRole === "consumer") return "CONSUMER";
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
	isRegistrationComplete: boolean;

	setAuthenticated: (isAuthenticated: boolean) => void;
	setUserRole: (role: UserRole) => void;
	setPushToken: (token: string | null) => void;
	setRegistrationComplete: (complete: boolean) => void;
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
			userRole: "consumer",
			accessToken: null,
			refreshToken: null,
			phone: null,
			pushToken: null,
			authUser: null,
			isLoading: false,
			error: null,
			isRegistrationComplete: false,

			setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

			setUserRole: (userRole) => set({ userRole }),

			setPushToken: (pushToken) => set({ pushToken }),

			setRegistrationComplete: (isRegistrationComplete) => set({ isRegistrationComplete }),

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
					const devOtp = (response.data as any)?.devOtp || null;
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
					const { user, accessToken, refreshToken } = (response.data as any).data;

					// Assign default DiceBear avatar if missing
					if (!user?.avatar_url) {
						user.avatar_url = `https://api.dicebear.com/9.x/glass/svg?seed=${user?.name || user?.id}`;
					}

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
					// Use ky directly to avoid circular dependency with api interceptor
					const response = await ky.post(`${BASE_URL}/api/auth/refresh`, {
						json: { refreshToken },
					}).json<{ data: { accessToken: string; refreshToken: string } }>();

					const { accessToken, refreshToken: newRefreshToken } = response.data;

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
				} catch (error) {
					if (__DEV__) {
						console.error('[Auth] Token refresh failed:', error);
					}
					// Clear auth state on refresh failure
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
						isRegistrationComplete: false,
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
				isRegistrationComplete: state.isRegistrationComplete,
			}),
			migrate: (persistedState: any) => {
				if (persistedState && persistedState.userRole === null) {
					persistedState.userRole = "consumer";
				}
				if (persistedState && persistedState.userRole === "investor") {
					persistedState.userRole = "consumer";
				}
				return persistedState;
			},
		},
	),
);
