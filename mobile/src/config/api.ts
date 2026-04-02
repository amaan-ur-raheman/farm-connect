import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = 'http://localhost:3000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshComplete = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshTokens } = useAuthStore.getState();
        const newTokens = await refreshTokens();
        if (newTokens) {
          onRefreshComplete(newTokens);
        }
        originalRequest.headers.Authorization = `Bearer ${newTokens}`;
        return api(originalRequest);
      } catch {
        const { logout: clearAuth } = useAuthStore.getState();
        clearAuth();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
        refreshSubscribers = [];
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: 'FARMER' | 'CONSUMER' | 'ADMIN';
  kyc_status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
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
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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
  type: 'CREDIT' | 'DEBIT';
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
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'VERIFIED' | 'REJECTED';
  proof_url?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  contract_id: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED';
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
  other_user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    text: string;
    created_at: string;
  };
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

export default api;
