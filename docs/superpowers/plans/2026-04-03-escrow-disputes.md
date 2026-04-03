# Escrow Automation & Dispute Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate the release of escrow funds following farm updates and provide an administrative interface for resolving disputes.

**Architecture:** 
- **Backend**: Integrate `BullMQ` to manage delayed jobs. When a farmer submits an update, a job is scheduled for 48 hours. If no dispute is filed, the job releases the funds to the farmer.
- **Backend**: Enhance the dispute module to "freeze" escrow (cancel/suspend the auto-release job).
- **Admin**: Build a dispute management interface for admins to review evidence and finalize fund distribution.

**Tech Stack:** BullMQ, Redis (ioredis), Node.js, Next.js.

---

### Task 1: Setup BullMQ & Escrow Workers

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/config/queue.ts`
- Create: `backend/src/modules/escrow/escrow.worker.ts`
- Create: `backend/src/modules/escrow/escrow.service.ts`

- [ ] **Step 1: Install dependencies**

Run: `cd backend && npm install bullmq ioredis`

- [ ] **Step 2: Initialize Queue and Worker in `queue.ts`**

```typescript
// backend/src/config/queue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from './env';

const connection = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
};

export const escrowQueue = new Queue('escrow-release', { connection });
```

- [ ] **Step 3: Implement `releaseEscrow` logic in `escrow.service.ts`**

```typescript
// backend/src/modules/escrow/escrow.service.ts
import { prisma } from '@/config/database';
import { createNotification } from '@/modules/notification/notification.service';

export const scheduleEscrowRelease = async (contractId: string, updateId: string, amount: number) => {
  await escrowQueue.add('release', { contractId, updateId, amount }, {
    delay: 48 * 60 * 60 * 1000, // 48 hours
    jobId: `release-${updateId}`,
  });
};

export const processEscrowRelease = async (contractId: string, amount: number) => {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract || contract.status === 'DISPUTED') return;

  // Logic to release funds (e.g., move from escrow to farmer wallet)
  // Simplified for this task:
  await prisma.contract.update({
    where: { id: contractId },
    data: { escrow_held: { decrement: amount } }
  });
  
  await prisma.wallet.update({
    where: { userId: contract.farmer_id },
    data: { balance: { increment: amount } }
  });
};
```

- [ ] **Step 4: Commit worker setup**

```bash
git add backend/package.json backend/src/config/queue.ts backend/src/modules/escrow/
git commit -m "feat(backend): setup BullMQ for escrow automation"
```

### Task 2: Integrate Automation with Farm Updates

**Files:**
- Modify: `backend/src/modules/update/update.service.ts`
- Modify: `backend/src/modules/dispute/dispute.service.ts`

- [ ] **Step 1: Schedule release on farm update**

In `backend/src/modules/update/update.service.ts`, after creating a `farmUpdate`, call `scheduleEscrowRelease`.

- [ ] **Step 2: Cancel release on dispute**

In `backend/src/modules/dispute/dispute.service.ts`, when a dispute is filed, remove the corresponding job from the queue:
```typescript
await escrowQueue.remove(`release-${updateId}`);
```

- [ ] **Step 3: Commit integration**

```bash
git add backend/src/modules/update/update.service.ts backend/src/modules/dispute/dispute.service.ts
git commit -m "feat(backend): link farm updates to automated escrow release"
```

### Task 3: Admin Dispute Resolution Interface

**Files:**
- Modify: `admin-dashboard/src/app/admin/disputes/page.tsx`

- [ ] **Step 1: Implement Dispute Review UI**

Build an interface to list `DISPUTED` contracts, showing the farmer's updates and the investor's claims.

- [ ] **Step 2: Finalize Resolution Actions**

Add buttons to "Release to Farmer" or "Refund to Investor". These call the backend to finalize the escrow distribution.

- [ ] **Step 3: Commit Admin UI**

```bash
git add admin-dashboard/src/app/admin/disputes/page.tsx
git commit -m "feat(admin): implement dispute resolution interface"
```
