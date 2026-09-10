import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

type AuthStep =
  | "signIn"
  | { email: string; sending?: boolean }
  | "adminOtp"
  | "adminSuccess";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<AuthStep>("signIn");
  const [otp, setOtp] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Admin flow state
  const [requestAdminAccess, setRequestAdminAccess] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminResendCooldown, setAdminResendCooldown] = useState(0);

  // Admin OTP backend mutations
  const generateAdminOtpMutation = useMutation(api.adminOtp.generateAdminOtp);
  const verifyAdminOtpMutation = useMutation(api.adminOtp.verifyAdminOtp);
  const cancelAdminOtpMutation = useMutation(api.adminOtp.cancelAdminOtp);

  // 60s cooldown between verification-code sends to prevent provider spam
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (adminResendCooldown <= 0) return;
    const t = setTimeout(() => setAdminResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [adminResendCooldown]);

  const startResendCooldown = useCallback(() => setResendCooldown(60), []);
  const startAdminResendCooldown = useCallback(
    () => setAdminResendCooldown(60),
    [],
  );

  const handleSendError = useCallback((msg: string) => {
    setError(msg);
    toast.error(msg, { duration: 5000 });
  }, []);

  // Only poll delivery status once we've left the sign-in step (and the send
  // mutation has finished) so the toast/badge reflect the actual outcome.
  const otpEmail =
    step !== "signIn" && step !== "adminOtp" && step !== "adminSuccess" && !step.sending
      ? step.email
      : null;
  const deliveryStatus = useQuery(
    api.otpFallback.getCode,
    otpEmail ? { email: otpEmail } : "skip",
  );
  const clearFallbackCode = useMutation(api.otpFallback.clear);
  const deliveryNotified = useRef(false);

  // Admin OTP fallback status
  const adminOtpStatus = useQuery(
    api.adminOtp.getAdminOtpStatus,
    step === "adminOtp" ? undefined : "skip",
  );
  const adminOtpNotified = useRef(false);

  // One toast per code send — accurate to whether Resend actually delivered.
  useEffect(() => {
    if (deliveryStatus === undefined || deliveryNotified.current) return;
    deliveryNotified.current = true;
    if (deliveryStatus && !deliveryStatus.delivered) {
      toast.error(
        "Email delivery failed — use the Test Mode Code shown below to sign in.",
        { duration: 7000 },
      );
    } else {
      toast.success("Verification code sent to your email", { duration: 4000 });
    }
  }, [deliveryStatus]);

  // Re-arm the toast whenever the target email changes (including resends).
  useEffect(() => {
    deliveryNotified.current = false;
  }, [otpEmail]);

  // Admin OTP toast
  useEffect(() => {
    if (adminOtpStatus === undefined || adminOtpNotified.current) return;
    adminOtpNotified.current = true;
    if (adminOtpStatus && !adminOtpStatus.delivered) {
      toast.error(
        "Admin OTP email delivery failed — use the Dev Mode Code shown below.",
        { duration: 7000 },
      );
    } else if (adminOtpStatus && adminOtpStatus.delivered) {
      toast.success("Admin verification code sent to company email", {
        duration: 4000,
      });
    }
  }, [adminOtpStatus]);

  useEffect(() => {
    adminOtpNotified.current = false;
  }, [step]);

  // After successful authentication: route to admin OTP generation when the
  // user requested admin access, otherwise go to the intended destination.
  // Uses a ref so the admin code is requested exactly once per login attempt
  // and the user is never bounced off the admin OTP screen mid-flow.
  const adminFlowHandled = useRef(false);
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (requestAdminAccess && !adminFlowHandled.current) {
      adminFlowHandled.current = true;
      handleAdminOtpGenerate();
      return;
    }
    if (!requestAdminAccess && step !== "adminOtp" && step !== "adminSuccess") {
      navigate(redirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      setStep({ email, sending: true });
      await signIn("email-otp", formData);
      setStep({ email });
      setSuccessMsg("Verification code sent! Check your inbox.");
      startResendCooldown();
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("403") || msg.includes("testing emails") || msg.includes("verify a domain")) {
        handleSendError("Email delivery is not enabled for this address yet. Verify your sending domain in Resend and try again.");
      } else if (msg.includes("RESEND_API_KEY") || msg.includes("invalid Resend")) {
        handleSendError(msg);
      } else if (msg.includes("couldn't send") || msg.includes("couldn't reach")) {
        handleSendError(msg);
      } else if (msg.includes("network") || msg.includes("fetch")) {
        handleSendError("Network error. Please check your connection and try again.");
      } else if (msg.includes("rate") || msg.includes("limit")) {
        handleSendError("Too many attempts. Please wait a moment and try again.");
      } else {
        handleSendError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      // Drop any recorded test-mode code now that verification succeeded.
      if (step !== "signIn" && step !== "adminOtp" && step !== "adminSuccess") {
        clearFallbackCode({ email: step.email }).catch(() => {});
      }
      // If admin access was requested, proceed to admin OTP step
      if (requestAdminAccess) {
        // Don't navigate yet — trigger admin OTP generation
        adminFlowHandled.current = true;
        handleAdminOtpGenerate();
        setIsLoading(false);
        return;
      }
      // Sign-in succeeded — navigate to the intended destination.
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("expired")) {
        setError("This code has expired. Please request a new one.");
      } else if (msg.includes("already been used")) {
        setError("This code has already been used. Please request a new one.");
      } else {
        setError("The verification code is incorrect. Please try again.");
      }
      setIsLoading(false);
      setOtp("");
    }
  };

  // Generate admin OTP after user is authenticated
  const handleAdminOtpGenerate = useCallback(async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const result = await generateAdminOtpMutation();
      if (result.alreadyAdmin) {
        toast.success("You already have admin access!", { duration: 4000 });
        setStep("adminSuccess");
        setAdminLoading(false);
        return;
      }
      setStep("adminOtp");
      startAdminResendCooldown();
    } catch (err) {
      console.error("Admin OTP generation error:", err);
      setAdminError(
        err instanceof Error ? err.message : "Failed to generate admin code.",
      );
      toast.error("Failed to generate admin verification code.", {
        duration: 5000,
      });
    }
    setAdminLoading(false);
  }, [generateAdminOtpMutation, startAdminResendCooldown]);

  // Verify admin OTP
  const handleAdminOtpVerify = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    try {
      await verifyAdminOtpMutation({ code: adminOtp });
      toast.success("Admin access granted! Redirecting...", { duration: 3000 });
      setStep("adminSuccess");
      // Small delay so user sees the success state before redirect
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err) {
      console.error("Admin OTP verification error:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("expired")) {
        setAdminError("This code has expired. Please request a new one.");
      } else if (msg.includes("Incorrect")) {
        setAdminError("Incorrect verification code. Please try again.");
      } else {
        setAdminError("Verification failed. Please try again.");
      }
      setAdminOtp("");
    }
    setAdminLoading(false);
  };

  // Resend admin OTP
  const handleAdminResend = async () => {
    if (adminResendCooldown > 0) return;
    setAdminLoading(true);
    setAdminError(null);
    setAdminOtp("");
    try {
      const result = await generateAdminOtpMutation();
      if (result.alreadyAdmin) {
        setStep("adminSuccess");
      } else {
        toast.success("New admin code sent!", { duration: 4000 });
        startAdminResendCooldown();
      }
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : "Failed to resend code.",
      );
    }
    setAdminLoading(false);
  };

  // Cancel admin flow and go back
  const handleAdminCancel = async () => {
    await cancelAdminOtpMutation().catch(() => {});
    setRequestAdminAccess(false);
    setStep("signIn");
    setAdminOtp("");
    setAdminError(null);
    setIsLoading(false);
    setOtp("");
    setError(null);
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: { credential?: string }) => {
      if (!credentialResponse.credential) {
        setError("Google sign-in failed: no credential received.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await signIn("google", {
          idToken: credentialResponse.credential,
        });
        if (requestAdminAccess) {
          // Google sign-in succeeded — trigger admin OTP generation
          adminFlowHandled.current = true;
          handleAdminOtpGenerate();
          setIsLoading(false);
          return;
        }
        navigate(redirect);
      } catch (error) {
        console.error("Google sign-in error:", error);
        setError(
          `Google sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setIsLoading(false);
      }
    },
    [signIn, navigate, redirect, requestAdminAccess, handleAdminOtpGenerate],
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col">
      {/* Subtle warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/[0.03] blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img
            src="/assets/4-2.svg"
            alt="Etherstar Jewels"
            width={36}
            height={36}
            decoding="async"
            className="h-9 w-9 rounded-sm object-contain"
          />
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-[0.15em] text-[#1A202C] leading-tight">
              ETHERSTAR
            </span>
            <span className="text-[10px] font-light tracking-[0.35em] text-[#D4AF37] uppercase leading-tight">
              Jewels
            </span>
          </div>
        </Link>
      </nav>

      {/* Auth Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-[#E5E2DD] bg-white shadow-sm overflow-hidden">
            {/* ──────────────── SIGN-IN STEP ──────────────── */}
            {step === "signIn" && (
              <>
                <div className="p-8 pb-6 text-center">
                  <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
                    Welcome
                  </h1>
                  <p className="mt-2 text-sm text-[#1A202C]/40">
                    Enter your email to sign in or create an account
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit}>
                  <div className="px-8 pb-8 space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A202C]/25" />
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        disabled={isLoading}
                        required
                        className="w-full rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] pl-10 pr-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#1A202C] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A202C]/20 hover:shadow-[#1A202C]/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Continue with Email
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E5E2DD]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-[#1A202C]/25">
                          or
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                      className="w-full rounded-xl border border-[#E5E2DD] bg-[#F9F8F6] py-3 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] hover:text-[#1A202C] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserX className="h-4 w-4" />
                      Continue as Guest
                    </button>

                    {/* Google Sign-In — only rendered when VITE_GOOGLE_CLIENT_ID is configured */}
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E5E2DD]" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-[#1A202C]/25">
                              or continue with
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                              setError("Google sign-in failed. Please try again.");
                            }}
                            shape="rectangular"
                            size="large"
                            width={300}
                            theme="outline"
                            text="continue_with"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* ──────────────── EMAIL OTP STEP ──────────────── */}
            {step !== "signIn" && step !== "adminOtp" && step !== "adminSuccess" && (
              <>
                <div className="p-8 pb-6 text-center">
                  <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
                    Check Your Email
                  </h1>
                  <p className="mt-2 text-sm text-[#1A202C]/40">
                    We sent a 6-digit code to
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#D4AF37]">
                    {step.email}
                  </p>
                  {successMsg && (
                    <p className="mt-2 text-xs text-emerald-600">
                      {successMsg}
                    </p>
                  )}
                </div>

                {/* Test-mode fallback: shown only when Resend could not deliver */}
                {deliveryStatus && !deliveryStatus.delivered && (
                  <div className="mx-8 mb-6 rounded-xl border border-dashed border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/70">
                      Test Mode Code
                    </p>
                    <p className="mt-1.5 text-2xl font-bold tracking-[0.35em] text-[#1A202C]">
                      {deliveryStatus.code}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#1A202C]/40">
                      Email delivery is unavailable right now — enter the code
                      above to sign in. It expires in 10 minutes.
                    </p>
                  </div>
                )}

                <form onSubmit={handleOtpSubmit}>
                  <div className="px-8 pb-8 space-y-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otp[i] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const newOtp =
                              otp.substring(0, i) + val + otp.substring(i + 1);
                            setOtp(newOtp.substring(0, 6));
                            const tgt = e.target as HTMLInputElement;
                            if (val && tgt.nextElementSibling) {
                              (
                                tgt.nextElementSibling as HTMLInputElement
                              ).focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (
                              e.key === "Backspace" &&
                              !otp[i] &&
                              target.previousElementSibling
                            ) {
                              (
                                target.previousElementSibling as HTMLInputElement
                              ).focus();
                            }
                            if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                              const form = (
                                e.target as HTMLElement
                              ).closest("form");
                              if (form) form.requestSubmit();
                            }
                          }}
                          disabled={isLoading}
                          className="h-12 w-12 rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] text-center text-lg font-medium text-[#1A202C] focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
                        />
                      ))}
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="w-full rounded-xl bg-[#1A202C] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A202C]/20 hover:shadow-[#1A202C]/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Verify Code
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="flex flex-col items-center gap-2 mt-2">
                      <p className="text-sm text-[#1A202C]/30">
                        Didn't receive a code?{" "}
                        <button
                          type="button"
                          onClick={async () => {
                            if (resendCooldown > 0) return;
                            setIsLoading(true);
                            setError(null);
                            setSuccessMsg(null);
                            setOtp("");
                            deliveryNotified.current = false;
                            try {
                              const fd = new FormData();
                              fd.set("email", step.email);
                              await signIn("email-otp", fd);
                              setSuccessMsg("New code sent! Check your inbox.");
                              startResendCooldown();
                            } catch (err) {
                              console.error("Resend error:", err);
                              const msg = err instanceof Error ? err.message : "";
                              handleSendError(
                                msg || "Failed to resend code. Please try again.",
                              );
                            }
                            setIsLoading(false);
                          }}
                          className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#D4AF37]"
                          disabled={isLoading || resendCooldown > 0}
                        >
                          {resendCooldown > 0
                            ? `Resend code in ${resendCooldown}s`
                            : "Resend code"}
                        </button>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("signIn");
                          setOtp("");
                          setError(null);
                          setSuccessMsg(null);
                          setRequestAdminAccess(false);
                        }}
                        className="text-xs text-[#1A202C]/25 hover:text-[#D4AF37] transition-colors"
                      >
                        Use a different email
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {/* ──────────────── ADMIN OTP VERIFICATION STEP ──────────────── */}
            {step === "adminOtp" && (
              <>
                <div className="p-8 pb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
                    <ShieldCheck className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                  <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
                    Admin Verification
                  </h1>
                  <p className="mt-2 text-sm text-[#1A202C]/40 leading-relaxed">
                    A 6-digit code has been sent to the company email.
                    <br />
                    Ask your administrator for the code to complete admin access.
                  </p>
                </div>

                {/* Dev Mode fallback — shows the actual code when email delivery fails */}
                {adminOtpStatus && !adminOtpStatus.delivered && (
                  <div className="mx-8 mb-6 rounded-xl border border-dashed border-[#D4AF37]/50 bg-[#D4AF37]/[0.06] px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/70">
                      Dev Mode — Admin Code
                    </p>
                    <p className="mt-1.5 text-2xl font-bold tracking-[0.35em] text-[#1A202C]">
                      {adminOtpStatus.code}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#1A202C]/40">
                      Email delivery is unavailable — enter the code above to
                      gain admin access. Expires in 10 minutes.
                    </p>
                  </div>
                )}

                {adminOtpStatus && adminOtpStatus.delivered && (
                  <div className="mx-8 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                    <p className="text-[11px] leading-relaxed text-emerald-700">
                      ✓ Code sent to company email ({COMPANY_ADMIN_EMAIL_DISPLAY}).
                      Ask your admin for the code.
                    </p>
                  </div>
                )}

                <form onSubmit={handleAdminOtpVerify}>
                  <div className="px-8 pb-8 space-y-4">
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={adminOtp[i] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const newCode =
                              adminOtp.substring(0, i) +
                              val +
                              adminOtp.substring(i + 1);
                            setAdminOtp(newCode.substring(0, 6));
                            const tgt = e.target as HTMLInputElement;
                            if (val && tgt.nextElementSibling) {
                              (
                                tgt.nextElementSibling as HTMLInputElement
                              ).focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (
                              e.key === "Backspace" &&
                              !adminOtp[i] &&
                              target.previousElementSibling
                            ) {
                              (
                                target.previousElementSibling as HTMLInputElement
                              ).focus();
                            }
                            if (
                              e.key === "Enter" &&
                              adminOtp.length === 6 &&
                              !adminLoading
                            ) {
                              const form = (
                                e.target as HTMLElement
                              ).closest("form");
                              if (form) form.requestSubmit();
                            }
                          }}
                          disabled={adminLoading}
                          className="h-12 w-12 rounded-xl bg-[#F9F8F6] border border-[#E5E2DD] text-center text-lg font-medium text-[#1A202C] focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
                        />
                      ))}
                    </div>

                    {adminError && (
                      <p className="text-sm text-red-500 text-center">
                        {adminError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={adminLoading || adminOtp.length !== 6}
                      className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {adminLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify Admin Code
                        </>
                      )}
                    </button>

                    <div className="flex flex-col items-center gap-2 mt-2">
                      <p className="text-sm text-[#1A202C]/30">
                        Didn't receive a code?{" "}
                        <button
                          type="button"
                          onClick={handleAdminResend}
                          className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#D4AF37]"
                          disabled={adminLoading || adminResendCooldown > 0}
                        >
                          {adminResendCooldown > 0
                            ? `Resend code in ${adminResendCooldown}s`
                            : "Resend code"}
                        </button>
                      </p>
                      <button
                        type="button"
                        onClick={handleAdminCancel}
                        className="flex items-center gap-1 text-xs text-[#1A202C]/25 hover:text-[#D4AF37] transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to sign in
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {/* ──────────────── ADMIN SUCCESS STEP ──────────────── */}
            {step === "adminSuccess" && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <ShieldCheck className="h-7 w-7 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-light tracking-tight text-[#1A202C]">
                  Admin Access Granted
                </h1>
                <p className="mt-2 text-sm text-[#1A202C]/40">
                  Redirecting to the admin dashboard...
                </p>
                <div className="mt-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37] mx-auto" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-[#1A202C]/25 hover:text-[#1A202C]/50 transition-colors"
            >
              ← Back to Etherstar Jewels
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Display-only constant for the company email shown in the admin OTP UI. */
const COMPANY_ADMIN_EMAIL_DISPLAY = "etherstarjewels@gmail.com";

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
