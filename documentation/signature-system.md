# Signature System Documentation

## Overview

The signature system in SweatShares provides a comprehensive digital signature workflow that allows users to create, send, and manage signature requests for PDF documents. The system features an intuitive interface for placing signature fields, real-time messaging integration, and secure document processing.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Experience Flow](#user-experience-flow)
3. [Technical Implementation](#technical-implementation)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Security & Performance](#security--performance)
8. [Troubleshooting](#troubleshooting)
9. [Recent Improvements](#recent-improvements)

## System Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│                 │    │                 │    │                 │
│ • Signature     │◄──►│ • API Routes    │◄──►│ • Supabase      │
│   Request Page  │    │ • PDF Processing│    │   Storage       │
│ • Signature     │    │ • Message       │    │ • Database      │
│   Viewer        │    │   System        │    │ • RLS Policies  │
│ • Chat System   │    │ • Auth          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **PDF Processing**: PDF.js (viewing), pdf-lib (editing)
- **Storage**: Supabase Storage with RLS policies
- **Database**: PostgreSQL with Supabase
- **Real-time**: Supabase Realtime for messaging
- **UI Components**: shadcn/ui component library

## User Experience Flow

### 1. Creating a Signature Request

The signature request creation process has been streamlined for better user experience:

#### Step 1: Document Selection
- Users navigate from their vault to the signature request page
- Document is automatically loaded from the vault based on `documentId` parameter
- PDF is rendered using PDF.js for immediate preview

#### Step 2: Recipient & Message Configuration
- **Recipients Section**: 
  - Search functionality to find connections
  - Radio button selection for single recipient
  - Avatar display with fallback initials
  - Clear visual feedback for selected recipient

- **Message Section**:
  - Optional personal message (300 character limit)
  - Real-time character count with validation
  - Expiration selection (1 day to 1 month)
  - Clean, organized layout

#### Step 3: Signature Field Placement
- **Interactive PDF Viewer**:
  - Click anywhere on PDF to add signature fields
  - One signature field per page limit
  - Drag-and-drop positioning
  - Corner resize handles for precise sizing
  - Visual feedback during interactions

- **Field Management**:
  - Real-time preview of signature layout
  - Delete functionality for unwanted fields
  - Field selection and editing capabilities
  - Minimum size constraints (50×50px)

#### Step 4: Request Submission
- **Validation**:
  - Recipient selection required
  - At least one signature field required
  - Message length validation
  - Real-time error feedback

- **Submission Process**:
  - Loading states with spinner
  - Success/error toast notifications
  - Automatic redirect to vault upon completion

### 2. Signing a Document

#### Step 1: Request Access
- Users receive signature requests via the messaging system
- Direct link navigation to signature page
- Document preview with signature field indicators

#### Step 2: Signature Creation
- **Canvas-based Drawing**:
  - Freehand signature drawing
  - Clear/reset functionality
  - Signature preview before submission

#### Step 3: Document Processing
- Server-side PDF manipulation using pdf-lib
- Signature embedding with proper scaling
- Metadata addition (name, date, timestamp)
- Signed document storage in user vault

## Technical Implementation

### PDF Processing Architecture

#### 1. Document Viewing (Client-side)
```typescript
// PDF.js integration for client-side rendering
const loadPDF = async () => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
  const pdf = await loadingTask.promise;
  setTotalPages(pdf.numPages);
  
  await renderPage(pdf, 1);
};
```

#### 2. Coordinate System Management
```typescript
// Coordinate conversion between viewer and PDF
const convertToBaseScale = (x: number, y: number, width: number, height: number) => {
  const currentScale = baseScale * zoomLevel;
  
  return {
    x: x / currentScale,
    y: y / currentScale,
    width: width / currentScale,
    height: height / currentScale
  };
};
```

#### 3. Signature Box Interaction
```typescript
// Drag and resize functionality
const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
  if (isDragging) {
    // Handle dragging logic
    const newX = Math.max(0, x - dragOffset.x);
    const newY = Math.max(0, y - dragOffset.y);
  }
  
  if (isResizing) {
    // Handle resizing logic with minimum size constraints
    const minSize = 50;
    // Calculate new dimensions based on resize handle
  }
};
```

### State Management

#### Core State Variables
```typescript
// Document and user state
const [document, setDocument] = useState<any>(null);
const [user, setUser] = useState<any>(null);
const [connections, setConnections] = useState<Connection[]>([]);

// Signature field management
const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

// PDF viewer state
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [zoomLevel, setZoomLevel] = useState(1.0);

// Interaction state
const [isDragging, setIsDragging] = useState(false);
const [isResizing, setIsResizing] = useState(false);
const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
```

### Event Handling System

#### Keyboard Shortcuts
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedBoxId) {
      removeSignatureBox(selectedBoxId);
    }
  }
  if (event.key === 'Escape') {
    setSelectedBoxId(null);
    setSignatureBoxes(prev => prev.map(box => ({ ...box, isSelected: false })));
  }
};
```

#### Mouse Interactions
- **Click**: Add new signature fields or select existing ones
- **Drag**: Reposition signature boxes
- **Corner Drag**: Resize signature boxes
- **Wheel + Ctrl**: Zoom in/out
- **Right-click**: Context menu (future enhancement)

## Database Schema

### Core Tables

#### `signature_requests`
```sql
CREATE TABLE signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES vault_documents(id),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'signed', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `signature_positions`
```sql
CREATE TABLE signature_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  x_position DECIMAL NOT NULL,
  y_position DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  field_type TEXT CHECK (field_type IN ('signature', 'date', 'text', 'checkbox')),
  field_label TEXT,
  required BOOLEAN DEFAULT true,
  scale DECIMAL, -- Store the scale used for coordinate conversion
  original_pdf_width DECIMAL, -- Store original PDF dimensions
  original_pdf_height DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships and Constraints

- **One-to-Many**: `signature_requests` → `signature_positions`
- **Foreign Keys**: Document, sender, and receiver references
- **Cascade Delete**: Signature positions deleted when request is deleted
- **Status Validation**: Enumerated status values
- **Field Type Validation**: Restricted field types

## API Endpoints

### 1. Create Signature Request

**Endpoint**: `POST /api/signatures/create`

**Request Body**:
```typescript
{
  document_id: string;
  receiver_id: string;
  message?: string;
  expires_at?: string;
  positions: {
    page_number: number;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    field_type: 'signature';
    field_label?: string;
    required: boolean;
    scale: number;
    original_pdf_width: number;
    original_pdf_height: number;
  }[];
}
```

**Response**:
```typescript
{
  success: boolean;
  signatureRequest: SignatureRequest;
  message?: Message; // Created message bubble
}
```

### 2. Sign Document

**Endpoint**: `POST /api/signatures/sign`

**Request Body**:
```typescript
{
  requestId: string;
  signatureData: string; // Base64 encoded signature image
}
```

**Response**:
```typescript
{
  success: boolean;
  signatureRequest: SignatureRequest;
  signedDocument: {
    filepath: string;
    filename: string;
  };
  message?: Message; // Completion notification
}
```

### 3. Get Signature Request

**Endpoint**: `GET /api/signatures/[id]`

**Response**:
```typescript
{
  signatureRequest: SignatureRequest;
  positions: SignaturePosition[];
  document: VaultDocument;
}
```

## Frontend Components

### 1. Signature Request Page (`/dashboard/signature/request`)

#### Layout Structure
```typescript
// Main layout with responsive grid
<div className="container mx-auto p-6 space-y-6">
  {/* Header Section */}
  <div className="flex flex-col space-y-4">
    {/* Document info and back button */}
  </div>
  
  {/* Recipients and Message Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    {/* Recipients card */}
    {/* Message card */}
  </div>
  
  {/* PDF Viewer and Sidebar */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* PDF Viewer (2/3 width) */}
    {/* Sidebar (1/3 width) */}
  </div>
</div>
```

#### Key Features
- **Responsive Design**: Adapts to different screen sizes
- **Real-time Validation**: Immediate feedback on form inputs
- **Interactive PDF**: Click-to-add, drag-to-move, resize handles
- **Visual Feedback**: Status indicators during interactions
- **Keyboard Support**: Delete, Escape, and zoom shortcuts

### 2. PDF Viewer Component

#### Canvas Management
```typescript
// PDF rendering with zoom support
const renderPage = async (pdf: any, pageNum: number) => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: calculatedBaseScale * zoomLevel });
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({ canvasContext: context, viewport }).promise;
};
```

#### Signature Box Overlay
```typescript
// Interactive signature boxes
{signatureBoxes
  .filter(box => box.pageNumber === currentPage)
  .map(box => (
    <div
      key={box.id}
      className={`absolute border-2 rounded ${
        box.isSelected || selectedBoxId === box.id
          ? 'border-blue-500 bg-blue-100 bg-opacity-30'
          : 'border-gray-400 bg-gray-100 bg-opacity-20'
      }`}
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        pointerEvents: 'auto',
        cursor: 'move'
      }}
    >
      {/* Signature box content */}
    </div>
  ))}
