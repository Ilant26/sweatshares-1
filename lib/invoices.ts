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
  created_at: string;
  updated_at: string;
  external_client?: {
    company_name: string;
    contact_name: string;
    address: string;
    email: string;
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
  
  // Debug logging
  console.log('PDF Generation - Invoice data:', {
    invoice_number: invoice.invoice_number,
    vat_enabled: invoice.vat_enabled,
    vat_rate: invoice.vat_rate,
    vat_amount: invoice.vat_amount,
    subtotal: invoice.subtotal,
    total: invoice.total,
    items: invoice.items
  });
  
  // Add header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Add invoice details
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 40);
  doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 45);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 50);
  
  // Add sender and receiver details
  doc.text('From:', 20, 70);
  doc.text(senderProfile.full_name || '', 20, 75);
  doc.text(senderProfile.address || '', 20, 80);
  doc.text(senderProfile.email || '', 20, 85);
  
  doc.text('To:', 120, 70);
  // Handle both network and external clients
  if (invoice.external_client) {
    doc.text(invoice.external_client.company_name || invoice.external_client.contact_name || '', 120, 75);
    doc.text(invoice.external_client.address || '', 120, 80);
    doc.text(invoice.external_client.email || '', 120, 85);
  } else {
    doc.text(receiverProfile.full_name || '', 120, 75);
    doc.text(receiverProfile.address || '', 120, 80);
    doc.text(receiverProfile.email || '', 120, 85);
  }
  
  // Calculate totals if not present
  const subtotal = invoice.subtotal || invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const vatEnabled = invoice.vat_enabled || false;
  const vatRate = invoice.vat_rate || 20;
  const vatAmount = invoice.vat_amount || (vatEnabled ? Number((subtotal * (vatRate / 100)).toFixed(2)) : 0);
  const total = invoice.total || (subtotal + vatAmount);
  
  console.log('PDF Generation - Calculated values:', {
    subtotal,
    vatEnabled,
    vatRate,
    vatAmount,
    total
  });
  
  // Add items table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} ${invoice.currency}`,
    `${item.amount.toFixed(2)} ${invoice.currency}`
  ]);
  
  // Prepare footer rows
  const footerRows = [
    ['Subtotal', '', '', `${subtotal.toFixed(2)} ${invoice.currency}`]
  ];
  
  if (vatEnabled) {
    footerRows.push([`VAT (${vatRate}%)`, '', '', `${vatAmount.toFixed(2)} ${invoice.currency}`]);
  }
  
  footerRows.push(['Total', '', '', `${total.toFixed(2)} ${invoice.currency}`]);
  
  console.log('PDF Generation - Footer rows:', footerRows);
  
  autoTable(doc, {
    startY: 100,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    foot: footerRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [240, 240, 240] }
  });
  
  // Add notes
  if (invoice.description) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text('Notes:', 20, finalY + 20);
    doc.text(invoice.description, 20, finalY + 25);
  }
  
  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, senderProfile: any, receiverProfile: any) {
  const doc = generateInvoicePDF(invoice, senderProfile, receiverProfile);
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
} 