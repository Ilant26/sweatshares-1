# Alert System Documentation

## Overview

The Alert System is a sophisticated notification and matching service that allows users to create custom alerts to automatically discover relevant profiles and listings on the platform. When new content matches their criteria, users receive notifications via email and in-app alerts.

## Purpose

The alert system serves several key purposes:

1. **Content Discovery**: Helps users automatically find relevant profiles and listings without manual searching
2. **Real-time Notifications**: Provides instant, daily, or weekly notifications when new matches are found  
3. **Personalized Matching**: Uses custom criteria to match content to user preferences
4. **Engagement**: Keeps users actively engaged with the platform through relevant updates

## System Architecture

### Database Structure

The alert system consists of three main tables:

#### 1. `alerts` Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- name: Text (User-defined alert name)
- alert_type: Text ('profile' | 'listing')
- criteria: JSONB (Matching criteria)
- frequency: Text ('instant' | 'daily' | 'weekly')
- is_active: Boolean (Default: true)
- last_checked_at: Timestamp
- created_at: Timestamp
- updated_at: Timestamp
```

#### 2. `alert_matches` Table
```sql
- id: UUID (Primary Key)
- alert_id: UUID (Foreign Key to alerts)
- matched_entity_id: UUID (Profile or Listing ID)
- matched_entity_type: Text ('profile' | 'listing')
- match_score: Integer (Default: 100)
- notified: Boolean (Default: false)
- created_at: Timestamp
```

#### 3. `alert_notifications` Table
```sql
- id: UUID (Primary Key)
- alert_id: UUID (Foreign Key to alerts)
- user_id: UUID (Foreign Key to auth.users)
- notification_type: Text ('new_matches' | 'no_matches' | 'alert_created')
- matches_count: Integer (Default: 0)
- email_sent: Boolean (Default: false)
- email_sent_at: Timestamp
- created_at: Timestamp
```

## How Alerts Work

### 1. Alert Creation

Users can create alerts through the dashboard with the following process:

1. **Choose Alert Type**: Profile or Listing alerts
2. **Set Criteria**: Define matching parameters
3. **Configure Frequency**: Instant, daily, or weekly notifications
4. **Name the Alert**: Give it a descriptive name

#### Criteria Structure (JSONB)

**For Profile Alerts:**
```json
{
  "professional_roles": ["Frontend Developer", "Product Manager"],
  "skills": ["React", "TypeScript", "Product Management"],
  "countries": ["United States", "Canada"]
}
```

**For Listing Alerts:**
```json
{
  "listing_types": ["find-funding", "expert-freelance"],
  "profile_types": ["founder", "expert"],
  "skills": ["JavaScript", "Python"],
  "countries": ["Germany", "France"],
  "sectors": ["Technology", "Healthcare"]
}
```

### 2. Automatic Matching

The system uses PostgreSQL functions to automatically match new content against existing alerts:

#### Profile Matching (`match_profile_against_alerts`)
When a profile is created or updated, the system:
1. Retrieves all active profile alerts
2. Checks each alert's criteria against the profile data
3. Creates match records for qualifying profiles

**Matching Logic:**
- **Professional Role**: Exact match against criteria array
- **Skills**: Array overlap check (profile skills ∩ criteria skills)
- **Location**: Exact country match against criteria array

#### Listing Matching (`match_listing_against_alerts`)
When a listing is created or updated, the system:
1. Retrieves all active listing alerts  
2. Checks each alert's criteria against the listing data
3. Creates match records for qualifying listings

**Matching Logic:**
- **Listing Type**: Exact match (e.g., "find-funding", "expert-freelance")
- **Profile Type**: Exact match (e.g., "founder", "investor", "expert")
- **Skills**: Array overlap check
- **Location**: Exact country match
- **Sector**: Exact match against industry sectors

### 3. Notification System

#### Notification Types
1. **alert_created**: Sent when a new alert is created
2. **new_matches**: Sent when new matches are found
3. **no_matches**: Sent for periodic updates when no matches found

#### Notification Frequencies
- **Instant**: Immediate email notification when matches are found
- **Daily**: Batched daily digest of all matches  
- **Weekly**: Weekly summary of matches for the period

#### Email Workflow
1. Background service checks for pending notifications
2. Groups notifications by user and frequency
3. Sends personalized emails with match summaries
4. Marks notifications as sent in database

## API Endpoints

### Alerts Management

#### `GET /api/alerts`
Fetch user's alerts with optional status filtering
```typescript
// Query parameters
?status=active|inactive|all

