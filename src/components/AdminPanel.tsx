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

  const load = async () => {
    const { data, error } = await adminSupabase.from('products').select('*').order('name');
    if (error) toast.error(error.message);
    else setProducts((data || []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">Inventory</h2>
          <p className="text-sm text-muted-foreground">{products.length} products · {products.filter(p => p.stock <= 5).length} low stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" className="w-56" />
          <Button onClick={startNew} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-right py-3 px-4">Stock</th>
              <th className="py-3 px-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t hover:bg-secondary/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Package className="w-4 h-4" /></div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">per {p.unit}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono-num">{formatINR(p.price)}</td>
                <td className="py-3 px-4 text-right font-mono-num">
                  {p.stock <= 5 ? (
                    <span className="inline-flex items-center gap-1 text-warning font-semibold"><AlertTriangle className="w-3 h-3" />{p.stock}</span>
                  ) : p.stock}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No products</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
