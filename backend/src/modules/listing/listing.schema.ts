import { z } from 'zod';

export const createListingSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  area_acres: z.number().positive().max(10000),
  price_per_acre: z.number().positive(),
  crops: z.array(z.string()).min(1),
  location_name: z.string().min(3).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
  is_organic: z.boolean().default(false),
  organic_cert_url: z.string().url().optional(),
  expected_harvest_month: z.string().optional(),
  expected_yield_per_acre: z.number().positive().optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFiltersSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(500).optional(), // km
  crops: z.string().optional(), // comma-separated
  is_organic: z.coerce.boolean().optional(),
  min_acres: z.coerce.number().positive().optional(),
  max_acres: z.coerce.number().positive().optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD', 'INACTIVE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingFiltersInput = z.infer<typeof listingFiltersSchema>;
