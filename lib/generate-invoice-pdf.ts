/**
 * Server-side invoice PDF generator using jsPDF (Node.js distribution).
 * Returns a Buffer that can be attached to emails via nodemailer.
 */
import jsPDF from 'jspdf';

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Protechtur';

export function generateInvoicePDFBuffer(
  order: Record<string, any>,
  items: Array<{
    item_name: string;
    product_code?: string;
    product_id?: number | string;
    quantity: number | string;
    unit_price: number | string;
    total_price: number | string;
    item_type?: string;
  }>,
  invoiceNumber: string,
  codFlatAmount: number = 500
): Buffer | null {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ── Header band ────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_NAME.toUpperCase(), pageW / 2, 18, { align: 'center' });
    doc.setFontSize(13);
    doc.text('CUSTOMER INVOICE', pageW / 2, 31, { align: 'center' });

    y = 48;

    // Customer-facing order number — strip the dealer UID suffix (e.g. -101)
    const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(order.order_number)
      ? order.order_number.replace(/-\d+$/, '')
      : (order.order_number || '—');

    // ── Invoice metadata ────────────────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${invoiceNumber}`, margin, y);
    doc.text(`Order No: ${customerOrderNumber}`, pageW - margin, y, { align: 'right' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      margin, y
    );
    doc.text(
      `Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'} | Status: ${order.payment_status || 'Pending'}`,
      pageW - margin, y, { align: 'right' }
    );
    y += 3;

    // Divider
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += 8;

    // ── Seller & Buyer Section ────────────────────────────────────────
    const col2 = pageW / 2 + 5;
    const rightColWidth = pageW - margin - col2 - 2;
    const leftColWidth = col2 - margin - 8;

    // Section headers
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y - 2, leftColWidth, 7, 'F');
    doc.rect(col2, y - 2, rightColWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('SELLER', margin + 2, y + 3);
    doc.text('BUYER', col2 + 2, y + 3);
    y += 8;

    let yLeft = y;
    let yRight = y;

    // ── Left column: SELLER details (fixed for all customer invoices) ──
    const sellerName = 'PROTECHTUR';
    const sellerAddress = 'Hatabari, Central Bus Stand, Contai, Purba Medinipur';
    const sellerCity = 'Contai';
    const sellerDistrict = 'Purba Medinipur';
    const sellerState = 'West Bengal';
    const sellerPin = '721401';
    const sellerPhone = '8250999523 / 8250999521 / 8250999522';
    const sellerGST = '19DNTPS0577P1ZO';
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Name:', margin, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(sellerName, margin, yLeft);
    yLeft += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Address:', margin, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'normal');
    const sellerAddrLines = doc.splitTextToSize(sellerAddress, leftColWidth);
    doc.text(sellerAddrLines, margin, yLeft);
    yLeft += (sellerAddrLines.length as number) * 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text('City:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerCity}`, margin + 10, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text('District:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerDistrict}`, margin + 14, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text('State:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerState}`, margin + 12, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text('Pin:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerPin}`, margin + 8, yLeft);
    yLeft += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text('Phone Number:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerPhone}`, margin + 25, yLeft);
    yLeft += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('GST Number:', margin, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.text(` ${sellerGST}`, margin + 20, yLeft);
    yLeft += 5;

    // ── Right column: BUYER details ──────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Name:', col2, yRight);
    yRight += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(order.customer_name || '—', col2, yRight);
    yRight += 5;

    const buyerAddress = order.installation_address || '—';
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', col2, yRight);
    yRight += 4.5;

    doc.setFont('helvetica', 'normal');
    const buyerAddrLines = doc.splitTextToSize(buyerAddress, rightColWidth);
    doc.text(buyerAddrLines, col2, yRight);
    yRight += (buyerAddrLines.length as number) * 4.5;

    if (order.pincode) {
      doc.setFont('helvetica', 'bold');
      doc.text('Pincode:', col2, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${order.pincode}`, col2 + 16, yRight);
      yRight += 4.5;
    }

    if (order.state) {
      doc.setFont('helvetica', 'bold');
      doc.text('State:', col2, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${order.state}`, col2 + 12, yRight);
      yRight += 4.5;
    }

    const customerGSTIN = order.customer_gstin || order.gstin || '';
    if (customerGSTIN) {
      doc.setFont('helvetica', 'bold');
      doc.text('GST No.:', col2, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${customerGSTIN}`, col2 + 16, yRight);
      yRight += 4.5;
    }

    if (order.city) {
      doc.setFont('helvetica', 'bold');
      doc.text('City:', col2, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${order.city}`, col2 + 10, yRight);
      yRight += 4.5;
    }

    y = Math.max(yLeft, yRight) + 3;

    // Divider
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // ── Items Table ────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
    doc.setTextColor(255, 255, 255);

    const colSNo     = margin + 2;
    const colProductId = margin + 10;
    const colDesc    = margin + 36;
    const colQty     = margin + 65;
    const colUnit    = margin + 80;
    const colUPrice  = margin + 92;
    const colTotal   = margin + 110;
    const colDisc    = margin + 128;
    const colGST     = margin + 142;
    const colSGST    = margin + 158;
    const colCGST    = margin + 172;

    doc.setFontSize(7.5);
    doc.text('S.No', colSNo, y + 5);
    doc.text('Product Unique_ID', colProductId, y + 5);
    doc.text('Description', colDesc, y + 5);
    doc.text('Qty', colQty, y + 5);
    doc.text('Unit', colUnit, y + 5);
    doc.text('UnitPrice', colUPrice, y + 5);
    doc.text('Total', colTotal, y + 5);
    doc.text('Discount', colDisc, y + 5);
    doc.text('GST%', colGST, y + 5);
    doc.text('SGST', colSGST, y + 5);
    doc.text('CGST', colCGST, y + 5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let subtotalComputed = 0;

    (items || []).forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 1, pageW - 2 * margin, 7, 'F');
      }
      doc.setTextColor(15, 23, 42);
      
      // Product price without GST
      const itemTotal = parseFloat(String(item.total_price));
      const itemUnitPrice = parseFloat(String(item.unit_price));
      const itemQty = parseFloat(String(item.quantity));
      const itemDiscount = 0; // Discount not tracked at item level currently
      
      const gstAmount = Math.round((itemTotal * 0.18) * 100) / 100;
      const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
      const cgstAmount = Math.round((gstAmount - sgstAmount) * 100) / 100;
      
      const fallbackSource = (item.product_id ?? (item as any).item_id ?? (item as any).id ?? (idx + 1));
      const productUniqueId = item.product_code || `PIC${String(fallbackSource).padStart(3, '0')}`;
      doc.text(String(idx + 1), colSNo, y + 4);
      doc.text(String(productUniqueId), colProductId, y + 4);
      const nameLines = doc.splitTextToSize(item.item_name, 50);
      doc.text(nameLines[0], colDesc, y + 4);
      doc.text(String(itemQty), colQty, y + 4);
      doc.text('', colUnit, y + 4); // Unit column empty
      doc.text(`${itemUnitPrice.toFixed(2)}`, colUPrice, y + 4);
      doc.text(`${itemTotal.toFixed(2)}`, colTotal, y + 4);
      doc.text(itemDiscount > 0 ? `${itemDiscount}%` : '', colDisc, y + 4);
      doc.text('18%', colGST, y + 4);
      doc.text(`${sgstAmount.toFixed(2)}`, colSGST, y + 4);
      doc.text(`${cgstAmount.toFixed(2)}`, colCGST, y + 4);
      
      subtotalComputed += itemTotal;
      y += 7;
    });

    // ── Totals Block ───────────────────────────────────────────────────
    y += 4;
    doc.setDrawColor(200, 210, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    const totalsX    = pageW - margin - 70;
    const totalsValX = pageW - margin;

    const addRow = (
      label: string,
      val: number,
      bold = false,
      rgb: [number, number, number] = [15, 23, 42]
    ) => {
      if (val === 0) return;
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text(label, totalsX, y);
      doc.text(
        `Rs.${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalsValX, y, { align: 'right' }
      );
      y += 6;
    };

    // Always use actual items sum (DB subtotal may be incorrect)
    const productTotal = subtotalComputed;

    addRow('Product Total:', productTotal);
    
    // COD Extra Charges (flat amount from installation_settings)
    let codCharges = 0;
    if (order.payment_method === 'cod') {
      codCharges = codFlatAmount;
      if (codCharges > 0) {
        addRow('COD Extra Charges:', codCharges);
      }
    }

    // GST is applied only on product total (COD charges are non-taxable here)
    const calculatedGST = Math.round(productTotal * 0.18 * 100) / 100;
    const finalSGST = Math.round((calculatedGST / 2) * 100) / 100;
    const finalCGST = Math.round((calculatedGST - finalSGST) * 100) / 100;
    
    if (calculatedGST > 0) {
      addRow('SGST (9%):', finalSGST);
      addRow('CGST (9%):', finalCGST);
    }

    // Grand total = Product + GST (+ COD extra when applicable)
    const grandTotal = productTotal + calculatedGST + codCharges;
    const bandX = totalsX - 4;
    const bandW = pageW - margin - bandX;
    doc.setFillColor(15, 23, 42);
    doc.rect(bandX, y - 1, bandW, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(250, 204, 21);
    doc.text('GRAND TOTAL', totalsX, y + 6);
    doc.text(
      `Rs.${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalsValX, y + 6, { align: 'right' }
    );
    y += 16;

    // ── Footer ─────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 18, pageW, 18, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 210, 230);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Thank you for choosing ${COMPANY_NAME}. For support, contact us via our website.`,
      pageW / 2, pageH - 10, { align: 'center' }
    );
    doc.text(
      `This is a system-generated invoice. Invoice ID: ${invoiceNumber}`,
      pageW / 2, pageH - 5, { align: 'center' }
    );

    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (err) {
    console.error('❌ Failed to generate invoice PDF buffer:', err);
    return null;
  }
}
