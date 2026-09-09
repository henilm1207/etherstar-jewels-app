import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Matches the auth code lifetime in auth/emailOtp.ts (10 minutes).
const FALLBACK_TTL_MS = 10 * 60 * 1000;

/**
 * Record the outcome of every OTP send for an email address.
 *
 * - delivered: true  → Resend accepted the email; nothing is shown on the UI.
 * - delivered: false → Resend failed / key missing; the auth card surfaces
 *                       the code as a "Test Mode Code" badge so sign-in never
 *                       gets stuck waiting for an email that won't arrive.
 *
 * Records are cleared after a successful verification (see `clear`) and are
 * ignored by `getCode` once they pass the 10-minute auth-code lifetime.
 */
export const record = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    delivered: v.boolean(),
  },
  handler: async (ctx, { email, code, delivered }) => {
    const expiresAt = Date.now() + FALLBACK_TTL_MS;
    const existing = await ctx.db
      .query("otpFallbackCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { code, delivered, expiresAt });
    } else {
      await ctx.db.insert("otpFallbackCodes", {
        email,
        code,
        delivered,
        expiresAt,
      });
    }
  },
});

/** Returns the latest send status for an email while its code is still valid. */
export const getCode = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const doc = await ctx.db
      .query("otpFallbackCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!doc || doc.expiresAt < Date.now()) return null;
    return { code: doc.code, delivered: doc.delivered };
  },
});

/** Remove the recorded status once the user has verified their code. */
export const clear = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const doc = await ctx.db
      .query("otpFallbackCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (doc) await ctx.db.delete(doc._id);
  },
});