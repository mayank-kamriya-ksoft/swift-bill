// Simple PIN-based session, stored in sessionStorage so closing the tab logs out.
// Admin PIN must match the server-side RLS check in `is_admin_request()`.
export const STAFF_PIN = '1234';
export const ADMIN_PIN = 'schin-admin-2026';

const SESSION_KEY = 'schin.session';
const BILLS_KEY = 'schin.bills';
const CART_KEY = 'schin.cart';
const INVOICE_SEQ_KEY = 'schin.invoiceSeq';

export type SessionRole = 'staff' | 'admin';
export interface Session { role: SessionRole; loggedInAt: number; }

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch { return null; }
}

export function login(pin: string): Session | null {
  let role: SessionRole | null = null;
  if (pin === ADMIN_PIN) role = 'admin';
  else if (pin === STAFF_PIN) role = 'staff';
  if (!role) return null;
  const session: Session = { role, loggedInAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  // Wipe ALL billing data on logout (per requirement)
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(BILLS_KEY);
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(INVOICE_SEQ_KEY);
}

export function getAdminPin(): string | null {
  const s = getSession();
  return s?.role === 'admin' ? ADMIN_PIN : null;
}
