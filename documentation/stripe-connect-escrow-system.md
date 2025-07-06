# Stripe Connect Escrow Payment System - Product Requirements

## Overview

This document outlines the implementation of a Stripe Connect-based escrow payment system for the SweatShares platform, enabling secure payment processing between all user types (founders, investors, experts, freelancers, consultants) with funds held in escrow until transaction completion and approval. The system supports diverse use cases including work completion, business sales, partnership agreements, service delivery, and other business transactions.

## Business Context

SweatShares is a platform connecting founders, investors, experts, freelancers, and consultants. The current invoice system supports basic payment methods, but lacks secure escrow functionality that would build trust between parties and ensure fair payment for completed work, regardless of user type.

## Current State Analysis

### Existing Invoice System
- **Payment Methods**: Standard invoices, payment links, and escrow (UI only)
- **Database**: Invoices table with `payment_method` field supporting 'standard', 'payment_link', 'escrow'
- **Stripe Integration**: Basic payment intent creation exists
- **Invoice Creation**: Located at `/dashboard/my-invoices` with escrow option already in UI
- **Limitations**: No actual escrow functionality, no Connect accounts, no dispute resolution

### Current Payment Flow
1. User creates invoice with escrow payment method in `/dashboard/my-invoices`
2. Invoice is marked as escrow but no actual escrow process occurs
3. Payment processing is simulated rather than implemented

## Product Requirements

### 1. Core Escrow Workflow

#### 1.1 Escrow Payment Flow
```
Payer (Any User Type) → Platform (Escrow) → Payee (Any User Type)
     ↓                           ↓                           ↓
   Payment                  Hold Funds                  Complete Transaction
     ↓                           ↓                           ↓
   Funds Held              Escrow Period                Submit Completion
     ↓                           ↓                           ↓
   Transaction Review       Release Funds                Receive Payment
```

#### 1.2 Detailed Process Steps

**Phase 1: Invoice Creation & Escrow Setup**
1. Payee (any user type) creates invoice with escrow payment method in `/dashboard/my-invoices`
2. User selects transaction type and configures timeline settings
3. Invoice is created with escrow transaction record
4. Payer receives invoice notification bubbled message in  `/dashboard/my-messages` 
5. User can directly escrow pay  `/dashboard/my-invoices` under the recieved invoice tab
5. Payer initiates payment through Stripe Checkout
6. Payment is processed and held in platform's Stripe Connect account
7. Invoice status changes to "paid_in_escrow"
8. Payee receives notification of payment in escrow in `/dashboard/my-messages` 

**Phase 2: Transaction Completion & Review**
1. Payee completes the agreed transaction and submits proof of completion through invoice interface
2. Payee marks invoice as "Work Completed" with deliverables and completion notes
3. Invoice status changes to "completion_submitted" with auto-release countdown
4. Payer receives notification and can review completion through invoice view
5. Payer has configurable review period to approve, request revisions, or dispute
6. Auto-release occurs if no action within review period

**Phase 3: Payment Release & Resolution**
1. **Approval Path**: Payer approves completion → Funds released to payee → Invoice marked as "paid"
2. **Revision Path**: Payer requests revisions → Payee can resubmit with updates
3. **Dispute Path**: Payer disputes → Dispute resolution process initiated
4. **Auto-Release**: If no action within review period → Funds automatically released to payee

### 2. Technical Architecture

#### 2.1 Database Schema Extensions

**New Tables Required:**