```

### 3. Sidebar Components

#### Field Management
- **Add Signature Field**: Instructions and guidelines
- **Signature Fields Summary**: List of added fields with actions
- **Send Button**: Primary action with validation states

#### User Experience Features
- **Clear Instructions**: Step-by-step guidance
- **Visual Feedback**: Status indicators and progress
- **Error Handling**: Validation messages and recovery options

## Security & Performance

### Security Measures

#### 1. Authentication & Authorization
```sql
-- RLS Policies for signature_requests
CREATE POLICY "Users can view their signature requests" ON signature_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can create signature requests" ON signature_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their signature requests" ON signature_requests
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
```

#### 2. File Security
- **Storage Policies**: User-specific file access
- **File Validation**: PDF type and size restrictions
- **Secure URLs**: Temporary, signed URLs for file access

#### 3. Input Validation
```typescript
// Client-side validation
const validateRequest = () => {
  if (!selectedReceiver) return "Select a recipient";
  if (signatureBoxes.length === 0) return "Add at least one signature field";
  if (message.length > 300) return "Message is too long";
  return null;
};
```

### Performance Optimizations

#### 1. PDF Processing
- **Lazy Loading**: PDF.js loaded only when needed
- **Caching**: PDF documents cached in browser
- **Progressive Rendering**: Pages rendered on demand

#### 2. State Management
- **Efficient Updates**: Minimal re-renders with proper state structure
- **Debounced Inputs**: Search and zoom controls optimized
- **Memory Management**: Proper cleanup of event listeners

#### 3. Network Optimization
- **Compressed Images**: Signature data optimized before storage
- **Batch Operations**: Multiple signature positions in single request
- **Error Recovery**: Graceful handling of network failures

## Recent Improvements

### 1. User Interface Enhancements

#### Responsive Design
- **Mobile-First Approach**: Optimized for all screen sizes
- **Flexible Layout**: Grid system adapts to content
- **Touch-Friendly**: Larger touch targets for mobile devices

#### Visual Improvements
- **Modern Design**: Clean, professional appearance
- **Consistent Styling**: Unified design language
- **Accessibility**: Proper contrast and focus indicators

### 2. Interaction Improvements

#### Enhanced PDF Viewer
- **Better Zoom Controls**: Intuitive zoom buttons and keyboard shortcuts
- **Improved Navigation**: Clear page indicators and controls
- **Visual Feedback**: Status indicators during interactions

#### Signature Field Management
- **Intuitive Placement**: Click-to-add with visual guides
- **Flexible Resizing**: Corner handles with minimum size constraints
- **Easy Selection**: Clear visual feedback for selected fields

### 3. User Experience Enhancements

#### Streamlined Workflow
- **Logical Flow**: Recipients → Message → Fields → Send
- **Clear Instructions**: Step-by-step guidance throughout
- **Error Prevention**: Validation and helpful error messages

#### Real-time Feedback
- **Live Validation**: Immediate feedback on form inputs
- **Progress Indicators**: Loading states and completion feedback
- **Success Confirmation**: Clear success messages and next steps

## Troubleshooting

### Common Issues

#### 1. PDF Loading Problems
**Symptoms**: PDF fails to load or displays incorrectly

**Solutions**:
- Check file permissions in Supabase Storage
- Verify PDF.js worker is properly loaded
- Clear browser cache and reload
- Check file format (PDF only)

#### 2. Signature Box Positioning
**Symptoms**: Signature appears in wrong location on final document

**Solutions**:
- Verify coordinate system scaling (viewer vs PDF)
- Check that zoom level is properly accounted for
- Ensure Y-coordinate flipping is correct
- Test with different PDF sizes

#### 3. Performance Issues
**Symptoms**: Slow loading or unresponsive interface

**Solutions**:
- Check PDF file size (optimize if too large)
- Verify network connection
- Clear browser cache
- Check for memory leaks in long sessions

### Debug Tools

#### Browser Console
```javascript
// Check PDF.js loading
console.log('PDF.js loaded:', typeof pdfjsLib !== 'undefined');

