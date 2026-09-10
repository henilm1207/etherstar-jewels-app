import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router";
import { Menu, X, Search, Shield } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchOverlay } from "@/components/SearchOverlay";

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global keyboard shortcut: / or Cmd+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) ||
        ((e.metaKey || e.ctrlKey) && e.key === "k")
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E2DD] bg-[#F9F8F6]/90 backdrop-blur-xl">
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/assets/4-2.svg"
              alt="Etherstar Jewels"
              width={36}
              height={36}
              decoding="async"
              className="h-9 w-9 rounded-sm object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-[0.15em] text-[#1A202C] leading-tight">
                ETHERSTAR
              </span>
              <span className="text-[10px] font-light tracking-[0.35em] text-[#D4AF37] uppercase leading-tight">
                Jewels
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/")
                  ? "text-[#D4AF37] bg-[#D4AF37]/8"
                  : "text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/shop")
                  ? "text-[#D4AF37] bg-[#D4AF37]/8"
                  : "text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
              }`}
            >
              Shop
            </Link>
            <Link
              to="/shop?category=Rings"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
            >
              Rings
            </Link>
            <Link
              to="/shop?category=Earrings"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
            >
              Earrings
            </Link>
            <Link
              to="/shop?category=Pendants"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
            >
              Pendants
            </Link>
            <Link
              to="/shop?category=Bracelets"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
            >
              Bracelets
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-[#1A202C]/40 hover:text-[#1A202C] hover:bg-[#1A202C]/5 transition-all"
              aria-label="Search products"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Custom Design */}
            <Link
              to="/custom-design"
              className="hidden md:inline-flex items-center text-sm text-[#2C2A29]/50 hover:text-[#D4AF37] transition-all duration-300 relative group"
            >
              Custom Design
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37]/10 px-3 py-1.5 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-all"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-lg bg-[#1A202C]/5 px-3 py-1.5 text-sm text-[#1A202C]/70 hover:bg-[#1A202C]/10 transition-all"
                >
                  <div className="h-5 w-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-white">
                    {user?.name?.[0] || user?.email?.[0] || "U"}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {user?.name || user?.email || "Account"}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex items-center rounded-lg bg-[#1A202C] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A202C]/85 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#1A202C]/60 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-[#E5E2DD]"
          >
            <div className="px-4 py-4 space-y-1 bg-[#F9F8F6]/95">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
              <Link
                to="/"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Shop All
              </Link>
              <Link
                to="/shop?category=Rings"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Rings
              </Link>
              <Link
                to="/shop?category=Earrings"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Earrings
              </Link>
              <Link
                to="/shop?category=Pendants"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Pendants
              </Link>
              <Link
                to="/shop?category=Bracelets"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A202C]/70 hover:text-[#1A202C] hover:bg-[#1A202C]/5"
                onClick={() => setMobileOpen(false)}
              >
                Bracelets
              </Link>
              <Link
                to="/custom-design"
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"
                onClick={() => setMobileOpen(false)}
              >
                Custom Design
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 flex items-center gap-1.5"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Portal
                </Link>
              )}
              <div className="pt-2 border-t border-[#E5E2DD]">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/8"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Account
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1A202C] hover:bg-[#1A202C]/85 transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
