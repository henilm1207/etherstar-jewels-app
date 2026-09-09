import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if a specific product is in the current user's wishlist
export const isWishlisted = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId),
      )
      .first();
    return existing !== null;
  },
});

// Get full product objects for the current user's wishlist
export const getWishlistedProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const products = await Promise.all(
      rows.map((r) => ctx.db.get(r.productId)),
    );
    return products.filter(Boolean);
  },
});

// Toggle a product in/out of the wishlist
export const toggleWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to use the wishlist");

    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // removed
    } else {
      await ctx.db.insert("wishlists", {
        userId,
        productId: args.productId,
      });
      return true; // added
    }
  },
});
