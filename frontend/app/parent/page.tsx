"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, MessageSquare, User, LogOut, Stethoscope, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
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
  
  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left",
                activeTab === item.id 
                  ? "bg-brand-sage text-white shadow-md shadow-brand-sage/20" 
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
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
        <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-sage flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight">Parents Portal</span>
          </div>
          <button onClick={logout} className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-low">
            <LogOut size={20} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView data={dashboardData} messages={messages} />}
          {activeTab === 'attendance' && <AttendanceView data={attendanceData} />}
          {activeTab === 'billing' && <BillingView data={billingData} onRefresh={fetchBilling} />}
          {activeTab === 'feedback' && <FeedbackView feedbacks={feedbacks} onRefresh={fetchFeedbacks} patientId={profileData?.patient?.id} />}
          {activeTab === 'profile' && <ProfileView data={profileData} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                activeTab === item.id ? "text-brand-sage" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
