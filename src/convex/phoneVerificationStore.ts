import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createVerification = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("phoneVerifications", {
      phone: args.phone,
      verifiedAt: now,
      expiresAt: now + 15 * 60 * 1000,
    });
  },
});