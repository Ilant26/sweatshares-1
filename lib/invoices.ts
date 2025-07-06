import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sender_id: string;
  receiver_id?: string;
  external_client_id?: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  description?: string;
  items: InvoiceItem[];
  vat_enabled: boolean;
  vat_rate: number;
  vat_amount: number;
  subtotal: number;
  total: number;
  payment_method?: 'standard' | 'payment_link' | 'escrow';
  escrow_transaction_id?: string;
  created_at: string;
  updated_at: string;
  external_client?: {
    company_name: string;
    contact_name: string;
    address: string;
    email: string;
    phone: string;
  };
}

export async function createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClientComponentClient<Database>();
  
  // Prepare the invoice data for insertion
  const invoiceData = {
    ...invoice,
    payment_method: invoice.payment_method || 'standard' // Default to standard if not specified
  };
  
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  if (error) throw error;
  return ensureVatFields(data);
}

// Helper function to ensure VAT fields are properly set
function ensureVatFields(invoice: any): Invoice {
  // Calculate subtotal from items if not present
  const subtotal = invoice.subtotal || invoice.items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
  
  // Set default VAT values if not present
  const vatEnabled = invoice.vat_enabled ?? false;
  const vatRate = invoice.vat_rate ?? 20;
  const vatAmount = invoice.vat_amount ?? (vatEnabled ? Number((subtotal * (vatRate / 100)).toFixed(2)) : 0);
  const total = invoice.total ?? (subtotal + vatAmount);
  
  return {
    ...invoice,
    subtotal: Number(subtotal.toFixed(2)),
    vat_enabled: vatEnabled,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total: Number(total.toFixed(2)),
    payment_method: invoice.payment_method || 'standard'
  };
}

export async function getInvoices(userId: string) {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      external_client:external_clients(*)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Ensure all invoices have proper VAT fields
  return data?.map(ensureVatFields) || [];
}

export async function updateInvoiceStatus(invoiceId: string, status: 'pending' | 'paid' | 'cancelled') {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return ensureVatFields(data);
}

export async function editInvoice(invoiceId: string, updates: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return ensureVatFields(data);
}

export function generateInvoicePDF(invoice: Invoice, senderProfile: any, receiverProfile: any) {
  const doc = new jsPDF();

  // Colors
  const primaryColor: [number, number, number] = [41, 128, 185];
  const lightGray: [number, number, number] = [240, 240, 240];

  // Header bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(senderProfile.company ? String(senderProfile.company) : 'INVOICE', 12, 20);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice #${invoice.invoice_number}`, 200, 20, { align: 'right' });

  // Invoice details box
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setDrawColor(220, 220, 220);
  doc.rect(12, 35, 186, 18, 'S');
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 16, 43);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 16, 50);
  doc.text(`Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`, 120, 43);
  doc.text(`Currency: ${invoice.currency}`, 120, 50);

  // Sender/Receiver details
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 16, 62);
  doc.text('To:', 120, 62);
  doc.setFont('helvetica', 'normal');
  let fromY = 67;
  let toY = 67;
  const safe = (val: any) => val ? String(val) : 'N/A';
  // Sender
  doc.text(safe(senderProfile.company), 16, fromY);
  doc.text(safe(senderProfile.full_name), 16, fromY + 6);
  doc.text(safe(senderProfile.email), 16, fromY + 12);
  doc.text(safe(senderProfile.phone_number), 16, fromY + 18);
  doc.text(safe(senderProfile.address), 16, fromY + 24);
  // Receiver
  if (invoice.external_client) {
    doc.text(safe(invoice.external_client.company_name || invoice.external_client.contact_name), 120, toY);
    doc.text('N/A', 120, toY + 6);
    doc.text(safe(invoice.external_client.email), 120, toY + 12);
    doc.text(safe(invoice.external_client.phone), 120, toY + 18);
    doc.text(safe(invoice.external_client.address), 120, toY + 24);
  } else {
    doc.text(safe(receiverProfile.company), 120, toY);
    doc.text(safe(receiverProfile.full_name), 120, toY + 6);
    doc.text(safe(receiverProfile.email), 120, toY + 12);
    doc.text(safe(receiverProfile.phone_number), 120, toY + 18);
    doc.text(safe(receiverProfile.address), 120, toY + 24);
  }

  // Section line
  doc.setDrawColor(220, 220, 220);
  doc.line(12, 97, 198, 97);

  // Items table
  const tableStartY = 102;
  const subtotal = invoice.subtotal || invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const vatEnabled = invoice.vat_enabled || false;
  const vatRate = invoice.vat_rate || 20;
  const vatAmount = invoice.vat_amount || (vatEnabled ? Number((subtotal * (vatRate / 100)).toFixed(2)) : 0);
  const total = invoice.total || (subtotal + vatAmount);

  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} ${invoice.currency}`,
    `${item.amount.toFixed(2)} ${invoice.currency}`
  ]);

  const footerRows = [
    ['Subtotal', '', '', `${subtotal.toFixed(2)} ${invoice.currency}`]
  ];
  if (vatEnabled) {
    footerRows.push([`VAT (${vatRate}%)`, '', '', `${vatAmount.toFixed(2)} ${invoice.currency}`]);
  }
  footerRows.push(['', '', '', '']); // Spacer
  footerRows.push(['Total', '', '', `${total.toFixed(2)} ${invoice.currency}`]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    foot: footerRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: lightGray, textColor: 0, fontStyle: 'bold', fontSize: 12 },
    styles: { font: 'helvetica', fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    },
    didDrawPage: (data) => {
      // Highlight the total row
      const totalRow = data.table.foot[data.table.foot.length - 1];
      if (totalRow) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      }
    }
  });

  // Notes section
  if (invoice.description) {
    const finalY = (doc as any).lastAutoTable.finalY || (tableStartY + 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 12, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.description, 12, finalY + 18);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by SweatShares', 12, 290);

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, senderProfile: any, receiverProfile: any) {
  const doc = generateInvoicePDF(invoice, senderProfile, receiverProfile);
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
} 