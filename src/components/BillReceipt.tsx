import { useEffect, useState } from 'react';
import { Bill, formatINR } from '@/lib/bills';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Check } from 'lucide-react';
import { downloadBillPDF } from '@/lib/pdf';

interface Props {
  bill: Bill | null;
  onClose: () => void;
}

export default function BillReceipt({ bill, onClose }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(!!bill); }, [bill]);
  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); setOpen(v); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 no-print">
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="inline-flex w-8 h-8 rounded-full bg-success/15 text-success items-center justify-center">
              <Check className="w-4 h-4" />
            </span>
            Bill Generated
          </DialogTitle>
        </DialogHeader>

        <div id="print-area" className="px-8 pb-6 pt-2">
          <div className="border-b-2 border-primary pb-4 mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary tracking-tight">SCHIN PAINTS</h2>
              <p className="text-xs text-muted-foreground">Quality Paints &amp; Hardware · CSN, MH</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground">Tax Invoice</div>
              <div className="font-mono-num text-sm mt-0.5">{bill.invoiceNo}</div>
              <div className="text-muted-foreground mt-0.5">{new Date(bill.createdAt).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="py-2 w-8">#</th>
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it, i) => (
                <tr key={i} className="border-b border-dashed">
                  <td className="py-2 text-muted-foreground font-mono-num">{i + 1}</td>
                  <td className="py-2">{it.name}</td>
                  <td className="py-2 text-right font-mono-num">{it.qty} {it.unit}</td>
                  <td className="py-2 text-right font-mono-num">{formatINR(it.price)}</td>
                  <td className="py-2 text-right font-mono-num">{formatINR(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono-num">{formatINR(bill.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-warning">Discount</span><span className="font-mono-num text-warning">- {formatINR(bill.discount)}</span></div>
            <div className="flex justify-between border-t-2 border-foreground pt-2 mt-2">
              <span className="font-display font-bold text-lg">TOTAL</span>
              <span className="font-mono-num font-bold text-lg text-primary">{formatINR(bill.total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground italic mt-8">
            Thank you for shopping at Schin Paints. Goods once sold will not be taken back.
          </p>
        </div>

        <div className="no-print flex gap-2 justify-end px-6 py-4 border-t bg-secondary/40">
          <Button variant="outline" onClick={() => downloadBillPDF(bill)}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={() => window.print()} className="bg-gradient-primary">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
