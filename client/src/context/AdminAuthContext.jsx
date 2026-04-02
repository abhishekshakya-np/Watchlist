import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminSession, adminLogout as apiLogout } from '../api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState({
    loading: true,
    ok: false,
    configured: false,
  });

  const refresh = useCallback(async () => {
    try {
      const s = await getAdminSession();
      setSession({ loading: false, ok: s.ok, configured: s.configured });
    } catch {
      setSession({ loading: false, ok: false, configured: true });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    await refresh();
  }, [refresh]);

  const canMutate = !session.loading && (!session.configured || session.ok);

  const value = useMemo(
    () => ({
      loading: session.loading,
      ok: session.ok,
      configured: session.configured,
      refresh,
      logout,
      canMutate,
    }),
    [session.loading, session.ok, session.configured, refresh, logout, canMutate],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
