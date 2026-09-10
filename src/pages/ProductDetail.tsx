import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useParams, Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Award,
  MessageCircle,
  ZoomIn,
  Heart,
} from "lucide-react";
import { getMetalPrice, sortMetalOptions } from "@/lib/metals";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SafeImage } from "@/components/SafeImage";

const SIZES_BY_CATEGORY: Record<string, string[]> = {
  Rings: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"],
  Earrings: ["One Size"],
  Pendants: ["One Size"],
  Bracelets: ["6.5 inches", "7 inches", "7.5 inches", "8 inches"],
};

const DEFAULT_SIZES = ["One Size"];

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = useQuery(
    api.products.getBySlugOrId,
    slug ? { slugOrId: slug } : "skip",
  );
  const relatedProducts = useQuery(api.products.list, {});
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMetalIdx, setSelectedMetalIdx] = useState(0);

  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Size chart modal
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Wishlist
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isWishlisted = useQuery(
    api.wishlist.isWishlisted,
    product?._id ? { productId: product._id } : "skip",
  );
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const [wishlistOptimistic, setWishlistOptimistic] = useState<boolean | null>(null);
  const wishlisted = wishlistOptimistic ?? isWishlisted ?? false;

  const handleToggleWishlist = async () => {
    if (!product) return;

    // Guest redirect: store in sessionStorage and send to auth
    if (!isAuthenticated) {
      const key = "etherstar_pending_wishlist";
      const existing = sessionStorage.getItem(key);
      const ids: string[] = existing ? JSON.parse(existing) : [];
      if (!ids.includes(product._id as string)) {
        ids.push(product._id as string);
        sessionStorage.setItem(key, JSON.stringify(ids));
      }
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setWishlistOptimistic(!wishlisted);
    try {
      await toggleWishlist({ productId: product._id });
    } catch {
      setWishlistOptimistic(wishlisted);
    }
  };

  // Sync optimistic when server value arrives (useEffect, not queueMicrotask)
  useEffect(() => {
    if (wishlistOptimistic !== null && isWishlisted !== undefined && isWishlisted === wishlistOptimistic) {
      setWishlistOptimistic(null);
    }
  }, [wishlistOptimistic, isWishlisted]);

  const images = product?.images ?? [];
  const sortedMetalOptions = sortMetalOptions(
    (product?.metalOptions ?? []).filter((mv) => (mv.price ?? 0) > 0),
  );

  const activeMetal =
    product && product !== null
      ? sortedMetalOptions?.[selectedMetalIdx] || sortedMetalOptions?.[0]
      : undefined;
  const displayPrice =
    getMetalPrice(activeMetal, product?.basePrice ?? 0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
    },
    [],
  );

  const goToImage = (idx: number) => {
    setActiveImageIdx(idx);
    setImageLoaded(false);
  };

  const prevImage = useCallback(() => {
    setActiveImageIdx((prev) => {
      const len = images.length || 1;
      return prev === 0 ? len - 1 : prev - 1;
    });
    setImageLoaded(false);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveImageIdx((prev) => {
      const len = images.length || 1;
      return prev === len - 1 ? 0 : prev + 1;
    });
    setImageLoaded(false);
  }, [images.length]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevImage, nextImage]);

  // Loading state
  if (product === undefined) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square rounded-2xl bg-[#F0EDE8]" />
              <div className="space-y-6 py-8">
                <div className="h-8 bg-[#E5E2DD] rounded w-3/4" />
                <div className="h-4 bg-[#E5E2DD] rounded w-1/2" />
                <div className="h-12 bg-[#E5E2DD] rounded w-1/3 mt-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (product === null) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Diamond className="h-16 w-16 mx-auto mb-6 text-[#1A202C]/10" />
          <h2 className="text-xl font-medium text-[#1A202C]/50">
            Product not found
          </h2>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);

  const sizeLabel = product.sizeType ?? "Size";
  const sizes = product.size
    ? product.size.split(",").filter(Boolean)
    : SIZES_BY_CATEGORY[product.category] || DEFAULT_SIZES;

  const fourCs = [
    ...(product.diamondType
      ? [{ label: "Diamond", value: product.diamondType }]
      : []),
    { label: "Carat", value: product.carat.toString() },
    ...(product.weightGrams !== undefined
      ? [{ label: "Weight", value: `${product.weightGrams} g` }]
      : []),
    { label: "Cut", value: product.cut },
    { label: "Color", value: product.color },
    { label: "Clarity", value: product.clarity },
    ...(product.settingType
      ? [{ label: "Setting", value: product.settingType }]
      : []),
  ];

  const related = relatedProducts
    ? relatedProducts.filter((p: { _id: string }) => p._id !== product._id).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <nav className="flex items-center gap-2 text-sm text-[#1A202C]/30">
            <Link to="/" className="hover:text-[#1A202C]/50 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              to="/shop"
              className="hover:text-[#1A202C]/50 transition-colors"
            >
              Shop
            </Link>
            <span>/</span>
            <Link
              to={`/shop?category=${product.category}`}
              className="hover:text-[#1A202C]/50 transition-colors"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-[#1A202C]/50">{product.name}</span>
          </nav>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* ── Image Gallery ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div
              ref={imageRef}
              className="relative aspect-square rounded-2xl overflow-hidden bg-[#F0EDE8] group cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
            >
              <SafeImage
                src={images[activeImageIdx] || images[0] || ""}
                alt={`${product.name} — angle ${activeImageIdx + 1}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={800}
                height={800}
                className={`h-full w-full object-contain p-4 transition-opacity duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                style={
                  isZooming && imageLoaded
                    ? {
                        transform: "scale(1.5)",
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        transition: "transform-origin 0.1s ease-out",
                      }
                    : { transition: "transform 0.5s ease-out" }
                }
                onLoad={() => setImageLoaded(true)}
                key={activeImageIdx}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
                </div>
              )}

              {/* Hover to zoom hint */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-[#1A202C]/30 backdrop-blur-sm px-3 py-1.5 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3 w-3" />
                Hover to zoom
              </div>

              {/* Stock badge */}
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute top-4 right-4 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Only {product.stock} left
                </div>
              )}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-[#1A202C]/50 hover:text-[#1A202C] hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-[#1A202C]/50 hover:text-[#1A202C] hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 rounded-full bg-[#1A202C]/40 backdrop-blur-sm px-3 py-1 text-[10px] text-white/80">
                  {activeImageIdx + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      i === activeImageIdx
                        ? "border-[#D4AF37] shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-[#E5E2DD]"
                    }`}
                  >
                    <SafeImage
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Details ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Category + Wishlist */}
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                {product.category}
              </span>
              <button
                onClick={handleToggleWishlist}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E2DD] bg-white hover:bg-[#F0EDE8] transition-all"
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    wishlisted
                      ? "fill-[#D4AF37] text-[#D4AF37]"
                      : "text-[#1A202C]/30"
                  }`}
                />
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C]">
              {product.name}
            </h1>

            <p className="mt-4 text-base text-[#1A202C]/50 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-8">
              <motion.span
                key={displayPrice}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-3xl font-light text-[#D4AF37] inline-block"
              >
                {formatPrice(displayPrice)}
              </motion.span>
            </div>

            {/* 4Cs */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fourCs.map((c) => (
                <div
                  key={c.label}
                  className="bg-white rounded-xl border border-[#E5E2DD] p-3 text-center hover:border-[#D4AF37]/30 transition-colors duration-300"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#1A202C]/30 mb-0.5">
                    {c.label}
                  </div>
                  <div className="text-sm font-medium text-[#1A202C]">
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Metal & Size */}
            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1A202C]/40 block mb-3">
                  Metal
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortedMetalOptions?.map((mv, i) => (
                    <button
                      key={mv.metalType}
                      onClick={() => setSelectedMetalIdx(i)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                        i === selectedMetalIdx
                          ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#D4AF37]"
                          : "border-[#E5E2DD] bg-white text-[#1A202C]/50 hover:border-[#1A202C]/20"
                      }`}
                    >
                      {mv.metalType}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1A202C]/40">
                      {product.category === "Rings" ? "Select your size" : `Select your ${sizeLabel.toLowerCase()}`}
                    </label>
                    <p className="mt-1 text-[11px] text-[#1A202C]/30">
                      Choose the fit that feels right
                    </p>
                  </div>
                  {product.category === "Rings" && (
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="text-[11px] text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors underline underline-offset-2"
                    >
                      Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#D4AF37]"
                          : "border-[#E5E2DD] bg-white text-[#1A202C]/50 hover:border-[#1A202C]/20 hover:text-[#1A202C]/70"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div className="mt-8 flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-600">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-red-500">Out of Stock</span>
                </>
              )}
            </div>

            {(product.certificateType || product.certificateNumber || product.certificateUrl) && (
              <div className="mt-6 rounded-xl border border-[#E5E2DD] bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A202C]/40">
                  <Award className="h-4 w-4 text-[#D4AF37]" />
                  {product.certificateType || "Certificate"}
                </div>
                {product.certificateNumber && (
                  <p className="mt-2 text-sm text-[#1A202C]/60">
                    Certificate number: <span className="font-medium text-[#1A202C]">{product.certificateNumber}</span>
                  </p>
                )}
                {product.certificateUrl && (
                <a
                  href={product.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E5E2DD] bg-white px-5 py-3 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] hover:text-[#1A202C] transition-all"
                >
                  View {product.certificateType || "certificate"} certificate
                </a>
                )}
              </div>
            )}

            {/* WhatsApp Business contact */}
            <div className="mt-8 pt-8 border-t border-[#E5E2DD]">
              <a
                href={`https://wa.me/919725756046?text=${encodeURIComponent(`Hi Etherstar Jewels, I would like to know more about ${product.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/[0.06] px-4 py-4 transition-colors hover:border-[#25D366]/60 hover:bg-[#25D366]/[0.1]"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 shrink-0 text-[#1A9E4B]" />
                  <div>
                    <p className="text-sm font-medium text-[#1A202C]">Chat with us on WhatsApp</p>
                    <p className="mt-0.5 text-xs text-[#1A202C]/45">Ask about this piece, sizing, or availability</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1A9E4B]" />
              </a>
            </div>

            <div className="mt-auto pt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-sm text-[#1A202C]/30 hover:text-[#D4AF37] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-[#E5E2DD] pt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-light tracking-tight text-[#1A202C] mb-2">
                You May Also Like
              </h2>
              <p className="text-sm text-[#1A202C]/35 mb-10">
                More from our {product.category.toLowerCase()} collection
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p: { _id: string }, i: number) => (
                <ProductCard key={p._id} product={p as any} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>

      {/* Ring Size Guide Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A202C]/30 backdrop-blur-sm p-4"
          onClick={() => setShowSizeChart(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-[#E5E2DD] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E2DD] px-6 py-4">
              <h3 className="text-lg font-medium text-[#1A202C]">Ring Size Guide</h3>
              <button
                onClick={() => setShowSizeChart(false)}
                className="text-[#1A202C]/30 hover:text-[#1A202C]/60 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#1A202C]/50 mb-4">
                Find your ring size by measuring the inner diameter of a ring that fits you well, or use a strip of paper to measure around your finger.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DD]">
                    <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/40">US Size</th>
                    <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/40">Diameter (mm)</th>
                    <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/40">Circumference (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: "5", dia: "15.7", circ: "49.3" },
                    { size: "5.5", dia: "16.1", circ: "50.6" },
                    { size: "6", dia: "16.5", circ: "51.8" },
                    { size: "6.5", dia: "16.9", circ: "53.1" },
                    { size: "7", dia: "17.3", circ: "54.4" },
                    { size: "7.5", dia: "17.7", circ: "55.7" },
                    { size: "8", dia: "18.1", circ: "56.9" },
                    { size: "8.5", dia: "18.5", circ: "58.2" },
                    { size: "9", dia: "18.9", circ: "59.5" },
                  ].map((row) => (
                    <tr key={row.size} className="border-b border-[#E5E2DD]/50 last:border-0">
                      <td className="py-2 text-[#1A202C] font-medium">{row.size}</td>
                      <td className="py-2 text-[#1A202C]/50">{row.dia}</td>
                      <td className="py-2 text-[#1A202C]/50">{row.circ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 rounded-lg bg-[#F0EDE8]/50">
                <p className="text-xs text-[#1A202C]/40">
                  <strong className="text-[#1A202C]/60">Tip:</strong> For the most accurate measurement, measure your finger at the end of the day when it's at its largest. If you're between sizes, we recommend going half a size up.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
