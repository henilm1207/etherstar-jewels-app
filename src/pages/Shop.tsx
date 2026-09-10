import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Diamond,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";
import { SafeImage } from "@/components/SafeImage";

/* ── filter option lists ─────────────────────────────────────────────── */
const METAL_TYPES = ["18k Gold", "14k Gold", "10k Gold", "Gold-Plated Silver"];
const CUTS = ["Ideal", "Excellent", "Very Good", "Good"];
const COLORS = ["D", "E", "F", "G", "H", "I"];
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];
const CARAT_RANGES = [
  { label: "Under 1ct", min: 0, max: 1 },
  { label: "1 — 2ct", min: 1, max: 2 },
  { label: "2 — 3ct", min: 2, max: 3 },
  { label: "3ct+", min: 3, max: 100 },
];

/* ── product interface ───────────────────────────────────────────────── */
interface MetalOption {
  metalType: string;
  price?: number;
  priceAdjustment?: number;
}

interface Product {
  _id: Id<"products">;
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  metalType: string;
  size: string;
  carat: number;
  cut: string;
  color: string;
  clarity: string;
  imageUrl: string;
  images: string[];
  metalOptions: MetalOption[];
  certificateUrl?: string;
  category: string;
  featured: boolean;
}

/* ── product card — editorial light style ────────────────────────────── */
function ShopProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [hoveredImage, setHoveredImage] = useState(0);
  const images = product?.images ?? [];
  const displayImage = images[hoveredImage] || product.imageUrl || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link to={`/product/${product._id}`} className="group block">
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[#F0EDE8] mb-5"
          onMouseEnter={() => setHoveredImage(Math.min(1, images.length - 1))}
          onMouseLeave={() => setHoveredImage(0)}
        >
          <SafeImage
            src={displayImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={750}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[#1A202C]/0 group-hover:bg-[#1A202C]/5 transition-colors duration-500" />
          {product.stock > 0 && product.stock <= 5 && (
            <div className="absolute top-4 right-4 text-[10px] font-medium tracking-widest uppercase text-[#D4AF37]">
              {product.stock} left
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {images.slice(0, 4).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === hoveredImage ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="px-1">
          <h3 className="text-sm font-medium text-[#1A202C] tracking-wide group-hover:text-[#D4AF37] transition-colors duration-300">
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-[#1A202C]/40 tracking-wider uppercase">
            {product.carat}ct · {product.cut} · {product.color} · {product.clarity}
          </p>
          <p className="mt-1.5 text-[10px] text-[#D4AF37]/70 tracking-wide">
            {(() => {
              const allMetals = (product.metalOptions ?? [])
                .filter((mv) => (mv.price ?? 0) > 0)
                .map((mv) => mv.metalType.toLowerCase());
              const hasGold = allMetals.some((m) => m.includes("gold"));
              const hasSilver = allMetals.some((m) => m.includes("silver"));
              const hasPlatinum = allMetals.some((m) => m.includes("platinum"));
              const parts = [];
              if (hasGold) parts.push("Gold");
              if (hasSilver) parts.push("Silver");
              if (hasPlatinum) parts.push("Platinum");
              return parts.join(" & ") || "Gold";
            })()}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── collapsible filter section ──────────────────────────────────────── */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E5E2DD] pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1A202C]/40">
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#1A202C]/25 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── checkbox group ──────────────────────────────────────────────────── */
function CheckboxGroup({
  options,
  selected,
  onChange,
  formatLabel,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string) => void;
  formatLabel?: (val: string) => string;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-3 cursor-pointer group/item"
        >
          <div
            className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center transition-all duration-200 ${
              selected.includes(opt)
                ? "bg-[#D4AF37] border-[#D4AF37]"
                : "border-[#1A202C]/20 group-hover/item:border-[#1A202C]/40"
            }`}
            onClick={() => onChange(opt)}
          >
            {selected.includes(opt) && (
              <svg
                className="h-2.5 w-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span
            className="text-[13px] text-[#1A202C]/50 group-hover/item:text-[#1A202C]/70 transition-colors duration-200"
            onClick={() => onChange(opt)}
          >
            {formatLabel ? formatLabel(opt) : opt}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ── main shop page ──────────────────────────────────────────────────── */
export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedMetalTypes, setSelectedMetalTypes] = useState<string[]>([]);
  const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedClarities, setSelectedClarities] = useState<string[]>([]);
  const [selectedCaratRange, setSelectedCaratRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  // Sync category from URL search params whenever they change
  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setSelectedCategory(cat);
  }, [searchParams]);

  const products = useQuery(api.products.list, {});
  const categories = useQuery(api.products.categories);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = products.filter((p: { metalType: string; cut: string; color: string; clarity: string; carat: number; category: string; name: string; description: string; basePrice?: number; featured?: boolean }) => {
      if (
        selectedMetalTypes.length > 0 &&
        !selectedMetalTypes.includes(p.metalType)
      )
        return false;
      if (selectedCuts.length > 0 && !selectedCuts.includes(p.cut))
        return false;
      if (selectedColors.length > 0 && !selectedColors.includes(p.color))
        return false;
      if (
        selectedClarities.length > 0 &&
        !selectedClarities.includes(p.clarity)
      )
        return false;
      if (selectedCaratRange) {
        if (
          p.carat < selectedCaratRange.min ||
          p.carat >= selectedCaratRange.max
        )
          return false;
      }
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    switch (sortBy) {
      case "price-low":
        result.sort((a: { basePrice?: number }, b: { basePrice?: number }) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
        break;
      case "price-high":
        result.sort((a: { basePrice?: number }, b: { basePrice?: number }) => (b.basePrice ?? 0) - (a.basePrice ?? 0));
        break;
      case "carat-low":
        result.sort((a: { carat: number }, b: { carat: number }) => a.carat - b.carat);
        break;
      case "carat-high":
        result.sort((a: { carat: number }, b: { carat: number }) => b.carat - a.carat);
        break;
      case "featured":
      default:
        result.sort((a: { featured?: boolean }, b: { featured?: boolean }) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [
    products,
    selectedMetalTypes,
    selectedCuts,
    selectedColors,
    selectedClarities,
    selectedCaratRange,
    selectedCategory,
    search,
    sortBy,
  ]);

  const activeFilterCount =
    selectedMetalTypes.length +
    selectedCuts.length +
    selectedColors.length +
    selectedClarities.length +
    (selectedCaratRange ? 1 : 0) +
    (selectedCategory ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedMetalTypes([]);
    setSelectedCuts([]);
    setSelectedColors([]);
    setSelectedClarities([]);
    setSelectedCaratRange(null);
    setSelectedCategory("");
    setSearch("");
    setSearchParams({});
  };

  const toggleFilter = (
    current: string[],
    setter: (v: string[]) => void,
    value: string,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  const FilterSidebar = ({ className = "" }: { className?: string }) => (
    <div className={className}>
      <div className="relative mb-8">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A202C]/25" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-[#E5E2DD] pl-7 pr-0 py-2.5 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
        />
      </div>

      <FilterSection title="Category">
        <div className="space-y-2.5">
          <button
            onClick={() => {
              setSelectedCategory("");
              setSearchParams({});
            }}
            className={`flex items-center justify-between text-[13px] transition-colors duration-200 ${
              !selectedCategory
                ? "text-[#D4AF37]"
                : "text-[#1A202C]/50 hover:text-[#1A202C]/70"
            }`}
          >
            <span>All Jewelry</span>
            <span className="text-[10px] tabular-nums">{products?.length ?? 0}</span>
          </button>
          {categories?.map((cat: string) => {
            const count = products?.filter((p: { category: string }) => p.category === cat).length ?? 0;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat ? "" : cat);
                  if (selectedCategory === cat) {
                    setSearchParams({});
                  } else {
                    setSearchParams({ category: cat });
                  }
                }}
                className={`flex items-center justify-between text-[13px] transition-colors duration-200 ${
                  selectedCategory === cat
                    ? "text-[#D4AF37]"
                    : "text-[#1A202C]/50 hover:text-[#1A202C]/70"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] tabular-nums opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Metal Type">
        <CheckboxGroup
          options={METAL_TYPES}
          selected={selectedMetalTypes}
          onChange={(v) =>
            toggleFilter(selectedMetalTypes, setSelectedMetalTypes, v)
          }
        />
      </FilterSection>

      <FilterSection title="Carat Weight">
        <div className="space-y-2.5">
          {CARAT_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() =>
                setSelectedCaratRange(
                  selectedCaratRange?.min === range.min ? null : range,
                )
              }
              className={`block text-[13px] transition-colors duration-200 ${
                selectedCaratRange?.min === range.min
                  ? "text-[#D4AF37]"
                  : "text-[#1A202C]/50 hover:text-[#1A202C]/70"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Cut">
        <CheckboxGroup
          options={CUTS}
          selected={selectedCuts}
          onChange={(v) => toggleFilter(selectedCuts, setSelectedCuts, v)}
        />
      </FilterSection>

      <FilterSection title="Color">
        <CheckboxGroup
          options={COLORS}
          selected={selectedColors}
          onChange={(v) => toggleFilter(selectedColors, setSelectedColors, v)}
          formatLabel={(v) =>
            `${v} — ${v === "D" ? "Colorless" : v === "E" || v === "F" ? "Near Colorless" : "Very Light"}`
          }
        />
      </FilterSection>

      <FilterSection title="Clarity">
        <CheckboxGroup
          options={CLARITIES}
          selected={selectedClarities}
          onChange={(v) =>
            toggleFilter(selectedClarities, setSelectedClarities, v)
          }
        />
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      {/* Page Header */}
      <div className="border-b border-[#E5E2DD]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-light tracking-[0.08em] text-[#1A202C]">
              {selectedCategory || "The Collection"}
            </h1>
            <p className="mt-3 text-[13px] text-[#1A202C]/30 tracking-[0.12em] uppercase">
              {filteredProducts.length} piece
              {filteredProducts.length !== 1 ? "s" : ""} · Lab-grown diamonds
              · IGI certified
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16 py-12">
        <div className="flex gap-16">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort + mobile filter bar */}
            <div className="flex items-center justify-between mb-10">
              <button
                className="lg:hidden flex items-center gap-2 text-[13px] text-[#1A202C]/50 hover:text-[#1A202C]/70 transition-colors"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="h-5 w-5 rounded-full bg-[#D4AF37]/15 text-[10px] font-semibold text-[#D4AF37] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <label className="text-[11px] text-[#1A202C]/30 uppercase tracking-wider">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-b border-[#E5E2DD] px-0 py-1 text-[13px] text-[#1A202C]/60 focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer appearance-none"
                >
                  <option value="featured" className="bg-white">
                    Featured
                  </option>
                  <option value="price-low" className="bg-white">
                    Price: Low to High
                  </option>
                  <option value="price-high" className="bg-white">
                    Price: High to Low
                  </option>
                  <option value="carat-low" className="bg-white">
                    Carat: Low to High
                  </option>
                  <option value="carat-high" className="bg-white">
                    Carat: High to Low
                  </option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {selectedCategory && (
                  <FilterChip
                    label={selectedCategory}
                    onRemove={() => {
                      setSelectedCategory("");
                      setSearchParams({});
                    }}
                  />
                )}
                {selectedMetalTypes.map((v) => (
                  <FilterChip
                    key={v}
                    label={v}
                    onRemove={() =>
                      toggleFilter(
                        selectedMetalTypes,
                        setSelectedMetalTypes,
                        v,
                      )
                    }
                  />
                ))}
                {selectedCuts.map((v) => (
                  <FilterChip
                    key={v}
                    label={`Cut: ${v}`}
                    onRemove={() =>
                      toggleFilter(selectedCuts, setSelectedCuts, v)
                    }
                  />
                ))}
                {selectedColors.map((v) => (
                  <FilterChip
                    key={v}
                    label={`Color: ${v}`}
                    onRemove={() =>
                      toggleFilter(selectedColors, setSelectedColors, v)
                    }
                  />
                ))}
                {selectedClarities.map((v) => (
                  <FilterChip
                    key={v}
                    label={`Clarity: ${v}`}
                    onRemove={() =>
                      toggleFilter(
                        selectedClarities,
                        setSelectedClarities,
                        v,
                      )
                    }
                  />
                ))}
                {selectedCaratRange && (
                  <FilterChip
                    label={
                      CARAT_RANGES.find(
                        (r) => r.min === selectedCaratRange.min,
                      )?.label || "Carat"
                    }
                    onRemove={() => setSelectedCaratRange(null)}
                  />
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-[#1A202C]/25 hover:text-[#D4AF37] transition-colors ml-2 tracking-wider uppercase"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product grid */}
            {products === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-[#F0EDE8] mb-5" />
                    <div className="h-4 bg-[#E5E2DD] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#E5E2DD] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32"
              >
                <Diamond className="h-12 w-12 mx-auto mb-6 text-[#1A202C]/10" />
                <h3 className="text-lg font-light text-[#1A202C]/40 tracking-wide">
                  No pieces match your filters
                </h3>
                <p className="mt-3 text-sm text-[#1A202C]/25">
                  Try adjusting your criteria or{" "}
                  <button
                    onClick={clearAllFilters}
                    className="text-[#D4AF37] hover:text-[#D4AF37]/80 underline underline-offset-4 transition-colors"
                  >
                    clear all filters
                  </button>
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14">
                {filteredProducts.map((product: { _id: string }, i: number) => (
          <ShopProductCard
            key={product._id}
            product={product as any}
            index={i}
          />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#1A202C]/20 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#F9F8F6] border-r border-[#E5E2DD] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1A202C]/40">
                  Filters
                </h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[#1A202C]/40 hover:text-[#1A202C]/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <FilterSidebar />
              <div className="mt-8 pt-6 border-t border-[#E5E2DD]">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 text-sm font-medium text-white bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-colors tracking-wide"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}

/* ── filter chip ─────────────────────────────────────────────────────── */
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/8 px-3 py-1.5 text-[11px] tracking-wider text-[#D4AF37]">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-[#1A202C] transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
