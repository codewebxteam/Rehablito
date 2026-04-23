"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Lock, Mail, Eye, EyeOff, Fingerprint, Phone, KeyRound, Stethoscope } from "lucide-react";
import { useState } from "react";
import SplitLayout from "./SplitLayout";
import { useAuth } from "../context/AuthContext";

type LoginTab = 'admin' | 'staff';

export default function Login() {
  const [tab, setTab] = useState<LoginTab>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login, requestOtp, verifyOtp, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffId, setStaffId] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestOtp(staffId, mobile);
    if (ok) setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp(staffId, otp);
  };

  const leftContent = (
    <div className="absolute bottom-12 left-0 max-w-xl p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10">
        <span className="w-2 h-2 rounded-full bg-brand-sage shadow-[0_0_8px_rgba(78,110,93,0.8)]"></span>
        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Premium Care Management</span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        className="font-headline text-4xl md:text-5xl lg:text-6xl text-white font-extrabold leading-tight tracking-tight mb-4">
        Clinical Precision. <br /><span className="text-secondary-fixed">Human Heart.</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
        className="text-white/80 text-lg leading-relaxed max-w-md font-medium">
        Empowering therapy providers with intuitive tools that put patient recovery and human connection at the center.
      </motion.p>
    </div>
  );

  const rightContent = (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-sage flex items-center justify-center shadow-lg shadow-brand-sage/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-on-background italic">Rehablito.</span>
        </div>
        <h2 className="text-3xl font-bold text-on-background tracking-tight">Welcome Back</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Sign in to your workspace.</p>
      </div>

      {/* Tab switcher */}
      <div className="p-1.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex relative mb-8 overflow-hidden">
        <motion.div
          className="absolute h-[calc(100%-12px)] rounded-xl bg-white shadow-sm z-0 top-[6px] left-[6px]"
          initial={false}
          animate={{ x: tab === 'admin' ? '0%' : '100%' }}
          style={{ width: 'calc(50% - 6px)' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button onClick={() => { setTab('admin'); }} className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${tab === 'admin' ? 'text-brand-sage' : 'text-outline hover:text-on-surface'}`}>
          Admin / Manager
        </button>
        <button onClick={() => { setTab('staff'); setOtpSent(false); }} className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${tab === 'staff' ? 'text-brand-sage' : 'text-outline hover:text-on-surface'}`}>
          Staff
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'admin' ? (
          <motion.form key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-5" onSubmit={handleAdminLogin}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-background ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
                <input className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
                  type="email" placeholder="admin@rehablito.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-background ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
                <input className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
                  type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button className="w-full py-4 px-6 bg-brand-sage text-white font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.form>
        ) : (
          <motion.form key="staff" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-5" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            <AnimatePresence mode="popLayout">
              {!otpSent ? (
                <motion.div key="id-phone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-background ml-1">Staff ID</label>
                    <div className="relative group">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
                      <input className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
                        type="text" placeholder="ST-001" value={staffId} onChange={e => setStaffId(e.target.value)} required disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-background ml-1">Mobile Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
                      <input className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
                        type="tel" placeholder="9876543210" value={mobile} onChange={e => setMobile(e.target.value)} required disabled={loading} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                  <div className="p-4 bg-secondary-container/10 border border-secondary/20 rounded-xl">
                    <p className="text-xs text-secondary-fixed-variant font-medium leading-relaxed">
                      Enter the 6-digit code sent to <span className="font-bold">***{mobile.slice(-3)}</span>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="block text-sm font-bold text-on-background">Access Code</label>
                      <button type="button" onClick={() => setOtpSent(false)} className="text-sm font-bold text-brand-sage hover:underline">Change</button>
                    </div>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
                      <input className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50 tracking-[0.5em] text-lg font-black"
                        type="text" maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} required autoFocus disabled={loading} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button className="w-full py-4 px-6 bg-brand-sage text-white font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              type="submit" disabled={loading}>
              {loading ? "Verifying..." : otpSent ? "Access Portal" : "Get Access Code"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {otpSent && (
              <p className="text-center text-xs text-outline font-medium">
                Didn't receive? <button type="button" onClick={handleSendOtp} className="text-brand-sage font-bold hover:underline">Resend</button>
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>

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
      leftBgImage="https://lh3.googleusercontent.com/aida-public/AB6AXuDr2CcuQ2VBg2B0_SpHUAaWN0JbO2zhABMYgtYo7YEPBi-t8oYCof0L0Pnqi5S4fR-JfhT-ctgstTdw2itxRmTl3ydbSS8rXoOZl3Eh7YzQ9R820cKHqlGiwIVlqwUy8PSAfLnPmhFUP0C-nYG71fWEN2mLbDqg6YgukCDPJYOONxUc-inGk2y6hZP_0OpTBSd8W-7kOx_B8qfNW2nOnJrTWCw7to99IFUvWlXvFSGq2aQ1UsD5o2VG9BS7JWFavWu0lRimZh9MD48p"
    />
  );
}
