import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { motion } from "framer-motion";
import {
  LogOut,
  ShoppingBag,
  Heart,
  Diamond,
  ArrowRight,
  Award,
} from "lucide-react";

function WishlistSection({ id }: { id?: string }) {
  const wishlistedProducts = useQuery(api.wishlist.getWishlistedProducts);

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-12 rounded-2xl border border-[#E5E2DD] bg-white p-8 sm:p-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-[#1A202C] flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#D4AF37]" />
          My Wishlist
        </h3>
        {wishlistedProducts && wishlistedProducts.length > 0 && (
          <span className="text-xs text-[#1A202C]/30">
            {wishlistedProducts.length} item{wishlistedProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {wishlistedProducts === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-[#F0EDE8] rounded-xl mb-3" />
              <div className="h-3 bg-[#E5E2DD] rounded w-3/4 mb-1" />
              <div className="h-2.5 bg-[#E5E2DD] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : wishlistedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto mb-4 text-[#1A202C]/8" />
          <p className="text-sm text-[#1A202C]/30">
            No saved pieces yet. Tap the heart on any product to save it here.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
          >
            Browse Collection
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {wishlistedProducts.map((product: { _id: string; name: string; images?: string[]; imageUrl: string; basePrice: number; metalOptions: Array<{ price?: number; priceAdjustment?: number }> } | null) => {
            if (!product) return null;
            const images = (product as any).images ?? [];
            const metalOptions = (product as any).metalOptions ?? [];
            const activePrice = metalOptions.length > 0
              ? metalOptions[0].price ?? (product as any).basePrice + (metalOptions[0].priceAdjustment ?? 0)
              : (product as any).basePrice;
            return (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group block shrink-0 w-[200px] rounded-xl border border-[#E5E2DD] overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-[4/5] bg-[#F0EDE8] overflow-hidden">
                  <img
                    src={images[0] || (product as any).imageUrl || ""}
                    alt={(product as any).name}
                    loading="lazy"
                    decoding="async"
                    width={200}
                    height={250}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-[#1A202C] truncate">
                    {(product as any).name}
                  </p>
                  <p className="text-xs text-[#D4AF37] mt-1">
                    ${(activePrice ?? 0).toLocaleString("en-US")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#D4AF37]/20">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
                  Welcome{user?.name ? `, ${user.name}` : ""}
                </h1>
                <p className="text-sm text-[#1A202C]/40 mt-0.5">
                  {user?.email || "Guest account"}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E2DD] bg-white px-5 py-2.5 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] hover:text-[#1A202C] transition-all self-start"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[
              {
                icon: ShoppingBag,
                title: "Browse Collection",
                desc: "Explore our lab-grown diamonds",
                href: "/shop",
                accent: true,
              },
              {
                icon: Heart,
                title: "My Wishlist",
                desc: "Saved pieces & favorites",
                href: "#wishlist",
                accent: false,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              >
                <Link
                  to={item.href}
                  className={`group block rounded-2xl border p-6 transition-all duration-300 ${
                    item.accent
                      ? "border-[#D4AF37]/20 bg-[#D4AF37]/5 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/8"
                      : "border-[#E5E2DD] bg-white hover:border-[#1A202C]/15 hover:bg-[#F0EDE8]/50"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                      item.accent
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "bg-[#F0EDE8] text-[#1A202C]/30 group-hover:text-[#1A202C]/50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1A202C]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#1A202C]/35">{item.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Membership Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.06] to-transparent p-8 sm:p-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Award className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#1A202C]">
                    Etherstar Member
                  </h3>
                  <p className="mt-1 text-sm text-[#1A202C]/40">
                    Enjoy exclusive access to new collections, member pricing,
                    and priority support.
                  </p>
                </div>
              </div>
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#1A202C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A202C]/20 hover:shadow-[#1A202C]/30 hover:scale-[1.02] transition-all duration-300 self-start shrink-0"
              >
                <Diamond className="h-4 w-4" />
                Explore Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>

          {/* Wishlist */}
          <WishlistSection id="wishlist" />
        </motion.div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
