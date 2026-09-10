import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/** Company master email that receives admin verification OTPs. */
const COMPANY_ADMIN_EMAIL = "etherstarjewels@gmail.com";

/** OTP validity window — 10 minutes. */
const OTP_TTL_MS = 10 * 60 * 1000;

const RESEND_API_URL = "https://api.resend.com/emails";
/**
 * Free Resend accounts can ONLY send from the bare `onboarding@resend.dev`.
 * Once a custom domain is verified in Resend, this can be changed to a
 * branded address like "Etherstar Jewels <hello@etherstarjewels.com>".
 */
const RESEND_FROM_EMAIL = "onboarding@resend.dev";

function generateSixDigitCode(): string {
  const random: RandomReader = {
    read(bytes: Uint8Array) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(random, "0123456789", 6);
}

function buildAdminOtpEmailHtml(code: string): string {
  return `
<!doctype html>
<html lang="en">
  <body style="margin:0; background:#F9F8F6; padding:32px 16px; font-family:Georgia, 'Times New Roman', serif;">
    <div style="max-width:480px; margin:0 auto; background:#FFFFFF; border:1px solid #E5E2DD; border-radius:12px; overflow:hidden;">
      <div style="background:#1A202C; padding:26px 32px; text-align:center;">
        <p style="margin:0; color:#D4AF37; font-size:15px; letter-spacing:6px; text-transform:uppercase; font-weight:600;">Etherstar</p>
        <p style="margin:3px 0 0; color:#FFFFFF; font-size:10px; letter-spacing:5px; text-transform:uppercase; opacity:0.7;">Admin Verification</p>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 10px; color:#1A202C; font-size:20px; font-weight:600;">Admin Access Requested</h1>
        <p style="margin:0 0 24px; color:#1A202C; opacity:0.65; font-size:14px; line-height:1.6;">
          A user has requested admin access to Etherstar Jewels. Share the code below with them to authorize access. This code expires in 10 minutes.
        </p>
        <div style="background:#F9F8F6; border:1px solid #E5E2DD; border-radius:8px; padding:20px; text-align:center;">
          <span style="font-size:32px; letter-spacing:10px; color:#1A202C; font-weight:700; font-family:Georgia, 'Times New Roman', serif;">${code}</span>
        </div>
        <p style="margin:24px 0 0; color:#1A202C; opacity:0.5; font-size:12px; line-height:1.6;">
          If you did not expect this request, you can safely ignore this email.
        </p>
      </div>
      <div style="background:#F9F8F6; border-top:1px solid #E5E2DD; padding:16px 32px; text-align:center;">
        <p style="margin:0; color:#1A202C; opacity:0.4; font-size:11px; letter-spacing:2px; text-transform:uppercase;">
          Lab-grown brilliance, without compromise
        </p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Generate an admin OTP and attempt to email it to the company inbox.
 *
 * On failure (no RESEND_API_KEY, provider error), the code is recorded
 * with delivered:false so the frontend can surface it as a "Dev Mode Code".
 */
export const generateAdminOtp = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Only non-admin users need to verify via OTP.
    // Admins who already have the role can skip.
    if (user.role === "admin") {
      return { alreadyAdmin: true, code: null, delivered: null };
    }

    const code = generateSixDigitCode();
    const expiresAt = Date.now() + OTP_TTL_MS;

    // Upsert — one active admin OTP per user at a time.
    const existing = await ctx.db
      .query("adminOtpCodes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { code, delivered: false, expiresAt });
    } else {
      await ctx.db.insert("adminOtpCodes", {
        userId: userId as string,
        code,
        delivered: false,
        expiresAt,
      });
    }

    // Attempt to send the OTP to the company master email.
    const apiKey = process.env.RESEND_API_KEY;
    let delivered = false;

    if (apiKey) {
      try {
        const response = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: COMPANY_ADMIN_EMAIL,
            subject: "Etherstar Jewels — Admin Access OTP",
            text: `Admin verification code: ${code}. Share this code with the requesting user. Expires in 10 minutes.`,
            html: buildAdminOtpEmailHtml(code),
          }),
        });
        if (response.ok) {
          delivered = true;
        }
      } catch (err) {
        // Silently fail — fallback will show code on frontend
      }
    }

    // Update delivery status.
    if (existing) {
      await ctx.db.patch(existing._id, { delivered });
    } else {
      // Find the record we just inserted to patch it.
      const rec = await ctx.db
        .query("adminOtpCodes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (rec) await ctx.db.patch(rec._id, { delivered });
    }

    return { alreadyAdmin: false, code, delivered };
  },
});

/**
 * Verify the admin OTP. If the code is correct and not expired,
 * grant the user the "admin" role.
 */
export const verifyAdminOtp = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Already admin — nothing to do.
    if (user.role === "admin") {
      return { success: true, alreadyAdmin: true };
    }

    const record = await ctx.db
      .query("adminOtpCodes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!record) {
      throw new Error("No admin verification pending. Please request a new code.");
    }

    if (record.expiresAt < Date.now()) {
      // Clean up expired record.
      await ctx.db.delete(record._id);
      throw new Error("This code has expired. Please request a new one.");
    }

    if (record.code !== code) {
      throw new Error("Incorrect verification code. Please try again.");
    }

    // Code is valid — grant admin role and clean up the OTP record.
    await ctx.db.patch(userId, { role: "admin" });
    await ctx.db.delete(record._id);

    return { success: true, alreadyAdmin: false };
  },
});

/**
 * Get the fallback admin OTP status for the current user.
 * Returns the code and delivery status if a pending OTP exists and hasn't expired.
 * Used by the frontend to show a "Dev Mode Code" badge.
 */
export const getAdminOtpStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const record = await ctx.db
      .query("adminOtpCodes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!record || record.expiresAt < Date.now()) return null;

    return { code: record.code, delivered: record.delivered };
  },
});

/**
 * Cancel a pending admin OTP request (e.g. user backs out).
 */
export const cancelAdminOtp = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const record = await ctx.db
      .query("adminOtpCodes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (record) await ctx.db.delete(record._id);
  },
});
