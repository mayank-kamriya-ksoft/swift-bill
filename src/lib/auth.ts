// PIN-based session, persisted in localStorage with a 24h TTL so refresh / tab reopen keep the user signed in.
// Logout (or expiry) wipes ALL billing data per requirement.
export const STAFF_PIN = '1234';
export const ADMIN_PIN = 'schin-admin-2026';

const SESSION_KEY = 'schin.session';
const BILLS_KEY = 'schin.bills';
const CART_KEY = 'schin.cart';
const INVOICE_SEQ_KEY = 'schin.invoiceSeq';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type SessionRole = 'staff' | 'admin';
export interface Session { role: SessionRole; loggedInAt: number; }

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.loggedInAt || Date.now() - s.loggedInAt > SESSION_TTL_MS) {
      logout();
      return null;
    }
    return s;
  } catch { return null; }
}

export function login(pin: string): Session | null {
  let role: SessionRole | null = null;
  if (pin === ADMIN_PIN) role = 'admin';
  else if (pin === STAFF_PIN) role = 'staff';
  if (!role) return null;
  const session: Session = { role, loggedInAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  // Wipe ALL billing data on logout (per requirement)
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(BILLS_KEY);
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(INVOICE_SEQ_KEY);
}

export function getAdminPin(): string | null {
  const s = getSession();
  return s?.role === 'admin' ? ADMIN_PIN : null;
}
