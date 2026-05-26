import { z } from 'zod';
console.log('--- LOADING SCHEMAS.TS ---');
// FORCE REBUILD: 1775183909516

// ─── User / Auth ─────────────────────────────────────────────────────────────

export const AuthUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable().optional(),
  role: z.enum(['FARMER', 'CONSUMER', 'ADMIN']),
  kyc_status: z.enum(['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED']),
  kyc_documents: z.record(z.object({
    url: z.string(),
    uploaded_at: z.string(),
  })).optional(),
  avatar_url: z.string().nullable().optional(),
  farm_size_acres: z.number().nullable().optional(),
  farm_type: z.string().nullable().optional(),
  crops_grown: z.array(z.string()).nullable().optional(),
  irrigation_type: z.string().nullable().optional(),
  years_of_experience: z.number().nullable().optional(),
  land_records_url: z.string().nullable().optional(),
  soil_type: z.string().nullable().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  role: z.enum(['FARMER', 'CONSUMER', 'ADMIN']),
  avatar_url: z.string().nullable().optional(),
  kyc_status: z.enum(['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED']),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

// ─── Listings ────────────────────────────────────────────────────────────────

export const ListingSchema = z.object({
  id: z.string(),
  farmer_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  area_acres: z.number(),
  price_per_acre: z.number(),
  location_name: z.string(),
  crops: z.array(z.string()).optional(),
  soil_type: z.string().nullable().optional(),
  is_organic: z.boolean().optional(),
  images: z.array(z.string()).optional().default([]),
  status: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  irrigation_type: z.string().nullable().optional(),
  expected_harvest_month: z.string().nullable().optional(),
  distance_km: z.number().optional(),
  farmer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    kyc_status: z.string(),
    phone: z.string().optional(),
  }).optional().nullable(),
});

export const ListingResponseSchema = z.object({
  data: z.array(ListingSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

// ─── Contracts ───────────────────────────────────────────────────────────────

export const ContractSchema = z.object({
  id: z.string(),
  listing_id: z.string().nullish(),
  farmer_id: z.string(),
  consumer_id: z.string(),
  crop: z.string().nullish(),
  acreage: z.number().nullish(),
  price_per_acre: z.number().nullish(),
  total_amount: z.number().nullish(),
  total_cycles: z.number().optional().default(1),
  status: z.string(),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  escrow_held: z.number().nullish(),
  escrow_frozen: z.number().optional().default(0),
  farmer_paid: z.number().nullish(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  listing: ListingSchema.partial().optional().nullable(),
  consumer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    phone: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
  }).optional().nullable(),
  farmer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    phone: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
  }).optional().nullable(),
});

// ─── Farm Updates ────────────────────────────────────────────────────────────

export const FarmUpdateSchema = z.object({
  id: z.string(),
  contract_id: z.string(),
  farmer_id: z.string(),
  media_url: z.string(),
  media_type: z.string(),
  caption: z.string().nullable().optional(),
  wage_released: z.number().optional().default(0),
  created_at: z.string(),
  farmer: z.object({
    name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }).optional().nullable(),
  contract: z.object({
    listing: z.object({
      name: z.string().optional(),
    }).optional(),
  }).optional().nullable(),
});

// ─── Deliveries ──────────────────────────────────────────────────────────────

export const DeliverySchema = z.object({
  id: z.string(),
  contract_id: z.string(),
  batch_number: z.string(),
  quantity_kg: z.number(),
  quality_grade: z.string(),
  status: z.enum([
    'PENDING',
    'HARVESTED',
    'IN_TRANSIT',
    'DELIVERED',
    'VERIFIED',
    'REJECTED',
  ]),
  proof_url: z.string().nullable().optional(),
  created_at: z.string(),
  contract: ContractSchema.optional().nullable(),
});

// ─── Disputes ────────────────────────────────────────────────────────────────

export const DisputeSchema = z.object({
  id: z.string(),
  contract_id: z.string(),
  reason: z.string(),
  description: z.string(),
  evidence_urls: z.array(z.string()),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED']),
  created_at: z.string(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const ReviewSchema = z.object({
  id: z.string(),
  contract_id: z.string(),
  listing_id: z.string().nullish(),
  reviewer_id: z.string(),
  rating: z.number(),
  comment: z.string(),
  created_at: z.string(),
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  read: z.boolean(),
  created_at: z.string(),
});

// ─── Chat ────────────────────────────────────────────────────────────────────

export const ConversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  other_user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }),
  last_message: z.object({
    text: z.string(),
    created_at: z.string(),
  }).optional(),
  unread_count: z.number(),
  created_at: z.string(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  text: z.string(),
  media_url: z.string().optional(),
  created_at: z.string(),
});

// ─── Escrow ──────────────────────────────────────────────────────────────────

export const EscrowLedgerEntrySchema = z.object({
  id: z.string(),
  contract_id: z.string(),
  event: z.string(),
  amount: z.number(),
  description: z.string(),
  created_at: z.string(),
});

// ─── Wallet ──────────────────────────────────────────────────────────────────

export const WalletBalanceSchema = z.object({
  balance: z.number(),
  pending: z.number().optional().default(0),
});

export const WalletTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['CREDIT', 'DEBIT']),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']),
  amount: z.number(),
  description: z.string(),
  reference: z.string().optional(),
  created_at: z.string(),
});

// ─── Investor Dashboard ──────────────────────────────────────────────────────

export const ConsumerStatsSchema = z.object({
  totalInvested: z.number(),
  activeInvestments: z.number(),
  totalYield: z.number(),
  recentUpdates: z.array(z.object({
    id: z.string(),
    contract_id: z.string(),
    media_url: z.string(),
    caption: z.string().nullable().optional(),
    created_at: z.string(),
    contract: z.object({
      listing: z.object({
        name: z.string().optional(),
      }).optional(),
    }).optional(),
  })).optional(),
});

// ─── API Response Wrappers ───────────────────────────────────────────────────
// All backend responses are wrapped in { success: boolean, data: T }

export const SuccessResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

// Common response wrappers
export const ContractsResponseSchema = SuccessResponse(z.array(ContractSchema));
export const ContractResponseSchema = SuccessResponse(ContractSchema);
export const FarmUpdatesResponseSchema = SuccessResponse(z.array(FarmUpdateSchema));
export const WalletBalanceResponseSchema = SuccessResponse(z.any());
export const WalletTransactionsResponseSchema = SuccessResponse(z.array(WalletTransactionSchema));
export const ConsumerStatsResponseSchema = SuccessResponse(ConsumerStatsSchema);
export const DeliveriesResponseSchema = SuccessResponse(z.array(DeliverySchema));
export const NotificationsResponseSchema = SuccessResponse(z.array(NotificationSchema));
export const UnreadCountResponseSchema = SuccessResponse(z.object({ count: z.number() }));
export const ListingsResponseSchema = SuccessResponse(ListingResponseSchema);
export const ConversationsResponseSchema = SuccessResponse(z.array(ConversationSchema));
export const MessagesResponseSchema = SuccessResponse(z.array(ChatMessageSchema));
export const ReviewsResponseSchema = SuccessResponse(z.array(ReviewSchema));
export const DisputesResponseSchema = SuccessResponse(z.array(DisputeSchema));
export const UserProfileResponseSchema = SuccessResponse(UserSchema);
export const EscrowLedgerResponseSchema = SuccessResponse(z.array(EscrowLedgerEntrySchema));
export const ListingDetailResponseSchema = SuccessResponse(ListingSchema);
