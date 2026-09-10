import { query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/** Resolve a product's Convex-storage image (if any) into its display imageUrl. */
async function withResolvedImage(
  ctx: QueryCtx,
  product: Doc<"products">,
): Promise<Doc<"products">> {
  if (!product.imageStorageId && !product.imageStorageIds?.length) return product;
  const url = product.imageStorageId
    ? await ctx.storage.getUrl(product.imageStorageId)
    : null;
  const storageUrls = product.imageStorageIds
    ? (await Promise.all(product.imageStorageIds.map((id) => ctx.storage.getUrl(id)))).filter(
        (storageUrl): storageUrl is string => Boolean(storageUrl),
      )
    : [];
  // Use storage URLs if available, otherwise fall back to images array
  const images = storageUrls.length > 0
    ? storageUrls
    : product.images.filter(Boolean);
  return { ...product, imageUrl: url ?? product.imageUrl, images };
}

// Get all products with optional filtering
export const list = query({
  args: {
    category: v.optional(v.string()),
    metalType: v.optional(v.string()),
    minCarat: v.optional(v.number()),
    maxCarat: v.optional(v.number()),
    cut: v.optional(v.string()),
    color: v.optional(v.string()),
    clarity: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allProducts = await ctx.db.query("products").collect();

    const filtered = allProducts.filter((product) => {
      if (args.category && product.category !== args.category) return false;
      if (args.featured && !product.featured) return false;
      if (args.metalType && product.metalType !== args.metalType) return false;
      if (args.cut && product.cut !== args.cut) return false;
      if (args.color && product.color !== args.color) return false;
      if (args.clarity && product.clarity !== args.clarity) return false;
      if (args.minCarat !== undefined && product.carat < args.minCarat)
        return false;
      if (args.maxCarat !== undefined && product.carat > args.maxCarat)
        return false;
      if (args.minPrice !== undefined && product.basePrice < args.minPrice)
        return false;
      if (args.maxPrice !== undefined && product.basePrice > args.maxPrice)
        return false;
      if (args.search) {
        const q = args.search.toLowerCase();
        if (
          !product.name.toLowerCase().includes(q) &&
          !product.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    // Resolve Convex-storage images into usable URLs for display
    return Promise.all(filtered.map((p) => withResolvedImage(ctx, p)));
  },
});

// Get a single product by ID
export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    return withResolvedImage(ctx, product);
  },
});

// Get featured products for the homepage
export const featured = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
    return Promise.all(products.map((p) => withResolvedImage(ctx, p)));
  },
});

// Get distinct categories
export const categories = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  },
});
