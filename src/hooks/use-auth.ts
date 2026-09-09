import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useEffect, useRef } from "react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();
  const ensureUserRole = useMutation(api.users.ensureUserRole);
  const roleChecked = useRef(false);

  // Auto-assign/verify role on every authenticated session.
  // Runs after every login — ensures admin status is always current.
  useEffect(() => {
    if (isAuthenticated && user && !roleChecked.current) {
      roleChecked.current = true;
      ensureUserRole().catch(console.error);
    }
  }, [isAuthenticated, user, ensureUserRole]);

  // Reset the flag when user signs out so next login triggers a fresh check
  useEffect(() => {
    if (!isAuthenticated) {
      roleChecked.current = false;
    }
  }, [isAuthenticated]);

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}
