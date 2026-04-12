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
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SuperAdminTab, TAB_LABELS } from '../lib/navigation';
import { useAuth } from '@/app/context/AuthContext';

interface SidebarProps {
  active: SuperAdminTab;
  onChange: (tab: SuperAdminTab) => void;
}

interface BranchOption {
  _id: string;
  name: string;
}

export const Sidebar = ({ active, onChange }: SidebarProps) => {
  const { logout, user } = useAuth();
  const initials = (user?.name || 'SA').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await api.get('/admin/branches');
        if (data.success) setBranches(data.data as BranchOption[]);
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const branchOptions = ['All Branches', ...branches.map(b => b.name)];

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { tab: 'dashboard' as const, icon: <LayoutDashboard size={20} /> },
        { tab: 'patients' as const, icon: <Users size={20} /> },
        { tab: 'leads' as const, icon: <TrendingUp size={20} /> },
      ]
    },
    {
      title: 'Operations',
      items: [
        { tab: 'staff' as const, icon: <UsersRound size={20} /> },
        { tab: 'attendance' as const, icon: <CalendarCheck size={20} /> },
        { tab: 'finance' as const, icon: <Wallet size={20} /> },
      ]
    },
    {
      title: 'System',
      items: [
        { tab: 'branches' as const, icon: <TreeDeciduous size={20} /> },
        { tab: 'settings' as const, icon: <Settings size={20} /> },
      ]
    }
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-72 glass z-50 flex flex-col py-8 border-r border-outline-variant/10 shadow-2xl shadow-primary/5">
      {/* Logo */}
      <div className="mb-10 px-8 flex items-center gap-3.5">
        <div className="flex items-center">
          <div className="w-14 h-14 flex-shrink-0 rounded-md">
            <img src="/logo.jpeg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-extrabold font-display text-on-surface tracking-tighter leading-none">Rehablito</span>
            <span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none">Physio & Autism Center</span>
            <span className="text-[9px] font-bold text-on-surface leading-none">Everyone Deserves Trusted Hands...</span>
          </div>
        </div>
      </div>

      {/* Branch Switcher */}
      <div className="mb-10 px-6">
        <div className="relative">
          <button
            onClick={() => setIsBranchMenuOpen((prev) => !prev)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-sm hover:bg-surface-container-low transition-all cursor-pointer group"
          >
            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2.5 ml-1 opacity-60 text-left">Current Branch</label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <TreeDeciduous size={18} />
                </div>
                <span className="text-sm font-bold text-on-surface">{selectedBranch}</span>
              </div>
              <ChevronDown
                size={18}
                className={cn(
                  "text-on-surface-variant group-hover:text-primary transition-all",
                  isBranchMenuOpen && "rotate-180"
                )}
              />
            </div>
          </button>

          <AnimatePresence>
            {isBranchMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl p-1.5 z-40"
              >
                {branchOptions.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsBranchMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedBranch === branch
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    )}
                  >
                    {branch}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-8 overflow-y-auto px-0">
        {navGroups.map((group, groupIdx) => (
          <motion.div 
            key={group.title} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
            className="space-y-1"
          >
            <h3 className="px-8 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 opacity-50">{group.title}</h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => onChange(item.tab)}
                    className={cn(
                      "w-full flex items-center gap-4 px-8 py-3.5 transition-all group relative overflow-hidden",
                      isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    {/* Active Background Gradient */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavBg"
                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Active Indicator Border */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavBorder"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <span className={cn("transition-transform group-hover:scale-110 relative z-10", isActive ? "text-primary" : "text-on-surface-variant")}>
                      {item.icon}
                    </span>
                    <span className="text-sm relative z-10">{TAB_LABELS[item.tab]}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 px-6 pb-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3.5 shadow-sm border border-outline-variant/10">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.role === 'super_admin' ? 'Global Access' : user?.role || 'Global Access'}</p>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="text-on-surface-variant hover:text-error transition-all hover:scale-110 p-1"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-outline" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-on-surface">Confirm Logout</h3>
                  <p className="text-on-surface-variant">
                    Are you sure you want to log out? Any unsaved changes might be lost.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-6 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                    }}
                    className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
