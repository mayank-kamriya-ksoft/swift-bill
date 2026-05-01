import { useEffect, useState } from 'react';
import { adminSupabase } from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/lib/bills';
import type { Product } from './ProductSearch';

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [loading, setLoading] = useState(false); // ✅ NEW
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalProducts: 0, lowStockCount: 0 });

  // 🔥 Debounce filter
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 400);
    return () => clearTimeout(timer);
  }, [filter]);

  // 🔥 Load Stats ONLY ONCE
  useEffect(() => {
    const loadStats = async () => {
      const { data } = await (adminSupabase as any).rpc('get_product_stats');
      if (data?.[0]) {
        setStats({
          totalProducts: Number(data[0].total_products || 0),
          lowStockCount: Number(data[0].low_stock_count || 0),
        });
      }
    };
    loadStats();
  }, []);

  // 🔥 Load Products (MAIN)
  const loadProducts = async () => {
    setLoading(true);

    const searchTerm = debouncedFilter.trim();
    const offset = (page - 1) * PAGE_SIZE;

    const { data, error } = await (adminSupabase as any).rpc('search_products', {
      search_term: searchTerm,
      page_limit: PAGE_SIZE,
      page_offset: offset,
    });

    if (error) toast.error(error.message);
    else setProducts(data || []);

    setLoading(false);
  };

  // 🔥 Load Count (ONLY when filter changes)
  const loadCount = async () => {
    const searchTerm = debouncedFilter.trim();

    const { data, error } = await (adminSupabase as any).rpc('count_products', {
      search_term: searchTerm,
    });

    if (!error) setTotal(Number(data || 0));
  };

  // 🔥 Effects
  useEffect(() => {
    loadProducts();
  }, [page, debouncedFilter]);

  useEffect(() => {
    loadCount();
    setPage(1); // reset page on filter change
  }, [debouncedFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ---------------- CRUD ----------------

  const startNew = () => {
    setEditing({ id: '', name: '', unit: 'pcs', price: 0, stock: 0 });
    setOpen(true);
  };

  const startEdit = (p: Product) => {
    setEditing({ ...p });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error('Name required');

    if (editing.id) {
      await adminSupabase.from('products').update(editing).eq('id', editing.id);
      toast.success('Updated');
    } else {
      await adminSupabase.from('products').insert(editing);
      toast.success('Added');
    }

    setOpen(false);
    setEditing(null);
    loadProducts();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;

    await adminSupabase.from('products').delete().eq('id', p.id);
    toast.success('Deleted');
    loadProducts();
  };

  // ---------------- UI ----------------

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            {stats.totalProducts} products · {stats.lowStockCount} low stock
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="sm:w-56"
          />
          <Button onClick={startNew}>
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* 🔥 LOADER */}
      {loading && (
        <div className="text-center py-6 text-muted-foreground">
          <div className="flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading products...
          </div>
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">Stock</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 flex items-center gap-3">
                    <Package className="w-4 h-4" />
                    {p.name}
                  </td>

                  <td className="p-3 text-right">{formatINR(p.price)}</td>

                  <td className="p-3 text-right">
                    {p.stock <= 5 ? (
                      <span className="text-warning flex items-center gap-1 justify-end">
                        <AlertTriangle className="w-3 h-3" /> {p.stock}
                      </span>
                    ) : (
                      p.stock
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-between">
        <span className="text-sm">
          Page {page} / {totalPages}
        </span>

        <div className="flex gap-2">
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit' : 'New'} Product</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-3">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Name"
              />
              <Input
                type="number"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
                placeholder="Price"
              />
              <Input
                type="number"
                value={editing.stock}
                onChange={(e) =>
                  setEditing({ ...editing, stock: Number(e.target.value) })
                }
                placeholder="Stock"
              />

              <Button onClick={save} className="w-full">
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}