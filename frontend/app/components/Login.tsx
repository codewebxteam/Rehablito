"use client";
import { motion } from "motion/react";
import {
  ArrowRight,
  Lock,
  Mail,
  Stethoscope,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  GitBranch,
  UserRound,
  Stethoscope as TherapistIcon,
  Loader2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SplitLayout from "./SplitLayout";
import { useAuth } from "../context/AuthContext";
import { api } from "@/lib/api";

const roles = [
  {
    value: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    description: "Full system access",
    backendRole: "super_admin",
  },
  {
    value: "branch_manager",
    label: "Branch Manager",
    icon: GitBranch,
    description: "Manage branch operations",
    backendRole: "branch_manager",
  },
  {
    value: "staff_therapist",
    label: "Staff / Therapist",
    icon: TherapistIcon,
    description: "Clinical & therapy workflows",
    backendRole: "staff",
  },
  {
    value: "user",
    label: "User",
    icon: UserRound,
    description: "Patient / general access",
    backendRole: "public_user",
  },
];

type Role = (typeof roles)[number];

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get("registered") === "1";

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    justRegistered ? "Account created! Please log in." : null
  );

  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameRef     = useRef<HTMLInputElement>(null);

  // Super Admin first-time setup mode
  const [adminSetup, setAdminSetup] = useState(false);

  const SelectedRoleIcon = selectedRole?.icon;

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "super_admin") router.push("/super-admin");
      else if (user.role === "branch_manager") router.push("/manager");
    }
  }, [isAuthenticated, user, router]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setDropdownOpen(false);
    setError(null);
    if (role.value !== 'super_admin') setAdminSetup(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email    = emailRef.current?.value?.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Super Admin first-time setup
    if (adminSetup) {
      const name = nameRef.current?.value?.trim() ?? "";
      if (!name) { setError("Please enter your full name."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      setIsLoading(true);
      try {
        const data = await api.post<{ success: boolean; token: string; user: { id: string; name: string; email: string; role: string } }>(
          '/auth/setup-admin',
          { name, email, password }
        );
        // Auto-login after setup
        await login({ email, password, role: 'super_admin' });
        setSuccessMsg("Super Admin account created! Redirecting...");
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Setup failed. An admin account may already exist — try logging in.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const backendRole = selectedRole?.backendRole;
      await login({ email, password, role: backendRole });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
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

      {/* Success / Error Messages */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-brand-sage/10 border border-brand-sage/20 text-brand-sage text-sm font-semibold"
        >
          {successMsg}
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold"
        >
          {error}
        </motion.div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Role Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-background ml-1">Role</label>
          <div className="relative" ref={dropdownRef}>
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
                      {SelectedRoleIcon && <SelectedRoleIcon className="w-4 h-4 text-brand-sage" />}
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
                {roles.map((role: Role, index: number) => {
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

        {/* Super Admin First-Time Setup Toggle */}
        {selectedRole?.value === 'super_admin' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50"
          >
            <p className="text-xs text-amber-700 font-semibold mb-2">
              🛡️ Super Admin access requires a pre-existing account.
            </p>
            <button
              type="button"
              onClick={() => { setAdminSetup(v => !v); setError(null); }}
              className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {adminSetup ? 'Back to Login →' : 'First time? Create Admin Account →'}
            </button>
          </motion.div>
        )}

        {/* Name Field — shown only in admin setup mode */}
        {adminSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-on-background ml-1" htmlFor="admin-name">Full Name</label>
            <div className="relative group">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
              <input
                ref={nameRef}
                className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline"
                id="admin-name"
                name="name"
                placeholder="Super Admin Name"
                type="text"
                autoComplete="name"
              />
            </div>
          </motion.div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-background ml-1" htmlFor="login-email">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              ref={emailRef}
              className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline"
              id="login-email"
              name="email"
              placeholder="dr.smith@rehablito.com"
              required
              type="email"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-semibold text-on-background" htmlFor="login-password">
              {adminSetup ? 'Create Password' : 'Password'}
            </label>
            {!adminSetup && (
              <a className="text-sm font-bold text-brand-sage hover:text-brand-sage/80 transition-colors" href="#">Forgot Password?</a>
            )}
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-brand-sage transition-colors" />
            <input
              ref={passwordRef}
              className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage transition-all outline-none text-on-background placeholder:text-outline"
              id="login-password"
              name="password"
              placeholder={adminSetup ? "Min. 8 characters" : "Password"}
              required
              type={showPassword ? "text" : "password"}
              autoComplete={adminSetup ? "new-password" : "current-password"}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="w-full py-4 px-6 bg-brand-sage text-white font-headline font-bold rounded-xl shadow-lg shadow-brand-sage/25 hover:shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {adminSetup ? 'Creating Account...' : 'Signing in...'}
            </>
          ) : (
            <>
              {adminSetup ? <><UserPlus className="w-5 h-5" /> Create Admin Account</> : <>Login <ArrowRight className="w-5 h-5" /></>}
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-12 text-center">
        <p className="text-on-surface-variant font-medium">
          Don&apos;t have an account?
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
