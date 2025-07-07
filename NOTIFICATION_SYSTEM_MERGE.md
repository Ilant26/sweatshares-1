# SweatShares Notification System Integration

## Overview

The notification system has been successfully merged to work with both the existing My Network implementation and the comprehensive notification infrastructure. Here's how everything works together:

## Database Schema

### Notifications Table Structure
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'connection_request', 'connection_accepted', 'invoice_request', 'escrow_payment', 'vault_share', 'signature_request', 'alert_match')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key references for different notification types
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES signatures(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE
);
```

### Key Features
- **Structured Schema**: Uses `title` and `description` instead of just `content`
- **JSONB Data Field**: Flexible storage for additional metadata (sender info, avatars, etc.)
- **Foreign Key References**: Direct links to related entities
- **Type Safety**: Enum constraint for notification types

## Migration from Old Format

If you have existing notifications with the old format (`content`, `sender_id` columns), use the migration:

```sql
-- Run: supabase/migrations/20241201000001_migrate_existing_notifications.sql
```

This migration:
1. Adds missing columns if they don't exist
2. Converts `content` → `description`
3. Moves `sender_id` → `data.sender_id` (JSONB)
4. Sets appropriate `title` based on notification type
5. Ensures schema consistency

## Automatic Notification Generation

### Database Triggers
The system automatically creates notifications for:

1. **Connection Requests** - When someone sends a connection request
2. **Connection Accepted** - When someone accepts your connection request
3. **New Messages** - When you receive a message
4. **Invoice Events** - Invoice requests and escrow payments
5. **Signature Requests** - Document signing requests
6. **Vault Shares** - When documents are shared with you
7. **Alert Matches** - When your alerts find new matches

### Example Trigger Usage
```sql
-- Automatically triggered when a connection status changes
UPDATE connections SET status = 'accepted' WHERE id = 'connection-id';
-- → Creates notification for sender about acceptance
```

## API Endpoints

### GET /api/notifications
Fetch notifications with pagination and filtering:
```typescript
// Get all notifications
const response = await fetch('/api/notifications?limit=20&offset=0');

// Get only unread notifications
const response = await fetch('/api/notifications?unread_only=true');
```

### PUT /api/notifications
Mark notifications as read:
```typescript
// Mark specific notifications as read
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({ notification_ids: ['id1', 'id2'] })
});

// Mark all connection notifications as read
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({ type: 'connection_request' })
});

// Mark all notifications as read
await fetch('/api/notifications', {
  method: 'PUT',
  body: JSON.stringify({ mark_all_read: true })
});
```

## Frontend Integration

### NotificationsProvider
Global state management for real-time notifications:
```tsx
// Automatically included in dashboard layout
<NotificationsProvider>
  {children}
</NotificationsProvider>
```

### NotificationsDropdown
Header component showing notifications with badge:
```tsx
// Already integrated in dashboard header
<NotificationsDropdown />
```

### My Network Integration
The My Network page now:
- Automatically marks connection notifications as read when visited
- Refreshes notification count after accepting/rejecting connections
- Shows real-time connection request notifications

## Real-time Features

### Automatic Updates
- **Real-time subscriptions** listen for new notifications
- **Polling every 30 seconds** ensures count accuracy
- **Instant badge updates** when notifications arrive

### Smart Navigation
Notifications redirect appropriately:
- Connection requests → `/dashboard/my-network`
- Messages → `/dashboard/messages`
- Invoices → `/dashboard/my-invoices`
- Signatures → `/dashboard/signature/[id]`
- Alert matches → `/dashboard/my-alerts/[id]/matches`

## Database Functions

### Create Notification
```sql
SELECT create_notification(
  p_user_id => 'user-uuid',
  p_type => 'connection_request',
  p_title => 'New connection request',
  p_description => 'John Doe wants to connect with you',
  p_data => '{"sender_id": "sender-uuid", "sender_name": "John Doe"}',
  p_connection_id => 'connection-uuid'
);
```

### Mark as Read
```sql
SELECT mark_notifications_read(
  p_user_id => 'user-uuid',
  p_type => 'connection_request'  -- Optional: mark specific type
);
```

### Get Unread Count
```sql
SELECT get_unread_notification_count('user-uuid');
```

## Testing the Integration

1. **Connection Flow Test**:
   - Send a connection request → notification created
   - Accept the request → notification created for sender
   - Visit My Network → connection notifications marked as read

2. **Real-time Test**:
   - Open two browser sessions
   - Send connection request from one → see notification badge in other
   - Accept request → see badge update

3. **Notification Types**:
   - Create different notification types via database functions
   - Verify they appear in dropdown with correct icons and navigation

## Migration Steps

If you're upgrading from the old notification format:

1. **Backup existing data**
2. **Run migration**: `20241201000001_migrate_existing_notifications.sql`
3. **Update database types**: Already done in `lib/database.types.ts`
4. **Test notification creation and reading**
5. **Verify My Network integration works**

## Data Format Examples

### Old Format (to be migrated)
```sql
INSERT INTO notifications (user_id, type, content, sender_id, read)
VALUES ('user-id', 'connection_request', 'sent you a connection request', 'sender-id', false);
```

### New Format (current)
```sql
INSERT INTO notifications (user_id, type, title, description, data, read, connection_id)
VALUES (
  'user-id', 
  'connection_request', 
  'New connection request',
  'John Doe wants to connect with you',
  '{"sender_id": "sender-id", "sender_name": "John Doe", "sender_avatar": "avatar-url"}',
  false,
  'connection-id'
);
```

The system is now fully integrated and ready for production use with comprehensive notification coverage across all SweatShares features. 