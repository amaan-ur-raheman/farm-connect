import ky, { HTTPError, type Options } from "ky";
import Constants from "expo-constants";
import { ZodSchema } from 'zod';
import { router } from 'expo-router';

const getBaseUrl = (): string => {
	// Environment variable MUST be present for production safety
	if (process.env.EXPO_PUBLIC_API_URL) {
		if (__DEV__) {
			console.log('[API Config] Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
		}
		return process.env.EXPO_PUBLIC_API_URL;
	}
	
	// Fail loudly if API URL is missing to prevent silent local IPs in production
	throw new Error(
		"CRITICAL: EXPO_PUBLIC_API_URL is missing. " +
		"Please define it in your .env file or environment variables before building the app."
	);
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

const getAuthStore = () => {
	return require("../stores/authStore").useAuthStore;
};

async function request<T = unknown>(
	method: Method,
	path: string,
	body?: unknown,
	extraOptions?: Options,
	schema?: ZodSchema<T>
): Promise<{ data: T }> {
	const useAuthStore = getAuthStore();
	const { accessToken } = useAuthStore.getState();

	if (__DEV__) {
		console.log(`[API] ${method.toUpperCase()} ${BASE_URL}${path}`);
		if (body && method !== 'get') {
			console.log(`[API] Request body:`, JSON.stringify(body));
		}
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
		return ky(`${BASE_URL}${path}`, { ...opts, headers: h }).json<{ data?: unknown; success?: boolean } | unknown>();
	};

	try {
		const result = await doRequest();
		const rawData = (result as any)?.data !== undefined ? (result as any).data : result;

		if (schema) {
			try {
				if (__DEV__) {
					const shape = (schema as any).shape;
					const dataShape = shape?.data?.shape;
					console.log(`[API] Schema shape keys:`, Object.keys(shape || {}));
					if (dataShape) {
						console.log(`[API] Data schema shape keys:`, Object.keys(dataShape));
					}
				}
				const parsedData = schema.parse(result);
				return { data: parsedData };
			} catch (parseError) {
				console.error('[API Zod Parse Error]', parseError);
				// We can choose to throw or return the raw data.
				// In a strict app, we throw.
				throw parseError;
			}
		}

		return { data: result as T };
	} catch (err) {
		if (__DEV__) {
			console.log(`[API] Error type:`, err?.constructor?.name || typeof err);
			console.log(`[API] Error details:`, JSON.stringify(err, null, 2));

			// Check if it's a network error (can't reach server)
			if (err instanceof TypeError && err.message.includes('Network')) {
				console.log(`[API] Network error - cannot reach ${BASE_URL}${path}`);
			}
		}

		if (err instanceof HTTPError && err.response.status === 401) {
			if (__DEV__) {
				console.log('[API] 401 Unauthorized - attempting token refresh');
			}

			// Token refresh logic
			if (isRefreshing) {
				if (__DEV__) {
					console.log('[API] Token refresh already in progress, queuing request');
				}
				return new Promise<{ data: T }>((resolve, reject) => {
					subscribeTokenRefresh(async (newToken) => {
						try {
							const result = await doRequest(newToken);
							const rawData = (result as any)?.data !== undefined ? (result as any).data : result;
							if (schema) {
								resolve({ data: schema.parse(result) });
							} else {
								resolve({ data: result as T });
							}
						} catch (e) {
							reject(e);
						}
					});
				});
			}

			isRefreshing = true;
			try {
				if (__DEV__) {
					console.log('[API] Refreshing tokens...');
				}
				const useAuthStore = getAuthStore();
				const { refreshTokens, logout } = useAuthStore.getState();
				const newToken = await refreshTokens();

				if (newToken) {
					if (__DEV__) {
						console.log('[API] Token refresh successful');
					}
					onRefreshComplete(newToken);
					const result = await doRequest(newToken);
					const rawData = (result as any)?.data !== undefined ? (result as any).data : result;
					if (schema) {
						return { data: schema.parse(result) };
					}
					return { data: result as T };
				} else {
					if (__DEV__) {
						console.log('[API] Token refresh failed, logging out');
					}
					// Refresh failed - logout user
					logout();
					// Redirect to login
					try {
						setTimeout(() => router.replace('/login'), 0);
					} catch (navError) {
						if (__DEV__) {
							console.error('[API] Navigation error:', navError);
						}
					}
					throw new Error('Session expired. Please login again.');
				}
			} catch (refreshError) {
				if (__DEV__) {
					console.error('[API] Token refresh error:', refreshError);
				}
				const useAuthStore = getAuthStore();
				const { logout } = useAuthStore.getState();
				logout();
				try {
					setTimeout(() => router.replace('/login'), 0);
				} catch (navError) {
					if (__DEV__) {
						console.error('[API] Navigation error:', navError);
					}
				}
				throw new Error('Session expired. Please login again.');
			} finally {
				isRefreshing = false;
				refreshSubscribers = [];
			}
		}
		throw err;
	}
}

// Variant of request that preserves the full response envelope (for paginated endpoints)
async function requestFull<T = unknown>(
	method: Method,
	path: string,
	body?: unknown,
	extraOptions?: Options,
	schema?: ZodSchema<T>
): Promise<{ data: T }> {
	const useAuthStore = getAuthStore();
	const { accessToken } = useAuthStore.getState();

	if (__DEV__) {
		console.log(`[API] ${method.toUpperCase()} ${BASE_URL}${path}`);
		if (body && method !== 'get') {
			console.log(`[API] Request body:`, JSON.stringify(body));
		}
	}

	const isFormData =
		typeof FormData !== "undefined" && body instanceof FormData;

	const headers: Record<string, string> = {
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
		const result = await doRequest();
		return { data: result };
	} catch (err) {
		if (__DEV__) {
			console.log(`[API] Error type:`, err?.constructor?.name || typeof err);
			console.log(`[API] Error details:`, JSON.stringify(err, null, 2));

			if (err instanceof TypeError && err.message.includes('Network')) {
				console.log(`[API] Network error - cannot reach ${BASE_URL}${path}`);
			}
		}
		throw err;
	}
}

// Axios-compatible surface used across the app
const api = {
	get: <T = unknown>(url: string, options?: Options, schema?: ZodSchema<T>) =>
		request<T>("get", url, undefined, options, schema),

	post: <T = unknown>(url: string, body?: unknown, options?: Options, schema?: ZodSchema<T>) =>
		request<T>("post", url, body, options, schema),

	patch: <T = unknown>(url: string, body?: unknown, options?: Options, schema?: ZodSchema<T>) =>
		request<T>("patch", url, body, options, schema),

	put: <T = unknown>(url: string, body?: unknown, options?: Options, schema?: ZodSchema<T>) =>
		request<T>("put", url, body, options, schema),

	delete: <T = unknown>(url: string, options?: Options, schema?: ZodSchema<T>) =>
		request<T>("delete", url, undefined, options, schema),

	// Get the full response envelope (for paginated endpoints)
	getFull: <T = unknown>(url: string, options?: Options, schema?: ZodSchema<T>) =>
		requestFull<T>("get", url, undefined, options, schema),
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
		phone?: string;
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
	farmer_id: string;
	media_url: string;
	media_type: string;
	caption: string | null;
	wage_released: number;
	created_at: string;
	farmer?: { name: string | null; avatar_url: string | null };
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
	sender?: {
		id: string;
		name: string | null;
		avatar_url: string | null;
	};
}

export interface EscrowLedgerEntry {
	id: string;
	contract_id: string;
	event: string;
	amount: number;
	description: string;
	created_at: string;
}

export interface ConsumerStats {
	totalInvested: number;
	activeInvestments: number;
	totalYield: number;
	recentUpdates: Array<{
		id: string;
		contract_id: string;
		media_url: string;
		caption: string;
		created_at: string;
		contract: { listing: { name: string } };
	}>;
}
