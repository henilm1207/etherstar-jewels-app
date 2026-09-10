import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

// Admin email whitelist — any matching email is auto-promoted on every login.
// Add or remove emails here; no database edits or terminal commands needed.
const ADMIN_EMAILS = [
  "hello@etherstarjewels.com",
  "henil.moradiya2002@gmail.com",
];

/**
 * Ensure the current user has the correct role, evaluated on every call.
 *
 * - Checks the user's email against ADMIN_EMAILS on every sign-in.
 * - If the email matches → role is set to "admin" (even if previously "user").
 * - If no match → role is set to "user" (only if not already admin).
 * - Preserves existing admin role if the user was manually promoted.
 * - Safe to call multiple times.
 */
export const ensureUserRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const email = user.email?.toLowerCase();
    const isAdmin = email ? ADMIN_EMAILS.includes(email) : false;

    // Admin match → always ensure admin role (upgrade if needed)
    if (isAdmin && user.role !== "admin") {
      await ctx.db.patch(userId, { role: "admin" });
      return "admin" as const;
    }

    // No role yet → assign default
    if (!user.role) {
      const role = "user" as const;
      await ctx.db.patch(userId, { role });
      return role;
    }

    // Already has the correct role
    return user.role;
  },
});
