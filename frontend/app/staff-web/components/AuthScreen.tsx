"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Badge, CheckCircle2, ArrowRight, HelpCircle, Stethoscope, TrendingUp } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, verifyOtp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [staffId, setStaffId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);

  const handleStaffIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(staffId);
      setConfirmedName(user.name);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(otp);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex w-1/2 flex-col justify-center p-12 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent"></div>
        
        <div className="relative z-10 space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center text-primary shadow-lg">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-extrabold tracking-tight text-white">Rehablito</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-extrabold text-white leading-tight">
              Precision Healthcare <br /> Starts with Our Staff.
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Your professional expertise is the foundation of patient care. Access your dashboard to manage shifts, view clinical updates, and connect with your team.
            </p>
          </div>

          <div className="relative mt-12 rounded-xl overflow-hidden shadow-2xl group">
            <img 
              src="https://picsum.photos/seed/medical/800/450" 
              alt="Medical Staff" 
              className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass-card p-6 rounded-xl border border-white/20 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-on-surface-variant text-sm font-semibold mb-1 uppercase tracking-wider">Active Shift Stats</p>
                  <p className="text-on-surface text-xl font-bold font-headline">98.4% Efficiency Rate</p>
                </div>
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 md:px-12 lg:px-24 bg-surface relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-100 via-primary/5 to-transparent lg:hidden"></div>
        
        <div className="w-full max-w-md space-y-10">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-secondary"></div>
                      <div className="h-1.5 w-12 rounded-full bg-surface-container-highest"></div>
                      <div className="h-1.5 w-12 rounded-full bg-surface-container-highest"></div>
                    </div>
                    <span className="text-on-surface-variant text-xs font-semibold tracking-widest uppercase">Step 1 of 3</span>
                  </div>
                  <h2 className="font-headline text-3xl font-bold text-on-surface">Staff Identity Verification</h2>
                  <p className="text-on-surface-variant">Please enter your unique Staff ID to begin the secure onboarding process.</p>
                </div>

                <form onSubmit={handleStaffIdSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider ml-1" htmlFor="staff-id">Staff Identification Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                        <Badge className="w-5 h-5" />
                      </div>
                      <input 
                        className="block w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all text-on-surface placeholder:text-outline/50"
                        id="staff-id"
                        placeholder="HC-000-0000"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        required
                      />
                      {confirmedName && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-secondary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  {confirmedName && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-secondary/10 border border-secondary-container/20 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="text-secondary mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-on-secondary-container font-bold text-sm">Staff Identity Confirmed</p>
                        <p className="text-on-surface-variant text-xs leading-relaxed">
                          System match found for <span className="font-bold text-on-surface">{confirmedName}</span>. Please proceed to security setup.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4">
                    <button 
                      type={confirmedName ? "button" : "submit"}
                      onClick={confirmedName ? () => setStep(2) : undefined}
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-secondary to-secondary-container text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? "Verifying..." : confirmedName ? "Continue to Security" : "Verify Staff ID"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-secondary"></div>
                      <div className="h-1.5 w-12 rounded-full bg-secondary"></div>
                      <div className="h-1.5 w-12 rounded-full bg-surface-container-highest"></div>
                    </div>
                    <span className="text-on-surface-variant text-xs font-semibold tracking-widest uppercase">Step 2 of 3</span>
                  </div>
                  <h2 className="font-headline text-3xl font-bold text-on-surface">Security Verification</h2>
                  <p className="text-on-surface-variant">We&apos;ve sent a 6-digit verification code to your registered mobile number.</p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider ml-1" htmlFor="otp">Verification Code</label>
                    <input 
                      className="block w-full px-4 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all text-on-surface text-center text-2xl tracking-[1em] font-bold placeholder:text-outline/30"
                      id="otp"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? "Verifying..." : "Complete Verification"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
                  >
                    Back to Staff ID
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 border-t border-surface-container-highest">
            <button className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Identity Help
            </button>
            <button onClick={() => { setStep(1); setConfirmedName(null); setStaffId(''); }} className="text-primary hover:underline text-sm font-semibold">
              Switch User
            </button>
          </div>

          <footer className="pt-12 text-center">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest leading-loose">
              SECURED BY REHABLITO INFRASTRUCTURE<br />
              © 2024 CLINICAL SYSTEMS INC.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
