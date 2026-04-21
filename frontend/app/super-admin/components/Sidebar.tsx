"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  UsersRound,
  ChevronDown,
  LogOut,
  TreeDeciduous,
  Settings,
  CalendarCheck,
  Wallet,
  AlertCircle,
  X,
  MapPin,
  Check,
  Stethoscope,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SuperAdminTab, TAB_LABELS } from '../lib/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useBranch } from './BranchContext';

interface SidebarProps {
  active: SuperAdminTab;
  onChange: (tab: SuperAdminTab) => void;
}

interface BranchOption {
  _id: string;
  name: string;
}

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { tab: 'dashboard' as const, icon: LayoutDashboard },
      { tab: 'patients'  as const, icon: Users },
      { tab: 'leads'     as const, icon: TrendingUp },
    ],
  },
  {
    title: 'Operations',
    items: [
      { tab: 'staff'      as const, icon: UsersRound },
      { tab: 'attendance' as const, icon: CalendarCheck },
      { tab: 'finance'    as const, icon: Wallet },
    ],
  },
  {
    title: 'System',
    items: [
      { tab: 'branches' as const, icon: TreeDeciduous },
      { tab: 'services' as const, icon: Stethoscope },
      { tab: 'settings' as const, icon: Settings },
    ],
  },
];

export const Sidebar = React.memo(({ active, onChange }: SidebarProps) => {
  const { logout, user } = useAuth();
  const { setBranch, selectedBranchName } = useBranch();
  const initials = (user?.name || 'SA')
    .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    api.get('/admin/branches')
      .then(({ data }) => { if (data.success) setBranches(data.data); })
      .catch(() => {});
  }, []);

  const branchOptions: { id: string | null; name: string }[] = [
    { id: null, name: 'All Branches' },
    ...branches.map(b => ({ id: b._id, name: b.name })),
  ];

  return (
    <>
      {/* ── Sidebar Panel ── */}
      <aside
        className="fixed left-0 top-0 h-screen w-[270px] z-50 flex flex-col bg-white border-r border-slate-100"
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.04)' }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-5">
          <div className="w-11 h-11 rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm shrink-0">
            <img src="/logo.jpeg" alt="Rehablito" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-black text-slate-800 tracking-tight leading-none">Rehablito</p>
            <p className="text-[9.5px] font-bold text-emerald-500 tracking-wide mt-0.5 leading-none">Physio &amp; Autism Center</p>
            <p className="text-[8.5px] font-medium text-slate-400 mt-0.5 leading-none truncate">Everyone Deserves Trusted Hands...</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-slate-100 mb-4" />

        {/* ── Branch Switcher ── */}
        <div className="px-4 mb-5 relative">
          <button
            onClick={() => setIsBranchMenuOpen(p => !p)}
            className={cn(
              'w-full rounded-2xl px-3.5 py-3 flex items-center gap-3 border transition-all duration-200 text-left',
              isBranchMenuOpen
                ? 'border-primary/30 bg-primary/5 shadow-sm'
                : 'border-slate-100 bg-slate-50 hover:border-primary/20 hover:bg-slate-50'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              isBranchMenuOpen ? 'bg-primary/10 text-primary' : 'bg-white text-slate-400 shadow-sm border border-slate-100'
            )}>
              <MapPin size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">Current Branch</p>
              <p className="text-[12.5px] font-bold text-slate-700 truncate leading-none">{selectedBranchName}</p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-slate-400 transition-all duration-300 shrink-0',
                isBranchMenuOpen && 'rotate-180 text-primary'
              )}
            />
          </button>

          {/* Branch Dropdown */}
          <AnimatePresence>
            {isBranchMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute left-4 right-4 mt-1.5 z-50 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/60"
              >
                <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto sidebar-scroll">
                  {branchOptions.map(opt => {
                    const isSelected = selectedBranchName === opt.name;
                    return (
                      <button
                        key={opt.name}
                        onClick={() => { setBranch(opt.id, opt.name); setIsBranchMenuOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-[12.5px] font-semibold',
                          isSelected
                            ? 'bg-primary/8 text-primary'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        <div className={cn(
                          'w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border transition-colors',
                          isSelected ? 'bg-primary border-primary' : 'border-slate-200'
                        )}>
                          {isSelected && <Check size={9} strokeWidth={3} className="text-white" />}
                        </div>
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-5 sidebar-scroll">
          {NAV_GROUPS.map((group, gIdx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: gIdx * 0.06 }}
            >
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {NAV_GROUPS[gIdx].items.map(item => {
                  const isActive = active === item.tab;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => onChange(item.tab)}
                      className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                    >
                      {/* Active background */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-bg"
                          className="absolute inset-0 rounded-xl bg-primary/8"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}

                      {/* Hover bg */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-transparent group-hover:bg-slate-50 transition-colors duration-150" />
                      )}

                      {/* Active left bar */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-bar"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100'
                      )}>
                        <Icon size={16} />
                      </div>

                      {/* Label */}
                      <span className={cn(
                        'relative z-10 text-[13px] tracking-tight transition-colors duration-150',
                        isActive ? 'font-bold text-primary' : 'font-medium text-slate-500 group-hover:text-slate-700'
                      )}>
                        {TAB_LABELS[item.tab]}
                      </span>

                      {/* Active dot */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-dot"
                          className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </nav>

        {/* ── User Footer ── */}
        <div className="px-4 pb-5 pt-3">
          <div className="mx-1 h-px bg-slate-100 mb-3" />
          <div className="flex items-center gap-3 px-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md shadow-primary/20"
                style={{ background: 'linear-gradient(135deg, #004ac6, #2563eb)' }}
              >
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold text-slate-700 truncate leading-none">{user?.name || 'Super Admin'}</p>
              <p className="text-[9.5px] font-black text-primary uppercase tracking-wider mt-0.5 leading-none">
                {user?.role === 'super_admin' ? 'Global Access' : user?.role || 'Global Access'}
              </p>
            </div>

            {/* Logout button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Logout Confirmation ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl shadow-slate-200 p-8 z-10"
            >
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Sign Out?</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">You'll be redirected to the login page.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full pt-1">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2.5 bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-200 hover:bg-rose-600 transition-all text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
Sidebar.displayName = 'Sidebar';
