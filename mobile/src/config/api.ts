import ky, { HTTPError, type Options } from "ky";
import { useAuthStore } from "../stores/authStore";
import Constants from "expo-constants";

const getBaseUrl = (): string => {
	// Environment variable takes priority (set in .env or during build)
	if (process.env.EXPO_PUBLIC_API_URL) {
		console.log('[API Config] Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
		return process.env.EXPO_PUBLIC_API_URL;
	}
	// Fallback to app.json extra config
	const extra = Constants.expoConfig?.extra;
	if (extra?.apiUrl && extra.apiUrl !== "https://YOUR_PRODUCTION_URL/api") {
		console.log('[API Config] Using app.json apiUrl:', extra.apiUrl);
		return extra.apiUrl;
	}
	// Default to localhost for development
	console.log('[API Config] Using localhost fallback');
	return "http://localhost:3000";
};

export const BASE_URL = getBaseUrl();

// ky doesn't have axios-style interceptors, so we build a thin wrapper
// that exposes the same .get/.post/.patch/.put/.delete interface and
// returns { data: T } so all existing call-sites keep working unchanged.

type Method = "get" | "post" | "patch" | "put" | "delete";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
	refreshSubscribers.push(cb);
};

const onRefreshComplete = (token: string) => {
	refreshSubscribers.forEach((cb) => cb(token));
	refreshSubscribers = [];
};

async function request<T = unknown>(
	method: Method,
	path: string,
	body?: unknown,
	extraOptions?: Options,
): Promise<{ data: T }> {
	const { accessToken } = useAuthStore.getState();

	console.log(`[API] ${method.toUpperCase()} ${BASE_URL}${path}`);
	if (body && method !== 'get') {
		console.log(`[API] Request body:`, JSON.stringify(body));
	}

	const isFormData =
		typeof FormData !== "undefined" && body instanceof FormData;

	const headers: Record<string, string> = {
		// Don't set Content-Type for FormData — let the runtime set it with boundary
		...(isFormData ? {} : { "Content-Type": "application/json" }),
		...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		...(extraOptions?.headers as Record<string, string> | undefined),
	};

	const opts: Options = {
		...extraOptions,
		method,
		headers,
		timeout: 15000,
		...(body !== undefined
			? isFormData
				? { body: body as FormData }
				: { json: body }
			: {}),
	};

	const doRequest = (token?: string) => {
		const h = { ...headers };
		if (token) h.Authorization = `Bearer ${token}`;
		return ky(`${BASE_URL}${path}`, { ...opts, headers: h }).json<T>();
	};

	try {
		const data = await doRequest();
		return { data };
	} catch (err) {
		console.log(`[API] Error type:`, err?.constructor?.name || typeof err);
		console.log(`[API] Error details:`, JSON.stringify(err, null, 2));
		
		// Check if it's a network error (can't reach server)
		if (err instanceof TypeError && err.message.includes('Network')) {
			console.log(`[API] Network error - cannot reach ${BASE_URL}${path}`);
		}
		
		if (err instanceof HTTPError && err.response.status === 401) {
			console.log('[API] 401 Unauthorized - attempting token refresh');
			
			// Token refresh logic
			if (isRefreshing) {
				console.log('[API] Token refresh already in progress, queuing request');
				return new Promise<{ data: T }>((resolve, reject) => {
					subscribeTokenRefresh(async (newToken) => {
						try {
							const data = await doRequest(newToken);
							resolve({ data });
						} catch (e) {
							reject(e);
						}
					});
				});
			}

			isRefreshing = true;
			try {
				console.log('[API] Refreshing tokens...');
				const { refreshTokens, logout } = useAuthStore.getState();
				const newToken = await refreshTokens();
				
				if (newToken) {
					console.log('[API] Token refresh successful');
					onRefreshComplete(newToken);
					const data = await doRequest(newToken);
					return { data };
				} else {
					console.log('[API] Token refresh failed, logging out');
					// Refresh failed - logout user
					logout();
					// Optionally redirect to login
					try {
						const { router } = require('expo-router');
						router?.replace('/login');
					} catch {}
				}
			} catch (refreshError) {
				console.error('[API] Token refresh error:', refreshError);
				const { logout } = useAuthStore.getState();
				logout();
				try {
					const { router } = require('expo-router');
					router?.replace('/login');
				} catch {}
			} finally {
				isRefreshing = false;
				refreshSubscribers = [];
			}
		}
		throw err;
	}
}

