import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { formatINR } from '@/lib/bills';

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
}

interface Props {
  onSelect: (p: Product) => void;
  autoFocus?: boolean;
}

export default function ProductSearch({ onSelect, autoFocus }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }
    let ignore = false;
    const timer = window.setTimeout(async () => {
      const { data } = await (supabase as any).rpc('search_products', {
        search_term: q,
        page_limit: 8,
        page_offset: 0,
      });
      if (!ignore) setResults((data || []) as Product[]);
    }, 180);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => { setHighlight(0); }, [query]);

  const pick = (p: Product) => {
    onSelect(p);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[highlight]); }
    else if (e.key === 'Escape') { setQuery(''); }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search product to bill… (↑↓ to navigate, ↵ to add)"
          className="pl-10 h-12 text-base"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-2 bg-popover border rounded-xl shadow-pop overflow-hidden">
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(p)}
              className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${i === highlight ? 'bg-secondary' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Stock: <span className={p.stock <= 5 ? 'text-warning font-semibold' : ''}>{p.stock} {p.unit}</span>
                  </div>
                </div>
              </div>
              <div className="font-mono-num font-semibold text-primary shrink-0">{formatINR(p.price)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
