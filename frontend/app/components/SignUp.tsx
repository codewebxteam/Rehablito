"use client";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Mail, User, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import SplitLayout from "./SplitLayout";

export default function SignUp() {
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

      {/* Google Sign Up */}
      <button className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-all duration-200 group mb-8">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
        </svg>
        <span className="font-label font-semibold text-on-surface-variant">Sign Up with Google</span>
      </button>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/30"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-label">
          <span className="bg-white px-4 text-outline">Or register with email</span>
        </div>
      </div>

      {/* Sign Up Form */}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="fullname">Full Name</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="fullname"
              placeholder="Dr. Jane Smith"
              type="text"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="email">Work Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="email"
              placeholder="jane@clinic.com"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-label font-semibold text-on-surface-variant ml-1" htmlFor="password">Password</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
            <input
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline/50 outline-none"
              id="password"
              placeholder="Password"
              type="password"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" type="button">
              <Eye className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-outline px-1 leading-tight">Must be at least 8 characters with one special symbol.</p>
        </div>

        <div className="pt-4">
          <button className="w-full text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-brand-sage shadow-brand-sage/20 hover:bg-brand-sage/90" type="submit">
            Create Account
            <ArrowRight className="w-5 h-5" />
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