```sql
-- Escrow transactions table
CREATE TABLE escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id),
  stripe_payment_intent_id text NOT NULL,
  stripe_connect_account_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  transaction_type text CHECK (transaction_type IN ('work', 'business_sale', 'partnership', 'service', 'consulting', 'investment', 'other')),
  status text CHECK (status IN ('pending', 'paid_in_escrow', 'completion_submitted', 'approved', 'disputed', 'released', 'refunded')),
  payer_id uuid REFERENCES profiles(id),
  payee_id uuid REFERENCES profiles(id),
  completion_deadline_days integer DEFAULT 30,
  review_period_days integer DEFAULT 7,
  completion_deadline_date timestamp with time zone,
  auto_release_date timestamp with time zone,
  completion_submitted_at timestamp with time zone,
  completion_approved_at timestamp with time zone,
  funds_released_at timestamp with time zone,
  dispute_reason text,
  transaction_description text,
  completion_proof jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Dispute resolution table
CREATE TABLE escrow_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid REFERENCES escrow_transactions(id),
  disputer_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  evidence text,
  status text CHECK (status IN ('open', 'under_review', 'resolved_for_client', 'resolved_for_freelancer')),
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Stripe Connect accounts table
CREATE TABLE stripe_connect_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  stripe_account_id text NOT NULL UNIQUE,
  account_status text CHECK (account_status IN ('pending', 'active', 'restricted', 'disabled')),
  onboarding_completed boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  charges_enabled boolean DEFAULT false,
  user_type text CHECK (user_type IN ('Founder', 'Investor', 'Expert', 'Freelancer', 'Consultant')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Invoice Table Updates:**
```sql
-- Add escrow-specific fields to invoices table
ALTER TABLE invoices ADD COLUMN escrow_transaction_id uuid REFERENCES escrow_transactions(id);
ALTER TABLE invoices ADD COLUMN completion_submitted boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN completion_approved boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN completion_deadline_days integer DEFAULT 30;
ALTER TABLE invoices ADD COLUMN review_period_days integer DEFAULT 7;
ALTER TABLE invoices ADD COLUMN auto_release_date timestamp with time zone;
ALTER TABLE invoices ADD COLUMN transaction_type text CHECK (transaction_type IN ('work', 'business_sale', 'partnership', 'service', 'consulting', 'investment', 'other'));
```

#### 2.2 Stripe Connect Integration

**Platform Account Setup:**
- Main Stripe account for platform fees and escrow holding
- Connect accounts for freelancers to receive payments
- Webhook handling for payment status updates

**Connect Account Onboarding:**
- Service providers (any user type) must complete Stripe Connect onboarding
- Collect business information, bank details, tax information
- Verify identity and business legitimacy
- Enable payouts to service provider's bank account

**Payment Flow:**
1. Payer pays to platform's main Stripe account
2. Platform holds funds in escrow
3. Upon approval, funds transferred to payee's Connect account
4. Platform fee deducted from total amount

### 3. Use Cases & Transaction Types

#### 3.1 Supported Transaction Types

**Work & Services:**
- Freelance project completion
- Consulting services delivery
- Expert advisory work
- Technical development projects
- Design and creative work

**Business Transactions:**
- Business sales and acquisitions
- Asset transfers
- Intellectual property sales
- Equipment and inventory sales
- Business partnership agreements

**Investment & Financial:**
- Investment agreements
- Due diligence services
- Financial advisory fees
- Investment facilitation fees
- Equity transfer escrow

**Partnership & Collaboration:**
- Joint venture agreements
- Partnership formation
- Revenue sharing agreements
- Collaborative project funding
- Strategic alliance payments

**Other Business Transactions:**
- Licensing agreements
- Franchise payments
- Commission payments
- Referral fees
- Performance-based bonuses

#### 3.2 Transaction-Specific Requirements

**Work & Services:**
- Deliverable submission (files, links, documentation)
- Milestone tracking and approval
- Quality assurance review process
- Revision and iteration handling

**Business Sales:**
- Asset verification and transfer
- Legal document exchange
- Due diligence completion
- Regulatory compliance verification

**Partnerships:**
- Agreement execution
- Resource sharing verification
- Performance milestone tracking
- Partnership dissolution handling

#### 3.3 Timeline Configuration by Transaction Type

**Default Timeline Settings:**

| Transaction Type | Completion Deadline | Review Period | Total Max Duration |
|------------------|-------------------|---------------|-------------------|
| **Work** | 30 days | 7 days | 37 days |
| **Service** | 30 days | 7 days | 37 days |
| **Consulting** | 45 days | 10 days | 55 days |
| **Partnership** | 60 days | 10 days | 70 days |
| **Business Sale** | 90 days | 14 days | 104 days |
| **Investment** | 120 days | 14 days | 134 days |
| **Other** | 30 days | 7 days | 37 days |

**Timeline Customization:**
- Payers and payees can negotiate custom timelines during transaction creation
- Platform admin can override timelines for special circumstances
- Minimum completion deadline: 7 days
- Maximum completion deadline: 180 days
- Minimum review period: 3 days
- Maximum review period: 30 days

**Timeline Calculation:**
- `completion_deadline_date` = payment_date + completion_deadline_days
- `auto_release_date` = completion_submitted_at + review_period_days
- Total maximum escrow duration = completion_deadline_days + review_period_days

### 4. User Experience Requirements

#### 4.1 Service Provider Experience (All User Types)

**Invoice Creation (Starting Point):**
- Enhanced invoice creation in `/dashboard/my-invoices` with escrow option
- Transaction type selection (work, business sale, partnership, etc.)
- Timeline configuration and customization options
- Clear explanation of escrow benefits and process
- Estimated timeline for payment release
- Platform fee transparency
- Escrow-specific invoice fields and validation

**Work Completion (UI-Friendly):**
- **Invoice Status Update**: Change invoice status to "Work Completed" in invoice view
- **Completion Form**: Simple form to upload deliverables and add completion notes
- **File Upload**: Drag-and-drop or click-to-upload for deliverables
- **Completion Notes**: Rich text editor for detailed completion description
- **Timeline Tracking**: Visual countdown showing auto-release date
- **Status Notifications**: Real-time updates on payer actions
- **Revision Handling**: Easy resubmission if revisions requested

**Payment Management:**
- View pending and completed escrow transactions
- Track earnings and platform fees
- Manage Stripe Connect account settings
- View payout history

#### 4.2 Client/Customer Experience (All User Types)

**Invoice Reception & Payment:**
- Receive escrow invoice notification
- Clear invoice presentation with escrow explanation
- Transaction type-specific information and requirements
- Secure Stripe Checkout integration
- Payment confirmation and escrow status
- Transaction review interface

**Work Review (UI-Friendly):**
- **Invoice View**: Review completion through familiar invoice interface
- **Deliverables Preview**: View uploaded files, links, and completion notes
- **Action Buttons**: Clear "Approve", "Request Revisions", or "Dispute" buttons
- **Review Form**: Optional feedback form for approval or revision requests
- **Timeline Display**: Visual countdown showing remaining review time
- **Communication**: In-app messaging for clarification requests
- **Auto-Release Warning**: Notifications about impending auto-release

**Dispute Resolution:**
- Submit dispute with evidence
- Transaction type-specific dispute categories
- Track dispute status
- Platform mediation process
- Final resolution and payment outcome

#### 4.3 Platform Admin Experience

**Escrow Management:**
- Monitor all escrow transactions
- Handle dispute resolution
- Manage platform fees and payouts
- Generate escrow reports

**Connect Account Management:**
- Monitor service provider onboarding status
- Handle account verification issues
- Manage payout schedules
- Compliance and reporting

### 5. Security & Compliance

#### 4.1 Security Requirements
- PCI DSS compliance through Stripe
- Encrypted data transmission
- Secure webhook handling
- Fraud detection and prevention
- KYC/AML compliance for Connect accounts

#### 4.2 Dispute Resolution
- Clear dispute submission process
- Evidence collection and review
- Platform mediation guidelines
- Escalation procedures
- Final arbitration process

#### 4.3 Regulatory Compliance
- EU payment services regulations
- Tax reporting requirements
- Anti-money laundering (AML) compliance
- Know Your Customer (KYC) requirements
- Data protection (GDPR) compliance

### 6. Technical Implementation

#### 6.1 Integration with Existing Invoice System

**Starting Point: `/dashboard/my-invoices`**
- Escrow functionality begins when user selects "Escrow Payment" in invoice creation
- Existing invoice form is enhanced with escrow-specific fields
- Escrow transaction is created alongside the invoice record
- Invoice and escrow transaction are linked via `escrow_transaction_id`

**Enhanced Invoice Creation Flow:**
1. User fills out standard invoice details (client, amount, items, etc.)
2. User selects "Escrow Payment" as payment method
3. Additional escrow fields appear:
   - Transaction type selection
   - Timeline configuration
   - Escrow terms and conditions
4. Invoice is created with escrow transaction record
5. Payer receives invoice with escrow payment option

**UI-Friendly Work Completion Flow:**
1. **Payee View**: Invoice shows "Mark Work as Complete" button when status is "paid_in_escrow"
2. **Completion Form**: Simple form with file upload and completion notes
3. **Status Update**: Invoice status changes to "work_completed" with auto-release countdown
4. **Payer Notification**: Payer receives notification and sees review options
5. **Review Interface**: Payer sees "Approve", "Request Revisions", or "Dispute" buttons
6. **Auto-Release**: Visual countdown shows remaining review time

**Invoice Status Integration:**
- Standard invoice statuses: 'pending', 'paid', 'cancelled'
- Escrow-specific statuses: 'paid_in_escrow', 'work_completed', 'approved', 'revision_requested', 'disputed', 'released'
- Invoice status reflects escrow transaction status
- Status changes trigger appropriate UI updates and notifications

#### 6.2 API Endpoints

**Escrow Management:**
```
POST /api/escrow/create-transaction
GET /api/escrow/transactions
PUT /api/escrow/submit-work-completion
PUT /api/escrow/approve-work
PUT /api/escrow/request-revision
POST /api/escrow/dispute
GET /api/escrow/disputes
```

**Stripe Connect:**
```
POST /api/stripe/connect/create-account
GET /api/stripe/connect/account-status
POST /api/stripe/connect/onboarding-link
GET /api/stripe/connect/payouts
```

**Webhooks:**
```
POST /api/webhooks/stripe/payment-intent
POST /api/webhooks/stripe/account-updated
POST /api/webhooks/stripe/transfer-created
```

#### 6.3 Frontend Components

**New Components Required:**
- `EscrowInvoiceForm` - Enhanced invoice creation with escrow options (extends existing form)
- `WorkCompletionForm` - Simple completion submission with file upload and notes
- `WorkReviewInterface` - Payer approval/revision/dispute interface
- `DisputeResolutionForm` - Dispute submission and tracking
- `ConnectAccountOnboarding` - Stripe Connect setup
- `TimelineConfiguration` - Timeline setup and customization
- `EscrowStatusBadge` - Visual status indicator with countdown
- `DeliverablesPreview` - File and content preview component

**Updated Components:**
- `MyInvoicesPage` - Enhanced with escrow transaction handling (main integration point)
- `InvoiceCard` - Display escrow status, timeline, and completion actions
- `PaymentButton` - Handle escrow payments
- Invoice creation dialog - Add escrow-specific fields and validation
- Invoice detail view - Add completion submission and review interfaces
- Invoice status dropdown - Add escrow-specific status options

#### 6.4 Background Jobs

**Scheduled Tasks:**
- Auto-release funds after review period expires
- Send reminder notifications for pending approvals
- Send deadline reminders for completion submission
- Process platform fee calculations
- Generate escrow reports

**Real-time Processing:**
- Webhook handling for payment status updates
- Email notifications for status changes
- Dispute escalation timers

### 7. Business Rules

#### 6.1 Platform Fees
- **Standard Fee**: 5% of transaction amount
- **Minimum Fee**: €2.50 per transaction
- **Maximum Fee**: €50.00 per transaction
- **Dispute Resolution Fee**: €25.00 (charged to losing party)

#### 7.2 Timeline Rules
- **Completion Submission Deadline**: Configurable (7-180 days from payment)
- **Payer Review Period**: Configurable (3-30 days from completion submission)
- **Auto-Release**: After review period expires if no action
- **Revision Handling**: Payee can resubmit within original completion deadline
- **Dispute Resolution**: 14 days maximum
- **Total Maximum Escrow Duration**: Up to 210 days (180 + 30)

**Default Timelines by Transaction Type:**
- **Work/Service**: 30 days completion + 7 days review
- **Consulting**: 45 days completion + 10 days review
- **Partnership**: 60 days completion + 10 days review
- **Business Sale**: 90 days completion + 14 days review
- **Investment**: 120 days completion + 14 days review

#### 6.3 Payment Rules
- **Minimum Transaction**: €10.00
- **Maximum Transaction**: €10,000.00
- **Supported Currencies**: EUR, USD, GBP
- **Payout Schedule**: Weekly (Tuesdays)

### 8. Success Metrics

#### 8.1 User Adoption
- Percentage of transactions using escrow vs. standard payment
- Service provider Connect account completion rate
- Payer payment completion rate

#### 7.2 Transaction Quality
- Dispute rate (target: <5%)
- Average time to payment release
- Platform fee revenue
- User satisfaction scores

#### 7.3 Platform Performance
- Transaction volume and growth
- Revenue from platform fees
- Customer support ticket volume
- System uptime and reliability

### 9. Implementation Phases

#### Phase 1: Foundation (Weeks 1-2)
- Database schema implementation
- Basic Stripe Connect integration
- Enhanced invoice creation in `/dashboard/my-invoices` with escrow options
- Escrow transaction creation from invoice flow
- Payment processing

#### Phase 2: Core Features (Weeks 3-4)
- Completion submission and approval flow
- Auto-release functionality
- Basic dispute system
- User notifications

#### Phase 3: Advanced Features (Weeks 5-6)
- Enhanced dispute resolution
- Connect account onboarding
- Admin dashboard
- Reporting and analytics

#### Phase 4: Polish & Launch (Weeks 7-8)
- UI/UX refinements
- Testing and bug fixes
- Documentation
- Production deployment

### 10. Risk Mitigation

#### 9.1 Technical Risks
- **Stripe API Changes**: Monitor Stripe updates and maintain compatibility
- **Webhook Failures**: Implement retry logic and manual intervention
- **Data Loss**: Regular backups and transaction logging
- **Performance Issues**: Load testing and optimization

#### 9.2 Business Risks
- **Regulatory Changes**: Stay updated on payment regulations
- **Fraud**: Implement fraud detection and verification
- **Disputes**: Clear policies and efficient resolution process
- **User Adoption**: Comprehensive onboarding and support

### 11. Future Enhancements

#### 11.1 Advanced Features
- Multi-party escrow for team projects
- Milestone-based payments
- Integration with project management tools
- Advanced dispute resolution with third-party arbitration
- Transaction type-specific escrow workflows (e.g., investor-founder agreements, business sales)

#### 11.2 Platform Expansion
- Support for additional payment methods
- International expansion with local payment options
- Mobile app integration
- API for third-party integrations
- Specialized escrow products for different transaction types

## Conclusion

The implementation of Stripe Connect escrow payments will significantly enhance the SweatShares platform by providing secure, trusted payment processing that benefits all user types (founders, investors, experts, freelancers, consultants). This system will build confidence in the platform and encourage more transactions while generating additional revenue through platform fees.

The phased implementation approach ensures a smooth rollout with minimal disruption to existing users while building a robust foundation for future growth and feature expansion. 