// Check signature box coordinates
console.log('Signature boxes:', signatureBoxes);

// Check canvas dimensions
console.log('Canvas size:', canvas.width, 'x', canvas.height);

// Check zoom level
console.log('Zoom level:', zoomLevel);
```

#### Network Monitoring
- Monitor API requests to `/api/signatures/*`
- Check file upload/download requests
- Verify message creation requests
- Monitor WebSocket connections for real-time features

## Future Enhancements

### 1. Advanced Features
- **Multiple Field Types**: Date, text, checkbox fields
- **Signature Templates**: Predefined signature layouts
- **Bulk Operations**: Multiple recipients or documents
- **Signature Verification**: Digital certificate integration

### 2. User Experience
- **Drag-and-Drop Upload**: Direct file upload to signature page
- **Signature Preview**: Preview signature before submission
- **Mobile Optimization**: Touch-optimized signature drawing
- **Offline Support**: Basic functionality without internet

### 3. Integration
- **Email Notifications**: Direct email alerts
- **Third-party Services**: Integration with DocuSign, HelloSign
- **API Access**: Public API for external integrations
- **Webhook Support**: Real-time notifications to external systems

### 4. Analytics & Reporting
- **Usage Analytics**: Track signature request patterns
- **Completion Rates**: Monitor signature completion statistics
- **Audit Trails**: Detailed logs of all signature activities
- **Performance Metrics**: System performance monitoring

---

*This documentation reflects the current implementation of the signature system in SweatShares. The system provides a comprehensive, user-friendly solution for digital signature workflows with robust security and performance optimizations.*

*For technical support or questions, please refer to the troubleshooting section or contact hello@celco.agency.* 