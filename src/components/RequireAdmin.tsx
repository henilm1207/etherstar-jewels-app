import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";

/**
 * Route guard that only allows users with the "admin" role to access
 * the wrapped content. Non-admin users see an authorization error page.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <ShieldAlert className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
            Authentication Required
          </h1>
          <p className="mt-3 text-sm text-[#1A202C]/50">
            Please sign in to access the admin portal.
          </p>
          <Link
            to="/auth?returnTo=/admin"
            className="mt-6 inline-flex items-center rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-[#1A202C]/50">
            You don't have administrator privileges to access this area.
            Only accounts with the admin role can manage inventory and orders.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-xl border border-[#E5E2DD] bg-white px-6 py-3 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] transition-all"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
