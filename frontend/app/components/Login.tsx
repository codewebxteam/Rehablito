"use client";
import { motion } from "motion/react";
import { ArrowRight, Lock, Mail, Stethoscope, TrendingUp, Eye, ChevronDown, ShieldCheck, GitBranch, UserRound, Stethoscope as TherapistIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SplitLayout from "./SplitLayout";

const roles = [
  {
    value: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    description: "Full system access",
  },
  {
    value: "branch_manager",
    label: "Branch Manager",
    icon: GitBranch,
    description: "Manage branch operations",
  },
  {
    value: "staff_therapist",
    label: "Staff / Therapist",
    icon: TherapistIcon,
    description: "Clinical & therapy workflows",
  },
  {
    value: "user",
    label: "User",
    icon: UserRound,
    description: "Patient / general access",
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setDropdownOpen(false);
  };

  const leftContent = (
    <div className="absolute bottom-12 left-0 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10"
      >
        <span className="w-2 h-2 rounded-full bg-brand-sage shadow-[0_0_8px_rgba(78,110,93,0.8)]"></span>
        <span className="text-white text-[10px] font-label uppercase tracking-widest">Human-Centric Tech</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="font-headline text-4xl md:text-5xl lg:text-6xl text-white font-extrabold leading-tight tracking-tight mb-4"
      >
        Clinical Precision. <br />
        <span className="text-secondary-fixed">Human Heart.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="text-white/80 text-lg leading-relaxed font-body max-w-md"
      >
        Empowering therapy providers with intuitive tools that put patient recovery and human connection at the center of every workflow.
      </motion.p>

      {/* Floating UI Snippet */}
      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 3 }}
        animate={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
        className="hidden lg:block absolute -top-48 -right-12 w-64 p-6 rounded-xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recovery Trend</span>
          <TrendingUp className="w-4 h-4 text-brand-sage" />
        </div>
        <div className="h-16 flex items-end gap-1">
          <div className="flex-1 bg-primary/20 h-[40%] rounded-sm"></div>
          <div className="flex-1 bg-primary/30 h-[60%] rounded-sm"></div>
          <div className="flex-1 bg-primary/50 h-[50%] rounded-sm"></div>
          <div className="flex-1 bg-primary h-[90%] rounded-sm"></div>
          <div className="flex-1 bg-brand-sage h-[100%] rounded-sm"></div>
        </div>
        <div className="mt-4 pt-4 border-t border-outline-variant/20">
          <p className="text-[10px] text-on-surface-variant font-medium">Next Milestone: Upper Mobility</p>
        </div>
      </motion.div>
    </div>
  );

  const rightContent = (
    <>
      {/* Brand Anchor */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-sage flex items-center justify-center shadow-lg shadow-brand-sage/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-extrabold tracking-tight text-on-background">Rehablito RMS</span>
        </div>
        <h2 className="text-3xl font-headline font-bold text-on-background mt-8">Welcome back</h2>
        <p className="text-on-surface-variant mt-2 font-body">Please enter your clinical credentials to continue.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Role Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-background ml-1">Role</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between pl-4 pr-4 py-4 bg-surface-container-low border rounded-xl transition-all outline-none text-left
                ${dropdownOpen
                  ? "border-brand-sage ring-4 ring-brand-sage/10"
                  : "border-outline-variant/30 hover:border-outline-variant/60"}
                ${selectedRole ? "text-on-background" : "text-outline"}`}
            >
              <div className="flex items-center gap-3">
                {selectedRole ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-brand-sage/10 flex items-center justify-center flex-shrink-0">
                      <selectedRole.icon className="w-4 h-4 text-brand-sage" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-background leading-none">{selectedRole.label}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{selectedRole.description}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-outline text-sm">Select your role</span>
                )}
              </div>
              <ChevronDown
                className={`w-5 h-5 text-outline flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-brand-sage" : ""}`}
              />
            </button>

            {/* Dropdown Panel */}
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden"
              >
                {roles.map((role, index) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole?.value === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                        ${isSelected
                          ? "bg-brand-sage/8 text-brand-sage"
                          : "hover:bg-surface-container text-on-background"}
                        ${index !== roles.length - 1 ? "border-b border-outline-variant/10" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected ? "bg-brand-sage/15" : "bg-surface-container"}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? "text-brand-sage" : "text-on-surface-variant"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold leading-none ${isSelected ? "text-brand-sage" : "text-on-background"}`}>
                          {role.label}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{role.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-brand-sage flex-shrink-0"></div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-background ml-1" htmlFor="email">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline"
              id="email"
              name="email"
              placeholder="dr.smith@rehablito.com"
              required
              type="email"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-semibold text-on-background" htmlFor="password">Password</label>
            <a className="text-sm font-bold text-brand-sage hover:text-brand-sage/80 transition-colors" href="#">Forgot Password?</a>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline"
              id="password"
              name="password"
              placeholder="Password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          className="w-full py-4 px-6 bg-brand-sage text-white font-headline font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          type="submit"
        >
          Login
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-outline">Or sign in with</span>
          </div>
        </div>

        {/* Social Login */}
        <button
          className="w-full py-3.5 px-6 bg-white border border-outline-variant/30 rounded-xl font-semibold text-on-background hover:bg-surface-container transition-colors flex items-center justify-center gap-3"
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-12 text-center">
        <p className="text-on-surface-variant font-medium">
          Don't have an account?
          <Link href="/signup" className="text-brand-sage font-bold hover:underline ml-1">Sign Up</Link>
        </p>
      </div>
    </>
  );

  return (
    <SplitLayout
      leftContent={leftContent}
      rightContent={rightContent}
      leftBgImage="https://lh3.googleusercontent.com/aida-public/AB6AXuDr2CcuQ2VBg2B0_SpHUAaWN0JbO2zhABMYgtYo7YEPBi-t8oYCof0L0Pnqi5S4fR-JfhT-ctgstTdw2itxRmTl3ydbSS8rXoOZl3Eh7YzQ9R820cKHqlGiwIVlqwUy8PSAfLnPmhFUP0C-nYG71fWEN2mLbDqg6YgukCDPJYOONxUc-inGk2y6hZP_0OpTBSd8W-7kOx_B8qfNW2nOnJrTWCw7to99IFUvWlXvFSGq2aQ1UsD5o2VG9BS7JWFavWu0lRimZh9MD48p"
    />
  );
}
