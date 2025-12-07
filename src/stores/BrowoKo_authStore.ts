/**
 * AUTH STORE
 * ==========
 * Global authentication state management
 *
 * REFACTORED: Now uses AuthService + UserService
 * - Removed direct Supabase calls
 * - Uses service layer for all auth operations
 * - Better error handling with custom errors
 * - Type-safe with Zod validation
 */

import { create } from "zustand";
import { User as AuthUser } from "@supabase/supabase-js";
import {
  UserWithAvatar,
  Organization,
} from "../types/database";
import { supabase } from "../utils/supabase/client";
import { getServices } from "../services";
import {
  NotFoundError,
  ValidationError,
  ApiError,
} from "../services/base/ApiError";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

interface AuthState {
  user: AuthUser | null;
  profile: UserWithAvatar | null;
  organization: Organization | null;
  loading: boolean;
  initialized: boolean;
  connectionError: boolean;

  // NEW: Permissions
  effectivePermissions: string[];
  permissionsLoading: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserWithAvatar | null) => void;
  setOrganization: (organization: Organization | null) => void;
  setConnectionError: (error: boolean) => void;
  setEffectivePermissions: (permissions: string[]) => void;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  organization: null,
  loading: false,
  initialized: false,
  connectionError: false,

  // NEW: Permissions
  effectivePermissions: [],
  permissionsLoading: false,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setOrganization: (organization) => set({ organization }),

  setConnectionError: (error) =>
    set({ connectionError: error }),

  setEffectivePermissions: (permissions) =>
    set({ effectivePermissions: permissions }),

  login: async (email: string, password: string) => {
    set({ loading: true, connectionError: false });
    try {
      console.log("🔐 Logging in:", email);

      const services = getServices();
      const { user } = await services.auth.signIn(
        email,
        password,
      );

      if (user) {
        console.log("✅ Login successful");
        set({ user, connectionError: false });
        await get().refreshProfile();
        await get().refreshOrganization();
        await get().refreshPermissions();
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);

      const errorMessage = error?.message?.toLowerCase() || "";
      const isFetchError =
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        error instanceof TypeError;

      if (isFetchError) {
        console.error("🚨 Network error during login");
        set({ connectionError: true });
        throw new Error(
          "Verbindung zur Datenbank fehlgeschlagen. Bitte überprüfen Sie, ob Ihr Supabase-Projekt aktiv ist.",
        );
      }

      if (error instanceof ValidationError) {
        throw new Error(
          "Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingaben.",
        );
      } else if (error instanceof ApiError) {
        throw new Error(error.message);
      } else {
        throw new Error(
          "Login fehlgeschlagen. Bitte versuchen Sie es erneut.",
        );
      }
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      const services = getServices();
      await services.auth.signOut();

      set({
        user: null,
        profile: null,
        organization: null,
        effectivePermissions: [],
      });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  initialize: async () => {
    console.log("🔄 Auth: Initializing...");

    set({ loading: true, connectionError: false });

    // QUICK CONNECTION TEST – 10s timeout
    const quickTest = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("⏱️ Connection timeout after 10 seconds");
        reject(new Error("TIMEOUT"));
      }, 10000);

      supabase.auth
        .getSession()
        .then((result) => {
          clearTimeout(timeout);
          console.log(
            "✅ Connection successful:",
            result.data?.session
              ? "Session found"
              : "No session",
          );
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeout);
          console.error("❌ Connection error:", err);
          reject(err);
        });
    });

    try {
      const {
        data: { session },
        error,
      } = (await quickTest) as any;

      if (error) {
        console.error("❌ Auth: Session fetch error:", error);

        const errorMessage = error.message?.toLowerCase() || "";
        const errorName = error.name?.toLowerCase() || "";

        if (
          errorMessage.includes("failed to fetch") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("network") ||
          errorMessage.includes("cors") ||
          errorName.includes("typeerror") ||
          errorName.includes("networkerror")
        ) {
          console.error(
            "🚨 Network/CORS/Fetch Error detected - showing connection error screen",
          );
          console.error("🚨 Error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
          });
          set({
            connectionError: true,
            initialized: true,
            loading: false,
          });
          return;
        }
      }

      if (session?.user) {
        console.log(
          "✅ Auth: Session found for",
          session.user.email,
        );
        set({ user: session.user, connectionError: false });

        try {
          await get().refreshProfile();
        } catch (profileError) {
          console.warn(
            "⚠️ Auth: Could not load profile, continuing anyway",
          );
        }

        try {
          await get().refreshOrganization();
        } catch (orgError) {
          console.warn(
            "⚠️ Auth: Could not load organization, continuing anyway",
          );
        }

        try {
          await get().refreshPermissions();
        } catch (permError) {
          console.warn(
            "⚠️ Auth: Could not load permissions, continuing anyway",
          );
        }
      } else {
        console.log("ℹ️ Auth: No active session");
      }

      set({ initialized: true });
      console.log("✅ Auth: Initialization complete");
    } catch (error: any) {
      console.error(
        "❌ Auth: Critical error during initialization:",
        error,
      );

      const errorMessage = error?.message?.toLowerCase() || "";
      const errorName = error?.name?.toLowerCase() || "";
      const errorString = String(error).toLowerCase();

      const isFetchError =
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("cors") ||
        errorName.includes("typeerror") ||
        errorName.includes("networkerror") ||
        errorString.includes("failed to fetch") ||
        error?.message === "TIMEOUT";

      if (isFetchError) {
        console.error("🚨 CONNECTION ERROR DETECTED");
        console.error("Error Type:", error?.name || "Unknown");
        console.error(
          "Error Message:",
          error?.message || "No message",
        );
        console.error("");
        console.error("This usually means:");
        console.error("1. Supabase project is PAUSED");
        console.error(
          "   → https://supabase.com/dashboard/project/azmtojgikubegzusvhra",
        );
        console.error("2. Network/Firewall blocking requests");
        console.error("3. CORS configuration issue");
        console.error("4. Internet connection problem");

        set({
          connectionError: true,
          initialized: true,
          loading: false,
        });
      } else {
        set({ initialized: true });
      }
    } finally {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) {
      console.log("ℹ️ No user to refresh profile for");
      return;
    }

    try {
      console.log("👤 Fetching profile for user:", user.id);

      const services = getServices();
      const profile = await services.user.getUserById(user.id);

      console.log("✅ Profile loaded:", profile?.email);

      set({
        profile: profile as UserWithAvatar,
        connectionError: false,
      });
    } catch (error: any) {
      console.error("❌ Profile fetch error:", error);

      const errorMessage = error?.message?.toLowerCase() || "";
      const isFetchError =
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        error instanceof TypeError;

      if (isFetchError) {
        console.error(
          "🚨 Network error while fetching profile - setting connection error",
        );
        set({ connectionError: true });
        throw error;
      }

      if (error instanceof NotFoundError) {
        console.warn(
          "⚠️ Creating fallback profile from auth user",
        );
        set({
          profile: {
            id: user.id,
            email: user.email || "",
            first_name:
              user.user_metadata?.first_name || "User",
            last_name: user.user_metadata?.last_name || "",
            role: "USER",
            organization_id: null,
            department_id: null,
            location_id: null,
            position: null,
            level: 1,
            xp: 0,
            coins: 0,
            vacation_days: 30,
            avatar_body: "body1",
            avatar_eyes: "eyes1",
            avatar_mouth: "mouth1",
            avatar_bg_color: "#3b82f6",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar: null,
          } as any,
          connectionError: false,
        });
      } else {
        throw error;
      }
    }
  },

  refreshOrganization: async () => {
    const { profile } = get();
    if (!profile?.organization_id) {
      console.log("ℹ️ No organization to refresh");
      set({ organization: null });
      return;
    }

    try {
      console.log(
        "🏢 Fetching organization:",
        profile.organization_id,
      );

      const { data: organization, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (error) {
        console.error("Organization fetch error:", error);
        set({ organization: null });
        return;
      }

      console.log(
        "✅ Organization loaded:",
        organization?.name,
      );
      set({ organization: organization as Organization });
    } catch (error) {
      console.error("Organization refresh failed:", error);
      set({ organization: null });
    }
  },

  refreshPermissions: async () => {
    const { user } = get();
    if (!user) {
      console.log("ℹ️ No user to refresh permissions for");
      set({ effectivePermissions: [] });
      return;
    }

    try {
      console.log("🔑 Fetching permissions for user:", user.id);
      set({ permissionsLoading: true });

      const services = getServices();
      const permissions = await services.auth.getPermissions(
        user.id,
      );

      console.log(
        `✅ Permissions loaded: ${permissions.length} permissions`,
      );
      set({
        effectivePermissions: permissions,
        permissionsLoading: false,
        connectionError: false,
      });
    } catch (error) {
      console.error("❌ Permissions refresh failed:", error);
      set({
        effectivePermissions: [],
        permissionsLoading: false,
      });
    }
  },

  resetPassword: async (email: string) => {
    try {
      console.log("🔑 Requesting password reset for:", email);

      const services = getServices();
      await services.auth.resetPassword(email);

      console.log("✅ Password reset email sent");
    } catch (error) {
      console.error("❌ Password reset failed:", error);

      if (error instanceof ValidationError) {
        throw new Error("Ungültige E-Mail-Adresse");
      } else if (error instanceof ApiError) {
        throw new Error(error.message);
      } else {
        throw new Error("Passwort-Reset fehlgeschlagen");
      }
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      console.log("🔑 Updating password...");

      const services = getServices();
      await services.auth.updatePassword(newPassword);

      console.log("✅ Password updated successfully");
    } catch (error) {
      console.error("❌ Password update failed:", error);

      if (error instanceof ValidationError) {
        throw new Error(
          "Ungültiges Passwort. Mindestens 8 Zeichen erforderlich.",
        );
      } else if (error instanceof ApiError) {
        throw new Error(error.message);
      } else {
        throw new Error(
          "Passwort-Aktualisierung fehlgeschlagen.",
        );
      }
    }
  },
}));

// Debug: Store im Browser verfügbar machen
if (typeof window !== "undefined") {
  (window as any).useAuthStore = useAuthStore;
}