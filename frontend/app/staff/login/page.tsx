"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Fingerprint, Phone, KeyRound, UserCheck, Stethoscope, ChevronLeft, Lock, Download } from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { useAuth } from "../../context/AuthContext";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function StaffLoginPage() {
  const { requestOtp, verifyOtp, loading } = useAuth();
  const [staffId, setStaffId] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      const ok = await requestOtp(staffId, mobile);
      if (ok) setOtpSent(true);
    } else {
      await verifyOtp(staffId, otp);
    }
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
      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-sage flex items-center justify-center shadow-lg shadow-brand-sage/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-on-background italic">Rehablito.</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="w-5 h-5 text-brand-sage" />
          <span className="text-xs font-bold uppercase tracking-widest text-brand-sage">Staff Portal</span>
        </div>
        <h2 className="text-3xl font-bold text-on-background tracking-tight">Welcome Back</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Sign in to your workspace.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className={otpSent ? "hidden" : "space-y-2"}>
          <label className="block text-sm font-bold text-on-background ml-1">Staff ID</label>
          <div className="relative group">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
              type="text" placeholder="ST-001" value={staffId}
              onChange={e => setStaffId(e.target.value)} required={!otpSent} disabled={loading}
            />
          </div>
        </div>

        <div className={otpSent ? "hidden" : "space-y-2"}>
          <label className="block text-sm font-bold text-on-background ml-1">Mobile Number</label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50"
              type="tel" placeholder="9876543210" value={mobile}
              onChange={e => setMobile(e.target.value)} required={!otpSent} disabled={loading}
            />
          </div>
        </div>

        <div className={otpSent ? "space-y-2" : "hidden"}>
          <div className="flex items-center justify-between ml-1">
            <label className="block text-sm font-bold text-on-background">Access Code</label>
            <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }}
              className="flex items-center gap-1 text-xs font-bold text-brand-sage hover:underline">
              <ChevronLeft className="w-3 h-3" />Change
            </button>
          </div>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline/50 tracking-[0.5em] text-lg font-black"
              type="text" maxLength={6} placeholder="000000" value={otp}
              onChange={e => setOtp(e.target.value)} required={otpSent} disabled={loading}
            />
          </div>
        </div>

        <button
          className="w-full py-4 px-6 bg-brand-sage text-white font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          type="submit" disabled={loading}
        >
          {loading ? (otpSent ? "Verifying..." : "Sending...") : (otpSent ? "Access Portal" : "Sign In")}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {otpSent && (
          <p className="text-center text-xs text-outline font-medium">
            Didn&apos;t receive?{" "}
            <button type="button" onClick={() => requestOtp(staffId, mobile)} className="text-brand-sage font-bold hover:underline">
              Resend
            </button>
          </p>
        )}
      </form>

      {installPrompt && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-6 w-full py-3 px-4 bg-surface-container-low border border-outline-variant/30 hover:border-brand-sage/50 hover:bg-brand-sage/5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold text-brand-sage group"
        >
          <Download className="w-4 h-4" />
          Install Rehablito as an app
        </button>
      )}

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
