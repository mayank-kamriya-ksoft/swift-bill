import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/auth';
import { toast } from 'sonner';
import { PaintBucket, KeyRound } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Schin Paints — Sign In'; }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const session = login(pin.trim());
    if (!session) {
      toast.error('Invalid PIN');
      setPin('');
      return;
    }
    toast.success(`Signed in as ${session.role}`);
    navigate('/');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4">
            <PaintBucket className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Schin Paints</h1>
          <p className="text-muted-foreground mt-1 text-sm">CSN, MH · Billing Terminal</p>
        </div>

        <form onSubmit={submit} className="bg-card border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Enter PIN
            </Label>
            <Input
              id="pin"
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="font-mono-num text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              Staff PIN: <span className="font-mono-num">1234</span> · Admin PIN: <span className="font-mono-num">schin-admin-2026</span>
            </p>
          </div>
          <Button type="submit" variant="default" className="w-full h-12 text-base bg-gradient-primary hover:opacity-95 shadow-glow">
            Sign In
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Bills auto-clear after 24h or on logout.
        </p>
      </div>
    </main>
  );
}
