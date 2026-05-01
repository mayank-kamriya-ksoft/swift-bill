import jsPDF from 'jspdf';
import type { Bill } from './bills';
import { formatINR } from './bills';

const SHOP = { name: 'SCHIN PAINTS', address: 'CSN, MH', tagline: 'Quality Paints & Hardware' };

export function downloadBillPDF(bill: Bill) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;

  // Header band
  doc.setFillColor(199, 47, 30); // primary red
  doc.rect(0, 0, W, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text(SHOP.name, M, 36);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(SHOP.tagline, M, 54);
  doc.text(SHOP.address, W - M, 54, { align: 'right' });

  y = 100;
  doc.setTextColor(20, 20, 28);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('TAX INVOICE', M, y);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Invoice #: ${bill.invoiceNo}`, W - M, y - 6, { align: 'right' });
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleString('en-IN')}`, W - M, y + 8, { align: 'right' });

  y += 20;
  doc.setDrawColor(220); doc.line(M, y, W - M, y); y += 16;

  // Table header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.setFillColor(245, 242, 235);
  doc.rect(M, y - 12, W - 2 * M, 22, 'F');
  doc.text('#', M + 6, y + 2);
  doc.text('Item', M + 28, y + 2);
  doc.text('Qty', W - M - 200, y + 2, { align: 'right' });
  doc.text('Rate', W - M - 110, y + 2, { align: 'right' });
  doc.text('Amount', W - M - 6, y + 2, { align: 'right' });
  y += 18;

  doc.setFont('helvetica', 'normal');
  bill.items.forEach((it, i) => {
    if (y > 740) { doc.addPage(); y = M; }
    doc.text(String(i + 1), M + 6, y);
    doc.text(it.name, M + 28, y);
    doc.text(`${it.qty} ${it.unit}`, W - M - 200, y, { align: 'right' });
    doc.text(formatINR(it.price), W - M - 110, y, { align: 'right' });
    doc.text(formatINR(it.price * it.qty), W - M - 6, y, { align: 'right' });
    y += 18;
  });

  y += 6;
  doc.setDrawColor(220); doc.line(M, y, W - M, y); y += 18;

  const labelX = W - M - 140;
  const valX = W - M - 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text('Subtotal', labelX, y); doc.text(formatINR(bill.subtotal), valX, y, { align: 'right' }); y += 16;
  doc.setTextColor(160, 80, 0);
  const discLabel = bill.discountType === 'percent' ? `Discount (${bill.discountInput}%)` : 'Discount';
  doc.text(discLabel, labelX, y); doc.text('- ' + formatINR(bill.discount), valX, y, { align: 'right' }); y += 18;
  doc.setTextColor(20, 20, 28);

  doc.setDrawColor(20); doc.line(labelX - 10, y - 8, valX + 4, y - 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('TOTAL', labelX, y + 6);
  doc.text(formatINR(bill.total), valX, y + 6, { align: 'right' });
  y += 30;

  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text('Thank you for shopping at Schin Paints. Goods once sold will not be taken back.', M, 800);

  doc.save(`${bill.invoiceNo}.pdf`);
}