// Response
{
  "alerts": [
    {
      "id": "uuid",
      "name": "Frontend Developers in Europe",
      "alert_type": "profile",
      "criteria": {...},
      "frequency": "instant",
      "is_active": true,
      "alert_matches": [...],
      "alert_notifications": [...]
    }
  ]
}
```

#### `POST /api/alerts`
Create a new alert
```typescript
// Request body
{
  "name": "Alert Name",
  "alert_type": "profile|listing",
  "criteria": {...},
  "frequency": "instant|daily|weekly"
}

// Response
{
  "alert": {...}
}
```

#### `PUT /api/alerts/[id]`
Update existing alert
```typescript
// Request body
{
  "name": "Updated Name",
  "criteria": {...},
  "frequency": "daily",
  "is_active": false
}
```

#### `DELETE /api/alerts/[id]`
Delete an alert (cascades to matches and notifications)

### Alert Matches

#### `GET /api/alerts/[id]/matches`
Fetch matches for a specific alert
```typescript
// Query parameters
?page=1&limit=10&notified=true|false

// Response
{
  "matches": [
    {
      "id": "uuid",
      "matched_entity_id": "uuid",
      "matched_entity_type": "profile",
      "match_score": 100,
      "notified": false,
      "created_at": "timestamp",
      "entity_data": {...} // Profile or listing data
    }
  ],
  "pagination": {...}
}
```

### Notifications

#### `POST /api/alerts/send-notifications`
Trigger notification sending (typically called by cron job)
```typescript
// Response
{
  "message": "Notifications sent",
  "results": [
    {
      "userId": "uuid",
      "alertId": "uuid", 
      "status": "sent|failed"
    }
  ]
}
```

## User Interface

### My Alerts Dashboard (`/dashboard/my-alerts`)

The alerts dashboard provides:

1. **Alert Management**:
   - View all alerts in a table format
   - Toggle alerts active/inactive
   - Edit alert criteria and settings
   - Delete alerts

2. **Alert Creation**:
   - Modal form for creating new alerts
   - Dynamic criteria selection based on alert type
   - Skills selector with categorized options
   - Country and role selection

3. **Match Viewing**:
   - View matches for each alert
   - Navigate to matched profiles/listings
   - Mark matches as viewed/notified

4. **Filtering & Search**:
   - Filter by alert status (active/inactive)
   - Search alerts by name
   - Sort by creation date, match count

### Alert Matches Page (`/dashboard/my-alerts/[id]/matches`)

Dedicated page for viewing matches for a specific alert:
- Paginated list of matches
- Links to matched profiles/listings  
- Match metadata (score, date, notification status)
- Filtering options

## Technical Implementation

### Database Functions

#### Matching Functions
- `match_profile_against_alerts(profile_id)`: Matches a profile against all active profile alerts
- `match_listing_against_alerts(listing_id)`: Matches a listing against all active listing alerts

#### Triggers
- `profile_alert_matching_trigger`: Automatically triggers matching when profiles are created/updated
- `listing_alert_matching_trigger`: Automatically triggers matching when listings are created/updated

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only access their own alerts
- Users can only view matches for their alerts
- Users can only see their own notifications

### Performance Optimizations

#### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_matches_alert_id ON alert_matches(alert_id);
CREATE INDEX idx_alert_matches_entity ON alert_matches(matched_entity_id, matched_entity_type);
```

