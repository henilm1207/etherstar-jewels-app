// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { googleProvider } from "./auth/google";
import { emailOtp } from "./auth/emailOtp";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: emailOtp,
      profile: (params) => ({
        email: String(params.email ?? "").trim().toLowerCase(),
        ...(String(params.name ?? "").trim()
          ? { name: String(params.name).trim() }
          : {}),
      }),
    }),
    Anonymous,
    googleProvider,
  ],
});