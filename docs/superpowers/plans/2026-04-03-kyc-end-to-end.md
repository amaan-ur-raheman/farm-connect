# KYC End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the end-to-end flow for users to upload KYC documents on mobile and for admins to review and approve/reject them on the dashboard.

**Architecture:** 
- Mobile uses Expo ImagePicker to select documents and uploads them via `FormData` to the backend.
- Backend (Express) uses `multer` to parse the upload and `cloudinary` to store the files, saving the URLs in the user's `kyc_documents` JSON field and updating `kyc_status` to `SUBMITTED`.
- Admin Dashboard (Next.js) fetches users with `SUBMITTED` status, displays the documents, and allows the admin to patch the `kyc_status` to `VERIFIED` or `REJECTED`.

**Tech Stack:** React Native, Expo, Node.js, Express, Prisma, Cloudinary, Next.js, TailwindCSS.

---

### Task 1: Backend KYC Upload Endpoint

**Files:**
- Modify: `backend/src/modules/kyc/kyc.routes.ts`
- Modify: `backend/src/modules/kyc/kyc.controller.ts`
- Modify: `backend/src/modules/kyc/kyc.service.ts`
- Create: `backend/tests/unit/kyc.test.ts`

- [ ] **Step 1: Write the failing test for KYC Service**

```typescript
// backend/tests/unit/kyc.test.ts
import { describe, it, expect, vi } from 'vitest';
import { uploadKycDocuments } from '../../src/modules/kyc/kyc.service';
import { prisma } from '../../src/config/database';

vi.mock('../../src/config/database', () => ({
  prisma: { user: { update: vi.fn() } }
}));

describe('KYC Service', () => {
  it('should update user kyc_documents and status', async () => {
    const mockUser = { id: '1', kyc_status: 'SUBMITTED', kyc_documents: { aadhaar: 'url' } };
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
    
    const result = await uploadKycDocuments('1', { aadhaar: 'url' });
    expect(result.kyc_status).toBe('SUBMITTED');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { kyc_status: 'SUBMITTED', kyc_documents: { aadhaar: 'url' } }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm run test tests/unit/kyc.test.ts`
Expected: FAIL (uploadKycDocuments is not defined or file not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
// backend/src/modules/kyc/kyc.service.ts
import { prisma } from '@/config/database';

export const uploadKycDocuments = async (userId: string, documents: Record<string, string>) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      kyc_status: 'SUBMITTED',
      kyc_documents: documents
    }
  });
};
```

- [ ] **Step 4: Add controller and route**

```typescript
// backend/src/modules/kyc/kyc.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/middleware/handlers';
import { uploadKycDocuments } from './kyc.service';
import { BadRequestError } from '@/shared/errors';

export const uploadDocumentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files || !files.aadhaar) {
    throw new BadRequestError('Aadhaar document is required');
  }
  
  // Assuming files are already uploaded to Cloudinary via middleware and path is set
  const documents: Record<string, string> = {};
  if (files.aadhaar) documents.aadhaar = files.aadhaar[0].path;
  if (files.land_record) documents.land_record = files.land_record[0].path;

  const result = await uploadKycDocuments(req.user!.userId, documents);
  res.json({ success: true, data: result });
});
```

```typescript
// backend/src/modules/kyc/kyc.routes.ts
import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { uploadDocumentsHandler } from './kyc.controller';
// Assume upload middleware exists from Cloudinary config
import { upload } from '@/config/cloudinary'; 

export const kycRouter = Router();

kycRouter.post(
  '/upload',
  authenticate,
  upload.fields([{ name: 'aadhaar', maxCount: 1 }, { name: 'land_record', maxCount: 1 }]),
  uploadDocumentsHandler
);
```

- [ ] **Step 5: Run tests to verify pass**

Run: `cd backend && npm run test tests/unit/kyc.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/kyc/ backend/tests/unit/kyc.test.ts
git commit -m "feat(backend): add KYC document upload endpoint"
```

### Task 2: Mobile KYC Upload UI

**Files:**
- Create: `mobile/app/profile/kyc.tsx`

- [ ] **Step 1: Create the KYC UI component**

```tsx
// mobile/app/profile/kyc.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import api from '../../src/config/api';

export default function KycUploadScreen() {
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAadhaar(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!aadhaar) {
      Alert.alert('Error', 'Please upload your Aadhaar card');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaar', {
        uri: aadhaar,
        type: 'image/jpeg',
        name: 'aadhaar.jpg',
      } as any);

      await api.post('/api/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert('Success', 'KYC Documents submitted successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#151d15]">
      <Header variant="back" title="KYC Verification" onBack={() => router.back()} />
      <View className="p-6">
        <Text className="text-lg font-bold mb-4 dark:text-white">Upload Aadhaar Card</Text>
        <TouchableOpacity 
          onPress={pickImage}
          className="border-2 border-dashed border-gray-300 p-8 rounded-xl items-center mb-8"
        >
          <Text className="text-gray-500">{aadhaar ? 'Image selected. Tap to change' : 'Tap to select image'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleUpload}
          disabled={loading}
          className="bg-[#4cae4f] py-4 rounded-xl items-center"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Submit KYC</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/profile/kyc.tsx
git commit -m "feat(mobile): add KYC document upload screen"
```

### Task 3: Admin KYC Review Interface

**Files:**
- Modify: `admin-dashboard/src/app/admin/kyc/page.tsx`

- [ ] **Step 1: Implement the UI to view and approve/reject**

```tsx
// admin-dashboard/src/app/admin/kyc/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function KycPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["kyc-pending"],
    queryFn: async () => {
      const res: any = await api.get("api/admin/users?kyc_status=SUBMITTED").json();
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return api.patch(`api/admin/users/${id}/kyc`, { json: { status } }).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-pending"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Pending KYC Approvals</h1>
      <div className="grid gap-6">
        {users?.map((user: any) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.name} ({user.role})</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Phone: {user.phone}</p>
              {user.kyc_documents?.aadhaar && (
                <div className="mt-4">
                  <p className="font-bold mb-2">Aadhaar Document:</p>
                  <img src={user.kyc_documents.aadhaar} alt="Aadhaar" className="max-w-md rounded border" />
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => mutation.mutate({ id: user.id, status: 'VERIFIED' })}
                >
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => mutation.mutate({ id: user.id, status: 'REJECTED' })}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!users || users.length === 0) && <p>No pending KYC requests.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add admin-dashboard/src/app/admin/kyc/page.tsx
git commit -m "feat(admin): implement KYC review and approval flow"
```