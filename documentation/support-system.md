# Support System

## Overview

A simple support system that allows users to submit support requests via email. The system stores requests in the database and sends email notifications to the support team.

## Features

- **Simple Contact Form**: Clean, user-friendly form for submitting support requests
- **Database Storage**: All support requests are stored in the database for tracking
- **Email Notifications**: Automatic email notifications to support team
- **Category Classification**: Support requests are categorized for better organization
- **User Authentication**: Only authenticated users can submit support requests

## Components

### 1. Support Page (`app/dashboard/support/page.tsx`)
- Simple contact form with fields for name, email, category, subject, and message
- Pre-fills user information from their profile
- Form validation and error handling
- Success/error notifications

### 2. API Endpoint (`app/api/support/send-email/route.ts`)
- Handles POST requests for support submissions
- Validates user authentication
- Stores request in database
- Sends email notification

### 3. Database Table (`support_requests`)
- Stores all support request data
- Includes user tracking and status management
- Row Level Security (RLS) enabled

### 4. Email Service (`lib/email.ts`)
- Modular email service with multiple provider options
- HTML and text email templates
- Easy integration with popular email services

## Database Schema

```sql
CREATE TABLE support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Support Categories

- **General Inquiry**: General questions about the platform
- **Technical Issue**: Technical problems and bugs
- **Billing & Payment**: Payment and billing issues
- **Account Issues**: Account management problems
- **Feature Request**: Requests for new features
- **Bug Report**: Bug reports and issues
- **Security Concern**: Security and privacy concerns
- **Other**: Miscellaneous issues

## Email Integration

The system is designed to work with multiple email providers. Currently, it logs emails to the console, but can be easily integrated with:

### SendGrid
```javascript
// Install: npm install @sendgrid/mail
// Set environment variable: SENDGRID_API_KEY
await sendGridEmail(emailData);
```

### Mailgun
```javascript
// Install: npm install mailgun.js form-data
// Set environment variables: MAILGUN_API_KEY, MAILGUN_DOMAIN
await mailgunEmail(emailData);
```

### AWS SES
```javascript
// Install: npm install aws-sdk
// Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
await sesEmail(emailData);
```

### Resend
```javascript
// Install: npm install resend
// Set environment variable: RESEND_API_KEY
await resendEmail(emailData);
```

## Environment Variables

```bash
# Support email configuration
SUPPORT_EMAIL=support@sweatshares.com
FROM_EMAIL=noreply@sweatshares.com

# Email service API keys (choose one)
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
RESEND_API_KEY=your_resend_api_key
```

## Setup Instructions

### 1. Run Database Migration
```bash
supabase db push
```

### 2. Configure Email Service
Choose your preferred email provider and uncomment the relevant code in `lib/email.ts`

### 3. Set Environment Variables
Add the required environment variables to your `.env.local` file

### 4. Test the System
1. Navigate to `/dashboard/support`
2. Fill out the support form
3. Submit the request
4. Check the console logs for email details
5. Verify the request is stored in the database

## Email Template

The system generates professional HTML emails with:
- Clear subject line with `[Support]` prefix
- User information (name, email)
- Category and subject
- Formatted message content
- User ID and request ID for tracking
- Professional styling

## Security Features

- **Authentication Required**: Only logged-in users can submit requests
- **Row Level Security**: Users can only see their own support requests
- **Input Validation**: All form fields are validated
- **Rate Limiting**: Can be easily added to prevent spam

## Future Enhancements

1. **Support Ticket Management**: Admin interface to manage and respond to requests
2. **Email Templates**: Customizable email templates
3. **File Attachments**: Allow users to attach files to support requests
4. **Auto-Response**: Automatic confirmation emails to users
5. **Status Updates**: Email notifications when request status changes
6. **Knowledge Base**: FAQ integration
7. **Live Chat**: Real-time chat support
8. **Analytics**: Support request analytics and reporting

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check email service configuration and API keys
2. **Database errors**: Verify migration has been applied
3. **Authentication errors**: Ensure user is logged in
4. **Form validation errors**: Check all required fields are filled

### Debug Queries
```sql
-- Check recent support requests
SELECT * FROM support_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- Check requests by status
SELECT status, COUNT(*) 
FROM support_requests 
GROUP BY status;

-- Check requests by category
SELECT category, COUNT(*) 
FROM support_requests 
GROUP BY category;
``` 