// Axios-compatible surface used across the app
const api = {
	get: <T = unknown>(url: string, options?: Options) =>
		request<T>("get", url, undefined, options),

	post: <T = unknown>(url: string, body?: unknown, options?: Options) =>
		request<T>("post", url, body, options),

	patch: <T = unknown>(url: string, body?: unknown, options?: Options) =>
		request<T>("patch", url, body, options),

	put: <T = unknown>(url: string, body?: unknown, options?: Options) =>
		request<T>("put", url, body, options),

	delete: <T = unknown>(url: string, options?: Options) =>
		request<T>("delete", url, undefined, options),
};

export default api;

// Test connectivity - call this to verify API is reachable
export const testConnection = async (): Promise<{ reachable: boolean; message: string }> => {
	try {
		const response = await fetch(`${BASE_URL}/health`);
		if (response.ok) {
			return { reachable: true, message: 'API is reachable' };
		}
		return { reachable: false, message: `API returned status ${response.status}` };
	} catch (err) {
		return { reachable: false, message: `Cannot reach API at ${BASE_URL}` };
	}
};

// ─── Shared type exports (unchanged) ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	message?: string;
}

export interface AuthUser {
	id: string;
	phone: string;
	name: string | null;
	role: "FARMER" | "CONSUMER" | "ADMIN";
	kyc_status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
	kyc_documents?: Record<string, { url: string; uploaded_at: string }>;
	avatar_url?: string | null;
	farm_size_acres?: number;
	farm_type?: string;
	crops_grown?: string[];
	irrigation_type?: string;
	years_of_experience?: number;
	land_records_url?: string;
	soil_type?: string;
}

export interface ListingResponse {
	data: Listing[];
	pagination: { total: number; page: number; limit: number; pages: number };
}

export interface Listing {
	id: string;
	name: string;
	description: string | null;
	area_acres: number;
	price_per_acre: number;
	crops: string[];
	location_name: string;
	latitude: number | null;
	longitude: number | null;
	soil_type: string | null;
	irrigation_type: string | null;
	is_organic: boolean;
	expected_harvest_month: string | null;
	images: string[];
	status: string;
	farmer_id: string;
	created_at: string;
	updated_at: string;
	distance_km?: number;
	farmer?: {
		id: string;
		name: string | null;
		avatar_url: string | null;
		kyc_status: string;
	};
}

export interface Contract {
	id: string;
	consumer_id: string;
	farmer_id: string;
	listing_id: string;
	crop: string;
	acreage: number;
	price_per_acre: number;
	total_amount: number;
	total_cycles: number;
	escrow_held: number;
	escrow_frozen: number;
	farmer_paid: number;
	status: string;
	start_date: string;
	end_date: string;
	created_at: string;
	updated_at: string;
	listing?: Listing;
	consumer?: { id: string; name: string | null; phone: string; avatar_url?: string | null };
	farmer?: { id: string; name: string | null; phone: string; avatar_url?: string | null };
}

export interface WalletBalance {
	balance: number;
	currency: string;
	pending: number;
}

export interface WalletTransaction {
	id: string;
	type: "CREDIT" | "DEBIT";
	status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
	amount: number;
	description: string;
	reference?: string;
	created_at: string;
}

export interface FarmUpdate {
	id: string;
	contract_id: string;
	title: string;
	description: string;
	media_urls: string[];
	created_at: string;
}

export interface Delivery {
	id: string;
	contract_id: string;
	batch_number: string;
	quantity_kg: number;
	quality_grade: string;
	status: "PENDING" | "HARVESTED" | "IN_TRANSIT" | "DELIVERED" | "VERIFIED" | "REJECTED";
	proof_url?: string;
	created_at: string;
	contract?: Contract;
}

export interface Dispute {
	id: string;
	contract_id: string;
	reason: string;
	description: string;
	evidence_urls: string[];
	status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "ESCALATED";
	created_at: string;
}

export interface Review {
	id: string;
	contract_id: string;
	listing_id: string;
	reviewer_id: string;
	rating: number;
	comment: string;
	created_at: string;
}

export interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	data?: Record<string, unknown>;
	read: boolean;
	created_at: string;
}

export interface Conversation {
	id: string;
	user_id: string;
	other_user: { id: string; name: string | null; avatar_url: string | null };
	last_message?: { text: string; created_at: string };
	unread_count: number;
	created_at: string;
}

export interface ChatMessage {
	id: string;
	conversation_id: string;
	sender_id: string;
	text: string;
	media_url?: string;
	created_at: string;
}

export interface EscrowLedgerEntry {
	id: string;
	contract_id: string;
	event: string;
	amount: number;
	description: string;
	created_at: string;
}