#### Efficient Matching
- Uses PostgreSQL array operators for skills matching (`&&` for overlap)
- JSONB indexing for fast criteria queries
- Conditional triggers only fire when relevant fields change

### Email Integration

#### Email Templates
- Personalized email templates for different notification types
- HTML and text versions for compatibility
- Dynamic content based on match data

#### Batch Processing
- Groups notifications by user and frequency
- Prevents spam by respecting frequency settings
- Tracks email delivery status

## Matching Algorithm Details

### Profile Matching Algorithm
```sql
-- Pseudo-code for profile matching
FOR each active profile alert:
  match = true
  
  IF alert has professional_roles criteria:
    IF profile.professional_role NOT IN criteria.professional_roles:
      match = false
  
  IF match AND alert has skills criteria:
    IF profile.skills does NOT overlap with criteria.skills:
      match = false
      
  IF match AND alert has countries criteria:
    IF profile.country NOT IN criteria.countries:
      match = false
  
  IF match:
    CREATE alert_match record
```

### Listing Matching Algorithm
```sql
-- Pseudo-code for listing matching  
FOR each active listing alert:
  match = true
  
  IF alert has listing_types criteria:
    IF listing.listing_type NOT IN criteria.listing_types:
      match = false
      
  IF match AND alert has profile_types criteria:
    IF listing.profile_type NOT IN criteria.profile_types:
      match = false
  
  IF match AND alert has skills criteria:
    IF listing.skills does NOT overlap with criteria.skills:
      match = false
      
  IF match AND alert has countries criteria:
    IF listing.location_country NOT IN criteria.countries:
      match = false
      
  IF match AND alert has sectors criteria:
    IF listing.sector NOT IN criteria.sectors:
      match = false
  
  IF match:
    CREATE alert_match record
```

## Security Considerations

### Data Protection
- All alert data is protected by RLS policies
- User data isolation prevents cross-user data access
- Secure API endpoints with authentication requirements

### Privacy
- Users control their own alert criteria
- No sharing of alert data between users
- Opt-out mechanisms for all notifications

## Monitoring & Analytics

### Key Metrics
- Alert creation rate
- Match success rate  
- Email delivery rate
- User engagement with matches

### Performance Monitoring
- Query performance for matching functions
- Database index usage
- Email delivery statistics

## Future Enhancements

### Planned Features
1. **Advanced Filtering**: More granular criteria options
2. **Smart Recommendations**: AI-powered alert suggestions
3. **Mobile Notifications**: Push notifications for mobile apps
4. **Social Features**: Share interesting matches with network
5. **Analytics Dashboard**: Match statistics and trends

### Technical Improvements
1. **Caching Layer**: Redis caching for frequently accessed alerts
2. **Queue System**: Background job processing for large-scale matching
3. **Machine Learning**: Improve matching algorithms with ML
4. **API Rate Limiting**: Prevent abuse of alert creation endpoints

## Troubleshooting

### Common Issues

#### Alerts Not Matching
- Check criteria formatting in JSONB
- Verify skills array overlap logic
- Ensure RLS policies are not blocking access

#### Email Notifications Not Sending
- Check email service configuration
- Verify user email addresses in profiles
- Review notification frequency settings

#### Performance Issues
- Monitor database index usage
- Check for long-running matching queries
- Review alert criteria complexity

### Debug Tools
- SQL functions for manual matching tests
- Alert notification status tracking
- Database query performance monitoring

---

## Conclusion

The Alert System provides a powerful, automated way for users to discover relevant content on the platform. Through sophisticated matching algorithms, flexible notification options, and a user-friendly interface, it keeps users engaged and helps them find exactly what they're looking for without manual effort.

The system is designed for scalability, security, and performance, making it suitable for platforms of any size while maintaining data privacy and user control. 