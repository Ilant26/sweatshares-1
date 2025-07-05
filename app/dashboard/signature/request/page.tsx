'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { createSignatureRequest } from '@/lib/signatures';
import {
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileText, 
  Users, 
  Calendar,
  Send,
  Eye,
  MousePointer,
  Type,
  CheckSquare,
  Search
} from 'lucide-react';

interface SignatureBox {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fieldType: 'signature';
  fieldLabel: string;
  required: boolean;
  isSelected?: boolean;
}

interface Connection {
  id: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  professional_role: string | null;
}

export default function SignatureRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient<Database>();
  
  const [user, setUser] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [message, setMessage] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [fieldLabel, setFieldLabel] = useState('Signature');
  const [isRequired, setIsRequired] = useState(true);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hoveredHandle, setHoveredHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [baseScale, setBaseScale] = useState(1.5);
  const [originalPdfDimensions, setOriginalPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(false);

  const documentId = searchParams.get('documentId');

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
  }, []);

  // Fetch user and document data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && documentId) {
        // Fetch document
        const { data: doc } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('id', documentId)
          .eq('owner_id', user.id)
          .single();

        if (doc) {
          setDocument(doc);
          // Get PDF URL
          const { data: { publicUrl } } = supabase.storage
            .from('vault')
            .getPublicUrl(doc.filepath);
          setPdfUrl(publicUrl);
        }

        // Fetch connections
        const { data: acceptedConnections } = await supabase
        .from('connections')
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url),
          receiver:receiver_id(id, full_name, avatar_url)
        `)
        .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (acceptedConnections) {
          const connectionsList = acceptedConnections.map((connection) => {
            const otherUser = connection.sender_id === user.id ? connection.receiver : connection.sender;
            return {
              id: otherUser?.id || '',
              full_name: otherUser?.full_name || null,
              username: otherUser?.full_name || '',
              avatar_url: otherUser?.avatar_url || null,
              professional_role: null
            };
          }).filter(conn => conn.id);
          
          setConnections(connectionsList);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [documentId, supabase]);

  // Load PDF and render to canvas
  useEffect(() => {
    if (!pdfUrl || !mountedRef.current || typeof window === 'undefined') return;

    const loadPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);

        // Render first page
        await renderPage(pdf, 1);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast.error('Failed to load PDF');
      }
    };

    // Add a small delay to ensure everything is ready
    const timer = setTimeout(() => {
      loadPDF();
    }, 100);

    return () => clearTimeout(timer);
  }, [pdfUrl]);

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current || !mountedRef.current || !pdfContainerRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const container = pdfContainerRef.current;

      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      // Get container dimensions
      const containerWidth = container.clientWidth - 32; // Account for padding
      const containerHeight = 600; // Max height from CSS

      // Get original page dimensions
      const originalViewport = page.getViewport({ scale: 1.0 });
      const originalWidth = originalViewport.width;
      const originalHeight = originalViewport.height;

      // Store original PDF dimensions for coordinate conversion
      setOriginalPdfDimensions({ width: originalWidth, height: originalHeight });

      // Calculate scale to fit within container while maintaining aspect ratio
      const scaleX = containerWidth / originalWidth;
      const scaleY = containerHeight / originalHeight;
      const calculatedBaseScale = Math.min(scaleX, scaleY, 2.0); // Cap at 2.0x for readability
      const scale = calculatedBaseScale * zoomLevel; // Apply zoom level

      // Store the base scale for coordinate conversion
      setBaseScale(calculatedBaseScale);

      // Create viewport with calculated scale
      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  };

  // Helper function to convert coordinates from viewer space to original PDF coordinates
  const convertToBaseScale = (x: number, y: number, width: number, height: number) => {
    // Convert from current scale (with zoom) to original PDF coordinates
    const currentScale = baseScale * zoomLevel;
    
    // Convert viewer coordinates to original PDF coordinates
    const convertedX = x / currentScale;
    const convertedY = y / currentScale;
    const convertedWidth = width / currentScale;
    const convertedHeight = height / currentScale;
    
    console.log('Coordinate conversion:', {
      viewer: { x, y, width, height },
      pdf: { x: convertedX, y: convertedY, width: convertedWidth, height: convertedHeight },
      currentScale,
      baseScale,
      zoomLevel,
      originalPdfDimensions
    });
    
    return {
      x: convertedX,
      y: convertedY,
      width: convertedWidth,
      height: convertedHeight
    };
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || !mountedRef.current) return;
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      await renderPage(pdf, newPage);
      setCurrentPage(newPage);
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    if (newZoom < 0.5 || newZoom > 3.0) return; // Limit zoom range
    setZoomLevel(newZoom);
    
    // Re-render current page with new zoom
    if (pdfUrl && currentPage) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        await renderPage(pdf, currentPage);
      } catch (error) {
        console.error('Error re-rendering PDF with zoom:', error);
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !mountedRef.current || isDragging || isResizing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on an existing box
    const clickedBox = signatureBoxes
      .filter(box => box.pageNumber === currentPage)
      .find(box => 
        x >= box.x && x <= box.x + box.width &&
        y >= box.y && y <= box.y + box.height
      );

    if (clickedBox) {
      // Select the box
      setSelectedBoxId(clickedBox.id);
      return;
    }

    // Check if there's already a signature box on this page
    const existingBoxOnPage = signatureBoxes.find(box => box.pageNumber === currentPage);
    if (existingBoxOnPage) {
      toast.error('Only one signature per page is allowed');
      return;
    }

    // Deselect if clicking on empty space
    setSelectedBoxId(null);

    // Add new box
    const newBox: SignatureBox = {
      id: `box_${Date.now()}_${Math.random()}`,
      pageNumber: currentPage,
      x: x - 150, // Center the box on click
      y: y - 100, // Center the box on click
      width: 300, // Width for signature and metadata
      height: 150, // Reduced height for better signature/metadata ratio
      fieldType: 'signature',
      fieldLabel: fieldLabel || 'Signature',
      required: isRequired,
      isSelected: true
    };

    setSignatureBoxes(prev => {
      const updated = prev.map(box => ({ ...box, isSelected: false }));
      return [...updated, newBox];
    });
    setSelectedBoxId(newBox.id);
    toast.success('Signature box added');
  };

  const removeSignatureBox = (boxId: string) => {
    setSignatureBoxes(prev => prev.filter(box => box.id !== boxId));
    if (selectedBoxId === boxId) {
      setSelectedBoxId(null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !mountedRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const currentPageBoxes = signatureBoxes.filter(box => box.pageNumber === currentPage);
    
    // Check if clicking on a box
    const clickedBox = currentPageBoxes.find(box => 
      x >= box.x && x <= box.x + box.width &&
      y >= box.y && y <= box.y + box.height
    );

    if (clickedBox) {
      setSelectedBoxId(clickedBox.id);
      
      // Check if clicking near corners (exclude corner areas from dragging)
      const cornerSize = 20; // Size of corner area to exclude from dragging
      const isNearCorner = 
        (x <= clickedBox.x + cornerSize && y <= clickedBox.y + cornerSize) || // top-left
        (x >= clickedBox.x + clickedBox.width - cornerSize && y <= clickedBox.y + cornerSize) || // top-right
        (x <= clickedBox.x + cornerSize && y >= clickedBox.y + clickedBox.height - cornerSize) || // bottom-left
        (x >= clickedBox.x + clickedBox.width - cornerSize && y >= clickedBox.y + clickedBox.height - cornerSize); // bottom-right
      
      if (!isNearCorner) {
        // If not near corners, then it's dragging
        console.log('🚀 Starting drag from container');
        console.log('Click position:', { x, y });
        console.log('Box position:', { x: clickedBox.x, y: clickedBox.y, width: clickedBox.width, height: clickedBox.height });
        setIsDragging(true);
        setDragOffset({ x: x - clickedBox.x, y: y - clickedBox.y });
      }
    }
  };

  // Direct drag handler for signature boxes
  const handleBoxDragStart = (boxId: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🚀 DRAG STARTED from box:', boxId);
    
    const box = signatureBoxes.find(b => b.id === boxId);
    if (!box) {
      console.error('❌ Box not found for drag:', boxId);
      return;
    }
    
    setSelectedBoxId(boxId);
    setIsDragging(true);
    
    // Calculate offset from mouse to box corner
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    
    console.log('✅ Drag state set:', { boxId, offsetX, offsetY });
  };

  // Separate handler for resize handles
  const handleResizeStart = (handle: 'nw' | 'ne' | 'sw' | 'se', boxId: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log(`🚀 RESIZE STARTED: ${handle} for box ${boxId}`);
    console.log('Event details:', { clientX: event.clientX, clientY: event.clientY });
    
    const box = signatureBoxes.find(b => b.id === boxId);
    if (!box) {
      console.error('❌ Box not found:', boxId);
      return;
    }
    
    console.log('📦 Box found:', box);
    
    setSelectedBoxId(boxId);
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({ x: box.x, y: box.y, width: box.width, height: box.height });
    
    console.log('✅ Resize state set:', { handle, boxId, startPos: { x: box.x, y: box.y, width: box.width, height: box.height } });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !mountedRef.current) return;

    // Prevent event propagation during resize to avoid conflicts
    if (isResizing) {
      event.preventDefault();
      event.stopPropagation();
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check for handle hovering when not dragging or resizing
    if (!isDragging && !isResizing && selectedBoxId) {
      const selectedBox = signatureBoxes.find(box => box.id === selectedBoxId);
      if (selectedBox && selectedBox.pageNumber === currentPage) {
        const handleSize = 15; // Match the detection size from mouseDown
        const isNearCorner = (posX: number, posY: number, cornerX: number, cornerY: number) => {
          return Math.abs(posX - cornerX) <= handleSize && Math.abs(posY - cornerY) <= handleSize;
        };
        
        const topLeftX = selectedBox.x;
        const topLeftY = selectedBox.y;
        const topRightX = selectedBox.x + selectedBox.width;
        const topRightY = selectedBox.y;
        const bottomLeftX = selectedBox.x;
        const bottomLeftY = selectedBox.y + selectedBox.height;
        const bottomRightX = selectedBox.x + selectedBox.width;
        const bottomRightY = selectedBox.y + selectedBox.height;
        
        if (isNearCorner(x, y, topLeftX, topLeftY)) {
          setHoveredHandle('nw');
        } else if (isNearCorner(x, y, topRightX, topRightY)) {
          setHoveredHandle('ne');
        } else if (isNearCorner(x, y, bottomLeftX, bottomLeftY)) {
          setHoveredHandle('sw');
        } else if (isNearCorner(x, y, bottomRightX, bottomRightY)) {
          setHoveredHandle('se');
        } else {
          setHoveredHandle(null);
        }
      }
    }

    if (!isDragging && !isResizing) return;

    setSignatureBoxes(prev => prev.map(box => {
      if (box.id !== selectedBoxId) return box;

      if (isDragging) {
        const newX = Math.max(0, x - dragOffset.x);
        const newY = Math.max(0, y - dragOffset.y);
        
        console.log('🖱️ Dragging:', {
          mousePos: { x, y },
          dragOffset,
          newPos: { x: newX, y: newY }
        });
        
        return {
          ...box,
          x: newX,
          y: newY
        };
      }

      if (isResizing && resizeHandle) {
        const minSize = 50; // Minimum box size
        let newX = box.x;
        let newY = box.y;
        let newWidth = box.width;
        let newHeight = box.height;

        console.log('Resizing:', {
          handle: resizeHandle,
          mousePos: { x, y },
          startPos: resizeStart,
          currentBox: { x: box.x, y: box.y, width: box.width, height: box.height }
        });

        switch (resizeHandle) {
          case 'nw':
            newWidth = Math.max(minSize, resizeStart.x + resizeStart.width - x);
            newHeight = Math.max(minSize, resizeStart.y + resizeStart.height - y);
            newX = x;
            newY = y;
            break;
          case 'ne':
            newWidth = Math.max(minSize, x - resizeStart.x);
            newHeight = Math.max(minSize, resizeStart.y + resizeStart.height - y);
            newY = y;
            break;
          case 'sw':
            newWidth = Math.max(minSize, resizeStart.x + resizeStart.width - x);
            newHeight = Math.max(minSize, y - resizeStart.y);
            newX = x;
            break;
          case 'se':
            newWidth = Math.max(minSize, x - resizeStart.x);
            newHeight = Math.max(minSize, y - resizeStart.y);
            break;
        }

        console.log('New dimensions:', { newX, newY, newWidth, newHeight });

        return {
          ...box,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        };
      }

      return box;
    }));
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent event propagation during resize to avoid conflicts
    if (isResizing) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Keyboard shortcuts and resize handler - only run when mounted and document is available
  useEffect(() => {
    if (!mountedRef.current || typeof window === 'undefined') return;

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

    const handleResize = () => {
      // Re-render current page when window resizes to adjust PDF size
      if (pdfUrl && currentPage) {
        const loadPDF = async () => {
          try {
            const pdfjsLib = await import('pdfjs-dist');
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            await renderPage(pdf, currentPage);
          } catch (error) {
            console.error('Error re-rendering PDF on resize:', error);
          }
        };
        loadPDF();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      // Zoom with Ctrl+Wheel
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(3.0, zoomLevel + delta));
        handleZoomChange(newZoom);
      }
    };

    // Global mouse up handler to ensure resizing/dragging stops even if mouse leaves the container
    const handleGlobalMouseUp = () => {
      if (isResizing || isDragging) {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
      }
    };

    try {
      if (document && typeof document.addEventListener === 'function') {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('resize', handleResize);
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
          if (document && typeof document.removeEventListener === 'function') {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
          }
          if (window && typeof window.removeEventListener === 'function') {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('wheel', handleWheel);
          }
        };
      }
    } catch (error) {
      console.warn('Could not add event listeners:', error);
    }
  }, [selectedBoxId, pdfUrl, currentPage, isResizing, isDragging]);

  const updateSelectedBoxLabel = (newLabel: string) => {
    setSignatureBoxes(prev => prev.map(box => 
      box.id === selectedBoxId ? { ...box, fieldLabel: newLabel } : box
    ));
  };

  const handleSendRequest = async () => {
    if (!selectedReceiver) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (signatureBoxes.length === 0) {
      toast.error('Please add at least one signature field');
      return;
    }

    if (message.length > 300) {
      toast.error('Message is too long');
      return;
    }

    setIsSending(true);

    try {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + parseInt(expiresIn));

      // Use the same function as the dialog to ensure message bubbles are sent
      await createSignatureRequest(user.id, {
        document_id: documentId!,
        receiver_id: selectedReceiver,
        message: message || undefined,
        expires_at: expiresDate.toISOString(),
        positions: signatureBoxes.map(box => {
          // Convert coordinates to base scale for consistent positioning
          const converted = convertToBaseScale(box.x, box.y, box.width, box.height);
          console.log('Coordinate conversion:', {
            original: { x: box.x, y: box.y, width: box.width, height: box.height },
            converted: converted,
            baseScale,
            zoomLevel,
            page: box.pageNumber
          });
          return {
            page_number: box.pageNumber,
            x_position: Math.round(converted.x),
            y_position: Math.round(converted.y),
            width: Math.round(converted.width),
            height: Math.round(converted.height),
            field_type: box.fieldType,
            field_label: box.fieldLabel,
            required: box.required,
            scale: baseScale, // Store the scale used for coordinate conversion
            original_pdf_width: originalPdfDimensions?.width || 0,
            original_pdf_height: originalPdfDimensions?.height || 0
          };
        })
      });

      toast.success('Signature request sent successfully');
      router.push('/dashboard/my-vault');
    } catch (error) {
      console.error('Error sending signature request:', error);
      toast.error('Failed to send signature request');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">Document not found</div>
            <Button onClick={() => router.push('/dashboard/my-vault')}>
              Back to Vault
            </Button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/my-vault')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vault
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Request Signature</h1>
            <p className="text-muted-foreground">Add signature fields and send to recipient</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.filename}
              </CardTitle>
              <CardDescription>
                Click on the PDF to add signature fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* PDF Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                  {signatureBoxes.find(box => box.pageNumber === currentPage) && (
                    <Badge variant="secondary" className="ml-2">
                      ✓ Signature Added
                    </Badge>
                  )}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoomChange(zoomLevel - 0.25)}
                    disabled={zoomLevel <= 0.5}
                  >
                    -
                  </Button>
                  <span className="text-sm min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                        <Button
                          variant="outline"
                          size="sm"
                    onClick={() => handleZoomChange(zoomLevel + 0.25)}
                    disabled={zoomLevel >= 3.0}
                  >
                    +
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoomChange(1.0)}
                  >
                    Reset
                        </Button>
                </div>
                      </div>
                      
              {/* PDF Canvas */}
                <div 
                  ref={pdfContainerRef}
                  className={`border rounded-lg overflow-auto relative flex justify-center items-start ${
                    isResizing ? 'bg-blue-50 border-blue-300' : 
                    isDragging ? 'bg-green-50 border-green-300' : 'bg-gray-50'
                  }`}
                  style={{ maxHeight: '600px', minHeight: '400px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {isResizing && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg">
                      🔄 Resizing from {resizeHandle?.toUpperCase()} corner - Drag to resize box
                          </div>
                  )}
                  
                  {isDragging && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg">
                      🖱️ Dragging box - Move mouse to reposition
                        </div>
                      )}
                      
                  {/* DEBUG: Test functionality */}
                  {signatureBoxes.filter(box => box.pageNumber === currentPage).length > 0 && (
                    <div className="absolute top-2 right-2 z-30 space-y-1">
                      <button
                        onClick={() => {
                          const box = signatureBoxes.find(b => b.pageNumber === currentPage);
                          if (box) {
                            console.log('🧪 TEST: Manually triggering resize for box:', box.id);
                            setSelectedBoxId(box.id);
                            setIsResizing(true);
                            setResizeHandle('se');
                            setResizeStart({ x: box.x, y: box.y, width: box.width, height: box.height });
                          }
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs block w-full"
                      >
                        🧪 Test Resize
                      </button>
                      <button
                        onClick={() => {
                          const box = signatureBoxes.find(b => b.pageNumber === currentPage);
                          if (box) {
                            console.log('🧪 TEST: Manually triggering drag for box:', box.id);
                            setSelectedBoxId(box.id);
                            setIsDragging(true);
                            setDragOffset({ x: 10, y: 10 });
                          }
                        }}
                        className="bg-orange-500 text-white px-2 py-1 rounded text-xs block w-full"
                      >
                        🧪 Test Drag
                      </button>
                          </div>
                  )}
                  {!pdfUrl ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Loading PDF...</p>
                        </div>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      className={`${
                        isResizing 
                          ? resizeHandle === 'nw' || resizeHandle === 'se' 
                            ? 'cursor-nw-resize' 
                            : 'cursor-ne-resize'
                          : 'cursor-crosshair'
                      }`}
                      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                    />
                  )}
                
                {/* Signature Boxes Overlay */}
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
                      onMouseDown={handleBoxDragStart(box.id)}
                    >
                      <div className="text-xs font-medium text-gray-700 p-1">
                        {box.fieldLabel}
                      </div>
                      
                      {/* Signature preview area */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-2 left-2 right-2 bottom-16 border border-dashed border-gray-300 rounded bg-white bg-opacity-50 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Signature Area</span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 h-12 border border-dashed border-gray-300 rounded bg-gray-50 bg-opacity-50 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Metadata Area</span>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      {(box.isSelected || selectedBoxId === box.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSignatureBox(box.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          style={{ pointerEvents: 'auto' }}
                        >
                          ×
                        </button>
                      )}
                      
                      {/* Resize Handles */}
                      {(box.isSelected || selectedBoxId === box.id) && (
                        <>
                          {/* Top-left */}
                          <div
                            className={`absolute w-8 h-8 bg-blue-600 border-2 border-white rounded-full cursor-nw-resize shadow-lg transition-all ${
                              hoveredHandle === 'nw' || (isResizing && resizeHandle === 'nw') ? 'bg-blue-700 scale-125' : ''
                            }`}
                          style={{
                              left: -4,
                              top: -4,
                              pointerEvents: 'auto',
                              zIndex: 20
                            }}
                            onMouseDown={handleResizeStart('nw', box.id)}
                            title="Resize from top-left"
                          />
                          {/* Top-right */}
                          <div
                            className={`absolute w-8 h-8 bg-blue-600 border-2 border-white rounded-full cursor-ne-resize shadow-lg transition-all ${
                              hoveredHandle === 'ne' || (isResizing && resizeHandle === 'ne') ? 'bg-blue-700 scale-125' : ''
                            }`}
                            style={{
                              right: -4,
                              top: -4,
                              pointerEvents: 'auto',
                              zIndex: 20
                            }}
                            onMouseDown={handleResizeStart('ne', box.id)}
                            title="Resize from top-right"
                          />
                          {/* Bottom-left */}
                          <div
                            className={`absolute w-8 h-8 bg-blue-600 border-2 border-white rounded-full cursor-sw-resize shadow-lg transition-all ${
                              hoveredHandle === 'sw' || (isResizing && resizeHandle === 'sw') ? 'bg-blue-700 scale-125' : ''
                            }`}
                            style={{
                              left: -4,
                              bottom: -4,
                              pointerEvents: 'auto',
                              zIndex: 20
                            }}
                            onMouseDown={handleResizeStart('sw', box.id)}
                            title="Resize from bottom-left"
                          />
                          {/* Bottom-right */}
                          <div
                            className={`absolute w-8 h-8 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-lg transition-all ${
                              hoveredHandle === 'se' || (isResizing && resizeHandle === 'se') ? 'bg-blue-700 scale-125' : ''
                            }`}
                            style={{
                              right: -4,
                              bottom: -4,
                              pointerEvents: 'auto',
                              zIndex: 20
                            }}
                            onMouseDown={handleResizeStart('se', box.id)}
                            title="Resize from bottom-right"
                          />
                        </>
                  )}
                </div>
                  ))}
              </div>


            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Signature Field */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Signature Field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label htmlFor="fieldLabel">Field Label</Label>
                <Input
                  id="fieldLabel"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="Enter field label"
                />
              </div>

              {selectedBoxId && (
                <div>
                  <Label htmlFor="selectedFieldLabel">Edit Selected Field</Label>
                  <Input
                    id="selectedFieldLabel"
                    value={signatureBoxes.find(box => box.id === selectedBoxId)?.fieldLabel || ''}
                    onChange={(e) => updateSelectedBoxLabel(e.target.value)}
                    placeholder="Edit field label"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="required">Required field</Label>
                </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Click on the PDF to place signature fields</div>
                <div>• One signature per page maximum</div>
                <div>• Drag boxes to reposition them</div>
                <div>• Drag corners to resize boxes</div>
                <div>• Use zoom controls to adjust view</div>
                <div>• Click boxes to select and edit</div>
                <div>• Minimum size: 50×50px</div>
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium text-blue-800">Signature Layout:</div>
                  <div className="text-blue-700">• Top area: Signature image</div>
                  <div className="text-blue-700">• Bottom area: Metadata (name, date, ID)</div>
                </div>
                {isResizing && (
                  <div className="text-blue-600 font-medium">🔄 Resizing active - drag to resize</div>
                )}
                
                {/* Debug information for selected box */}
                {selectedBoxId && (() => {
                  const selectedBox = signatureBoxes.find(box => box.id === selectedBoxId);
                  if (!selectedBox) return null;
                  
                  const pdfCoords = convertToBaseScale(selectedBox.x, selectedBox.y, selectedBox.width, selectedBox.height);
                  return (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                      <div className="font-medium mb-2">Debug Info:</div>
                      <div>Viewer: ({Math.round(selectedBox.x)}, {Math.round(selectedBox.y)}) {Math.round(selectedBox.width)}×{Math.round(selectedBox.height)}</div>
                      <div>PDF: ({Math.round(pdfCoords.x)}, {Math.round(pdfCoords.y)}) {Math.round(pdfCoords.width)}×{Math.round(pdfCoords.height)}</div>
                      <div>Scale: {baseScale.toFixed(2)} × {zoomLevel.toFixed(2)} = {(baseScale * zoomLevel).toFixed(2)}</div>
                      {originalPdfDimensions && (
                        <div>PDF Size: {Math.round(originalPdfDimensions.width)}×{Math.round(originalPdfDimensions.height)}</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                    aria-label="Search recipients"
                  className="pl-8"
                  placeholder="Search by name..."
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-40 border rounded-md p-2 bg-background">
                  {connections.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No connections found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                      {connections
                        .filter((connection) => {
                          if (!recipientSearch) return true;
                          return connection.full_name?.toLowerCase().includes(recipientSearch.toLowerCase());
                        })
                        .map((connection) => (
                        <div
                          key={connection.id}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer ${selectedReceiver === connection.id ? 'bg-primary/10' : ''}`}
                            onClick={() => setSelectedReceiver(connection.id)}
                          >
                            <input
                              type="radio"
                              checked={selectedReceiver === connection.id}
                              onChange={() => setSelectedReceiver(connection.id)}
                              className="rounded"
                          />
                          <Avatar className="w-7 h-7">
                              <AvatarImage src={connection.avatar_url || undefined} />
                            <AvatarFallback>
                                {connection.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                            <span className="font-medium text-sm truncate">{connection.full_name || 'Unknown User'}</span>
                        </div>
                        ))}
                  </div>
                )}
              </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <span className={`text-xs ${message.length > 300 ? 'text-destructive' : 'text-muted-foreground'}`}>{message.length}/300</span>
                </div>
                <Textarea
                  id="message"
                  aria-label="Message"
                  placeholder="Add a personal message to your signature request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={310}
                />
              </div>
            </CardContent>
          </Card>

          {/* Expiration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expiration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Label htmlFor="expires" className="whitespace-nowrap">Expires in</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Signature Fields Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signature Fields</CardTitle>
              <CardDescription>
                {signatureBoxes.length} field(s) added • One per page • Click to select and edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {signatureBoxes.map((box) => (
                    <div 
                      key={box.id} 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedBoxId === box.id 
                          ? 'bg-blue-100 border border-blue-300' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => {
                        setSelectedBoxId(box.id);
                        setSignatureBoxes(prev => prev.map(b => ({ ...b, isSelected: b.id === box.id })));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {box.fieldType}
                        </Badge>
                        <span className="text-sm">{box.fieldLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          (Page {box.pageNumber})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSignatureBox(box.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                      </Button>
                      </div>
                    </div>
                  ))}
                  {signatureBoxes.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No signature fields added yet</p>
                      <p className="text-xs">Click on the PDF to add signature fields</p>
                </div>
              )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendRequest}
            disabled={isSending || !selectedReceiver || signatureBoxes.length === 0 || message.length > 300}
            className="w-full"
          >
            {isSending && <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle" />}
            {isSending ? 'Sending...' : 'Send Signature Request'}
          </Button>
        </div>
      </div>
    </div>
  );
} 