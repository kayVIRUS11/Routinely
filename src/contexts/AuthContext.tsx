"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { migrateGuestData } from "@/lib/sync";

// ─── Constants ────────────────────────────────────────────────────────────────

const GUEST_FLAG_KEY = "routinely_is_guest";
const GUEST_USER_ID_KEY = "routinely_guest_user_id";
const USER_ID_KEY = "routinely_user_id";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Guest session helpers ────────────────────────────────────────────────────

function initGuestSession(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(GUEST_FLAG_KEY)) return; // already initialised
  const guestId = crypto.randomUUID();
  localStorage.setItem(GUEST_FLAG_KEY, "true");
  localStorage.setItem(GUEST_USER_ID_KEY, guestId);
}

function clearGuestSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_FLAG_KEY);
  localStorage.removeItem(GUEST_USER_ID_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync real user_id into localStorage so the sync engine can read it
  const syncUserId = useCallback((u: User | null) => {
    if (typeof window === "undefined") return;
    if (u) {
      localStorage.setItem(USER_ID_KEY, u.id);
    } else {
      localStorage.removeItem(USER_ID_KEY);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setUser(s.user);
        setIsGuest(false);
        syncUserId(s.user);
      } else {
        // No session — start or resume a guest session
        initGuestSession();
        setIsGuest(true);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (s) {
          setSession(s);
          setUser(s.user);
          setIsGuest(false);
          syncUserId(s.user);

          // Migrate guest data when a new account is confirmed
          if (event === "SIGNED_IN") {
            const guestId = localStorage.getItem(GUEST_USER_ID_KEY);
            if (guestId) {
              await migrateGuestData(s.user.id);
              clearGuestSession();
            }
          }
        } else {
          setSession(null);
          setUser(null);
          syncUserId(null);
          if (event === "SIGNED_OUT") {
            initGuestSession();
            setIsGuest(true);
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, isGuest, isLoading, signIn, signUp, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}
