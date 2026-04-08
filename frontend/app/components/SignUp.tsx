"use client";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Mail, User, TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import SplitLayout from "./SplitLayout";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const nameRef     = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const name     = nameRef.current?.value?.trim() ?? "";
    const email    = emailRef.current?.value?.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ name, email, password });
      // Redirect to /login?registered=1 is handled inside AuthContext
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const leftContent = (
    <div className="h-full flex flex-col justify-center space-y-8">
      {/* Brand Anchor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="inline-flex w-fit self-start items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
      >
        <ShieldCheck className="w-5 h-5 text-white" />
        <span className="text-white font-headline font-bold tracking-tight">Rehablito RMS</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="font-headline text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight"
      >
        Transforming <br />
        <span className="text-secondary-fixed">Patient Recovery</span>
      </motion.h1>

      {/* Bento-style Success Stat Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="glass-card p-8 rounded-xl border border-white/20 shadow-2xl max-w-md"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-on-secondary-container" />
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-label font-medium uppercase tracking-wider">Clinical Efficiency</p>
            <p className="text-primary font-headline font-bold text-3xl">98% Recovery Rate</p>
          </div>
        </div>
        <p className="text-on-surface-variant leading-relaxed">
          Join over 500+ rehabilitation centers using our empathetic architecture to streamline clinical workflows and patient outcomes.
        </p>
      </motion.div>
    </div>
  );

  const rightContent = (
    <>
      <div className="mb-10">
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Create your account</h2>
        <p className="text-on-surface-variant font-body">Join our community of elite therapy providers. Register your clinic today.</p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold"
        >
          {error}
        </motion.div>
      )}

      {/* Sign Up Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="signup-fullname">Full Name</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              ref={nameRef}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="signup-fullname"
              placeholder="Dr. Jane Smith"
              type="text"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="signup-email">Work Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              ref={emailRef}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="signup-email"
              placeholder="jane@clinic.com"
              type="email"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="signup-password">Password</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              ref={passwordRef}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="signup-password"
              placeholder="Min. 8 characters"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-outline px-1 leading-tight">Must be at least 8 characters.</p>
        </div>

        <div className="pt-4">
          <button
            className="w-full text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-brand-sage shadow-brand-sage/20 hover:bg-brand-sage/90 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
            id="signup-submit-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer Links */}
      <div className="mt-10 text-center space-y-4">
        <p className="text-on-surface-variant font-body text-sm">
          Already have an account?
          <Link href="/login" className="text-primary font-bold hover:underline ml-1">Login</Link>
        </p>
        <p className="text-[11px] text-outline leading-relaxed max-w-xs mx-auto">
          By signing up, you agree to our <a className="underline" href="#">Terms of Service</a> and <a className="underline" href="#">Privacy Policy</a>.
        </p>
      </div>
    </>
  );

  return (
    <SplitLayout
      leftContent={leftContent}
      rightContent={rightContent}
      leftBgImage="https://lh3.googleusercontent.com/aida-public/AB6AXuDyCi3eDvGUgWoqCTDPIChECRd7EgQr1nkC2B9Ibw-vAz6FTqs6FFQyOW7VcrwdpglixFkEeygbfn6oryDdKHI5MXejh11KXMTYmE7Waz7DY78eIWngqgTeiWk19MpjhleNybCFgZRK29ubahLmrTNCplK-UNFQmJXd99SXl2TcCKirJ40t83gvf--8YeFqoU5wQnASij7WOC-PiMdhCEN1QkVVztEvzL9mCM2v4pciXzpCTPf5EjdvD2KU3lZ2fk30tOwXbM75yZZt"
    />
  );
}
