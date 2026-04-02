import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createListing, getListings, getListingById } from '../src/modules/listing/listing.service';
import { prisma } from '../src/config/database';

// Mock Prisma
vi.mock('../src/config/database', () => ({
  prisma: {
    farmListing: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Listing Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Listing', () => {
    it('should create a new listing successfully', async () => {
      const mockData = {
        farmer_id: 'farmer-123',
        name: 'Test Farm',
        area_acres: 10.5,
        price_per_acre: 50000,
        crops: ['Wheat', 'Corn'],
        location_name: 'Nashik',
        latitude: 19.9975,
        longitude: 73.7898,
      };

      vi.mocked(prisma.farmListing.create).mockResolvedValue({
        id: 'listing-456',
        ...mockData,
        status: 'DRAFT',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await createListing(mockData);

      expect(result).toHaveProperty('id', 'listing-456');
      expect(prisma.farmListing.create).toHaveBeenCalledWith({
        data: mockData,
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        farmer_id: 'farmer-123',
        name: '', // Empty name
        area_acres: -5, // Invalid area
      };

      await expect(createListing(invalidData as any)).rejects.toThrow();
    });
  });

  describe('Get Listings', () => {
    it('should return paginated listings', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          name: 'Farm 1',
          area_acres: 10,
          price_per_acre: 50000,
          status: 'ACTIVE',
          created_at: new Date(),
        },
        {
          id: 'listing-2',
          name: 'Farm 2',
          area_acres: 15,
          price_per_acre: 60000,
          status: 'ACTIVE',
          created_at: new Date(),
        },
      ];

      vi.mocked(prisma.farmListing.findMany).mockResolvedValue(mockListings);
      vi.mocked(prisma.farmListing.count).mockResolvedValue(2);

      const result = await getListings({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        pages: 1,
      });
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.farmListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.farmListing.count).mockResolvedValue(0);

      await getListings({ page: 1, limit: 10, status: 'ACTIVE' });

      expect(prisma.farmListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
          },
        })
      );
    });

    it('should search by name or location', async () => {
      vi.mocked(prisma.farmListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.farmListing.count).mockResolvedValue(0);

      await getListings({ page: 1, limit: 10, search: 'Nashik' });

      expect(prisma.farmListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { name: expect.anything() },
              { location_name: expect.anything() },
            ]),
          },
        })
      );
    });
  });

  describe('Get Listing By ID', () => {
    it('should return a listing by ID', async () => {
      const mockListing = {
        id: 'listing-123',
        name: 'Test Farm',
        area_acres: 10,
        price_per_acre: 50000,
        status: 'ACTIVE',
        farmer_id: 'farmer-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(prisma.farmListing.findUnique).mockResolvedValue(mockListing);

      const result = await getListingById('listing-123');

      expect(result).toEqual(mockListing);
      expect(prisma.farmListing.findUnique).toHaveBeenCalledWith({
        where: { id: 'listing-123' },
      });
    });

    it('should return null for non-existent listing', async () => {
      vi.mocked(prisma.farmListing.findUnique).mockResolvedValue(null);

      const result = await getListingById('non-existent');

      expect(result).toBeNull();
    });
  });
});
