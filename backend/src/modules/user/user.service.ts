import { prisma } from '@/config/database';
import { NotFoundError } from '@/shared/errors';
import type { UpdateProfileInput } from './user.schema';
import { KycStatus } from '@prisma/client';

export type KycDocumentType = 'aadhaar_front' | 'aadhaar_back' | 'pan_card' | 'bank_statement';

const VALID_DOCUMENT_TYPES: KycDocumentType[] = [
  'aadhaar_front',
  'aadhaar_back',
  'pan_card',
  'bank_statement',
];

export interface KycDocument {
  url: string;
  uploaded_at: string;
}

export type KycDocumentsMap = Partial<Record<KycDocumentType, KycDocument>>;

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      kyc_status: true,
      kyc_documents: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      farm_size_acres: true,
      farm_type: true,
      crops_grown: true,
      irrigation_type: true,
      years_of_experience: true,
      land_records_url: true,
      soil_type: true,
      created_at: true,
    },
  });

  if (!user) throw new NotFoundError('User');

  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      kyc_status: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      farm_size_acres: true,
      farm_type: true,
      crops_grown: true,
      irrigation_type: true,
      years_of_experience: true,
      land_records_url: true,
      soil_type: true,
    },
  });

  if (!user) throw new NotFoundError('User');

  return user;
};

export const getUserStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new NotFoundError('User');

  const isFarmer = user.role === 'FARMER';

  const contracts = await prisma.contract.findMany({
    where: {
      ...(isFarmer ? { farmer_id: userId } : { consumer_id: userId }),
      status: 'COMPLETED',
    },
    select: { total_amount: true },
  });

  const totalRevenue = contracts.reduce((sum, c) => sum + c.total_amount, 0);
  const totalProperties = contracts.length;

  const listings = await prisma.farmListing.findMany({
    where: isFarmer ? { farmer_id: userId } : {},
    select: { id: true, area_acres: true, status: true },
  });

  const totalAcres = listings.reduce((sum, l) => sum + l.area_acres, 0);

  return { totalRevenue, totalProperties, totalAcres };
};

export const uploadKycDocument = async (
  userId: string,
  documentType: KycDocumentType,
  fileUrl: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const existingDocs: KycDocumentsMap = (user.kyc_documents as KycDocumentsMap) || {};
  const updatedDocs: KycDocumentsMap = {
    ...existingDocs,
    [documentType]: { url: fileUrl, uploaded_at: new Date().toISOString() },
  };

  const allRequired: KycDocumentType[] = ['aadhaar_front', 'aadhaar_back', 'pan_card'];
  const hasAllRequired = allRequired.every((type) => !!updatedDocs[type]);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kyc_documents: updatedDocs as any,
      kyc_status: hasAllRequired ? KycStatus.SUBMITTED : user.kyc_status,
    },
    select: {
      id: true,
      kyc_status: true,
      kyc_documents: true,
    },
  });

  return updated;
};
