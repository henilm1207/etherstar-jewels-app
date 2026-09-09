import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const STORAGE_KEY = "etherstar_pending_wishlist";

/**
 * Reads pending product IDs from sessionStorage, adds them to the
 * authenticated user's wishlist, then clears the stored data.
 * Mounted once at the app root — fires silently after login.
 */
export function PendingWishlistSync() {
  const { isAuthenticated } = useAuth();
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const processed = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || processed.current) return;

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    processed.current = true;

    let ids: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      ids = Array.isArray(parsed) ? parsed : [];
    } catch {
      // corrupted — clear it
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (ids.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Add each pending product to the wishlist
    (async () => {
      let added = 0;
      for (const productId of ids) {
        try {
          await toggleWishlist({ productId: productId as string & { __tableName: "products" } });
          added++;
        } catch {
          // skip failures silently
        }
      }

      sessionStorage.removeItem(STORAGE_KEY);

      if (added > 0) {
        toast.success(
          added === 1
            ? "Item added to your wishlist ♥"
            : `${added} items added to your wishlist ♥`,
          {
            duration: 4000,
            style: {
              background: "#FFFFFF",
              border: "1px solid #E5E2DD",
              color: "#1A202C",
            },
          },
        );
      }
    })();
  }, [isAuthenticated, toggleWishlist]);

  return null; // renders nothing
}
