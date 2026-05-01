import { useEffect, useState } from 'react';
import { adminSupabase } from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/lib/bills';
import type { Product } from './ProductSearch';

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalProducts: 0, lowStockCount: 0 });
  const [debouncedFilter, setDebouncedFilter] = useState('');

  const load = async () => {
    const searchTerm = debouncedFilter.trim();
    const offset = (page - 1) * PAGE_SIZE;
    const [productsResult, countResult, statsResult] = await Promise.all([
      (adminSupabase as any).rpc('search_products', { search_term: searchTerm, page_limit: PAGE_SIZE, page_offset: offset }),
      (adminSupabase as any).rpc('count_products', { search_term: searchTerm }),
      (adminSupabase as any).rpc('get_product_stats'),
    ]);
    const { data, error } = productsResult;
    if (error) toast.error(error.message);
    else setProducts((data || []) as Product[]);
    if (countResult.error) toast.error(countResult.error.message);
    else setTotal(Number(countResult.data || 0));
    if (!statsResult.error && statsResult.data?.[0]) {
      setStats({
        totalProducts: Number(statsResult.data[0].total_products || 0),
        lowStockCount: Number(statsResult.data[0].low_stock_count || 0),
      });
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilter(filter), 180);
    return () => window.clearTimeout(timer);
  }, [filter]);
  useEffect(() => { load(); }, [page, debouncedFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const startNew = () => { setEditing({ id: '', name: '', unit: 'pcs', price: 0, stock: 0 }); setOpen(true); };
  const startEdit = (p: Product) => { setEditing({ ...p }); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Name required'); return; }
    if (editing.id) {
      const { error } = await adminSupabase
        .from('products')
        .update({ name: editing.name, unit: editing.unit, price: editing.price, stock: editing.stock })
        .eq('id', editing.id);
      if (error) return toast.error(error.message);
      toast.success('Product updated');
    } else {
      const { error } = await adminSupabase
        .from('products')
        .insert({ name: editing.name, unit: editing.unit, price: editing.price, stock: editing.stock });
      if (error) return toast.error(error.message);
      toast.success('Product added');
    }
    setOpen(false); setEditing(null); load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await adminSupabase.from('products').delete().eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold">Inventory</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{stats.totalProducts} products · {stats.lowStockCount} low stock</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" className="flex-1 sm:flex-none sm:w-56" />
          <Button onClick={startNew} className="bg-gradient-primary shrink-0"><Plus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Add Product</span></Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-right py-3 px-4">Stock</th>
              <th className="py-3 px-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t hover:bg-secondary/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Package className="w-4 h-4" /></div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">per {p.unit}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono-num whitespace-nowrap">{formatINR(p.price)}</td>
                <td className="py-3 px-4 text-right font-mono-num">
                  {p.stock <= 5 ? (
                    <span className="inline-flex items-center gap-1 text-warning font-semibold"><AlertTriangle className="w-3 h-3" />{p.stock}</span>
                  ) : p.stock}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No products</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap px-1">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <span className="text-xs px-2 tabular-nums">Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Product' : 'New Product'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Unit</Label><Input value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} /></div>
                <div><Label>Price (₹)</Label><Input type="number" min={0} step="0.01" value={editing.price} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Stock</Label><Input type="number" min={0} value={editing.stock} onChange={e => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <Button onClick={save} className="w-full bg-gradient-primary">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
