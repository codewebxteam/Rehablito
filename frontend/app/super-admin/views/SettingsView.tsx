"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

type FieldKey = 'current' | 'next' | 'confirm';

export const SettingsView = () => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: FieldKey, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleVisibility = (field: FieldKey) => {
    setShow(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const strength = ((): { label: string; score: number; color: string } => {
    const pw = form.next;
    if (!pw) return { label: 'Empty', score: 0, color: 'bg-surface-container-high' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', score, color: 'bg-error' };
    if (score <= 3) return { label: 'Fair', score, color: 'bg-amber-500' };
    return { label: 'Strong', score, color: 'bg-secondary' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.current || !form.next || !form.confirm) {
      toast.error('All fields are required');
      return;
    }
    if (form.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (form.next !== form.confirm) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (form.current === form.next) {
      toast.error('New password must differ from the current one');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await api.post('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      if (data.success) {
        toast.success(data.message || 'Password updated successfully');
        setForm({ current: '', next: '', confirm: '' });
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6 lg:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 sm:p-6 lg:p-8 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-on-surface font-headline">Reset Password</h3>
            <p className="text-sm text-on-surface-variant opacity-70">
              Choose a strong password to keep your admin account secure.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="Current password"
            value={form.current}
            onChange={(v) => handleChange('current', v)}
            visible={show.current}
            onToggle={() => toggleVisibility('current')}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={form.next}
            onChange={(v) => handleChange('next', v)}
            visible={show.next}
            onToggle={() => toggleVisibility('next')}
            autoComplete="new-password"
          />

          {form.next && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant">
                <span>Strength</span>
                <span className={cn(
                  strength.label === 'Strong' ? 'text-secondary' :
                  strength.label === 'Fair' ? 'text-amber-600' : 'text-error'
                )}>
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i <= strength.score ? strength.color : 'bg-surface-container-high'
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <PasswordField
            label="Confirm new password"
            value={form.confirm}
            onChange={(v) => handleChange('confirm', v)}
            visible={show.confirm}
            onToggle={() => toggleVisibility('confirm')}
            autoComplete="new-password"
          />

          {form.confirm && form.next !== form.confirm && (
            <p className="text-xs font-semibold text-error">Passwords do not match.</p>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
            <ShieldCheck size={16} className="text-secondary shrink-0" />
            Your password must be at least 6 characters. Use a mix of letters, numbers, and symbols for best security.
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Lock size={16} />
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
}

const PasswordField = ({ label, value, onChange, visible, onToggle, autoComplete }: PasswordFieldProps) => (
  <label className="block">
    <span className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-70 mb-2">
      {label}
    </span>
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 pr-12 text-sm font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant hover:text-primary transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </label>
);
