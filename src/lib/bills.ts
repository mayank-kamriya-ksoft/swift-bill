// Bills are stored only in localStorage with a 24h TTL.
// They are wiped on logout (see auth.ts) and pruned on every read.

export interface BillItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}
export interface Bill {
  id: string;
  invoiceNo: string;
  createdAt: number; // ms epoch
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
}

const BILLS_KEY = 'schin.bills';
const CART_KEY = 'schin.cart';
const INVOICE_SEQ_KEY = 'schin.invoiceSeq';
const TTL_MS = 24 * 60 * 60 * 1000;

function readAll(): Bill[] {
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bill[];
  } catch { return []; }
}

function pruneExpired(bills: Bill[]): Bill[] {
  const cutoff = Date.now() - TTL_MS;
  const fresh = bills.filter(b => b.createdAt >= cutoff);
  if (fresh.length !== bills.length) {
    localStorage.setItem(BILLS_KEY, JSON.stringify(fresh));
  }
  return fresh;
}

export function getBills(): Bill[] {
  return pruneExpired(readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveBill(bill: Bill) {
  const all = pruneExpired(readAll());
  all.push(bill);
  localStorage.setItem(BILLS_KEY, JSON.stringify(all));
}

export function nextInvoiceNo(): string {
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const raw = localStorage.getItem(INVOICE_SEQ_KEY);
  let seq = 1;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { date: string; seq: number };
      if (parsed.date === stamp) seq = parsed.seq + 1;
    } catch { /* ignore */ }
  }
  localStorage.setItem(INVOICE_SEQ_KEY, JSON.stringify({ date: stamp, seq }));
  return `SP-${stamp}-${String(seq).padStart(3, '0')}`;
}

// Cart draft persistence (also wiped on logout)
export function saveCartDraft(items: BillItem[], discount: number) {
  localStorage.setItem(CART_KEY, JSON.stringify({ items, discount }));
}
export function loadCartDraft(): { items: BillItem[]; discount: number } {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [], discount: 0 };
    return JSON.parse(raw);
  } catch { return { items: [], discount: 0 }; }
}
export function clearCartDraft() { localStorage.removeItem(CART_KEY); }

export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
