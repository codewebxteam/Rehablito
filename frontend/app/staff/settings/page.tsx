"use client";

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  CreditCard, 
  LogOut,
  ChevronRight,
  X,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '@/lib/api';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariant = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Async state
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const profileRows = [
    { label: 'Full Name', value: user?.name, icon: UserIcon },
    { label: 'Email Address', value: user?.email, icon: Mail },
    { label: 'Phone Number', value: user?.mobile, icon: Phone },
    { label: 'Staff ID', value: user?.staffId || 'RHB-STF-001', icon: CreditCard },
  ];

  const resetModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setError('');
    setShowPasswordModal(false);
  };

  const handleUpdatePassword = async () => {
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Both fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current.');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully!');
      resetModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update password. Try again.';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-28 pt-2 space-y-5"
    >
      {/* Compact Avatar + Name Header */}
      <motion.div variants={itemVariant} className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center">
          <UserIcon className="w-7 h-7 text-primary/60" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-on-surface tracking-tight">{user?.name || 'Staff Member'}</p>
          <p className="text-[11px] text-on-surface-variant/50 font-medium mt-0.5">{user?.staffId || 'RHB-STF-001'} · {user?.role || 'Staff'}</p>
        </div>
      </motion.div>

      {/* Profile Details */}
      <motion.div variants={itemVariant}>
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest px-1 mb-2">Account Info</p>
        <div className="bg-surface-container-low rounded-2xl overflow-hidden divide-y divide-outline-variant/8">
          {profileRows.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div key={idx} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  {Icon && <Icon className="w-4 h-4 text-primary/70" strokeWidth={1.75} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-on-surface-variant/40 uppercase tracking-wider leading-none mb-0.5">{row.label}</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{row.value || '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariant}>
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest px-1 mb-2">Actions</p>
        <div className="bg-surface-container-low rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-4 h-4 text-secondary/70" strokeWidth={1.75} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold text-on-surface">Change Password</span>
            <ChevronRight className="w-4 h-4 text-on-surface-variant/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </motion.div>

      {/* Standalone Logout Button */}
      <motion.div variants={itemVariant}>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-error/8 border border-error/15 text-error hover:bg-error/12 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-sm font-bold tracking-wide">Logout</span>
        </button>
      </motion.div>

      <motion.div variants={itemVariant}>
        <p className="text-center text-[10px] text-on-surface-variant/25 font-medium">Rehablito RMS · v2.4.1</p>
      </motion.div>

      {/* Change Password Bottom Sheet */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetModal}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl px-6 pt-5 pb-10"
            >
              {/* Handle */}
              <div className="w-8 h-1 bg-outline-variant/30 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-on-surface tracking-tight">Change Password</h3>
                <button
                  onClick={resetModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Info banner */}
                <div className="flex gap-2.5 p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                  <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Use a strong, unique password. Min. 6 characters.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2.5 p-3 bg-error/8 rounded-xl border border-error/15"
                    >
                      <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                      <p className="text-xs text-error leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>


                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isUpdating}
                      className="w-full pl-4 pr-11 py-3 bg-surface-container-low border border-outline-variant/15 rounded-xl outline-none focus:border-primary/40 transition-all text-sm font-medium disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isUpdating}
                      className="w-full pl-4 pr-11 py-3 bg-surface-container-low border border-outline-variant/15 rounded-xl outline-none focus:border-primary/40 transition-all text-sm font-medium disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleUpdatePassword}
                  disabled={isUpdating}
                  className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUpdating ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
