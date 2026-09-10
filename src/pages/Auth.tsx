import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, User, UserX } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

type AuthMode = "signIn" | "signUp" | "forgot" | "resetVerification";

export default function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect, { replace: true });
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") ?? "");
      if (mode === "signUp" && password !== String(formData.get("confirmPassword") ?? "")) {
        throw new Error("Passwords do not match");
      }
      await signIn("password", formData);
      navigate(redirect, { replace: true });
    } catch (authError) {
      const authMessage = authError instanceof Error ? authError.message : "";
      if (authMessage.includes("Passwords do not match")) setError(authMessage);
      else if (authMessage.includes("Invalid credentials")) setError("Email or password is incorrect.");
      else if (authMessage.includes("already exists") || authMessage.includes("already registered")) setError("An account with this email already exists. Sign in instead.");
      else if (authMessage.includes("8 characters") || authMessage.includes("Invalid password")) setError("Your password must be at least 8 characters.");
      else setError(mode === "signUp" ? "We could not create your account. Please try again." : "We could not sign you in. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      formData.set("email", email);
      await signIn("password", formData);
      setResetEmail(email);
      setMode("resetVerification");
      setMessage("We sent a password reset code to your email.");
    } catch (authError) {
      const authMessage = authError instanceof Error ? authError.message : "";
      setError(authMessage.includes("InvalidAccountId")
        ? "No password account was found for this email. Create a password account first."
        : "We could not send a reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      if (formData.get("newPassword") !== formData.get("confirmPassword")) {
        throw new Error("Passwords do not match");
      }
      await signIn("password", formData);
      setMode("signIn");
      setMessage("Password updated. You can now sign in.");
    } catch (authError) {
      const authMessage = authError instanceof Error ? authError.message : "";
      if (authMessage.includes("Passwords do not match")) setError(authMessage);
      else if (authMessage.includes("expired") || authMessage.includes("Invalid code")) setError("This reset code is invalid or expired. Request a new one.");
      else if (authMessage.includes("8 characters") || authMessage.includes("Invalid password")) setError("Your password must be at least 8 characters.");
      else setError("We could not update your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Guest sign-in failed.");
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { idToken: credentialResponse.credential });
      navigate(redirect, { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in failed.");
      setIsLoading(false);
    }
  }, [navigate, redirect, signIn]);

  const title = mode === "signUp" ? "Create your account" : mode === "forgot" ? "Forgot password?" : mode === "resetVerification" ? "Set a new password" : "Welcome back";
  const subtitle = mode === "signUp" ? "Save your details for a faster checkout" : mode === "forgot" ? "Enter your email and we will send a reset code" : mode === "resetVerification" ? `Enter the code sent to ${resetEmail}` : "Sign in with your email and password";

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.03] via-transparent to-transparent pointer-events-none" />
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img src="/assets/4-2.svg" alt="Etherstar Jewels" width={36} height={36} className="h-9 w-9 rounded-sm object-contain" />
          <div className="flex flex-col"><span className="text-base font-semibold tracking-[0.15em] text-[#1A202C] leading-tight">ETHERSTAR</span><span className="text-[10px] font-light tracking-[0.35em] text-[#D4AF37] uppercase leading-tight">Jewels</span></div>
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="rounded-2xl border border-[#E5E2DD] bg-white shadow-sm overflow-hidden">
            <div className="p-8 pb-6 text-center"><h1 className="text-2xl font-light tracking-tight text-[#1A202C]">{title}</h1><p className="mt-2 text-sm text-[#1A202C]/40">{subtitle}</p></div>

            {(mode === "signIn" || mode === "signUp") && <form onSubmit={handlePasswordSubmit}><div className="px-8 pb-8 space-y-4">
              {mode === "signUp" && <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A202C]/25" /><input name="name" type="text" placeholder="Full name" disabled={isLoading} required className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] pl-10 pr-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" /></div>}
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A202C]/25" /><input name="email" type="email" placeholder="Email address" disabled={isLoading} required autoComplete="email" className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] pl-10 pr-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" /></div>
              <input type="hidden" name="flow" value={mode} />
              <input name="password" type="password" placeholder="Password (8+ characters)" disabled={isLoading} required minLength={8} autoComplete={mode === "signIn" ? "current-password" : "new-password"} className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" />
              {mode === "signUp" && <input name="confirmPassword" type="password" placeholder="Confirm password" disabled={isLoading} required minLength={8} autoComplete="new-password" className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" />}
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}{message && <p className="text-sm text-emerald-600 text-center">{message}</p>}
              <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#1A202C] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A202C]/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signIn" ? "Sign In" : "Create Account"}<ArrowRight className="h-4 w-4" /></>}</button>
              {mode === "signIn" && <button type="button" onClick={() => { setMode("forgot"); setError(null); setMessage(null); }} disabled={isLoading} className="w-full text-xs text-[#1A202C]/40 hover:text-[#D4AF37]">Forgot password?</button>}
              <button type="button" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(null); setMessage(null); }} disabled={isLoading} className="w-full text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors">{mode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
              <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E2DD]" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-[#1A202C]/25">or</span></div></div>
              <button type="button" onClick={handleGuestLogin} disabled={isLoading} className="w-full rounded-xl border border-[#E5E2DD] bg-[#F9F8F6] py-3 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"><UserX className="h-4 w-4" />Continue as Guest</button>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="flex justify-center pt-2"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed. Please try again.")} shape="rectangular" size="large" width={300} theme="outline" text="continue_with" /></div>}
            </div></form>}

            {mode === "forgot" && <form onSubmit={handleForgotPassword}><div className="px-8 pb-8 space-y-4">
              <input name="flow" type="hidden" value="reset" /><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A202C]/25" /><input name="email" type="email" placeholder="Email address" disabled={isLoading} required autoComplete="email" className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] pl-10 pr-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" /></div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#1A202C] py-3 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Code<ArrowRight className="h-4 w-4" /></>}</button><button type="button" onClick={() => { setMode("signIn"); setError(null); }} className="w-full text-sm text-[#D4AF37]">Back to sign in</button>
            </div></form>}

            {mode === "resetVerification" && <form onSubmit={handleResetPassword}><div className="px-8 pb-8 space-y-4">
              <input name="flow" type="hidden" value="reset-verification" /><input name="email" type="hidden" value={resetEmail} /><input name="code" type="text" inputMode="numeric" placeholder="6-digit reset code" disabled={isLoading} required className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] px-4 py-3 text-center tracking-[0.3em] text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" /><input name="newPassword" type="password" placeholder="New password (8+ characters)" disabled={isLoading} required minLength={8} autoComplete="new-password" className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" /><input name="confirmPassword" type="password" placeholder="Confirm new password" disabled={isLoading} required minLength={8} autoComplete="new-password" className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50" />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#1A202C] py-3 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Password<ArrowRight className="h-4 w-4" /></>}</button><button type="button" onClick={() => { setMode("forgot"); setError(null); setMessage(null); }} className="w-full text-sm text-[#D4AF37]">Request a new code</button>
            </div></form>}
          </div>
          <Link to="/" className="mt-6 block text-center text-xs text-[#1A202C]/30 hover:text-[#D4AF37]">← Back to Etherstar Jewels</Link>
        </motion.div>
      </div>
    </div>
  );
}
