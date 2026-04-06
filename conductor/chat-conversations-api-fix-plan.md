# Chat Conversations API Format Fix Plan

## Objective
Fix the issue where chat conversations do not appear in the Messages screen. The backend `/api/chat/conversations` endpoint returns raw Prisma models which the frontend cannot parse correctly, since it expects a specific mapped format (like `other_user` and `unread_count`).

## Key Files & Context
- `backend/src/modules/chat/chat.routes.ts`
- `backend/src/modules/chat/chat.service.ts`

The frontend `Conversation` interface expects:
```typescript
{
  id: string,
  user_id: string,
  other_user: { id, name, avatar_url },
  last_message: { text, created_at },
  unread_count: number,
  created_at: string
}
```
But `getUserConversations` returns `participant_one`, `participant_two`, and `messages` arrays. 

## Implementation Steps
1. **Update `backend/src/modules/chat/chat.service.ts`**:
   - Update `getUserConversations` to include `_count: { select: { messages: { where: { read: false, sender_id: { not: userId } } } } }` so we get the exact unread count.
   - Map the returned `conversations` array directly in `getUserConversations` to format it exactly as the frontend expects (`other_user`, `last_message`, `unread_count`, etc).
2. **Update `getOrCreateConversation` in `backend/src/modules/chat/chat.service.ts`**:
   - Map the returned new/existing conversation object in the same format before returning it to `chatRouter.post("/conversations")`.

## Verification & Testing
1. Restart the backend server.
2. Open the mobile app and navigate to the Messages tab.
3. The existing conversations should now be visible and properly formatted with the other user's name and unread counts.