import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout } from '@/lib/auth';
import { Bill, BillItem, formatINR, getBills, loadCartDraft, nextInvoiceNo, saveBill, saveCartDraft, clearCartDraft } from '@/lib/bills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductSearch, { Product } from '@/components/ProductSearch';
import BillReceipt from '@/components/BillReceipt';
import AdminPanel from '@/components/AdminPanel';
import { LogOut, Trash2, Receipt, PaintBucket, ShieldCheck, Clock, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { document.title = 'Schin Paints — Billing'; }, []);
  useEffect(() => { if (!session) navigate('/login', { replace: true }); }, [session, navigate]);
  if (!session) return null;

  const draft = loadCartDraft();
  const [items, setItems] = useState<BillItem[]>(draft.items);
  const [discount, setDiscount] = useState<number>(draft.discount);
  const [recent, setRecent] = useState<Bill[]>(getBills());
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  // Persist cart draft
  useEffect(() => { saveCartDraft(items, discount); }, [items, discount]);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const addProduct = (p: Product) => {
    setItems(prev => {
      const existing = prev.find(it => it.productId === p.id);
      if (existing) return prev.map(it => it.productId === p.id ? { ...it, qty: it.qty + 1 } : it);
      return [...prev, { productId: p.id, name: p.name, unit: p.unit, price: p.price, qty: 1 }];
    });
  };
  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return setItems(prev => prev.filter(it => it.productId !== id));
    setItems(prev => prev.map(it => it.productId === id ? { ...it, qty } : it));
  };
  const remove = (id: string) => setItems(prev => prev.filter(it => it.productId !== id));

  const generateBill = () => {
    if (!items.length) { toast.error('Add at least one item'); return; }
    if (discount > subtotal) { toast.error('Discount cannot exceed subtotal'); return; }
    const bill: Bill = {
      id: crypto.randomUUID(),
      invoiceNo: nextInvoiceNo(),
      createdAt: Date.now(),
      items,
      subtotal,
      discount,
      total,
    };
    saveBill(bill);
    setActiveBill(bill);
    setItems([]); setDiscount(0); clearCartDraft();
    setRecent(getBills());
    toast.success('Bill generated · ' + bill.invoiceNo);
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out · all bill data cleared');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Top bar */}
      <header className="no-print border-b bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
              <PaintBucket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-none">Schin Paints</h1>
              <p className="text-xs text-muted-foreground">CSN, MH</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${session.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-secondary text-secondary-foreground'}`}>
              <ShieldCheck className="w-3 h-3" /> {session.role.toUpperCase()}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="billing">
          <TabsList className="no-print mb-6">
            <TabsTrigger value="billing"><Receipt className="w-4 h-4 mr-2" /> Billing</TabsTrigger>
            <TabsTrigger value="recent"><Clock className="w-4 h-4 mr-2" /> Recent (24h)</TabsTrigger>
            {session.role === 'admin' && <TabsTrigger value="admin"><ShieldCheck className="w-4 h-4 mr-2" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="billing">
            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
              {/* LEFT: search + cart */}
              <section className="space-y-4">
                <ProductSearch onSelect={addProduct} autoFocus />

                <div className="bg-card border rounded-2xl shadow-soft overflow-hidden">
                  <div className="px-5 py-3 border-b bg-secondary/40 flex items-center justify-between">
                    <h2 className="font-semibold">Current Bill</h2>
                    <span className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 && 's'}</span>
                  </div>

                  {items.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Search and add products to start billing</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                          <th className="text-left py-2 px-5">Item</th>
                          <th className="py-2 w-36 text-center">Qty</th>
                          <th className="py-2 w-24 text-right">Rate</th>
                          <th className="py-2 w-28 text-right pr-5">Amount</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => (
                          <tr key={it.productId} className="border-b last:border-0">
                            <td className="py-3 px-5">
                              <div className="font-medium">{it.name}</div>
                              <div className="text-xs text-muted-foreground">per {it.unit}</div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(it.productId, it.qty - 1)}><Minus className="w-3 h-3" /></Button>
                                <Input
                                  className="h-7 w-14 text-center font-mono-num px-1"
                                  type="number" min={0}
                                  value={it.qty}
                                  onChange={e => setQty(it.productId, parseFloat(e.target.value) || 0)}
                                />
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(it.productId, it.qty + 1)}><Plus className="w-3 h-3" /></Button>
                              </div>
                            </td>
                            <td className="py-3 text-right font-mono-num">{formatINR(it.price)}</td>
                            <td className="py-3 text-right pr-5 font-mono-num font-semibold">{formatINR(it.price * it.qty)}</td>
                            <td className="py-3 pr-3">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(it.productId)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* RIGHT: totals */}
              <aside className="space-y-4">
                <div className="bg-card border rounded-2xl shadow-soft p-5 space-y-4 lg:sticky lg:top-20">
                  <h3 className="font-display text-lg font-bold">Summary</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono-num">{formatINR(subtotal)}</span>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Discount (₹)</label>
                      <Input
                        type="number" min={0} step="0.01"
                        value={discount || ''}
                        onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="font-mono-num mt-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 flex items-end justify-between">
                    <span className="font-display font-bold text-lg">TOTAL</span>
                    <span className="font-mono-num font-bold text-2xl text-primary">{formatINR(total)}</span>
                  </div>

                  <Button onClick={generateBill} className="w-full h-12 text-base bg-gradient-primary shadow-glow">
                    <Receipt className="w-4 h-4 mr-2" /> Generate Bill
                  </Button>
                  {items.length > 0 && (
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setItems([]); setDiscount(0); clearCartDraft(); }}>
                      Clear cart
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground px-2 leading-relaxed">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Bills are kept for 24 hours and wiped on logout.
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <RecentBills bills={recent} onOpen={setActiveBill} />
          </TabsContent>

          {session.role === 'admin' && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <BillReceipt bill={activeBill} onClose={() => setActiveBill(null)} />
    </div>
  );
}

function RecentBills({ bills, onOpen }: { bills: Bill[]; onOpen: (b: Bill) => void }) {
  if (!bills.length) {
    return <div className="text-center py-20 text-muted-foreground">No bills in the last 24 hours.</div>;
  }
  return (
    <div className="bg-card border rounded-2xl shadow-soft overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left py-3 px-5">Invoice</th>
            <th className="text-left py-3 px-5">Time</th>
            <th className="text-right py-3 px-5">Items</th>
            <th className="text-right py-3 px-5">Total</th>
            <th className="py-3 px-5 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {bills.map(b => (
            <tr key={b.id} className="border-t hover:bg-secondary/30">
              <td className="py-3 px-5 font-mono-num font-semibold">{b.invoiceNo}</td>
              <td className="py-3 px-5 text-muted-foreground">{new Date(b.createdAt).toLocaleString('en-IN')}</td>
              <td className="py-3 px-5 text-right font-mono-num">{b.items.length}</td>
              <td className="py-3 px-5 text-right font-mono-num font-semibold text-primary">{formatINR(b.total)}</td>
              <td className="py-3 px-5 text-right">
                <Button size="sm" variant="outline" onClick={() => onOpen(b)}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
