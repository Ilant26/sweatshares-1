# Escrow Notification System

## Overview

The escrow notification system provides real-time notifications for all steps of the escrow workflow, ensuring both payers and payees stay informed about transaction progress, deadlines, and required actions.

## Notification Types

### Escrow Payment Notifications (`escrow_payment`)

All escrow-related notifications use the `escrow_payment` type with different status indicators in the data field.

#### 1. New Escrow Payment Created
- **Trigger**: New escrow transaction created
- **Recipient**: Payee
- **Icon**: 💰
- **Message**: "John Doe created an escrow payment for EUR 500"
- **Action**: Navigate to escrow work page

#### 2. Payment Funded in Escrow
- **Trigger**: Payment status changes to 'funded'
- **Recipient**: Payee
- **Icon**: 💰
- **Message**: "Payment of EUR 500 is now held in escrow. You can start working!"
- **Action**: Navigate to escrow work page

#### 3. Work Completed & Submitted
- **Trigger**: Work completion submitted
- **Recipient**: Payer
- **Icon**: 📋
- **Message**: "Jane Smith has submitted work for review. Please review within 7 days."
- **Action**: Navigate to escrow work page

#### 4. Work Approved & Payment Released
- **Trigger**: Work approved by payer
- **Recipient**: Payee
- **Icon**: ✅
- **Message**: "Your work has been approved! Payment of EUR 500 has been released to your account."
- **Action**: Navigate to escrow work page

#### 5. Revision Requested
- **Trigger**: Payer requests changes
- **Recipient**: Payee
- **Icon**: 🔄
- **Message**: "John Doe has requested changes to your work. Please review the feedback and resubmit."
- **Action**: Navigate to escrow work page

#### 6. Dispute Opened
- **Trigger**: Dispute initiated
- **Recipient**: Both payer and payee
- **Icon**: ⚠️
- **Message**: "A dispute has been opened for this transaction. Our team will review the case."
- **Action**: Navigate to escrow work page

#### 7. Payment Auto-Released
- **Trigger**: Auto-release after review period
- **Recipient**: Payee
- **Icon**: 🎉
- **Message**: "Payment of EUR 500 has been automatically released after the review period."
- **Action**: Navigate to escrow work page

#### 8. Payment Refunded
- **Trigger**: Payment refunded
- **Recipient**: Payer
- **Icon**: ↩️
- **Message**: "Payment of EUR 500 has been refunded to your account."
- **Action**: Navigate to escrow work page

### Deadline Notifications

#### 9. Work Deadline Approaching
- **Trigger**: 3 days before work completion deadline
- **Recipient**: Payee
- **Icon**: ⏰
- **Message**: "Your work deadline is approaching in 2 days. Please submit your work soon."
- **Action**: Navigate to escrow work page

#### 10. Auto-Release Approaching
- **Trigger**: 1 day before auto-release
- **Recipient**: Payer
- **Icon**: ⏰
- **Message**: "Work will be automatically approved and payment released in 1 day(s). Review now to avoid auto-release."
- **Action**: Navigate to escrow work page

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
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE
);
```

### Escrow Notification Data Structure
```json
{
  "payer_id": "uuid",
  "payer_name": "John Doe",
  "payer_avatar_url": "https://...",
  "payee_id": "uuid", 
  "payee_name": "Jane Smith",
  "payee_avatar_url": "https://...",
  "amount": 500,
  "currency": "EUR",
  "escrow_status": "funded",
  "invoice_number": "INV-001",
  "transaction_id": "uuid",
  "deadline_date": "2024-01-15T00:00:00Z",
  "review_deadline": "2024-01-22T00:00:00Z",
  "revision_reason": "Please add more details",
  "dispute_reason": "Work not as specified",
  "released_at": "2024-01-20T00:00:00Z",
  "notification_type": "deadline_warning"
}
```

## Implementation

### Database Functions

#### 1. `create_escrow_notification()`
Creates escrow-specific notifications with proper data structure.

#### 2. `notify_escrow_status_changes()`
Trigger function that automatically creates notifications when escrow transaction status changes.

#### 3. `notify_approaching_deadlines()`
Function to check for approaching deadlines and send warning notifications.

### Triggers

#### Escrow Transaction Trigger
```sql
CREATE TRIGGER trigger_notify_escrow_status_changes
  AFTER INSERT OR UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_escrow_status_changes();
```

### API Endpoints

#### 1. Get Notifications
```
GET /api/notifications?limit=20&offset=0
```

#### 2. Mark Notifications as Read
```
PUT /api/notifications
Body: { "notification_ids": ["uuid1", "uuid2"] }
```

#### 3. Mark All as Read
```
PUT /api/notifications
Body: { "mark_all_read": true }
```

#### 4. Check Deadlines (Manual)
```
POST /api/notifications/check-deadlines
```

## Frontend Integration

### Notifications Dropdown
- Displays all notifications with proper icons
- Escrow notifications navigate to `/dashboard/escrow-work/[invoice_id]`
- Different icons based on escrow status
- Real-time unread count updates

### Notification Provider
- Polls for unread count every 30 seconds
- Provides context for notification state
- Handles real-time updates

## Setup Instructions

### 1. Run Migration
```bash
# Apply the escrow notifications migration
supabase db push
```

### 2. Test Notifications
```bash
# Create a test escrow transaction
# Check notifications are created automatically

# Manually trigger deadline checks
curl -X POST /api/notifications/check-deadlines
```

### 3. Set Up Scheduled Jobs (Optional)
If using pg_cron extension:
```sql
SELECT cron.schedule('check-escrow-deadlines', '0 9 * * *', 'SELECT notify_approaching_deadlines();');
```

## Testing

### Manual Testing Steps
1. Create an escrow transaction
2. Verify notification is sent to payee
3. Fund the payment
4. Verify funding notification
5. Submit work completion
6. Verify work submission notification
7. Approve work
8. Verify approval notification
9. Test revision request
10. Test dispute creation

### Deadline Testing
1. Create escrow transaction with short deadline
2. Wait for deadline warning (or manually trigger)
3. Submit work with short review period
4. Wait for auto-release warning (or manually trigger)

## Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing
- Check if trigger is properly installed
- Verify user permissions
- Check notification table structure

#### 2. Wrong Navigation
- Verify invoice_id is properly set
- Check notification type handling

#### 3. Duplicate Notifications
- Check trigger conditions
- Verify status change detection

### Debug Queries
```sql
-- Check recent notifications
SELECT * FROM notifications 
WHERE type = 'escrow_payment' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check trigger status
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_escrow_status_changes';

-- Check function exists
SELECT * FROM information_schema.routines 
WHERE routine_name = 'notify_escrow_status_changes';
```

## Future Enhancements

### Planned Features
1. Email notifications
2. Push notifications
3. SMS notifications
4. Custom notification preferences
5. Notification templates
6. Bulk notification actions
7. Notification analytics

### Integration Points
1. Email service (SendGrid, Mailgun)
2. Push notification service (Firebase, OneSignal)
3. SMS service (Twilio)
4. Webhook integrations
5. Slack/Discord notifications 