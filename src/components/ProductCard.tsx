import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import type { Id } from "../convex/_generated/dataModel";
import { SafeImage } from "@/components/SafeImage";

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
  metalType: string;
  metalOptions: MetalOption[];
  size: string;
  carat: number;
  cut: string;
  color: string;
  clarity: string;
  images: string[];
  imageUrl: string;
  stock: number;
  certificateUrl?: string;
  category: string;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const PENDING_WISHLIST_KEY = "etherstar_pending_wishlist";

// Self-contained wishlist heart button
function WishlistHeart({ productId }: { productId: Id<"products"> }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isWishlisted = useQuery(api.wishlist.isWishlisted, { productId });
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const active = optimistic ?? isWishlisted ?? false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const existing = sessionStorage.getItem(PENDING_WISHLIST_KEY);
      const ids: string[] = existing ? JSON.parse(existing) : [];
      if (!ids.includes(productId as string)) {
        ids.push(productId as string);
        sessionStorage.setItem(PENDING_WISHLIST_KEY, JSON.stringify(ids));
      }
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setOptimistic(!active);
    try {
      await toggleWishlist({ productId });
    } catch {
      setOptimistic(active);
    }
  };

  useEffect(() => {
    if (optimistic !== null && isWishlisted !== undefined && isWishlisted === optimistic) {
      setOptimistic(null);
    }
  }, [optimistic, isWishlisted]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`h-4 w-4 transition-all duration-300 ${
          active
            ? "fill-[#D4AF37] text-[#D4AF37] scale-110"
            : "text-[#1A202C]/30 hover:text-[#D4AF37]/60"
        }`}
      />
    </button>
  );
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [hoveredImage, setHoveredImage] = useState(0);
  const images = product?.images ?? [];
  const displayImage = images[hoveredImage] || images[0] || product?.imageUrl || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link to={`/product/${product._id}`} className="group block">
        {/* Image with hover-cycle */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[#F0EDE8] mb-5"
          onMouseEnter={() =>
            setHoveredImage(Math.min(1, images.length - 1))
          }
          onMouseLeave={() => setHoveredImage(0)}
        >
          <SafeImage
            src={displayImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={750}
            className="h-full w-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[#1A202C]/0 group-hover:bg-[#1A202C]/5 transition-colors duration-500" />

          {/* Wishlist heart */}
          <WishlistHeart productId={product._id} />

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

        {/* Text */}
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
