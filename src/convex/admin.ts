import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Admin-only: issue a short-lived upload URL so the client can POST a file
// directly to Convex storage. The response storageId is passed to
// createProduct/updateProduct as imageStorageId.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");
    return await ctx.storage.generateUploadUrl();
  },
});

// Check if the current user is an admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return user?.role === "admin";
  },
});

// List all products for admin (unfiltered)
export const listAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];
    const products = await ctx.db.query("products").collect();
    // Resolve Convex-storage images into usable URLs for display
    return Promise.all(
      products.map(async (p) => {
        const url = p.imageStorageId
          ? await ctx.storage.getUrl(p.imageStorageId)
          : null;
        const storageUrls = p.imageStorageIds
          ? (await Promise.all(p.imageStorageIds.map((id) => ctx.storage.getUrl(id)))).filter(
              (storageUrl): storageUrl is string => Boolean(storageUrl),
            )
          : [];
        // Use storage URLs if available, otherwise fall back to images array
        const images = storageUrls.length > 0
          ? storageUrls
          : p.images.filter(Boolean);
        return {
          ...p,
          imageUrl: url ?? p.imageUrl,
          images,
        };
      }),
    );
  },
});

// Get a single product for editing
export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;
    return await ctx.db.get(args.id);
  },
});

// Create a new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    stock: v.number(),
    metalType: v.string(),
    size: v.string(),
    sizeType: v.optional(
      v.union(v.literal("Ring Size"), v.literal("Inches"), v.literal("One Size"), v.literal("Custom")),
    ),
    carat: v.number(),
    diamondType: v.optional(
      v.union(v.literal("Moissanite"), v.literal("CVD"), v.literal("Natural Diamond")),
    ),
    weightGrams: v.optional(v.number()),
    settingType: v.optional(v.string()),
    cut: v.union(
      v.literal("Ideal"),
      v.literal("Excellent"),
      v.literal("Very Good"),
      v.literal("Good"),
    ),
    color: v.union(
      v.literal("D"),
      v.literal("E"),
      v.literal("F"),
      v.literal("G"),
      v.literal("H"),
      v.literal("I"),
    ),
    clarity: v.union(
      v.literal("FL"),
      v.literal("IF"),
      v.literal("VVS1"),
      v.literal("VVS2"),
      v.literal("VS1"),
      v.literal("VS2"),
      v.literal("SI1"),
      v.literal("SI2"),
    ),
    imageUrl: v.string(),
    images: v.array(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    metalOptions: v.array(
      v.object({
        metalType: v.string(),
        price: v.optional(v.number()),
        priceAdjustment: v.optional(v.number()),
      }),
    ),
    certificateUrl: v.optional(v.string()),
    certificateType: v.optional(v.union(v.literal("GIA"), v.literal("IGI"))),
    certificateNumber: v.optional(v.string()),
    category: v.string(),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    // If an image was uploaded to storage, also populate imageUrl so legacy
    // UI code (cards, hero, etc.) continues to render without changes.
    const { imageStorageId } = args;
    if (imageStorageId) {
      const url = await ctx.storage.getUrl(imageStorageId);
      if (url) args.imageUrl = url;
    }
    return await ctx.db.insert("products", args);
  },
});

// Update an existing product
export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    stock: v.number(),
    metalType: v.string(),
    size: v.string(),
    sizeType: v.optional(
      v.union(v.literal("Ring Size"), v.literal("Inches"), v.literal("One Size"), v.literal("Custom")),
    ),
    carat: v.number(),
    diamondType: v.optional(
      v.union(v.literal("Moissanite"), v.literal("CVD"), v.literal("Natural Diamond")),
    ),
    weightGrams: v.optional(v.number()),
    settingType: v.optional(v.string()),
    cut: v.union(
      v.literal("Ideal"),
      v.literal("Excellent"),
      v.literal("Very Good"),
      v.literal("Good"),
    ),
    color: v.union(
      v.literal("D"),
      v.literal("E"),
      v.literal("F"),
      v.literal("G"),
      v.literal("H"),
      v.literal("I"),
    ),
    clarity: v.union(
      v.literal("FL"),
      v.literal("IF"),
      v.literal("VVS1"),
      v.literal("VVS2"),
      v.literal("VS1"),
      v.literal("VS2"),
      v.literal("SI1"),
      v.literal("SI2"),
    ),
    imageUrl: v.string(),
    images: v.array(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    metalOptions: v.array(
      v.object({
        metalType: v.string(),
        price: v.optional(v.number()),
        priceAdjustment: v.optional(v.number()),
      }),
    ),
    certificateUrl: v.optional(v.string()),
    certificateType: v.optional(v.union(v.literal("GIA"), v.literal("IGI"))),
    certificateNumber: v.optional(v.string()),
    category: v.string(),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    const { id, ...updates } = args;
    // Refresh imageUrl whenever a new storage image is attached.
    if (updates.imageStorageId) {
      const url = await ctx.storage.getUrl(updates.imageStorageId);
      if (url) updates.imageUrl = url;
    }
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete a product
export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
