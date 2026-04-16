"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Users, 
  Settings, 
  Timer as TimerIcon, 
  LogOut, 
  HelpCircle, 
  Bell, 
  Moon, 
  Search, 
  LogIn,
  ClipboardList,
  FileBarChart,
  Calendar,
  AlertTriangle,
  X,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSearch } from '../context/SearchContext';

import { MobileNav } from './MobileNav';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const { 
    activeRecord, 
    checkIn, 
    elapsedTime,
    isInsideOffice
  } = useAttendance();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    console.log("Sidebar Clock In button clicked");
    if (!activeRecord && isInsideOffice) {
      checkIn('General Ward');
      router.push('/staff/attendance');
    } else if (activeRecord) {
      router.push('/staff/attendance');
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/staff/dashboard' },
    { id: 'attendance', icon: CalendarDays, label: 'Attendance', path: '/staff/attendance' },
    { id: 'history', icon: Clock, label: 'History', path: '/staff/history' },
  ];

  return (
    <div className="flex min-h-screen bg-surface-container-lowest font-sans selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className={cn(
        "w-72 bg-surface-container-low border-r border-outline-variant/10 flex flex-col fixed h-full z-50 transition-transform duration-300",
        "hidden lg:flex translate-x-0"
      )}>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center">
                  <div className="w-14 h-14 flex-shrink-0 rounded-md">
                    <img src="/logo.jpeg" alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xl font-extrabold font-display text-on-surface tracking-tighter leading-none">Rehablito</span>
                    <span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none mt-1">Physio & Autism Center</span>
                    <span className="text-[9px] font-bold text-on-surface leading-none mt-1">Everyone Deserves Trusted Hands...</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 rounded-xl group active:scale-[0.98]",
                      isActive 
                        ? "text-primary bg-primary/5 border-r-4 border-primary" 
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-6 space-y-4 border-t border-outline-variant/10 bg-surface-container-low">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm glass-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Active Shift</span>
              {activeRecord && <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>}
            </div>
            <div className="text-2xl font-headline font-black text-on-surface mb-4">
              {formatTime(elapsedTime)}
            </div>
            <button 
              onClick={handleClockIn}
              disabled={!isInsideOffice && !activeRecord}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.95] disabled:opacity-50",
                activeRecord 
                  ? "bg-surface-container-high text-on-surface-variant" 
                  : "primary-gradient text-white shadow-md hover:shadow-lg"
              )}
            >
              {activeRecord ? <Clock className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {activeRecord ? "View Shift" : "Clock In Now"}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <Link 
              href="/staff/help"
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-on-surface-variant font-medium hover:bg-surface-container-high rounded-xl transition-all",
                pathname === "/staff/help" && "text-primary bg-primary/5"
              )}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help Center</span>
            </Link>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-4 py-3 text-error font-medium hover:bg-error/5 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        <header className="h-16 lg:h-20 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/10 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex lg:hidden items-center gap-2.5">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-base font-black font-display text-on-surface leading-tight tracking-tight">Rehablito</span>
                <span className="text-[9px] font-bold text-[#7dce82] uppercase tracking-wide -mt-0.5">Physio & Autism</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-surface-container-lowest"></span>
              </button>
              <button className="hidden sm:flex p-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all">
                <Moon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-6 w-px bg-outline-variant/20 mx-1"></div>

            <div className="flex items-center gap-3 pl-1 lg:pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface">{user?.name}</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{user?.staffId}</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-primary/10 bg-surface-container-high shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface font-bold bg-primary/5 text-primary">
                    {user?.name?.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full pb-32 lg:pb-8">
          {children}
        </div>
      </main>

      <MobileNav />

      {/* Logout Modal remains same */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><AlertTriangle className="w-8 h-8" /></div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold">Confirm Logout</h3>
                  <p className="text-on-surface-variant">Are you sure you want to log out?</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button onClick={() => setShowLogoutConfirm(false)} className="px-6 py-3 bg-surface-container-low rounded-xl font-bold">Cancel</button>
                  <button onClick={() => { logout(); router.push('/'); }} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20">Logout</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

