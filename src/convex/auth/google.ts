import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { GenericId } from "convex/values";

// Google's JWKS endpoint for verifying ID tokens
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

/**
 * Google Sign-In provider for Convex Auth.
 *
 * On the client, call:
 *   signIn("google", { idToken: "<Google ID token>" })
 *
 * This provider verifies the Google ID token server-side,
 * then creates or retrieves the user account.
 */
export const googleProvider = ConvexCredentials({
  id: "google",
  authorize: async (credentials, ctx) => {
    const idToken = credentials?.idToken as string | undefined;
    if (!idToken || typeof idToken !== "string") {
      throw new Error("Missing Google ID token");
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
    if (!googleClientId) {
      throw new Error("GOOGLE_CLIENT_ID environment variable not configured");
    }

    // Verify the Google ID token using Google's public JWKS
    let payload: GoogleIdTokenPayload;
    try {
      const { payload: verified } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: [
          "https://accounts.google.com",
          "accounts.google.com",
        ],
        audience: googleClientId,
      });
      payload = verified as unknown as GoogleIdTokenPayload;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid Google ID token: ${message}`);
    }

    if (!payload.email) {
      throw new Error("Google token missing email");
    }

    const providerAccountId = payload.sub;
    const email = payload.email;
    const name =
      payload.name ||
      [payload.given_name, payload.family_name]
        .filter(Boolean)
        .join(" ") ||
      email.split("@")[0];
    const image = payload.picture;

    // Try to find existing account, or create a new one
    let account: any;
    let user: any;

    try {
      const existing = await retrieveAccount(ctx, {
        provider: "google",
        account: { id: providerAccountId },
      });
      account = existing.account;
      user = existing.user;
    } catch {
      // Account doesn't exist — create it
      const created = await createAccount(ctx, {
        provider: "google",
        account: { id: providerAccountId },
        profile: {
          name,
          email,
          ...(image ? { image } : {}),
          emailVerified: payload.email_verified,
        },
      });
      account = created.account;
      user = created.user;
    }

    if (!user?._id) {
      throw new Error("Failed to create or retrieve user");
    }
    return { userId: user._id as GenericId<"users"> };
  },
});
