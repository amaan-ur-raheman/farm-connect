import ky, { HTTPError, type Options } from "ky";
import { useAuthStore } from "../stores/authStore";
import Constants from "expo-constants";

const getBaseUrl = (): string => {
	const extra = Constants.expoConfig?.extra;
	if (extra?.apiUrl) {
		return extra.apiUrl;
	}
	if (process.env.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}
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
		if (err instanceof HTTPError && err.response.status === 401) {
			// Token refresh logic
			if (isRefreshing) {
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
				const { refreshTokens } = useAuthStore.getState();
				const newToken = await refreshTokens();
				if (newToken) {
					onRefreshComplete(newToken);
					const data = await doRequest(newToken);
					return { data };
				}
			} catch {
				const { logout } = useAuthStore.getState();
				logout();
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
	listing_id: string;
	amount_per_cycle: number;
	total_cycles: number;
	escrow_held: number;
	farmer_paid: number;
	status: string;
	created_at: string;
	listing?: Listing;
	consumer?: { id: string; name: string; phone: string };
	farmer?: { id: string; name: string; phone: string };
}

export interface WalletBalance {
	balance: number;
	currency: string;
	pending: number;
}

export interface WalletTransaction {
	id: string;
	type: "CREDIT" | "DEBIT";
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
	status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "VERIFIED" | "REJECTED";
	proof_url?: string;
	created_at: string;
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
