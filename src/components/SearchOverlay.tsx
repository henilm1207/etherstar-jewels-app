import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, X, ArrowRight, Diamond } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SafeImage } from "@/components/SafeImage";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Live search — debounced by Convex reactivity
  const results = useQuery(
    api.products.list,
    query.trim().length >= 2 ? { search: query.trim() } : "skip",
  );

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      // Small delay so the animation has started
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleResultClick = () => {
    onClose();
  };

  const displayResults = results?.slice(0, 6) ?? [];
  const hasResults = displayResults.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[#1A202C]/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-[61] bg-[#F9F8F6] border-b border-[#E5E2DD] shadow-lg"
          >
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Search input */}
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A202C]/25" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search diamonds, rings, earrings..."
                  className="w-full bg-transparent border-b-2 border-[#E5E2DD] focus:border-[#D4AF37] pl-8 pr-12 py-3 text-lg text-[#1A202C] placeholder:text-[#1A202C]/25 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#1A202C]/30 hover:text-[#1A202C]/60 hover:bg-[#1A202C]/5 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              {/* Results dropdown */}
              {query.trim().length >= 2 && (
                <div className="mt-4">
                  {results === undefined ? (
                    <div className="flex items-center justify-center py-8 text-sm text-[#1A202C]/30">
                      <div className="h-4 w-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mr-2" />
                      Searching...
                    </div>
                  ) : hasResults ? (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A202C]/25 mb-3">
                        {displayResults.length} result{displayResults.length !== 1 ? "s" : ""} found
                      </p>
                      <div className="space-y-1">
                        {displayResults.map((product: { _id: string; name: string; images?: string[]; imageUrl: string; basePrice?: number; category: string; carat: number; metalType: string }) => {
                          const firstImage =
                            product.images?.[0] || product.imageUrl || "";
                          const displayPrice = product.basePrice ?? 0;
                          return (
                            <Link
                              key={product._id}
                              to={`/product/${product._id}`}
                              onClick={handleResultClick}
                              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group"
                            >
                              {/* Thumbnail */}
                              <div className="h-14 w-14 rounded-lg overflow-hidden bg-[#F0EDE8] shrink-0">
                                {firstImage ? (
                                  <SafeImage
                                    src={firstImage}
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                    width={56}
                                    height={56}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Diamond className="h-5 w-5 text-[#D4AF37]/30" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1A202C] truncate group-hover:text-[#D4AF37] transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-[#1A202C]/35 mt-0.5">
                                  {product.category} · {product.carat}ct ·{" "}
                                  {product.metalType}
                                </p>
                              </div>

                              {/* Price */}
                              <p className="text-sm font-medium text-[#D4AF37] shrink-0">
                                ${displayPrice.toLocaleString("en-US")}
                              </p>

                              <ArrowRight className="h-3.5 w-3.5 text-[#1A202C]/15 group-hover:text-[#D4AF37] transition-colors shrink-0" />
                            </Link>
                          );
                        })}
                      </div>

                      {/* View all results */}
                      {results.length > 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate(
                              `/shop?search=${encodeURIComponent(query.trim())}`,
                            );
                            onClose();
                          }}
                          className="mt-3 w-full text-center text-xs font-medium text-[#D4AF37] hover:text-[#D4AF37]/80 py-2 transition-colors"
                        >
                          View all {results.length} results →
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Diamond className="h-8 w-8 mx-auto text-[#1A202C]/10 mb-2" />
                      <p className="text-sm text-[#1A202C]/30">
                        No results for "{query}"
                      </p>
                      <p className="text-xs text-[#1A202C]/20 mt-1">
                        Try searching by name, category, or diamond spec
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick suggestions when empty */}
              {query.trim().length < 2 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A202C]/25 mb-3">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Solitaire Ring", "Earrings", "18k Gold", "Engagement", "Pendant"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="rounded-full border border-[#E5E2DD] bg-white px-3 py-1.5 text-xs text-[#1A202C]/50 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all"
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
