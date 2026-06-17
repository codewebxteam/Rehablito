"use client";

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, CreditCard, User, MessageSquare, Download, LogOut, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../manager/lib/utils';
import api from '@/lib/api';

// Views
import DashboardView from './views/DashboardView';
import AttendanceView from './views/AttendanceView';
import FeedbackView from './views/FeedbackView';
import ProfileView from './views/ProfileView';
import BillingView from './views/BillingView';

export default function ParentDashboardApp() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetTab, setTargetTab] = useState<string | null>(null);

  const handleTabSwitch = (tabId: string) => {
    if (tabId === activeTab) return;
    setIsNavigating(true);
    setTargetTab(tabId);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsNavigating(false);
      setTargetTab(null);
    }, 50);
  };
  
  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/parent/dashboard');
      if (data.success) setDashboardData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/parent/attendance');
      if (data.success) setAttendanceData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get('/parent/feedbacks');
      if (data.success) setFeedbacks(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/parent/profile');
      if (data.success) setProfileData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBilling = async () => {
    try {
      const { data } = await api.get('/parent/billing');
      if (data.success) setBillingData(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/parent/messages');
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchAttendance(),
        fetchFeedbacks(),
        fetchProfile(),
        fetchBilling(),
        fetchMessages()
      ]);
      setIsLoading(false);
    };
    loadAllData();

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-brand-sage flex items-center justify-center shadow-xl shadow-brand-sage/20 mb-6">
          <Stethoscope className="w-8 h-8 text-white" />
        </motion.div>
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-headline font-bold text-on-surface">Loading Portal</h3>
          <p className="text-sm text-on-surface-variant mt-2 font-medium opacity-60">Fetching child progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface overflow-x-hidden pb-20 md:pb-0 md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-outline-variant/20 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-sage flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black italic">Rehablito.</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSwitch(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative group",
                  isActive 
                    ? "text-brand-sage bg-brand-sage/10 shadow-sm" 
                    : "text-on-surface-variant hover:text-brand-sage hover:bg-brand-sage/5"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors duration-300",
                  isActive ? "bg-brand-sage/20" : "group-hover:bg-brand-sage/10"
                )}>
                  {isNavigating && targetTab === item.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-sage" />
                  ) : (
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-outline-variant/20">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 rounded-xl transition-colors font-medium">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-outline-variant/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-brand-sage to-brand-sage/80 shadow-md shadow-brand-sage/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-lg tracking-tight text-on-surface">Parents Portal</span>
          </div>
          <button onClick={logout} className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95">
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </header>

        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-brand-sage"
            >
              <div className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">Install Rehablito App</p>
                  <p className="text-white/80 text-[10px] font-medium leading-tight mt-0.5">Get the best experience on your phone.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={handleInstallClick}
                    className="px-4 py-1.5 bg-white text-brand-sage text-xs font-black rounded-full shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"
                  >
                    <Download size={14} /> Get
                  </button>
                  <button onClick={() => setShowInstallBanner(false)} className="p-1 text-white/60 hover:text-white">
                    <LogOut className="w-4 h-4 rotate-45" /> {/* Close icon lookalike */}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView data={dashboardData} messages={messages} />}
          {activeTab === 'attendance' && <AttendanceView data={attendanceData} />}
          {activeTab === 'billing' && <BillingView data={billingData} onRefresh={fetchBilling} />}
          {activeTab === 'feedback' && <FeedbackView feedbacks={feedbacks} onRefresh={fetchFeedbacks} patientId={profileData?.patient?.id} />}
          {activeTab === 'profile' && <ProfileView data={profileData} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-2xl border-t border-outline-variant/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" />
        <div className="relative flex justify-around items-center px-2 pb-safe pt-2 h-20">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSwitch(item.id)}
                className="relative flex flex-col items-center justify-center w-full h-full pb-2 active:scale-95 transition-transform group"
              >
                <div className={cn(
                  "relative w-12 h-8 flex items-center justify-center rounded-full mb-1 transition-all duration-300",
                  isActive ? "bg-brand-sage/15 text-brand-sage" : "text-on-surface-variant/70"
                )}>
                  {isNavigating && targetTab === item.id ? (
                    <Loader2 className={cn(
                      "transition-all duration-300 animate-spin",
                      isActive ? "w-5 h-5" : "w-6 h-6 group-hover:scale-110"
                    )} />
                  ) : (
                    <item.icon 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "scale-100" : "scale-100 group-hover:scale-110"
                      )}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicatorParent"
                      className="absolute inset-0 border-2 border-brand-sage rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] tracking-wide transition-all duration-300",
                  isActive ? "font-black text-brand-sage" : "font-semibold text-on-surface-variant/70"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
