import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Submit a custom design inquiry.
 * Any authenticated or anonymous user can submit.
 */
export const submit = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    jewelryType: v.string(),
    metal: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const inquiryId = await ctx.db.insert("inquiries", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      jewelryType: args.jewelryType,
      metal: args.metal,
      description: args.description,
      images: args.images,
      status: "new",
    });
    return inquiryId;
  },
});

/**
 * List all inquiries (admin only).
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    const inquiries = await ctx.db.query("inquiries").order("desc").collect();
    return inquiries;
  },
});

/**
 * Update inquiry status (admin only).
 */
export const updateStatus = mutation({
  args: {
    inquiryId: v.id("inquiries"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("responded"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("Not authorized");

    await ctx.db.patch(args.inquiryId, { status: args.status });
  },
});
