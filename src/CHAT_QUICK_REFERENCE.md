# 💬 CHAT SYSTEM - QUICK REFERENCE

## 🚀 Quick Start

### 1. Deploy Migration
```sql
-- Run in Supabase SQL Editor
-- File: /supabase/migrations/065_chat_system_complete.sql
```

### 2. Deploy Edge Function
```
Dashboard → Edge Functions → Create Function
Name: BrowoKoordinator-Chat
Code: /supabase/functions/BrowoKoordinator-Chat/index.ts
```

### 3. Access Frontend
```
URL: /chat
Component: /screens/ChatScreen.tsx
Service: /services/BrowoKo_chatService.ts
```

---

## 📡 API ENDPOINTS

### Base URL
```
https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat
```

### Authentication
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 🔥 Most Used Routes

### Create DM
```javascript
POST /conversations
{
  "type": "DM",
  "member_ids": ["user_id"]
}
```

### Send Message
```javascript
POST /conversations/:id/messages
{
  "content": "Hello!",
  "type": "TEXT"
}
```

### Get Messages
```javascript
GET /conversations/:id/messages?limit=50
```

### Create Knowledge Page
```javascript
POST /knowledge
{
  "title": "Guide",
  "content": "...",
  "category": "HR"
}
```

### Submit Feedback
```javascript
POST /feedback
{
  "title": "Bug Report",
  "description": "...",
  "priority": "HIGH"
}
```

---

## 💻 Service Usage

```typescript
import { chatService } from '@/services/BrowoKo_chatService';

// Get conversations
const conversations = await chatService.getConversations();

// Send message
const message = await chatService.sendMessage(conversationId, {
  content: 'Hello!',
  type: 'TEXT'
});

// Add reaction
await chatService.addReaction(messageId, '👍');

// Update presence
await chatService.updatePresence('ONLINE');
```

---

## 🎨 UI Components

### Tab System
```tsx
- DM (MessageCircle icon)
- Gruppen (Users icon)
- Knowledge (BookOpen icon)  
- Feedback (MessageSquare icon)
```

### Floating Action Button
```tsx
Fixed bottom-right corner
Purple background (#8B5CF6)
Plus icon for new chat
```

### Chat Interface
```tsx
- User List (Sidebar)
- Chat Area (Main)
- Message Input (Bottom)
- Online Status Indicators
- Unread Badges
```

---

## 📦 Database Tables

```
BrowoKo_conversations          - DM/Group chats
BrowoKo_conversation_members   - Who's in chat
BrowoKo_messages               - Chat messages
BrowoKo_message_attachments    - Files
BrowoKo_message_reactions      - Emojis
BrowoKo_message_reads          - Read receipts
BrowoKo_typing_indicators      - Typing status
BrowoKo_user_presence          - Online status
BrowoKo_knowledge_pages        - Wiki
BrowoKo_feedback               - Feedback/Requests
BrowoKo_feedback_comments      - Comments
```

---

## 🧪 Health Check

```javascript
fetch('https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Chat/health', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
})
.then(r => r.json())
.then(d => console.log('✅', d));

// Expected: { status: 'ok', function: 'BrowoKoordinator-Chat' }
```

---

## 🎥 Video Chat Setup

### Daily.co (Recommended)
```bash
npm install @daily-co/daily-js
```

```typescript
import Daily from '@daily-co/daily-js';

const callFrame = Daily.createFrame();
await callFrame.join({ url: 'https://your-domain.daily.co/room' });
```

### Jitsi (Open Source)
```bash
npm install @jitsi/react-sdk
```

```tsx
<JitsiMeeting roomName={`chat-${conversationId}`} />
```

---

## 🔔 Real-time Updates

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(URL, KEY);

// Listen to new messages
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'BrowoKo_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message!', payload.new);
  })
  .subscribe();
```

---

## 🐛 Common Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Get fresh token from `supabase.auth.getSession()` |
| 403 Forbidden | Check RLS policies & user permissions |
| 404 Not Found | Verify conversation/message ID |
| 500 Server Error | Check Edge Function logs in dashboard |

---

## 📊 Features Checklist

- [x] Direct Messages (DM)
- [x] Group Chats
- [x] Send/Edit/Delete Messages
- [x] Message Reactions
- [x] Read Receipts
- [x] Typing Indicators
- [x] Online Status
- [x] File Attachments
- [x] Message Search
- [x] Knowledge Wiki
- [x] Feedback System
- [ ] Video Chat (Integration ready)
- [ ] Push Notifications (Next)
- [ ] Rich Text Editor (Next)

---

## 🎯 Quick Commands

### Create Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);
```

### Test Chat Flow
```javascript
// 1. Create conversation
const conv = await chatService.createConversation({
  type: 'DM',
  member_ids: ['user_123']
});

// 2. Send message
const msg = await chatService.sendMessage(conv.id, {
  content: 'Hi! 👋'
});

// 3. Add reaction
await chatService.addReaction(msg.id, '❤️');

// 4. Mark as read
await chatService.markMessageAsRead(msg.id);
```

---

**Version:** 1.0.0  
**Status:** ✅ Ready  
**Total Routes:** 36+

🎉 **Happy Chatting!**
