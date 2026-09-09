import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Email OTP provider for Etherstar Jewels.
 *
 * A 6-digit code is generated and stored server-side (hashed, with a
 * 10-minute expiry) by Convex Auth, then dispatched to the user's inbox via
 * Resend. Sign-in NEVER gets stuck waiting for an email:
 *
 * - If RESEND_API_KEY is missing or Resend rejects/times out, the exact error
 *   is logged, the fallback line "[Etherstar Auth Fallback] OTP for …" is
 *   emitted so the auth card can show a "Test Mode Code" badge.
 * - sendVerificationRequest never throws, so the signIn mutation always
 *   resolves and the code the framework already stored remains usable.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Free Resend accounts can ONLY send from `onboarding@resend.dev` — any other
 * "from" address (including display-name variants) is rejected with a 403.
 * Once you verify a custom domain in Resend, change this to
 * e.g. "Etherstar Jewels <hello@etherstarjewels.com>".
 */
const RESEND_FROM_EMAIL = "onboarding@resend.dev";

function buildVerificationEmailHtml(code: string): string {
  return `
<!doctype html>
<html lang="en">
  <body style="margin:0; background:#F9F8F6; padding:32px 16px; font-family:Georgia, 'Times New Roman', serif;">
    <div style="max-width:480px; margin:0 auto; background:#FFFFFF; border:1px solid #E5E2DD; border-radius:12px; overflow:hidden;">
      <div style="background:#1A202C; padding:26px 32px; text-align:center;">
        <p style="margin:0; color:#D4AF37; font-size:15px; letter-spacing:6px; text-transform:uppercase; font-weight:600;">Etherstar</p>
        <p style="margin:3px 0 0; color:#FFFFFF; font-size:10px; letter-spacing:5px; text-transform:uppercase; opacity:0.7;">Jewels</p>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 10px; color:#1A202C; font-size:20px; font-weight:600;">Verify your email</h1>
        <p style="margin:0 0 24px; color:#1A202C; opacity:0.65; font-size:14px; line-height:1.6;">
          Use the code below to complete your sign-in to Etherstar Jewels.
          This code expires in 10 minutes.
        </p>
        <div style="background:#F9F8F6; border:1px solid #E5E2DD; border-radius:8px; padding:20px; text-align:center;">
          <span style="font-size:32px; letter-spacing:10px; color:#1A202C; font-weight:700; font-family:Georgia, 'Times New Roman', serif;">${code}</span>
        </div>
        <p style="margin:24px 0 0; color:#1A202C; opacity:0.5; font-size:12px; line-height:1.6;">
          If you didn't request this code, you can safely ignore this email.
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

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 10, // 10 minutes

  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },

  async sendVerificationRequest({ identifier: email, token: otp }) {
    console.log("════════════════════════════════════════════");
    console.log(`[Etherstar Auth] Preparing OTP email → to: ${email}`);
    console.log(`[Etherstar Auth] OTP code: ${otp}`);
    console.log(`[Etherstar Auth] From address: ${RESEND_FROM_EMAIL}`);

    const apiKey = process.env.RESEND_API_KEY;
    console.log(
      `[Etherstar Auth] RESEND_API_KEY present: ${apiKey ? "yes (length " + apiKey.length + ")" : "NO — MISSING!"}`,
    );

    if (!apiKey) {
      console.error(
        "[Etherstar Auth] RESEND_API_KEY is not configured — using test-mode fallback.",
      );
      console.error(`[Etherstar Auth Fallback] OTP for ${email}: ${otp}`);
      return;
    }

    const payload = {
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: "Your Etherstar Jewels Verification Code",
      text: `Your Etherstar Jewels verification code is: ${otp}. This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.`,
      html: buildVerificationEmailHtml(otp),
    };

    console.log(
      `[Etherstar Auth] → POST ${RESEND_API_URL} | from: ${payload.from} | to: ${payload.to} | subject: ${payload.subject}`,
    );

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(
        `[Etherstar Auth] ← Resend responded: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "(no body)");
        console.error(
          `Resend Error: HTTP ${response.status} ${response.statusText} — response body: ${body}`,
        );
        console.error(`[Etherstar Auth Fallback] OTP for ${email}: ${otp}`);
        return;
      }

      const data = await response.json().catch(() => null);
      console.log(
        `[Etherstar Auth] ✓ Resend accepted the email: ${JSON.stringify(data)}`,
      );
      console.log(
        `[Etherstar Auth] OTP for ${email}: ${otp} (email sent successfully)`,
      );
    } catch (error) {
      console.error("Resend Error:", error);
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[Etherstar Auth] Resend request failed: ${message}`,
      );
      console.error(`[Etherstar Auth Fallback] OTP for ${email}: ${otp}`);
      return;
    }
  },
});
