"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Clock,
  CalendarDays,
  ArrowRight,
  Hourglass,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Zap,
  ShieldCheck,
  Timer,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface DashboardToday {
  isOnDuty: boolean;
  elapsedSeconds: number;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkIn: string | null;
  checkOut: string | null;
  dutyHours: number;
  status: string;
}

interface DashboardMonthly {
  month: string;
  totalHours: number;
  averageHours: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  totalRecorded: number;
}

interface DashboardData {
  profile: { name: string; staffId?: string; email?: string; branch?: { name?: string } | null };
  today: DashboardToday;
  monthly: DashboardMonthly;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/staff/dashboard');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Failed to fetch staff dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const firstName = (user?.name || data?.profile.name || '').split(' ')[0] || 'Member';
  const isOnDuty = !!data?.today.isOnDuty;
  const hasCheckedOut = !!data?.today.hasCheckedOut;
  const branchName = data?.profile.branch?.name;

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-10"
    >
      {/* App Header Section */}
      <motion.div variants={item} className="space-y-1">
        <h3 className="text-3xl font-headline font-black text-on-surface tracking-tight">
          Hello, <span className="text-primary">{firstName}</span>
        </h3>
        <p className="text-sm text-on-surface-variant font-medium opacity-60">
          Ready for your shift today?
        </p>
      </motion.div>

      {/* Primary Action Card: Mobile Optimized */}
      <motion.div variants={item} className="relative">
        <div className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 shadow-2xl transition-all duration-500",
          isOnDuty ? "bg-secondary text-white shadow-secondary/20" : "bg-primary text-white shadow-primary/20"
        )}>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-[10px] font-black uppercase tracking-widest">{isOnDuty ? 'In Progress' : 'New Shift'}</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {format(new Date(), 'EEEE, MMM dd')}
              </div>
            </div>

            <div className="space-y-1">
              {isOnDuty ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Currently Clocked In</p>
                  <h4 className="text-4xl font-headline font-black tracking-tighter">
                    {formatElapsedTime(data?.today.elapsedSeconds || 0)}
                  </h4>
                </>
              ) : (
                <>
                  <p className="text-white/70 text-sm font-medium">You haven&apos;t started yet.</p>
                  <h4 className="text-3xl font-headline font-black tracking-tight scale-y-95">Ready to Punch In?</h4>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link 
                href="/staff/attendance" 
                className={cn(
                  "flex-1 py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                  isOnDuty ? "bg-white text-secondary" : "bg-white text-primary"
                )}
              >
                {isOnDuty ? <Timer className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                {isOnDuty ? 'Manage Shift' : 'Punch In Now'}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* High-Density Stat Grid: Highly Compact */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Hours', value: data?.monthly.totalHours.toFixed(1) || '0', icon: Clock, color: 'text-primary' },
          { label: 'Days Active', value: data?.monthly.presentDays || '0', icon: CalendarDays, color: 'text-secondary' },
          { label: 'Avg Shift', value: data?.monthly.averageHours.toFixed(1) || '0', icon: Hourglass, color: 'text-orange-500' },
          { label: 'Monthly Logs', value: data?.monthly.totalRecorded || '0', icon: ClipboardList, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-3.5 rounded-[1.5rem] border border-outline-variant/10 flex items-center gap-3 group transition-all hover:bg-surface-container-high shadow-sm">
            <div className={cn("w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-headline font-black text-on-surface tracking-tight leading-none mb-0.5">{stat.value}</p>
              <p className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Pulse & Status Feed */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-lg font-headline font-black tracking-tight text-on-surface">Recent Logs</h4>
          <Link href="/staff/history" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View All</Link>
        </div>
        
        <div className="bg-surface-container-low rounded-[2rem] p-2 space-y-1">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-outline uppercase tracking-widest">Loading Logs</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="bg-surface-container-lowest p-4 rounded-3xl flex items-center justify-between group decoration-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-on-surface">Yesterday</p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{branchName || 'Clinical Center'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-on-surface">8.5h</p>
                  <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">Completed</p>
                </div>
              </div>
              
              <div className="bg-transparent p-4 rounded-3xl flex items-center justify-between opacity-50 grayscale">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-outline/10 flex items-center justify-center text-outline">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-on-surface">Oct 12, 2026</p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Andheri Branch</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-on-surface">7.2h</p>
                  <p className="text-[8px] font-bold text-outline uppercase tracking-widest">Verified</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom Insights */}
      <motion.div variants={item} className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <TrendingUp className="w-8 h-8 text-primary/20" />
        </div>
        <h5 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">Goal Insight</h5>
        <p className="text-sm font-medium text-on-surface leading-relaxed opacity-80">
          You are <span className="text-primary font-black">20% ahead</span> of your average attendance this month. Keep this momentum to qualify for top-tier rewards.
        </p>
      </motion.div>
    </motion.div>
  );
}
