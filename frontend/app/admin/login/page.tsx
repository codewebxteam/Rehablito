"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Stethoscope } from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginPage() {
  const { adminLogin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminLogin(email, password);
  };

  const leftContent = (
    <div className="absolute bottom-12 left-0 max-w-xl p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-brand-sage shadow-[0_0_12px_rgba(78,110,93,1)]"></span>
        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Super Admin Access</span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        className="font-headline text-4xl md:text-5xl lg:text-6xl text-white font-extrabold leading-tight tracking-tight mb-4 drop-shadow-2xl">
        Central Command. <br /><span className="text-secondary-fixed">Full Control.</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
        className="text-white/80 text-lg leading-relaxed max-w-md font-medium">
        Access the global dashboard to manage all branches, staff, and financials across the organization.
      </motion.p>
    </div>
  );

  const rightContent = (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <div className="hidden sm:flex items-center justify-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-sage flex items-center justify-center shadow-lg shadow-brand-sage/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-on-background italic">Rehablito.</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-brand-sage" />
          <span className="text-xs font-bold uppercase tracking-widest text-brand-sage">Super Admin Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight">Admin Sign In</h2>
        <p className="text-on-surface-variant mt-2 font-medium text-sm sm:text-base">Restricted to authorized administrators only.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-background ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
              type="email" placeholder="admin@rehablito.com" value={email}
              onChange={e => setEmail(e.target.value)} required disabled={loading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-background ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
              type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required disabled={loading}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button
          className="w-full py-4 px-6 bg-brand-sage text-white font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          type="submit" disabled={loading}
        >
          {loading ? "Authenticating..." : "Sign In to Admin Panel"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-outline-variant/20">
        <p className="text-xs text-outline leading-relaxed text-center font-medium">
          Secure, encrypted access powered by Rehablito RMS.
        </p>
      </div>
    </div>
  );

  return (
    <SplitLayout
      leftContent={leftContent}
      rightContent={rightContent}
      leftBgImage="/login.png"
    />
  );
}
